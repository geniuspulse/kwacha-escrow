import { Link } from 'react-router-dom'
import { Shield, ArrowRight } from 'lucide-react'

export default function HowItWorks() {
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-6 sm:mb-8">How Kwacha Escrow Works</h1>
      <div className="space-y-6 sm:space-y-8">
        <section>
          <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-primary">For Buyers</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              ['1. Find a sell offer', 'Browse the marketplace and find someone selling USDT at a rate you are happy with. Check their reputation and trade history.'],
              ['2. Start the trade', 'Enter how much USDT you want to buy and select your payment method. The seller USDT goes into escrow immediately.'],
              ['3. Pay the seller', 'Send Kwacha to the seller via your chosen payment method. Mark the payment as sent in the trade interface.'],
              ['4. Receive your USDT', 'Once the seller confirms they received your Kwacha, the escrow releases USDT to your wallet. Done.'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <h3 className="font-medium mb-1 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-primary">For Sellers</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              ['1. Create a sell offer', 'Set your USDT amount, rate in Kwacha, and accepted payment methods. Your offer appears on the marketplace.'],
              ['2. Deposit to escrow', 'When a buyer starts a trade, send your USDT to the platform escrow wallet. The trade will not proceed until the deposit is confirmed on-chain.'],
              ['3. Receive Kwacha', 'The buyer sends you Kwacha via your preferred method. Confirm receipt in the trade interface.'],
              ['4. Escrow releases', 'Once you confirm payment, the escrow sends USDT to the buyer wallet. The escrow fee is deducted from the released amount.'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <h3 className="font-medium mb-1 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-primary">Dispute Resolution</h2>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-muted-foreground">If either party cannot agree on the trade outcome, they can raise a dispute. Our team reviews the trade history, payment proof, and on-chain data to resolve it fairly. The escrowed USDT stays locked until the dispute is resolved.</p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-primary">Fees</h2>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">The escrow fee is 0.8% of the trade amount, deducted from the released USDT. No hidden charges, no subscription. You only pay when a trade completes.</p>
          </div>
        </section>
      </div>
      <div className="mt-8 sm:mt-12 text-center">
        <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 text-sm sm:text-base">
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
