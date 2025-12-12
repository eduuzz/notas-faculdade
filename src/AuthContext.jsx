import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login com email/senha
  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Cadastro com email/senha
  const signUpWithEmail = async (email, password) => {
    // Verificar se email está autorizado
    const autorizado = await verificarAutorizacao(email);
    if (!autorizado) {
      return { 
        data: null, 
        error: { message: 'Email não autorizado. Realize o pagamento primeiro.' } 
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  // Login com Google
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  // Verificar se email está autorizado
  const verificarAutorizacao = async (email) => {
    const { data, error } = await supabase
      .from('usuarios_autorizados')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('ativo', true)
      .single();
    
    return !error && data;
  };

  // Logout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    verificarAutorizacao,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
