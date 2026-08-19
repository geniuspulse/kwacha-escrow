import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { WalletProvider } from './context/WalletContext'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <BrowserRouter>
            <div style={{padding:'2rem',color:'#0f0',fontFamily:'monospace',minHeight:'100vh',background:'#111'}}>
              <h1>Test: All providers, no pages</h1>
            </div>
          </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
