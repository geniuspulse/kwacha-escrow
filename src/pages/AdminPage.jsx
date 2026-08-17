import { useState, useEffect } from 'react'
import { db } from '@/api/supabaseClient'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatUSDT, formatMWK, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import { Users, Gavel, TrendingUp, Shield, CheckCircle } from 'lucide-react'

export default function AdminPage() {
  const [tab, setTab] = useState('overview')
  const [trades, setTrades] = useState([])
  const [disputes, setDisputes] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [t, d, p] = await Promise.all([
        db.entities.Trade.list(),
        db.entities.Dispute.filter({}),
        db.entities.Profile.list(),
      ])
      setTrades(t)
      setDisputes(d)
      setProfiles(p)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const stats = {
    totalTrades: trades.length,
    completed: trades.filter(t => t.status === 'completed').length,
    disputed: trades.filter(t => t.status === 'disputed').length,
    volume: trades.filter(t => t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0),
    feesCollected: trades.filter(t => t.status === 'completed').reduce((s, t) => s + (t.amount || 0) * 0.008, 0),
    totalUsers: profiles.length,
    verifiedUsers: profiles.filter(p => p.kyc_status === 'verified').length,
  }

  const resolveDispute = async (disputeId, resolution, tradeId, winner) => {
    try {
      await db.entities.Dispute.update(disputeId, { status: 'resolved', resolution, resolved_at: new Date().toISOString() })
      await db.entities.Trade.update(tradeId, { status: winner === 'buyer' ? 'completed' : 'cancelled' })
      toast.success('Dispute resolved')
      loadData()
    } catch (e) { toast.error('Failed to resolve dispute') }
  }

  const verifyKYC = async (userId) => {
    try {
      await db.entities.Profile.update(userId, { kyc_status: 'verified' })
      toast.success('User verified')
      loadData()
    } catch (e) { toast.error('Failed to verify user') }
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-6 sm:mb-8">Admin Panel</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
        {['overview', 'trades', 'disputes', 'users'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
            }`}>{t}</button>
        ))}
      </div>

      {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : (
        <>
          {tab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Card className="p-4"><div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-primary flex-shrink-0" /><div><p className="text-xl sm:text-2xl font-bold">{stats.totalTrades}</p><p className="text-xs text-muted-foreground">Total trades</p></div></div></Card>
              <Card className="p-4"><div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /><div><p className="text-xl sm:text-2xl font-bold">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></div></div></Card>
              <Card className="p-4"><div className="flex items-center gap-3"><Gavel className="w-5 h-5 text-amber-500 flex-shrink-0" /><div><p className="text-xl sm:text-2xl font-bold">{stats.disputed}</p><p className="text-xs text-muted-foreground">Disputed</p></div></div></Card>
              <Card className="p-4"><div className="flex items-center gap-3"><Shield className="w-5 h-5 text-primary flex-shrink-0" /><div><p className="text-sm sm:text-base font-bold">{formatUSDT(stats.feesCollected)}</p><p className="text-xs text-muted-foreground">Fees collected</p></div></div></Card>
              <Card className="p-4"><div className="flex items-center gap-3"><Users className="w-5 h-5 text-primary flex-shrink-0" /><div><p className="text-xl sm:text-2xl font-bold">{stats.totalUsers}</p><p className="text-xs text-muted-foreground">Users</p></div></div></Card>
              <Card className="p-4"><div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /><div><p className="text-xl sm:text-2xl font-bold">{stats.verifiedUsers}</p><p className="text-xs text-muted-foreground">KYC verified</p></div></div></Card>
            </div>
          )}

          {tab === 'trades' && (
            <div className="space-y-3">
              {trades.length === 0 ? <Card className="text-center py-8"><p className="text-sm text-muted-foreground">No trades yet.</p></Card> : trades.map(t => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className="font-medium text-sm sm:text-base">{formatUSDT(t.amount)} @ {formatMWK(t.rate)}</p><p className="text-xs text-muted-foreground mt-1">{t.trade_id} · {timeAgo(t.created_at)}</p></div>
                    <Badge variant={t.status === 'completed' ? 'success' : t.status === 'disputed' ? 'destructive' : t.status === 'cancelled' ? 'neutral' : 'warning'} className="flex-shrink-0">{t.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === 'disputes' && (
            <div className="space-y-3">
              {disputes.length === 0 ? <Card className="text-center py-8"><p className="text-sm text-muted-foreground">No disputes filed.</p></Card> : disputes.map(d => (
                <Card key={d.id} className="border-destructive/30 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0"><p className="font-medium text-sm sm:text-base">Dispute on trade {d.trade?.trade_id}</p><p className="text-xs sm:text-sm text-muted-foreground mt-1">{d.reason}</p><p className="text-xs text-muted-foreground mt-1">{timeAgo(d.created_at)}</p></div>
                    <Badge variant={d.status === 'open' ? 'destructive' : 'success'} className="flex-shrink-0">{d.status}</Badge>
                  </div>
                  {d.status === 'open' && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <Button size="sm" onClick={() => resolveDispute(d.id, 'Released to buyer', d.trade_id, 'buyer')} className="w-full sm:w-auto">Release to buyer</Button>
                      <Button size="sm" variant="destructive" onClick={() => resolveDispute(d.id, 'Returned to seller', d.trade_id, 'seller')} className="w-full sm:w-auto">Return to seller</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-3">
              {profiles.map(p => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">{p.full_name?.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email} · {p.total_trades || 0} trades</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={p.kyc_status === 'verified' ? 'success' : 'warning'}>{p.kyc_status}</Badge>
                      {p.kyc_status !== 'verified' && <Button size="sm" variant="outline" onClick={() => verifyKYC(p.id)}>Verify</Button>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
