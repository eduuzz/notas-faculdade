import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verificar se email está autorizado
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
      console.error('Erro ao verificar autorização:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Supabase não está configurado!');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          const autorizado = await verificarAutorizacao(session.user.email);
          
          if (!isMounted) return;

          if (autorizado) {
            setUser(session.user);
            setAuthError(null);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setAuthError('Email não autorizado. Realize o pagamento primeiro.');
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Erro ao obter sessão:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Sempre para o loading primeiro em eventos de auth
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (event === 'SIGNED_OUT') {
            setUser(null);
          }
          setLoading(false);
          return;
        }

        // Ignora INITIAL_SESSION pois getSession já trata
        if (event === 'INITIAL_SESSION') {
          return;
        }

        if (session?.user) {
          try {
            const autorizado = await verificarAutorizacao(session.user.email);
            
            if (!isMounted) return;

            if (autorizado) {
              setUser(session.user);
              setAuthError(null);
            } else {
              await supabase.auth.signOut();
              setUser(null);
              setAuthError('Email não autorizado. Realize o pagamento primeiro.');
            }
          } catch (err) {
            console.error('Erro na verificação:', err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [verificarAutorizacao]);

  const signInWithEmail = async (email, password) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    return { data, error };
  };

  const signUpWithEmail = async (email, password) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    
    setAuthError(null);
    
    const autorizado = await verificarAutorizacao(email);
    if (!autorizado) {
      setAuthError('Email não autorizado. Realize o pagamento primeiro.');
      return { data: null, error: { message: 'Email não autorizado. Realize o pagamento primeiro.' } };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setAuthError(error.message);
    return { data, error };
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { data, error };
  };

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase não configurado' } };
    }
    
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    setUser(null);
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authError,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      verificarAutorizacao,
      clearAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
