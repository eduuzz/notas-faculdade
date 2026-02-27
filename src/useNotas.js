import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

// Disciplinas de exemplo para novos usuários
const DISCIPLINAS_EXEMPLO = [
  { nome: 'Introdução à Programação', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null, observacao: '' },
  { nome: 'Cálculo Diferencial', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null, observacao: '' },
  { nome: 'Estrutura de Dados', periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null, observacao: '' },
  { nome: 'Banco de Dados', periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null, observacao: '' },
];

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

  // Criar disciplinas de exemplo para novo usuário
  const criarDisciplinasExemplo = useCallback(async (userId) => {
    if (!supabase) return [];
    
    // Verificar se já existem disciplinas (evita duplicação)
    const { data: existentes } = await supabase
      .from('disciplinas')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    if (existentes && existentes.length > 0) {
      return []; // Já tem disciplinas, não criar exemplos
    }
    
    try {
      const disciplinasComUser = DISCIPLINAS_EXEMPLO.map(d => ({
        ...d,
        user_id: userId,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('disciplinas')
        .insert(disciplinasComUser)
        .select();

      if (error) {
        console.error('Erro ao criar disciplinas de exemplo:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao criar disciplinas de exemplo:', error);
      return [];
    }
  }, []);

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
      } else if (!data || data.length === 0) {
        // Novo usuário - criar disciplinas de exemplo
        const exemplos = await criarDisciplinasExemplo(user.id);
        setDisciplinasState(exemplos);
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
  }, [user, criarDisciplinasExemplo])

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
        return { error: error.message }
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
        return { error: error.message }
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
        return { error: error.message }
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

  // Importar disciplinas em lote
  const importarDisciplinas = useCallback(async (listaDisciplinas) => {
    if (!user || !supabase) return { error: 'Não autenticado' }

    setSyncing(true)
    try {
      const disciplinasComUser = listaDisciplinas.map(d => ({
        ...d,
        user_id: user.id,
        created_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('disciplinas')
        .insert(disciplinasComUser)
        .select()

      if (error) {
        console.error('Erro ao importar:', error)
        return { error: error.message }
      }

      setDisciplinasState(prev => [...prev, ...data])
      return { data }
    } finally {
      setSyncing(false)
    }
  }, [user])

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
