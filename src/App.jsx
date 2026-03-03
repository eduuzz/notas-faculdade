import React, { useState, useEffect, Suspense } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { ToastProvider } from './ToastContext'
import { ThemeProvider } from './ThemeContext'
import { RefreshCw } from 'lucide-react'
import { supabase } from './supabaseClient'

const SistemaNotas = React.lazy(() => import('./SistemaNotas'))
const Login = React.lazy(() => import('./Login'))
const ResetPassword = React.lazy(() => import('./ResetPassword'))
const AdminPanel = React.lazy(() => import('./AdminPanel'))

// Email do administrador
const ADMIN_EMAIL = 'eproencad@gmail.com';

// Spinner de carregamento reutilizável
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none dark:block hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10 text-center">
        <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mx-auto mb-4">
          <RefreshCw size={36} className="text-white animate-spin" />
        </div>
        <p className="text-[var(--text-secondary)]">Carregando...</p>
      </div>
    </div>
  );
}

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
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      const type = hashParams.get('type') || queryParams.get('type');
      if (type === 'recovery') {
        setIsRecoveryMode(true);
      }
      setCheckingRecovery(false);
    };

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

  if (loading || checkingRecovery) {
    return <LoadingSpinner />;
  }

  if (isRecoveryMode) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ResetPassword onComplete={() => {
          setIsRecoveryMode(false);
          window.history.replaceState({}, document.title, '/');
        }} />
      </Suspense>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    );
  }

  if (showAdminPanel && isAdmin) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SistemaNotas onOpenAdmin={isAdmin ? () => setShowAdminPanel(true) : null} />
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
