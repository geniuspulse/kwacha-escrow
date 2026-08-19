import { supabase, isSupabaseConfigured } from './api/supabaseClient'

export default function App() {
  return (
    <div style={{padding:'2rem',color:'#0f0',fontFamily:'monospace',minHeight:'100vh',background:'#111'}}>
      <h1>Test: proxy supabase client</h1>
      <p>isSupabaseConfigured: {String(isSupabaseConfigured)}</p>
      <p>supabase type: {typeof supabase}</p>
    </div>
  )
}
