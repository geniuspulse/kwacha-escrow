import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database entity helpers
export const db = {
  entities: {
    Profile: {
      async list() { return (await supabase.from('profiles').select('*')).data || [] },
      async get(id) { return (await supabase.from('profiles').select('*').eq('id', id).single()).data },
      async filter(filters) {
        let q = supabase.from('profiles').select('*')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q).data || []
      },
      async create(data) { return (await supabase.from('profiles').insert(data).select().single()).data },
      async update(id, data) { return (await supabase.from('profiles').update(data).eq('id', id).select().single()).data },
    },
    Offer: {
      async list() { return (await supabase.from('offers').select('*, profile:profiles!seller_id(*)')).data || [] },
      async get(id) { return (await supabase.from('offers').select('*, profile:profiles!seller_id(*)').eq('id', id).single()).data },
      async filter(filters) {
        let q = supabase.from('offers').select('*, profile:profiles!seller_id(*)')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q.order('created_at', { ascending: false }).limit(100)).data || []
      },
      async create(data) { return (await supabase.from('offers').insert(data).select('*, profile:profiles!seller_id(*)').single()).data },
      async update(id, data) { return (await supabase.from('offers').update(data).eq('id', id).select().single()).data },
      async delete(id) { return (await supabase.from('offers').delete().eq('id', id)) },
    },
    Trade: {
      async list() { return (await supabase.from('trades').select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')).data || [] },
      async get(id) { return (await supabase.from('trades').select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)').eq('id', id).single()).data },
      async filter(filters) {
        let q = supabase.from('trades').select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q.order('created_at', { ascending: false }).limit(50)).data || []
      },
      async create(data) { return (await supabase.from('trades').insert(data).select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)').single()).data },
      async update(id, data) { return (await supabase.from('trades').update(data).eq('id', id).select('*, offer:offers(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)').single()).data },
    },
    Dispute: {
      async filter(filters) {
        let q = supabase.from('disputes').select('*, trade:trades(*), raiser:profiles!raised_by(*)')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q.order('created_at', { ascending: false }).limit(50)).data || []
      },
      async create(data) { return (await supabase.from('disputes').insert(data).select().single()).data },
      async update(id, data) { return (await supabase.from('disputes').update(data).eq('id', id).select().single()).data },
    },
    Review: {
      async filter(filters) {
        let q = supabase.from('reviews').select('*, trade:trades(*), reviewer:profiles!reviewer_id(*)')
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
        return (await q.order('created_at', { ascending: false })).data || []
      },
      async create(data) { return (await supabase.from('reviews').insert(data).select().single()).data },
    },
  }
}
