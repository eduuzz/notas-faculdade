import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { Plus, Trash2, BookOpen, Award, TrendingUp, AlertCircle, CheckCircle, GraduationCap, Edit2, X, Clock, PlayCircle, ChevronDown, ChevronUp, Search, Save } from 'lucide-react';

const STATUS = {
  NAO_INICIADA: { label: 'Não Iniciada', color: 'slate', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  EM_CURSO: { label: 'Em Curso', color: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  APROVADA: { label: 'Aprovada', color: 'green', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  REPROVADA: { label: 'Reprovada', color: 'red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
};

const initialDisciplinas = [
  // 1º Período - Exemplo de disciplinas já cursadas
  { id: 1, nome: 'Cálculo I', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'APROVADA', ga: 7.5, gb: 8.0, notaFinal: null, semestreCursado: '2023.1' },
  { id: 2, nome: 'Programação I', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'APROVADA', ga: 9.0, gb: 8.5, notaFinal: null, semestreCursado: '2023.1' },
  { id: 3, nome: 'Introdução à Engenharia', periodo: 1, creditos: 2, cargaHoraria: 30, notaMinima: 6.0, status: 'APROVADA', ga: 8.0, gb: 9.5, notaFinal: null, semestreCursado: '2023.1' },
  { id: 4, nome: 'Física I', periodo: 1, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'APROVADA', ga: 6.5, gb: 7.0, notaFinal: null, semestreCursado: '2023.1' },
  
  // 2º Período - Exemplo de disciplinas em curso
  { id: 5, nome: 'Cálculo II', periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'EM_CURSO', ga: 7.0, gb: null, notaFinal: null, semestreCursado: '2024.2' },
  { id: 6, nome: 'Programação II', periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'EM_CURSO', ga: 8.5, gb: null, notaFinal: null, semestreCursado: '2024.2' },
  { id: 7, nome: 'Álgebra Linear', periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'EM_CURSO', ga: null, gb: null, notaFinal: null, semestreCursado: '2024.2' },
  { id: 8, nome: 'Física II', periodo: 2, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'EM_CURSO', ga: null, gb: null, notaFinal: null, semestreCursado: '2024.2' },
  
  // 3º Período - Não iniciadas
  { id: 9, nome: 'Cálculo III', periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null },
  { id: 10, nome: 'Estrutura de Dados', periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null },
  { id: 11, nome: 'Banco de Dados', periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null },
  { id: 12, nome: 'Estatística', periodo: 3, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null },
  
  // 4º Período - Não iniciadas
  { id: 13, nome: 'Engenharia de Software', periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null },
  { id: 14, nome: 'Redes de Computadores', periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null },
  { id: 15, nome: 'Sistemas Operacionais', periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null },
  { id: 16, nome: 'Inteligência Artificial', periodo: 4, creditos: 4, cargaHoraria: 60, notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null },
];

export default function SistemaNotas() {
  const [disciplinas, setDisciplinas] = useState(initialDisciplinas);
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

  // Calcula a média: (GA + GB) / 2, ou usa Nota Final se existir
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <GraduationCap size={40} className="text-indigo-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Sistema de Notas Acadêmicas
            </h1>
          </div>
          <p className="text-slate-400">Gerencie todas as disciplinas do seu curso</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-slate-800/50 p-1 rounded-lg w-fit mx-auto">
          {[
            { id: 'grade', label: 'Grade Curricular', icon: BookOpen },
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
                    placeholder="Buscar disciplina..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none w-64"
                  />
                </div>
                <select
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value)}
                  className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="NAO_INICIADA">Não Iniciadas</option>
                  <option value="EM_CURSO">Em Curso</option>
                  <option value="APROVADA">Aprovadas</option>
                  <option value="REPROVADA">Reprovadas</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddMultiplas(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Adicionar Várias
                </button>
                <button
                  onClick={() => setShowAddDisciplina(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Nova Disciplina
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
                      {disciplinasPorPeriodo[periodo]?.length || 0} disciplinas
                    </span>
                    <div className="flex gap-2">
                      {disciplinasPorPeriodo[periodo] && (
                        <>
                          {disciplinasPorPeriodo[periodo].filter(d => d.status === 'APROVADA').length > 0 && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              {disciplinasPorPeriodo[periodo].filter(d => d.status === 'APROVADA').length} aprovadas
                            </span>
                          )}
                          {disciplinasPorPeriodo[periodo].filter(d => d.status === 'EM_CURSO').length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              {disciplinasPorPeriodo[periodo].filter(d => d.status === 'EM_CURSO').length} em curso
                            </span>
                          )}
                        </>
                      )}
                    </div>
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
                                  <span>{d.creditos} créditos</span>
                                  <span>{d.cargaHoraria}h</span>
                                  <span>Mín: {d.notaMinima}</span>
                                  {d.semestreCursado && <span className="text-indigo-400">{d.semestreCursado}</span>}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {/* Notas GA, GB, NF */}
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

                                {/* Edição de notas inline */}
                                {isEditingNotas && (
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <label className="text-xs text-slate-400">GA</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={notasTemp.ga}
                                        onChange={e => setNotasTemp({...notasTemp, ga: e.target.value})}
                                        className="w-16 px-2 py-1 bg-slate-700 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-400">GB</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={notasTemp.gb}
                                        onChange={e => setNotasTemp({...notasTemp, gb: e.target.value})}
                                        className="w-16 px-2 py-1 bg-slate-700 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-400">NF</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={notasTemp.notaFinal}
                                        onChange={e => setNotasTemp({...notasTemp, notaFinal: e.target.value})}
                                        className="w-16 px-2 py-1 bg-slate-700 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none text-center"
                                      />
                                    </div>
                                    <button
                                      onClick={() => salvarNotas(d.id)}
                                      className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                    >
                                      <Save size={18} />
                                    </button>
                                    <button
                                      onClick={() => setEditingNotas(null)}
                                      className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
                                    >
                                      <X size={18} />
                                    </button>
                                  </div>
                                )}
                                
                                {/* Ações baseadas no status */}
                                {d.status === 'NAO_INICIADA' && (
                                  <button
                                    onClick={() => setShowIniciarModal(d.id)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                                  >
                                    Iniciar
                                  </button>
                                )}
                                
                                {d.status === 'EM_CURSO' && !isEditingNotas && (
                                  <>
                                    <button
                                      onClick={() => abrirEdicaoNotas(d)}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm transition-colors"
                                    >
                                      Lançar Notas
                                    </button>
                                    {(d.ga !== null && d.gb !== null) && (
                                      <button
                                        onClick={() => finalizarDisciplina(d.id)}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                                      >
                                        Finalizar
                                      </button>
                                    )}
                                  </>
                                )}

                                {(d.status === 'APROVADA' || d.status === 'REPROVADA') && !isEditingNotas && (
                                  <button
                                    onClick={() => abrirEdicaoNotas(d)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Editar notas"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                )}
                                
                                {!isEditingNotas && (
                                  <>
                                    <button
                                      onClick={() => setEditingDisciplina(isEditing ? null : d.id)}
                                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                      {isEditing ? <X size={18} /> : <Edit2 size={18} />}
                                    </button>
                                    <button
                                      onClick={() => removerDisciplina(d.id)}
                                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Edição expandida da disciplina */}
                            {isEditing && (
                              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Período</label>
                                    <input
                                      type="number"
                                      value={d.periodo}
                                      onChange={e => atualizarDisciplina(d.id, { periodo: parseInt(e.target.value) || 1 })}
                                      className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Créditos</label>
                                    <input
                                      type="number"
                                      value={d.creditos}
                                      onChange={e => atualizarDisciplina(d.id, { creditos: parseInt(e.target.value) || 0 })}
                                      className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Carga Horária</label>
                                    <input
                                      type="number"
                                      value={d.cargaHoraria}
                                      onChange={e => atualizarDisciplina(d.id, { cargaHoraria: parseInt(e.target.value) || 0 })}
                                      className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Nota Mínima</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={d.notaMinima}
                                      onChange={e => atualizarDisciplina(d.id, { notaMinima: parseFloat(e.target.value) || 0 })}
                                      className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <label className="text-xs text-slate-400 block mb-1">Status</label>
                                  <select
                                    value={d.status}
                                    onChange={e => atualizarDisciplina(d.id, { status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                                  >
                                    <option value="NAO_INICIADA">Não Iniciada</option>
                                    <option value="EM_CURSO">Em Curso</option>
                                    <option value="APROVADA">Aprovada</option>
                                    <option value="REPROVADA">Reprovada</option>
                                  </select>
                                </div>
                              </div>
                            )}
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
                <p className="text-slate-400">Nenhuma disciplina cadastrada ainda</p>
                <p className="text-sm text-slate-500 mt-2">Clique em "Nova Disciplina" ou "Adicionar Várias" para começar</p>
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
                <p className="text-slate-400">Nenhuma disciplina em curso no momento</p>
                <p className="text-sm text-slate-500 mt-2">Vá para a Grade Curricular e clique em "Iniciar" em uma disciplina</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {disciplinas.filter(d => d.status === 'EM_CURSO').map(d => {
                  const media = calcularMedia(d);
                  const isEditingNotas = editingNotas === d.id;
                  
                  // Calcular nota necessária no GB para aprovação
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
                          <div className="text-slate-400 text-sm flex flex-wrap gap-3 mt-1">
                            <span>{d.periodo}º Período</span>
                            <span>{d.creditos} créditos</span>
                            <span>{d.cargaHoraria}h</span>
                            <span className="text-indigo-400">{d.semestreCursado}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Notas */}
                      <div className="space-y-4">
                        {!isEditingNotas ? (
                          <>
                            <div className="flex flex-wrap gap-4 items-end">
                              <div className="flex gap-3">
                                <div className={`text-center p-4 rounded-xl min-w-[100px] ${d.ga !== null ? (d.ga >= d.notaMinima ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30') : 'bg-slate-700/50 border border-slate-600'}`}>
                                  <div className="text-sm text-slate-400 mb-1">Grau A</div>
                                  <div className={`text-3xl font-bold ${d.ga !== null ? (d.ga >= d.notaMinima ? 'text-green-400' : 'text-red-400') : 'text-slate-600'}`}>
                                    {d.ga !== null ? d.ga.toFixed(1) : '-'}
                                  </div>
                                </div>
                                <div className={`text-center p-4 rounded-xl min-w-[100px] ${d.gb !== null ? (d.gb >= d.notaMinima ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30') : 'bg-slate-700/50 border border-slate-600'}`}>
                                  <div className="text-sm text-slate-400 mb-1">Grau B</div>
                                  <div className={`text-3xl font-bold ${d.gb !== null ? (d.gb >= d.notaMinima ? 'text-green-400' : 'text-red-400') : 'text-slate-600'}`}>
                                    {d.gb !== null ? d.gb.toFixed(1) : '-'}
                                  </div>
                                </div>
                                {d.notaFinal !== null && (
                                  <div className={`text-center p-4 rounded-xl min-w-[100px] ${d.notaFinal >= d.notaMinima ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                                    <div className="text-sm text-slate-400 mb-1">Nota Final</div>
                                    <div className={`text-3xl font-bold ${d.notaFinal >= d.notaMinima ? 'text-green-400' : 'text-red-400'}`}>
                                      {d.notaFinal.toFixed(1)}
                                    </div>
                                  </div>
                                )}
                                {media !== null && (
                                  <div className={`text-center p-4 rounded-xl min-w-[100px] border-2 ${media >= d.notaMinima ? 'bg-green-500/30 border-green-500' : 'bg-amber-500/30 border-amber-500'}`}>
                                    <div className="text-sm text-slate-300 mb-1">Média</div>
                                    <div className={`text-3xl font-bold ${media >= d.notaMinima ? 'text-green-400' : 'text-amber-400'}`}>
                                      {media.toFixed(1)}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => abrirEdicaoNotas(d)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Edit2 size={18} />
                                Lançar Notas
                              </button>
                            </div>

                            {/* Simulação de nota necessária */}
                            {notaNecessariaGB !== null && (
                              <div className={`p-4 rounded-lg border ${notaNecessariaGB <= 10 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                {notaNecessariaGB <= 10 ? (
                                  <div className="text-blue-400">
                                    📊 Para ser aprovado com média {d.notaMinima}, você precisa de <strong>{notaNecessariaGB.toFixed(1)}</strong> no GB
                                  </div>
                                ) : (
                                  <div className="text-red-400">
                                    ⚠️ Não é possível atingir a média {d.notaMinima} apenas com o GB. Será necessário fazer a Nota Final.
                                  </div>
                                )}
                              </div>
                            )}

                            {d.ga !== null && d.gb !== null && media < d.notaMinima && d.notaFinal === null && (
                              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                                <div className="text-amber-400">
                                  ⚠️ Média abaixo de {d.notaMinima}. Você precisa de <strong>{((d.notaMinima * 2) - media).toFixed(1)}</strong> na Nota Final para aprovação.
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="text-sm text-slate-400 block mb-2">Grau A (GA)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  placeholder="0.0"
                                  value={notasTemp.ga}
                                  onChange={e => setNotasTemp({...notasTemp, ga: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-xl"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-slate-400 block mb-2">Grau B (GB)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  placeholder="0.0"
                                  value={notasTemp.gb}
                                  onChange={e => setNotasTemp({...notasTemp, gb: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-xl"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-slate-400 block mb-2">Nota Final (NF)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  placeholder="0.0"
                                  value={notasTemp.notaFinal}
                                  onChange={e => setNotasTemp({...notasTemp, notaFinal: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-center text-xl"
                                />
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEditingNotas(null)}
                                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => salvarNotas(d.id)}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Save size={18} />
                                Salvar Notas
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {d.ga !== null && d.gb !== null && !isEditingNotas && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => finalizarDisciplina(d.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <CheckCircle size={18} />
                            Finalizar Disciplina
                          </button>
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
            {/* Progresso do curso */}
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
                    <div className="text-xs text-slate-500">disciplinas</div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="text-green-400 text-sm">Aprovadas</div>
                    <div className="text-2xl font-bold text-green-400">{estatisticas.aprovadas}</div>
                    <div className="text-xs text-slate-500">disciplinas</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="text-blue-400 text-sm">Em Curso</div>
                    <div className="text-2xl font-bold text-blue-400">{estatisticas.emCurso}</div>
                    <div className="text-xs text-slate-500">disciplinas</div>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400 text-sm">Restantes</div>
                    <div className="text-2xl font-bold">{estatisticas.naoIniciadas}</div>
                    <div className="text-xs text-slate-500">disciplinas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards de estatísticas */}
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
                <div className="text-3xl font-bold text-amber-400">
                  {estatisticas.cargaHorariaConcluida}<span className="text-lg text-slate-500">h</span>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Taxa Aprovação</div>
                <div className="text-3xl font-bold text-green-400">
                  {estatisticas.aprovadas + estatisticas.reprovadas > 0
                    ? ((estatisticas.aprovadas / (estatisticas.aprovadas + estatisticas.reprovadas)) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>
            </div>

            {/* Gráfico de status */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={dadosPorStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {dadosPorStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Progresso por Período</h3>
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
              <h3 className="text-lg font-semibold mb-4">Médias por Disciplina (Cursadas)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={disciplinas.filter(d => calcularMedia(d) !== null).map(d => ({
                  nome: d.nome.length > 15 ? d.nome.substring(0, 15) + '...' : d.nome,
                  media: parseFloat(calcularMedia(d).toFixed(2)),
                  minima: d.notaMinima
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="nome" stroke="#9ca3af" fontSize={11} angle={-20} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" domain={[0, 10]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="media" fill="#6366f1" name="Média" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minima" fill="#ef4444" name="Nota Mínima" radius={[4, 4, 0, 0]} opacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Distribuição de Créditos</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Concluídos', value: estatisticas.creditosAprovados, color: '#10b981' },
                        { name: 'Em Curso', value: estatisticas.creditosEmCurso, color: '#3b82f6' },
                        { name: 'Pendentes', value: estatisticas.totalCreditos - estatisticas.creditosAprovados - estatisticas.creditosEmCurso, color: '#64748b' }
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {[
                        { name: 'Concluídos', value: estatisticas.creditosAprovados, color: '#10b981' },
                        { name: 'Em Curso', value: estatisticas.creditosEmCurso, color: '#3b82f6' },
                        { name: 'Pendentes', value: estatisticas.totalCreditos - estatisticas.creditosAprovados - estatisticas.creditosEmCurso, color: '#64748b' }
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Resumo Geral</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">IRA (Índice de Rendimento)</span>
                    <span className="font-bold text-indigo-400">{estatisticas.mediaGeral.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Disciplinas Cursadas</span>
                    <span className="font-bold">{estatisticas.aprovadas + estatisticas.reprovadas + estatisticas.emCurso}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Taxa de Sucesso</span>
                    <span className="font-bold text-green-400">
                      {estatisticas.aprovadas + estatisticas.reprovadas > 0
                        ? ((estatisticas.aprovadas / (estatisticas.aprovadas + estatisticas.reprovadas)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Carga Horária Total</span>
                    <span className="font-bold text-amber-400">{estatisticas.totalCargaHoraria}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Disciplina */}
        {showAddDisciplina && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Nova Disciplina</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome da disciplina"
                  value={novaDisciplina.nome}
                  onChange={e => setNovaDisciplina({...novaDisciplina, nome: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Período</label>
                    <input
                      type="number"
                      value={novaDisciplina.periodo}
                      onChange={e => setNovaDisciplina({...novaDisciplina, periodo: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Créditos</label>
                    <input
                      type="number"
                      value={novaDisciplina.creditos}
                      onChange={e => setNovaDisciplina({...novaDisciplina, creditos: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Carga Horária</label>
                    <input
                      type="number"
                      value={novaDisciplina.cargaHoraria}
                      onChange={e => setNovaDisciplina({...novaDisciplina, cargaHoraria: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Nota Mínima</label>
                    <input
                      type="number"
                      step="0.1"
                      value={novaDisciplina.notaMinima}
                      onChange={e => setNovaDisciplina({...novaDisciplina, notaMinima: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowAddDisciplina(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button onClick={adicionarDisciplina} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Várias Disciplinas */}
        {showAddMultiplas && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-2">Adicionar Várias Disciplinas</h3>
              <p className="text-slate-400 text-sm mb-4">Digite uma disciplina por linha. Todas serão adicionadas ao período selecionado.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Período</label>
                  <input
                    type="number"
                    value={periodoMultiplas}
                    onChange={e => setPeriodoMultiplas(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Disciplinas (uma por linha)</label>
                  <textarea
                    rows={8}
                    placeholder="Cálculo I&#10;Física I&#10;Programação I&#10;Introdução à Engenharia"
                    value={disciplinasMultiplas}
                    onChange={e => setDisciplinasMultiplas(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="text-sm text-slate-500">
                  {disciplinasMultiplas.split('\n').filter(l => l.trim()).length} disciplinas serão adicionadas
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setShowAddMultiplas(false); setDisciplinasMultiplas(''); }} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button onClick={adicionarMultiplasDisciplinas} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                    Adicionar Todas
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Iniciar Disciplina */}
        {showIniciarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm border border-slate-700">
              <h3 className="text-xl font-semibold mb-4">Iniciar Disciplina</h3>
              <p className="text-slate-400 mb-4">
                {disciplinas.find(d => d.id === showIniciarModal)?.nome}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Semestre</label>
                  <input
                    type="text"
                    placeholder="2024.2"
                    value={semestreIniciar}
                    onChange={e => setSemestreIniciar(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowIniciarModal(null)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => iniciarDisciplina(showIniciarModal)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    Iniciar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
