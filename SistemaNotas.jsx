import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Plus, Trash2, BookOpen, Award, TrendingUp, AlertCircle, CheckCircle, GraduationCap, Edit2, X, Clock, PlayCircle, ChevronDown, ChevronUp, Search, Save, Cloud, CloudOff, RefreshCw, LogOut, User, Wifi, WifiOff, Download, RotateCcw, Sun, Moon, Monitor, List, LayoutGrid, Shield } from 'lucide-react';
import { useNotas } from './useNotas';
import { useAuth } from './AuthContext';

const STATUS = {
  NAO_INICIADA: { label: 'Não Iniciada', color: 'slate', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  EM_CURSO: { label: 'Em Curso', color: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  APROVADA: { label: 'Aprovada', color: 'green', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  REPROVADA: { label: 'Reprovada', color: 'red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
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
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  // Estados do simulador de formatura
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

  // Salvar preferências do simulador
  useEffect(() => {
    localStorage.setItem('semestreAtualAno', semestreAtualAno.toString());
    localStorage.setItem('semestreAtualNum', semestreAtualNum.toString());
    localStorage.setItem('planejamentoSemestres', JSON.stringify(planejamentoSemestres));
  }, [semestreAtualAno, semestreAtualNum, planejamentoSemestres]);

  // Lógica do tema
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let isDark;
      
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }
      
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };
    
    applyTheme();
    localStorage.setItem('theme', theme);
    
    // Listener para mudanças do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleModoCompacto = () => {
    setModoCompacto(prev => {
      const novo = !prev;
      localStorage.setItem('modoCompacto', novo);
      return novo;
    });
  };

  const calcularMedia = (d) => {
    if (d.notaFinal !== null) return d.notaFinal;
    if (d.ga !== null && d.gb !== null) return d.ga * 0.33 + d.gb * 0.67;
    if (d.ga !== null) return d.ga * 0.33;
    if (d.gb !== null) return d.gb * 0.67;
    return null;
  };

  const periodos = useMemo(() => {
    return [...new Set(disciplinas.map(d => d.periodo))].sort((a, b) => a - b);
  }, [disciplinas]);

  const estatisticas = useMemo(() => {
    const total = disciplinas.length;
    const aprovadas = disciplinas.filter(d => d.status === 'APROVADA').length;
    const reprovadas = disciplinas.filter(d => d.status === 'REPROVADA').length;
    const emCurso = disciplinas.filter(d => d.status === 'EM_CURSO').length;
    const naoIniciadas = disciplinas.filter(d => d.status === 'NAO_INICIADA').length;
    
    const disciplinasComNota = disciplinas.filter(d => calcularMedia(d) !== null);
    const mediaGeral = disciplinasComNota.length > 0
      ? disciplinasComNota.reduce((acc, d) => acc + calcularMedia(d), 0) / disciplinasComNota.length
      : 0;

    const totalCreditos = disciplinas.reduce((acc, d) => acc + d.creditos, 0);
    const creditosAprovados = disciplinas.filter(d => d.status === 'APROVADA').reduce((acc, d) => acc + d.creditos, 0);
    const creditosEmCurso = disciplinas.filter(d => d.status === 'EM_CURSO').reduce((acc, d) => acc + d.creditos, 0);

    const totalCargaHoraria = disciplinas.reduce((acc, d) => acc + d.cargaHoraria, 0);
    const cargaHorariaConcluida = disciplinas.filter(d => d.status === 'APROVADA').reduce((acc, d) => acc + d.cargaHoraria, 0);

    const progressoCurso = total > 0 ? (aprovadas / total) * 100 : 0;

    return {
      total, aprovadas, reprovadas, emCurso, naoIniciadas,
      mediaGeral, totalCreditos, creditosAprovados, creditosEmCurso,
      totalCargaHoraria, cargaHorariaConcluida, progressoCurso
    };
  }, [disciplinas]);

  const disciplinasFiltradas = useMemo(() => {
    return disciplinas.filter(d => {
      const matchStatus = filtroStatus === 'TODOS' || d.status === filtroStatus;
      const matchBusca = d.nome.toLowerCase().includes(busca.trim().toLowerCase());
      return matchStatus && matchBusca;
    });
  }, [disciplinas, filtroStatus, busca]);

  const disciplinasPorPeriodo = useMemo(() => {
    const grupos = {};
    disciplinasFiltradas.forEach(d => {
      if (!grupos[d.periodo]) grupos[d.periodo] = [];
      grupos[d.periodo].push(d);
    });
    return grupos;
  }, [disciplinasFiltradas]);

  const dadosProgressoRadial = [
    { name: 'Progresso', value: estatisticas.progressoCurso, fill: '#6366f1' }
  ];

  const dadosPorStatus = [
    { name: 'Aprovadas', value: estatisticas.aprovadas, color: '#10b981' },
    { name: 'Em Curso', value: estatisticas.emCurso, color: '#3b82f6' },
    { name: 'Reprovadas', value: estatisticas.reprovadas, color: '#ef4444' },
    { name: 'Não Iniciadas', value: estatisticas.naoIniciadas, color: '#64748b' }
  ].filter(d => d.value > 0);

  const dadosPorPeriodo = periodos.map(p => {
    const discs = disciplinas.filter(d => d.periodo === p);
    const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
    const emCurso = discs.filter(d => d.status === 'EM_CURSO').length;
    return { periodo: `${p}º`, aprovadas, emCurso, total: discs.length };
  });

  const handleAdicionarDisciplina = async () => {
    if (!novaDisciplina.nome) return;
    await adicionarDisciplina({ ...novaDisciplina });
    setNovaDisciplina({ nome: '', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null, observacao: '' });
    setShowAddDisciplina(false);
  };

  const handleAdicionarMultiplas = async () => {
    if (!disciplinasMultiplas.trim()) return;
    const novas = disciplinasMultiplas.split('\n')
      .map(nome => nome.trim())
      .filter(nome => nome.length > 0)
      .map((nome) => ({
        nome,
        periodo: periodoMultiplas,
        creditos: 4,
        cargaHoraria: 60,
        notaMinima: 6.0,
        status: 'NAO_INICIADA',
        ga: null,
        gb: null,
        notaFinal: null,
        semestreCursado: null,
        observacao: ''
      }));
    
    for (const nova of novas) {
      await adicionarDisciplina(nova);
    }
    setDisciplinasMultiplas('');
    setShowAddMultiplas(false);
  };

  const handleRemoverDisciplina = async (id) => {
    await removerDisciplina(id);
    setShowDeleteMenu(null);
  };

  const handleResetarDisciplina = async (id) => {
    await atualizarDisciplina(id, { 
      status: 'NAO_INICIADA', 
      ga: null, 
      gb: null, 
      notaFinal: null, 
      faltas: 0, 
      semestreCursado: null,
      observacao: ''
    });
    setShowDeleteMenu(null);
  };

  const handleAtualizarDisciplina = async (id, updates) => {
    await atualizarDisciplina(id, updates);
  };

  const iniciarDisciplina = async (id) => {
    await handleAtualizarDisciplina(id, { status: 'EM_CURSO', semestreCursado: semestreIniciar });
    setShowIniciarModal(null);
  };

  const finalizarDisciplina = async (id) => {
    const disc = disciplinas.find(d => d.id === id);
    const media = calcularMedia(disc);
    const novoStatus = media >= disc.notaMinima ? 'APROVADA' : 'REPROVADA';
    await handleAtualizarDisciplina(id, { status: novoStatus });
  };

  const abrirEdicaoNotas = (d) => {
    setEditingNotas(d.id);
    setNotasTemp({
      ga: d.ga !== null ? d.ga.toString() : '',
      gb: d.gb !== null ? d.gb.toString() : '',
      notaFinal: d.notaFinal !== null ? d.notaFinal.toString() : '',
      semestreCursado: d.semestreCursado || '',
      observacao: d.observacao || ''
    });
  };

  const salvarNotas = async (id) => {
    await atualizarDisciplina(id, {
      ga: notasTemp.ga !== '' ? parseFloat(notasTemp.ga) : null,
      gb: notasTemp.gb !== '' ? parseFloat(notasTemp.gb) : null,
      notaFinal: notasTemp.notaFinal !== '' ? parseFloat(notasTemp.notaFinal) : null,
      semestreCursado: notasTemp.semestreCursado.trim() || null,
      observacao: notasTemp.observacao.trim() || ''
    });
    setEditingNotas(null);
    setNotasTemp({ ga: '', gb: '', notaFinal: '', semestreCursado: '', observacao: '' });
  };

  const togglePeriodo = (periodo) => {
    setExpandedPeriodos(prev => ({ ...prev, [periodo]: !prev[periodo] }));
  };

  const exportarPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241); // Indigo
    doc.text('Histórico Acadêmico', 105, 20, { align: 'center' });
    
    // Informações do aluno
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 28, { align: 'center' });
    if (user?.email) {
      doc.text(`Aluno: ${user.email}`, 105, 34, { align: 'center' });
    }
    
    // Resumo
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text('Resumo do Curso', 14, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    const resumoY = 52;
    doc.text(`Total de Disciplinas: ${estatisticas.total}`, 14, resumoY);
    doc.text(`Aprovadas: ${estatisticas.aprovadas} (${estatisticas.progressoCurso.toFixed(1)}%)`, 14, resumoY + 6);
    doc.text(`Em Curso: ${estatisticas.emCurso}`, 14, resumoY + 12);
    doc.text(`Reprovadas: ${estatisticas.reprovadas}`, 14, resumoY + 18);
    doc.text(`Não Iniciadas: ${estatisticas.naoIniciadas}`, 14, resumoY + 24);
    
    doc.text(`Média Geral: ${estatisticas.mediaGeral.toFixed(2)}`, 105, resumoY);
    doc.text(`Créditos Aprovados: ${estatisticas.creditosAprovados}/${estatisticas.totalCreditos}`, 105, resumoY + 6);
    doc.text(`Carga Horária: ${estatisticas.cargaHorariaConcluida}/${estatisticas.totalCargaHoraria}h`, 105, resumoY + 12);
    
    // Tabela de disciplinas por período
    let currentY = resumoY + 35;
    
    periodos.forEach(periodo => {
      const discs = disciplinas.filter(d => d.periodo === periodo);
      
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // Cabeçalho do período
      doc.setFontSize(11);
      doc.setTextColor(99, 102, 241);
      doc.text(`${periodo}º Semestre`, 14, currentY);
      currentY += 5;
      
      // Dados da tabela
      const tableData = discs.map(d => {
        const media = calcularMedia(d);
        return [
          d.nome.length > 40 ? d.nome.substring(0, 37) + '...' : d.nome,
          d.ga !== null ? d.ga.toFixed(1) : '-',
          d.gb !== null ? d.gb.toFixed(1) : '-',
          media !== null ? media.toFixed(1) : '-',
          STATUS[d.status].label
        ];
      });
      
      doc.autoTable({
        startY: currentY,
        head: [['Disciplina', 'GA', 'GB', 'Média', 'Situação']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [99, 102, 241],
          textColor: 255,
          fontSize: 9
        },
        bodyStyles: { 
          fontSize: 8,
          textColor: 50
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: 14, right: 14 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 4) {
            const status = data.cell.raw;
            if (status === 'Aprovada') {
              data.cell.styles.textColor = [16, 185, 129];
            } else if (status === 'Reprovada') {
              data.cell.styles.textColor = [239, 68, 68];
            } else if (status === 'Em Curso') {
              data.cell.styles.textColor = [59, 130, 246];
            }
          }
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    });
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Sistema de Notas Acadêmicas', 14, 290);
    }
    
    // Salvar
    doc.save('historico-academico.pdf');
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'APROVADA': return <CheckCircle size={16} className="text-green-400" />;
      case 'REPROVADA': return <AlertCircle size={16} className="text-red-400" />;
      case 'EM_CURSO': return <PlayCircle size={16} className="text-blue-400" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  const StatusBadge = ({ status }) => {
    const s = STATUS[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text} border ${s.border}`}>
        <StatusIcon status={status} />
        {s.label}
      </span>
    );
  };

  const NotaDisplay = ({ label, valor, minima }) => {
    if (valor === null) return (
      <div className="text-center p-2 bg-slate-700/30 rounded-lg min-w-[70px]">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg text-slate-600">-</div>
      </div>
    );
    return (
      <div className={`text-center p-2 rounded-lg min-w-[70px] ${valor >= minima ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        <div className="text-xs text-slate-400">{label}</div>
        <div className={`text-lg font-bold ${valor >= minima ? 'text-green-400' : 'text-red-400'}`}>
          {valor.toFixed(1)}
        </div>
      </div>
    );
  };

  const SyncStatus = () => (
    <div className="flex items-center gap-2 text-sm">
      {isOnline ? (
        <Wifi size={16} className="text-green-400" />
      ) : (
        <WifiOff size={16} className="text-red-400" />
      )}
      
      {syncing ? (
        <RefreshCw size={16} className="text-blue-400 animate-spin" />
      ) : (
        <Cloud size={16} className="text-green-400" />
      )}
      <span className="text-slate-400 hidden sm:inline text-sm truncate max-w-[200px]">{user?.email}</span>
      <button
        onClick={forceSync}
        disabled={syncing || !isOnline}
        className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
        title="Sincronizar"
      >
        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
      </button>
      {onOpenAdmin && (
        <button
          onClick={onOpenAdmin}
          className="p-1 hover:bg-slate-700 rounded transition-colors text-indigo-400"
          title="Painel Admin"
        >
          <Shield size={14} />
        </button>
      )}
      <button
        onClick={signOut}
        className="p-1 hover:bg-slate-700 rounded transition-colors text-red-400"
        title="Sair"
      >
        <LogOut size={14} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={48} className="mx-auto text-indigo-400 animate-spin mb-4" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <GraduationCap size={40} className="text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Sistema de Notas
              </h1>
              <p className="text-slate-400 dark:text-slate-400 text-sm">Gerencie suas disciplinas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Seletor de Tema */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 bg-slate-700 dark:bg-slate-700 light:bg-slate-200 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-slate-300 rounded-lg transition-colors"
                title="Alterar tema"
              >
                {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                    className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 transition-colors ${theme === 'light' ? 'text-indigo-400' : ''}`}
                  >
                    <Sun size={16} />
                    Claro
                  </button>
                  <button
                    onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                    className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 transition-colors ${theme === 'dark' ? 'text-indigo-400' : ''}`}
                  >
                    <Moon size={16} />
                    Escuro
                  </button>
                  <button
                    onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                    className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 transition-colors ${theme === 'system' ? 'text-indigo-400' : ''}`}
                  >
                    <Monitor size={16} />
                    Sistema
                  </button>
                </div>
              )}
            </div>
            <SyncStatus />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-slate-800/50 p-1 rounded-lg w-fit">
          {[
            { id: 'grade', label: 'Grade', icon: BookOpen },
            { id: 'emcurso', label: 'Em Curso', icon: PlayCircle },
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'formatura', label: 'Formatura', icon: GraduationCap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Grade Curricular */}
        {activeTab === 'grade' && (
          <div className="space-y-6">
            {/* Barra de ações */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none w-48"
                  />
                </div>
                <select
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm"
                >
                  <option value="TODOS">Todos</option>
                  <option value="NAO_INICIADA">Não Iniciadas</option>
                  <option value="EM_CURSO">Em Curso</option>
                  <option value="APROVADA">Aprovadas</option>
                  <option value="REPROVADA">Reprovadas</option>
                </select>
                <button
                  onClick={toggleModoCompacto}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${modoCompacto ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                  title={modoCompacto ? "Modo normal" : "Modo compacto"}
                >
                  {modoCompacto ? <LayoutGrid size={18} /> : <List size={18} />}
                  <span className="hidden sm:inline">{modoCompacto ? "Normal" : "Compacto"}</span>
                </button>
                <button
                  onClick={() => {
                    if (modoCompacto) return;
                    const todosExpandidos = periodos.every(p => expandedPeriodos[p]);
                    const novosExpandidos = {};
                    periodos.forEach(p => novosExpandidos[p] = !todosExpandidos);
                    setExpandedPeriodos(novosExpandidos);
                  }}
                  disabled={modoCompacto}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    modoCompacto 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={modoCompacto ? "Não disponível no modo compacto" : (periodos.every(p => expandedPeriodos[p]) ? "Minimizar todos" : "Expandir todos")}
                >
                  {periodos.every(p => expandedPeriodos[p]) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  <span className="hidden sm:inline">{periodos.every(p => expandedPeriodos[p]) ? "Minimizar" : "Expandir"}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportarPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                  title="Exportar PDF"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                {(
                  <>
                    <button
                      onClick={() => setShowAddMultiplas(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                    >
                      <Plus size={18} />
                      <span className="hidden sm:inline">Várias</span>
                    </button>
                    <button
                      onClick={() => setShowAddDisciplina(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm"
                    >
                      <Plus size={18} />
                      <span className="hidden sm:inline">Nova</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Semestres */}
            {modoCompacto ? (
              /* Modo Compacto */
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400 text-sm font-medium">Disciplina</th>
                      <th className="text-center p-3 text-slate-400 text-sm font-medium w-20">Sem.</th>
                      <th className="text-center p-3 text-slate-400 text-sm font-medium w-24">Status</th>
                      <th className="text-center p-3 text-slate-400 text-sm font-medium w-16">GA</th>
                      <th className="text-center p-3 text-slate-400 text-sm font-medium w-16">GB</th>
                      <th className="text-center p-3 text-slate-400 text-sm font-medium w-20">Média</th>
                      {<th className="text-center p-3 text-slate-400 text-sm font-medium w-20">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {periodos.map(periodo => {
                      const discsPeriodo = disciplinasPorPeriodo[periodo] || [];
                      return discsPeriodo.map((d, idx) => {
                        const media = calcularMedia(d);
                        return (
                          <tr 
                            key={d.id} 
                            className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                              idx === 0 ? 'border-t-2 border-t-slate-600' : ''
                            }`}
                          >
                            <td className="p-3">
                              <div className="font-medium">{d.nome}</div>
                              {d.observacao && <div className="text-xs text-slate-500 italic">📝 {d.observacao}</div>}
                            </td>
                            <td className="text-center p-3 text-indigo-400 font-medium">{periodo}º</td>
                            <td className="text-center p-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${STATUS[d.status].bg} ${STATUS[d.status].text}`}>
                                {d.status === 'APROVADA' ? '✓' : d.status === 'REPROVADA' ? '✗' : d.status === 'EM_CURSO' ? '⏳' : '○'}
                              </span>
                            </td>
                            <td className={`text-center p-3 font-bold ${d.ga !== null ? (d.ga >= d.notaMinima ? 'text-green-400' : 'text-red-400') : 'text-slate-600'}`}>
                              {d.ga !== null ? d.ga.toFixed(1) : '-'}
                            </td>
                            <td className={`text-center p-3 font-bold ${d.gb !== null ? (d.gb >= d.notaMinima ? 'text-green-400' : 'text-red-400') : 'text-slate-600'}`}>
                              {d.gb !== null ? d.gb.toFixed(1) : '-'}
                            </td>
                            <td className={`text-center p-3 font-bold ${media !== null ? (media >= d.notaMinima ? 'text-green-400' : 'text-red-400') : 'text-slate-600'}`}>
                              {media !== null ? media.toFixed(1) : '-'}
                            </td>
                            {(
                              <td className="text-center p-3">
                                <div className="flex justify-center gap-1">
                                  {d.status === 'NAO_INICIADA' && (
                                    <button onClick={() => setShowIniciarModal(d.id)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded" title="Iniciar">
                                      <PlayCircle size={16} />
                                    </button>
                                  )}
                                  {(d.status === 'EM_CURSO' || d.status === 'APROVADA' || d.status === 'REPROVADA') && (
                                    <button onClick={() => abrirEdicaoNotas(d)} className="p-1 text-slate-400 hover:bg-slate-600 rounded" title="Editar">
                                      <Edit2 size={16} />
                                    </button>
                                  )}
                                  <button onClick={() => setShowDeleteMenu(d.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded" title="Excluir">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Modo Normal */
              periodos.map(periodo => {
              const discsPeriodo = disciplinasPorPeriodo[periodo] || [];
              const concluidas = discsPeriodo.filter(d => d.status === 'APROVADA' || d.status === 'REPROVADA').length;
              const total = discsPeriodo.length;
              const notasSemestre = discsPeriodo
                .filter(d => (d.status === 'APROVADA' || d.status === 'REPROVADA') && (d.ga !== null || d.gb !== null))
                .map(d => calcularMedia(d))
                .filter(m => m !== null);
              const mediaSemestre = notasSemestre.length > 0 
                ? notasSemestre.reduce((a, b) => a + b, 0) / notasSemestre.length 
                : null;
              
              return (
              <div key={periodo} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
                <button
                  onClick={() => togglePeriodo(periodo)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-indigo-400">{periodo}º Semestre</span>
                    <span className={`text-sm ${
                      concluidas === total ? 'text-green-400' : 
                      concluidas > 0 ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {concluidas}/{total} concluídas
                    </span>
                    {mediaSemestre !== null && (
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${mediaSemestre >= 6 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        Média: {mediaSemestre.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {expandedPeriodos[periodo] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {expandedPeriodos[periodo] && disciplinasPorPeriodo[periodo] && (
                  <div className="border-t border-slate-700">
                    <div className="grid gap-3 p-4">
                      {disciplinasPorPeriodo[periodo].map(d => {
                        const media = calcularMedia(d);
                        const isEditing = editingDisciplina === d.id;
                        const isEditingNotas = editingNotas === d.id;
                        
                        return (
                          <div
                            key={d.id}
                            className={`p-4 rounded-lg border transition-all ${
                              d.status === 'EM_CURSO' ? 'bg-blue-500/10 border-blue-500/30' :
                              d.status === 'APROVADA' ? 'bg-green-500/10 border-green-500/30' :
                              d.status === 'REPROVADA' ? 'bg-red-500/10 border-red-500/30' :
                              'bg-slate-700/30 border-slate-600'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{d.nome}</h4>
                                  <StatusBadge status={d.status} />
                                </div>
                                <div className="text-sm text-slate-400 flex flex-wrap gap-3">
                                  <span>{d.creditos} cred.</span>
                                  <span>{d.cargaHoraria}h</span>
                                  {d.semestreCursado && <span className="text-indigo-400">{d.semestreCursado}</span>}
                                </div>
                                {d.observacao && (
                                  <div className="text-xs text-slate-500 mt-1 italic">
                                    📝 {d.observacao}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {(d.status === 'EM_CURSO' || d.status === 'APROVADA' || d.status === 'REPROVADA') && !isEditingNotas && (
                                  <div className="flex gap-2">
                                    <NotaDisplay label="GA" valor={d.ga} minima={d.notaMinima} />
                                    <NotaDisplay label="GB" valor={d.gb} minima={d.notaMinima} />
                                    {media !== null && (
                                      <div className={`text-center p-2 rounded-lg min-w-[70px] ${media >= d.notaMinima ? 'bg-green-500/30 border border-green-500/50' : 'bg-red-500/30 border border-red-500/50'}`}>
                                        <div className="text-xs text-slate-300">Média</div>
                                        <div className={`text-xl font-bold ${media >= d.notaMinima ? 'text-green-400' : 'text-red-400'}`}>
                                          {media.toFixed(1)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                
                                {d.status === 'NAO_INICIADA' && (
                                  <button onClick={() => setShowIniciarModal(d.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">Iniciar</button>
                                )}
                                
                                {d.status === 'EM_CURSO' && !isEditingNotas && (
                                  <>
                                    <button onClick={() => abrirEdicaoNotas(d)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><Edit2 size={16} /></button>
                                    {(d.ga !== null && d.gb !== null) && (
                                      <button onClick={() => finalizarDisciplina(d.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm">Finalizar</button>
                                    )}
                                  </>
                                )}

                                {(d.status === 'APROVADA' || d.status === 'REPROVADA') && !isEditingNotas && (
                                  <button onClick={() => abrirEdicaoNotas(d)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><Edit2 size={16} /></button>
                                )}
                                
                                {!isEditingNotas && (
                                  <button 
                                    onClick={() => setShowDeleteMenu(d.id)} 
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
            })
            )}

            {periodos.length === 0 && (
              <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
                <BookOpen size={48} className="mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">Nenhuma disciplina cadastrada</p>
                <p className="text-sm text-slate-500 mt-2">Clique em "Nova" para começar</p>
              </div>
            )}
          </div>
        )}

        {/* Em Curso */}
        {activeTab === 'emcurso' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PlayCircle className="text-blue-400" />
              Disciplinas em Curso
            </h2>
            
            {disciplinas.filter(d => d.status === 'EM_CURSO').length === 0 ? (
              <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
                <Clock size={48} className="mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">Nenhuma disciplina em curso</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {disciplinas.filter(d => d.status === 'EM_CURSO').map(d => {
                  const media = calcularMedia(d);
                  const isEditingNotas = editingNotas === d.id;
                  let notaNecessariaGB = null;
                  if (d.ga !== null && d.gb === null) {
                    // Fórmula: GA * 0.33 + GB * 0.67 >= notaMinima
                    // GB >= (notaMinima - GA * 0.33) / 0.67
                    notaNecessariaGB = (d.notaMinima - d.ga * 0.33) / 0.67;
                    if (notaNecessariaGB < 0) notaNecessariaGB = 0;
                  }
                  
                  return (
                    <div key={d.id} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-blue-500/30">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{d.nome}</h3>
                          <div className="text-slate-400 text-sm">{d.periodo}º Semestre • {d.semestreCursado}</div>
                        </div>
                      </div>
                      
                      {!isEditingNotas ? (
                        <>
                          <div className="flex flex-wrap gap-4 items-end mb-4">
                            <div className="flex gap-3">
                              <div className={`text-center p-4 rounded-xl min-w-[100px] ${d.ga !== null ? (d.ga >= d.notaMinima ? 'bg-green-500/20' : 'bg-red-500/20') : 'bg-slate-700/50'}`}>
                                <div className="text-sm text-slate-400">GA</div>
                                <div className={`text-3xl font-bold ${d.ga !== null ? (d.ga >= d.notaMinima ? 'text-green-400' : 'text-red-400') : 'text-slate-600'}`}>
                                  {d.ga !== null ? d.ga.toFixed(1) : '-'}
                                </div>
                              </div>
                              <div className={`text-center p-4 rounded-xl min-w-[100px] ${d.gb !== null ? (d.gb >= d.notaMinima ? 'bg-green-500/20' : 'bg-red-500/20') : 'bg-slate-700/50'}`}>
                                <div className="text-sm text-slate-400">GB</div>
                                <div className={`text-3xl font-bold ${d.gb !== null ? (d.gb >= d.notaMinima ? 'text-green-400' : 'text-red-400') : 'text-slate-600'}`}>
                                  {d.gb !== null ? d.gb.toFixed(1) : '-'}
                                </div>
                              </div>
                              {media !== null && (
                                <div className={`text-center p-4 rounded-xl min-w-[100px] border-2 ${media >= d.notaMinima ? 'bg-green-500/30 border-green-500' : 'bg-amber-500/30 border-amber-500'}`}>
                                  <div className="text-sm text-slate-300">Média</div>
                                  <div className={`text-3xl font-bold ${media >= d.notaMinima ? 'text-green-400' : 'text-amber-400'}`}>
                                    {media.toFixed(1)}
                                  </div>
                                </div>
                              )}
                            </div>
                            {(
                              <button onClick={() => abrirEdicaoNotas(d)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2">
                                <Edit2 size={18} />
                                Lançar Notas
                              </button>
                            )}
                          </div>

                          {notaNecessariaGB !== null && (
                            <div className={`p-4 rounded-lg ${notaNecessariaGB <= 10 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                              <div className={notaNecessariaGB <= 10 ? 'text-blue-400' : 'text-red-400'}>
                                {notaNecessariaGB <= 10 
                                  ? `📊 Precisa de ${notaNecessariaGB.toFixed(1)} no GB para aprovar`
                                  : `⚠️ Não é possível aprovar só com GB.`
                                }
                              </div>
                            </div>
                          )}

                          {d.ga !== null && d.gb !== null && (
                            <div className="mt-4 flex justify-end">
                              <button onClick={() => finalizarDisciplina(d.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2">
                                <CheckCircle size={18} />
                                Finalizar
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="text-sm text-slate-400 block mb-2">GA</label>
                              <input type="number" step="0.1" min="0" max="10" value={notasTemp.ga} onChange={e => setNotasTemp({...notasTemp, ga: e.target.value})} className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-xl" />
                            </div>
                            <div>
                              <label className="text-sm text-slate-400 block mb-2">GB</label>
                              <input type="number" step="0.1" min="0" max="10" value={notasTemp.gb} onChange={e => setNotasTemp({...notasTemp, gb: e.target.value})} className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-xl" />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setEditingNotas(null)} className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg">Cancelar</button>
                            <button onClick={() => salvarNotas(d.id)} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2">
                              <Save size={18} />
                              Salvar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Progresso do Curso</h3>
              <div className="flex flex-wrap items-center gap-8">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" data={dadosProgressoRadial} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={10} fill="#6366f1" background={{ fill: '#374151' }} angleAxisId={0} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-indigo-400">{estatisticas.progressoCurso.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400">de 100%</div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400 text-sm">Total</div>
                    <div className="text-2xl font-bold">{estatisticas.total}</div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="text-green-400 text-sm">Aprovadas</div>
                    <div className="text-2xl font-bold text-green-400">{estatisticas.aprovadas}</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="text-blue-400 text-sm">Em Curso</div>
                    <div className="text-2xl font-bold text-blue-400">{estatisticas.emCurso}</div>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400 text-sm">Restantes</div>
                    <div className="text-2xl font-bold">{estatisticas.naoIniciadas}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Média Geral</div>
                <div className="text-3xl font-bold text-indigo-400">{estatisticas.mediaGeral.toFixed(2)}</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Créditos</div>
                <div className="text-3xl font-bold text-purple-400">
                  {estatisticas.creditosAprovados}<span className="text-lg text-slate-500">/{estatisticas.totalCreditos}</span>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Carga Horária</div>
                <div className="text-3xl font-bold text-amber-400">{estatisticas.cargaHorariaConcluida}<span className="text-lg text-slate-500">h</span></div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Aprovação</div>
                <div className="text-3xl font-bold text-green-400">
                  {estatisticas.aprovadas + estatisticas.reprovadas > 0 ? ((estatisticas.aprovadas / (estatisticas.aprovadas + estatisticas.reprovadas)) * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Por Semestre</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="periodo" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="aprovadas" fill="#10b981" name="Aprovadas" stackId="a" />
                  <Bar dataKey="emCurso" fill="#3b82f6" name="Em Curso" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Formatura - Simulador */}
        {activeTab === 'formatura' && (() => {
          // Cálculos do simulador
          const disciplinasAprovadas = disciplinas.filter(d => d.status === 'APROVADA').length;
          const disciplinasEmCurso = disciplinas.filter(d => d.status === 'EM_CURSO').length;
          const disciplinasRestantes = disciplinas.filter(d => d.status === 'NAO_INICIADA').length;
          const totalDisciplinas = disciplinas.length;
          const disciplinasParaConcluir = disciplinasRestantes + disciplinasEmCurso;
          
          // Gerar próximo período
          const gerarProximoPeriodo = (ano, sem) => {
            sem++;
            if (sem > 2) { sem = 1; ano++; }
            return { ano, sem };
          };
          
          // Gerar período string
          const periodoString = (ano, sem) => `${ano}/${sem}`;
          
          // Inicializar planejamento se vazio
          const inicializarPlanejamento = () => {
            if (planejamentoSemestres.length > 0) return;
            
            const novoPlano = [];
            let ano = semestreAtualAno;
            let sem = semestreAtualNum;
            let restantes = disciplinasParaConcluir;
            
            // Se tem em curso, primeiro semestre é com elas
            if (disciplinasEmCurso > 0) {
              novoPlano.push({ periodo: periodoString(ano, sem), quantidade: disciplinasEmCurso, tipo: 'atual' });
              restantes -= disciplinasEmCurso;
              const prox = gerarProximoPeriodo(ano, sem);
              ano = prox.ano;
              sem = prox.sem;
            }
            
            // Preencher futuros com 6 por semestre
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
          
          // Inicializar na primeira renderização
          if (planejamentoSemestres.length === 0 && disciplinasParaConcluir > 0) {
            inicializarPlanejamento();
          }
          
          // Calcular totais do planejamento
          const totalPlanejado = planejamentoSemestres.reduce((acc, s) => acc + s.quantidade, 0);
          const disciplinasFaltando = disciplinasParaConcluir - totalPlanejado;
          
          // Atualizar quantidade de um semestre
          const atualizarQuantidade = (index, novaQtd) => {
            const novoPlano = [...planejamentoSemestres];
            novoPlano[index].quantidade = Math.max(0, Math.min(10, novaQtd));
            setPlanejamentoSemestres(novoPlano);
          };
          
          // Atualizar período de um semestre
          const atualizarPeriodo = (index, novoPeriodo) => {
            const novoPlano = [...planejamentoSemestres];
            novoPlano[index].periodo = novoPeriodo;
            setPlanejamentoSemestres(novoPlano);
          };
          
          // Adicionar semestre
          const adicionarSemestre = () => {
            if (planejamentoSemestres.length === 0) {
              setPlanejamentoSemestres([{ periodo: periodoString(semestreAtualAno, semestreAtualNum), quantidade: 6, tipo: 'futuro' }]);
              return;
            }
            
            const ultimo = planejamentoSemestres[planejamentoSemestres.length - 1];
            const [ano, sem] = ultimo.periodo.split('/').map(Number);
            const prox = gerarProximoPeriodo(ano, sem);
            
            setPlanejamentoSemestres([...planejamentoSemestres, { 
              periodo: periodoString(prox.ano, prox.sem), 
              quantidade: Math.min(6, Math.max(0, disciplinasFaltando)), 
              tipo: 'futuro' 
            }]);
          };
          
          // Remover semestre
          const removerSemestre = (index) => {
            if (planejamentoSemestres.length <= 1) return;
            const novoPlano = planejamentoSemestres.filter((_, i) => i !== index);
            setPlanejamentoSemestres(novoPlano);
          };
          
          // Resetar planejamento
          const resetarPlanejamento = () => {
            setPlanejamentoSemestres([]);
            setTimeout(inicializarPlanejamento, 100);
          };
          
          // Filtrar apenas semestres com disciplinas (quantidade > 0)
          const semestresComDisciplinas = planejamentoSemestres.filter(s => s.quantidade > 0);
          
          // Previsão de formatura (último semestre COM disciplinas)
          const previsaoFormatura = semestresComDisciplinas.length > 0 
            ? semestresComDisciplinas[semestresComDisciplinas.length - 1].periodo 
            : '-';
          
          // Calcular anos até formar baseado nos períodos COM disciplinas
          const calcularAnosAteFormar = () => {
            if (semestresComDisciplinas.length === 0) return '0';
            
            const primeiro = semestresComDisciplinas[0].periodo;
            const ultimo = semestresComDisciplinas[semestresComDisciplinas.length - 1].periodo;
            
            const [anoInicio, semInicio] = primeiro.split('/').map(Number);
            const [anoFim, semFim] = ultimo.split('/').map(Number);
            
            // Calcular diferença em semestres
            const semestresInicio = anoInicio * 2 + semInicio;
            const semestresFim = anoFim * 2 + semFim;
            const diferenca = semestresFim - semestresInicio + 1;
            
            const anos = diferenca / 2;
            return anos % 1 === 0 ? anos.toString() : anos.toFixed(1);
          };
          
          const progressoTotal = totalDisciplinas > 0 ? ((disciplinasAprovadas / totalDisciplinas) * 100) : 0;
          
          // Calcular acumulado para tabela
          const calcularAcumulado = (index) => {
            let acum = disciplinasAprovadas;
            for (let i = 0; i <= index; i++) {
              acum += planejamentoSemestres[i].quantidade;
            }
            return acum;
          };
          
          return (
            <div className="space-y-6">
              {/* Card Principal - Previsão */}
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur rounded-xl p-6 border border-indigo-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="text-indigo-400" size={28} />
                  <h3 className="text-xl font-bold">Previsão de Formatura</h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                    <div className="text-4xl font-bold text-indigo-400 mb-1">
                      {previsaoFormatura}
                    </div>
                    <div className="text-slate-400 text-sm">Conclusão Prevista</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                    <div className="text-4xl font-bold text-amber-400 mb-1">
                      {calcularAnosAteFormar()}
                    </div>
                    <div className="text-slate-400 text-sm">Anos até Formar</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                    <div className="text-4xl font-bold text-green-400 mb-1">
                      {progressoTotal.toFixed(0)}%
                    </div>
                    <div className="text-slate-400 text-sm">Progresso do Curso</div>
                  </div>
                </div>
              </div>
              
              {/* Planejamento de Semestres */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Lista Editável */}
                <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Edit2 size={20} className="text-slate-400" />
                      Planejamento por Semestre
                    </h3>
                    <button
                      onClick={resetarPlanejamento}
                      className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1"
                    >
                      <RefreshCw size={14} />
                      Resetar
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {planejamentoSemestres.map((sem, index) => {
                      const isAtual = index === 0;
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            isAtual 
                              ? 'bg-blue-500/20 border border-blue-500/30' 
                              : 'bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={sem.periodo}
                              onChange={e => atualizarPeriodo(index, e.target.value)}
                              className={`w-20 px-2 py-1 bg-slate-600 rounded-lg text-center text-sm font-medium border border-slate-500 focus:border-indigo-500 focus:outline-none ${isAtual ? 'text-blue-400' : 'text-slate-300'}`}
                              placeholder="2025/1"
                            />
                            {isAtual && <span className="text-xs text-blue-400">(atual)</span>}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => atualizarQuantidade(index, sem.quantidade - 1)}
                              className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 flex items-center justify-center text-lg font-bold"
                              disabled={sem.quantidade <= 0}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={sem.quantidade}
                              onChange={e => atualizarQuantidade(index, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 bg-slate-600 rounded-lg text-center font-bold text-lg border border-slate-500 focus:border-indigo-500 focus:outline-none"
                              min="0"
                              max="10"
                            />
                            <button
                              onClick={() => atualizarQuantidade(index, sem.quantidade + 1)}
                              className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 flex items-center justify-center text-lg font-bold"
                              disabled={sem.quantidade >= 10}
                            >
                              +
                            </button>
                          </div>
                          
                          {planejamentoSemestres.length > 1 && (
                            <button
                              onClick={() => removerSemestre(index)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={adicionarSemestre}
                    className="mt-4 w-full py-2 border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-lg text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Adicionar Semestre
                  </button>
                </div>
                
                {/* Tabela com Total */}
                <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-slate-400" />
                    Resumo do Planejamento
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">Semestre</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">Qtd</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">Acumulado</th>
                          <th className="text-right py-2 px-3 text-slate-400 font-medium">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Linha de aprovadas */}
                        <tr className="border-b border-slate-700/50">
                          <td className="py-2 px-3 text-green-400">✓ Aprovadas</td>
                          <td className="text-center py-2 px-3 font-bold text-green-400">{disciplinasAprovadas}</td>
                          <td className="text-center py-2 px-3 text-slate-300">{disciplinasAprovadas}</td>
                          <td className="text-right py-2 px-3 text-slate-400">{((disciplinasAprovadas / totalDisciplinas) * 100).toFixed(0)}%</td>
                        </tr>
                        
                        {/* Semestres planejados */}
                        {planejamentoSemestres.map((sem, index) => {
                          const acumulado = calcularAcumulado(index);
                          const percentual = (acumulado / totalDisciplinas) * 100;
                          const isAtual = index === 0;
                          return (
                            <tr key={index} className={`border-b border-slate-700/50 ${isAtual ? 'bg-blue-500/10' : ''}`}>
                              <td className={`py-2 px-3 ${isAtual ? 'text-blue-400' : 'text-slate-300'}`}>
                                {sem.periodo} {isAtual && '(atual)'}
                              </td>
                              <td className="text-center py-2 px-3 font-bold">{sem.quantidade}</td>
                              <td className="text-center py-2 px-3 text-slate-300">{acumulado}</td>
                              <td className="text-right py-2 px-3 text-slate-400">{percentual.toFixed(0)}%</td>
                            </tr>
                          );
                        })}
                        
                        {/* Linha de total */}
                        <tr className="bg-slate-700/30 font-bold">
                          <td className="py-3 px-3 text-indigo-400">Total Planejado</td>
                          <td className="text-center py-3 px-3 text-indigo-400">{totalPlanejado}</td>
                          <td className="text-center py-3 px-3">{disciplinasAprovadas + totalPlanejado}</td>
                          <td className="text-right py-3 px-3 text-indigo-400">
                            {(((disciplinasAprovadas + totalPlanejado) / totalDisciplinas) * 100).toFixed(0)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Alerta se faltam disciplinas */}
                  {disciplinasFaltando > 0 && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
                      <AlertCircle className="text-amber-400" size={18} />
                      <span className="text-sm text-amber-200">
                        Faltam <strong>{disciplinasFaltando}</strong> disciplinas no planejamento
                      </span>
                    </div>
                  )}
                  
                  {disciplinasFaltando < 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                      <AlertCircle className="text-red-400" size={18} />
                      <span className="text-sm text-red-200">
                        Planejamento excede em <strong>{Math.abs(disciplinasFaltando)}</strong> disciplinas
                      </span>
                    </div>
                  )}
                  
                  {disciplinasFaltando === 0 && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={18} />
                      <span className="text-sm text-green-200">
                        Planejamento completo! 🎓
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dica */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-indigo-400 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-indigo-200/80">
                  <strong>Dica:</strong> Ajuste a quantidade de disciplinas em cada semestre para simular diferentes cenários. 
                  Considere estágio, TCC ou semestres mais leves quando necessário.
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modais */}
        {showAddDisciplina && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
              <h3 className="text-xl font-semibold mb-4">Nova Disciplina</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Nome da disciplina" value={novaDisciplina.nome} onChange={e => setNovaDisciplina({...novaDisciplina, nome: e.target.value})} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Semestre</label>
                    <input type="number" value={novaDisciplina.periodo} onChange={e => setNovaDisciplina({...novaDisciplina, periodo: parseInt(e.target.value) || 1})} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Créditos</label>
                    <input type="number" value={novaDisciplina.creditos} onChange={e => setNovaDisciplina({...novaDisciplina, creditos: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowAddDisciplina(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
                  <button onClick={handleAdicionarDisciplina} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg">Adicionar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddMultiplas && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
              <h3 className="text-xl font-semibold mb-4">Adicionar Várias</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Semestre</label>
                  <input type="number" value={periodoMultiplas} onChange={e => setPeriodoMultiplas(parseInt(e.target.value) || 1)} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Disciplinas (uma por linha)</label>
                  <textarea rows={6} placeholder="Cálculo I&#10;Física I&#10;Programação I" value={disciplinasMultiplas} onChange={e => setDisciplinasMultiplas(e.target.value)} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowAddMultiplas(false); setDisciplinasMultiplas(''); }} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
                  <button onClick={handleAdicionarMultiplas} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">Adicionar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showIniciarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm border border-slate-700">
              <h3 className="text-xl font-semibold mb-4">Iniciar Disciplina</h3>
              <p className="text-slate-400 mb-4">{disciplinas.find(d => d.id === showIniciarModal)?.nome}</p>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Semestre</label>
                <input type="text" placeholder="2024.2" value={semestreIniciar} onChange={e => setSemestreIniciar(e.target.value)} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowIniciarModal(null)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
                <button onClick={() => iniciarDisciplina(showIniciarModal)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Iniciar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Notas Global */}
        {editingNotas && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingNotas(null)}>
            <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-5 min-w-[320px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Editar Notas</h3>
                <button onClick={() => setEditingNotas(null)} className="p-1 text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="text-sm text-slate-400 mb-4">{disciplinas.find(d => d.id === editingNotas)?.nome}</div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Grau A</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="10" 
                    value={notasTemp.ga} 
                    onChange={e => setNotasTemp({...notasTemp, ga: e.target.value})} 
                    placeholder="0.0" 
                    className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-lg" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Grau B</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="10" 
                    value={notasTemp.gb} 
                    onChange={e => setNotasTemp({...notasTemp, gb: e.target.value})} 
                    placeholder="0.0" 
                    className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-lg" 
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1">Semestre Cursado (opcional)</label>
                <input 
                  type="text" 
                  value={notasTemp.semestreCursado} 
                  onChange={e => setNotasTemp({...notasTemp, semestreCursado: e.target.value})} 
                  placeholder="Ex: 2025/1" 
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1">Observação (opcional)</label>
                <textarea 
                  value={notasTemp.observacao} 
                  onChange={e => setNotasTemp({...notasTemp, observacao: e.target.value})} 
                  placeholder="Ex: Professor João, sala 302, provas difíceis..." 
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none resize-none" 
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingNotas(null)} 
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => salvarNotas(editingNotas)} 
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Exclusão Global */}
        {showDeleteMenu && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowDeleteMenu(null)}>
            <div 
              className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl min-w-[280px] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-700/50">
                <div className="text-sm font-medium text-white truncate">{disciplinas.find(d => d.id === showDeleteMenu)?.nome}</div>
              </div>
              {disciplinas.find(d => d.id === showDeleteMenu)?.status !== 'NAO_INICIADA' && (
                <button
                  onClick={() => handleResetarDisciplina(showDeleteMenu)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-yellow-400 hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw size={16} />
                  <div>
                    <div className="font-medium">Resetar andamento</div>
                    <div className="text-xs text-slate-400">Volta para "Não Iniciada"</div>
                  </div>
                </button>
              )}
              <button
                onClick={() => handleRemoverDisciplina(showDeleteMenu)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-slate-700 transition-colors ${disciplinas.find(d => d.id === showDeleteMenu)?.status !== 'NAO_INICIADA' ? 'border-t border-slate-700' : ''}`}
              >
                <Trash2 size={16} />
                <div>
                  <div className="font-medium">Excluir disciplina</div>
                  <div className="text-xs text-slate-400">Remove permanentemente</div>
                </div>
              </button>
              <button
                onClick={() => setShowDeleteMenu(null)}
                className="w-full px-4 py-2 text-sm text-slate-400 hover:bg-slate-700 border-t border-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
