import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userCurso, setUserCurso] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const isInitialLoad = useRef(true);

  const verificarAutorizacao = useCallback(async (email) => {
    if (!email || !supabase) return false;
    try {
      const { data, error } = await supabase
        .from('usuarios_autorizados')
        .select('id, nome, curso, plano')
        .eq('email', email.toLowerCase())
        .eq('ativo', true)
        .single();
      if (!error && data) {
        setUserName(data.nome || null);
        setUserCurso(data.curso || null);
        setIsNewUser(!data.curso);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  // Auto-create user in usuarios_autorizados if not exists
  const autoCreateUser = useCallback(async (email) => {
    if (!email || !supabase) return false;
    const { error: insertError } = await supabase
      .from('usuarios_autorizados')
      .insert([{
        email: email.toLowerCase(),
        ativo: true,
        nome: null,
        curso: null,
      }]);
    if (!insertError) {
      return await verificarAutorizacao(email);
    }
    return false;
  }, [verificarAutorizacao]);

  // Função para atualizar o curso do usuário
  const updateUserCurso = useCallback(async (curso) => {
    if (!user || !supabase) {
      console.error('updateUserCurso: Não autenticado');
      return { error: 'Não autenticado' };
    }
    try {
      const { data, error } = await supabase
        .from('usuarios_autorizados')
        .update({ curso })
        .eq('email', user.email.toLowerCase())
        .select();

      if (error) {
        console.error('Erro ao salvar curso:', error);
        return { error: error.message };
      }

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

    // Carregar sessão existente
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            let autorizado = await verificarAutorizacao(session.user.email);
            if (!autorizado) {
              autorizado = await autoCreateUser(session.user.email);
            }
            if (autorizado) {
              setUser(session.user);
            } else {
              await supabase.auth.signOut();
              setUser(null);
              setAuthError('Erro ao criar conta. Tente novamente.');
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
          let autorizado = await verificarAutorizacao(session.user.email);
          if (!autorizado) {
            autorizado = await autoCreateUser(session.user.email);
          }

          if (mounted) {
            if (autorizado) {
              setUser(session.user);
              setAuthError(null);
            } else {
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
  }, [verificarAutorizacao, autoCreateUser, loading]);

  const signInWithEmail = async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message);
      return { data, error };
    }

    let autorizado = await verificarAutorizacao(email);
    if (!autorizado) {
      autorizado = await autoCreateUser(email);
    }

    return { data, error };
  };

  const signUpWithEmail = async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
    setAuthError(null);

    const jaAutorizado = await verificarAutorizacao(email);

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
      return { data: null, error };
    }

    if (!jaAutorizado) {
      await autoCreateUser(email);
    }

    return { data, error: null };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
    setAuthError(null);
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
      user, userName, userCurso, isNewUser, loading, authError,
      signInWithEmail, signUpWithEmail, signInWithGoogle,
      signOut, verificarAutorizacao, clearAuthError, updateUserCurso, updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
