import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Retry com exponential backoff
const retryAsync = async (fn, { maxRetries = 3, baseDelay = 500 } = {}) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

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
      const result = await retryAsync(async () => {
        const { data, error } = await supabase
          .from('usuarios_autorizados')
          .select('id, nome, curso, plano')
          .eq('email', email.toLowerCase())
          .eq('ativo', true)
          .single();
        if (error) throw error;
        return data;
      }, { maxRetries: 2, baseDelay: 500 });

      if (result) {
        setUserName(result.nome || null);
        setUserCurso(result.curso || null);
        setIsNewUser(!result.curso);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('verificarAutorizacao falhou após retries:', err.message);
      return false;
    }
  }, []);

  // Auto-create user in usuarios_autorizados if not exists
  const autoCreateUser = useCallback(async (email) => {
    if (!email || !supabase) return false;
    try {
      await retryAsync(async () => {
        const { error: insertError } = await supabase
          .from('usuarios_autorizados')
          .insert([{
            email: email.toLowerCase(),
            ativo: true,
            nome: null,
            curso: null,
          }]);
        if (insertError) throw insertError;
      }, { maxRetries: 2, baseDelay: 500 });
      return await verificarAutorizacao(email);
    } catch (err) {
      console.warn('autoCreateUser falhou após retries:', err.message);
      return false;
    }
  }, [verificarAutorizacao]);

  // Helper: fetch direto no Supabase (workaround para .update() que trava)
  const supabasePatch = useCallback(async (table, body, eqColumn, eqValue) => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const token = localStorage.getItem('sb-' + url.replace('https://', '').split('.')[0] + '-auth-token');
    const accessToken = token ? JSON.parse(token)?.access_token : key;

    const res = await fetch(
      `${url}/rest/v1/${table}?${eqColumn}=eq.${encodeURIComponent(eqValue)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return { success: true };
  }, []);

  // Função para atualizar o curso do usuário
  const updateUserCurso = useCallback(async (curso) => {
    if (!user) return { error: 'Não autenticado' };
    try {
      await supabasePatch('usuarios_autorizados', { curso }, 'email', user.email.toLowerCase());
      setUserCurso(curso);
      setIsNewUser(false);
      return { success: true };
    } catch (err) {
      console.error('Erro ao salvar curso:', err);
      return { error: err.message };
    }
  }, [user, supabasePatch]);

  // Função para atualizar perfil completo (nome e curso)
  const updateUserProfile = useCallback(async (nome, curso) => {
    if (!user) return { error: 'Não autenticado' };
    try {
      await supabasePatch('usuarios_autorizados', { nome, curso }, 'email', user.email.toLowerCase());
      setUserName(nome || null);
      setUserCurso(curso || null);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }, [user, supabasePatch]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Timeout de segurança - 8 segundos (ampliado para acomodar retries)
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth timeout - forçando fim do loading');
        setLoading(false);
        isInitialLoad.current = false;
      }
    }, 8000);

    // Carregar sessão existente (com retry)
    const loadSession = async () => {
      try {
        const { data: { session } } = await retryAsync(
          () => supabase.auth.getSession(),
          { maxRetries: 2, baseDelay: 800 }
        );

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
        console.error('Erro ao carregar sessão após retries:', err);
        if (mounted) {
          setAuthError('Erro de conexão. Recarregue a página.');
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

  // Auto-refresh token before it expires (every 4 min, refreshes if < 10 min left)
  useEffect(() => {
    if (!user || !supabase) return;

    const refreshToken = async () => {
      try {
        const ref = supabase.supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
        if (!ref) return;
        const stored = localStorage.getItem(`sb-${ref}-auth-token`);
        if (!stored) return;
        const session = JSON.parse(stored);
        const expiresAt = session?.expires_at;
        if (!expiresAt) return;
        const now = Math.floor(Date.now() / 1000);
        // Refresh if less than 10 minutes remaining
        if (expiresAt - now < 600 && session?.refresh_token) {
          await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
        }
      } catch { /* silent */ }
    };

    const interval = setInterval(refreshToken, 4 * 60 * 1000); // every 4 min
    return () => clearInterval(interval);
  }, [user]);

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
      options: { redirectTo: window.location.origin + window.location.pathname },
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
