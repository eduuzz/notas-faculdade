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
const LancadorNotas = React.lazy(() => import('./LancadorNotas'))

import { ADMIN_EMAIL } from './supabaseClient';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-lg bg-[var(--accent-bg10)] flex items-center justify-center mx-auto mb-3">
          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent-400)' }} />
        </div>
        <p className="text-sm text-[var(--text-muted)]">Carregando...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
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

  if (window.location.pathname === '/lancador') {
    if (!user) return (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    );
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LancadorNotas />
      </Suspense>
    );
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h1 className="text-lg font-semibold mb-2">Algo deu errado</h1>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <details className="text-left mb-5 bg-red-500/5 border border-red-500/20 rounded-md p-3">
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
              className="px-5 py-2 rounded-md bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-medium transition-colors"
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
