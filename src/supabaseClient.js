import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Email do administrador (único que pode editar)
export const ADMIN_EMAIL = 'eproencad@gmail.com'

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => {
  const configured = !!(supabaseUrl && supabaseAnonKey && supabase)
  return configured
}

// Funções de autenticação
export const signUp = async (email, password) => {
  if (!supabase) return { error: { message: 'Supabase não configurado' } }
  return await supabase.auth.signUp({ email, password })
}

export const signIn = async (email, password) => {
  if (!supabase) return { error: { message: 'Supabase não configurado' } }
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signOut = async () => {
  if (!supabase) return { error: { message: 'Supabase não configurado' } }
  return await supabase.auth.signOut()
}

export const getSession = async () => {
  if (!supabase) return { data: { session: null } }
  return await supabase.auth.getSession()
}

export const onAuthStateChange = (callback) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}
