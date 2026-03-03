import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'


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
      const { data, error } = await supabase
        .from('disciplinas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar:', error)
        return { error: humanizeSupabaseError(error) }
      }

      setDisciplinasState(prev => 
        prev.map(d => d.id === id ? data : d)
      )
      return { data }
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

  // Importar disciplinas — inserts individuais em paralelo (grupos de 5)
  const importarDisciplinas = useCallback(async (listaDisciplinas) => {
    if (!user || !supabase) return { error: 'Não autenticado' }

    setSyncing(true)
    try {
      const disciplinasComUser = listaDisciplinas.map(d => ({
        ...d,
        user_id: user.id,
        created_at: new Date().toISOString()
      }))

      const PARALLEL = 5
      let erros = 0

      for (let i = 0; i < disciplinasComUser.length; i += PARALLEL) {
        const grupo = disciplinasComUser.slice(i, i + PARALLEL)

        const resultados = await Promise.all(
          grupo.map(d =>
            supabase.from('disciplinas').insert([d]).select().single()
          )
        )

        for (const r of resultados) {
          if (r.error) {
            console.error('[import] erro individual:', r.error)
            erros++
          }
        }
      }

      // Recarregar todas as disciplinas do banco
      await loadDisciplinas()

      if (erros > 0) {
        return { error: `${erros} disciplina(s) falharam ao salvar.` }
      }
      return { data: true }
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
