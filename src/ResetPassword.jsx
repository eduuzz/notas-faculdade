import React, { useState, useEffect } from 'react';
import { GraduationCap, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Verifica se há uma sessão válida (usuário clicou no link do email)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Link inválido ou expirado. Solicite um novo link de recuperação.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações
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
        // Redireciona para login após 3 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (err) {
      setError('Erro ao atualizar senha. Tente novamente.');
    }
    setLoading(false);
  };

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px]" />
        </div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Senha Alterada!</h1>
            <p className="text-slate-400 mb-6">
              Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes...
            </p>
            <a
              href="/"
              className="inline-block w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Ir para o Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/30 mb-4">
              <GraduationCap size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Nova Senha</h1>
            <p className="text-slate-500 text-sm mt-1">
              Digite sua nova senha
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Nova Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all duration-300"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all duration-300"
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>

            {/* Password strength indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 6 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 10 && /[A-Z]/.test(formData.password) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 10 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                </div>
                <p className="text-xs text-slate-500">
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-slate-400 hover:text-violet-400 text-sm transition-colors"
            >
              ← Voltar ao login
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © 2024 Sistema de Notas. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
