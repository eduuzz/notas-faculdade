import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured, signIn, signUp, signOut, getSession, onAuthStateChange, ADMIN_EMAIL } from './supabaseClient'

const STORAGE_KEY = 'notas-faculdade-data'

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
  const [isAdmin, setIsAdmin] = useState(false)
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

  // Carregar do Supabase
  const loadFromSupabase = useCallback(async () => {
    if (!supabase) return null
    
    setSyncing(true)
    try {
      // Carregar dados do admin (fixo)
      const adminId = btoa(ADMIN_EMAIL).replace(/[^a-zA-Z0-9]/g, '')
      
      const { data: result, error } = await supabase
        .from('notas_usuarios')
        .select('disciplinas, updated_at')
        .eq('user_id', adminId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar do Supabase:', error)
        return null
      }
      
      if (result?.disciplinas) {
        return {
          disciplinas: result.disciplinas,
          lastUpdated: result.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao carregar do Supabase:', error)
      return null
    } finally {
      setSyncing(false)
    }
  }, [])

  // Salvar no Supabase (apenas admin)
  const saveToSupabase = useCallback(async (newData) => {
    if (!supabase || !isAdmin) return false
    
    setSyncing(true)
    try {
      const adminId = btoa(ADMIN_EMAIL).replace(/[^a-zA-Z0-9]/g, '')
      
      const { error } = await supabase
        .from('notas_usuarios')
        .upsert({
          user_id: adminId,
          disciplinas: newData.disciplinas,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      
      if (error) {
        console.error('Erro ao salvar no Supabase:', error)
        return false
      }
      
      setLastSync(new Date())
      return true
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error)
      return false
    } finally {
      setSyncing(false)
    }
  }, [isAdmin])

  // Monitorar mudanças de autenticação
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      
      // Verificar sessão existente
      const { data: { session } } = await getSession()
      
      if (session?.user) {
        const email = session.user.email
        setUser({ id: session.user.id, email })
        setIsAdmin(email === ADMIN_EMAIL)
      }
      
      // Carregar dados
      const localData = loadFromLocalStorage()
      
      if (supabase && isOnline) {
        const cloudData = await loadFromSupabase()
        if (cloudData?.disciplinas?.length > 0) {
          setData(cloudData)
          saveToLocalStorage(cloudData)
        } else if (localData?.disciplinas?.length > 0) {
          setData(localData)
        }
      } else if (localData?.disciplinas?.length > 0) {
        setData(localData)
      }
      
      setLoading(false)
    }

    init()

    // Listener para mudanças de auth
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (session?.user) {
        const email = session.user.email
        setUser({ id: session.user.id, email })
        setIsAdmin(email === ADMIN_EMAIL)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  // Atualizar disciplinas (apenas admin)
  const setDisciplinas = useCallback(async (disciplinasOrUpdater) => {
    if (!isAdmin) {
      console.warn('Apenas o administrador pode modificar dados')
      return
    }

    const newDisciplinas = typeof disciplinasOrUpdater === 'function'
      ? disciplinasOrUpdater(data.disciplinas)
      : disciplinasOrUpdater

    const newData = {
      disciplinas: newDisciplinas,
      lastUpdated: new Date().toISOString()
    }

    setData(newData)
    saveToLocalStorage(newData)

    // Sincronizar com Supabase
    if (supabase && isOnline) {
      await saveToSupabase(newData)
    }
  }, [data.disciplinas, isAdmin, isOnline, saveToLocalStorage, saveToSupabase])

  // Login com senha
  const login = useCallback(async (email, password) => {
    const { data: authData, error } = await signIn(email, password)
    
    if (error) {
      return { error }
    }
    
    if (authData?.user) {
      setUser({ id: authData.user.id, email: authData.user.email })
      setIsAdmin(authData.user.email === ADMIN_EMAIL)
      
      // Carregar dados mais recentes
      if (supabase && isOnline) {
        const cloudData = await loadFromSupabase()
        if (cloudData?.disciplinas?.length > 0) {
          setData(cloudData)
          saveToLocalStorage(cloudData)
        }
      }
      
      return { user: authData.user }
    }
    
    return { error: { message: 'Erro desconhecido' } }
  }, [isOnline, loadFromSupabase, saveToLocalStorage])

  // Registrar conta
  const register = useCallback(async (email, password) => {
    const { data: authData, error } = await signUp(email, password)
    
    if (error) {
      return { error }
    }
    
    return { user: authData?.user, message: 'Verifique seu email para confirmar a conta' }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    await signOut()
    setUser(null)
    setIsAdmin(false)
  }, [])

  // Forçar sincronização
  const forceSync = useCallback(async () => {
    if (!isOnline || !supabase) return false
    
    setSyncing(true)
    try {
      const cloudData = await loadFromSupabase()
      
      if (cloudData?.disciplinas?.length > 0) {
        setData(cloudData)
        saveToLocalStorage(cloudData)
        setLastSync(new Date())
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erro na sincronização:', error)
      return false
    } finally {
      setSyncing(false)
    }
  }, [isOnline, loadFromSupabase, saveToLocalStorage])

  return {
    disciplinas: data.disciplinas,
    setDisciplinas,
    user,
    isAdmin,
    login,
    register,
    logout,
    loading,
    syncing,
    lastSync,
    isOnline,
    isSupabaseConfigured: isSupabaseConfigured(),
    forceSync
  }
}
