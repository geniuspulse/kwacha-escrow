import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '2rem', color: '#0f0', fontFamily: 'monospace', minHeight: '100vh', background: '#111' }}>
        <h1>Test 2: QueryClient only</h1>
      </div>
    </QueryClientProvider>
  )
}
