import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

export default function Login() {
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, authError, clearAuthError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mostrar erros de auth (ex: erro ao criar conta)
  React.useEffect(() => {
    if (authError) {
      setError(authError);
      clearAuthError?.();
    }
  }, [authError, clearAuthError]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Email não confirmado. Verifique sua caixa de entrada.');
          } else if (error.message.includes('Too many requests')) {
            setError('Muitas tentativas. Aguarde alguns minutos.');
          } else {
            setError(error.message);
          }
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        const { error } = await signUpWithEmail(formData.email, formData.password);
        if (error) setError(error.message);
        else setSuccess('Conta criada com sucesso! Faça login para começar.');
      }
    } catch (err) {
      console.error('Erro de login:', err);
      setError('Erro de conexão. Verifique sua internet.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err) {
      setError('Erro ao enviar email. Tente novamente.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) setError(error.message);
    } catch (err) {
      setError('Erro ao entrar com Google.');
    }
    setLoading(false);
  };

  // Background component
  const Background = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none dark:block hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'var(--accent-glow1)' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px]" style={{ background: 'var(--accent-glow2)' }} />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'var(--accent-bg10)' }} />
    </div>
  );

  // Tela de Esqueci Minha Senha
  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center p-4">
        <Background />
        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:backdrop-blur-xl border border-[var(--border-card)] shadow-[var(--shadow-card)] p-8">
            <button
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Voltar ao login</span>
            </button>

            <div className="text-center mb-8">
              <img src="/icon-192.png" alt="Semestry" className="w-14 h-14 rounded-[18px] mx-auto mb-4" style={{ filter: 'var(--accent-icon-filter)' }} />
              <h1 className="text-2xl font-semibold tracking-tight">Recuperar Senha</h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                Digite seu email para receber o link de recuperação
              </p>
            </div>

            {success && (
              <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle size={18} />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-2">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                    style={{ borderColor: undefined }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-white"
                style={{ background: 'linear-gradient(to right, var(--accent-600), var(--accent-500))', boxShadow: '0 10px 15px -3px var(--accent-ring)' }}
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            © 2024 Semestry. Todos os direitos reservados.
          </p>
        </div>
      </div>
    );
  }

  // Tela de Login/Cadastro
  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center p-4">
      <Background />
      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:backdrop-blur-xl border border-[var(--border-card)] shadow-[var(--shadow-card)] p-6">
          <div className="text-center mb-5">
            <img src="/icon-192.png" alt="Semestry" className="w-10 h-10 rounded-[12px] mx-auto mb-2" style={{ filter: 'var(--accent-icon-filter)' }} />
            <h1 className="text-xl font-semibold tracking-tight">Semestry</h1>
            <p className="text-[var(--text-muted)] text-sm">
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle size={18} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-[var(--text-secondary)] block mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                  style={{ borderColor: undefined }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                  onBlur={(e) => e.target.style.borderColor = ''}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-[var(--text-secondary)]">Senha</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--accent-400)' }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                  style={{ borderColor: undefined }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                  onBlur={(e) => e.target.style.borderColor = ''}
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                    style={{ borderColor: undefined }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                    placeholder="Confirme sua senha"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-white"
              style={{ background: 'linear-gradient(to right, var(--accent-600), var(--accent-500))', boxShadow: '0 10px 15px -3px var(--accent-ring)' }}
            >
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </form>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-[var(--text-muted)]">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          <div className="mt-4 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="font-medium transition-colors"
                style={{ color: 'var(--accent-400)' }}
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2024 Semestry. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
