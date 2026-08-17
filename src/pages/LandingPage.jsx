import { Link } from 'react-router-dom'
import { Shield, Lock, Zap, Users, TrendingUp, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-12 sm:py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-5 sm:mb-6">
            <Zap className="w-3.5 h-3.5" />
            Malawi's USDT Escrow Platform
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-6xl tracking-tight mb-4 sm:mb-6 leading-tight">
            Trade USDT securely.<br />
            <span className="text-primary">No scams. No stress.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Buy and sell USDT peer-to-peer with escrow protection. Pay with mobile money, bank transfer, or cash. Your trades are secured from start to finish.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto justify-center">
              Start Trading <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border font-semibold hover:bg-accent transition-colors w-full sm:w-auto justify-center">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border py-8 sm:py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-heading font-bold text-primary">0.8%</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Escrow fee per trade</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-heading font-bold text-primary">2</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Networks (TRC20 & BSC)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-heading font-bold text-primary">100%</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Escrow protected</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-heading font-bold text-primary">24/7</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Dispute resolution</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-center mb-8 sm:mb-12">How escrow protects you</h2>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { num: '1', title: 'Seller deposits USDT', desc: 'When a trade starts, the seller sends USDT to the platform escrow wallet. The USDT is locked until the trade completes.' },
              { num: '2', title: 'Buyer pays in Kwacha', desc: 'The buyer sends Kwacha to the seller via mobile money, bank transfer, or cash. Both parties confirm the payment.' },
              { num: '3', title: 'USDT released', desc: 'Once payment is confirmed, the escrow releases USDT to the buyer wallet. If there is a dispute, our team steps in.' },
            ].map((step) => (
              <div key={step.num} className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-lg">{step.num}</span>
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-center mb-8 sm:mb-12">Built for Malawi</h2>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {[
              { icon: Shield, title: 'Escrow protection', desc: 'USDT is locked in escrow before any Kwacha changes hands. Neither party can run off with the funds.' },
              { icon: TrendingUp, title: 'Live market rates', desc: 'Sellers set their own rates. Browse offers and pick the best price for your trade size.' },
              { icon: Users, title: 'Reputation system', desc: 'Every trader has a public rating and trade history. Know who you are dealing with before you trade.' },
              { icon: Lock, title: 'KYC verified', desc: 'All users verify their identity. This keeps scammers out and makes disputes resolvable.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
                <f.icon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-4">Ready to trade?</h2>
          <p className="text-muted-foreground mb-6 sm:mb-8">Join Kwacha Escrow and start trading USDT with confidence.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Create your account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
