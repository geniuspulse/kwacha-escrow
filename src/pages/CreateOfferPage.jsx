import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/api/supabaseClient'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from 'sonner'
import { formatUSDT } from '@/lib/utils'

const PAYMENT_METHODS = [
  { key: 'airtel', label: 'Airtel Money' },
  { key: 'mpamba', label: 'TNM Mpamba' },
  { key: 'bank', label: 'Bank Transfer' },
  { key: 'cash', label: 'Cash in Person' },
]

const NETWORKS = [
  { key: 'trc20', label: 'Tron (TRC20)' },
  { key: 'bsc', label: 'BSC (BEP20)' },
]

export default function CreateOfferPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'sell',
    amount: '',
    rate: '',
    min_amount: '10',
    max_amount: '',
    payment_methods: ['airtel'],
    network: 'trc20',
    wallet_address: profile?.wallet_address || '',
    terms: '',
  })

  const togglePaymentMethod = (key) => {
    setForm(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(key)
        ? prev.payment_methods.filter(m => m !== key)
        : [...prev.payment_methods, key],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.payment_methods.length === 0) {
      toast.error('Select at least one payment method')
      return
    }
    if (parseFloat(form.amount) < parseFloat(form.min_amount)) {
      toast.error('Amount must be greater than minimum')
      return
    }
    setLoading(true)
    try {
      const offer = await db.entities.Offer.create({
        seller_id: user.id,
        type: form.type,
        amount: parseFloat(form.amount),
        rate: parseFloat(form.rate),
        min_amount: parseFloat(form.min_amount),
        max_amount: parseFloat(form.max_amount) || parseFloat(form.amount),
        payment_methods: form.payment_methods,
        network: form.network,
        wallet_address: form.wallet_address,
        terms: form.terms,
        status: 'active',
      })
      toast.success('Offer created!')
      navigate('/trade')
    } catch (err) {
      toast.error(err.message || 'Failed to create offer')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading font-bold text-3xl mb-8">Create Offer</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type */}
        <Card>
          <Label>Trade type</Label>
          <div className="flex gap-3 mt-2">
            {['sell', 'buy'].map(t => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-3 rounded-lg font-semibold capitalize transition-colors ${
                  form.type === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                }`}>
                {t === 'sell' ? 'Sell USDT' : 'Buy USDT'}
              </button>
            ))}
          </div>
        </Card>

        {/* Amount and rate */}
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount (USDT)</Label>
              <Input type="number" step="0.01" min="1" required value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="100" />
            </div>
            <div>
              <Label>Rate (MWK per USDT)</Label>
              <Input type="number" step="1" min="1" required value={form.rate}
                onChange={e => setForm({ ...form, rate: e.target.value })} placeholder="1800" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Min per trade (USDT)</Label>
              <Input type="number" step="0.01" value={form.min_amount}
                onChange={e => setForm({ ...form, min_amount: e.target.value })} placeholder="10" />
            </div>
            <div>
              <Label>Max per trade (USDT)</Label>
              <Input type="number" step="0.01" value={form.max_amount}
                onChange={e => setForm({ ...form, max_amount: e.target.value })} placeholder={form.amount || '100'} />
            </div>
          </div>
          {form.amount && form.rate && (
            <p className="text-sm text-muted-foreground mt-3">
              Total value: MWK {Math.round(parseFloat(form.amount) * parseFloat(form.rate)).toLocaleString()}
            </p>
          )}
        </Card>

        {/* Network */}
        <Card>
          <Label>Network</Label>
          <div className="flex gap-3 mt-2">
            {NETWORKS.map(n => (
              <button key={n.key} type="button" onClick={() => setForm({ ...form, network: n.key })}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  form.network === n.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                }`}>
                {n.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Payment methods */}
        <Card>
          <Label>Accepted payment methods</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {PAYMENT_METHODS.map(m => (
              <button key={m.key} type="button" onClick={() => togglePaymentMethod(m.key)}
                className={`py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                  form.payment_methods.includes(m.key) ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'
                }`}>
                {m.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Wallet address */}
        <Card>
          <Label>Wallet address ({form.network === 'trc20' ? 'TRC20' : 'BSC'} address)</Label>
          <Input required value={form.wallet_address}
            onChange={e => setForm({ ...form, wallet_address: e.target.value })}
            placeholder={form.network === 'trc20' ? 'T...' : '0x...'} />
        </Card>

        {/* Terms */}
        <Card>
          <Label>Additional terms (optional)</Label>
          <textarea value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })}
            placeholder="e.g. Reply within 10 minutes or trade will be cancelled"
            className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </Card>

        <Button type="submit" loading={loading} size="lg" className="w-full">Create Offer</Button>
      </form>
    </div>
  )
}
