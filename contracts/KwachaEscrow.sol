// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * KwachaEscrow - P2P USDT escrow for Kwacha Escrow platform
 * 
 * Flow:
 * 1. Seller creates escrow with tradeId, buyer address, USDT amount
 *    -> USDT transferred from seller to this contract
 * 2. Buyer confirms fiat payment sent (off-chain: mobile money, bank, cash)
 * 3. Seller confirms fiat received -> releases USDT to buyer
 *    -> Platform fee sent to fee wallet, rest to buyer
 * 4. Either party can cancel before payment confirmation
 *    -> USDT returned to seller
 * 5. Admin can resolve disputes -> release to buyer or refund to seller
 */
contract KwachaEscrow {
    IERC20 public immutable usdt;
    
    address public platformAdmin;
    address public feeWallet;
    uint256 public feeBps; // fee in basis points (100 = 1%)
    
    enum Status {
        Nonexistent,
        Created,
        PaymentConfirmed,
        Released,
        Cancelled,
        Disputed
    }
    
    struct Escrow {
        address seller;
        address buyer;
        uint256 amount;       // total USDT locked
        uint256 feeAmount;     // platform fee
        Status status;
        uint256 createdAt;
    }
    
    mapping(bytes32 => Escrow) public escrows;
    
    // Events for off-chain indexing
    event EscrowCreated(bytes32 indexed tradeId, address indexed seller, address indexed buyer, uint256 amount, uint256 feeAmount);
    event PaymentConfirmed(bytes32 indexed tradeId, address indexed buyer);
    event EscrowReleased(bytes32 indexed tradeId, address indexed buyer, uint256 amountReleased, uint256 feeAmount);
    event EscrowCancelled(bytes32 indexed tradeId, address indexed seller, uint256 refundAmount);
    event DisputeRaised(bytes32 indexed tradeId, address indexed raisedBy);
    event DisputeResolved(bytes32 indexed tradeId, bool releasedToBuyer);
    event FeeUpdated(uint256 newBps);
    event AdminUpdated(address newAdmin);
    
    modifier onlyAdmin() {
        require(msg.sender == platformAdmin, "Not admin");
        _;
    }
    
    modifier onlySeller(bytes32 tradeId) {
        require(escrows[tradeId].seller == msg.sender, "Not seller");
        _;
    }
    
    modifier onlyBuyer(bytes32 tradeId) {
        require(escrows[tradeId].buyer == msg.sender, "Not buyer");
        _;
    }
    
    modifier onlyParty(bytes32 tradeId) {
        require(
            escrows[tradeId].seller == msg.sender || escrows[tradeId].buyer == msg.sender,
            "Not a trade party"
        );
        _;
    }
    
    constructor(address _usdtAddress, address _feeWallet, uint256 _feeBps) {
        usdt = IERC20(_usdtAddress);
        feeWallet = _feeWallet;
        feeBps = _feeBps;
        platformAdmin = msg.sender;
    }
    
    /**
     * @dev Seller creates escrow. USDT is transferred from seller to this contract.
     * @param tradeId Unique trade identifier (keccak256 of off-chain trade ID)
     * @param buyer Buyer wallet address
     * @param amount USDT amount in smallest unit (handle decimals off-chain)
     */
    function createEscrow(
        bytes32 tradeId,
        address buyer,
        uint256 amount
    ) external {
        require(escrows[tradeId].status == Status.Nonexistent, "Trade already exists");
        require(buyer != address(0), "Invalid buyer address");
        require(amount > 0, "Amount must be positive");
        
        uint256 feeAmount = (amount * feeBps) / 10000;
        
        // Transfer USDT from seller to this contract
        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed - check approval"
        );
        
        escrows[tradeId] = Escrow({
            seller: msg.sender,
            buyer: buyer,
            amount: amount,
            feeAmount: feeAmount,
            status: Status.Created,
            createdAt: block.timestamp
        });
        
        emit EscrowCreated(tradeId, msg.sender, buyer, amount, feeAmount);
    }
    
    /**
     * @dev Buyer confirms they sent fiat payment to seller (off-chain)
     */
    function confirmPayment(bytes32 tradeId) external onlyBuyer(tradeId) {
        require(escrows[tradeId].status == Status.Created, "Trade not in Created state");
        
        escrows[tradeId].status = Status.PaymentConfirmed;
        emit PaymentConfirmed(tradeId, msg.sender);
    }
    
    /**
     * @dev Seller confirms fiat received, releases USDT to buyer
     */
    function releaseFunds(bytes32 tradeId) external onlySeller(tradeId) {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.PaymentConfirmed, "Payment not confirmed yet");
        
        e.status = Status.Released;
        
        uint256 buyerAmount = e.amount - e.feeAmount;
        
        // Send fee to platform wallet
        if (e.feeAmount > 0) {
            require(usdt.transfer(feeWallet, e.feeAmount), "Fee transfer failed");
        }
        
        // Send remainder to buyer
        require(usdt.transfer(e.buyer, buyerAmount), "Buyer transfer failed");
        
        emit EscrowReleased(tradeId, e.buyer, buyerAmount, e.feeAmount);
    }
    
    /**
     * @dev Either party cancels trade before payment confirmation
     */
    function cancelTrade(bytes32 tradeId) external onlyParty(tradeId) {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.Created, "Can only cancel before payment");
        
        e.status = Status.Cancelled;
        
        // Return USDT to seller
        require(usdt.transfer(e.seller, e.amount), "Refund failed");
        
        emit EscrowCancelled(tradeId, e.seller, e.amount);
    }
    
    /**
     * @dev Either party raises a dispute
     */
    function raiseDispute(bytes32 tradeId) external onlyParty(tradeId) {
        Escrow storage e = escrows[tradeId];
        require(
            e.status == Status.Created || e.status == Status.PaymentConfirmed,
            "Cannot dispute in current state"
        );
        
        e.status = Status.Disputed;
        emit DisputeRaised(tradeId, msg.sender);
    }
    
    /**
     * @dev Admin resolves dispute
     * @param releaseToBuyer true = send USDT to buyer, false = refund to seller
     */
    function resolveDispute(bytes32 tradeId, bool releaseToBuyer) external onlyAdmin {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.Disputed, "Trade not disputed");
        
        e.status = Status.Released;
        
        if (releaseToBuyer) {
            uint256 buyerAmount = e.amount - e.feeAmount;
            if (e.feeAmount > 0) {
                require(usdt.transfer(feeWallet, e.feeAmount), "Fee transfer failed");
            }
            require(usdt.transfer(e.buyer, buyerAmount), "Buyer transfer failed");
        } else {
            // Refund to seller, no fee
            require(usdt.transfer(e.seller, e.amount), "Refund failed");
        }
        
        emit DisputeResolved(tradeId, releaseToBuyer);
    }
    
    /**
     * @dev Get escrow details
     */
    function getEscrow(bytes32 tradeId) external view returns (
        address seller,
        address buyer,
        uint256 amount,
        uint256 feeAmount,
        Status status,
        uint256 createdAt
    ) {
        Escrow storage e = escrows[tradeId];
        return (e.seller, e.buyer, e.amount, e.feeAmount, e.status, e.createdAt);
    }
    
    /**
     * @dev Update fee (admin only)
     */
    function setFee(uint256 newBps) external onlyAdmin {
        require(newBps <= 500, "Fee cannot exceed 5%");
        feeBps = newBps;
        emit FeeUpdated(newBps);
    }
    
    /**
     * @dev Update admin (admin only)
     */
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        platformAdmin = newAdmin;
        emit AdminUpdated(newAdmin);
    }
    
    /**
     * @dev Update fee wallet (admin only)
     */
    function setFeeWallet(address newWallet) external onlyAdmin {
        require(newWallet != address(0), "Invalid address");
        feeWallet = newWallet;
    }
}
