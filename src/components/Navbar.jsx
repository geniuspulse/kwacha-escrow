import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import WalletConnect from '../components/WalletConnect'
import { Shield, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-base sm:text-lg tracking-tight">Kwacha Escrow</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/trade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Trade</Link>
          <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
          {user && <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>}
          {profile?.role === 'admin' && <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <WalletConnect />
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-muted-foreground">{profile?.full_name?.split(' ')[0] || 'User'}</span>
              </Link>
              <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-accent transition-colors">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Link to="/register" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -mr-2">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border px-4 py-4 space-y-4 bg-background">
          <Link to="/trade" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground py-1">Trade</Link>
          <Link to="/how-it-works" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground py-1">How it works</Link>
          {user && <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground py-1">Dashboard</Link>}
          {user && <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground py-1">Profile</Link>}
          {profile?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground py-1">Admin</Link>}
          
          <div className="pt-3 border-t border-border">
            <div className="mb-3"><WalletConnect /></div>
          </div>
          
          <div className="pt-3 border-t border-border">
            {user ? (
              <button onClick={handleSignOut} className="block text-sm text-destructive py-1">Sign out</button>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-lg border border-border text-sm">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
