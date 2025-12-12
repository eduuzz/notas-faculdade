import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verificar se email está autorizado
  const verificarAutorizacao = useCallback(async (email) => {
    if (!email) return false;
    
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
    let isMounted = true;

    // Verificar sessão atual
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          // Verificar se está autorizado
          const autorizado = await verificarAutorizacao(session.user.email);
          
          if (!isMounted) return;

          if (autorizado) {
            setUser(session.user);
            setAuthError(null);
          } else {
            // Não autorizado - fazer logout
            await supabase.auth.signOut();
            setUser(null);
            setAuthError('Email não autorizado. Realize o pagamento primeiro.');
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Erro ao obter sessão:', err);
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // Verificar se está autorizado
          const autorizado = await verificarAutorizacao(session.user.email);
          
          if (!isMounted) return;

          if (autorizado) {
            setUser(session.user);
            setAuthError(null);
          } else {
            // Não autorizado - fazer logout
            await supabase.auth.signOut();
            setUser(null);
            setAuthError('Email não autorizado. Realize o pagamento primeiro.');
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

  // Login com email/senha
  const signInWithEmail = async (email, password) => {
    setAuthError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setAuthError(error.message);
    }
    
    return { data, error };
  };

  // Cadastro com email/senha
  const signUpWithEmail = async (email, password) => {
    setAuthError(null);
    
    // Verificar se email está autorizado
    const autorizado = await verificarAutorizacao(email);
    if (!autorizado) {
      setAuthError('Email não autorizado. Realize o pagamento primeiro.');
      return { 
        data: null, 
        error: { message: 'Email não autorizado. Realize o pagamento primeiro.' } 
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      setAuthError(error.message);
    }
    
    return { data, error };
  };

  // Login com Google
  const signInWithGoogle = async () => {
    setAuthError(null);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  // Limpar erro
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Logout
  const signOut = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    loading,
    authError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    verificarAutorizacao,
    clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
