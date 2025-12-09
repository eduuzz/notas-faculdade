import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { Plus, Trash2, BookOpen, Award, TrendingUp, AlertCircle, CheckCircle, GraduationCap, Edit2, X, Clock, PlayCircle, ChevronDown, ChevronUp, Search, Save, Cloud, CloudOff, RefreshCw, LogOut, User, Wifi, WifiOff } from 'lucide-react';
import { useNotas } from './useNotas';

const STATUS = {
  NAO_INICIADA: { label: 'Não Iniciada', color: 'slate', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  EM_CURSO: { label: 'Em Curso', color: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  APROVADA: { label: 'Aprovada', color: 'green', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  REPROVADA: { label: 'Reprovada', color: 'red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
};

export default function SistemaNotas() {
  const {
    disciplinas,
    setDisciplinas,
    user,
    login,
    logout,
    loading,
    syncing,
    lastSync,
    isOnline,
    isSupabaseConfigured,
    forceSync
  } = useNotas();

  const [activeTab, setActiveTab] = useState('grade');
  const [showAddDisciplina, setShowAddDisciplina] = useState(false);
  const [showAddMultiplas, setShowAddMultiplas] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState(null);
  const [expandedPeriodos, setExpandedPeriodos] = useState({1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true});
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const [novaDisciplina, setNovaDisciplina] = useState({
    nome: '', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null
  });
  const [disciplinasMultiplas, setDisciplinasMultiplas] = useState('');
  const [periodoMultiplas, setPeriodoMultiplas] = useState(1);
  const [showIniciarModal, setShowIniciarModal] = useState(null);
  const [semestreIniciar, setSemestreIniciar] = useState('2024.2');
  const [editingNotas, setEditingNotas] = useState(null);
  const [notasTemp, setNotasTemp] = useState({ ga: '', gb: '', notaFinal: '' });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailLogin, setEmailLogin] = useState('');

  const calcularMedia = (d) => {
    if (d.notaFinal !== null) return d.notaFinal;
    if (d.ga !== null && d.gb !== null) return (d.ga + d.gb) / 2;
    if (d.ga !== null) return d.ga;
    if (d.gb !== null) return d.gb;
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
      const matchBusca = d.nome.toLowerCase().includes(busca.toLowerCase());
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

  const adicionarDisciplina = () => {
    if (!novaDisciplina.nome) return;
    setDisciplinas([...disciplinas, { ...novaDisciplina, id: Date.now() }]);
    setNovaDisciplina({ nome: '', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null });
    setShowAddDisciplina(false);
  };

  const adicionarMultiplasDisciplinas = () => {
    if (!disciplinasMultiplas.trim()) return;
    const novas = disciplinasMultiplas.split('\n')
      .map(nome => nome.trim())
      .filter(nome => nome.length > 0)
      .map((nome, index) => ({
        id: Date.now() + index,
        nome,
        periodo: periodoMultiplas,
        creditos: 4,
        cargaHoraria: 60,
        notaMinima: 6.0,
        status: 'NAO_INICIADA',
        ga: null,
        gb: null,
        notaFinal: null,
        semestreCursado: null
      }));
    setDisciplinas([...disciplinas, ...novas]);
    setDisciplinasMultiplas('');
    setShowAddMultiplas(false);
  };

  const removerDisciplina = (id) => {
    if (confirm('Tem certeza que deseja remover esta disciplina?')) {
      setDisciplinas(disciplinas.filter(d => d.id !== id));
    }
  };

  const atualizarDisciplina = (id, updates) => {
    setDisciplinas(disciplinas.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const iniciarDisciplina = (id) => {
    atualizarDisciplina(id, { status: 'EM_CURSO', semestreCursado: semestreIniciar });
    setShowIniciarModal(null);
  };

  const finalizarDisciplina = (id) => {
    const disc = disciplinas.find(d => d.id === id);
    const media = calcularMedia(disc);
    const novoStatus = media >= disc.notaMinima ? 'APROVADA' : 'REPROVADA';
    atualizarDisciplina(id, { status: novoStatus });
  };

  const abrirEdicaoNotas = (d) => {
    setEditingNotas(d.id);
    setNotasTemp({
      ga: d.ga !== null ? d.ga.toString() : '',
      gb: d.gb !== null ? d.gb.toString() : '',
      notaFinal: d.notaFinal !== null ? d.notaFinal.toString() : ''
    });
  };

  const salvarNotas = (id) => {
    atualizarDisciplina(id, {
      ga: notasTemp.ga !== '' ? parseFloat(notasTemp.ga) : null,
      gb: notasTemp.gb !== '' ? parseFloat(notasTemp.gb) : null,
      notaFinal: notasTemp.notaFinal !== '' ? parseFloat(notasTemp.notaFinal) : null
    });
    setEditingNotas(null);
    setNotasTemp({ ga: '', gb: '', notaFinal: '' });
  };

  const togglePeriodo = (periodo) => {
    setExpandedPeriodos(prev => ({ ...prev, [periodo]: !prev[periodo] }));
  };

  const handleLogin = async () => {
    if (!emailLogin.trim()) return;
    await login(emailLogin.trim().toLowerCase());
    setShowLoginModal(false);
    setEmailLogin('');
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
      
      {user ? (
        <>
          {syncing ? (
            <RefreshCw size={16} className="text-blue-400 animate-spin" />
          ) : isSupabaseConfigured ? (
            <Cloud size={16} className="text-green-400" />
          ) : (
            <CloudOff size={16} className="text-slate-400" />
          )}
          <span className="text-slate-400 hidden sm:inline">{user.email}</span>
          <button
            onClick={forceSync}
            disabled={syncing || !isOnline}
            className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
            title="Sincronizar"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={logout}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-red-400"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </>
      ) : (
        <button
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs transition-colors"
        >
          <User size={14} />
          Sincronizar
        </button>
      )}
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
              <p className="text-slate-400 text-sm">Gerencie suas disciplinas</p>
            </div>
          </div>
          <SyncStatus />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-slate-800/50 p-1 rounded-lg w-fit">
          {[
            { id: 'grade', label: 'Grade', icon: BookOpen },
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'emcurso', label: 'Em Curso', icon: PlayCircle },
            { id: 'graficos', label: 'Gráficos', icon: Award }
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
              </div>
              <div className="flex gap-2">
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
              </div>
            </div>

            {/* Períodos */}
            {periodos.map(periodo => (
              <div key={periodo} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
                <button
                  onClick={() => togglePeriodo(periodo)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-indigo-400">{periodo}º Período</span>
                    <span className="text-sm text-slate-400">
                      {disciplinasPorPeriodo[periodo]?.length || 0} disc.
                    </span>
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
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {(d.status === 'EM_CURSO' || d.status === 'APROVADA' || d.status === 'REPROVADA') && !isEditingNotas && (
                                  <div className="flex gap-2">
                                    <NotaDisplay label="GA" valor={d.ga} minima={d.notaMinima} />
                                    <NotaDisplay label="GB" valor={d.gb} minima={d.notaMinima} />
                                    {d.notaFinal !== null && <NotaDisplay label="NF" valor={d.notaFinal} minima={d.notaMinima} />}
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

                                {isEditingNotas && (
                                  <div className="flex items-center gap-2">
                                    <input type="number" step="0.1" min="0" max="10" value={notasTemp.ga} onChange={e => setNotasTemp({...notasTemp, ga: e.target.value})} placeholder="GA" className="w-16 px-2 py-1 bg-slate-700 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none text-center" />
                                    <input type="number" step="0.1" min="0" max="10" value={notasTemp.gb} onChange={e => setNotasTemp({...notasTemp, gb: e.target.value})} placeholder="GB" className="w-16 px-2 py-1 bg-slate-700 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none text-center" />
                                    <input type="number" step="0.1" min="0" max="10" value={notasTemp.notaFinal} onChange={e => setNotasTemp({...notasTemp, notaFinal: e.target.value})} placeholder="NF" className="w-16 px-2 py-1 bg-slate-700 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none text-center" />
                                    <button onClick={() => salvarNotas(d.id)} className="p-2 bg-green-600 hover:bg-green-700 rounded-lg"><Save size={16} /></button>
                                    <button onClick={() => setEditingNotas(null)} className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg"><X size={16} /></button>
                                  </div>
                                )}
                                
                                {d.status === 'NAO_INICIADA' && (
                                  <button onClick={() => setShowIniciarModal(d.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">Iniciar</button>
                                )}
                                
                                {d.status === 'EM_CURSO' && !isEditingNotas && (
                                  <>
                                    <button onClick={() => abrirEdicaoNotas(d)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm">Notas</button>
                                    {(d.ga !== null && d.gb !== null) && (
                                      <button onClick={() => finalizarDisciplina(d.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm">Finalizar</button>
                                    )}
                                  </>
                                )}

                                {(d.status === 'APROVADA' || d.status === 'REPROVADA') && !isEditingNotas && (
                                  <button onClick={() => abrirEdicaoNotas(d)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><Edit2 size={16} /></button>
                                )}
                                
                                {!isEditingNotas && (
                                  <button onClick={() => removerDisciplina(d.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
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
            ))}

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
                    notaNecessariaGB = (d.notaMinima * 2) - d.ga;
                    if (notaNecessariaGB < 0) notaNecessariaGB = 0;
                    if (notaNecessariaGB > 10) notaNecessariaGB = 10;
                  }
                  
                  return (
                    <div key={d.id} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-blue-500/30">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{d.nome}</h3>
                          <div className="text-slate-400 text-sm">{d.periodo}º Período • {d.semestreCursado}</div>
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
                              {d.notaFinal !== null && (
                                <div className={`text-center p-4 rounded-xl min-w-[100px] ${d.notaFinal >= d.notaMinima ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                  <div className="text-sm text-slate-400">NF</div>
                                  <div className={`text-3xl font-bold ${d.notaFinal >= d.notaMinima ? 'text-green-400' : 'text-red-400'}`}>
                                    {d.notaFinal.toFixed(1)}
                                  </div>
                                </div>
                              )}
                              {media !== null && (
                                <div className={`text-center p-4 rounded-xl min-w-[100px] border-2 ${media >= d.notaMinima ? 'bg-green-500/30 border-green-500' : 'bg-amber-500/30 border-amber-500'}`}>
                                  <div className="text-sm text-slate-300">Média</div>
                                  <div className={`text-3xl font-bold ${media >= d.notaMinima ? 'text-green-400' : 'text-amber-400'}`}>
                                    {media.toFixed(1)}
                                  </div>
                                </div>
                              )}
                            </div>
                            <button onClick={() => abrirEdicaoNotas(d)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2">
                              <Edit2 size={18} />
                              Lançar Notas
                            </button>
                          </div>

                          {notaNecessariaGB !== null && (
                            <div className={`p-4 rounded-lg ${notaNecessariaGB <= 10 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                              <div className={notaNecessariaGB <= 10 ? 'text-blue-400' : 'text-red-400'}>
                                {notaNecessariaGB <= 10 
                                  ? `📊 Precisa de ${notaNecessariaGB.toFixed(1)} no GB para aprovar`
                                  : `⚠️ Não é possível aprovar só com GB. Vai precisar de NF.`
                                }
                              </div>
                            </div>
                          )}

                          {d.ga !== null && d.gb !== null && media < d.notaMinima && d.notaFinal === null && (
                            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                              <div className="text-amber-400">
                                ⚠️ Precisa de {((d.notaMinima * 2) - media).toFixed(1)} na NF para aprovar
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
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="text-sm text-slate-400 block mb-2">GA</label>
                              <input type="number" step="0.1" min="0" max="10" value={notasTemp.ga} onChange={e => setNotasTemp({...notasTemp, ga: e.target.value})} className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-xl" />
                            </div>
                            <div>
                              <label className="text-sm text-slate-400 block mb-2">GB</label>
                              <input type="number" step="0.1" min="0" max="10" value={notasTemp.gb} onChange={e => setNotasTemp({...notasTemp, gb: e.target.value})} className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-xl" />
                            </div>
                            <div>
                              <label className="text-sm text-slate-400 block mb-2">NF</label>
                              <input type="number" step="0.1" min="0" max="10" value={notasTemp.notaFinal} onChange={e => setNotasTemp({...notasTemp, notaFinal: e.target.value})} className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-xl" />
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
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={dadosProgressoRadial} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#6366f1" background={{ fill: '#374151' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-indigo-400">{estatisticas.progressoCurso.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400">Concluído</div>
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

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Por Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={dadosPorStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {dadosPorStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Por Período</h3>
                <ResponsiveContainer width="100%" height={220}>
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
          </div>
        )}

        {/* Gráficos */}
        {activeTab === 'graficos' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Médias por Disciplina</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={disciplinas.filter(d => calcularMedia(d) !== null).map(d => ({
                  nome: d.nome.length > 12 ? d.nome.substring(0, 12) + '...' : d.nome,
                  media: parseFloat(calcularMedia(d).toFixed(2)),
                  minima: d.notaMinima
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="nome" stroke="#9ca3af" fontSize={11} angle={-20} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" domain={[0, 10]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="media" fill="#6366f1" name="Média" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minima" fill="#ef4444" name="Mínima" radius={[4, 4, 0, 0]} opacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Créditos</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Concluídos', value: estatisticas.creditosAprovados, color: '#10b981' },
                        { name: 'Em Curso', value: estatisticas.creditosEmCurso, color: '#3b82f6' },
                        { name: 'Pendentes', value: estatisticas.totalCreditos - estatisticas.creditosAprovados - estatisticas.creditosEmCurso, color: '#64748b' }
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, value }) => `${value}`}
                    >
                      {[
                        { color: '#10b981' },
                        { color: '#3b82f6' },
                        { color: '#64748b' }
                      ].map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Resumo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">IRA</span>
                    <span className="font-bold text-indigo-400">{estatisticas.mediaGeral.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Cursadas</span>
                    <span className="font-bold">{estatisticas.aprovadas + estatisticas.reprovadas + estatisticas.emCurso}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Taxa Sucesso</span>
                    <span className="font-bold text-green-400">
                      {estatisticas.aprovadas + estatisticas.reprovadas > 0 ? ((estatisticas.aprovadas / (estatisticas.aprovadas + estatisticas.reprovadas)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Carga Total</span>
                    <span className="font-bold text-amber-400">{estatisticas.totalCargaHoraria}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modais */}
        {showAddDisciplina && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
              <h3 className="text-xl font-semibold mb-4">Nova Disciplina</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Nome da disciplina" value={novaDisciplina.nome} onChange={e => setNovaDisciplina({...novaDisciplina, nome: e.target.value})} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Período</label>
                    <input type="number" value={novaDisciplina.periodo} onChange={e => setNovaDisciplina({...novaDisciplina, periodo: parseInt(e.target.value) || 1})} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Créditos</label>
                    <input type="number" value={novaDisciplina.creditos} onChange={e => setNovaDisciplina({...novaDisciplina, creditos: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowAddDisciplina(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
                  <button onClick={adicionarDisciplina} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg">Adicionar</button>
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
                  <label className="text-sm text-slate-400 block mb-1">Período</label>
                  <input type="number" value={periodoMultiplas} onChange={e => setPeriodoMultiplas(parseInt(e.target.value) || 1)} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Disciplinas (uma por linha)</label>
                  <textarea rows={6} placeholder="Cálculo I&#10;Física I&#10;Programação I" value={disciplinasMultiplas} onChange={e => setDisciplinasMultiplas(e.target.value)} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowAddMultiplas(false); setDisciplinasMultiplas(''); }} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
                  <button onClick={adicionarMultiplasDisciplinas} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">Adicionar</button>
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

        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm border border-slate-700">
              <h3 className="text-xl font-semibold mb-2">Sincronizar Dados</h3>
              <p className="text-slate-400 text-sm mb-4">Digite seu email para sincronizar entre dispositivos</p>
              <input type="email" placeholder="seu@email.com" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none" />
              {!isSupabaseConfigured && (
                <p className="text-amber-400 text-xs mt-2">⚠️ Supabase não configurado. Dados salvos apenas localmente.</p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowLoginModal(false); setEmailLogin(''); }} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
                <button onClick={handleLogin} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg">Entrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
