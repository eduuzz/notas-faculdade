import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Upload, User } from 'lucide-react';

// Função para traduzir erros do Supabase
const traduzirErro = (mensagem) => {
  const traducoes = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
    'User already registered': 'Este email já está cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address': 'Email inválido',
    'Signup requires a valid password': 'Senha inválida',
    'To signup, please provide your email': 'Informe seu email para cadastrar',
    'User not found': 'Usuário não encontrado',
    'Invalid email': 'Email inválido',
    'Rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
  };

  for (const [ingles, portugues] of Object.entries(traducoes)) {
    if (mensagem.includes(ingles)) return portugues;
  }
  return mensagem;
};

const Login = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, verificarAutorizacao, authError, clearAuthError } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showCadastroInfo, setShowCadastroInfo] = useState(false);
  const [showFormulario, setShowFormulario] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados do formulário de pedido
  const [pedidoNome, setPedidoNome] = useState('');
  const [pedidoEmail, setPedidoEmail] = useState('');
  const [comprovante, setComprovante] = useState(null);
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  useEffect(() => {
    if (authError) {
      setError(traduzirErro(authError));
      clearAuthError();
    }
  }, [authError, clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!isLogin) {
      const autorizado = await verificarAutorizacao(email);
      if (!autorizado) {
        setError('Email não autorizado. Realize o pagamento primeiro.');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        setLoading(false);
        return;
      }

      const { error } = await signUpWithEmail(email, password);
      if (error) {
        setError(traduzirErro(error.message));
      } else {
        setSuccess('Cadastro realizado! Verifique seu email para confirmar.');
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(traduzirErro(error.message));
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(traduzirErro(error.message));
      setLoading(false);
    }
  };

  const handleEnviarPedido = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEnviandoPedido(true);

    try {
      if (!pedidoNome.trim() || !pedidoEmail.trim()) {
        setError('Preencha todos os campos');
        setEnviandoPedido(false);
        return;
      }

      if (!comprovante) {
        setError('Envie o comprovante de pagamento');
        setEnviandoPedido(false);
        return;
      }

      const fileExt = comprovante.name.split('.').pop();
      const fileName = `${Date.now()}_${pedidoEmail.replace('@', '_at_')}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, comprovante);

      if (uploadError) {
        setError('Erro ao enviar comprovante. Tente novamente.');
        setEnviandoPedido(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      const { error: pedidoError } = await supabase
        .from('pedidos')
        .insert([{
          nome: pedidoNome.trim(),
          email: pedidoEmail.trim().toLowerCase(),
          comprovante_url: urlData.publicUrl,
          status: 'PENDENTE'
        }]);

      if (pedidoError) {
        setError('Erro ao enviar pedido. Tente novamente.');
        setEnviandoPedido(false);
        return;
      }

      setSuccess('Pedido enviado com sucesso! Você receberá a confirmação em até 24h.');
      setPedidoNome('');
      setPedidoEmail('');
      setComprovante(null);
      
      setTimeout(() => {
        setShowFormulario(false);
        setSuccess('');
      }, 5000);

    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    }

    setEnviandoPedido(false);
  };

  // Tela do formulário de pedido
  if (showFormulario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <Upload className="text-green-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Enviar Comprovante</h1>
            <p className="text-slate-400">Preencha seus dados e envie o comprovante</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
              <CheckCircle size={18} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleEnviarPedido} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm block mb-1">Seu Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={pedidoNome}
                  onChange={(e) => setPedidoNome(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-sm block mb-1">Seu Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={pedidoEmail}
                  onChange={(e) => setPedidoEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Use o mesmo email que usará para acessar o sistema</p>
            </div>

            <div>
              <label className="text-slate-400 text-sm block mb-1">Comprovante de Pagamento</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setComprovante(e.target.files[0])}
                className="hidden"
                id="comprovante-input"
              />
              <label
                htmlFor="comprovante-input"
                className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  comprovante 
                    ? 'border-green-500 bg-green-500/10 text-green-400' 
                    : 'border-slate-600 hover:border-slate-500 text-slate-400'
                }`}
              >
                <Upload size={20} />
                {comprovante ? comprovante.name : 'Clique para enviar o comprovante'}
              </label>
              <p className="text-xs text-slate-500 mt-1">Imagem ou PDF do comprovante Pix</p>
            </div>

            <button
              type="submit"
              disabled={enviandoPedido}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors"
            >
              {enviandoPedido ? 'Enviando...' : 'Enviar Pedido'}
            </button>
          </form>

          <button
            onClick={() => { setShowFormulario(false); setError(''); setSuccess(''); }}
            className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  // Tela de informações de cadastro (Pix)
  if (showCadastroInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-full mb-4">
              <GraduationCap className="text-indigo-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Quero me Cadastrar</h1>
            <p className="text-slate-400">Acesso vitalício ao Sistema de Notas</p>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6 mb-6 text-center">
            <div className="text-red-400 text-sm font-semibold mb-1">🔥 PROMOÇÃO</div>
            <div className="text-slate-400 text-sm mb-1">
              <span className="line-through">De R$ 19,90</span>
            </div>
            <div className="text-3xl font-bold text-white">
              R$ 14<span className="text-xl">,90</span>
            </div>
            <div className="text-green-400 text-sm mt-1">✓ Acesso vitalício</div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">Como funciona:</h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
                <span className="text-slate-300">Faça o Pix usando a chave abaixo</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                <span className="text-slate-300">Clique em "Enviar Comprovante" e preencha o formulário</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
                <span className="text-slate-300">Aguarde a confirmação (até 24h)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</span>
                <span className="text-slate-300">Volte aqui e faça seu cadastro!</span>
              </li>
            </ol>
          </div>

          <div className="mt-6 bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Chave Pix (Email)</div>
            <div className="font-mono text-white text-sm break-all select-all">
              notasedu.pix@gmail.com
            </div>
          </div>

          <button
            onClick={() => { setShowCadastroInfo(false); setShowFormulario(true); }}
            className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            Enviar Comprovante
          </button>

          <div className="mt-4 text-center">
            <span className="text-slate-500 text-sm">ou envie pelo </span>
            <a
              href="https://wa.me/5551989929557?text=Olá! Fiz o pagamento do Sistema de Notas. Meu email é: "
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 text-sm"
            >
              WhatsApp
            </a>
          </div>

          <button
            onClick={() => setShowCadastroInfo(false)}
            className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            ← Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  // Tela de cadastro (criar conta)
  if (!isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-full mb-4">
              <GraduationCap className="text-indigo-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Criar Conta</h1>
            <p className="text-slate-400">Preencha seus dados para se cadastrar</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
              <CheckCircle size={18} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm block mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-sm block mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-sm block mb-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(true)}
              className="text-slate-400 hover:text-white text-sm"
            >
              Já tem conta? <span className="text-indigo-400">Fazer login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-full mb-4">
            <GraduationCap className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sistema de Notas</h1>
          <p className="text-slate-400">Entre na sua conta</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-sm block mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="Sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-slate-700"></div>
          <span className="px-4 text-slate-500 text-sm">ou</span>
          <div className="flex-1 border-t border-slate-700"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
          <button
            onClick={() => setShowCadastroInfo(true)}
            className="text-slate-400 hover:text-white text-sm"
          >
            Não tem conta? <span className="text-indigo-400">Quero me cadastrar</span>
          </button>
          <div>
            <button
              onClick={() => setIsLogin(false)}
              className="text-slate-500 hover:text-slate-300 text-sm"
            >
              Já paguei e quero criar minha conta →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
