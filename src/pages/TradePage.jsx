import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db } from '@/api/supabaseClient'
import { formatUSDT, formatMWK, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { Search, ArrowRight, Wallet, Smartphone, Banknote, BankBuilding } from 'lucide-react'

const PAYMENT_METHODS = {
  airtel: { label: 'Airtel Money', icon: Smartphone },
  mpamba: { label: 'TNM Mpamba', icon: Smartphone },
  bank: { label: 'Bank Transfer', icon: BankBuilding },
  cash: { label: 'Cash in Person', icon: Banknote },
}

export default function TradePage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    setLoading(true)
    try {
      const data = await db.entities.Offer.filter({ status: 'active' })
      setOffers(data || [])
    } catch (e) {
      console.error('Failed to load offers:', e)
    }
    setLoading(false)
  }

  const filtered = offers.filter(o => {
    if (filter !== 'all' && o.type !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return o.seller?.full_name?.toLowerCase().includes(q) ||
             String(o.rate).includes(q) ||
             o.payment_methods?.some(m => m.toLowerCase().includes(q))
    }
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-3xl">USDT Market</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse buy and sell offers from verified traders</p>
        </div>
        {user && (
          <Link to="/offers/new">
            <Button variant="default" size="lg">
              Create Offer
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by rate, seller, or payment method..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'sell', 'buy'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
              }`}
            >
              {t === 'all' ? 'All Offers' : t === 'sell' ? 'Sell USDT' : 'Buy USDT'}
            </button>
          ))}
        </div>
      </div>

      {/* Offers list */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading offers...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No offers available right now.</p>
          {user && (
            <Link to="/offers/new">
              <Button>Be the first to create an offer</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(offer => (
            <Link key={offer.id} to={`/trades/new?offer=${offer.id}`} className="block">
              <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {offer.profile?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{offer.profile?.full_name || 'Unknown'}</span>
                        {offer.profile?.kyc_status === 'verified' && <Badge variant="success">KYC</Badge>}
                        {offer.profile?.reputation_score > 4.5 && <Badge variant="success">Trusted</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {offer.profile?.total_trades || 0} trades · {timeAgo(offer.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 md:gap-8">
                    <div>
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="font-semibold mt-0.5">{formatMWK(offer.rate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold mt-0.5">{formatUSDT(offer.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {offer.payment_methods?.map(m => (
                          <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {PAYMENT_METHODS[m]?.label || m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <Badge variant={offer.type === 'sell' ? 'default' : 'warning'}>
                      {offer.type === 'sell' ? 'Selling' : 'Buying'}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
