import { ethers } from 'ethers'
import { toast } from 'sonner'

// USDT contract addresses
const USDT_ADDRESSES = {
  bsc: '0x55d398326f99059fF775485246999027B3197955',
  trc20: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
}

// Escrow contract ABI (simplified - only what frontend needs)
const ESCROW_ABI = [
  'function createEscrow(bytes32 tradeId, address buyer, uint256 amount) external',
  'function confirmPayment(bytes32 tradeId) external',
  'function releaseFunds(bytes32 tradeId) external',
  'function cancelTrade(bytes32 tradeId) external',
  'function raiseDispute(bytes32 tradeId) external',
  'function resolveDispute(bytes32 tradeId, bool releaseToBuyer) external',
  'function getEscrow(bytes32 tradeId) view returns (address seller, address buyer, uint256 amount, uint256 feeAmount, uint8 status, uint256 createdAt)',
  'function feeBps() view returns (uint256)',
  'event EscrowCreated(bytes32 indexed tradeId, address indexed seller, address indexed buyer, uint256 amount, uint256 feeAmount)',
  'event PaymentConfirmed(bytes32 indexed tradeId, address indexed buyer)',
  'event EscrowReleased(bytes32 indexed tradeId, address indexed buyer, uint256 amountReleased, uint256 feeAmount)',
  'event EscrowCancelled(bytes32 indexed tradeId, address indexed seller, uint256 refundAmount)',
  'event DisputeRaised(bytes32 indexed tradeId, address indexed raisedBy)',
  'event DisputeResolved(bytes32 indexed tradeId, bool releasedToBuyer)',
]

// ERC20 ABI for approve
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

// Config from env vars
const ESCROW_CONTRACTS = {
  bsc: import.meta.env.VITE_ESCROW_CONTRACT_BSC || '',
  trc20: import.meta.env.VITE_ESCROW_CONTRACT_TRC20 || '',
}

const BSC_RPC = import.meta.env.VITE_BSC_RPC || 'https://bsc-dataseed.binance.org'

// Convert trade ID string to bytes32
export function tradeIdToBytes32(tradeId) {
  return ethers.id(tradeId)
}

// Get BSC provider and signer
export function getBscSigner() {
  if (!window.ethereum) throw new Error('MetaMask not found. Install MetaMask to use BSC.')
  const provider = new ethers.BrowserProvider(window.ethereum)
  return provider.getSigner()
}

// Get BSC contract instance
export function getBscContract(signerOrProvider) {
  if (!ESCROW_CONTRACTS.bsc) throw new Error('BSC escrow contract not configured')
  return new ethers.Contract(ESCROW_CONTRACTS.bsc, ESCROW_ABI, signerOrProvider)
}

// Get USDT contract for BSC
export function getBscUsdtContract(signer) {
  return new ethers.Contract(USDT_ADDRESSES.bsc, ERC20_ABI, signer)
}

// Get TronWeb instance
export function getTronWeb() {
  if (!window.tronWeb) throw new Error('TronLink not found. Install TronLink to use TRC20.')
  return window.tronWeb
}

// Get TRC20 escrow contract
export function getTrc20Contract() {
  if (!ESCROW_CONTRACTS.trc20) throw new Error('TRC20 escrow contract not configured')
  const tronWeb = getTronWeb()
  return tronWeb.contract(ESCROW_ABI, ESCROW_CONTRACTS.trc20)
}

// --- BSC Operations ---

