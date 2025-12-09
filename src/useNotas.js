import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'notas-faculdade-data'
const USER_KEY = 'notas-faculdade-user'

// Dados iniciais com disciplinas reais
const disciplinasIniciais = [
  { id: 1, nome: "Algoritmos e Programação: Fundamentos", periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 9.2, gb: 7.8, notaFinal: 8.5, faltas: 0, semestreCursado: null },
  { id: 2, nome: "Computação: Conceitos e Tendências da Profissão", periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: null, gb: null, notaFinal: 9.0, faltas: 0, semestreCursado: null },
  { id: 3, nome: "Pensamento Computacional", periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 7.0, gb: 8.8, notaFinal: 8.3, faltas: 0, semestreCursado: "2025/1" },
  { id: 4, nome: "Pensamento Projetual e Criativo", periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 10.0, gb: 9.0, notaFinal: 9.3, faltas: 0, semestreCursado: "2025/1" },
  { id: 5, nome: "Processo de Software", periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 8.4, gb: 7.4, notaFinal: 7.7, faltas: 0, semestreCursado: "2025/1" },
  { id: 6, nome: "Engenharia de Software: Requisitos", periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 7, nome: "Matemática para Computação", periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 7.3, gb: 5.4, notaFinal: 6.0, faltas: 4, semestreCursado: null },
  { id: 8, nome: "Engenharia de Software: Fundamentos", periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 7.8, gb: 7.7, notaFinal: 7.7, faltas: 2, semestreCursado: null },
  { id: 9, nome: "Raciocínio Lógico", periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 5.6, gb: 7.2, notaFinal: 6.6, faltas: 0, semestreCursado: null },
  { id: 10, nome: "Cultura e Ecologia Integral", periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 9.6, gb: 10.0, notaFinal: 9.9, faltas: 0, semestreCursado: "2025/1" },
  { id: 11, nome: "Ética e Tecnocultura", periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 12, nome: "Fundamentos de Sistemas Operacionais", periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 6.7, gb: 8.2, notaFinal: 7.8, faltas: 1, semestreCursado: "2025/2" },
  { id: 13, nome: "Projeto de Sistemas Digitais", periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 14, nome: "Sistemas Digitais", periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 8.9, gb: 7.6, notaFinal: 8.0, faltas: 2, semestreCursado: null },
  { id: 15, nome: "Algoritmos e Programação: Estruturas Lineares", periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 16, nome: "Análise e Aplicação de Sistemas Operacionais", periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 8.0, gb: 10.0, notaFinal: 9.4, faltas: 0, semestreCursado: "2025/1" },
  { id: 17, nome: "Elaboração de Projetos", periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 18, nome: "Engenharia de Software: Análise", periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 8.9, gb: 8.0, notaFinal: 8.3, faltas: 0, semestreCursado: "2025/1" },
  { id: 19, nome: "Cálculo Diferencial", periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 6.7, gb: 9.6, notaFinal: 8.6, faltas: 0, semestreCursado: null },
  { id: 20, nome: "Design de Interação Humano-Computador", periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 6.0, gb: 10.0, notaFinal: 8.6, faltas: 1, semestreCursado: "2025/2" },
  { id: 21, nome: "Fundamentos de Álgebra Linear", periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 7.6, gb: 10.0, notaFinal: 9.3, faltas: 0, semestreCursado: "2025/2" },
  { id: 22, nome: "Fundamentos de Banco de Dados", periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 4.0, gb: 8.0, notaFinal: 6.8, faltas: 1, semestreCursado: "2025/2" },
  { id: 23, nome: "Paradigmas de Programação", periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 5.0, gb: 10.0, notaFinal: 8.5, faltas: 0, semestreCursado: "2025/2" },
  { id: 24, nome: "Redes de Computadores: Aplicação e Transporte", periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 25, nome: "Algoritmos e Programação: Árvores e Ordenação", periodo: 5, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 26, nome: "Análise e Projeto de Algoritmos", periodo: 5, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 27, nome: "Empreendedorismo e Solução de Problemas", periodo: 5, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "APROVADA", ga: 9.6, gb: 10.0, notaFinal: 9.9, faltas: 0, semestreCursado: "2025/2" },
  { id: 28, nome: "Engenharia de Software: Projeto", periodo: 5, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 29, nome: "Estágio", periodo: 5, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 30, nome: "Linguagens Formais e Autômatos", periodo: 5, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 31, nome: "Processamento Gráfico", periodo: 5, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 32, nome: "Arquitetura de Sistemas Digitais", periodo: 6, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 33, nome: "Cálculo Integral", periodo: 6, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 34, nome: "Controle Estatístico da Qualidade", periodo: 6, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 35, nome: "Inteligência Artificial e Aprendizado de Máquina", periodo: 6, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 36, nome: "Sistemas de Gerência de Banco de Dados", periodo: 6, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 37, nome: "Teoria da Computação", periodo: 6, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 38, nome: "Algoritmos e Programação: Grafos, Hashing e Heaps", periodo: 7, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 39, nome: "Computação Gráfica", periodo: 7, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 40, nome: "Engenharia de Software: Implementação e Testes", periodo: 7, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 41, nome: "Redes de Computadores: Internetworking, Roteamento e Transmissão", periodo: 7, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 42, nome: "Sistemas Distribuídos", periodo: 7, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 43, nome: "Teoria da Informação: Compressão e Criptografia", periodo: 7, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 44, nome: "Trabalho de Conclusão de Curso I", periodo: 7, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 45, nome: "Ciência de Dados e Big Data", periodo: 8, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 46, nome: "Computação de Alto Desempenho", periodo: 8, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 47, nome: "Internet das Coisas: Sensores, Protocolos e Aplicações", periodo: 8, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 48, nome: "Simulação e Modelagem de Sistemas", periodo: 8, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 49, nome: "Trabalho de Conclusão de Curso II", periodo: 8, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null },
  { id: 50, nome: "Tradutores", periodo: 8, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: "NAO_INICIADA", ga: null, gb: null, notaFinal: null, faltas: 0, semestreCursado: null }
]

