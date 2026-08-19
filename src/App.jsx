import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { WalletProvider } from '@/context/WalletContext'
import Navbar from '@/components/Navbar'
import LandingPage from '@/pages/LandingPage'
import TradePage from '@/pages/TradePage'
import HowItWorks from '@/pages/HowItWorks'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import CreateOfferPage from '@/pages/CreateOfferPage'
import TradeDetailPage from '@/pages/TradeDetailPage'
import AdminPage from '@/pages/AdminPage'
import ProfilePage from '@/pages/ProfilePage'
import { Toaster } from 'sonner'
import { Shield } from 'lucide-react'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Shield className="w-8 h-8 text-primary animate-pulse" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Shield className="w-8 h-8 text-primary animate-pulse" /></div>
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/trade" element={<TradePage />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/offers/new" element={<ProtectedRoute><CreateOfferPage /></ProtectedRoute>} />
                  <Route path="/trades/:id" element={<ProtectedRoute><TradeDetailPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                </Routes>
              </main>
              <footer className="border-t border-border py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground px-4">
                <p>Kwacha Escrow &mdash; Smart Contract Secured USDT P2P Trading for Malawi</p>
              </footer>
            </div>
            <Toaster theme="dark" position="bottom-right" />
          </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