export async function bscCreateEscrow(tradeId, buyerAddress, amountUsdt) {
  const signer = await getBscSigner()
  const usdt = getBscUsdtContract(signer)
  const contract = getBscContract(signer)
  
  const decimals = await usdt.decimals()
  const amount = ethers.parseUnits(String(amountUsdt), decimals)
  const tradeIdHash = tradeIdToBytes32(tradeId)
  
  // Check allowance and approve if needed
  const allowance = await usdt.allowance(await signer.getAddress(), ESCROW_CONTRACTS.bsc)
  if (allowance < amount) {
    toast.info('Approving USDT for escrow...')
    const approveTx = await usdt.approve(ESCROW_CONTRACTS.bsc, amount)
    await approveTx.wait()
  }
  
  // Create escrow
  toast.info('Locking USDT in escrow...')
  const tx = await contract.createEscrow(tradeIdHash, buyerAddress, amount)
  const receipt = await tx.wait()
  
  return { txHash: receipt.hash, network: 'bsc' }
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

export async function bscGetEscrow(tradeId) {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const contract = getBscContract(provider)
  const result = await contract.getEscrow(tradeIdToBytes32(tradeId))
  return {
    seller: result[0],
    buyer: result[1],
    amount: ethers.formatUnits(result[2], 18),
    feeAmount: ethers.formatUnits(result[3], 18),
    status: Number(result[4]),
    createdAt: Number(result[5]),
  }
}

// --- TRC20 Operations ---

export async function trc20CreateEscrow(tradeId, buyerAddress, amountUsdt) {
  const tronWeb = getTronWeb()
  const usdtContract = await tronWeb.contract(ERC20_ABI, USDT_ADDRESSES.trc20)
  const escrowContract = await getTrc20Contract()
  
  const amount = tronWeb.toSun(String(amountUsdt))
  const tradeIdHash = tradeIdToBytes32(tradeId)
  
  // Check allowance and approve
  const allowance = await usdtContract.allowance(tronWeb.defaultAddress, ESCROW_CONTRACTS.trc20).call()
  if (parseInt(allowance) < parseInt(amount)) {
    toast.info('Approving USDT for escrow...')
    const approveTx = await usdtContract.approve(ESCROW_CONTRACTS.trc20, amount).send()
  }
  
  // Create escrow
  toast.info('Locking USDT in escrow...')
  const tx = await escrowContract.createEscrow(tradeIdHash, buyerAddress, amount).send()
  
  return { txHash: tx, network: 'trc20' }
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

export async function trc20GetEscrow(tradeId) {
  const contract = await getTrc20Contract()
  const result = await contract.getEscrow(tradeIdToBytes32(tradeId)).call()
  return {
    seller: result.seller,
    buyer: result.buyer,
    amount: tronWeb.fromSun(result.amount),
    feeAmount: tronWeb.fromSun(result.feeAmount),
    status: Number(result.status),
    createdAt: Number(result.createdAt),
  }
}

// --- Unified API (network-aware) ---

export async function createEscrow(network, tradeId, buyerAddress, amountUsdt) {
  if (network === 'trc20') return trc20CreateEscrow(tradeId, buyerAddress, amountUsdt)
  return bscCreateEscrow(tradeId, buyerAddress, amountUsdt)
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

export async function getEscrowStatus(network, tradeId) {
  if (network === 'trc20') return trc20GetEscrow(tradeId)
  return bscGetEscrow(tradeId)
}

// Wallet connection helpers

export async function connectBscWallet() {
  if (!window.ethereum) throw new Error('MetaMask not found. Install MetaMask browser extension.')
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  
  // Switch to BSC mainnet if needed
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }], // BSC mainnet
    })
  } catch (switchError) {
    // Chain not added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x38',
          chainName: 'BSC Mainnet',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: [BSC_RPC],
          blockExplorerUrls: ['https://bscscan.com'],
        }],
      })
    }
  }
  
  return { address: accounts[0], network: 'bsc' }
}

export async function connectTrc20Wallet() {
  if (!window.tronWeb) throw new Error('TronLink not found. Install TronLink browser extension.')
  // TronLink auto-connects; just need to get the address
  if (!window.tronWeb.defaultAddress) {
    throw new Error('Please unlock TronLink and connect to the site')
  }
  return { address: window.tronWeb.defaultAddress.base58, network: 'trc20' }
}

export function isWalletAvailable(network) {
  if (network === 'trc20') return !!window.tronWeb
  return !!window.ethereum
}

export function getWalletAddress(network) {
  if (network === 'trc20' && window.tronWeb) {
    return window.tronWeb.defaultAddress?.base58 || null
  }
  if (network === 'bsc' && window.ethereum) {
    return window.ethereum.selectedAddress || null
  }
  return null
}

