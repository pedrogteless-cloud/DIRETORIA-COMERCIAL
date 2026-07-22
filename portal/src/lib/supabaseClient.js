import { createClient } from '@supabase/supabase-js'

// Chave pública (anon) do Supabase. Ela é feita pra ir no bundle do cliente
// — quem protege os dados é o RLS (o portal só enxerga preço, promoção,
// catálogo e materiais; comissão/carteira ficam bloqueadas). Fica embutida
// como fallback pra o deploy funcionar mesmo sem variável de ambiente
// configurada na Vercel; se as env vars existirem, elas têm prioridade.
const FALLBACK_URL = 'https://cjbphkkiundukpkjufvj.supabase.co'
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYnBoa2tpdW5kdWtwa2p1ZnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMjI5NzEsImV4cCI6MjA5OTc5ODk3MX0.BS53w2fgUMZ_y-mqje-10mOXjOpn_naCT316IJfTEhw'

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY

// Portal não usa Supabase Auth — o acesso do representante é por PIN,
// validado via RPC. persistSession fica desligado porque não há sessão
// de auth pra guardar; a "sessão" do rep é o PIN salvo no localStorage.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
