import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const isInitialLoad = useRef(true);

  const verificarAutorizacao = useCallback(async (email) => {
    if (!email || !supabase) return false;
    try {
      const { data, error } = await supabase
        .from('usuarios_autorizados')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('ativo', true)
        .single();
      return !error && data;
    } catch (err) {
      return false;
    }
  }, []);

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
          setUser(session?.user ?? null);
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

        if (event === 'SIGNED_IN' && session?.user) {
          // Novo login - verificar autorização
          const autorizado = await verificarAutorizacao(session.user.email);
          if (mounted) {
            if (autorizado) {
              setUser(session.user);
              setAuthError(null);
            } else {
              await supabase.auth.signOut();
              setUser(null);
              setAuthError('Email não autorizado. Realize o pagamento primeiro.');
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
  }, [verificarAutorizacao]);

  const signInWithEmail = async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    return { data, error };
  };

  const signUpWithEmail = async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
    setAuthError(null);
    const autorizado = await verificarAutorizacao(email);
    if (!autorizado) {
      setAuthError('Email não autorizado. Realize o pagamento primeiro.');
      return { data: null, error: { message: 'Email não autorizado.' } };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setAuthError(error.message);
    return { data, error };
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
      user, loading, authError,
      signInWithEmail, signUpWithEmail, signInWithGoogle,
      signOut, verificarAutorizacao, clearAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
