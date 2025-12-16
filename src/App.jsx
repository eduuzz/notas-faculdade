import { AuthProvider, useAuth } from './AuthContext'
import SistemaNotas from './SistemaNotas'
import Login from './Login'
import { GraduationCap, RefreshCw } from 'lucide-react'

// Componente que decide o que mostrar
function AppContent() {
  const { user, loading } = useAuth();

  // Tela de carregamento estilo Apple
  if (loading) {
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
