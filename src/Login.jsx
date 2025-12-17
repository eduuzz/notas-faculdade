import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Upload, CheckCircle, User, X, Copy, Check } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

// Configurações de pagamento
const CONFIG = {
  precoOriginal: 'R$ 19,90',
  precoPromocional: 'R$ 14,90',
  chavePix: 'notasedu.pix@gmail.com',
  whatsapp: '5551989929557',
  whatsappFormatado: '(51) 98992-9557'
};

export default function Login() {
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, authError, clearAuthError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [showFormulario, setShowFormulario] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [showNaoAutorizado, setShowNaoAutorizado] = useState(false);

  // Detectar quando volta do login Google sem autorização
  React.useEffect(() => {
    if (authError && authError.includes('não autorizado')) {
      setShowNaoAutorizado(true);
      clearAuthError?.();
    }
  }, [authError, clearAuthError]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [pedidoData, setPedidoData] = useState({
    nome: '',
    email: '',
    comprovante: null
  });

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CONFIG.chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

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
        else setSuccess('Verifique seu email para confirmar o cadastro!');
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

  const handleEnviarPedido = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let comprovanteUrl = null;

      // Upload do comprovante se existir
      if (pedidoData.comprovante) {
        const file = pedidoData.comprovante;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${pedidoData.email.replace('@', '_')}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('Comprovantes')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Erro upload:', uploadError);
          // Continua mesmo sem o comprovante
        } else {
          const { data: urlData } = supabase.storage
            .from('Comprovantes')
            .getPublicUrl(fileName);
          comprovanteUrl = urlData?.publicUrl;
        }
      }

      // Criar pedido no banco
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .insert([{
          nome: pedidoData.nome,
          email: pedidoData.email.toLowerCase(),
          comprovante_url: comprovanteUrl,
          status: 'PENDENTE'
        }]);

      if (pedidoError) {
        setError('Erro ao enviar pedido: ' + pedidoError.message);
      } else {
        setSuccess('Pedido enviado com sucesso! Aguarde a confirmação em até 24h.');
        setPedidoData({ nome: '', email: '', comprovante: null });
        setTimeout(() => {
          setShowFormulario(false);
          setShowPromo(false);
          setSuccess('');
        }, 3000);
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao enviar pedido. Tente novamente.');
    }
    setLoading(false);
  };

  // Background component
  const Background = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px]" />
    </div>
  );

  // Tela de Formulário de Pedido
  if (showFormulario) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <Background />
        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8">
            <button
              onClick={() => { setShowFormulario(false); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Voltar</span>
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl shadow-emerald-500/30 mb-4">
                <Upload size={32} className="text-white" />
              </div>
              <h1 className="text-xl font-semibold">Enviar Comprovante</h1>
              <p className="text-slate-500 text-sm mt-1">Preencha os dados abaixo</p>
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

            <form onSubmit={handleEnviarPedido} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Seu Nome</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={pedidoData.nome}
                    onChange={(e) => setPedidoData({ ...pedidoData, nome: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="Nome completo"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Seu Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={pedidoData.email}
                    onChange={(e) => setPedidoData({ ...pedidoData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Comprovante (opcional)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setPedidoData({ ...pedidoData, comprovante: e.target.files[0] })}
                    className="hidden"
                    id="comprovante-input"
                  />
                  <label
                    htmlFor="comprovante-input"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white/5 border border-white/10 border-dashed text-slate-400 hover:text-white hover:border-violet-500/50 cursor-pointer transition-all"
                  >
                    {pedidoData.comprovante ? (
                      <>
                        <CheckCircle size={18} className="text-emerald-400" />
                        <span className="text-emerald-400">{pedidoData.comprovante.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        <span>Clique para anexar</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </form>

            <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-xs text-center">
                Ou envie o comprovante pelo WhatsApp:
              </p>
              <a
                href={`https://wa.me/${CONFIG.whatsapp}?text=Olá! Fiz o pagamento do Sistema de Notas. Meu email é: ${pedidoData.email || '[seu email]'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {CONFIG.whatsappFormatado}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Promoção
  if (showPromo) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <Background />
        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8">
            <button
              onClick={() => { setShowPromo(false); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Voltar ao login</span>
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/30 mb-4">
                <GraduationCap size={32} className="text-white" />
              </div>
              <h1 className="text-xl font-semibold">Sistema de Notas</h1>
              <p className="text-slate-500 text-sm mt-1">Acesso vitalício</p>
            </div>

            {/* Preço */}
            <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30 rounded-2xl p-6 mb-6 text-center">
              <div className="text-red-400 text-sm font-semibold mb-1">🔥 PROMOÇÃO DE LANÇAMENTO</div>
              <div className="text-slate-400 text-sm mb-1">
                <span className="line-through">{CONFIG.precoOriginal}</span>
              </div>
              <div className="text-4xl font-bold text-white">
                {CONFIG.precoPromocional.split(',')[0]}<span className="text-2xl">,{CONFIG.precoPromocional.split(',')[1]}</span>
              </div>
              <div className="text-emerald-400 text-sm mt-2 flex items-center justify-center gap-1">
                <CheckCircle size={14} />
                Pagamento único, acesso vitalício
              </div>
            </div>

            {/* Passo a passo */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-white">Como funciona:</h3>
              <div className="space-y-3">
                {[
                  'Faça o Pix usando a chave abaixo',
                  'Clique em "Enviar Comprovante"',
                  'Aguarde a confirmação (até 24h)',
                  'Crie sua conta e aproveite!'
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="text-slate-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chave Pix */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <div className="text-slate-400 text-xs mb-2">Chave Pix (Email)</div>
              <div className="flex items-center justify-between">
                <code className="text-white text-sm">{CONFIG.chavePix}</code>
                <button
                  onClick={copiarChavePix}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copiado ? (
                    <Check size={18} className="text-emerald-400" />
                  ) : (
                    <Copy size={18} className="text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão Enviar Comprovante */}
            <button
              onClick={() => setShowFormulario(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              Enviar Comprovante
            </button>

            {/* WhatsApp alternativo */}
            <div className="mt-4 text-center">
              <span className="text-slate-500 text-sm">ou envie pelo </span>
              <a
                href={`https://wa.me/${CONFIG.whatsapp}?text=Olá! Quero adquirir o Sistema de Notas.`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                WhatsApp
              </a>
            </div>

            {/* Já paguei */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <button
                onClick={() => { setShowPromo(false); setIsLogin(false); }}
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                Já paguei e quero criar minha conta →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Esqueci Minha Senha
  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <Background />
        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8">
            <button
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Voltar ao login</span>
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/30 mb-4">
                <GraduationCap size={40} className="text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Recuperar Senha</h1>
              <p className="text-slate-500 text-sm mt-1">
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
                <label className="text-sm text-slate-400 block mb-2">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            © 2024 Sistema de Notas. Todos os direitos reservados.
          </p>
        </div>
      </div>
    );
  }

  // Tela de Login/Cadastro
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
      <Background />
      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/30 mb-4">
              <GraduationCap size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Sistema de Notas</h1>
            <p className="text-slate-500 text-sm mt-1">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-slate-400">Senha</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                  placeholder="Sua senha"
                  required
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

            {!isLogin && (
              <div>
                <label className="text-sm text-slate-400 block mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="Confirme sua senha"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-slate-500">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          <div className="mt-6 text-center space-y-2">
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                onClick={() => {
                  if (isLogin) {
                    // Na tela de login → vai para promoção/cadastro
                    setShowPromo(true);
                  } else {
                    // Na tela de cadastro → volta para login
                    setIsLogin(true);
                  }
                }}
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                {isLogin ? 'Quero me cadastrar' : 'Fazer login'}
              </button>
            </p>
            {isLogin && (
              <p className="text-slate-500 text-sm">
                <button 
                  onClick={() => { setShowPromo(false); setIsLogin(false); }}
                  className="hover:text-violet-400 transition-colors"
                >
                  Já paguei e quero criar minha conta →
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2024 Sistema de Notas. Todos os direitos reservados.
        </p>
      </div>

      {/* Modal: Usuário não autorizado */}
      {showNaoAutorizado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Acesso não autorizado</h2>
              <p className="text-slate-400 text-sm">
                Seu email ainda não está cadastrado no sistema.
              </p>
            </div>

            {/* Passo a passo */}
            <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
              <p className="text-violet-400 font-semibold mb-3 text-sm">📋 Como ter acesso:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                  <p className="text-slate-300 text-sm">Clique em <strong>"Quero me cadastrar"</strong> na tela inicial</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                  <p className="text-slate-300 text-sm">Faça o <strong>Pix de {CONFIG.precoPromocional}</strong> para a chave indicada</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                  <p className="text-slate-300 text-sm">Envie o <strong>comprovante</strong> pelo formulário</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                  <p className="text-slate-300 text-sm">Aguarde a <strong>aprovação</strong> (geralmente em minutos)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={14} />
                  </div>
                  <p className="text-slate-300 text-sm">Pronto! Você poderá fazer login normalmente</p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowNaoAutorizado(false);
                  setShowPromo(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-white font-semibold transition-all"
              >
                Quero me cadastrar
              </button>
              <button
                onClick={() => setShowNaoAutorizado(false)}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-all"
              >
                Voltar
              </button>
            </div>

            {/* Já pagou? */}
            <p className="text-center text-slate-500 text-xs mt-4">
              Já fez o pagamento? Aguarde a aprovação ou entre em contato pelo{' '}
              <a 
                href={`https://wa.me/${CONFIG.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                WhatsApp
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
