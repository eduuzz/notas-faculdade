import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

const supabase =
  config.supabaseUrl && config.supabaseServiceKey
    ? createClient(config.supabaseUrl, config.supabaseServiceKey)
    : null;

export async function requireAuth(req, res, next) {
  // Modo desenvolvimento: se Supabase não está configurado, permite todas as requisições
  if (!supabase) {
    req.user = { id: 'dev', email: 'dev@local' };
    return next();
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Token não fornecido' } });
  }

  const token = header.slice(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: { message: 'Token inválido ou expirado' } });
    }

    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Falha ao verificar autenticação' } });
  }
}
