import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas.')
}

// Portal não usa Supabase Auth — o acesso do representante é por PIN,
// validado via RPC. persistSession fica desligado porque não há sessão
// de auth pra guardar; a "sessão" do rep é o PIN salvo no localStorage.
export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
})
