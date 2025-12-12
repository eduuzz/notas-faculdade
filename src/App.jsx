import { AuthProvider, useAuth } from './AuthContext'
import SistemaNotas from './SistemaNotas'
import Login from './Login'
import { GraduationCap } from 'lucide-react'

// Componente que decide o que mostrar
function AppContent() {
  const { user, loading } = useAuth();

  // Tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-full mb-4 animate-pulse">
            <GraduationCap className="text-indigo-400" size={32} />
          </div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, mostra Login
  if (!user) {
    return <Login />;
  }

  // Se está logado, mostra o sistema
  return <SistemaNotas />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

