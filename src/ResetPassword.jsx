import React, { useState, useEffect } from 'react';
import { GraduationCap, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function ResetPassword({ onComplete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          } else {
            window.location.href = '/';
          }
        }, 3000);
      }
    } catch (err) {
      setError('Erro ao atualizar senha. Tente novamente.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <CheckCircle size={24} className="text-emerald-400" />
            </div>
            <h1 className="text-lg font-semibold mb-1.5">Senha Alterada!</h1>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              Sua senha foi atualizada. Você será redirecionado em instantes...
            </p>
            <button
              onClick={() => onComplete ? onComplete() : window.location.href = '/'}
              className="w-full py-2 rounded-md bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-medium transition-colors"
            >
              Acessar o Sistema
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] p-6">
          <div className="mb-6">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-bg10)] flex items-center justify-center mb-3">
              <GraduationCap size={20} style={{ color: 'var(--accent-400)' }} />
            </div>
            <h1 className="text-lg font-semibold">Nova Senha</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Digite sua nova senha
            </p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-md flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1.5">Nova Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
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

            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1.5">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>

            {formData.password && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  <div className={`h-0.5 flex-1 rounded-full ${formData.password.length >= 6 ? 'bg-emerald-500' : 'bg-[var(--border-card)]'}`} />
                  <div className={`h-0.5 flex-1 rounded-full ${formData.password.length >= 8 ? 'bg-emerald-500' : 'bg-[var(--border-card)]'}`} />
                  <div className={`h-0.5 flex-1 rounded-full ${formData.password.length >= 10 && /[A-Z]/.test(formData.password) ? 'bg-emerald-500' : 'bg-[var(--border-card)]'}`} />
                  <div className={`h-0.5 flex-1 rounded-full ${formData.password.length >= 10 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? 'bg-emerald-500' : 'bg-[var(--border-card)]'}`} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {formData.password.length < 6 && 'Senha muito curta'}
                  {formData.password.length >= 6 && formData.password.length < 8 && 'Senha fraca'}
                  {formData.password.length >= 8 && formData.password.length < 10 && 'Senha média'}
                  {formData.password.length >= 10 && 'Senha forte'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || error.includes('Link inválido')}
              className="w-full py-2 rounded-md bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors">
              Voltar ao login
            </a>
          </div>
        </div>

        <p className="text-center text-[var(--text-muted)] text-xs mt-5">
          © 2024 Semestry
        </p>
      </div>
    </div>
  );
}
