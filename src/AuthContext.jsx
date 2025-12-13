import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Cache de autorização para evitar múltiplas queries
  const [authCache, setAuthCache] = useState({});

  // Verificar se email está autorizado (com cache)
  const verificarAutorizacao = useCallback(async (email) => {
    if (!email || !supabase) return false;
    
    const emailLower = email.toLowerCase();
    
    // Verificar cache primeiro
    if (authCache[emailLower] !== undefined) {
      return authCache[emailLower];
    }
    
    try {
      const { data, error } = await supabase
        .from('usuarios_autorizados')
        .select('id')
        .eq('email', emailLower)
        .eq('ativo', true)
        .single();
      
      const autorizado = !error && data;
      
      // Salvar no cache
      setAuthCache(prev => ({ ...prev, [emailLower]: autorizado }));
      
      return autorizado;
    } catch (err) {
      console.error('Erro ao verificar autorização:', err);
      return false;
    }
  }, [authCache]);

  useEffect(() => {
    // Se Supabase não está configurado, para de carregar
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Supabase não está configurado!');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let sessionChecked = false;

    // Verificar sessão existente primeiro (mais rápido)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted || sessionChecked) return;
      sessionChecked = true;
      
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
      }
      
      setLoading(false);
    });

    // Listener para mudanças futuras de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Ignorar evento inicial se já verificamos a sessão
        if (event === 'INITIAL_SESSION' && sessionChecked) {
          return;
        }

        // Eventos que não precisam verificar autorização
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUser(null);
          setLoading(false);
          return;
        }

        // Se tem sessão, verificar autorização
        if (session?.user) {
          const autorizado = await verificarAutorizacao(session.user.email);
          
          if (!isMounted) return;

          if (autorizado) {
            setUser(session.user);
            setAuthError(null);
          } else {
            // Não autorizado - fazer logout silencioso
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
  }, []); // Dependências vazias - executa só uma vez

  // Login com email/senha
  const signInWithEmail = async (email, password) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    
    setAuthError(null);
    
    // Verificar autorização ANTES de tentar login
    const autorizado = await verificarAutorizacao(email);
    if (!autorizado) {
      const msg = 'Email não autorizado. Realize o pagamento primeiro.';
      setAuthError(msg);
      return { data: null, error: { message: msg } };
    }
    
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
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    
    setAuthError(null);
    
    // Verificar se email está autorizado
    const autorizado = await verificarAutorizacao(email);
    if (!autorizado) {
      const msg = 'Email não autorizado. Realize o pagamento primeiro.';
      setAuthError(msg);
      return { data: null, error: { message: msg } };
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
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    
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
    if (!supabase) {
      return { error: { message: 'Supabase não configurado' } };
    }
    
    setAuthError(null);
    setAuthCache({}); // Limpar cache no logout
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
