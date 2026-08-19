import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { toast } from 'sonner'
import { truncateAddress } from '../lib/utils'
import { ChevronDown, Wallet as WalletIcon, Check } from 'lucide-react'

export default function WalletConnect() {
  const { bscAddress, trc20Address, connectBsc, connectTrc20, connecting } = useWallet()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const anyConnected = bscAddress || trc20Address

  const handleConnectBsc = async () => {
    try {
      await connectBsc()
      toast.success('BSC wallet connected')
    } catch (err) {
      toast.error(err.message || 'Failed to connect BSC wallet')
    }
    setDropdownOpen(false)
  }

  const handleConnectTrc20 = async () => {
    try {
      await connectTrc20()
      toast.success('TRC20 wallet connected')
    } catch (err) {
      toast.error(err.message || 'Failed to connect TRC20 wallet')
    }
    setDropdownOpen(false)
  }

  if (anyConnected) {
    return (
      <div className="flex items-center gap-2">
        {bscAddress && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-500">BSC {truncateAddress(bscAddress)}</span>
          </div>
        )}
        {trc20Address && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary">TRC20 {truncateAddress(trc20Address)}</span>
          </div>
        )}
        {(bscAddress || trc20Address) && (
          <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary">Wallet</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={connecting}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-border bg-secondary text-sm font-medium hover:bg-accent transition-colors"
      >
        <WalletIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
        <ChevronDown className="w-3.5 h-3.5 hidden sm:inline" />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              <button
                onClick={handleConnectBsc}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-amber-500">BSC</span>
                </div>
                <div>
                  <p className="text-sm font-medium">BSC Wallet</p>
                  <p className="text-xs text-muted-foreground">MetaMask / BNB Chain</p>
                </div>
              </button>
              <button
                onClick={handleConnectTrc20}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-red-500">TRX</span>
                </div>
                <div>
                  <p className="text-sm font-medium">TRC20 Wallet</p>
                  <p className="text-xs text-muted-foreground">TronLink / Tron</p>
                </div>
              </button>
            </div>
            <div className="border-t border-border p-3">
              <p className="text-xs text-muted-foreground">Connect a crypto wallet to lock and release USDT in escrow. You can connect both networks.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
