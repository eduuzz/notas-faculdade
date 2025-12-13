import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

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

    // Pegar sessão salva - sem verificar autorização novamente
    // (usuário já foi autorizado no primeiro login)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listener para mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Só verifica autorização em novo login
          const autorizado = await verificarAutorizacao(session.user.email);
          if (autorizado) {
            setUser(session.user);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setAuthError('Email não autorizado. Realize o pagamento primeiro.');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
