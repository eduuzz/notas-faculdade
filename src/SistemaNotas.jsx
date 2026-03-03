import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Plus, BookOpen, GraduationCap, Clock, RefreshCw, LogOut, Wifi, WifiOff, Sun, Moon, Shield, Settings, TrendingUp } from 'lucide-react';
import { useNotas } from './useNotas';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
const ImportModal = React.lazy(() => import('./ImportModal'));
import ConfirmModal from './ConfirmModal';
import { useToast } from './ToastContext';
import SkeletonLoader from './components/ui/SkeletonLoader';
import { exportarPDF as exportarPDFUtil } from './utils/exportPDF';
import GradeTab from './components/tabs/GradeTab';
import EmCursoTab from './components/tabs/EmCursoTab';
import DashboardTab from './components/tabs/DashboardTab';
import FormaturaTab from './components/tabs/FormaturaTab';
import AddDisciplinaModal from './components/modals/AddDisciplinaModal';
import IniciarModal from './components/modals/IniciarModal';
import EditNotasModal from './components/modals/EditNotasModal';
import DeleteMenuModal from './components/modals/DeleteMenuModal';
import WelcomeModal from './components/modals/WelcomeModal';
import SettingsModal from './components/modals/SettingsModal';
import LogoutModal from './components/modals/LogoutModal';
import ResetModal from './components/modals/ResetModal';
import SimuladorModal from './components/modals/SimuladorModal';

