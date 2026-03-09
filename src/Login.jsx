import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

function traduzirErro(msg) {
  if (!msg) return 'Erro desconhecido.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Email ou senha incorretos.';
  if (m.includes('email not confirmed'))
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Muitas tentativas. Aguarde alguns minutos.';
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Este email já possui uma conta. Faça login.';
  if (m.includes('password') && m.includes('least'))
    return 'A senha deve ter no mínimo 6 caracteres.';
  if (m.includes('invalid email') || m.includes('unable to validate'))
    return 'Email inválido. Verifique o formato.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Erro de conexão. Verifique sua internet.';
  if (m.includes('not authorized') || m.includes('not allowed'))
    return 'Usuário não autorizado. Contate o administrador.';
  return msg;
}

export default function Login() {
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, authError, clearAuthError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          setError(traduzirErro(error.message));
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        const { error } = await signUpWithEmail(formData.email, formData.password);
        if (error) setError(traduzirErro(error.message));
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
        setError(traduzirErro(error.message));
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
      if (error) setError(traduzirErro(error.message));
    } catch (err) {
      setError('Erro ao entrar com Google.');
    }
    setLoading(false);
  };

  const AlertBox = ({ type, message }) => (
    <div className={`mb-4 px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-sm border ${
      type === 'success'
        ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
        : 'bg-red-500/8 border-red-500/20 text-red-400'
    }`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span>{message}</span>
    </div>
  );

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] p-6">
            <button
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }}
              className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-5 text-sm"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            <div className="mb-6">
              <img src="/icon-192.png" alt="Semestry" className="w-10 h-10 rounded-lg mb-4" style={{ filter: 'var(--accent-icon-filter)' }} />
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">Recuperar Senha</h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                Digite seu email para receber o link de recuperação
              </p>
            </div>

            {success && <AlertBox type="success" message={success} />}
            {error && <AlertBox type="error" message={error} />}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-md bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          </div>

          <p className="text-center text-[var(--text-muted)] text-xs mt-5">
            © 2024 Semestry
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] p-6">
          <div className="mb-5">
            <img src="/icon-192.png" alt="Semestry" className="w-10 h-10 rounded-lg mb-3" style={{ filter: 'var(--accent-icon-filter)' }} />
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Semestry</h1>
            <p className="text-[var(--text-muted)] text-sm">
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </p>
          </div>

          {success && <AlertBox type="success" message={success} />}
          {error && <AlertBox type="error" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-[var(--text-muted)]">Senha</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                    className="text-xs text-[var(--accent-400)] hover:text-[var(--accent-500)] transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5">Confirmar Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                    placeholder="Confirme sua senha"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--border-card)]" />
            <span className="text-xs text-[var(--text-muted)]">ou</span>
            <div className="flex-1 h-px bg-[var(--border-card)]" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          <div className="mt-4 text-center">
            <p className="text-[var(--text-muted)] text-sm">
              {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="text-[var(--accent-400)] hover:text-[var(--accent-500)] font-medium transition-colors"
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[var(--text-muted)] text-xs mt-5">
          © 2024 Semestry
        </p>
      </div>
    </div>
  );
}
