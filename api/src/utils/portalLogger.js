/**
 * Logger persistido para requisições do portal Unisinos.
 * Mantém os últimos 100 registros em memória + persiste erros no Supabase.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

const supabase =
  config.supabaseUrl && config.supabaseServiceKey
    ? createClient(config.supabaseUrl, config.supabaseServiceKey)
    : null;

const MAX_MEMORY = 100;
const memoryLogs = [];

/**
 * Registra uma tentativa de scraping do portal.
 * @param {object} entry
 * @param {string} entry.ra - RA do aluno (mascarado)
 * @param {string} entry.tipo - 'horarios' | 'cadeiras' | 'notas' etc
 * @param {boolean} entry.success
 * @param {string|null} entry.error - mensagem de erro se falhou
 * @param {number} entry.duration - ms
 */
export async function logPortalRequest({ ra, tipo = 'horarios', success, error = null, duration = 0 }) {
  const raMasked = ra ? ra.slice(0, 3) + '***' + ra.slice(-2) : 'desconhecido';
  const entry = {
    timestamp: new Date().toISOString(),
    ra: raMasked,
    tipo,
    success,
    error,
    duration,
  };

  // Salva em memória
  memoryLogs.unshift(entry);
  if (memoryLogs.length > MAX_MEMORY) memoryLogs.pop();

  // Persiste no Supabase (silencioso se falhar)
  if (supabase) {
    try {
      await supabase.from('portal_logs').insert({
        ra_masked: raMasked,
        tipo,
        success,
        error_msg: error,
        duration_ms: duration,
      });
    } catch { /* silencioso */ }
  }
}

/**
 * Retorna os logs em memória (mais recentes primeiro).
 */
export function getPortalLogs(limit = 50) {
  return memoryLogs.slice(0, limit);
}
