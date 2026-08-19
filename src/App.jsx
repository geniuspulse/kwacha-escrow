import { QueryClient } from '@tanstack/react-query'
export default function App() {
  return <div style={{padding:'2rem',color:'#0f0',fontFamily:'monospace',minHeight:'100vh',background:'#111'}}>
    <h1>Test: ErrorBoundary + react-query</h1>
    <p>QueryClient: {typeof QueryClient}</p>
  </div>
}
