import { supabase, isSupabaseConfigured } from './api/supabaseClient'

export default function App() {
  return (
    <div style={{padding:'2rem',color:'#0f0',fontFamily:'monospace',minHeight:'100vh',background:'#111'}}>
      <h1>Test: import createClient, don't call</h1>
      <p>supabase: {String(supabase)}</p>
    </div>
  )
}
