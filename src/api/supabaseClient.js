import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Lazy-create the client only if configured; otherwise use a no-op proxy
let _supabase = null

function getSupabase() {
  if (_supabase) return _supabase
  if (!isSupabaseConfigured) {
    // Return a proxy that no-ops everything
    _supabase = new Proxy({}, {
      get(_target, prop) {
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: async () => { throw new Error('Supabase not configured') },
            signUp: async () => { throw new Error('Supabase not configured') },
            signOut: async () => {},
          }
        }
        return () => async () => ({ data: null, error: null })
      }
    })
    return _supabase
  }
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return _supabase
}

export const supabase = getSupabase()

// Database entity helpers
export const db = {
  entities: {
    Profile: {
      async list() { if (!isSupabaseConfigured) return []; const r = await supabase.from('profiles').select('*'); return r.data || [] },
      async get(id) { if (!isSupabaseConfigured) return null; const r = await supabase.from('profiles').select('*').eq('id', id).single(); return r.data },
      async filter(filters) {
        if (!isSupabaseConfigured) return []
        let q = supabase.from('profiles').select('*')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q).data || []
      },
      async create(data) { const r = await supabase.from('profiles').insert(data).select().single(); return r.data },
      async update(id, data) { const r = await supabase.from('profiles').update(data).eq('id', id).select().single(); return r.data },
    },
    Offer: {
      async list() { if (!isSupabaseConfigured) return []; const r = await supabase.from('offers').select('*, profile:profiles!seller_id(*)'); return r.data || [] },
      async get(id) { if (!isSupabaseConfigured) return null; const r = await supabase.from('offers').select('*, profile:profiles!seller_id(*)').eq('id', id).single(); return r.data },
      async filter(filters) {
        if (!isSupabaseConfigured) return []
        let q = supabase.from('offers').select('*, profile:profiles!seller_id(*)')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q.order('created_at', { ascending: false }).limit(100))?.data || []
      },
      async create(data) { const r = await supabase.from('offers').insert(data).select('*, profile:profiles!seller_id(*)').single(); return r.data },
      async update(id, data) { const r = await supabase.from('offers').update(data).eq('id', id).select().single(); return r.data },
      async delete(id) { return supabase.from('offers').delete().eq('id', id) },
    },
    Trade: {
      async list() { if (!isSupabaseConfigured) return []; const r = await supabase.from('trades').select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)'); return r.data || [] },
      async get(id) { if (!isSupabaseConfigured) return null; const r = await supabase.from('trades').select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)').eq('id', id).single(); return r.data },
      async filter(filters) {
        if (!isSupabaseConfigured) return []
        let q = supabase.from('trades').select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q.order('created_at', { ascending: false }).limit(50))?.data || []
      },
      async create(data) { const r = await supabase.from('trades').insert(data).select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)').single(); return r.data },
      async update(id, data) { const r = await supabase.from('trades').update(data).eq('id', id).select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)').single(); return r.data },
    },
    Dispute: {
      async filter(filters) {
        if (!isSupabaseConfigured) return []
        let q = supabase.from('disputes').select('*, trade:trades(*), raiser:profiles!raised_by(*)')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q.order('created_at', { ascending: false }).data) || []
      },
      async create(data) { const r = await supabase.from('disputes').insert(data).select().single(); return r.data },
      async update(id, data) { const r = await supabase.from('disputes').update(data).eq('id', id).select().single(); return r.data },
    },
    Review: {
      async filter(filters) {
        if (!isSupabaseConfigured) return []
        let q = supabase.from('reviews').select('*, trade:trades(*), reviewer:profiles!reviewer_id(*)')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q.order('created_at', { ascending: false }).data) || []
      },
      async create(data) { const r = await supabase.from('reviews').insert(data).select().single(); return r.data },
    },
  }
}
