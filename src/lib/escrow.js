import { ethers } from 'ethers'
import { toast } from 'sonner'

const USDT_ADDRESSES = {
  bsc: '0x55d398326f99059fF775485246999027B3197955',
  trc20: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
}

const ESCROW_ABI = [
  'function createEscrow(bytes32 tradeId, address buyer, uint256 tradeAmount) external',
  'function confirmPayment(bytes32 tradeId) external',
  'function releaseFunds(bytes32 tradeId) external',
  'function cancelTrade(bytes32 tradeId) external',
  'function raiseDispute(bytes32 tradeId) external',
  'function resolveDispute(bytes32 tradeId, bool releaseToBuyer) external',
  'function getEscrow(bytes32 tradeId) view returns (address seller, address buyer, uint256 tradeAmount, uint256 sellerFee, uint256 buyerFee, uint256 totalLocked, uint8 status, uint256 createdAt)',
  'function sellerFeeBps() view returns (uint256)',
  'function buyerFeeBps() view returns (uint256)',
  'event EscrowCreated(bytes32 indexed tradeId, address indexed seller, address indexed buyer, uint256 tradeAmount, uint256 sellerFee, uint256 buyerFee, uint256 totalLocked)',
  'event PaymentConfirmed(bytes32 indexed tradeId, address indexed buyer)',
  'event EscrowReleased(bytes32 indexed tradeId, address indexed buyer, uint256 amountToBuyer, uint256 totalFees)',
  'event EscrowCancelled(bytes32 indexed tradeId, address indexed seller, uint256 refundAmount)',
  'event DisputeRaised(bytes32 indexed tradeId, address indexed raisedBy)',
  'event DisputeResolved(bytes32 indexed tradeId, bool releasedToBuyer)',
]

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

// Fee configuration: 1.0% each, 2.0% total
const SELLER_FEE_BPS = 100 // 1.0%
const BUYER_FEE_BPS = 100  // 1.0%
const TOTAL_FEE_BPS = SELLER_FEE_BPS + BUYER_FEE_BPS // 2.0%

const ESCROW_CONTRACTS = {
  bsc: import.meta.env.VITE_ESCROW_CONTRACT_BSC || '',
  trc20: import.meta.env.VITE_ESCROW_CONTRACT_TRC20 || '',
}

const BSC_RPC = import.meta.env.VITE_BSC_RPC || 'https://bsc-dataseed.binance.org'

export function tradeIdToBytes32(tradeId) {
  return ethers.id(tradeId)
}

// Calculate fees for both parties
export function calculateFees(tradeAmount) {
  const sellerFee = tradeAmount * (SELLER_FEE_BPS / 10000)
  const buyerFee = tradeAmount * (BUYER_FEE_BPS / 10000)
  const totalFees = sellerFee + buyerFee
  const sellerDeposit = tradeAmount + sellerFee  // what seller locks
  const buyerReceives = tradeAmount - buyerFee   // what buyer gets
  return { sellerFee, buyerFee, totalFees, sellerDeposit, buyerReceives }
}

// Keep backward-compat name
export function calculateSellerCost(tradeAmount) {
  return calculateFees(tradeAmount)
}

// --- BSC ---

export function getBscSigner() {
  if (!window.ethereum) throw new Error('MetaMask not found. Install MetaMask to use BSC.')
  const provider = new ethers.BrowserProvider(window.ethereum)
  return provider.getSigner()
}

export function getBscContract(signerOrProvider) {
  if (!ESCROW_CONTRACTS.bsc) throw new Error('BSC escrow contract not configured')
  return new ethers.Contract(ESCROW_CONTRACTS.bsc, ESCROW_ABI, signerOrProvider)
}

export function getBscUsdtContract(signer) {
  return new ethers.Contract(USDT_ADDRESSES.bsc, ERC20_ABI, signer)
}

export async function bscCreateEscrow(tradeId, buyerAddress, tradeAmount) {
  const signer = await getBscSigner()
  const usdt = getBscUsdtContract(signer)
  const contract = getBscContract(signer)
  
  const decimals = await usdt.decimals()
  const { sellerDeposit } = calculateFees(tradeAmount)
  const depositWei = ethers.parseUnits(String(sellerDeposit), decimals)
  const tradeIdHash = tradeIdToBytes32(tradeId)
  
  const allowance = await usdt.allowance(await signer.getAddress(), ESCROW_CONTRACTS.bsc)
  if (allowance < depositWei) {
    toast.info('Approving USDT (trade amount + seller fee)...')
    const approveTx = await usdt.approve(ESCROW_CONTRACTS.bsc, depositWei)
    await approveTx.wait()
  }
  
  toast.info('Locking USDT in escrow...')
  const tx = await contract.createEscrow(tradeIdHash, buyerAddress, ethers.parseUnits(String(tradeAmount), decimals))
  const receipt = await tx.wait()
  
  return { txHash: receipt.hash, network: 'bsc', totalLocked: sellerDeposit }
}

