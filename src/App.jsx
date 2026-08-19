import { QueryClient } from '@tanstack/react-query'

export default function App() {
  return (
    <div style={{ padding: '2rem', color: '#0f0', fontFamily: 'monospace', minHeight: '100vh', background: '#111' }}>
      <h1>Test 4: Import QueryClient, don't use it</h1>
      <p>QueryClient type: {typeof QueryClient}</p>
    </div>
  )
}
