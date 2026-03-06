import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, GraduationCap, Clock, RefreshCw, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import { useNotas } from './useNotas';
import { useAuth } from './AuthContext';
import ConfirmModal from './ConfirmModal';
import { useToast } from './ToastContext';
import SkeletonLoader from './components/ui/SkeletonLoader';
import Sidebar from './components/Sidebar';

import { exportarPDF as exportarPDFUtil } from './utils/exportPDF';
import { checkReminders } from './utils/notifications';
import { pageTransition } from './utils/animations';

// Lazy-loaded tabs
const GradeTab = React.lazy(() => import('./components/tabs/GradeTab'));
const EmCursoTab = React.lazy(() => import('./components/tabs/EmCursoTab'));
const DashboardTab = React.lazy(() => import('./components/tabs/DashboardTab'));
const FormaturaTab = React.lazy(() => import('./components/tabs/FormaturaTab'));

// Lazy-loaded modals
const ImportModal = React.lazy(() => import('./ImportModal'));
const AddDisciplinaModal = React.lazy(() => import('./components/modals/AddDisciplinaModal'));
const IniciarModal = React.lazy(() => import('./components/modals/IniciarModal'));
const EditNotasModal = React.lazy(() => import('./components/modals/EditNotasModal'));
const DeleteMenuModal = React.lazy(() => import('./components/modals/DeleteMenuModal'));
const WelcomeModal = React.lazy(() => import('./components/modals/WelcomeModal'));
const SettingsModal = React.lazy(() => import('./components/modals/SettingsModal'));
const LogoutModal = React.lazy(() => import('./components/modals/LogoutModal'));
const ResetModal = React.lazy(() => import('./components/modals/ResetModal'));
const SimuladorModal = React.lazy(() => import('./components/modals/SimuladorModal'));
const ShareModal = React.lazy(() => import('./components/modals/ShareModal'));

