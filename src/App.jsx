import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ padding: '2rem', color: '#0f0', fontFamily: 'monospace', minHeight: '100vh', background: '#111' }}>
          <h1>Test 1: QueryClient + BrowserRouter</h1>
          <p>If you see this, React Query and Router work fine.</p>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
