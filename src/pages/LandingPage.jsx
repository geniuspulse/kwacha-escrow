import { Link } from 'react-router-dom'
import { Shield, Lock, Zap, Users, TrendingUp, ArrowRight, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Malawi's USDT Escrow Platform
          </div>
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl tracking-tight mb-6">
            Trade USDT securely.<br />
            <span className="text-primary">No scams. No stress.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Buy and sell USDT peer-to-peer with escrow protection. Pay with mobile money, bank transfer, or cash. Your trades are secured from start to finish.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
              Start Trading <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border font-semibold hover:bg-accent transition-colors">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-heading font-bold text-primary">0.8%</p>
            <p className="text-sm text-muted-foreground mt-1">Escrow fee per trade</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-heading font-bold text-primary">2</p>
            <p className="text-sm text-muted-foreground mt-1">Networks (TRC20 & BSC)</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-heading font-bold text-primary">100%</p>
            <p className="text-sm text-muted-foreground mt-1">Escrow protected</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-heading font-bold text-primary">24/7</p>
            <p className="text-sm text-muted-foreground mt-1">Dispute resolution</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-center mb-12">How escrow protects you</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary font-bold text-lg">1</span>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Seller deposits USDT</h3>
              <p className="text-sm text-muted-foreground">
                When a trade starts, the seller sends USDT to the platform escrow wallet. The USDT is locked until the trade completes.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary font-bold text-lg">2</span>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Buyer pays in Kwacha</h3>
              <p className="text-sm text-muted-foreground">
                The buyer sends Kwacha to the seller via mobile money, bank transfer, or cash. Both parties confirm the payment.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary font-bold text-lg">3</span>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">USDT released</h3>
              <p className="text-sm text-muted-foreground">
                Once payment is confirmed, the escrow releases USDT to the buyer's wallet. If there's a dispute, our team steps in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-center mb-12">Built for Malawi</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Escrow protection</h3>
                <p className="text-sm text-muted-foreground">USDT is locked in escrow before any Kwacha changes hands. Neither party can run off with the funds.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
              <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Live market rates</h3>
                <p className="text-sm text-muted-foreground">Sellers set their own rates. Browse offers and pick the best price for your trade size.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
              <Users className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Reputation system</h3>
                <p className="text-sm text-muted-foreground">Every trader has a public rating and trade history. Know who you're dealing with before you trade.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
              <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">KYC verified</h3>
                <p className="text-sm text-muted-foreground">All users verify their identity. This keeps scammers out and makes disputes resolvable.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading font-bold text-3xl mb-4">Ready to trade?</h2>
          <p className="text-muted-foreground mb-8">Join Kwacha Escrow and start trading USDT with confidence.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Create your account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