export default function SistemaNotas({ onOpenAdmin }) {
  const { user, userName, userCurso, isNewUser, updateUserCurso, updateUserProfile, signOut } = useAuth();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const [confirmState, setConfirmState] = useState(null);
  const {
    disciplinas,
    setDisciplinas,
    adicionarDisciplina,
    atualizarDisciplina,
    removerDisciplina,
    importarDisciplinas,
    loading,
    syncing,
    isOnline,
    forceSync
  } = useNotas();

  const [activeTab, setActiveTab] = useState('grade');
  const [showAddDisciplina, setShowAddDisciplina] = useState(false);
  const [modoAdicionar, setModoAdicionar] = useState('uma'); // 'uma' ou 'varias'
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState(null);
  const [numSemestres, setNumSemestres] = useState(() => {
    const saved = localStorage.getItem('numSemestres');
    return saved ? parseInt(saved, 10) : 8;
  });
  const [expandedPeriodos, setExpandedPeriodos] = useState(() => {
    const saved = localStorage.getItem('numSemestres');
    const n = saved ? parseInt(saved, 10) : 8;
    const obj = {};
    for (let i = 1; i <= n; i++) obj[i] = true;
    return obj;
  });
  const [abaSemestre, setAbaSemestre] = useState({}); // { periodo: 'obrigatorias' | 'optativas' }
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [modoCompacto, setModoCompacto] = useState(() => localStorage.getItem('modoCompacto') === 'true');
  const [busca, setBusca] = useState('');
  const [novaDisciplina, setNovaDisciplina] = useState({
    nome: '', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, tipo: 'obrigatoria', status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null, observacao: ''
  });
  const [disciplinasMultiplas, setDisciplinasMultiplas] = useState('');
  const [periodoMultiplas, setPeriodoMultiplas] = useState(1);
  const [showIniciarModal, setShowIniciarModal] = useState(null);
  const [semestreIniciar, setSemestreIniciar] = useState('2024.2');
  const [editingNotas, setEditingNotas] = useState(null);
  const [notasTemp, setNotasTemp] = useState({ ga: '', gb: '', notaFinal: '', semestreCursado: '', observacao: '' });
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  
  // Modal de boas-vindas (novo usuário)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [cursoInput, setCursoInput] = useState('');
  const [savingCurso, setSavingCurso] = useState(false);

  // Modal de configurações
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsNome, setSettingsNome] = useState('');
  const [settingsCurso, setSettingsCurso] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  

  // Modal de confirmação de logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Modal de resetar todas as cadeiras
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resettingAll, setResettingAll] = useState(false);
  
  // Modal do simulador de notas
  const [showSimulador, setShowSimulador] = useState(false);
  const [simuladorDisciplina, setSimuladorDisciplina] = useState(null);
  const [simuladorGA, setSimuladorGA] = useState('');
  const [simuladorGB, setSimuladorGB] = useState('');

  // Mostrar modal de boas-vindas APENAS na primeira vez (usando localStorage)
  useEffect(() => {
    if (!loading && user && !userCurso) {
      const welcomeShown = localStorage.getItem(`welcomeShown_${user.id}`);
      if (!welcomeShown) {
        setShowWelcomeModal(true);
      }
    }
  }, [user, userCurso, loading]);



  const handleSaveCurso = async () => {
    if (!cursoInput.trim()) return;
    setSavingCurso(true);
    
    const result = await updateUserCurso(cursoInput.trim());
    
    if (result.error) {
      console.error('Erro ao salvar curso:', result.error);
      toast.error('Erro ao salvar o curso. Tente novamente.');
    } else {
      setShowWelcomeModal(false);
      // Marcar que o modal foi mostrado
      if (user) {
        localStorage.setItem(`welcomeShown_${user.id}`, 'true');
      }
    }
    
    setSavingCurso(false);
  };

  const handleSkipWelcome = () => {
    setShowWelcomeModal(false);
    // Marcar que o modal foi mostrado mesmo pulando
    if (user) {
      localStorage.setItem(`welcomeShown_${user.id}`, 'true');
    }
  };

  const openSettings = () => {
    setSettingsNome(userName || '');
    setSettingsCurso(userCurso || '');
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await updateUserProfile(settingsNome.trim(), settingsCurso.trim());
    setSavingSettings(false);
    setShowSettingsModal(false);
  };
  
  const [semestreAtualAno, setSemestreAtualAno] = useState(() => {
    const saved = localStorage.getItem('semestreAtualAno');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  const [semestreAtualNum, setSemestreAtualNum] = useState(() => {
    const saved = localStorage.getItem('semestreAtualNum');
    return saved ? parseInt(saved) : (new Date().getMonth() < 6 ? 1 : 2);
  });
  const [planejamentoSemestres, setPlanejamentoSemestres] = useState(() => {
    const saved = localStorage.getItem('planejamentoSemestres');
    return saved ? JSON.parse(saved) : [];
  });

  // Resetar planejamento quando o número de disciplinas mudar significativamente
  useEffect(() => {
    const totalDisciplinas = disciplinas.length;
    const savedTotal = localStorage.getItem('planejamentoTotalDisciplinas');
    
    if (savedTotal && parseInt(savedTotal) !== totalDisciplinas) {
      // Número de disciplinas mudou, resetar planejamento
      setPlanejamentoSemestres([]);
    }
    
    if (totalDisciplinas > 0) {
      localStorage.setItem('planejamentoTotalDisciplinas', totalDisciplinas.toString());
    }
  }, [disciplinas.length]);

  useEffect(() => {
    localStorage.setItem('semestreAtualAno', semestreAtualAno.toString());
    localStorage.setItem('semestreAtualNum', semestreAtualNum.toString());
    localStorage.setItem('planejamentoSemestres', JSON.stringify(planejamentoSemestres));
  }, [semestreAtualAno, semestreAtualNum, planejamentoSemestres]);

  useEffect(() => {
    localStorage.setItem('modoCompacto', modoCompacto.toString());
  }, [modoCompacto]);

  const estatisticas = useMemo(() => {
    const obrig = disciplinas.filter(d => d.tipo !== 'optativa');
    const total = obrig.length;
    const aprovadas = obrig.filter(d => d.status === 'APROVADA').length;
    const emCurso = obrig.filter(d => d.status === 'EM_CURSO').length;
    const reprovadas = obrig.filter(d => d.status === 'REPROVADA').length;
    const naoIniciadas = obrig.filter(d => d.status === 'NAO_INICIADA').length;
    const creditosTotal = obrig.reduce((acc, d) => acc + (d.creditos || 0), 0);
    const creditosConcluidos = obrig.filter(d => d.status === 'APROVADA').reduce((acc, d) => acc + (d.creditos || 0), 0);
    const notasAprovadas = obrig.filter(d => d.status === 'APROVADA' && d.notaFinal);
    const mediaGeral = notasAprovadas.length > 0 ? notasAprovadas.reduce((acc, d) => acc + d.notaFinal, 0) / notasAprovadas.length : 0;
    const progresso = total > 0 ? (aprovadas / total) * 100 : 0;
    return { total, aprovadas, emCurso, reprovadas, naoIniciadas, creditosTotal, creditosConcluidos, mediaGeral, progresso };
  }, [disciplinas]);

  const periodos = useMemo(() => Array.from({ length: numSemestres }, (_, i) => i + 1), [numSemestres]);

  // Auto-expandir se disciplinas existentes têm periodo > numSemestres
  useEffect(() => {
    if (disciplinas.length > 0) {
      const maxPeriodo = Math.max(...disciplinas.map(d => d.periodo || 0));
      if (maxPeriodo > numSemestres) {
        setNumSemestres(maxPeriodo);
        localStorage.setItem('numSemestres', String(maxPeriodo));
      }
    }
  }, [disciplinas, numSemestres]);

  // Sincronizar expandedPeriodos quando numSemestres muda
  useEffect(() => {
    setExpandedPeriodos(prev => {
      const next = {};
      for (let i = 1; i <= numSemestres; i++) {
        next[i] = prev[i] !== undefined ? prev[i] : true;
      }
      return next;
    });
  }, [numSemestres]);

  const disciplinasFiltradas = useMemo(() => {
    return disciplinas.filter(d => {
      const matchBusca = !busca || d.nome.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'TODOS' || d.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  }, [disciplinas, busca, filtroStatus]);

  const disciplinasPorPeriodo = useMemo(() => {
    const porPeriodo = {};
    periodos.forEach(p => { porPeriodo[p] = disciplinasFiltradas.filter(d => d.periodo === p); });
    return porPeriodo;
  }, [disciplinasFiltradas]);

  const addSemestre = useCallback(() => {
    setNumSemestres(prev => {
      const next = prev + 1;
      localStorage.setItem('numSemestres', String(next));
      return next;
    });
  }, []);

  const removeSemestre = useCallback(() => {
    const ultimoPeriodo = numSemestres;
    const temDisciplinas = disciplinas.some(d => d.periodo === ultimoPeriodo);
    if (temDisciplinas || numSemestres <= 1) return;
    setNumSemestres(prev => {
      const next = prev - 1;
      localStorage.setItem('numSemestres', String(next));
      return next;
    });
  }, [numSemestres, disciplinas]);

  const handleAddDisciplina = async () => {
    if (!novaDisciplina.nome.trim()) return;
    await adicionarDisciplina({ ...novaDisciplina });
    setNovaDisciplina({ nome: '', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, tipo: 'obrigatoria', status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null, observacao: '' });
    setShowAddDisciplina(false);
  };

  const handleAddMultiplas = async () => {
    const nomes = disciplinasMultiplas.split('\n').filter(n => n.trim());
    for (const nome of nomes) {
      await adicionarDisciplina({ nome: nome.trim(), periodo: periodoMultiplas, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, tipo: 'obrigatoria', status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null, observacao: '' });
    }
    setDisciplinasMultiplas('');
    setShowAddMultiplas(false);
  };

  const handleImportarDisciplinas = async (disciplinasImport, onProgress) => {
    try {
      // Auto-ajustar quantidade de semestres para cobrir os dados importados
      const maxPeriodo = Math.max(...disciplinasImport.map(d => d.periodo || 0), 0);
      if (maxPeriodo > 0 && maxPeriodo !== numSemestres) {
        setNumSemestres(maxPeriodo);
        localStorage.setItem('numSemestres', String(maxPeriodo));
      }

      const result = await importarDisciplinas(disciplinasImport, onProgress);
      if (result?.error) {
        console.error('Erro ao importar disciplinas:', result.error);
        toast.error(typeof result.error === 'string' ? result.error : 'Erro ao importar disciplinas.');
        return;
      }
      toast.success(`${disciplinasImport.length} disciplina(s) importada(s).`);
    } catch (error) {
      console.error('Erro ao importar disciplinas:', error);
      toast.error('Erro ao importar disciplinas. Tente novamente.');
    }
  };

  const handleAtualizarNotas = async (atualizacoes) => {
    let ok = 0;
    let falhas = 0;
    for (const { id, updates } of atualizacoes) {
      const result = await atualizarDisciplina(id, updates);
      if (result.error) falhas++;
      else ok++;
    }
    if (ok > 0) toast.success(`${ok} nota(s) atualizada(s).`);
    if (falhas > 0) toast.error(`${falhas} atualização(ões) falharam.`);
  };

  const handleRemoverDisciplina = async (id) => { await removerDisciplina(id); setShowDeleteMenu(null); };

  const iniciarDisciplina = async (id) => {
    await atualizarDisciplina(id, { status: 'EM_CURSO', semestreCursado: semestreIniciar });
    setShowIniciarModal(null);
  };

  const resetarDisciplina = async (id) => {
    await atualizarDisciplina(id, { status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null });
    setShowDeleteMenu(null);
  };

  const toggleTipo = async (id) => {
    const disc = disciplinas.find(d => d.id === id);
    const novoTipo = disc.tipo === 'optativa' ? 'obrigatoria' : 'optativa';
    await atualizarDisciplina(id, { tipo: novoTipo });
    toast.info(`Disciplina alterada para ${novoTipo === 'optativa' ? 'optativa' : 'obrigatória'}.`);
    setShowDeleteMenu(null);
  };

  // Gerar código aleatório para confirmação de reset
  const gerarCodigoReset = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  // Abrir modal de reset
  const abrirModalReset = useCallback(() => {
    setResetCode(gerarCodigoReset());
    setResetConfirmText('');
    setShowResetModal(true);
  }, [gerarCodigoReset]);

  // Resetar todas as cadeiras
  const resetarTodasCadeiras = async () => {
    if (resetConfirmText !== resetCode) return;
    
    setResettingAll(true);
    try {
      // Remover todas as disciplinas uma por uma
      for (const disc of disciplinas) {
        await removerDisciplina(disc.id);
      }
      setShowResetModal(false);
      setResetConfirmText('');
      toast.success('Todas as disciplinas foram removidas.');
    } catch (error) {
      console.error('Erro ao resetar cadeiras:', error);
      toast.error('Erro ao resetar disciplinas. Tente novamente.');
    } finally {
      setResettingAll(false);
    }
  };

  const startEditNotas = (disc) => {
    setEditingNotas(disc.id);
    setNotasTemp({ ga: disc.ga !== null ? disc.ga.toString() : '', gb: disc.gb !== null ? disc.gb.toString() : '', notaFinal: disc.notaFinal !== null ? disc.notaFinal.toString() : '', semestreCursado: disc.semestreCursado || '', observacao: disc.observacao || '' });
  };

  const saveNotas = async (id) => {
    const ga = notasTemp.ga ? parseFloat(notasTemp.ga) : null;
    const gb = notasTemp.gb ? parseFloat(notasTemp.gb) : null;
    let notaFinal = notasTemp.notaFinal ? parseFloat(notasTemp.notaFinal) : null;
    if (ga !== null && gb !== null && notaFinal === null) { notaFinal = (ga + gb) / 2; }
    const disc = disciplinas.find(d => d.id === id);
    let newStatus = disc.status;
    if (notaFinal !== null) { newStatus = notaFinal >= (disc.notaMinima || 6) ? 'APROVADA' : 'REPROVADA'; }
    await atualizarDisciplina(id, { ga, gb, notaFinal, status: newStatus, semestreCursado: notasTemp.semestreCursado || null, observacao: notasTemp.observacao || '' });
    setEditingNotas(null);
  };

  const togglePeriodo = (periodo) => { setExpandedPeriodos(prev => ({ ...prev, [periodo]: !prev[periodo] })); };
  const toggleAllPeriodos = () => {
    const allExpanded = periodos.every(p => expandedPeriodos[p]);
    const newState = {};
    periodos.forEach(p => newState[p] = !allExpanded);
    setExpandedPeriodos(newState);
  };

  const exportarPDF = () => {
    try {
      exportarPDFUtil({ disciplinas, estatisticas, userName, userCurso, periodos });
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      toast.error(err.message || 'Erro ao exportar PDF.');
    }
  };


  const dadosGrafico = [
    { name: 'Aprovadas', value: estatisticas.aprovadas, color: '#10b981' },
    { name: 'Em Curso', value: estatisticas.emCurso, color: '#3b82f6' },
    { name: 'Reprovadas', value: estatisticas.reprovadas, color: '#ef4444' },
    { name: 'Pendentes', value: estatisticas.naoIniciadas, color: '#64748b' },
  ];

  const dadosPorPeriodo = periodos.map(p => ({
    periodo: `${p}º`,
    aprovadas: disciplinas.filter(d => d.periodo === p && d.status === 'APROVADA').length,
    emCurso: disciplinas.filter(d => d.periodo === p && d.status === 'EM_CURSO').length,
    pendentes: disciplinas.filter(d => d.periodo === p && d.status === 'NAO_INICIADA').length }));

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none dark:block hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                <GraduationCap size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Sistema de Notas</h1>
                <p className="text-[var(--text-muted)] text-sm">Gerencie suas disciplinas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
              <button onClick={forceSync} disabled={syncing || !isOnline} className="p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50">
                <RefreshCw size={18} className={`text-[var(--text-secondary)] ${syncing ? 'animate-spin' : ''}`} />
              </button>
              {onOpenAdmin && (
                <button onClick={onOpenAdmin} className="p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)] transition-all">
                  <Shield size={18} className="text-violet-400" />
                </button>
              )}
              <button onClick={toggleTheme} className="p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)] transition-all" title={isDark ? 'Modo claro' : 'Modo escuro'}>
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
              </button>
              <button onClick={openSettings} className="p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)] transition-all">
                <Settings size={18} className="text-[var(--text-secondary)]" />
              </button>
              <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-[var(--text-secondary)] font-medium max-w-[120px] truncate">{user?.email}</span>
              </div>
              <button onClick={() => setShowLogoutModal(true)} className="p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] hover:bg-red-500/20 hover:border-red-500/30 transition-all">
                <LogOut size={18} className="text-red-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Saudação estilo Apple */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            {(() => {
              const hora = new Date().getHours();
              const saudacao = hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
              const primeiroNome = userName ? userName.split(' ')[0] : user?.email?.split('@')[0];
              return `${saudacao}, ${primeiroNome}!`;
            })()}
          </h2>
          {userCurso && (
            <p className="text-[var(--text-muted)] text-sm sm:text-base mt-1 flex items-center gap-2">
              <BookOpen size={16} className="text-violet-400" />
              {userCurso}
            </p>
          )}
        </div>

        {/* Tabs */}
        <nav className="mb-8 overflow-x-auto">
          <div className="inline-flex p-1.5 rounded-2xl bg-[var(--bg-tabs)] border border-[var(--border-tabs)] dark:backdrop-blur-xl">
            {[
              { id: 'grade', label: '📚 Grade', icon: BookOpen },
              { id: 'emCurso', label: '⏱️ Em Curso', icon: Clock },
              { id: 'dashboard', label: '📊 Dashboard', icon: TrendingUp },
              { id: 'formatura', label: '🎓 Formatura', icon: GraduationCap },
            ].map(tab => {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-lg dark:bg-white/10'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <tab.icon size={16} className="sm:hidden" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {activeTab === 'grade' && (
          <GradeTab
            estatisticas={estatisticas}
            busca={busca} setBusca={setBusca}
            filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
            exportarPDF={exportarPDF}
            setShowImportModal={setShowImportModal}
            setShowAddDisciplina={setShowAddDisciplina}
            modoCompacto={modoCompacto} setModoCompacto={setModoCompacto}
            expandedPeriodos={expandedPeriodos} togglePeriodo={togglePeriodo} toggleAllPeriodos={toggleAllPeriodos}
            periodos={periodos}
            addSemestre={addSemestre} removeSemestre={removeSemestre}
            numSemestres={numSemestres} disciplinas={disciplinas}
            disciplinasPorPeriodo={disciplinasPorPeriodo}
            abaSemestre={abaSemestre} setAbaSemestre={setAbaSemestre}
            setShowIniciarModal={setShowIniciarModal}
            setShowDeleteMenu={setShowDeleteMenu}
            startEditNotas={startEditNotas}
          />
        )}

        {activeTab === 'emCurso' && (
          <EmCursoTab
            disciplinas={disciplinas}
            setShowSimulador={setShowSimulador}
            startEditNotas={startEditNotas}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            dadosGrafico={dadosGrafico}
            dadosPorPeriodo={dadosPorPeriodo}
            estatisticas={estatisticas}
          />
        )}

        {activeTab === 'formatura' && (
          <FormaturaTab
            disciplinas={disciplinas}
            semestreAtualAno={semestreAtualAno}
            semestreAtualNum={semestreAtualNum}
            planejamentoSemestres={planejamentoSemestres}
            setPlanejamentoSemestres={setPlanejamentoSemestres}
          />
        )}

        {/* Modais */}
        {showAddDisciplina && (
          <AddDisciplinaModal
            onClose={() => setShowAddDisciplina(false)}
            modoAdicionar={modoAdicionar} setModoAdicionar={setModoAdicionar}
            novaDisciplina={novaDisciplina} setNovaDisciplina={setNovaDisciplina}
            handleAddDisciplina={handleAddDisciplina}
            disciplinasMultiplas={disciplinasMultiplas} setDisciplinasMultiplas={setDisciplinasMultiplas}
            periodoMultiplas={periodoMultiplas} setPeriodoMultiplas={setPeriodoMultiplas}
            handleAddMultiplas={handleAddMultiplas}
            periodos={periodos}
          />
        )}

        {showIniciarModal && (
          <IniciarModal
            nome={disciplinas.find(d => d.id === showIniciarModal)?.nome}
            semestreIniciar={semestreIniciar} setSemestreIniciar={setSemestreIniciar}
            onClose={() => setShowIniciarModal(null)}
            onConfirm={() => iniciarDisciplina(showIniciarModal)}
          />
        )}

        {editingNotas && (
          <EditNotasModal
            nome={disciplinas.find(d => d.id === editingNotas)?.nome}
            notasTemp={notasTemp} setNotasTemp={setNotasTemp}
            onClose={() => setEditingNotas(null)}
            onSave={() => saveNotas(editingNotas)}
          />
        )}

        {showDeleteMenu && (
          <DeleteMenuModal
            disc={disciplinas.find(d => d.id === showDeleteMenu)}
            onClose={() => setShowDeleteMenu(null)}
            onReset={() => resetarDisciplina(showDeleteMenu)}
            onToggleTipo={() => toggleTipo(showDeleteMenu)}
            onDelete={() => handleRemoverDisciplina(showDeleteMenu)}
          />
        )}

        {showImportModal && (
          <Suspense fallback={null}>
            <ImportModal onClose={() => setShowImportModal(false)} onImport={handleImportarDisciplinas} onUpdate={handleAtualizarNotas} disciplinasExistentes={disciplinas} />
          </Suspense>
        )}

        {showWelcomeModal && (
          <WelcomeModal
            cursoInput={cursoInput} setCursoInput={setCursoInput}
            savingCurso={savingCurso}
            onSave={handleSaveCurso} onSkip={handleSkipWelcome}
          />
        )}

        {showSettingsModal && (
          <SettingsModal
            user={user} userName={userName} userCurso={userCurso}
            settingsNome={settingsNome} setSettingsNome={setSettingsNome}
            settingsCurso={settingsCurso} setSettingsCurso={setSettingsCurso}
            savingSettings={savingSettings}
            onSave={handleSaveSettings} onClose={() => setShowSettingsModal(false)}
            disciplinas={disciplinas} setDisciplinas={setDisciplinas}
            setConfirmState={setConfirmState}
            abrirModalReset={abrirModalReset} toast={toast}
          />
        )}

        {showLogoutModal && (
          <LogoutModal
            onClose={() => setShowLogoutModal(false)}
            onConfirm={() => { setShowLogoutModal(false); signOut(); }}
          />
        )}

        {showResetModal && (
          <ResetModal
            disciplinasCount={disciplinas.length}
            resetCode={resetCode} resetConfirmText={resetConfirmText} setResetConfirmText={setResetConfirmText}
            resettingAll={resettingAll}
            onClose={() => { setShowResetModal(false); setResetConfirmText(''); }}
            onConfirm={resetarTodasCadeiras}
          />
        )}

        {showSimulador && (
          <SimuladorModal
            disciplinas={disciplinas}
            simuladorDisciplina={simuladorDisciplina} setSimuladorDisciplina={setSimuladorDisciplina}
            simuladorGA={simuladorGA} setSimuladorGA={setSimuladorGA}
            simuladorGB={simuladorGB} setSimuladorGB={setSimuladorGB}
            onClose={() => setShowSimulador(false)}
          />
        )}

        {/* FAB Mobile */}
        <button 
          onClick={() => setShowAddDisciplina(true)} 
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 sm:hidden bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/40"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Confirm Modal */}
      {confirmState && <ConfirmModal {...confirmState} />}
    </div>
  );
}
