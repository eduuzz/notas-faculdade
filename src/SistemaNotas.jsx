import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, BookOpen, Award, TrendingUp, AlertCircle, CheckCircle, GraduationCap, Edit2, X, Clock, PlayCircle, ChevronDown, ChevronUp, Search, Save, Cloud, CloudOff, RefreshCw, LogOut, User, Wifi, WifiOff, Download, Upload as UploadIcon, RotateCcw, Sun, Moon, Monitor, List, LayoutGrid, Shield, ChevronRight, Sparkles, Settings, Crown, Zap, Star, Lock, FileText, Calculator, Target, Database } from 'lucide-react';
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
  const { permissoes, podeAdicionarDisciplina, getLimiteDisciplinas, temPermissao } = usePermissoes();
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
  const [showAddMultiplas, setShowAddMultiplas] = useState(false);
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
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const podeGraficos = temPermissao('exportarPdfGraficos');
    
    // Cores
    const corPrimaria = [124, 58, 237]; // violet-500
    const corSecundaria = [100, 116, 139]; // slate-500
    const corVerde = [16, 185, 129]; // emerald-500
    const corAzul = [59, 130, 246]; // blue-500
    const corVermelha = [239, 68, 68]; // red-500
    const corCinza = [148, 163, 184]; // slate-400
    
    // Header com gradiente simulado
    doc.setFillColor(...corPrimaria);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('Grade Curricular', 105, 20, { align: 'center' });
    
    // Subtítulo (curso)
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(userCurso || 'Ciencia da Computacao', 105, 30, { align: 'center' });
    
    // Linha decorativa
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(60, 36, 150, 36);
    
    // Info do aluno
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Aluno: ${userName || 'Estudante'}`, 14, 55);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 61);
    
    // Cards de estatísticas
    const cardY = 70;
    const cardWidth = 44;
    const cardHeight = 22;
    const cardSpacing = 2;
    
    const cards = [
      { label: 'Aprovadas', value: estatisticas.aprovadas, color: corVerde },
      { label: 'Em Curso', value: estatisticas.emCurso, color: corAzul },
      { label: 'Progresso', value: `${estatisticas.progresso.toFixed(0)}%`, color: corPrimaria },
      { label: 'Media Geral', value: estatisticas.mediaGeral.toFixed(1), color: [245, 158, 11] }, // amber
    ];
    
    cards.forEach((card, i) => {
      const x = 14 + (cardWidth + cardSpacing) * i;
      
      // Fundo do card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, 'F');
      
      // Barra colorida no topo
      doc.setFillColor(...card.color);
      doc.roundedRect(x, cardY, cardWidth, 4, 3, 3, 'F');
      doc.rect(x, cardY + 2, cardWidth, 2, 'F');
      
      // Valor
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(String(card.value), x + cardWidth/2, cardY + 14, { align: 'center' });
      
      // Label
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...corSecundaria);
      doc.text(card.label, x + cardWidth/2, cardY + 20, { align: 'center' });
    });
    
    let y = 102;
    
    // Disciplinas por período
    periodos.forEach(periodo => {
      const discs = disciplinas.filter(d => d.periodo === periodo);
      if (discs.length === 0) return;
      
      // Verificar se precisa de nova página
      if (y > 250) { doc.addPage(); y = 20; }
      
      // Header do período
      const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
      const percentual = Math.round((aprovadas / discs.length) * 100);
      
      doc.setFillColor(...corPrimaria);
      doc.roundedRect(14, y - 6, 182, 12, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`${periodo}. Semestre`, 20, y + 2);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${aprovadas}/${discs.length} concluidas (${percentual}%)`, 188, y + 2, { align: 'right' });
      
      y += 14;
      
      // Lista de disciplinas
      discs.forEach(d => {
        if (y > 275) { doc.addPage(); y = 20; }
        
        const status = STATUS[d.status];
        const nota = d.notaFinal ? d.notaFinal.toFixed(1) : null;
        
        // Indicador de status (bolinha)
        const statusColors = {
          'APROVADA': corVerde,
          'EM_CURSO': corAzul,
          'REPROVADA': corVermelha,
          'NAO_INICIADA': corCinza
        };
        doc.setFillColor(...(statusColors[d.status] || corCinza));
        doc.circle(20, y - 1.5, 2.5, 'F');
        
        // Nome da disciplina
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(d.nome, 26, y);
        
        // Detalhes
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...corSecundaria);
        
        let detalhes = `${d.creditos} creditos`;
        detalhes += ` | ${status.label}`;
        if (nota) detalhes += ` | Nota: ${nota}`;
        if (d.semestreCursado) detalhes += ` | ${d.semestreCursado}`;
        
        doc.text(detalhes, 26, y + 5);
        
        y += 13;
      });
      
      y += 5;
    });
    
    // Página de resumo
    doc.addPage();
    
    // Header da página de resumo
    doc.setFillColor(...corPrimaria);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Resumo Academico', 105, 22, { align: 'center' });
    
    // Cards grandes de estatísticas
    const resumoY = 50;
    const resumoCards = [
      { label: 'Total de Disciplinas', value: estatisticas.total, x: 14, width: 58 },
      { label: 'Aprovadas', value: estatisticas.aprovadas, x: 76, width: 58 },
      { label: 'Progresso', value: `${estatisticas.progresso.toFixed(0)}%`, x: 138, width: 58 },
    ];
    
    resumoCards.forEach(card => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(card.x, resumoY, card.width, 35, 4, 4, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(...corSecundaria);
      doc.text(card.label, card.x + card.width/2, resumoY + 12, { align: 'center' });
      
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(String(card.value), card.x + card.width/2, resumoY + 28, { align: 'center' });
    });
    
    // Card de média geral (destaque)
    doc.setFillColor(...corPrimaria);
    doc.roundedRect(14, 95, 182, 30, 4, 4, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Media Geral Ponderada', 24, 113);
    
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text(estatisticas.mediaGeral.toFixed(2), 186, 115, { align: 'right' });
    
    if (podeGraficos) {
      // Gráfico de barras por período (Premium)
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Desempenho por Semestre', 14, 145);
      
      let barY = 155;
      const barMaxWidth = 130;
      
      periodos.forEach(periodo => {
        const discs = disciplinas.filter(d => d.periodo === periodo);
        if (discs.length === 0) return;
        
        if (barY > 250) return; // Limite de espaço (deixa espaço para legenda)
        
        const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
        const percentual = (aprovadas / discs.length) * 100;
        const filledWidth = (percentual / 100) * barMaxWidth;
        
        // Label do semestre
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(`${periodo}. Sem`, 14, barY + 6);
        
        // Barra de fundo
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(45, barY, barMaxWidth, 10, 2, 2, 'F');
        
        // Barra preenchida com cor baseada no percentual
        if (filledWidth > 0) {
          if (percentual >= 80) {
            doc.setFillColor(...corVerde);
          } else if (percentual >= 50) {
            doc.setFillColor(245, 158, 11); // amber
          } else {
            doc.setFillColor(...corVermelha);
          }
          doc.roundedRect(45, barY, Math.max(filledWidth, 4), 10, 2, 2, 'F');
        }
        
        // Percentual
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(`${percentual.toFixed(0)}%`, 180, barY + 7);
        
        // Info adicional
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...corSecundaria);
        doc.text(`${aprovadas}/${discs.length}`, 192, barY + 7);
        
        barY += 16;
      });
      
      // Legenda - posicionada após as barras com espaçamento
      const legendY = Math.max(barY + 10, 260);
      
      // Fundo da legenda
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(45, legendY - 5, 120, 16, 3, 3, 'F');
      
      // Itens da legenda
      doc.setFontSize(8);
      doc.setFillColor(...corVerde);
      doc.circle(55, legendY + 3, 3, 'F');
      doc.setTextColor(60, 60, 60);
      doc.text('80%+', 61, legendY + 5);
      
      doc.setFillColor(245, 158, 11);
      doc.circle(95, legendY + 3, 3, 'F');
      doc.text('50-79%', 101, legendY + 5);
      
      doc.setFillColor(...corVermelha);
      doc.circle(140, legendY + 3, 3, 'F');
      doc.text('<50%', 146, legendY + 5);
      
      // Rodapé Premium
      doc.setFontSize(8);
      doc.setTextColor(...corPrimaria);
      doc.text('Relatorio Premium - Sistema de Notas', 105, 287, { align: 'center' });
    } else {
      // Versão Pro - Lista simples
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Resumo por Semestre', 14, 145);
      
      let listY = 158;
      periodos.forEach(periodo => {
        const discs = disciplinas.filter(d => d.periodo === periodo);
        if (discs.length === 0) return;
        
        const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
        const percentual = ((aprovadas/discs.length)*100).toFixed(0);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`${periodo}. Semestre: ${aprovadas}/${discs.length} concluidas (${percentual}%)`, 20, listY);
        listY += 10;
      });
      
      // Rodapé Pro
      doc.setFontSize(8);
      doc.setTextColor(...corSecundaria);
      doc.text('Sistema de Notas - Plano Pro', 105, 290, { align: 'center' });
    }
    
    doc.save(`grade-curricular-${new Date().toISOString().split('T')[0]}.pdf`);
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
              <button onClick={signOut} className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition-all">
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
                    activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white'
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
                <GradientButton variant="amber" onClick={() => setShowImportModal(true)}><UploadIcon size={18} /><span className="hidden sm:inline">Importar</span></GradientButton>
                <GradientButton 
                  variant="purple" 
                  onClick={() => podeAdicionarDisciplina(disciplinas.length) ? setShowAddMultiplas(true) : setShowUpgradeModal(true)}
                >
                  <Plus size={18} /><span className="hidden sm:inline">Várias</span>
                </GradientButton>
                <GradientButton 
                  onClick={() => podeAdicionarDisciplina(disciplinas.length) ? setShowAddDisciplina(true) : setShowUpgradeModal(true)}
                >
                  <Plus size={18} /><span className="hidden sm:inline">Nova</span>
                </GradientButton>
              </div>
              {/* Indicador de limite para plano básico */}
              {getLimiteDisciplinas() !== Infinity && (
                <div className="text-xs text-slate-500">
                  {disciplinas.length}/{getLimiteDisciplinas()} disciplinas
                  {disciplinas.length >= getLimiteDisciplinas() && (
                    <span className="text-amber-400 ml-2">• Limite atingido</span>
                  )}
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
            <GlassCard className="w-full max-w-md" hover={false}>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6">Nova Disciplina</h3>
                <div className="space-y-4">
                  <div><label className="text-sm text-slate-400 block mb-2">Nome</label><input type="text" value={novaDisciplina.nome} onChange={(e) => setNovaDisciplina({ ...novaDisciplina, nome: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50" placeholder="Nome da disciplina" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm text-slate-400 block mb-2">Período</label><select value={novaDisciplina.periodo} onChange={(e) => setNovaDisciplina({ ...novaDisciplina, periodo: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none">{periodos.map(p => (<option key={p} value={p} className="bg-slate-800">{p}º Semestre</option>))}</select></div>
                    <div><label className="text-sm text-slate-400 block mb-2">Créditos</label><input type="number" value={novaDisciplina.creditos} onChange={(e) => setNovaDisciplina({ ...novaDisciplina, creditos: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" /></div>
                  </div>
                  <div><label className="text-sm text-slate-400 block mb-2">Carga Horária</label><input type="number" value={novaDisciplina.cargaHoraria} onChange={(e) => setNovaDisciplina({ ...novaDisciplina, cargaHoraria: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none" /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <GradientButton variant="secondary" className="flex-1" onClick={() => setShowAddDisciplina(false)}>Cancelar</GradientButton>
                  <GradientButton className="flex-1" onClick={handleAddDisciplina}>Adicionar</GradientButton>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {showAddMultiplas && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md" hover={false}>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6">Adicionar Várias</h3>
                <div className="space-y-4">
                  <div><label className="text-sm text-slate-400 block mb-2">Período</label><select value={periodoMultiplas} onChange={(e) => setPeriodoMultiplas(parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none">{periodos.map(p => (<option key={p} value={p} className="bg-slate-800">{p}º Semestre</option>))}</select></div>
                  <div><label className="text-sm text-slate-400 block mb-2">Disciplinas (uma por linha)</label><textarea value={disciplinasMultiplas} onChange={(e) => setDisciplinasMultiplas(e.target.value)} rows={6} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none resize-none" placeholder="Cálculo I&#10;Física I&#10;Programação I" /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <GradientButton variant="secondary" className="flex-1" onClick={() => { setShowAddMultiplas(false); setDisciplinasMultiplas(''); }}>Cancelar</GradientButton>
                  <GradientButton className="flex-1" onClick={handleAddMultiplas}>Adicionar</GradientButton>
                </div>
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
            planoAtual={userPlano} 
            userEmail={user?.email}
            userName={userName}
            onClose={() => setShowUpgradeModal(false)} 
          />
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
          onClick={() => podeAdicionarDisciplina(disciplinas.length) ? setShowAddDisciplina(true) : setShowUpgradeModal(true)} 
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 hover:scale-110 transition-transform duration-300 sm:hidden"
        >
          {podeAdicionarDisciplina(disciplinas.length) ? <Plus size={24} /> : <Lock size={24} />}
        </button>
      </div>
    </div>
  );
}
