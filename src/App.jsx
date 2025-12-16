import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import SistemaNotas from './SistemaNotas'
import Login from './Login'
import ResetPassword from './ResetPassword'
import AdminPanel from './AdminPanel'
import { RefreshCw } from 'lucide-react'
import { supabase } from './supabaseClient'

// Email do administrador
const ADMIN_EMAIL = 'eproencad@gmail.com';

// Componente que decide o que mostrar
function AppContent() {
  const { user, loading } = useAuth();
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Verifica se o usuário é admin
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    // Verifica se é um fluxo de recuperação de senha
    const checkRecoveryMode = () => {
      // Verifica na URL se tem parâmetros de recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const type = hashParams.get('type') || queryParams.get('type');
      
      // Se tem type=recovery na URL, é recuperação de senha
      if (type === 'recovery') {
        setIsRecoveryMode(true);
      }
      
      setCheckingRecovery(false);
    };

    // Escuta eventos de auth do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setCheckingRecovery(false);
      }
    });

    checkRecoveryMode();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Tela de carregamento estilo Apple
  if (loading || checkingRecovery) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mx-auto mb-4">
            <RefreshCw size={36} className="text-white animate-spin" />
          </div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se está em modo de recuperação de senha, mostra a tela de redefinir
  if (isRecoveryMode) {
    return <ResetPassword onComplete={() => {
      setIsRecoveryMode(false);
      // Limpa a URL
      window.history.replaceState({}, document.title, '/');
    }} />;
  }

  // Se não está logado, mostra Login
  if (!user) {
    return <Login />;
  }

  // Se está no painel admin
  if (showAdminPanel && isAdmin) {
    return <AdminPanel onClose={() => setShowAdminPanel(false)} />;
  }

  // Se está logado, mostra o sistema
  // Passa onOpenAdmin apenas se for admin
  return <SistemaNotas onOpenAdmin={isAdmin ? () => setShowAdminPanel(true) : null} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
