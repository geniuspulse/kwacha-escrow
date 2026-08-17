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
 * Seller pays the escrow fee. Buyer receives the full trade amount.
 *
 * Flow:
 * 1. Seller creates escrow with tradeId, buyer address, trade amount
 *    -> Contract pulls tradeAmount + feeAmount from seller
 * 2. Buyer confirms fiat payment sent (off-chain)
 * 3. Seller confirms fiat received -> releases
 *    -> Buyer receives full tradeAmount, platform receives feeAmount
 * 4. Cancel before payment -> seller gets full deposit back (amount + fee)
 * 5. Admin resolves disputes
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
        uint256 tradeAmount;   // what buyer receives
        uint256 feeAmount;      // platform fee (paid by seller)
        uint256 totalLocked;    // tradeAmount + feeAmount (what seller deposited)
        Status status;
        uint256 createdAt;
    }
    
    mapping(bytes32 => Escrow) public escrows;
    
    event EscrowCreated(bytes32 indexed tradeId, address indexed seller, address indexed buyer, uint256 tradeAmount, uint256 feeAmount, uint256 totalLocked);
    event PaymentConfirmed(bytes32 indexed tradeId, address indexed buyer);
    event EscrowReleased(bytes32 indexed tradeId, address indexed buyer, uint256 amountToBuyer, uint256 feeAmount);
    event EscrowCancelled(bytes32 indexed tradeId, address indexed seller, uint256 refundAmount);
    event DisputeRaised(bytes32 indexed tradeId, address indexed raisedBy);
    event DisputeResolved(bytes32 indexed tradeId, bool releasedToBuyer);
    event FeeUpdated(uint256 newBps);
    event AdminUpdated(address newAdmin);
    
    modifier onlyAdmin() { require(msg.sender == platformAdmin, "Not admin"); _; }
    modifier onlySeller(bytes32 tradeId) { require(escrows[tradeId].seller == msg.sender, "Not seller"); _; }
    modifier onlyBuyer(bytes32 tradeId) { require(escrows[tradeId].buyer == msg.sender, "Not buyer"); _; }
    modifier onlyParty(bytes32 tradeId) {
        require(escrows[tradeId].seller == msg.sender || escrows[tradeId].buyer == msg.sender, "Not a trade party");
        _;
    }
    
    constructor(address _usdtAddress, address _feeWallet, uint256 _feeBps) {
        usdt = IERC20(_usdtAddress);
        feeWallet = _feeWallet;
        feeBps = _feeBps;
        platformAdmin = msg.sender;
    }
    
    /**
     * @dev Seller creates escrow. Contract pulls tradeAmount + fee from seller.
     * @param tradeId Unique trade identifier
     * @param buyer Buyer wallet address
     * @param tradeAmount USDT the buyer will receive (seller pays fee on top)
     */
    function createEscrow(
        bytes32 tradeId,
        address buyer,
        uint256 tradeAmount
    ) external {
        require(escrows[tradeId].status == Status.Nonexistent, "Trade already exists");
        require(buyer != address(0), "Invalid buyer address");
        require(tradeAmount > 0, "Amount must be positive");
        
        uint256 feeAmount = (tradeAmount * feeBps) / 10000;
        uint256 totalLocked = tradeAmount + feeAmount;
        
        // Pull trade amount + fee from seller
        require(
            usdt.transferFrom(msg.sender, address(this), totalLocked),
            "USDT transfer failed - check approval and balance"
        );
        
        escrows[tradeId] = Escrow({
            seller: msg.sender,
            buyer: buyer,
            tradeAmount: tradeAmount,
            feeAmount: feeAmount,
            totalLocked: totalLocked,
            status: Status.Created,
            createdAt: block.timestamp
        });
        
        emit EscrowCreated(tradeId, msg.sender, buyer, tradeAmount, feeAmount, totalLocked);
    }
    
    function confirmPayment(bytes32 tradeId) external onlyBuyer(tradeId) {
        require(escrows[tradeId].status == Status.Created, "Trade not in Created state");
        escrows[tradeId].status = Status.PaymentConfirmed;
        emit PaymentConfirmed(tradeId, msg.sender);
    }
    
    function releaseFunds(bytes32 tradeId) external onlySeller(tradeId) {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.PaymentConfirmed, "Payment not confirmed yet");
        
        e.status = Status.Released;
        
        // Buyer receives full trade amount
        require(usdt.transfer(e.buyer, e.tradeAmount), "Buyer transfer failed");
        
        // Platform receives fee
        if (e.feeAmount > 0) {
            require(usdt.transfer(feeWallet, e.feeAmount), "Fee transfer failed");
        }
        
        emit EscrowReleased(tradeId, e.buyer, e.tradeAmount, e.feeAmount);
    }
    
    function cancelTrade(bytes32 tradeId) external onlyParty(tradeId) {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.Created, "Can only cancel before payment");
        
        e.status = Status.Cancelled;
        
        // Return full deposit to seller (trade amount + fee)
        require(usdt.transfer(e.seller, e.totalLocked), "Refund failed");
        
        emit EscrowCancelled(tradeId, e.seller, e.totalLocked);
    }
    
    function raiseDispute(bytes32 tradeId) external onlyParty(tradeId) {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.Created || e.status == Status.PaymentConfirmed, "Cannot dispute");
        e.status = Status.Disputed;
        emit DisputeRaised(tradeId, msg.sender);
    }
    
    /**
     * @dev Admin resolves dispute
     * @param releaseToBuyer true = buyer gets tradeAmount, platform gets fee
     *                       false = seller gets full refund (amount + fee)
     */
    function resolveDispute(bytes32 tradeId, bool releaseToBuyer) external onlyAdmin {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.Disputed, "Trade not disputed");
        
        e.status = Status.Released;
        
        if (releaseToBuyer) {
            require(usdt.transfer(e.buyer, e.tradeAmount), "Buyer transfer failed");
            if (e.feeAmount > 0) {
                require(usdt.transfer(feeWallet, e.feeAmount), "Fee transfer failed");
            }
        } else {
            require(usdt.transfer(e.seller, e.totalLocked), "Refund failed");
        }
        
        emit DisputeResolved(tradeId, releaseToBuyer);
    }
    
    function getEscrow(bytes32 tradeId) external view returns (
        address seller, address buyer,
        uint256 tradeAmount, uint256 feeAmount, uint256 totalLocked,
        Status status, uint256 createdAt
    ) {
        Escrow storage e = escrows[tradeId];
        return (e.seller, e.buyer, e.tradeAmount, e.feeAmount, e.totalLocked, e.status, e.createdAt);
    }
    
    function setFee(uint256 newBps) external onlyAdmin {
        require(newBps <= 500, "Fee cannot exceed 5%");
        feeBps = newBps;
        emit FeeUpdated(newBps);
    }
    
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        platformAdmin = newAdmin;
        emit AdminUpdated(newAdmin);
    }
    
    function setFeeWallet(address newWallet) external onlyAdmin {
        require(newWallet != address(0), "Invalid address");
        feeWallet = newWallet;
    }
}