export default function SistemaNotas({ onOpenAdmin }) {
  const { user, userName, userCurso, isNewUser, updateUserCurso, updateUserProfile, signOut } = useAuth();
  const { toast } = useToast();
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
  const [modoAdicionar, setModoAdicionar] = useState('uma');
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
  const [abaSemestre, setAbaSemestre] = useState({});
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

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [cursoInput, setCursoInput] = useState('');
  const [savingCurso, setSavingCurso] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsNome, setSettingsNome] = useState('');
  const [settingsCurso, setSettingsCurso] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resettingAll, setResettingAll] = useState(false);

  const [showSimulador, setShowSimulador] = useState(false);
  const [simuladorDisciplina, setSimuladorDisciplina] = useState(null);
  const [simuladorGA, setSimuladorGA] = useState('');
  const [simuladorGB, setSimuladorGB] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddMultiplas, setShowAddMultiplas] = useState(false);

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
      if (user) localStorage.setItem(`welcomeShown_${user.id}`, 'true');
    }
    setSavingCurso(false);
  };

  const handleSkipWelcome = () => {
    setShowWelcomeModal(false);
    if (user) localStorage.setItem(`welcomeShown_${user.id}`, 'true');
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

  useEffect(() => {
    const totalDisciplinas = disciplinas.length;
    const savedTotal = localStorage.getItem('planejamentoTotalDisciplinas');
    if (savedTotal && Math.abs(totalDisciplinas - parseInt(savedTotal)) > 5) {
      setPlanejamentoSemestres([]);
      localStorage.removeItem('planejamentoSemestres');
    }
    localStorage.setItem('planejamentoTotalDisciplinas', String(totalDisciplinas));
  }, [disciplinas.length]);

  useEffect(() => {
    localStorage.setItem('planejamentoSemestres', JSON.stringify(planejamentoSemestres));
  }, [planejamentoSemestres]);

  useEffect(() => {
    localStorage.setItem('semestreAtualAno', String(semestreAtualAno));
    localStorage.setItem('semestreAtualNum', String(semestreAtualNum));
  }, [semestreAtualAno, semestreAtualNum]);

  useEffect(() => {
    if (disciplinas.length > 0) checkReminders(disciplinas);
  }, [disciplinas]);

  const periodos = useMemo(() => Array.from({ length: numSemestres }, (_, i) => i + 1), [numSemestres]);

  const disciplinasFiltradas = useMemo(() => {
    return disciplinas.filter(d => {
      const matchBusca = !busca || d.nome.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'TODOS' || d.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  }, [disciplinas, busca, filtroStatus]);

  const disciplinasPorPeriodo = useMemo(() => {
    const map = {};
    periodos.forEach(p => { map[p] = disciplinasFiltradas.filter(d => d.periodo === p); });
    return map;
  }, [disciplinasFiltradas, periodos]);

  const estatisticas = useMemo(() => {
    const total = disciplinas.length;
    const aprovadas = disciplinas.filter(d => d.status === 'APROVADA').length;
    const reprovadas = disciplinas.filter(d => d.status === 'REPROVADA').length;
    const emCurso = disciplinas.filter(d => d.status === 'EM_CURSO').length;
    const naoIniciadas = disciplinas.filter(d => d.status === 'NAO_INICIADA').length;
    const notas = disciplinas.filter(d => d.notaFinal !== null).map(d => d.notaFinal);
    const media = notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length) : 0;
    const progresso = total > 0 ? Math.round(((aprovadas) / total) * 100) : 0;
    const totalCreditos = disciplinas.reduce((s, d) => s + (d.creditos || 0), 0);
    const creditosAprovados = disciplinas.filter(d => d.status === 'APROVADA').reduce((s, d) => s + (d.creditos || 0), 0);
    const chTotal = disciplinas.reduce((s, d) => s + (d.cargaHoraria || 0), 0);
    const chAprovada = disciplinas.filter(d => d.status === 'APROVADA').reduce((s, d) => s + (d.cargaHoraria || 0), 0);
    return { total, aprovadas, reprovadas, emCurso, naoIniciadas, media, mediaGeral: media, progresso, totalCreditos, creditosAprovados, chTotal, chAprovada };
  }, [disciplinas]);

  const addSemestre = () => {
    const newNum = numSemestres + 1;
    setNumSemestres(newNum);
    localStorage.setItem('numSemestres', String(newNum));
    setExpandedPeriodos(prev => ({ ...prev, [newNum]: true }));
  };

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

  const gerarCodigoReset = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }, []);

  const abrirModalReset = useCallback(() => {
    setResetCode(gerarCodigoReset());
    setResetConfirmText('');
    setShowResetModal(true);
  }, [gerarCodigoReset]);

  const resetarTodasCadeiras = async () => {
    if (resetConfirmText !== resetCode) return;
    setResettingAll(true);
    try {
      for (const disc of disciplinas) await removerDisciplina(disc.id);
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
    if (ga !== null && gb !== null && notaFinal === null) notaFinal = (ga + gb) / 2;
    const disc = disciplinas.find(d => d.id === id);
    let newStatus = disc.status;
    if (notaFinal !== null) newStatus = notaFinal >= (disc.notaMinima || 6) ? 'APROVADA' : 'REPROVADA';
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
    periodo: `${p}`,
    aprovadas: disciplinas.filter(d => d.periodo === p && d.status === 'APROVADA').length,
    emCurso: disciplinas.filter(d => d.periodo === p && d.status === 'EM_CURSO').length,
    pendentes: disciplinas.filter(d => d.periodo === p && d.status === 'NAO_INICIADA').length }));

  if (loading) return <SkeletonLoader />;

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)]">

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        userName={userName}
        onOpenSettings={openSettings}
        onOpenLogout={() => setShowLogoutModal(true)}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Main content */}
      <div className="relative z-10 lg:ml-52">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-[var(--border-card)] bg-[var(--bg-root)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-end gap-1.5">
            <div className={`p-1.5 rounded-md ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
              {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
            </div>
            <button onClick={forceSync} disabled={syncing || !isOnline} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50">
              <RefreshCw size={15} className={`text-[var(--text-muted)] ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Greeting */}
          <div className="mb-6">
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
                <BookOpen size={16} style={{ color: 'var(--accent-400)' }} />
                {userCurso}
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'grade' && (
              <motion.div key="grade" {...pageTransition}>
                <Suspense fallback={null}>
                  <GradeTab
                    estatisticas={estatisticas}
                    busca={busca} setBusca={setBusca}
                    filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
                    exportarPDF={exportarPDF}
                    setShowImportModal={setShowImportModal}
                    setShowAddDisciplina={setShowAddDisciplina}
                    setShowShareModal={setShowShareModal}
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
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'emCurso' && (
              <motion.div key="emCurso" {...pageTransition}>
                <Suspense fallback={null}>
                  <EmCursoTab
                    disciplinas={disciplinas}
                    setShowSimulador={setShowSimulador}
                    startEditNotas={startEditNotas}
                  />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" {...pageTransition}>
                <Suspense fallback={null}>
                  <DashboardTab
                    dadosGrafico={dadosGrafico}
                    dadosPorPeriodo={dadosPorPeriodo}
                    estatisticas={estatisticas}
                  />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'formatura' && (
              <motion.div key="formatura" {...pageTransition}>
                <Suspense fallback={null}>
                  <FormaturaTab
                    disciplinas={disciplinas}
                    semestreAtualAno={semestreAtualAno}
                    semestreAtualNum={semestreAtualNum}
                    planejamentoSemestres={planejamentoSemestres}
                    setPlanejamentoSemestres={setPlanejamentoSemestres}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* FAB Mobile */}
        <button
          onClick={() => setShowAddDisciplina(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-lg bg-[var(--accent-500)] flex items-center justify-center hover:bg-[var(--accent-600)] transition-colors sm:hidden z-20"
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

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

      {showShareModal && (
        <Suspense fallback={null}>
          <ShareModal userId={user?.id} onClose={() => setShowShareModal(false)} />
        </Suspense>
      )}

      {confirmState && <ConfirmModal {...confirmState} />}
    </div>
  );
}
