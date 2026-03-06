import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'


/**
 * Get a fresh access token, refreshing the session if needed.
 * Falls back to localStorage token if getSession hangs (known Supabase bug).
 */
export async function getFreshToken(supabaseClient) {
  if (!supabaseClient) return null;

  // Try refreshing via localStorage first (avoids getSession() hang)
  const ref = supabaseClient.supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
  const storageKey = `sb-${ref}-auth-token`;
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;

  try {
    const sessionData = JSON.parse(stored);
    const expiresAt = sessionData?.expires_at; // unix timestamp in seconds
    const now = Math.floor(Date.now() / 1000);

    // If token expires in less than 5 minutes, refresh it
    if (expiresAt && expiresAt - now < 300) {
      const refreshToken = sessionData?.refresh_token;
      if (refreshToken) {
        const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });
        if (!error && data?.session?.access_token) {
          return data.session.access_token;
        }
      }
    }

    return sessionData?.access_token || null;
  } catch {
    return null;
  }
}

function humanizeSupabaseError(error) {
  const msg = error?.message || '';
  if (msg.includes('duplicate key') || msg.includes('unique')) {
    return 'Disciplina duplicada. Já existe uma com esse nome neste período.';
  }
  if (msg.includes('permission denied') || msg.includes('row-level security')) {
    return 'Sem permissão. Faça login novamente.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  return 'Erro ao salvar dados. Tente novamente.';
}

export function useNotas() {
  const { user } = useAuth()
  const [disciplinas, setDisciplinasState] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitorar conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carregar disciplinas do usuário
  const loadDisciplinas = useCallback(async () => {
    if (!user || !supabase) {
      setDisciplinasState([])
      setLoading(false)
      return
    }

    setSyncing(true)
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('*')
        .eq('user_id', user.id)
        .order('periodo', { ascending: true })
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar disciplinas:', error)
        setDisciplinasState([])
      } else {
        setDisciplinasState(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar:', error)
      setDisciplinasState([])
    } finally {
      setSyncing(false)
      setLoading(false)
    }
  }, [user])

  // Carregar ao iniciar ou quando user mudar
  useEffect(() => {
    loadDisciplinas()
  }, [loadDisciplinas])

  // Adicionar disciplina
  const adicionarDisciplina = useCallback(async (disciplina) => {
    if (!user || !supabase) return { error: 'Não autenticado' }

    setSyncing(true)
    try {
      const novaDisciplina = {
        ...disciplina,
        user_id: user.id,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('disciplinas')
        .insert([novaDisciplina])
        .select()
        .single()

      if (error) {
        console.error('Erro ao adicionar:', error)
        return { error: humanizeSupabaseError(error) }
      }

      setDisciplinasState(prev => [...prev, data])
      return { data }
    } finally {
      setSyncing(false)
    }
  }, [user])

  // Atualizar disciplina
  const atualizarDisciplina = useCallback(async (id, updates) => {
    if (!user || !supabase) return { error: 'Não autenticado' }

    setSyncing(true)
    try {
      // fetch() direto — supabase client .update() trava (bug v2.87.1)
      const accessToken = await getFreshToken(supabase)
      if (!accessToken) return { error: 'Sessão expirada. Faça login novamente.' }

      const baseUrl = supabase.supabaseUrl
      const apiKey = supabase.supabaseKey
      const url = `${baseUrl}/rest/v1/disciplinas?id=eq.${id}&user_id=eq.${user.id}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.text()
        console.error('Erro ao atualizar:', body)
        return { error: `Erro ${res.status}: ${body}` }
      }

      const rows = await res.json()
      const data = rows[0]
      if (data) {
        setDisciplinasState(prev =>
          prev.map(d => d.id === id ? data : d)
        )
      }
      return { data }
    } catch (err) {
      console.error('Erro ao atualizar:', err)
      return { error: err.name === 'AbortError' ? 'Timeout na atualização' : err.message }
    } finally {
      setSyncing(false)
    }
  }, [user])

  // Remover disciplina
  const removerDisciplina = useCallback(async (id) => {
    if (!user || !supabase) return { error: 'Não autenticado' }

    setSyncing(true)
    try {
      const { error } = await supabase
        .from('disciplinas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao remover:', error)
        return { error: humanizeSupabaseError(error) }
      }

      setDisciplinasState(prev => prev.filter(d => d.id !== id))
      return { success: true }
    } finally {
      setSyncing(false)
    }
  }, [user])

  // Atualizar várias disciplinas de uma vez (para compatibilidade)
  const setDisciplinas = useCallback(async (disciplinasOrUpdater) => {
    if (!user || !supabase) return

    const newDisciplinas = typeof disciplinasOrUpdater === 'function'
      ? disciplinasOrUpdater(disciplinas)
      : disciplinasOrUpdater

    // Encontrar disciplinas modificadas
    for (const nova of newDisciplinas) {
      const antiga = disciplinas.find(d => d.id === nova.id)
      if (!antiga) {
        // Nova disciplina
        await adicionarDisciplina(nova)
      } else if (JSON.stringify(antiga) !== JSON.stringify(nova)) {
        // Disciplina modificada
        await atualizarDisciplina(nova.id, nova)
      }
    }

    // Encontrar disciplinas removidas
    for (const antiga of disciplinas) {
      if (!newDisciplinas.find(d => d.id === antiga.id)) {
        await removerDisciplina(antiga.id)
      }
    }
  }, [user, disciplinas, adicionarDisciplina, atualizarDisciplina, removerDisciplina])

  // Forçar sincronização
  const forceSync = useCallback(async () => {
    await loadDisciplinas()
    return true
  }, [loadDisciplinas])

  // Importar disciplinas via fetch direto (supabase client .insert() trava)
  const importarDisciplinas = useCallback(async (listaDisciplinas, onProgress) => {
    if (!user || !supabase) return { error: 'Não autenticado' }

    setSyncing(true)
    const total = listaDisciplinas.length
    let inseridos = 0
    let erros = 0
    try {
      const accessToken = await getFreshToken(supabase)
      if (!accessToken) {
        return { error: 'Sessão expirada. Faça login novamente.' }
      }

      const baseUrl = supabase.supabaseUrl
      const apiKey = supabase.supabaseKey
      const url = `${baseUrl}/rest/v1/disciplinas`

      const disciplinasComUser = listaDisciplinas.map(d => ({
        ...d,
        user_id: user.id,
        created_at: new Date().toISOString()
      }))

      console.log(`[import] iniciando ${total} disciplinas, user_id: ${user.id}`)
      console.log('[import] url:', url)
      console.log('[import] exemplo:', JSON.stringify(disciplinasComUser[0]))

      // Inserts em grupos pequenos com progresso
      const PARALLEL = 5
      for (let i = 0; i < disciplinasComUser.length; i += PARALLEL) {
        const grupo = disciplinasComUser.slice(i, i + PARALLEL)
        const resultados = await Promise.all(
          grupo.map(async (d) => {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)
            try {
              const res = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': apiKey,
                  'Authorization': `Bearer ${accessToken}`,
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify(d),
                signal: controller.signal,
              })
              clearTimeout(timeoutId)
              if (!res.ok) {
                const body = await res.text()
                return { error: `${res.status}: ${body}` }
              }
              return { data: true }
            } catch (err) {
              clearTimeout(timeoutId)
              return { error: err.name === 'AbortError' ? 'timeout' : err.message }
            }
          })
        )
        for (const r of resultados) {
          if (r.error) {
            erros++
            console.error('[import] erro insert:', r.error)
          } else inseridos++
        }
        console.log(`[import] progresso: ${inseridos}/${total} ok, ${erros} erros`)
        onProgress?.(inseridos, total)
      }

      if (erros > 0) {
        console.warn(`[import] ${erros}/${total} falharam`)
      }

      // Reload não-bloqueante (supabase client pode travar no .select())
      loadDisciplinas().catch(() => {})
      return erros > 0
        ? { error: `${inseridos} importada(s), ${erros} falharam.` }
        : { data: true }
    } catch (err) {
      console.error('[import] erro geral:', err)
      return { error: err.message || 'Erro ao importar disciplinas' }
    } finally {
      setSyncing(false)
    }
  }, [user, loadDisciplinas])

  return {
    disciplinas,
    setDisciplinas,
    adicionarDisciplina,
    atualizarDisciplina,
    removerDisciplina,
    importarDisciplinas,
    loading,
    syncing,
    isOnline,
    forceSync,
    user
  }
}
