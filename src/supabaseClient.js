import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

console.log('Supabase URL configurada:', !!supabaseUrl)
console.log('Supabase Key configurada:', !!supabaseAnonKey)

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => {
  const configured = !!(supabaseUrl && supabaseAnonKey && supabase)
  return configured
}
