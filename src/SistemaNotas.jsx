import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, BookOpen, Award, TrendingUp, AlertCircle, CheckCircle, GraduationCap, Edit2, X, Clock, PlayCircle, ChevronDown, ChevronUp, Search, Save, Cloud, CloudOff, RefreshCw, LogOut, User, Wifi, WifiOff, Download, Upload as UploadIcon, RotateCcw, Sun, Moon, Monitor, List, LayoutGrid, Shield, ChevronRight, Sparkles } from 'lucide-react';
import { useNotas } from './useNotas';
import { useAuth } from './AuthContext';
import ImportModal from './ImportModal';

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

export default function SistemaNotas({ onOpenAdmin }) {
  const { user, signOut } = useAuth();
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
  
  const [semestreAtualAno, setSemestreAtualAno] = useState(() => {
    const saved = localStorage.getItem('semestreAtualAno');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  const [semestreAtualNum, setSemestreAtualNum] = useState(() => {
    const saved = localStorage.getItem('semestreAtualNum');
    return saved ? parseInt(saved) : (new Date().getMonth() < 6 ? 1 : 2);
  });

  useEffect(() => {
    localStorage.setItem('semestreAtualAno', semestreAtualAno.toString());
    localStorage.setItem('semestreAtualNum', semestreAtualNum.toString());
  }, [semestreAtualAno, semestreAtualNum]);

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
    doc.setFontSize(20);
    doc.text('Grade Curricular', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 28, { align: 'center' });
    let y = 40;
    periodos.forEach(periodo => {
      const discs = disciplinas.filter(d => d.periodo === periodo);
      if (discs.length === 0) return;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`${periodo}º Semestre`, 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      discs.forEach(d => {
        const status = STATUS[d.status].label;
        const nota = d.notaFinal ? d.notaFinal.toFixed(1) : '-';
        doc.text(`• ${d.nome} - ${status} ${d.notaFinal ? `(${nota})` : ''}`, 18, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 6;
    });
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Resumo', 14, 20);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Total: ${estatisticas.total} | Aprovadas: ${estatisticas.aprovadas} | Em curso: ${estatisticas.emCurso}`, 14, 35);
    doc.text(`Progresso: ${estatisticas.progresso.toFixed(1)}% | Média: ${estatisticas.mediaGeral.toFixed(2)}`, 14, 43);
    doc.save('grade-curricular.pdf');
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

        {/* Tabs */}
        <nav className="mb-8 overflow-x-auto">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            {[
              { id: 'grade', label: '📚 Grade', icon: BookOpen },
              { id: 'emCurso', label: '⏱️ Em Curso', icon: Clock },
              { id: 'dashboard', label: '📊 Dashboard', icon: TrendingUp },
              { id: 'formatura', label: '🎓 Formatura', icon: GraduationCap },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <span className="hidden sm:inline">{tab.label}</span>
                <tab.icon size={18} className="sm:hidden" />
              </button>
            ))}
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
                <GradientButton variant="success" onClick={exportarPDF}><Download size={18} /><span className="hidden sm:inline">PDF</span></GradientButton>
                <GradientButton variant="amber" onClick={() => setShowImportModal(true)}><UploadIcon size={18} /><span className="hidden sm:inline">Importar</span></GradientButton>
                <GradientButton variant="purple" onClick={() => setShowAddMultiplas(true)}><Plus size={18} /><span className="hidden sm:inline">Várias</span></GradientButton>
                <GradientButton onClick={() => setShowAddDisciplina(true)}><Plus size={18} /><span className="hidden sm:inline">Nova</span></GradientButton>
              </div>
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
                                  <th className="text-center p-3 text-slate-400 font-medium text-sm w-20">Ações</th>
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
                                          {disc.status !== 'NAO_INICIADA' && (
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
                                    ) : disc.notaFinal ? (
                                      <div className="text-right">
                                        <p className="text-2xl font-semibold">{disc.notaFinal.toFixed(1)}</p>
                                        <p className="text-xs text-slate-500">Nota Final</p>
                                      </div>
                                    ) : (disc.ga !== null || disc.gb !== null) && (
                                      <p className="text-sm text-slate-400">GA: {disc.ga ?? '-'} | GB: {disc.gb ?? '-'}</p>
                                    )}
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
            <h2 className="text-xl font-semibold mb-4">Disciplinas em Curso</h2>
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
        {activeTab === 'formatura' && (
          <div className="space-y-6">
            <GlassCard className="p-6" hover={false}>
              <h3 className="text-lg font-semibold mb-4">Simulador de Formatura</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Semestre Atual</label>
                  <div className="flex gap-2">
                    <input type="number" value={semestreAtualAno} onChange={(e) => setSemestreAtualAno(parseInt(e.target.value))} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50" />
                    <select value={semestreAtualNum} onChange={(e) => setSemestreAtualNum(parseInt(e.target.value))} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none">
                      <option value={1} className="bg-slate-800">1º Sem</option>
                      <option value={2} className="bg-slate-800">2º Sem</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="w-full p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
                    <p className="text-slate-400 text-sm mb-1">Previsão de Formatura</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        const pendentes = estatisticas.naoIniciadas + estatisticas.emCurso;
                        const semestresRestantes = Math.ceil(pendentes / 5);
                        let ano = semestreAtualAno, sem = semestreAtualNum;
                        for (let i = 0; i < semestresRestantes; i++) { sem++; if (sem > 2) { sem = 1; ano++; } }
                        return `${ano}/${sem}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-3">Disciplinas Pendentes por Semestre</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {periodos.map(p => {
                    const pendentes = disciplinas.filter(d => d.periodo === p && d.status !== 'APROVADA').length;
                    return (<div key={p} className="p-3 rounded-xl bg-white/5 text-center"><p className="text-lg font-semibold">{pendentes}</p><p className="text-xs text-slate-500">{p}º Sem</p></div>);
                  })}
                </div>
              </div>
            </GlassCard>
          </div>
        )}

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

        {/* FAB Mobile */}
        <button onClick={() => setShowAddDisciplina(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 hover:scale-110 transition-transform duration-300 sm:hidden">
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
