import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/api/supabaseClient'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { formatUSDT, formatMWK, timeAgo, truncateAddress } from '@/lib/utils'
import { Shield, AlertCircle, CheckCircle, Clock, ArrowLeft, Copy } from 'lucide-react'

const STATUS_STEPS = ['created', 'escrow_pending', 'payment_pending', 'payment_sent', 'confirming', 'completed']
const STATUS_LABELS = {
  created: 'Trade Created',
  escrow_pending: 'Escrow Deposit',
  payment_pending: 'Awaiting Payment',
  payment_sent: 'Payment Sent',
  confirming: 'Confirming',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
}

export default function TradeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
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

  const raiseDispute = async () => {
    setActionLoading(true)
    try {
      await db.entities.Dispute.create({
        trade_id: trade.id,
        raised_by: user.id,
        reason: prompt('Describe the issue:') || 'Unspecified',
        status: 'open',
      })
      await updateStatus('disputed')
      toast.success('Dispute raised. Our team will review it.')
    } catch (e) {
      toast.error('Failed to raise dispute')
    }
    setActionLoading(false)
  }

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr)
    toast.success('Address copied to clipboard')
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

      {/* Progress tracker - horizontal scroll on mobile */}
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

      {/* Trade details - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Amount</p><p className="font-semibold text-sm sm:text-lg mt-1">{formatUSDT(trade.amount)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Rate</p><p className="font-semibold text-sm sm:text-lg mt-1">{formatMWK(trade.rate)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold text-sm sm:text-lg mt-1">{formatMWK(trade.amount * trade.rate)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Network</p><p className="font-semibold text-sm sm:text-lg mt-1 uppercase">{trade.network}</p></Card>
      </div>

      {/* Escrow info */}
      <Card className="mb-4 sm:mb-6 p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm sm:text-base">Escrow Protection</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">USDT is held in escrow until both parties confirm. Escrow fee: {formatUSDT(escrowFee)}. Buyer receives: {formatUSDT(buyerReceives)}.</p>
          </div>
        </div>
        {trade.escrow_address && (
          <div className="rounded-lg bg-secondary p-3 mt-3">
            <p className="text-xs text-muted-foreground mb-1">Escrow deposit address ({trade.network}):</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs sm:text-sm break-all">{trade.escrow_address}</code>
              <button onClick={() => copyAddress(trade.escrow_address)} className="p-1 rounded hover:bg-accent flex-shrink-0"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          </div>
        )}
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

      {/* Action area */}
      <div className="space-y-4">
        {/* Seller: deposit to escrow */}
        {isSeller && trade.status === 'escrow_pending' && (
          <Card className="border-amber-500/30 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm sm:text-base">Deposit USDT to escrow</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Send {formatUSDT(trade.amount)} to the escrow address below. The trade will proceed once the deposit is confirmed on-chain.</p>
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-1">Send to this address ({trade.network}):</p>
              <code className="text-xs sm:text-sm break-all">{trade.escrow_address || 'ESCROW_ADDRESS_PLACEHOLDER'}</code>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => copyAddress(trade.escrow_address)} variant="outline" className="w-full sm:w-auto"><Copy className="w-4 h-4 mr-2" /> Copy address</Button>
              <Button onClick={() => updateStatus('payment_pending')} loading={actionLoading} className="w-full sm:w-auto">I have sent the deposit</Button>
            </div>
          </Card>
        )}

        {/* Buyer: pay the seller */}
        {isBuyer && trade.status === 'payment_pending' && (
          <Card className="border-amber-500/30 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm sm:text-base">Pay the seller</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Send {formatMWK(trade.amount * trade.rate)} to the seller via your agreed payment method. Click below once you have sent the payment.</p>
              </div>
            </div>
            <Button onClick={() => updateStatus('payment_sent')} loading={actionLoading} className="w-full sm:w-auto">I have sent the payment</Button>
          </Card>
        )}

        {/* Seller: confirm payment received */}
        {isSeller && trade.status === 'payment_sent' && (
          <Card className="border-primary/30 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm sm:text-base">Confirm payment received</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">The buyer reports they have sent {formatMWK(trade.amount * trade.rate)}. Confirm that you have received the Kwacha to release the escrow.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => updateStatus('confirming')} loading={actionLoading} className="w-full sm:w-auto">Confirm and release</Button>
              <Button onClick={raiseDispute} variant="destructive" loading={actionLoading} className="w-full sm:w-auto">Report a problem</Button>
            </div>
          </Card>
        )}

        {/* Processing release */}
        {trade.status === 'confirming' && (
          <Card className="border-primary/30 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
              <p className="text-xs sm:text-sm">Releasing USDT from escrow to the buyer wallet. This may take a few minutes for on-chain confirmation.</p>
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
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">USDT has been released to the buyer. Escrow fee of {formatUSDT(escrowFee)} was deducted.</p>
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
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Our team is reviewing this trade. The escrowed USDT will remain locked until the dispute is resolved. You will be notified of the outcome.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Cancel option */}
        {(trade.status === 'created' || trade.status === 'escrow_pending') && (
          <Button onClick={() => updateStatus('cancelled')} variant="outline" loading={actionLoading} className="w-full sm:w-auto">Cancel trade</Button>
        )}

        {/* Dispute option for active trades */}
        {['payment_pending', 'payment_sent'].includes(trade.status) && (
          <Button onClick={raiseDispute} variant="destructive" loading={actionLoading} className="w-full sm:w-auto">Raise a dispute</Button>
        )}
      </div>
    </div>
  )
}
