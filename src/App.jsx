import React, { useState, useEffect, Suspense } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { ToastProvider } from './ToastContext'
import { ThemeProvider } from './ThemeContext'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { supabase } from './supabaseClient'

const SistemaNotas = React.lazy(() => import('./SistemaNotas'))
const Login = React.lazy(() => import('./Login'))
const ResetPassword = React.lazy(() => import('./ResetPassword'))
const AdminPanel = React.lazy(() => import('./AdminPanel'))
const SharedGrade = React.lazy(() => import('./SharedGrade'))

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

    let subscription;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveryMode(true);
          setCheckingRecovery(false);
        }
      });
      subscription = data.subscription;
    }

    checkRecoveryMode();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Rota pública de grade compartilhada
  const shareMatch = window.location.pathname.match(/^\/share\/(.+)$/);
  if (shareMatch) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SharedGrade token={shareMatch[1]} />
      </Suspense>
    );
  }

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

// Error Boundary para capturar erros de render
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-red-500/20 border border-red-500/30 mb-6">
              <AlertTriangle size={36} className="text-red-400" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Algo deu errado</h1>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <details className="text-left mb-6 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <summary className="text-xs text-red-400 cursor-pointer">Detalhes do erro</summary>
              <pre className="mt-2 text-xs text-red-300 whitespace-pre-wrap break-all max-h-40 overflow-auto">
                {this.state.error?.toString()}
                {'\n'}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then(names => names.forEach(name => caches.delete(name)));
                }
                window.location.reload();
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold shadow-lg shadow-violet-500/25 transition-all"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