const initialData = {
  disciplinas: disciplinasIniciais,
  lastUpdated: null
}

export function useNotas() {
  const [data, setData] = useState(initialData)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
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

  // Carregar dados do localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Erro ao carregar localStorage:', error)
    }
    return null
  }, [])

  // Salvar no localStorage
  const saveToLocalStorage = useCallback((newData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
    } catch (error) {
      console.error('Erro ao salvar localStorage:', error)
    }
  }, [])

  // Carregar usuário salvo
  const loadUser = useCallback(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
    }
    return null
  }, [])

  // Salvar usuário
  const saveUser = useCallback((userData) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
    }
  }, [])

  // Carregar do Supabase
  const loadFromSupabase = useCallback(async (userId) => {
    if (!supabase || !userId) {
      console.log('loadFromSupabase: supabase ou userId não disponível')
      return null
    }

    try {
      console.log('Carregando do Supabase para user:', userId)
      const { data: rows, error } = await supabase
        .from('notas_usuarios')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar Supabase:', error)
        return null
      }

      if (rows) {
        console.log('Dados carregados do Supabase:', rows.disciplinas?.length, 'disciplinas')
        return {
          disciplinas: rows.disciplinas || [],
          lastUpdated: rows.updated_at
        }
      }
    } catch (error) {
      console.error('Erro ao carregar Supabase:', error)
    }
    return null
  }, [])

  // Salvar no Supabase
  const saveToSupabase = useCallback(async (userId, newData) => {
    if (!supabase || !userId) {
      console.log('saveToSupabase: supabase ou userId não disponível')
      return false
    }

    if (!isOnline) {
      console.log('saveToSupabase: offline, não salvando')
      return false
    }

    setSyncing(true)
    try {
      console.log('Salvando no Supabase para user:', userId, 'disciplinas:', newData.disciplinas?.length)
      
      const { error } = await supabase
        .from('notas_usuarios')
        .upsert({
          user_id: userId,
          disciplinas: newData.disciplinas,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Erro ao salvar Supabase:', error)
        return false
      }

      console.log('Salvo no Supabase com sucesso!')
      setLastSync(new Date())
      return true
    } catch (error) {
      console.error('Erro ao salvar Supabase:', error)
      return false
    } finally {
      setSyncing(false)
    }
  }, [isOnline])

  // Inicialização
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      
      // Carregar usuário
      const savedUser = loadUser()
      setUser(savedUser)
      console.log('Usuário carregado:', savedUser?.email)

      // Carregar do localStorage primeiro (rápido)
      const localData = loadFromLocalStorage()
      if (localData) {
        setData(localData)
        console.log('Dados locais carregados:', localData.disciplinas?.length, 'disciplinas')
      }

      // Se tem Supabase configurado e usuário, sincronizar
      if (supabase && savedUser?.id && isOnline) {
        console.log('Tentando sincronizar com Supabase...')
        const cloudData = await loadFromSupabase(savedUser.id)
        
        if (cloudData && cloudData.disciplinas?.length > 0) {
          // Se dados da nuvem são mais recentes, usar eles
          const localTime = localData?.lastUpdated ? new Date(localData.lastUpdated) : new Date(0)
          const cloudTime = cloudData.lastUpdated ? new Date(cloudData.lastUpdated) : new Date(0)
          
          if (cloudTime > localTime) {
            console.log('Usando dados da nuvem (mais recentes)')
            setData(cloudData)
            saveToLocalStorage(cloudData)
          } else if (localData) {
            console.log('Dados locais mais recentes, enviando para nuvem')
            await saveToSupabase(savedUser.id, localData)
          }
          setLastSync(new Date())
        } else if (localData && localData.disciplinas?.length > 0) {
          // Não tem dados na nuvem, enviar dados locais
          console.log('Nuvem vazia, enviando dados locais')
          await saveToSupabase(savedUser.id, localData)
        }
      }

      setLoading(false)
    }

    init()
  }, [])

  // Atualizar disciplinas
  const setDisciplinas = useCallback(async (disciplinasOrUpdater) => {
    const newDisciplinas = typeof disciplinasOrUpdater === 'function'
      ? disciplinasOrUpdater(data.disciplinas)
      : disciplinasOrUpdater

    const newData = {
      disciplinas: newDisciplinas,
      lastUpdated: new Date().toISOString()
    }

    setData(newData)
    saveToLocalStorage(newData)

    // Sincronizar com Supabase se configurado e logado
    if (supabase && user?.id) {
      console.log('Salvando alteração no Supabase...')
      await saveToSupabase(user.id, newData)
    }
  }, [data.disciplinas, user, saveToLocalStorage, saveToSupabase])

  // Login/Registro
  const login = useCallback(async (email) => {
    const userId = btoa(email).replace(/[^a-zA-Z0-9]/g, '')
    const userData = { id: userId, email, createdAt: new Date().toISOString() }
    
    console.log('Login com email:', email, 'userId:', userId)
    saveUser(userData)

    // Tentar carregar dados existentes do Supabase
    if (supabase && isOnline) {
      console.log('Verificando dados na nuvem...')
      const cloudData = await loadFromSupabase(userId)
      if (cloudData && cloudData.disciplinas?.length > 0) {
        console.log('Dados encontrados na nuvem, carregando...')
        setData(cloudData)
        saveToLocalStorage(cloudData)
        setLastSync(new Date())
      } else {
        // Enviar dados locais para a nuvem
        console.log('Nenhum dado na nuvem, enviando dados locais...')
        const localData = loadFromLocalStorage() || data
        await saveToSupabase(userId, localData)
      }
    }

    return userData
  }, [data, saveUser, loadFromSupabase, saveToSupabase, saveToLocalStorage, isOnline, loadFromLocalStorage])

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  // Forçar sincronização
  const forceSync = useCallback(async () => {
    if (!user?.id) {
      console.log('forceSync: usuário não logado')
      return false
    }
    
    if (!isOnline) {
      console.log('forceSync: offline')
      return false
    }

    if (!supabase) {
      console.log('forceSync: supabase não configurado')
      return false
    }
    
    setSyncing(true)
    try {
      console.log('Forçando sincronização...')
      const cloudData = await loadFromSupabase(user.id)
      
      if (cloudData && cloudData.disciplinas?.length > 0) {
        const localTime = data.lastUpdated ? new Date(data.lastUpdated) : new Date(0)
        const cloudTime = cloudData.lastUpdated ? new Date(cloudData.lastUpdated) : new Date(0)
        
        if (cloudTime > localTime) {
          console.log('Atualizando com dados da nuvem')
          setData(cloudData)
          saveToLocalStorage(cloudData)
        } else {
          console.log('Enviando dados locais para nuvem')
          await saveToSupabase(user.id, data)
        }
      } else {
        console.log('Nuvem vazia, enviando dados locais')
        await saveToSupabase(user.id, data)
      }
      
      setLastSync(new Date())
      return true
    } catch (error) {
      console.error('Erro na sincronização:', error)
      return false
    } finally {
      setSyncing(false)
    }
  }, [user, data, isOnline, loadFromSupabase, saveToSupabase, saveToLocalStorage])

  return {
    disciplinas: data.disciplinas,
    setDisciplinas,
    user,
    login,
    logout,
    loading,
    syncing,
    lastSync,
    isOnline,
    isSupabaseConfigured: isSupabaseConfigured(),
    forceSync
  }
}
