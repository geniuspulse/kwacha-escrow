import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../api/supabaseClient'
import { Card, Badge } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { formatUSDT, formatMWK, timeAgo } from '../lib/utils'
import { Wallet, TrendingUp, Clock, CheckCircle, Plus, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [trades, setTrades] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) loadData()
  }, [user])

  const loadData = async () => {
    try {
      const userTrades = await db.entities.Trade.filter({ buyer_id: user.id })
      const sellerTrades = await db.entities.Trade.filter({ seller_id: user.id })
      const allTrades = [...userTrades, ...sellerTrades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setTrades(allTrades)
      const userOffers = await db.entities.Offer.filter({ seller_id: user.id })
      setOffers(userOffers)
    } catch (e) {
      console.error('Failed to load data:', e)
    }
    setLoading(false)
  }

  const stats = {
    total: trades.length,
    completed: trades.filter(t => t.status === 'completed').length,
    active: trades.filter(t => ['escrow_pending', 'payment_pending', 'payment_sent', 'confirming'].includes(t.status)).length,
    volume: trades.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0),
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {profile?.full_name?.split(' ')[0] || 'trader'}</p>
        </div>
        <Link to="/offers/new" className="flex-shrink-0">
          <Button size="lg" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Create Offer</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></div>
            <div className="min-w-0"><p className="text-xl sm:text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground truncate">Total trades</p></div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /></div>
            <div className="min-w-0"><p className="text-xl sm:text-2xl font-bold">{stats.completed}</p><p className="text-xs text-muted-foreground truncate">Completed</p></div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /></div>
            <div className="min-w-0"><p className="text-xl sm:text-2xl font-bold">{stats.active}</p><p className="text-xs text-muted-foreground truncate">Active</p></div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></div>
            <div className="min-w-0"><p className="text-base sm:text-2xl font-bold">{formatUSDT(stats.volume)}</p><p className="text-xs text-muted-foreground truncate">Volume</p></div>
          </div>
        </Card>
      </div>

      {/* Active offers */}
      <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4">Your Offers</h2>
      {offers.length === 0 ? (
        <Card className="text-center py-6 sm:py-8 mb-6 sm:mb-8">
          <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">You have not created any offers yet.</p>
          <Link to="/offers/new"><Button>Create your first offer</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3 mb-6 sm:mb-8">
          {offers.map(o => (
            <Card key={o.id} className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={o.type === 'sell' ? 'default' : 'warning'}>{o.type === 'sell' ? 'Selling' : 'Buying'}</Badge>
                    <span className="font-medium text-sm sm:text-base">{formatUSDT(o.amount)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{formatMWK(o.rate)} per USDT · {timeAgo(o.created_at)}</p>
                </div>
                <Badge variant={o.status === 'active' ? 'success' : 'neutral'} className="flex-shrink-0">{o.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent trades */}
      <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4">Recent Trades</h2>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : trades.length === 0 ? (
        <Card className="text-center py-6 sm:py-8">
          <p className="text-sm text-muted-foreground">No trades yet. Browse the marketplace to get started.</p>
          <Link to="/trade" className="inline-flex items-center gap-1 text-primary mt-3 hover:underline text-sm">
            Go to marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {trades.slice(0, 10).map(t => (
            <Link key={t.id} to={`/trades/${t.id}`}>
              <Card className="hover:border-primary/30 transition-colors p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base">{formatUSDT(t.amount)} @ {formatMWK(t.rate)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.trade_id} · {timeAgo(t.created_at)}</p>
                  </div>
                  <Badge variant={
                    t.status === 'completed' ? 'success' :
                    t.status === 'disputed' ? 'destructive' :
                    t.status === 'cancelled' ? 'neutral' : 'warning'
                  } className="flex-shrink-0">{t.status}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