export async function bscConfirmPayment(tradeId) {
  const signer = await getBscSigner()
  const contract = getBscContract(signer)
  const tx = await contract.confirmPayment(tradeIdToBytes32(tradeId))
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

export async function bscReleaseFunds(tradeId) {
  const signer = await getBscSigner()
  const contract = getBscContract(signer)
  const tx = await contract.releaseFunds(tradeIdToBytes32(tradeId))
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

export async function bscCancelTrade(tradeId) {
  const signer = await getBscSigner()
  const contract = getBscContract(signer)
  const tx = await contract.cancelTrade(tradeIdToBytes32(tradeId))
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

export async function bscRaiseDispute(tradeId) {
  const signer = await getBscSigner()
  const contract = getBscContract(signer)
  const tx = await contract.raiseDispute(tradeIdToBytes32(tradeId))
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

// --- TRC20 ---

export function getTronWeb() {
  if (!window.tronWeb) throw new Error('TronLink not found. Install TronLink to use TRC20.')
  return window.tronWeb
}

export function getTrc20Contract() {
  if (!ESCROW_CONTRACTS.trc20) throw new Error('TRC20 escrow contract not configured')
  const tronWeb = getTronWeb()
  return tronWeb.contract(ESCROW_ABI, ESCROW_CONTRACTS.trc20)
}

export async function trc20CreateEscrow(tradeId, buyerAddress, tradeAmount) {
  const tronWeb = getTronWeb()
  const usdtContract = await tronWeb.contract(ERC20_ABI, USDT_ADDRESSES.trc20)
  const escrowContract = await getTrc20Contract()
  
  const { sellerDeposit } = calculateFees(tradeAmount)
  const depositSun = tronWeb.toSun(String(sellerDeposit))
  const tradeIdHash = tradeIdToBytes32(tradeId)
  
  const allowance = await usdtContract.allowance(tronWeb.defaultAddress, ESCROW_CONTRACTS.trc20).call()
  if (parseInt(allowance) < parseInt(depositSun)) {
    toast.info('Approving USDT (trade amount + seller fee)...')
    await usdtContract.approve(ESCROW_CONTRACTS.trc20, depositSun).send()
  }
  
  toast.info('Locking USDT in escrow...')
  const tx = await escrowContract.createEscrow(tradeIdHash, buyerAddress, tronWeb.toSun(String(tradeAmount))).send()
  
  return { txHash: tx, network: 'trc20', totalLocked: sellerDeposit }
}

export async function trc20ConfirmPayment(tradeId) {
  const contract = await getTrc20Contract()
  const tx = await contract.confirmPayment(tradeIdToBytes32(tradeId)).send()
  return { txHash: tx }
}

export async function trc20ReleaseFunds(tradeId) {
  const contract = await getTrc20Contract()
  const tx = await contract.releaseFunds(tradeIdToBytes32(tradeId)).send()
  return { txHash: tx }
}

export async function trc20CancelTrade(tradeId) {
  const contract = await getTrc20Contract()
  const tx = await contract.cancelTrade(tradeIdToBytes32(tradeId)).send()
  return { txHash: tx }
}

export async function trc20RaiseDispute(tradeId) {
  const contract = await getTrc20Contract()
  const tx = await contract.raiseDispute(tradeIdToBytes32(tradeId)).send()
  return { txHash: tx }
}

// --- Unified API ---

export async function createEscrow(network, tradeId, buyerAddress, tradeAmount) {
  if (network === 'trc20') return trc20CreateEscrow(tradeId, buyerAddress, tradeAmount)
  return bscCreateEscrow(tradeId, buyerAddress, tradeAmount)
}

export async function confirmPayment(network, tradeId) {
  if (network === 'trc20') return trc20ConfirmPayment(tradeId)
  return bscConfirmPayment(tradeId)
}

export async function releaseFunds(network, tradeId) {
  if (network === 'trc20') return trc20ReleaseFunds(tradeId)
  return bscReleaseFunds(tradeId)
}

export async function cancelTrade(network, tradeId) {
  if (network === 'trc20') return trc20CancelTrade(tradeId)
  return bscCancelTrade(tradeId)
}

export async function raiseDispute(network, tradeId) {
  if (network === 'trc20') return trc20RaiseDispute(tradeId)
  return bscRaiseDispute(tradeId)
}

// --- Wallet connection ---

export async function connectBscWallet() {
  if (!window.ethereum) throw new Error('MetaMask not found. Install MetaMask browser extension.')
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] })
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{ chainId: '0x38', chainName: 'BSC Mainnet', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: [BSC_RPC], blockExplorerUrls: ['https://bscscan.com'] }],
      })
    }
  }
  return { address: accounts[0], network: 'bsc' }
}

export async function connectTrc20Wallet() {
  if (!window.tronWeb) throw new Error('TronLink not found. Install TronLink browser extension.')
  if (!window.tronWeb.defaultAddress) throw new Error('Please unlock TronLink and connect to the site')
  return { address: window.tronWeb.defaultAddress.base58, network: 'trc20' }
}

export function isWalletAvailable(network) {
  if (network === 'trc20') return !!window.tronWeb
  return !!window.ethereum
}

export function getWalletAddress(network) {
  if (network === 'trc20' && window.tronWeb) return window.tronWeb.defaultAddress?.base58 || null
  if (network === 'bsc' && window.ethereum) return window.ethereum.selectedAddress || null
  return null
}
