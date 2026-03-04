import { supabase } from '../supabaseClient';

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function getOrCreateShareToken(userId) {
  // Verificar se já existe um token ativo
  const { data: existing } = await supabase
    .from('shared_grades')
    .select('share_token')
    .eq('user_id', userId)
    .eq('active', true)
    .single();

  if (existing?.share_token) return existing.share_token;

  // Criar novo token
  const token = generateToken();
  const ref = supabase.supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
  const stored = ref ? localStorage.getItem(`sb-${ref}-auth-token`) : null;
  let parsedToken = null;
  try {
    const parsed = JSON.parse(stored);
    parsedToken = parsed?.access_token;
  } catch {}
  if (!parsedToken) throw new Error('Sessão expirada. Faça login novamente.');

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || supabase.supabaseUrl}/rest/v1/shared_grades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || supabase.supabaseKey,
      'Authorization': `Bearer ${parsedToken}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ user_id: userId, share_token: token, active: true }),
  });

  if (!res.ok) throw new Error('Erro ao criar link de compartilhamento');
  return token;
}

export async function revokeShareToken(userId) {
  const { error } = await supabase
    .from('shared_grades')
    .update({ active: false })
    .eq('user_id', userId)
    .eq('active', true);

  if (error) throw error;
}

export async function fetchSharedGrade(token) {
  const { data, error } = await supabase.rpc('get_shared_grade', { p_token: token });
  if (error) throw error;
  return data;
}
