import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, verificarAutorizacao, authError, clearAuthError } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showCadastroInfo, setShowCadastroInfo] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mostrar erro de autorização do contexto
  useEffect(() => {
    if (authError) {
      setError(authError);
      clearAuthError();
    }
  }, [authError, clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!isLogin) {
      // Verificar se email está autorizado antes de cadastrar
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
        setError(error.message);
      } else {
        setSuccess('Cadastro realizado! Verifique seu email para confirmar.');
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(error.message || 'Email ou senha incorretos');
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  // Tela de informações para cadastro (pagamento)
  if (showCadastroInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 shadow-xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-full mb-4">
                <GraduationCap className="text-indigo-400" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-white">Quero me Cadastrar</h1>
              <p className="text-slate-400 mt-2">Acesso vitalício ao Sistema de Notas</p>
            </div>

            {/* Preço */}
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/30 mb-6">
              <div className="text-center">
                <div className="text-sm text-slate-400">Valor único</div>
                <div className="text-4xl font-bold text-white mt-1">R$ 15<span className="text-lg text-slate-400">,00</span></div>
                <div className="text-sm text-green-400 mt-2">✓ Acesso vitalício</div>
              </div>
            </div>

            {/* Instruções */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-white">Como funciona:</h3>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div className="text-slate-300 text-sm">Faça o Pix usando a chave abaixo</div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div className="text-slate-300 text-sm">Envie o comprovante para o WhatsApp junto com seu email</div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div className="text-slate-300 text-sm">Aguarde a confirmação (até 24h)</div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div className="text-slate-300 text-sm">Volte aqui e faça seu cadastro!</div>
              </div>
            </div>

            {/* Chave Pix */}
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <div className="text-sm text-slate-400 mb-1">Chave Pix (Email)</div>
              <div className="font-mono text-white text-sm break-all select-all">
                seu-email-pix@exemplo.com
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
              <div className="text-sm text-slate-400 mb-1">WhatsApp</div>
              <a 
                href="https://wa.me/5500000000000?text=Olá! Fiz o pagamento do Sistema de Notas. Meu email é: " 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-green-400 hover:text-green-300"
              >
                (00) 00000-0000
              </a>
            </div>

            <button
              onClick={() => setShowCadastroInfo(false)}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              ← Voltar para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-full mb-4">
              <GraduationCap className="text-indigo-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Sistema de Notas</h1>
            <p className="text-slate-400 mt-2">
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </p>
          </div>

          {/* Alerts */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-indigo-500 focus:outline-none text-white"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-indigo-500 focus:outline-none text-white"
                  placeholder="••••••••"
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

            {!isLogin && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-indigo-500 focus:outline-none text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800/50 text-slate-400">ou</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          {/* Toggle Login/Cadastro */}
          <div className="mt-6 text-center">
            {isLogin ? (
              <p className="text-slate-400">
                Não tem conta?{' '}
                <button
                  onClick={() => setShowCadastroInfo(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Quero me cadastrar
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Já tem conta?{' '}
                <button
                  onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>

          {/* Link para cadastro após autorização */}
          {isLogin && (
            <div className="mt-4 text-center">
              <button
                onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                className="text-sm text-slate-500 hover:text-slate-400"
              >
                Já paguei e quero criar minha conta →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
