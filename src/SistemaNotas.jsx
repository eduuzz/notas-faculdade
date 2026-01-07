import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, BookOpen, Award, TrendingUp, AlertCircle, CheckCircle, GraduationCap, Edit2, X, Clock, PlayCircle, ChevronDown, ChevronUp, Search, Save, Cloud, CloudOff, RefreshCw, LogOut, User, Wifi, WifiOff, Download, Upload as UploadIcon, RotateCcw, Sun, Moon, Monitor, List, LayoutGrid, Shield, ChevronRight, Sparkles, Settings, Crown, Zap, Star, Lock, FileText, Calculator, Target, Database, Calendar } from 'lucide-react';
import { useNotas } from './useNotas';
import { useAuth } from './AuthContext';
import { usePermissoes } from './usePermissoes';
import ImportModal from './ImportModal';
import UpgradeModal from './UpgradeModal';

// Configuração de status com cores estilo Apple
const STATUS = {
  NAO_INICIADA: { label: 'Pendente', color: 'slate', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', bar: 'bg-slate-500' },
  EM_CURSO: { label: 'Em Curso', color: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500' },
  APROVADA: { label: 'Aprovada', color: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500' },
  REPROVADA: { label: 'Reprovada', color: 'red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', bar: 'bg-red-500' }
};

// Componente Glass Card
const GlassCard = ({ children, className = '', hover = true, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl 
      bg-white/[0.03] backdrop-blur-xl 
      border border-white/10 
      ${hover ? 'hover:bg-white/[0.06] transition-all duration-300 cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

// Componente de Botão Gradiente
const GradientButton = ({ children, onClick, disabled, variant = 'primary', className = '', size = 'md' }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/25',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/25',
    secondary: 'bg-white/5 hover:bg-white/10 border border-white/10',
    amber: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/25',
    purple: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/25',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 rounded-xl font-medium
        transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </button>
  );
};

// Componente para mostrar funcionalidade bloqueada
const FeatureLock = ({ planoNecessario, children, onUpgrade }) => {
  const planoLabel = planoNecessario === 'pro' ? 'Pro' : 'Premium';
  const gradiente = planoNecessario === 'pro' 
    ? 'from-violet-500 to-indigo-600' 
    : 'from-amber-500 to-orange-600';
  
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
        <div className="text-center p-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradiente} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
            <Lock size={24} className="text-white" />
          </div>
          <p className="text-white font-medium mb-1">Recurso {planoLabel}</p>
          <p className="text-slate-400 text-sm mb-3">Faça upgrade para desbloquear</p>
          <button
            onClick={onUpgrade}
            className={`px-4 py-2 rounded-lg bg-gradient-to-r ${gradiente} text-white text-sm font-medium hover:scale-105 transition-transform`}
          >
            Fazer Upgrade
          </button>
        </div>
      </div>
    </div>
  );
};

// Botão que abre upgrade quando funcionalidade bloqueada
const BotaoComUpgrade = ({ temPermissao, planoNecessario, onUpgrade, onClick, children, className, disabled }) => {
  if (!temPermissao) {
    return (
      <button
        onClick={onUpgrade}
        className={`${className} relative group`}
        title={`Requer plano ${planoNecessario === 'pro' ? 'Pro' : 'Premium'}`}
      >
        <span className="opacity-50">{children}</span>
        <Lock size={14} className="absolute -top-1 -right-1 text-amber-400" />
      </button>
    );
  }
  
  return (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
};

export default function SistemaNotas({ onOpenAdmin }) {
  const { user, userName, userCurso, userPlano, userPlanoExpiraEm, isNewUser, updateUserCurso, updateUserProfile, signOut } = useAuth();
  const { permissoes, podeAdicionarDisciplina, getLimiteDisciplinas, temPermissao, planoAtual, planoExpirado, diasRestantes, podeEditar } = usePermissoes();
  const {
    disciplinas,
    setDisciplinas,
    adicionarDisciplina,
    atualizarDisciplina,
    removerDisciplina,
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
  const [expandedPeriodos, setExpandedPeriodos] = useState({1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true});
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [modoCompacto, setModoCompacto] = useState(() => localStorage.getItem('modoCompacto') === 'true');
  const [busca, setBusca] = useState('');
  const [novaDisciplina, setNovaDisciplina] = useState({
    nome: '', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null, observacao: ''
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
  
  // Modal de upgrade de plano
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Modal de aviso de expiração
  const [showExpiracaoModal, setShowExpiracaoModal] = useState(false);
  
  // Modal de confirmação de logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Estados do Planejador de Matrícula
  const [gradePlanejamento, setGradePlanejamento] = useState({});
  const [mostrarSabado, setMostrarSabado] = useState(true);
  const [creditosLimite, setCreditosLimite] = useState({ min: 12, max: 24 });
  const [salvandoPlanejamento, setSalvandoPlanejamento] = useState(false);
  
  // Modal do simulador de notas
  const [showSimulador, setShowSimulador] = useState(false);
  const [simuladorDisciplina, setSimuladorDisciplina] = useState(null);
  const [simuladorGA, setSimuladorGA] = useState('');
  const [simuladorGB, setSimuladorGB] = useState('');

  // Configuração dos horários do planejador
  const HORARIOS_PLANEJADOR = [
    { id: 'manha', label: '09:00 - 12:00', inicio: '09:00', fim: '12:00' },
    { id: 'noite1', label: '19:30 - 20:45', inicio: '19:30', fim: '20:45' },
    { id: 'noite2', label: '21:00 - 22:15', inicio: '21:00', fim: '22:15' },
  ];

  const DIAS_SEMANA = [
    { id: 'seg', label: 'Segunda', abrev: 'Seg' },
    { id: 'ter', label: 'Terça', abrev: 'Ter' },
    { id: 'qua', label: 'Quarta', abrev: 'Qua' },
    { id: 'qui', label: 'Quinta', abrev: 'Qui' },
    { id: 'sex', label: 'Sexta', abrev: 'Sex' },
    { id: 'sab', label: 'Sábado', abrev: 'Sáb' },
  ];

  const CORES_DISCIPLINAS = [
    'bg-violet-500/30 border-violet-500/50 text-violet-200',
    'bg-blue-500/30 border-blue-500/50 text-blue-200',
    'bg-emerald-500/30 border-emerald-500/50 text-emerald-200',
    'bg-amber-500/30 border-amber-500/50 text-amber-200',
    'bg-pink-500/30 border-pink-500/50 text-pink-200',
    'bg-cyan-500/30 border-cyan-500/50 text-cyan-200',
  ];

  // Carregar planejamento salvo do localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`planejamento_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setGradePlanejamento(parsed.grade || {});
          setCreditosLimite(parsed.limites || { min: 12, max: 24 });
          setMostrarSabado(parsed.mostrarSabado !== false);
        } catch (e) {
          console.error('Erro ao carregar planejamento:', e);
        }
      }
    }
  }, [user]);

  // Salvar planejamento automaticamente
  const salvarPlanejamento = useCallback(() => {
    if (!user) return;
    setSalvandoPlanejamento(true);
    const data = {
      grade: gradePlanejamento,
      limites: creditosLimite,
      mostrarSabado,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`planejamento_${user.id}`, JSON.stringify(data));
    setTimeout(() => setSalvandoPlanejamento(false), 500);
  }, [user, gradePlanejamento, creditosLimite, mostrarSabado]);

  // Salvar quando mudar a grade
  useEffect(() => {
    if (user && Object.keys(gradePlanejamento).length > 0) {
      salvarPlanejamento();
    }
  }, [gradePlanejamento, salvarPlanejamento, user]);

  // Funções do planejador
  const [coresDisciplinas, setCoresDisciplinas] = useState({});
  const [disciplinaSelecionadaPlanejador, setDisciplinaSelecionadaPlanejador] = useState(null);

  const getCorDisciplina = (disciplinaId) => {
    if (!coresDisciplinas[disciplinaId]) {
      const indice = Object.keys(coresDisciplinas).length % CORES_DISCIPLINAS.length;
      setCoresDisciplinas(prev => ({ ...prev, [disciplinaId]: CORES_DISCIPLINAS[indice] }));
      return CORES_DISCIPLINAS[indice];
    }
    return coresDisciplinas[disciplinaId];
  };

  const adicionarNaGradePlanejamento = (dia, horario, disciplina) => {
    const chave = `${dia}-${horario}`;
    const cor = getCorDisciplina(disciplina.id);
    setGradePlanejamento(prev => ({
      ...prev,
      [chave]: {
        disciplinaId: disciplina.id,
        nome: disciplina.nome,
        creditos: disciplina.creditos || 4,
        cor
      }
    }));
    setDisciplinaSelecionadaPlanejador(null);
  };

  const removerDaGradePlanejamento = (dia, horario) => {
    const chave = `${dia}-${horario}`;
    setGradePlanejamento(prev => {
      const novo = { ...prev };
      delete novo[chave];
      return novo;
    });
  };

  const limparGradePlanejamento = () => {
    setGradePlanejamento({});
    setCoresDisciplinas({});
    if (user) {
      localStorage.removeItem(`planejamento_${user.id}`);
    }
  };

  // Mostrar modal de boas-vindas APENAS na primeira vez (usando localStorage)
  useEffect(() => {
    if (!loading && user && !userCurso) {
      const welcomeShown = localStorage.getItem(`welcomeShown_${user.id}`);
      if (!welcomeShown) {
        setShowWelcomeModal(true);
      }
    }
  }, [user, userCurso, loading]);

  // Mostrar pop-up de aviso de expiração (quando faltam 30 dias ou menos)
  useEffect(() => {
    if (!loading && user && diasRestantes !== null && diasRestantes <= 30 && diasRestantes > 0 && !planoExpirado) {
      // Verificar se já mostrou hoje
      const ultimoAviso = localStorage.getItem(`expiracaoAviso_${user.id}`);
      const hoje = new Date().toDateString();
      
      if (ultimoAviso !== hoje) {
        // Mostrar após 2 segundos para não ser muito intrusivo
        const timer = setTimeout(() => {
          setShowExpiracaoModal(true);
          localStorage.setItem(`expiracaoAviso_${user.id}`, hoje);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, diasRestantes, planoExpirado, loading]);

  const handleSaveCurso = async () => {
    if (!cursoInput.trim()) return;
    setSavingCurso(true);
    
    const result = await updateUserCurso(cursoInput.trim());
    
    if (result.error) {
      console.error('Erro ao salvar curso:', result.error);
      alert('Erro ao salvar curso. Verifique o console.');
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
    const total = disciplinas.length;
    const aprovadas = disciplinas.filter(d => d.status === 'APROVADA').length;
    const emCurso = disciplinas.filter(d => d.status === 'EM_CURSO').length;
    const reprovadas = disciplinas.filter(d => d.status === 'REPROVADA').length;
    const naoIniciadas = disciplinas.filter(d => d.status === 'NAO_INICIADA').length;
    const creditosTotal = disciplinas.reduce((acc, d) => acc + (d.creditos || 0), 0);
    const creditosConcluidos = disciplinas.filter(d => d.status === 'APROVADA').reduce((acc, d) => acc + (d.creditos || 0), 0);
    const notasAprovadas = disciplinas.filter(d => d.status === 'APROVADA' && d.notaFinal);
    const mediaGeral = notasAprovadas.length > 0 ? notasAprovadas.reduce((acc, d) => acc + d.notaFinal, 0) / notasAprovadas.length : 0;
    const progresso = total > 0 ? (aprovadas / total) * 100 : 0;
    return { total, aprovadas, emCurso, reprovadas, naoIniciadas, creditosTotal, creditosConcluidos, mediaGeral, progresso };
  }, [disciplinas]);

  const periodos = [1, 2, 3, 4, 5, 6, 7, 8];

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

  const handleAddDisciplina = async () => {
    if (!novaDisciplina.nome.trim()) return;
    await adicionarDisciplina({ ...novaDisciplina });
    setNovaDisciplina({ nome: '', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null, observacao: '' });
    setShowAddDisciplina(false);
  };

  const handleAddMultiplas = async () => {
    const nomes = disciplinasMultiplas.split('\n').filter(n => n.trim());
    for (const nome of nomes) {
      await adicionarDisciplina({ nome: nome.trim(), periodo: periodoMultiplas, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null, observacao: '' });
    }
    setDisciplinasMultiplas('');
    setShowAddMultiplas(false);
  };

  const handleImportarDisciplinas = async (disciplinasImport) => {
    for (const disciplina of disciplinasImport) { await adicionarDisciplina(disciplina); }
    setShowImportModal(false);
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
    console.log('=== DEBUG PDF ===');
    console.log('userPlano:', userPlano);
    console.log('temPermissao exportarPdf:', temPermissao('exportarPdf'));
    console.log('temPermissao exportarPdfGraficos:', temPermissao('exportarPdfGraficos'));
    
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      console.error('jsPDF não está disponível!');
      alert('Erro: biblioteca PDF não carregada. Recarregue a página.');
      return;
    }
    
    const doc = new jsPDF();
    const podeGraficos = temPermissao('exportarPdfGraficos');
    
    // Cores por plano
    const isPremium = podeGraficos;
    const corPrincipal = isPremium ? [245, 158, 11] : [59, 130, 246]; // Dourado ou Azul
    const corSecundaria = isPremium ? [217, 119, 6] : [37, 99, 235];
    
    // Cores gerais
    const emerald = [16, 185, 129];
    const blue = [59, 130, 246];
    const red = [239, 68, 68];
    const amber = [245, 158, 11];
    const violet = [124, 58, 237];
    const gray700 = [55, 65, 81];
    const gray600 = [75, 85, 99];
    const gray400 = [156, 163, 175];
    const gray200 = [229, 231, 235];
    const gray100 = [243, 244, 246];
    const black = [17, 24, 39];
    const white = [255, 255, 255];
    
    // Função para desenhar gradiente
    const drawGradient = (x, y, w, h, color1, color2) => {
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const ratio = i / steps;
        const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio);
        const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio);
        const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio);
        doc.setFillColor(r, g, b);
        doc.rect(x, y + (h / steps) * i, w, h / steps + 0.5, 'F');
      }
    };
    
    // Função para desenhar gráfico de pizza
    const drawPieChart = (cx, cy, radius, data) => {
      let startAngle = -Math.PI / 2;
      const total = data.reduce((sum, d) => sum + d.value, 0);
      if (total === 0) return;
      
      data.forEach(item => {
        if (item.value === 0) return;
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        
        doc.setFillColor(...item.color);
        
        // Desenhar fatia como triângulos
        const steps = Math.max(1, Math.floor(sliceAngle * 20));
        for (let i = 0; i < steps; i++) {
          const a1 = startAngle + (sliceAngle * i / steps);
          const a2 = startAngle + (sliceAngle * (i + 1) / steps);
          const x1 = cx + Math.cos(a1) * radius;
          const y1 = cy + Math.sin(a1) * radius;
          const x2 = cx + Math.cos(a2) * radius;
          const y2 = cy + Math.sin(a2) * radius;
          
          doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
        }
        
        startAngle = endAngle;
      });
      
      // Círculo branco no centro (donut)
      doc.setFillColor(...white);
      doc.circle(cx, cy, radius * 0.5, 'F');
    };
    
    // Calcular ranking de notas
    const disciplinasComNota = disciplinas
      .filter(d => d.notaFinal && d.status === 'APROVADA')
      .sort((a, b) => b.notaFinal - a.notaFinal);
    const top5Notas = disciplinasComNota.slice(0, 5);
    
    // Calcular previsão de formatura
    const creditosPorSemestre = 30; // média
    const creditosFaltando = disciplinas
      .filter(d => d.status !== 'APROVADA')
      .reduce((sum, d) => sum + (d.creditos || 4), 0);
    const semestresRestantes = Math.ceil(creditosFaltando / creditosPorSemestre);
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth();
    const semestreAtual = mesAtual < 6 ? 1 : 2;
    let anoFormatura = anoAtual;
    let semestreFormatura = semestreAtual;
    for (let i = 0; i < semestresRestantes; i++) {
      semestreFormatura++;
      if (semestreFormatura > 2) {
        semestreFormatura = 1;
        anoFormatura++;
      }
    }
    
    // ============ PÁGINA 1: CAPA (Premium) ou Header (Pro) ============
    
    if (isPremium) {
      // === CAPA PREMIUM ===
      // Fundo com gradiente dourado no topo
      drawGradient(0, 0, 210, 80, corPrincipal, corSecundaria);
      
      // Ícone decorativo
      doc.setFillColor(255, 255, 255, 0.2);
      doc.circle(105, 40, 25, 'F');
      doc.setFontSize(28);
      doc.setTextColor(...white);
      doc.text('🎓', 97, 48);
      
      // Título principal
      doc.setFontSize(32);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text('Grade Curricular', 105, 105, { align: 'center' });
      
      // Curso
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...gray600);
      doc.text(userCurso || 'Ciencia da Computacao', 105, 118, { align: 'center' });
      
      // Linha decorativa
      doc.setDrawColor(...corPrincipal);
      doc.setLineWidth(1);
      doc.line(60, 128, 150, 128);
      
      // Nome do aluno em destaque
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text(userName || 'Estudante', 105, 148, { align: 'center' });
      
      // Cards de estatísticas na capa
      const capaCardY = 165;
      const capaCards = [
        { label: 'Aprovadas', value: estatisticas.aprovadas, color: emerald },
        { label: 'Progresso', value: `${estatisticas.progresso.toFixed(0)}%`, color: corPrincipal },
        { label: 'Media', value: estatisticas.mediaGeral.toFixed(1), color: violet },
      ];
      
      capaCards.forEach((card, i) => {
        const x = 30 + (55 * i);
        
        doc.setFillColor(...gray100);
        doc.roundedRect(x, capaCardY, 50, 40, 4, 4, 'F');
        
        // Barra superior colorida
        doc.setFillColor(...card.color);
        doc.roundedRect(x, capaCardY, 50, 4, 4, 4, 'F');
        doc.rect(x, capaCardY + 2, 50, 2, 'F');
        
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...black);
        doc.text(String(card.value), x + 25, capaCardY + 22, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...gray600);
        doc.text(card.label, x + 25, capaCardY + 33, { align: 'center' });
      });
      
      // Previsão de formatura
      if (semestresRestantes > 0) {
        doc.setFillColor(...corPrincipal);
        doc.roundedRect(55, 220, 100, 24, 4, 4, 'F');
        
        doc.setFontSize(9);
        doc.setTextColor(...white);
        doc.text('Previsao de Formatura', 105, 232, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${semestreFormatura}. Semestre de ${anoFormatura}`, 105, 240, { align: 'center' });
      } else {
        doc.setFillColor(...emerald);
        doc.roundedRect(55, 220, 100, 24, 4, 4, 'F');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...white);
        doc.text('Curso Concluido!', 105, 236, { align: 'center' });
      }
      
      // Data de geração
      doc.setFontSize(9);
      doc.setTextColor(...gray400);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 105, 260, { align: 'center' });
      
      // Badge Premium
      doc.setFillColor(...corPrincipal);
      doc.roundedRect(75, 275, 60, 12, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...white);
      doc.text('PREMIUM', 105, 283, { align: 'center' });
      
      doc.addPage();
    }
    
    // ============ PÁGINA DE DISCIPLINAS ============
    
    // Header da página de disciplinas
    if (!isPremium) {
      // Header Pro - mais simples mas elegante
      doc.setFillColor(...corPrincipal);
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...white);
      doc.text('Grade Curricular', 14, 22);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(userCurso || 'Ciencia da Computacao', 14, 30);
    } else {
      // Header Premium - discreto nas páginas internas
      doc.setFillColor(...gray100);
      doc.rect(0, 0, 210, 25, 'F');
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...gray700);
      doc.text('Disciplinas por Semestre', 14, 16);
      
      doc.setFontSize(9);
      doc.setTextColor(...gray400);
      doc.text(`${userName} - ${userCurso}`, 196, 16, { align: 'right' });
    }
    
    let y = isPremium ? 35 : 45;
    
    // Info compacta (só Pro)
    if (!isPremium) {
      doc.setFontSize(9);
      doc.setTextColor(...gray600);
      doc.text(`${userName || 'Estudante'}  •  ${new Date().toLocaleDateString('pt-BR')}`, 14, y);
      
      const statsText = `${estatisticas.aprovadas} aprov.  •  ${estatisticas.progresso.toFixed(0)}%  •  Media ${estatisticas.mediaGeral.toFixed(1)}`;
      doc.text(statsText, 196, y, { align: 'right' });
      y += 10;
    }
    
    // Disciplinas por período
    periodos.forEach(periodo => {
      const discs = disciplinas.filter(d => d.periodo === periodo);
      if (discs.length === 0) return;
      
      const espacoNecessario = 14 + (discs.length * 8);
      if (y + espacoNecessario > 280) { 
        doc.addPage();
        if (isPremium) {
          doc.setFillColor(...gray100);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setFontSize(9);
          doc.setTextColor(...gray400);
          doc.text('Disciplinas (continuacao)', 14, 10);
        }
        y = isPremium ? 25 : 20; 
      }
      
      // Header do período
      const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
      const percentual = Math.round((aprovadas / discs.length) * 100);
      
      // Fundo colorido do header do semestre
      const headerColor = percentual === 100 ? emerald : percentual >= 50 ? corPrincipal : gray400;
      doc.setFillColor(...headerColor);
      doc.roundedRect(14, y - 4, 182, 10, 2, 2, 'F');
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...white);
      doc.text(`${periodo}. Semestre`, 18, y + 3);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${aprovadas}/${discs.length} (${percentual}%)`, 192, y + 3, { align: 'right' });
      
      y += 12;
      
      // Lista de disciplinas
      discs.forEach(d => {
        if (y > 285) { 
          doc.addPage();
          if (isPremium) {
            doc.setFillColor(...gray100);
            doc.rect(0, 0, 210, 15, 'F');
          }
          y = isPremium ? 25 : 20; 
        }
        
        const nota = d.notaFinal ? d.notaFinal.toFixed(1) : null;
        
        // Bolinha de status
        const statusColors = {
          'APROVADA': emerald,
          'EM_CURSO': blue,
          'REPROVADA': red,
          'NAO_INICIADA': gray200
        };
        doc.setFillColor(...(statusColors[d.status] || gray200));
        doc.circle(18, y - 1, 2, 'F');
        
        // Nome
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...black);
        const nomeDisplay = d.nome.length > 50 ? d.nome.substring(0, 50) + '...' : d.nome;
        doc.text(nomeDisplay, 24, y);
        
        // Nota e créditos
        doc.setTextColor(...gray400);
        let infoRight = `${d.creditos}cr`;
        if (nota) infoRight = `${nota} • ${d.creditos}cr`;
        doc.text(infoRight, 196, y, { align: 'right' });
        
        y += 7;
      });
      
      y += 6;
    });
    
    // ============ PÁGINA DE RESUMO ============
    doc.addPage();
    
    if (isPremium) {
      // === RESUMO PREMIUM ===
      
      // Header
      drawGradient(0, 0, 210, 40, corPrincipal, corSecundaria);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...white);
      doc.text('Analise Completa', 105, 26, { align: 'center' });
      
      // Cards de estatísticas
      const statsY = 50;
      const statsCards = [
        { label: 'Total', value: estatisticas.total, color: gray600 },
        { label: 'Aprovadas', value: estatisticas.aprovadas, color: emerald },
        { label: 'Em Curso', value: estatisticas.emCurso, color: blue },
        { label: 'Reprovadas', value: estatisticas.reprovadas, color: red },
        { label: 'Pendentes', value: estatisticas.naoIniciadas, color: gray400 },
      ];
      
      statsCards.forEach((card, i) => {
        const x = 10 + (39 * i);
        
        doc.setFillColor(...gray100);
        doc.roundedRect(x, statsY, 37, 28, 3, 3, 'F');
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...card.color);
        doc.text(String(card.value), x + 18.5, statsY + 14, { align: 'center' });
        
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...gray600);
        doc.text(card.label, x + 18.5, statsY + 23, { align: 'center' });
      });
      
      // Gráfico de Pizza
      const pieData = [
        { value: estatisticas.aprovadas, color: emerald },
        { value: estatisticas.emCurso, color: blue },
        { value: estatisticas.reprovadas, color: red },
        { value: estatisticas.naoIniciadas, color: gray400 },
      ];
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text('Distribuicao', 14, 95);
      
      drawPieChart(55, 130, 28, pieData);
      
      // Legenda do gráfico
      const legendItems = [
        { label: 'Aprovadas', color: emerald },
        { label: 'Em Curso', color: blue },
        { label: 'Reprovadas', color: red },
        { label: 'Pendentes', color: gray400 },
      ];
      
      legendItems.forEach((item, i) => {
        const ly = 108 + (i * 12);
        doc.setFillColor(...item.color);
        doc.circle(95, ly, 3, 'F');
        doc.setFontSize(9);
        doc.setTextColor(...gray600);
        doc.text(item.label, 101, ly + 1);
      });
      
      // Média Geral
      doc.setFillColor(...corPrincipal);
      doc.roundedRect(140, 95, 56, 55, 4, 4, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(...white);
      doc.text('Media Geral', 168, 108, { align: 'center' });
      
      doc.setFontSize(28);
      doc.setFont(undefined, 'bold');
      doc.text(estatisticas.mediaGeral.toFixed(2), 168, 135, { align: 'center' });
      
      // Gráfico de Barras por Semestre
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text('Desempenho por Semestre', 14, 170);
      
      let barY = 180;
      const barMaxWidth = 100;
      
      periodos.forEach(periodo => {
        const discs = disciplinas.filter(d => d.periodo === periodo);
        if (discs.length === 0) return;
        if (barY > 240) return;
        
        const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
        const percentual = (aprovadas / discs.length) * 100;
        const filledWidth = (percentual / 100) * barMaxWidth;
        
        doc.setFontSize(8);
        doc.setTextColor(...gray600);
        doc.text(`${periodo}. Sem`, 14, barY + 4);
        
        doc.setFillColor(...gray200);
        doc.roundedRect(38, barY, barMaxWidth, 6, 2, 2, 'F');
        
        if (filledWidth > 0) {
          const barColor = percentual >= 80 ? emerald : percentual >= 50 ? amber : red;
          doc.setFillColor(...barColor);
          doc.roundedRect(38, barY, Math.max(filledWidth, 3), 6, 2, 2, 'F');
        }
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...gray700);
        doc.text(`${percentual.toFixed(0)}%`, 145, barY + 4);
        
        barY += 10;
      });
      
      // Ranking das melhores notas
      if (top5Notas.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...black);
        doc.text('Top 5 Melhores Notas', 14, 260);
        
        top5Notas.forEach((d, i) => {
          const ry = 268 + (i * 6);
          
          // Medalha
          const medalColors = [[255, 215, 0], [192, 192, 192], [205, 127, 50], gray400, gray400];
          doc.setFillColor(...medalColors[i]);
          doc.circle(18, ry, 2, 'F');
          
          doc.setFontSize(8);
          doc.setTextColor(...black);
          const nomeRank = d.nome.length > 35 ? d.nome.substring(0, 35) + '...' : d.nome;
          doc.text(nomeRank, 24, ry + 1);
          
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...emerald);
          doc.text(d.notaFinal.toFixed(1), 150, ry + 1);
        });
      }
      
      // Previsão de Formatura
      doc.setFillColor(...gray100);
      doc.roundedRect(160, 170, 40, 75, 4, 4, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(...gray600);
      doc.text('Formatura', 180, 182, { align: 'center' });
      
      if (semestresRestantes > 0) {
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...corPrincipal);
        doc.text(String(semestresRestantes), 180, 205, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...gray600);
        doc.text('semestres', 180, 215, { align: 'center' });
        doc.text('restantes', 180, 222, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...black);
        doc.text(`${semestreFormatura}/${anoFormatura}`, 180, 238, { align: 'center' });
      } else {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...emerald);
        doc.text('Concluido!', 180, 210, { align: 'center' });
      }
      
      // Rodapé Premium
      doc.setFontSize(8);
      doc.setTextColor(...corPrincipal);
      doc.text('Relatorio Premium - Sistema de Notas', 105, 292, { align: 'center' });
      
    } else {
      // === RESUMO PRO ===
      
      // Header
      doc.setFillColor(...corPrincipal);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...white);
      doc.text('Resumo', 14, 20);
      
      // Cards de estatísticas
      const cardY = 45;
      const cards = [
        { label: 'Total', value: estatisticas.total },
        { label: 'Aprovadas', value: estatisticas.aprovadas },
        { label: 'Em Curso', value: estatisticas.emCurso },
        { label: 'Progresso', value: `${estatisticas.progresso.toFixed(0)}%` },
      ];
      
      cards.forEach((card, i) => {
        const x = 14 + (46 * i);
        
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...black);
        doc.text(String(card.value), x, cardY + 8);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...gray400);
        doc.text(card.label, x, cardY + 16);
      });
      
      // Média em destaque
      doc.setFillColor(...corPrincipal);
      doc.roundedRect(14, 75, 182, 28, 4, 4, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(...white);
      doc.text('Media Geral Ponderada', 24, 91);
      
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(estatisticas.mediaGeral.toFixed(2), 186, 92, { align: 'right' });
      
      // Lista por semestre
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text('Por Semestre', 14, 120);
      
      let listY = 130;
      periodos.forEach(periodo => {
        const discs = disciplinas.filter(d => d.periodo === periodo);
        if (discs.length === 0) return;
        
        const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
        const percentual = ((aprovadas/discs.length)*100).toFixed(0);
        
        doc.setFontSize(9);
        doc.setTextColor(...gray600);
        doc.text(`${periodo}. Semestre`, 14, listY);
        doc.setTextColor(...gray400);
        doc.text(`${aprovadas}/${discs.length} (${percentual}%)`, 186, listY, { align: 'right' });
        
        listY += 9;
      });
      
      // Rodapé Pro
      doc.setFontSize(8);
      doc.setTextColor(...corPrincipal);
      doc.text('Sistema de Notas - Pro', 105, 288, { align: 'center' });
    }
    
    doc.save(`grade-curricular-${isPremium ? 'premium' : 'pro'}-${new Date().toISOString().split('T')[0]}.pdf`);
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
    pendentes: disciplinas.filter(d => d.periodo === p && d.status === 'NAO_INICIADA').length,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mx-auto mb-4">
            <RefreshCw size={32} className="text-white animate-spin" />
          </div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner de Expiração */}
        {planoExpirado && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="text-red-400" size={22} />
                </div>
                <div>
                  <h3 className="text-red-300 font-semibold">Seu período gratuito expirou!</h3>
                  <p className="text-red-200/70 text-sm">Suas disciplinas estão seguras, mas você não pode mais editar. Assine para continuar.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white font-medium hover:from-red-400 hover:to-orange-400 transition-all shadow-lg shadow-red-500/25"
              >
                Assinar Agora
              </button>
            </div>
          </div>
        )}

        {/* Banner de Aviso de Expiração (menos de 30 dias) */}
        {!planoExpirado && diasRestantes !== null && diasRestantes <= 30 && diasRestantes > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="text-amber-400" size={22} />
                </div>
                <div>
                  <h3 className="text-amber-300 font-semibold">
                    {diasRestantes === 1 ? 'Último dia!' : `${diasRestantes} dias restantes`}
                  </h3>
                  <p className="text-amber-200/70 text-sm">Seu período gratuito está acabando. Assine para não perder acesso.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl text-black font-medium hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25"
              >
                Ver Planos
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                <GraduationCap size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Sistema de Notas</h1>
                <p className="text-slate-500 text-sm">Gerencie suas disciplinas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
              <button onClick={forceSync} disabled={syncing || !isOnline} className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50">
                <RefreshCw size={18} className={`text-slate-400 ${syncing ? 'animate-spin' : ''}`} />
              </button>
              {onOpenAdmin && (
                <button onClick={onOpenAdmin} className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <Shield size={18} className="text-violet-400" />
                </button>
              )}
              <button onClick={openSettings} className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <Settings size={18} className="text-slate-400" />
              </button>
              <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-300 font-medium max-w-[120px] truncate">{user?.email}</span>
              </div>
              <button onClick={() => setShowLogoutModal(true)} className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition-all">
                <LogOut size={18} className="text-red-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Saudação estilo Apple */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {(() => {
              const hora = new Date().getHours();
              const saudacao = hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
              const primeiroNome = userName ? userName.split(' ')[0] : user?.email?.split('@')[0];
              return `${saudacao}, ${primeiroNome}!`;
            })()}
          </h2>
          {userCurso && (
            <p className="text-slate-500 text-sm sm:text-base mt-1 flex items-center gap-2">
              <BookOpen size={16} className="text-violet-400" />
              {userCurso}
            </p>
          )}
        </div>

        {/* Tabs */}
        <nav className="mb-8 overflow-x-auto">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            {[
              { id: 'grade', label: '📚 Grade', icon: BookOpen, requerPermissao: null },
              { id: 'planejar', label: '📅 Planejar', icon: Calendar, requerPermissao: null },
              { id: 'emCurso', label: '⏱️ Em Curso', icon: Clock, requerPermissao: null },
              { id: 'dashboard', label: '📊 Dashboard', icon: TrendingUp, requerPermissao: null },
              { id: 'formatura', label: '🎓 Formatura', icon: GraduationCap, requerPermissao: 'previsaoFormatura' },
            ].map(tab => {
              const bloqueado = tab.requerPermissao && !temPermissao(tab.requerPermissao);
              
              return (
                <button 
                  key={tab.id} 
                  onClick={() => bloqueado ? setShowUpgradeModal(true) : setActiveTab(tab.id)} 
                  className={`relative px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? tab.id === 'planejar' 
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-lg' 
                        : 'bg-white/10 text-white shadow-lg' 
                      : tab.id === 'planejar'
                        ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                        : 'text-slate-400 hover:text-white'
                  } ${bloqueado ? 'opacity-60' : ''}`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <tab.icon size={18} className="sm:hidden" />
                  {bloqueado && <Lock size={12} className="absolute -top-1 -right-1 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Grade */}
        {activeTab === 'grade' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Aprovadas', value: estatisticas.aprovadas, icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/30' },
                { label: 'Em Curso', value: estatisticas.emCurso, icon: Clock, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
                { label: 'Progresso', value: `${estatisticas.progresso.toFixed(0)}%`, icon: TrendingUp, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30' },
                { label: 'Média', value: estatisticas.mediaGeral.toFixed(1), icon: Award, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
              ].map((stat, i) => (
                <GlassCard key={i} className="p-5" hover={false}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-semibold">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                      <stat.icon size={24} className="text-white" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="Buscar disciplina..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none cursor-pointer">
                <option value="TODOS" className="bg-slate-800">Todos</option>
                <option value="APROVADA" className="bg-slate-800">Aprovadas</option>
                <option value="EM_CURSO" className="bg-slate-800">Em Curso</option>
                <option value="NAO_INICIADA" className="bg-slate-800">Pendentes</option>
                <option value="REPROVADA" className="bg-slate-800">Reprovadas</option>
              </select>
              <div className="flex gap-2 flex-wrap">
                <GradientButton 
                  variant="success" 
                  onClick={() => temPermissao('exportarPdf') ? exportarPDF() : setShowUpgradeModal(true)}
                  className={!temPermissao('exportarPdf') ? 'relative' : ''}
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">PDF</span>
                  {!temPermissao('exportarPdf') && <Lock size={12} className="absolute -top-1 -right-1 text-amber-400" />}
                </GradientButton>
                <GradientButton variant="amber" onClick={() => !planoExpirado && setShowImportModal(true)} disabled={planoExpirado}><UploadIcon size={18} /><span className="hidden sm:inline">Importar</span></GradientButton>
                <GradientButton 
                  onClick={() => !planoExpirado && podeAdicionarDisciplina(disciplinas.length) ? setShowAddDisciplina(true) : setShowUpgradeModal(true)}
                  disabled={planoExpirado}
                >
                  <Plus size={18} /><span className="hidden sm:inline">Adicionar Cadeira</span>
                </GradientButton>
              </div>
              {/* Indicador de limite para plano básico/gratuito */}
              {getLimiteDisciplinas() !== Infinity && (
                <div className="text-xs text-slate-500">
                  {disciplinas.length}/{getLimiteDisciplinas()} disciplinas
                  {disciplinas.length >= getLimiteDisciplinas() && (
                    <span className="text-amber-400 ml-2">• Limite atingido</span>
                  )}
                </div>
              )}
              {planoExpirado && (
                <div className="text-xs text-red-400">
                  ⚠️ Modo somente leitura - Assine para editar
                </div>
              )}
            </div>

            {/* Toggle buttons */}
            <div className="flex items-center justify-between">
              <button onClick={() => setModoCompacto(!modoCompacto)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                {modoCompacto ? <LayoutGrid size={18} /> : <List size={18} />}
                <span className="text-sm">{modoCompacto ? 'Expandido' : 'Compacto'}</span>
              </button>
              <button onClick={toggleAllPeriodos} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                {periodos.every(p => expandedPeriodos[p]) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                <span className="text-sm">{periodos.every(p => expandedPeriodos[p]) ? 'Minimizar' : 'Expandir'}</span>
              </button>
            </div>

            {/* Periodos */}
            <div className="space-y-4">
              {periodos.map(periodo => {
                const discs = disciplinasPorPeriodo[periodo];
                const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
                const total = discs.length;
                const progresso = total > 0 ? (aprovadas / total) * 100 : 0;
                if (total === 0 && filtroStatus !== 'TODOS') return null;

                return (
                  <div key={periodo} className="space-y-3">
                    <GlassCard className="p-4" onClick={() => togglePeriodo(periodo)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30">
                            <span className="text-xl font-bold text-violet-400">{periodo}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{periodo}º Semestre</h3>
                            <p className="text-sm text-slate-500">{aprovadas} de {total} concluídas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-3">
                            <div className="h-2.5 w-32 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all" style={{ width: `${progresso}%` }} />
                            </div>
                            <span className="text-sm text-slate-400 w-12">{progresso.toFixed(0)}%</span>
                          </div>
                          {expandedPeriodos[periodo] ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                        </div>
                      </div>
                    </GlassCard>

                    {expandedPeriodos[periodo] && (
                      <div className={`space-y-2 ${modoCompacto ? '' : 'pl-4'}`}>
                        {discs.length === 0 ? (
                          <p className="text-slate-500 text-sm py-4 text-center">Nenhuma disciplina neste período</p>
                        ) : modoCompacto ? (
                          <GlassCard className="overflow-hidden" hover={false}>
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left p-3 text-slate-400 font-medium text-sm">Disciplina</th>
                                  <th className="text-center p-3 text-slate-400 font-medium text-sm hidden sm:table-cell">Cr</th>
                                  <th className="text-center p-3 text-slate-400 font-medium text-sm">Status</th>
                                  <th className="text-center p-3 text-slate-400 font-medium text-sm">Nota</th>
                                  <th className="text-center p-3 text-slate-400 font-medium text-sm w-28">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {discs.map(disc => {
                                  const status = STATUS[disc.status];
                                  return (
                                    <tr key={disc.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                      <td className="p-3"><span className="font-medium">{disc.nome}</span></td>
                                      <td className="p-3 text-center text-slate-400 hidden sm:table-cell">{disc.creditos}</td>
                                      <td className="p-3 text-center"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>{status.label}</span></td>
                                      <td className="p-3 text-center font-semibold">{disc.notaFinal ? disc.notaFinal.toFixed(1) : '-'}</td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {disc.status === 'NAO_INICIADA' ? (
                                            <button onClick={() => setShowIniciarModal(disc.id)} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all">Iniciar</button>
                                          ) : (
                                            <button onClick={() => startEditNotas(disc)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Edit2 size={14} /></button>
                                          )}
                                          <button onClick={() => setShowDeleteMenu(disc.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </GlassCard>
                        ) : (
                          discs.map(disc => {
                            const status = STATUS[disc.status];
                            return (
                              <GlassCard key={disc.id} className="group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.bar}`} />
                                <div className="flex items-center justify-between p-5 pl-6">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                      <h4 className="font-medium text-white group-hover:text-violet-300 transition-colors truncate">{disc.nome}</h4>
                                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text} border ${status.border}`}>{status.label}</span>
                                    </div>
                                    <p className="text-sm text-slate-500">{disc.creditos} créditos • {disc.cargaHoraria}h{disc.semestreCursado && ` • ${disc.semestreCursado}`}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {disc.status === 'NAO_INICIADA' ? (
                                      <button onClick={() => setShowIniciarModal(disc.id)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all">Iniciar</button>
                                    ) : (disc.ga !== null || disc.gb !== null || disc.notaFinal !== null) ? (
                                      <div className="flex items-center gap-4">
                                        {/* GA e GB */}
                                        <div className="hidden sm:flex items-center gap-3 text-sm">
                                          <div className="text-center">
                                            <p className="text-slate-500 text-xs mb-0.5">GA</p>
                                            <p className="font-medium text-slate-300">{disc.ga !== null ? disc.ga.toFixed(1) : '-'}</p>
                                          </div>
                                          <div className="text-center">
                                            <p className="text-slate-500 text-xs mb-0.5">GB</p>
                                            <p className="font-medium text-slate-300">{disc.gb !== null ? disc.gb.toFixed(1) : '-'}</p>
                                          </div>
                                        </div>
                                        {/* Nota Final */}
                                        {disc.notaFinal !== null && (
                                          <div className="text-right">
                                            <p className="text-2xl font-semibold">{disc.notaFinal.toFixed(1)}</p>
                                            <p className="text-xs text-slate-500">Final</p>
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                    <div className="flex items-center gap-1">
                                      {disc.status !== 'NAO_INICIADA' && (
                                        <button onClick={() => startEditNotas(disc)} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all"><Edit2 size={16} /></button>
                                      )}
                                      <button onClick={() => setShowDeleteMenu(disc.id)} className="p-2 rounded-xl hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                                    </div>
                                  </div>
                                </div>
                              </GlassCard>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Planejar */}
        {activeTab === 'planejar' && (() => {
          const disciplinasPendentes = disciplinas.filter(d => d.status === 'NAO_INICIADA');
          const disciplinasPorPeriodoPlan = {};
          disciplinasPendentes.forEach(d => {
            const periodo = d.periodo || 1;
            if (!disciplinasPorPeriodoPlan[periodo]) disciplinasPorPeriodoPlan[periodo] = [];
            disciplinasPorPeriodoPlan[periodo].push(d);
          });

          const disciplinasNaGrade = new Map();
          Object.values(gradePlanejamento).forEach(item => {
            if (item?.disciplinaId && !disciplinasNaGrade.has(item.disciplinaId)) {
              disciplinasNaGrade.set(item.disciplinaId, item);
            }
          });

          const creditosSelecionados = Array.from(disciplinasNaGrade.values()).reduce((acc, item) => acc + (item.creditos || 4), 0);
          const diasMostrar = mostrarSabado ? DIAS_SEMANA : DIAS_SEMANA.slice(0, 5);

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Planejador de Matrícula</h2>
                  <p className="text-slate-400 text-sm">Monte sua grade do próximo semestre</p>
                </div>
                <div className="flex items-center gap-2">
                  {salvandoPlanejamento && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Save size={14} className="animate-pulse" /> Salvando...
                    </span>
                  )}
                  <button
                    onClick={limparGradePlanejamento}
                    className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-all"
                  >
                    Limpar Grade
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4" hover={false}>
                  <p className="text-slate-400 text-sm">Mínimo</p>
                  <p className="text-2xl font-bold text-white">{creditosLimite.min}</p>
                  <p className="text-slate-500 text-xs">créditos</p>
                </GlassCard>
                <GlassCard className="p-4" hover={false}>
                  <p className="text-slate-400 text-sm">Máximo</p>
                  <p className="text-2xl font-bold text-white">{creditosLimite.max}</p>
                  <p className="text-slate-500 text-xs">créditos</p>
                </GlassCard>
                <div className={`rounded-2xl p-4 border ${
                  creditosSelecionados >= creditosLimite.min && creditosSelecionados <= creditosLimite.max
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : creditosSelecionados > creditosLimite.max
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <p className="text-slate-400 text-sm">Selecionados</p>
                  <p className={`text-2xl font-bold ${
                    creditosSelecionados >= creditosLimite.min && creditosSelecionados <= creditosLimite.max
                      ? 'text-emerald-400'
                      : creditosSelecionados > creditosLimite.max
                        ? 'text-red-400'
                        : 'text-amber-400'
                  }`}>{creditosSelecionados}</p>
                  <p className="text-slate-500 text-xs">créditos</p>
                </div>
                <GlassCard className="p-4" hover={false}>
                  <p className="text-slate-400 text-sm">Cadeiras</p>
                  <p className="text-2xl font-bold text-cyan-400">{disciplinasNaGrade.size}</p>
                  <p className="text-slate-500 text-xs">na grade</p>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Grade de Horários */}
                <div className="lg:col-span-2">
                  <GlassCard className="overflow-hidden" hover={false}>
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Clock size={20} className="text-cyan-400" />
                        Quadro de Horários
                      </h3>
                      <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mostrarSabado}
                          onChange={(e) => setMostrarSabado(e.target.checked)}
                          className="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-cyan-500"
                        />
                        Sábado
                      </label>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="p-3 text-left text-slate-400 text-sm font-medium w-24">Horário</th>
                            {diasMostrar.map(dia => (
                              <th key={dia.id} className="p-3 text-center text-slate-300 text-sm font-medium min-w-[120px]">
                                <span className="hidden sm:inline">{dia.label}</span>
                                <span className="sm:hidden">{dia.abrev}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {HORARIOS_PLANEJADOR.map(horario => (
                            <tr key={horario.id} className="border-b border-white/5">
                              <td className="p-3 text-slate-400 text-sm whitespace-nowrap">
                                <div className="font-medium">{horario.inicio}</div>
                                <div className="text-slate-500 text-xs">{horario.fim}</div>
                              </td>
                              {diasMostrar.map(dia => {
                                const chave = `${dia.id}-${horario.id}`;
                                const item = gradePlanejamento[chave];
                                
                                return (
                                  <td key={dia.id} className="p-2">
                                    {item ? (
                                      <div className={`relative p-2 rounded-lg border ${item.cor} min-h-[60px] group`}>
                                        <p className="text-xs font-medium line-clamp-2">{item.nome}</p>
                                        <p className="text-xs opacity-60">{item.creditos}cr</p>
                                        <button
                                          onClick={() => removerDaGradePlanejamento(dia.id, horario.id)}
                                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setDisciplinaSelecionadaPlanejador({ dia: dia.id, horario: horario.id })}
                                        className={`w-full min-h-[60px] rounded-lg border-2 border-dashed transition-all flex items-center justify-center ${
                                          disciplinaSelecionadaPlanejador?.dia === dia.id && disciplinaSelecionadaPlanejador?.horario === horario.id
                                            ? 'border-cyan-500 bg-cyan-500/20'
                                            : 'border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10'
                                        }`}
                                      >
                                        <Plus size={20} className="text-slate-600" />
                                      </button>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>

                  {/* Cadeiras na Grade */}
                  {disciplinasNaGrade.size > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-400 mb-2">Cadeiras adicionadas:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(disciplinasNaGrade.values()).map(item => (
                          <span key={item.disciplinaId} className={`px-3 py-1.5 rounded-lg border ${item.cor} text-sm`}>
                            {item.nome} ({item.creditos}cr)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Cadeiras Pendentes */}
                <div className="space-y-4">
                  <GlassCard className="overflow-hidden" hover={false}>
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-400" />
                        Cadeiras Pendentes
                      </h3>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {Object.entries(disciplinasPorPeriodoPlan).sort(([a], [b]) => a - b).map(([periodo, discs]) => (
                        <div key={periodo}>
                          <div className="px-4 py-2 bg-white/5 text-sm text-slate-400 font-medium sticky top-0">
                            {periodo}º Semestre
                          </div>
                          {discs.map(disc => {
                            const jaNaGrade = disciplinasNaGrade.has(disc.id);
                            return (
                              <div
                                key={disc.id}
                                className={`flex items-center justify-between p-3 border-b border-white/5 hover:bg-white/5 transition-all ${
                                  jaNaGrade ? 'opacity-50' : ''
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">{disc.nome}</p>
                                  <p className="text-xs text-slate-500">{disc.creditos || 4} créditos</p>
                                </div>
                                {jaNaGrade ? (
                                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                                    <CheckCircle size={14} /> Na grade
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (disciplinaSelecionadaPlanejador) {
                                        adicionarNaGradePlanejamento(disciplinaSelecionadaPlanejador.dia, disciplinaSelecionadaPlanejador.horario, disc);
                                      }
                                    }}
                                    disabled={!disciplinaSelecionadaPlanejador}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      disciplinaSelecionadaPlanejador
                                        ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {disciplinaSelecionadaPlanejador ? 'Adicionar' : 'Selecione horário'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {disciplinasPendentes.length === 0 && (
                        <div className="p-8 text-center">
                          <GraduationCap size={40} className="mx-auto text-slate-600 mb-3" />
                          <p className="text-slate-400">Nenhuma cadeira pendente</p>
                          <p className="text-slate-500 text-sm">Todas foram concluídas!</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  {/* Configurações de Créditos */}
                  <GlassCard className="p-4" hover={false}>
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Limites de Créditos</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500">Mínimo</label>
                        <input
                          type="number"
                          value={creditosLimite.min}
                          onChange={(e) => setCreditosLimite(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                          className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Máximo</label>
                        <input
                          type="number"
                          value={creditosLimite.max}
                          onChange={(e) => setCreditosLimite(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                          className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </GlassCard>

                  {/* Alerta de seleção */}
                  {disciplinaSelecionadaPlanejador && (
                    <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <AlertCircle size={18} />
                        <span className="text-sm font-medium">Horário selecionado</span>
                      </div>
                      <p className="text-cyan-200/70 text-xs mt-1">
                        {DIAS_SEMANA.find(d => d.id === disciplinaSelecionadaPlanejador.dia)?.label} - {HORARIOS_PLANEJADOR.find(h => h.id === disciplinaSelecionadaPlanejador.horario)?.label}
                      </p>
                      <button
                        onClick={() => setDisciplinaSelecionadaPlanejador(null)}
                        className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        Cancelar seleção
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab Em Curso */}
        {activeTab === 'emCurso' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Disciplinas em Curso</h2>
              {/* Botão Simulador */}
              <button
                onClick={() => temPermissao('simuladorNotas') ? setShowSimulador(true) : setShowUpgradeModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  temPermissao('simuladorNotas')
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:scale-105'
                    : 'bg-white/5 border border-white/10 text-slate-400'
                }`}
              >
                <Calculator size={18} />
                Simulador
                {!temPermissao('simuladorNotas') && <Lock size={14} className="text-amber-400" />}
              </button>
            </div>
            
            {disciplinas.filter(d => d.status === 'EM_CURSO').length === 0 ? (
              <GlassCard className="p-8 text-center" hover={false}>
                <Clock size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">Nenhuma disciplina em curso</p>
              </GlassCard>
            ) : (
              disciplinas.filter(d => d.status === 'EM_CURSO').map(disc => {
                const status = STATUS[disc.status];
                return (
                  <GlassCard key={disc.id} className="group" hover={false}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.bar}`} />
                    <div className="p-5 pl-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg">{disc.nome}</h4>
                          <p className="text-sm text-slate-500">{disc.periodo}º Semestre • {disc.creditos} créditos</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${status.bg} ${status.text} border ${status.border}`}>{status.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-xl bg-white/5">
                          <p className="text-2xl font-semibold">{disc.ga ?? '-'}</p>
                          <p className="text-xs text-slate-500">Grau A</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-white/5">
                          <p className="text-2xl font-semibold">{disc.gb ?? '-'}</p>
                          <p className="text-xs text-slate-500">Grau B</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-white/5">
                          <p className="text-2xl font-semibold">{disc.notaFinal ?? '-'}</p>
                          <p className="text-xs text-slate-500">Final</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <GradientButton size="sm" onClick={() => startEditNotas(disc)}><Edit2 size={16} />Editar Notas</GradientButton>
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        )}

        {/* Tab Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6" hover={false}>
                <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={dadosGrafico.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                      {dadosGrafico.filter(d => d.value > 0).map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </GlassCard>
              <GlassCard className="p-6" hover={false}>
                <h3 className="text-lg font-semibold mb-4">Progresso por Semestre</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosPorPeriodo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="periodo" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey="aprovadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="emCurso" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendentes" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
            <GlassCard className="p-6" hover={false}>
              <h3 className="text-lg font-semibold mb-4">Resumo Geral</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/5"><p className="text-3xl font-bold text-emerald-400">{estatisticas.aprovadas}</p><p className="text-sm text-slate-500">Aprovadas</p></div>
                <div className="text-center p-4 rounded-xl bg-white/5"><p className="text-3xl font-bold text-blue-400">{estatisticas.emCurso}</p><p className="text-sm text-slate-500">Em Curso</p></div>
                <div className="text-center p-4 rounded-xl bg-white/5"><p className="text-3xl font-bold text-slate-400">{estatisticas.naoIniciadas}</p><p className="text-sm text-slate-500">Pendentes</p></div>
                <div className="text-center p-4 rounded-xl bg-white/5"><p className="text-3xl font-bold text-red-400">{estatisticas.reprovadas}</p><p className="text-sm text-slate-500">Reprovadas</p></div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20"><p className="text-slate-400 text-sm mb-1">Total de Créditos</p><p className="text-2xl font-bold">{estatisticas.creditosConcluidos}/{estatisticas.creditosTotal}</p></div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"><p className="text-slate-400 text-sm mb-1">Média Geral</p><p className="text-2xl font-bold">{estatisticas.mediaGeral.toFixed(2)}</p></div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20"><p className="text-slate-400 text-sm mb-1">Progresso</p><p className="text-2xl font-bold">{estatisticas.progresso.toFixed(1)}%</p></div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Tab Formatura */}
        {activeTab === 'formatura' && (() => {
          const disciplinasAprovadas = disciplinas.filter(d => d.status === 'APROVADA').length;
          const disciplinasEmCurso = disciplinas.filter(d => d.status === 'EM_CURSO').length;
          const disciplinasRestantes = disciplinas.filter(d => d.status === 'NAO_INICIADA').length;
          const totalDisciplinas = disciplinas.length;
          const disciplinasParaConcluir = disciplinasRestantes + disciplinasEmCurso;
          
          const gerarProximoPeriodo = (ano, sem) => {
            sem++;
            if (sem > 2) { sem = 1; ano++; }
            return { ano, sem };
          };
          
          const periodoString = (ano, sem) => `${ano}/${sem}`;
          
          const inicializarPlanejamento = () => {
            if (planejamentoSemestres.length > 0) return;
            const novoPlano = [];
            let ano = semestreAtualAno;
            let sem = semestreAtualNum;
            let restantes = disciplinasParaConcluir;
            
            if (disciplinasEmCurso > 0) {
              novoPlano.push({ periodo: periodoString(ano, sem), quantidade: disciplinasEmCurso, tipo: 'atual' });
              restantes -= disciplinasEmCurso;
              const prox = gerarProximoPeriodo(ano, sem);
              ano = prox.ano;
              sem = prox.sem;
            }
            
            while (restantes > 0) {
              const qtd = Math.min(6, restantes);
              novoPlano.push({ periodo: periodoString(ano, sem), quantidade: qtd, tipo: 'futuro' });
              restantes -= qtd;
              const prox = gerarProximoPeriodo(ano, sem);
              ano = prox.ano;
              sem = prox.sem;
            }
            
            setPlanejamentoSemestres(novoPlano);
          };
          
          if (planejamentoSemestres.length === 0 && disciplinasParaConcluir > 0) {
            inicializarPlanejamento();
          }
          
          const totalPlanejado = planejamentoSemestres.reduce((acc, s) => acc + s.quantidade, 0);
          const disciplinasFaltando = disciplinasParaConcluir - totalPlanejado;
          
          const atualizarQuantidade = (index, novaQtd) => {
            const novoPlano = [...planejamentoSemestres];
            novoPlano[index].quantidade = Math.max(0, Math.min(10, novaQtd));
            setPlanejamentoSemestres(novoPlano);
          };
          
          const atualizarPeriodo = (index, novoPeriodo) => {
            const novoPlano = [...planejamentoSemestres];
            novoPlano[index].periodo = novoPeriodo;
            setPlanejamentoSemestres(novoPlano);
          };
          
          const adicionarSemestre = () => {
            if (planejamentoSemestres.length === 0) {
              setPlanejamentoSemestres([{ periodo: periodoString(semestreAtualAno, semestreAtualNum), quantidade: 6, tipo: 'futuro' }]);
              return;
            }
            const ultimo = planejamentoSemestres[planejamentoSemestres.length - 1];
            const [ano, sem] = ultimo.periodo.split('/').map(Number);
            const prox = gerarProximoPeriodo(ano, sem);
            setPlanejamentoSemestres([...planejamentoSemestres, { periodo: periodoString(prox.ano, prox.sem), quantidade: Math.min(6, Math.max(0, disciplinasFaltando)), tipo: 'futuro' }]);
          };
          
          const removerSemestre = (index) => {
            if (planejamentoSemestres.length <= 1) return;
            setPlanejamentoSemestres(planejamentoSemestres.filter((_, i) => i !== index));
          };
          
          const resetarPlanejamento = () => {
            setPlanejamentoSemestres([]);
            setTimeout(inicializarPlanejamento, 100);
          };
          
          const semestresComDisciplinas = planejamentoSemestres.filter(s => s.quantidade > 0);
          const previsaoFormatura = semestresComDisciplinas.length > 0 ? semestresComDisciplinas[semestresComDisciplinas.length - 1].periodo : '-';
          
          const calcularAnosAteFormar = () => {
            if (semestresComDisciplinas.length === 0) return '0';
            const primeiro = semestresComDisciplinas[0].periodo;
            const ultimo = semestresComDisciplinas[semestresComDisciplinas.length - 1].periodo;
            const [anoInicio, semInicio] = primeiro.split('/').map(Number);
            const [anoFim, semFim] = ultimo.split('/').map(Number);
            const diferenca = (anoFim * 2 + semFim) - (anoInicio * 2 + semInicio) + 1;
            const anos = diferenca / 2;
            return anos % 1 === 0 ? anos.toString() : anos.toFixed(1);
          };
          
          const progressoTotal = totalDisciplinas > 0 ? ((disciplinasAprovadas / totalDisciplinas) * 100) : 0;
          
          const calcularAcumulado = (index) => {
            let acum = disciplinasAprovadas;
            for (let i = 0; i <= index; i++) { acum += planejamentoSemestres[i].quantidade; }
            return acum;
          };
          
          return (
            <div className="space-y-6">
              {/* Card Principal - Previsão */}
              <GlassCard className="p-6" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <GraduationCap size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Previsão de Formatura</h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
                    <div className="text-4xl font-bold text-violet-400 mb-1">{previsaoFormatura}</div>
                    <div className="text-slate-400 text-sm">Conclusão Prevista</div>
                  </div>
                  <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="text-4xl font-bold text-amber-400 mb-1">{calcularAnosAteFormar()}</div>
                    <div className="text-slate-400 text-sm">Anos até Formar</div>
                  </div>
                  <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <div className="text-4xl font-bold text-emerald-400 mb-1">{progressoTotal.toFixed(0)}%</div>
                    <div className="text-slate-400 text-sm">Progresso do Curso</div>
                  </div>
                </div>
              </GlassCard>
              
              {/* Planejamento */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Lista Editável */}
                <GlassCard className="p-6" hover={false}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Edit2 size={20} className="text-slate-400" />
                      Planejamento por Semestre
                    </h3>
                    <button onClick={resetarPlanejamento} className="text-xs text-slate-400 hover:text-violet-400 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                      <RefreshCw size={14} />Resetar
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {planejamentoSemestres.map((sem, index) => {
                      const isAtual = index === 0;
                      return (
                        <div key={index} className={`flex items-center gap-3 p-3 rounded-xl ${isAtual ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-white/5 border border-white/10'}`}>
                          <div className="flex items-center gap-1">
                            <input type="text" value={sem.periodo} onChange={e => atualizarPeriodo(index, e.target.value)} className={`w-20 px-2 py-1.5 bg-white/5 rounded-lg text-center text-sm font-medium border border-white/10 focus:border-violet-500 focus:outline-none ${isAtual ? 'text-blue-400' : 'text-slate-300'}`} />
                            {isAtual && <span className="text-xs text-blue-400">(atual)</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <button onClick={() => atualizarQuantidade(index, sem.quantidade - 1)} disabled={sem.quantidade <= 0} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg font-bold disabled:opacity-30 transition-all">-</button>
                            <input type="number" value={sem.quantidade} onChange={e => atualizarQuantidade(index, parseInt(e.target.value) || 0)} className="w-14 px-2 py-1.5 bg-white/5 rounded-lg text-center font-bold text-lg border border-white/10 focus:border-violet-500 focus:outline-none" min="0" max="10" />
                            <button onClick={() => atualizarQuantidade(index, sem.quantidade + 1)} disabled={sem.quantidade >= 10} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg font-bold disabled:opacity-30 transition-all">+</button>
                          </div>
                          {planejamentoSemestres.length > 1 && (
                            <button onClick={() => removerSemestre(index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"><Trash2 size={16} /></button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <button onClick={adicionarSemestre} className="mt-4 w-full py-3 border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-xl text-slate-400 hover:text-violet-400 flex items-center justify-center gap-2 transition-all">
                    <Plus size={18} />Adicionar Semestre
                  </button>
                </GlassCard>
                
                {/* Tabela Resumo */}
                <GlassCard className="p-6" hover={false}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-slate-400" />
                    Resumo do Planejamento
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">Semestre</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">Qtd</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">Acum.</th>
                          <th className="text-right py-2 px-3 text-slate-400 font-medium">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-3 text-emerald-400">✓ Aprovadas</td>
                          <td className="text-center py-2 px-3 font-bold text-emerald-400">{disciplinasAprovadas}</td>
                          <td className="text-center py-2 px-3 text-slate-300">{disciplinasAprovadas}</td>
                          <td className="text-right py-2 px-3 text-slate-400">{totalDisciplinas > 0 ? ((disciplinasAprovadas / totalDisciplinas) * 100).toFixed(0) : 0}%</td>
                        </tr>
                        {planejamentoSemestres.map((sem, index) => {
                          const acumulado = calcularAcumulado(index);
                          const percentual = totalDisciplinas > 0 ? (acumulado / totalDisciplinas) * 100 : 0;
                          const isAtual = index === 0;
                          return (
                            <tr key={index} className={`border-b border-white/5 ${isAtual ? 'bg-blue-500/5' : ''}`}>
                              <td className={`py-2 px-3 ${isAtual ? 'text-blue-400' : 'text-slate-300'}`}>{sem.periodo} {isAtual && '(atual)'}</td>
                              <td className="text-center py-2 px-3 font-bold">{sem.quantidade}</td>
                              <td className="text-center py-2 px-3 text-slate-300">{acumulado}</td>
                              <td className="text-right py-2 px-3 text-slate-400">{percentual.toFixed(0)}%</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-white/5 font-bold">
                          <td className="py-3 px-3 text-violet-400">Total Planejado</td>
                          <td className="text-center py-3 px-3 text-violet-400">{totalPlanejado}</td>
                          <td className="text-center py-3 px-3">{disciplinasAprovadas + totalPlanejado}</td>
                          <td className="text-right py-3 px-3 text-violet-400">{totalDisciplinas > 0 ? (((disciplinasAprovadas + totalPlanejado) / totalDisciplinas) * 100).toFixed(0) : 0}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {disciplinasFaltando > 0 && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
                      <AlertCircle className="text-amber-400" size={18} />
                      <span className="text-sm text-amber-200">Faltam <strong>{disciplinasFaltando}</strong> disciplinas no planejamento</span>
                    </div>
                  )}
                  {disciplinasFaltando < 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                      <AlertCircle className="text-red-400" size={18} />
                      <span className="text-sm text-red-200">Planejamento excede em <strong>{Math.abs(disciplinasFaltando)}</strong> disciplinas</span>
                    </div>
                  )}
                  {disciplinasFaltando === 0 && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
                      <CheckCircle className="text-emerald-400" size={18} />
                      <span className="text-sm text-emerald-200">Planejamento completo! 🎓</span>
                    </div>
                  )}
                </GlassCard>
              </div>
              
              {/* Dica */}
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-violet-400 shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-slate-400">
                    <strong className="text-slate-300">Dica:</strong> Ajuste a quantidade de disciplinas por semestre usando os botões + e -. 
                    O sistema calcula automaticamente sua previsão de formatura baseado no planejamento.
                  </div>
                </div>
              </GlassCard>
            </div>
          );
        })()}

        {/* Modais */}
        {showAddDisciplina && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-lg" hover={false}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Adicionar Cadeira</h3>
                  <button onClick={() => setShowAddDisciplina(false)} className="p-2 rounded-lg hover:bg-white/10 transition-all">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
                
                {/* Tabs: Uma ou Várias */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setModoAdicionar('uma')}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                      modoAdicionar === 'uma' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Uma Cadeira
                  </button>
                  <button
                    onClick={() => setModoAdicionar('varias')}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                      modoAdicionar === 'varias' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Várias Cadeiras
                  </button>
                </div>

                {modoAdicionar === 'uma' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Nome da Cadeira</label>
                      <input 
                        type="text" 
                        value={novaDisciplina.nome} 
                        onChange={(e) => setNovaDisciplina({ ...novaDisciplina, nome: e.target.value })} 
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50" 
                        placeholder="Ex: Cálculo I" 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-slate-400 block mb-2">Semestre</label>
                        <select 
                          value={novaDisciplina.periodo} 
                          onChange={(e) => setNovaDisciplina({ ...novaDisciplina, periodo: parseInt(e.target.value) })} 
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                        >
                          {periodos.map(p => (<option key={p} value={p} className="bg-slate-800">{p}º</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 block mb-2">Créditos</label>
                        <input 
                          type="number" 
                          value={novaDisciplina.creditos} 
                          onChange={(e) => setNovaDisciplina({ ...novaDisciplina, creditos: parseInt(e.target.value) })} 
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 block mb-2">Carga H.</label>
                        <input 
                          type="number" 
                          value={novaDisciplina.cargaHoraria} 
                          onChange={(e) => setNovaDisciplina({ ...novaDisciplina, cargaHoraria: parseInt(e.target.value) })} 
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" 
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <GradientButton variant="secondary" className="flex-1" onClick={() => setShowAddDisciplina(false)}>Cancelar</GradientButton>
                      <GradientButton className="flex-1" onClick={handleAddDisciplina}>Adicionar</GradientButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Semestre</label>
                      <select 
                        value={periodoMultiplas} 
                        onChange={(e) => setPeriodoMultiplas(parseInt(e.target.value))} 
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                      >
                        {periodos.map(p => (<option key={p} value={p} className="bg-slate-800">{p}º Semestre</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Cadeiras (uma por linha)</label>
                      <textarea 
                        value={disciplinasMultiplas} 
                        onChange={(e) => setDisciplinasMultiplas(e.target.value)} 
                        rows={6} 
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none resize-none" 
                        placeholder="Cálculo I&#10;Física I&#10;Programação I&#10;Álgebra Linear" 
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      💡 Cada linha será uma cadeira nova com 4 créditos e 60h de carga horária
                    </p>
                    <div className="flex gap-3 mt-6">
                      <GradientButton variant="secondary" className="flex-1" onClick={() => { setShowAddDisciplina(false); setDisciplinasMultiplas(''); }}>Cancelar</GradientButton>
                      <GradientButton className="flex-1" onClick={handleAddMultiplas}>
                        Adicionar {disciplinasMultiplas.split('\n').filter(l => l.trim()).length || ''} Cadeiras
                      </GradientButton>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {showIniciarModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-sm" hover={false}>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Iniciar Disciplina</h3>
                <p className="text-slate-400 mb-6">{disciplinas.find(d => d.id === showIniciarModal)?.nome}</p>
                <div><label className="text-sm text-slate-400 block mb-2">Semestre</label><input type="text" value={semestreIniciar} onChange={(e) => setSemestreIniciar(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" placeholder="2024.2" /></div>
                <div className="flex gap-3 mt-6">
                  <GradientButton variant="secondary" className="flex-1" onClick={() => setShowIniciarModal(null)}>Cancelar</GradientButton>
                  <GradientButton className="flex-1" onClick={() => iniciarDisciplina(showIniciarModal)}>Iniciar</GradientButton>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {editingNotas && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md" hover={false}>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Editar Notas</h3>
                <p className="text-slate-400 mb-6">{disciplinas.find(d => d.id === editingNotas)?.nome}</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-sm text-slate-400 block mb-2">GA</label><input type="number" step="0.1" value={notasTemp.ga} onChange={(e) => setNotasTemp({ ...notasTemp, ga: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" placeholder="0.0" /></div>
                    <div><label className="text-sm text-slate-400 block mb-2">GB</label><input type="number" step="0.1" value={notasTemp.gb} onChange={(e) => setNotasTemp({ ...notasTemp, gb: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" placeholder="0.0" /></div>
                    <div><label className="text-sm text-slate-400 block mb-2">Final</label><input type="number" step="0.1" value={notasTemp.notaFinal} onChange={(e) => setNotasTemp({ ...notasTemp, notaFinal: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" placeholder="Auto" /></div>
                  </div>
                  <div><label className="text-sm text-slate-400 block mb-2">Semestre</label><input type="text" value={notasTemp.semestreCursado} onChange={(e) => setNotasTemp({ ...notasTemp, semestreCursado: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" placeholder="2024.2" /></div>
                  <div><label className="text-sm text-slate-400 block mb-2">Observação</label><input type="text" value={notasTemp.observacao} onChange={(e) => setNotasTemp({ ...notasTemp, observacao: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" placeholder="Opcional" /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <GradientButton variant="secondary" className="flex-1" onClick={() => setEditingNotas(null)}>Cancelar</GradientButton>
                  <GradientButton className="flex-1" onClick={() => saveNotas(editingNotas)}>Salvar</GradientButton>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {showDeleteMenu && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-sm" hover={false}>
              <div className="p-2">
                <div className="p-4 border-b border-white/10"><h3 className="font-semibold">{disciplinas.find(d => d.id === showDeleteMenu)?.nome}</h3></div>
                {disciplinas.find(d => d.id === showDeleteMenu)?.status !== 'NAO_INICIADA' && (
                  <button onClick={() => resetarDisciplina(showDeleteMenu)} className="w-full flex items-center gap-3 px-4 py-4 text-left text-amber-400 hover:bg-white/5 transition-colors">
                    <RotateCcw size={18} /><div><div className="font-medium">Resetar andamento</div><div className="text-xs text-slate-500">Volta para "Pendente"</div></div>
                  </button>
                )}
                <button onClick={() => handleRemoverDisciplina(showDeleteMenu)} className="w-full flex items-center gap-3 px-4 py-4 text-left text-red-400 hover:bg-white/5 transition-colors border-t border-white/10">
                  <Trash2 size={18} /><div><div className="font-medium">Excluir disciplina</div><div className="text-xs text-slate-500">Remove permanentemente</div></div>
                </button>
                <button onClick={() => setShowDeleteMenu(null)} className="w-full px-4 py-3 text-sm text-slate-400 hover:bg-white/5 border-t border-white/10">Cancelar</button>
              </div>
            </GlassCard>
          </div>
        )}

        {showImportModal && (<ImportModal onClose={() => setShowImportModal(false)} onImport={handleImportarDisciplinas} disciplinasExistentes={disciplinas} />)}

        {/* Modal Boas-vindas - Novo Usuário */}
        {showWelcomeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              {/* Header com ícone */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mx-auto mb-4">
                  <GraduationCap size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Sistema de Notas!</h2>
                <p className="text-slate-400">Para personalizar sua experiência, conte-nos qual curso você está fazendo.</p>
              </div>

              {/* Input do curso */}
              <div className="mb-6">
                <label className="text-sm text-slate-400 block mb-2">Qual é o seu curso?</label>
                <input
                  type="text"
                  value={cursoInput}
                  onChange={(e) => setCursoInput(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Ex: Ciência da Computação"
                  autoFocus
                />
              </div>

              {/* Aviso */}
              <p className="text-slate-500 text-sm text-center mb-6">
                Você pode alterar isso depois nas configurações.
              </p>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkipWelcome}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-colors"
                >
                  Pular
                </button>
                <button
                  onClick={handleSaveCurso}
                  disabled={!cursoInput.trim() || savingCurso}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingCurso ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Configurações */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowSettingsModal(false)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                  <Settings size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Configurações</h2>
                  <p className="text-slate-400 text-sm">Edite suas informações</p>
                </div>
              </div>

              {/* Seção do Plano */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {userPlano === 'admin' ? (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                        <Shield size={20} className="text-white" />
                      </div>
                    ) : userPlano === 'premium' ? (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Crown size={20} className="text-white" />
                      </div>
                    ) : userPlano === 'pro' ? (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <Star size={20} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                        <Zap size={20} className="text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white capitalize">Plano {userPlano || 'Pro'}</p>
                      {userPlanoExpiraEm && userPlano !== 'admin' && (
                        <p className="text-xs text-slate-400">
                          Expira em {new Date(userPlanoExpiraEm).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  {userPlano !== 'premium' && userPlano !== 'admin' && (
                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowUpgradeModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {userPlano === 'admin' ? (
                    '🛡️ Administrador - Acesso total ao sistema'
                  ) : userPlano === 'premium' ? (
                    '✨ Você tem acesso a todas as funcionalidades!'
                  ) : userPlano === 'pro' ? (
                    'Faça upgrade para Premium e desbloqueie simulador de notas, múltiplos cursos e mais!'
                  ) : (
                    'Faça upgrade para ter disciplinas ilimitadas, PDF e previsão de formatura!'
                  )}
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-4 mb-6">
                {/* Email (somente leitura) */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Email</label>
                  <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-500">
                    {user?.email}
                  </div>
                </div>

                {/* Nome */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Nome</label>
                  <input
                    type="text"
                    value={settingsNome}
                    onChange={(e) => setSettingsNome(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="Seu nome"
                  />
                </div>

                {/* Curso */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Curso</label>
                  <input
                    type="text"
                    value={settingsCurso}
                    onChange={(e) => setSettingsCurso(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="Ex: Ciência da Computação"
                  />
                </div>
              </div>

              {/* Seção Backup/Exportar (Premium) */}
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <Database size={20} className="text-amber-400" />
                  <h4 className="font-medium text-white">Backup de Dados</h4>
                  {!temPermissao('backupExportar') && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-1">
                      <Lock size={10} /> Premium
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Exporte seus dados para backup ou importe de outro dispositivo.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!temPermissao('backupExportar')) {
                        setShowSettingsModal(false);
                        setShowUpgradeModal(true);
                        return;
                      }
                      const dados = {
                        versao: '1.0',
                        exportadoEm: new Date().toISOString(),
                        usuario: { nome: userName, email: user?.email, curso: userCurso },
                        disciplinas: disciplinas
                      };
                      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `backup-notas-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      temPermissao('backupExportar')
                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    <Download size={16} />
                    Exportar
                    {!temPermissao('backupExportar') && <Lock size={12} />}
                  </button>
                  <button
                    onClick={() => {
                      if (!temPermissao('backupExportar')) {
                        setShowSettingsModal(false);
                        setShowUpgradeModal(true);
                        return;
                      }
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          const texto = await file.text();
                          const dados = JSON.parse(texto);
                          if (dados.disciplinas && Array.isArray(dados.disciplinas)) {
                            if (confirm(`Importar ${dados.disciplinas.length} disciplinas? Isso substituirá os dados atuais.`)) {
                              setDisciplinas(dados.disciplinas);
                              alert('Dados importados com sucesso!');
                            }
                          } else {
                            alert('Arquivo inválido');
                          }
                        } catch (err) {
                          alert('Erro ao ler arquivo');
                        }
                      };
                      input.click();
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      temPermissao('backupExportar')
                        ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    <UploadIcon size={16} />
                    Importar
                    {!temPermissao('backupExportar') && <Lock size={12} />}
                  </button>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingSettings ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Upgrade de Plano */}
        {showUpgradeModal && (
          <UpgradeModal 
            planoAtual={planoAtual} 
            userEmail={user?.email}
            userName={userName}
            onClose={() => setShowUpgradeModal(false)} 
          />
        )}

        {/* Modal Aviso de Expiração */}
        {showExpiracaoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowExpiracaoModal(false)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
              {/* Ícone animado */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40 animate-pulse">
                    <Clock size={40} className="text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {diasRestantes}
                  </div>
                </div>
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                {diasRestantes === 1 ? 'Último dia!' : `${diasRestantes} dias restantes!`}
              </h2>
              
              <p className="text-slate-400 text-center mb-6">
                Seu período {planoAtual === 'gratuito' ? 'gratuito' : `do plano ${planoAtual}`} está chegando ao fim. 
                {diasRestantes <= 7 ? ' Assine agora para não perder acesso!' : ' Aproveite para fazer upgrade e continuar usando todas as funcionalidades.'}
              </p>

              {/* Barra de progresso */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Tempo restante</span>
                  <span>{diasRestantes} de 30 dias</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      diasRestantes <= 7 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                    }`}
                    style={{ width: `${Math.max((diasRestantes / 30) * 100, 5)}%` }}
                  />
                </div>
              </div>

              {/* Benefícios do upgrade */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-400 mb-2">Com o upgrade você terá:</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle size={14} /> Disciplinas ilimitadas
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle size={14} /> Exportar PDF
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle size={14} /> Dashboard completo
                  </li>
                </ul>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExpiracaoModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-colors"
                >
                  Depois
                </button>
                <button
                  onClick={() => {
                    setShowExpiracaoModal(false);
                    setShowUpgradeModal(true);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25"
                >
                  Ver Planos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmação de Logout */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowLogoutModal(false)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
              {/* Ícone */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <LogOut size={32} className="text-red-400" />
                </div>
              </div>

              {/* Título */}
              <h2 className="text-xl font-bold text-white text-center mb-2">
                Sair da conta?
              </h2>
              
              <p className="text-slate-400 text-center mb-6">
                Tem certeza que deseja sair? Seus dados estão salvos na nuvem.
              </p>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    signOut();
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-400 hover:to-red-500 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Simulador de Notas (Premium) */}
        {showSimulador && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowSimulador(false)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Calculator size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Simulador de Notas</h2>
                  <p className="text-amber-400 text-sm">✨ Recurso Premium</p>
                </div>
              </div>

              {/* Seletor de disciplina */}
              <div className="mb-6">
                <label className="text-sm text-slate-400 block mb-2">Disciplina</label>
                <select
                  value={simuladorDisciplina || ''}
                  onChange={(e) => {
                    const disc = disciplinas.find(d => d.id === e.target.value);
                    setSimuladorDisciplina(e.target.value);
                    setSimuladorGA(disc?.ga?.toString() || '');
                    setSimuladorGB(disc?.gb?.toString() || '');
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="" className="bg-slate-800">Selecione uma disciplina</option>
                  {disciplinas.filter(d => d.status === 'EM_CURSO').map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-800">{d.nome}</option>
                  ))}
                </select>
              </div>

              {/* Inputs de notas */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Nota GA (atual ou esperada)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={simuladorGA}
                    onChange={(e) => setSimuladorGA(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-center text-xl"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Nota GB (atual ou esperada)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={simuladorGB}
                    onChange={(e) => setSimuladorGB(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-center text-xl"
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Resultado */}
              {(simuladorGA || simuladorGB) && (
                <div className="mb-6">
                  {(() => {
                    const ga = parseFloat(simuladorGA) || 0;
                    const gb = parseFloat(simuladorGB) || 0;
                    const disc = disciplinas.find(d => d.id === simuladorDisciplina);
                    const notaMinima = disc?.notaMinima || 6.0;
                    const mediaFinal = (ga + gb) / 2;
                    const precisaNaGB = Math.max(0, (notaMinima * 2) - ga);
                    const aprovado = mediaFinal >= notaMinima;
                    
                    return (
                      <div className={`p-4 rounded-xl border ${aprovado ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-slate-400">Média calculada:</span>
                          <span className={`text-2xl font-bold ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>
                            {mediaFinal.toFixed(1)}
                          </span>
                        </div>
                        
                        {simuladorGA && !simuladorGB && (
                          <div className="pt-3 border-t border-white/10">
                            <p className="text-sm text-slate-400 mb-1">Para atingir média {notaMinima}:</p>
                            <p className="text-lg font-semibold text-amber-400">
                              Você precisa de {precisaNaGB.toFixed(1)} na GB
                            </p>
                            {precisaNaGB > 10 && (
                              <p className="text-xs text-red-400 mt-1">⚠️ Nota necessária maior que 10</p>
                            )}
                          </div>
                        )}
                        
                        {simuladorGA && simuladorGB && (
                          <p className={`text-sm font-medium ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>
                            {aprovado ? '✓ Aprovado!' : '✗ Reprovado - média abaixo de ' + notaMinima}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Dica */}
              <div className="bg-white/5 rounded-xl p-3 mb-6">
                <p className="text-xs text-slate-400">
                  💡 <strong>Dica:</strong> Digite apenas a nota da GA para descobrir quanto você precisa tirar na GB para passar.
                </p>
              </div>

              {/* Botão fechar */}
              <button
                onClick={() => setShowSimulador(false)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* FAB Mobile */}
        <button 
          onClick={() => !planoExpirado && podeAdicionarDisciplina(disciplinas.length) ? setShowAddDisciplina(true) : setShowUpgradeModal(true)} 
          className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 sm:hidden ${
            planoExpirado 
              ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-red-500/40' 
              : 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/40'
          }`}
        >
          {planoExpirado || !podeAdicionarDisciplina(disciplinas.length) ? <Lock size={24} /> : <Plus size={24} />}
        </button>
      </div>
    </div>
  );
}
