import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useWallet } from '@/context/WalletContext'
import { db } from '@/api/supabaseClient'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { formatUSDT, formatMWK, timeAgo, truncateAddress } from '@/lib/utils'
import * as escrow from '@/lib/escrow'
import { Shield, AlertCircle, CheckCircle, Clock, ArrowLeft, Copy, Link2, ExternalLink } from 'lucide-react'

const STATUS_STEPS = ['created', 'escrow_pending', 'payment_pending', 'payment_sent', 'confirming', 'completed']
const STATUS_LABELS = {
  created: 'Trade Created',
  escrow_pending: 'Awaiting Escrow Deposit',
  payment_pending: 'Awaiting Payment',
  payment_sent: 'Payment Sent',
  confirming: 'Confirming',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
}

const CHAIN_INFO = {
  bsc: { name: 'BSC', explorer: 'https://bscscan.com/tx/' },
  trc20: { name: 'Tron', explorer: 'https://tronscan.org/#/transaction/' },
}

export default function TradeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { getWalletForNetwork } = useWallet()
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadTrade()
  }, [id])

  const loadTrade = async () => {
    try {
      const t = await db.entities.Trade.get(id)
      setTrade(t)
    } catch (e) {
      console.error('Failed to load trade:', e)
    }
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading trade...</div>
  if (!trade) return (
    <div className="text-center py-20 px-4">
      <p className="text-muted-foreground mb-4">Trade not found.</p>
      <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
    </div>
  )

  const isSeller = trade.seller_id === user?.id
  const isBuyer = trade.buyer_id === user?.id
  const counterparty = isSeller ? trade.buyer : trade.seller
  const currentStep = STATUS_STEPS.indexOf(trade.status)
  const escrowFee = trade.amount * 0.008
  const buyerReceives = trade.amount - escrowFee
  const network = trade.network || 'bsc'
  const chainInfo = CHAIN_INFO[network] || CHAIN_INFO.bsc
  const walletConnected = !!getWalletForNetwork(network)

  const updateStatus = async (newStatus, extra = {}) => {
    setActionLoading(true)
    try {
      const updated = await db.entities.Trade.update(trade.id, { status: newStatus, ...extra })
      setTrade(updated)
      toast.success(`Status updated: ${STATUS_LABELS[newStatus] || newStatus}`)
    } catch (e) {
      toast.error('Failed to update trade')
    }
    setActionLoading(false)
  }

  // --- Smart contract interactions ---

  const handleLockEscrow = async () => {
    if (!walletConnected) {
      toast.error(`Connect your ${chainInfo.name} wallet first`)
      return
    }
    setActionLoading(true)
    try {
      const buyerAddress = trade.buyer_wallet_address
      if (!buyerAddress) {
        toast.error('Buyer wallet address not found')
        setActionLoading(false)
        return
      }
      const result = await escrow.createEscrow(network, trade.trade_id, buyerAddress, trade.amount)
      await updateStatus('payment_pending', {
        escrow_tx_hash: result.txHash,
        escrow_locked_at: new Date().toISOString(),
      })
      toast.success('USDT locked in smart contract escrow')
    } catch (err) {
      toast.error(err.shortMessage || err.message || 'Failed to lock escrow')
    }
    setActionLoading(false)
  }

  const handleConfirmPayment = async () => {
    setActionLoading(true)
    try {
      // Call the smart contract to confirm payment on-chain
      if (walletConnected) {
        const result = await escrow.confirmPayment(network, trade.trade_id)
        await updateStatus('payment_sent', {
          payment_confirmed_tx: result.txHash,
          payment_confirmed_at: new Date().toISOString(),
        })
      } else {
        // Fallback: off-chain confirmation
        await updateStatus('payment_sent', {
          payment_confirmed_at: new Date().toISOString(),
        })
      }
      toast.success('Payment confirmed')
    } catch (err) {
      toast.error(err.shortMessage || err.message || 'Failed to confirm payment')
    }
    setActionLoading(false)
  }

  const handleReleaseFunds = async () => {
    if (!walletConnected) {
      toast.error(`Connect your ${chainInfo.name} wallet to release funds`)
      return
    }
    setActionLoading(true)
    try {
      const result = await escrow.releaseFunds(network, trade.trade_id)
      await updateStatus('completed', {
        release_tx_hash: result.txHash,
        completed_at: new Date().toISOString(),
      })
      toast.success('USDT released to buyer. Escrow fee collected.')
    } catch (err) {
      toast.error(err.shortMessage || err.message || 'Failed to release funds')
    }
    setActionLoading(false)
  }

  const handleCancelTrade = async () => {
    setActionLoading(true)
    try {
      // If escrow is locked, cancel on-chain
      if (walletConnected && trade.escrow_tx_hash) {
        const result = await escrow.cancelTrade(network, trade.trade_id)
        await updateStatus('cancelled', { cancel_tx_hash: result.txHash })
      } else {
        await updateStatus('cancelled')
      }
      toast.success('Trade cancelled')
    } catch (err) {
      toast.error(err.shortMessage || err.message || 'Failed to cancel trade')
    }
    setActionLoading(false)
  }

  const handleRaiseDispute = async () => {
    const reason = prompt('Describe the issue:')
    if (!reason) return
    
    setActionLoading(true)
    try {
      // Try on-chain dispute
      if (walletConnected && trade.escrow_tx_hash) {
        const result = await escrow.raiseDispute(network, trade.trade_id)
        await db.entities.Dispute.create({
          trade_id: trade.id,
          raised_by: user.id,
          reason,
          status: 'open',
          dispute_tx_hash: result.txHash,
        })
      } else {
        await db.entities.Dispute.create({
          trade_id: trade.id,
          raised_by: user.id,
          reason,
          status: 'open',
        })
      }
      await updateStatus('disputed')
      toast.success('Dispute raised. Our team will review it.')
    } catch (err) {
      toast.error('Failed to raise dispute')
    }
    setActionLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      {/* Trade header */}
      <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-xl sm:text-2xl break-all">{trade.trade_id}</h1>
          <p className="text-sm text-muted-foreground mt-1">Created {timeAgo(trade.created_at)}</p>
        </div>
        <Badge variant={
          trade.status === 'completed' ? 'success' :
          trade.status === 'disputed' ? 'destructive' :
          trade.status === 'cancelled' ? 'neutral' : 'warning'
        } className="flex-shrink-0">{STATUS_LABELS[trade.status] || trade.status}</Badge>
      </div>

      {/* Progress tracker */}
      {trade.status !== 'cancelled' && trade.status !== 'disputed' && (
        <div className="flex items-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-3 px-3">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>{i + 1}</div>
              <span className={`text-xs ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'} hidden sm:inline`}>
                {STATUS_LABELS[step]}
              </span>
              {i < STATUS_STEPS.length - 1 && <div className={`w-4 sm:w-6 h-0.5 flex-shrink-0 ${i < currentStep ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Trade details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Amount</p><p className="font-semibold text-sm sm:text-lg mt-1">{formatUSDT(trade.amount)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Rate</p><p className="font-semibold text-sm sm:text-lg mt-1">{formatMWK(trade.rate)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold text-sm sm:text-lg mt-1">{formatMWK(trade.amount * trade.rate)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Network</p><p className="font-semibold text-sm sm:text-lg mt-1 uppercase">{network}</p></Card>
      </div>

      {/* Smart contract escrow info */}
      <Card className="mb-4 sm:mb-6 p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base">Smart Contract Escrow</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              USDT is locked in a self-executing smart contract. Escrow fee: {formatUSDT(escrowFee)}. Buyer receives: {formatUSDT(buyerReceives)}. No manual wallet management.
            </p>
          </div>
        </div>

        {/* On-chain transaction evidence */}
        {trade.escrow_tx_hash && (
          <div className="rounded-lg bg-secondary p-3 mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Escrow locked on-chain:</p>
              <a href={`${chainInfo.explorer}${trade.escrow_tx_hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                View <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <code className="text-xs break-all block">{trade.escrow_tx_hash}</code>
          </div>
        )}
        {trade.release_tx_hash && (
          <div className="rounded-lg bg-emerald-500/5 p-3 mt-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-emerald-500">USDT released on-chain:</p>
              <a href={`${chainInfo.explorer}${trade.release_tx_hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                View <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <code className="text-xs break-all block">{trade.release_tx_hash}</code>
          </div>
        )}

        {/* Wallet addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-xs text-muted-foreground mb-1">Seller wallet ({network})</p>
            <code className="text-xs break-all">{truncateAddress(trade.seller_wallet_address) || 'Not set'}</code>
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-xs text-muted-foreground mb-1">Buyer wallet ({network})</p>
            <code className="text-xs break-all">{truncateAddress(trade.buyer_wallet_address) || 'Not set'}</code>
          </div>
        </div>
      </Card>

      {/* Counterparty */}
      <Card className="mb-4 sm:mb-6 p-4 sm:p-5">
        <p className="text-xs text-muted-foreground mb-2">Counterparty</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
            {counterparty?.full_name?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base">{counterparty?.full_name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{counterparty?.total_trades || 0} trades · {counterparty?.kyc_status === 'verified' ? 'KYC verified' : 'Unverified'}</p>
          </div>
        </div>
      </Card>

      {/* Wallet connection warning */}
      {!walletConnected && trade.status !== 'completed' && trade.status !== 'cancelled' && (
        <Card className="border-amber-500/30 p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Wallet not connected</p>
              <p className="text-xs text-muted-foreground mt-1">Connect your {chainInfo.name} wallet from the navbar to interact with the escrow contract. On-chain actions require a connected wallet.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Action area */}
      <div className="space-y-4">
        {/* Seller: lock USDT in smart contract */}
        {isSeller && trade.status === 'escrow_pending' && (
          <Card className="border-amber-500/30 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm sm:text-base">Lock USDT in smart contract</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Your USDT will be transferred to the escrow smart contract. The contract holds the funds and releases them automatically when both parties confirm. No one can access the funds except through the contract logic.
                </p>
              </div>
            </div>
            <Button onClick={handleLockEscrow} loading={actionLoading} disabled={!walletConnected} className="w-full sm:w-auto">
              Lock {formatUSDT(trade.amount)} in Escrow
            </Button>
          </Card>
        )}

        {/* Buyer: pay the seller */}
        {isBuyer && trade.status === 'payment_pending' && (
          <Card className="border-amber-500/30 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm sm:text-base">Pay the seller</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Send {formatMWK(trade.amount * trade.rate)} to the seller via your agreed payment method. USDT is already locked in escrow. Once you have sent the Kwacha, confirm below to proceed.
                </p>
              </div>
            </div>
            <Button onClick={handleConfirmPayment} loading={actionLoading} className="w-full sm:w-auto">I have sent the payment</Button>
          </Card>
        )}

        {/* Seller: confirm payment and release */}
        {isSeller && trade.status === 'payment_sent' && (
          <Card className="border-primary/30 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm sm:text-base">Confirm payment and release USDT</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  The buyer reports they sent {formatMWK(trade.amount * trade.rate)}. Verify receipt in your mobile money or bank account, then release. The smart contract will send USDT to the buyer and the fee to the platform wallet automatically.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleReleaseFunds} loading={actionLoading} disabled={!walletConnected} className="w-full sm:w-auto">
                Confirm and Release
              </Button>
              <Button onClick={handleRaiseDispute} variant="destructive" loading={actionLoading} className="w-full sm:w-auto">Report a problem</Button>
            </div>
          </Card>
        )}

        {/* Completed */}
        {trade.status === 'completed' && (
          <Card className="border-emerald-500/30 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-emerald-500 text-sm sm:text-base">Trade completed</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">USDT released to the buyer via smart contract. Escrow fee of {formatUSDT(escrowFee)} was collected.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Disputed */}
        {trade.status === 'disputed' && (
          <Card className="border-destructive/30 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive text-sm sm:text-base">Dispute raised</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">The escrowed USDT is locked in the smart contract. Our team will review the trade and resolve the dispute on-chain. Funds cannot be moved until resolution.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Cancel option */}
        {(trade.status === 'created' || trade.status === 'escrow_pending') && (
          <Button onClick={handleCancelTrade} variant="outline" loading={actionLoading} className="w-full sm:w-auto">Cancel trade</Button>
        )}

        {/* Dispute option for active trades */}
        {['payment_pending', 'payment_sent'].includes(trade.status) && (
          <Button onClick={handleRaiseDispute} variant="destructive" loading={actionLoading} className="w-full sm:w-auto">Raise a dispute</Button>
        )}
      </div>
    </div>
  )
}
