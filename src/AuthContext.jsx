import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userCurso, setUserCurso] = useState(null);
  const [userPlano, setUserPlano] = useState(null);
  const [userPlanoExpiraEm, setUserPlanoExpiraEm] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const isInitialLoad = useRef(true);

  const verificarAutorizacao = useCallback(async (email) => {
    if (!email || !supabase) return false;
    try {
      const { data, error } = await supabase
        .from('usuarios_autorizados')
        .select('id, nome, curso, plano, plano_expira_em')
        .eq('email', email.toLowerCase())
        .eq('ativo', true)
        .single();
      if (!error && data) {
        setUserName(data.nome || null);
        setUserCurso(data.curso || null);
        setUserPlano(data.plano || 'pro');
        setUserPlanoExpiraEm(data.plano_expira_em || null);
        // Se não tem curso, é novo usuário
        setIsNewUser(!data.curso);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  // Função para atualizar o curso do usuário
  const updateUserCurso = useCallback(async (curso) => {
    if (!user || !supabase) {
      console.error('updateUserCurso: Não autenticado');
      return { error: 'Não autenticado' };
    }
    try {
      console.log('Salvando curso:', curso, 'para email:', user.email);
      
      const { data, error } = await supabase
        .from('usuarios_autorizados')
        .update({ curso })
        .eq('email', user.email.toLowerCase())
        .select();
      
      if (error) {
        console.error('Erro ao salvar curso:', error);
        return { error: error.message };
      }
      
      console.log('Curso salvo com sucesso:', data);
      setUserCurso(curso);
      setIsNewUser(false);
      return { success: true };
    } catch (err) {
      console.error('Erro inesperado:', err);
      return { error: err.message };
    }
  }, [user]);

  // Função para atualizar perfil completo (nome e curso)
  const updateUserProfile = useCallback(async (nome, curso) => {
    if (!user || !supabase) return { error: 'Não autenticado' };
    try {
      const { error } = await supabase
        .from('usuarios_autorizados')
        .update({ nome, curso })
        .eq('email', user.email.toLowerCase());
      
      if (error) {
        return { error: error.message };
      }
      
      setUserName(nome || null);
      setUserCurso(curso || null);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Timeout de segurança - 5 segundos
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth timeout - forçando fim do loading');
        setLoading(false);
      }
    }, 5000);

    // Carregar sessão existente E VERIFICAR AUTORIZAÇÃO
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            // CORREÇÃO: Verificar se o usuário está autorizado
            const autorizado = await verificarAutorizacao(session.user.email);
            
            if (autorizado) {
              setUser(session.user);
            } else {
              // Usuário não autorizado - fazer logout
              await supabase.auth.signOut();
              setUser(null);
              setAuthError('Email não autorizado. Realize o pagamento primeiro.');
            }
          } else {
            setUser(null);
          }
          setLoading(false);
          isInitialLoad.current = false;
        }
      } catch (err) {
        console.error('Erro ao carregar sessão:', err);
        if (mounted) {
          setLoading(false);
          isInitialLoad.current = false;
        }
      }
    };

    loadSession();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Ignorar eventos durante carregamento inicial
        if (isInitialLoad.current) {
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthError(null);
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          // Novo login ou refresh - verificar autorização
          let autorizado = await verificarAutorizacao(session.user.email);
          
          // Se não está autorizado, criar automaticamente com plano gratuito
          if (!autorizado) {
            const dataExpiracao = new Date();
            dataExpiracao.setMonth(dataExpiracao.getMonth() + 6); // 6 meses grátis
            
            const { error: insertError } = await supabase
              .from('usuarios_autorizados')
              .insert([{
                email: session.user.email.toLowerCase(),
                ativo: true,
                nome: null,
                curso: null,
                plano: 'gratuito',
                plano_expira_em: dataExpiracao.toISOString()
              }]);
            
            if (!insertError) {
              autorizado = await verificarAutorizacao(session.user.email);
            }
          }
          
          if (mounted) {
            if (autorizado) {
              setUser(session.user);
              setAuthError(null);
            } else {
              // Só faz logout se realmente não conseguiu criar/verificar
              await supabase.auth.signOut();
              setUser(null);
              setAuthError('Erro ao criar conta. Tente novamente.');
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [verificarAutorizacao, loading]);

  const signInWithEmail = async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
    setAuthError(null);
    
    // Tentar login primeiro
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setAuthError(error.message);
      return { data, error };
    }
    
    // Login bem sucedido - verificar se está na tabela usuarios_autorizados
    const autorizado = await verificarAutorizacao(email);
    
    // Se não está autorizado, criar automaticamente com plano gratuito
    if (!autorizado) {
      const dataExpiracao = new Date();
      dataExpiracao.setMonth(dataExpiracao.getMonth() + 6); // 6 meses grátis
      
      const { error: insertError } = await supabase
        .from('usuarios_autorizados')
        .insert([{
          email: email.toLowerCase(),
          ativo: true,
          nome: null,
          curso: null,
          plano: 'gratuito',
          plano_expira_em: dataExpiracao.toISOString()
        }]);
      
      if (!insertError) {
        // Re-verificar autorização para pegar os dados
        await verificarAutorizacao(email);
      }
    }
    
    return { data, error };
  };

  const signUpWithEmail = async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
    setAuthError(null);
    
    // Verificar se já existe na lista de autorizados
    const jaAutorizado = await verificarAutorizacao(email);
    
    // Criar conta no Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
      return { data: null, error };
    }
    
    // Se não está autorizado, criar automaticamente com plano gratuito (6 meses)
    if (!jaAutorizado) {
      const dataExpiracao = new Date();
      dataExpiracao.setMonth(dataExpiracao.getMonth() + 6); // 6 meses grátis
      
      const { error: insertError } = await supabase
        .from('usuarios_autorizados')
        .insert([{
          email: email.toLowerCase(),
          ativo: true,
          nome: null,
          curso: null,
          plano: 'gratuito',
          plano_expira_em: dataExpiracao.toISOString()
        }]);
      
      if (insertError) {
        console.error('Erro ao criar usuário gratuito:', insertError);
        // Se falhar, ainda deixa criar a conta (admin pode ajustar depois)
      }
    }
    
    return { data, error: null };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
    setAuthError(null);
    // Nota: A verificação do Google é feita no onAuthStateChange após o redirect
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signOut = async () => {
    if (!supabase) return { error: { message: 'Supabase não configurado' } };
    setUser(null);
    setAuthError(null);
    return await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, userName, userCurso, userPlano, userPlanoExpiraEm, isNewUser, loading, authError,
      signInWithEmail, signUpWithEmail, signInWithGoogle,
      signOut, verificarAutorizacao, clearAuthError, updateUserCurso, updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
