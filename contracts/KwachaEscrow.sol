// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * KwachaEscrow - P2P USDT escrow. Both buyer and seller pay a fee.
 *
 * Seller fee: charged on top of the trade amount when locking USDT.
 * Buyer fee: deducted from the trade amount on release.
 *
 * Example: 100 USDT trade, 0.4% each (40 bps)
 *   Seller deposits: 100.4 USDT (100 trade + 0.4 seller fee)
 *   Buyer receives:  99.6 USDT (100 trade - 0.4 buyer fee)
 *   Platform collects: 0.8 USDT total
 *   On cancel: seller gets full 100.4 back
 */
contract KwachaEscrow {
    IERC20 public immutable usdt;
    
    address public platformAdmin;
    address public feeWallet;
    uint256 public sellerFeeBps; // seller fee in basis points
    uint256 public buyerFeeBps;  // buyer fee in basis points
    
    enum Status { Nonexistent, Created, PaymentConfirmed, Released, Cancelled, Disputed }
    
    struct Escrow {
        address seller;
        address buyer;
        uint256 tradeAmount;    // the agreed trade amount
        uint256 sellerFee;      // fee charged to seller (on top)
        uint256 buyerFee;       // fee charged to buyer (deducted)
        uint256 totalLocked;    // tradeAmount + sellerFee (what seller deposited)
        Status status;
        uint256 createdAt;
    }
    
    mapping(bytes32 => Escrow) public escrows;
    
    event EscrowCreated(bytes32 indexed tradeId, address indexed seller, address indexed buyer, uint256 tradeAmount, uint256 sellerFee, uint256 buyerFee, uint256 totalLocked);
    event PaymentConfirmed(bytes32 indexed tradeId, address indexed buyer);
    event EscrowReleased(bytes32 indexed tradeId, address indexed buyer, uint256 amountToBuyer, uint256 totalFees);
    event EscrowCancelled(bytes32 indexed tradeId, address indexed seller, uint256 refundAmount);
    event DisputeRaised(bytes32 indexed tradeId, address indexed raisedBy);
    event DisputeResolved(bytes32 indexed tradeId, bool releasedToBuyer);
    event FeesUpdated(uint256 sellerBps, uint256 buyerBps);
    event AdminUpdated(address newAdmin);
    
    modifier onlyAdmin() { require(msg.sender == platformAdmin, "Not admin"); _; }
    modifier onlySeller(bytes32 tradeId) { require(escrows[tradeId].seller == msg.sender, "Not seller"); _; }
    modifier onlyBuyer(bytes32 tradeId) { require(escrows[tradeId].buyer == msg.sender, "Not buyer"); _; }
    modifier onlyParty(bytes32 tradeId) {
        require(escrows[tradeId].seller == msg.sender || escrows[tradeId].buyer == msg.sender, "Not a trade party");
        _;
    }
    
    constructor(
        address _usdtAddress,
        address _feeWallet,
        uint256 _sellerFeeBps,
        uint256 _buyerFeeBps
    ) {
        usdt = IERC20(_usdtAddress);
        feeWallet = _feeWallet;
        sellerFeeBps = _sellerFeeBps;
        buyerFeeBps = _buyerFeeBps;
        platformAdmin = msg.sender;
    }
    
    /**
     * @dev Seller creates escrow. Contract pulls tradeAmount + sellerFee from seller.
     * @param tradeId Unique trade identifier
     * @param buyer Buyer wallet address
     * @param tradeAmount USDT the trade is for (buyer receives tradeAmount - buyerFee)
     */
    function createEscrow(
        bytes32 tradeId,
        address buyer,
        uint256 tradeAmount
    ) external {
        require(escrows[tradeId].status == Status.Nonexistent, "Trade already exists");
        require(buyer != address(0), "Invalid buyer address");
        require(tradeAmount > 0, "Amount must be positive");
        
        uint256 sFee = (tradeAmount * sellerFeeBps) / 10000;
        uint256 bFee = (tradeAmount * buyerFeeBps) / 10000;
        uint256 totalLocked = tradeAmount + sFee;
        
        require(usdt.transferFrom(msg.sender, address(this), totalLocked), "USDT transfer failed - check approval and balance");
        
        escrows[tradeId] = Escrow({
            seller: msg.sender,
            buyer: buyer,
            tradeAmount: tradeAmount,
            sellerFee: sFee,
            buyerFee: bFee,
            totalLocked: totalLocked,
            status: Status.Created,
            createdAt: block.timestamp
        });
        
        emit EscrowCreated(tradeId, msg.sender, buyer, tradeAmount, sFee, bFee, totalLocked);
    }
    
    function confirmPayment(bytes32 tradeId) external onlyBuyer(tradeId) {
        require(escrows[tradeId].status == Status.Created, "Trade not in Created state");
        escrows[tradeId].status = Status.PaymentConfirmed;
        emit PaymentConfirmed(tradeId, msg.sender);
    }
    
    /**
     * @dev Seller releases. Buyer gets tradeAmount - buyerFee. Platform gets sellerFee + buyerFee.
     */
    function releaseFunds(bytes32 tradeId) external onlySeller(tradeId) {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.PaymentConfirmed, "Payment not confirmed yet");
        
        e.status = Status.Released;
        
        uint256 buyerReceives = e.tradeAmount - e.buyerFee;
        uint256 totalFees = e.sellerFee + e.buyerFee;
        
        // Buyer receives trade amount minus their fee
        require(usdt.transfer(e.buyer, buyerReceives), "Buyer transfer failed");
        
        // Platform collects both fees
        if (totalFees > 0) {
            require(usdt.transfer(feeWallet, totalFees), "Fee transfer failed");
        }
        
        emit EscrowReleased(tradeId, e.buyer, buyerReceives, totalFees);
    }
    
    function cancelTrade(bytes32 tradeId) external onlyParty(tradeId) {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.Created, "Can only cancel before payment");
        
        e.status = Status.Cancelled;
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
     * @param releaseToBuyer true = buyer gets tradeAmount - buyerFee, platform gets both fees
     *                       false = seller gets full refund (totalLocked), no fees collected
     */
    function resolveDispute(bytes32 tradeId, bool releaseToBuyer) external onlyAdmin {
        Escrow storage e = escrows[tradeId];
        require(e.status == Status.Disputed, "Trade not disputed");
        
        e.status = Status.Released;
        
        if (releaseToBuyer) {
            uint256 buyerReceives = e.tradeAmount - e.buyerFee;
            uint256 totalFees = e.sellerFee + e.buyerFee;
            require(usdt.transfer(e.buyer, buyerReceives), "Buyer transfer failed");
            if (totalFees > 0) {
                require(usdt.transfer(feeWallet, totalFees), "Fee transfer failed");
            }
        } else {
            require(usdt.transfer(e.seller, e.totalLocked), "Refund failed");
        }
        
        emit DisputeResolved(tradeId, releaseToBuyer);
    }
    
    function getEscrow(bytes32 tradeId) external view returns (
        address seller, address buyer,
        uint256 tradeAmount, uint256 sellerFee, uint256 buyerFee, uint256 totalLocked,
        Status status, uint256 createdAt
    ) {
        Escrow storage e = escrows[tradeId];
        return (e.seller, e.buyer, e.tradeAmount, e.sellerFee, e.buyerFee, e.totalLocked, e.status, e.createdAt);
    }
    
    function setFees(uint256 _sellerBps, uint256 _buyerBps) external onlyAdmin {
        require(_sellerBps <= 500 && _buyerBps <= 500, "Fees cannot exceed 5% each");
        sellerFeeBps = _sellerBps;
        buyerFeeBps = _buyerBps;
        emit FeesUpdated(_sellerBps, _buyerBps);
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
