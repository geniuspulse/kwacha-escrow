import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Shield, ArrowRight, FileCode, Lock } from 'lucide-react'

export default function HowItWorks() {
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-6 sm:mb-8">How Kwacha Escrow Works</h1>
      
      <Card className="mb-6 sm:mb-8 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <FileCode className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm sm:text-base">Smart contract escrow</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">All USDT is held by a self-executing smart contract on the BSC or Tron blockchain. No human can access the funds. The contract releases USDT automatically based on confirmations from both parties.</p>
          </div>
        </div>
      </Card>

      <div className="space-y-6 sm:space-y-8">
        <section>
          <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-primary">For Buyers</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              ['1. Find a sell offer', 'Browse the marketplace and find someone selling USDT at a rate you are happy with. Check their reputation and trade history.'],
              ['2. Start the trade', 'Enter how much USDT you want to buy and provide your wallet address. The seller locks their USDT in the smart contract escrow.'],
              ['3. Pay the seller in Kwacha', 'Send Kwacha to the seller via mobile money, bank transfer, or cash. Confirm the payment on the platform.'],
              ['4. Receive your USDT', 'Once the seller confirms they received your Kwacha, the smart contract automatically releases USDT to your wallet. Both parties pay a 1% fee (2% total). Your 1% fee is deducted from the USDT you receive.'],
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
              ['2. Lock USDT in smart contract', 'When a buyer starts a trade, approve and lock your USDT in the escrow smart contract. The funds are held by the contract, not by any person.'],
              ['3. Receive Kwacha', 'The buyer sends you Kwacha via your preferred method. Confirm receipt on the platform.'],
              ['4. Smart contract releases', 'Once you confirm payment, the smart contract sends USDT directly to the buyer wallet. Your 1% fee is added to your deposit on top of the trade amount. The buyers 1% is deducted from the received USDT.'],
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
              <p className="text-xs sm:text-sm text-muted-foreground">If either party cannot agree, they can raise a dispute on-chain. The smart contract freezes the USDT. Our admin team reviews trade history, payment proof, and on-chain data, then resolves the dispute by either releasing USDT to the buyer or refunding the seller. All actions are verifiable on the blockchain.</p>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-primary">Security</h2>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Funds are never held by the platform. They sit in the smart contract until the trade completes or is cancelled. The contract code is public and auditable. No one can move the USDT except through the contract logic.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-primary">Fees</h2>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">The escrow fee is 2% of the trade amount, split between both parties: seller pays 1% on top of the trade amount, buyer pays 1% deducted from received USDT. Total 2%. Collected by the smart contract automatically. No hidden charges, no subscription. You only pay when a trade completes.</p>
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
