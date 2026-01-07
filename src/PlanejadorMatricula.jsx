import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Plus, Trash2, X, Check, AlertCircle, BookOpen, GraduationCap, ChevronDown, ChevronUp, Save, Download, Info } from 'lucide-react';

// Configuração dos horários
const HORARIOS = [
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

// Cores para as disciplinas na grade
const CORES_DISCIPLINAS = [
  'bg-violet-500/30 border-violet-500/50 text-violet-200',
  'bg-blue-500/30 border-blue-500/50 text-blue-200',
  'bg-emerald-500/30 border-emerald-500/50 text-emerald-200',
  'bg-amber-500/30 border-amber-500/50 text-amber-200',
  'bg-pink-500/30 border-pink-500/50 text-pink-200',
  'bg-cyan-500/30 border-cyan-500/50 text-cyan-200',
  'bg-orange-500/30 border-orange-500/50 text-orange-200',
  'bg-indigo-500/30 border-indigo-500/50 text-indigo-200',
];

export default function PlanejadorMatricula({ disciplinas = [], onClose }) {
  // Estado para disciplinas selecionadas na grade
  const [grade, setGrade] = useState({}); // { 'seg-manha': { disciplinaId, nome, cor } }
  const [mostrarSabado, setMostrarSabado] = useState(true);
  const [secaoExpandida, setSecaoExpandida] = useState({ pendentes: true, sugestoes: true });
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [creditosLimite, setCreditosLimite] = useState({ min: 12, max: 24 });
  
  // Filtrar disciplinas pendentes (não iniciadas)
  const disciplinasPendentes = useMemo(() => {
    return disciplinas.filter(d => d.status === 'NAO_INICIADA');
  }, [disciplinas]);

  // Agrupar por período/semestre
  const disciplinasPorPeriodo = useMemo(() => {
    const grupos = {};
    disciplinasPendentes.forEach(d => {
      const periodo = d.periodo || 'Sem período';
      if (!grupos[periodo]) grupos[periodo] = [];
      grupos[periodo].push(d);
    });
    return grupos;
  }, [disciplinasPendentes]);

  // Calcular créditos selecionados
  const creditosSelecionados = useMemo(() => {
    const disciplinasNaGrade = new Set();
    Object.values(grade).forEach(item => {
      if (item?.disciplinaId) disciplinasNaGrade.add(item.disciplinaId);
    });
    
    let total = 0;
    disciplinasNaGrade.forEach(id => {
      const disc = disciplinas.find(d => d.id === id);
      if (disc) total += (disc.creditos || 4);
    });
    return total;
  }, [grade, disciplinas]);

  // Verificar conflitos
  const temConflito = useMemo(() => {
    return creditosSelecionados < creditosLimite.min || creditosSelecionados > creditosLimite.max;
  }, [creditosSelecionados, creditosLimite]);

  // Mapa de cores por disciplina
  const [coresDisciplinas, setCoresDisciplinas] = useState({});
  
  const getCorDisciplina = (disciplinaId) => {
    if (!coresDisciplinas[disciplinaId]) {
      const indice = Object.keys(coresDisciplinas).length % CORES_DISCIPLINAS.length;
      setCoresDisciplinas(prev => ({ ...prev, [disciplinaId]: CORES_DISCIPLINAS[indice] }));
      return CORES_DISCIPLINAS[indice];
    }
    return coresDisciplinas[disciplinaId];
  };

  // Adicionar disciplina na grade
  const adicionarNaGrade = (dia, horario, disciplina) => {
    const chave = `${dia}-${horario}`;
    const cor = getCorDisciplina(disciplina.id);
    
    setGrade(prev => ({
      ...prev,
      [chave]: {
        disciplinaId: disciplina.id,
        nome: disciplina.nome,
        creditos: disciplina.creditos || 4,
        cor
      }
    }));
    setDisciplinaSelecionada(null);
  };

  // Remover da grade
  const removerDaGrade = (dia, horario) => {
    const chave = `${dia}-${horario}`;
    setGrade(prev => {
      const novo = { ...prev };
      delete novo[chave];
      return novo;
    });
  };

  // Limpar grade
  const limparGrade = () => {
    setGrade({});
    setCoresDisciplinas({});
  };

  // Disciplinas únicas na grade
  const disciplinasNaGrade = useMemo(() => {
    const unicas = new Map();
    Object.values(grade).forEach(item => {
      if (item?.disciplinaId && !unicas.has(item.disciplinaId)) {
        unicas.set(item.disciplinaId, item);
      }
    });
    return Array.from(unicas.values());
  }, [grade]);

  // Dias a mostrar
  const diasMostrar = mostrarSabado ? DIAS_SEMANA : DIAS_SEMANA.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-auto">
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Planejador de Matrícula</h1>
                <p className="text-slate-400 text-sm">Monte sua grade do próximo semestre</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Mínimo</p>
              <p className="text-2xl font-bold text-white">{creditosLimite.min}</p>
              <p className="text-slate-500 text-xs">créditos</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Máximo</p>
              <p className="text-2xl font-bold text-white">{creditosLimite.max}</p>
              <p className="text-slate-500 text-xs">créditos</p>
            </div>
            <div className={`border rounded-2xl p-4 ${
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
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Disciplinas</p>
              <p className="text-2xl font-bold text-white">{disciplinasNaGrade.length}</p>
              <p className="text-slate-500 text-xs">na grade</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grade de Horários */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Header da Grade */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock size={20} className="text-violet-400" />
                    Quadro de Horários
                  </h2>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mostrarSabado}
                        onChange={(e) => setMostrarSabado(e.target.checked)}
                        className="w-4 h-4 rounded bg-white/10 border-white/20 text-violet-500 focus:ring-violet-500"
                      />
                      Exibir Sábado
                    </label>
                    <button
                      onClick={limparGrade}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-all"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-3 text-left text-slate-400 text-sm font-medium w-24">Horário</th>
                        {diasMostrar.map(dia => (
                          <th key={dia.id} className="p-3 text-center text-slate-300 text-sm font-medium">
                            {dia.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HORARIOS.map(horario => (
                        <tr key={horario.id} className="border-b border-white/5">
                          <td className="p-3 text-slate-400 text-sm whitespace-nowrap">
                            <div className="font-medium">{horario.inicio}</div>
                            <div className="text-slate-500">{horario.fim}</div>
                          </td>
                          {diasMostrar.map(dia => {
                            const chave = `${dia.id}-${horario.id}`;
                            const item = grade[chave];
                            
                            return (
                              <td key={dia.id} className="p-2">
                                {item ? (
                                  <div className={`relative p-2 rounded-lg border ${item.cor} min-h-[60px] group`}>
                                    <p className="text-xs font-medium line-clamp-2">{item.nome}</p>
                                    <button
                                      onClick={() => removerDaGrade(dia.id, horario.id)}
                                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDisciplinaSelecionada({ dia: dia.id, horario: horario.id })}
                                    className="w-full min-h-[60px] rounded-lg border-2 border-dashed border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all flex items-center justify-center"
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
              </div>

              {/* Disciplinas na Grade */}
              {disciplinasNaGrade.length > 0 && (
                <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Disciplinas Adicionadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {disciplinasNaGrade.map(item => (
                      <div key={item.disciplinaId} className={`px-3 py-1.5 rounded-lg border ${item.cor} text-sm`}>
                        {item.nome} ({item.creditos}cr)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Disciplinas */}
            <div className="space-y-4">
              {/* Disciplinas Pendentes */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setSecaoExpandida(prev => ({ ...prev, pendentes: !prev.pendentes }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
                >
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-400" />
                    Disciplinas para Matrícula
                  </h2>
                  {secaoExpandida.pendentes ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>

                {secaoExpandida.pendentes && (
                  <div className="border-t border-white/10 max-h-[400px] overflow-y-auto">
                    {Object.entries(disciplinasPorPeriodo).map(([periodo, discs]) => (
                      <div key={periodo}>
                        <div className="px-4 py-2 bg-white/5 text-sm text-slate-400 font-medium">
                          {periodo}º Semestre
                        </div>
                        {discs.map(disc => {
                          const jaNaGrade = Object.values(grade).some(g => g?.disciplinaId === disc.id);
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
                                  <Check size={14} /> Adicionada
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (disciplinaSelecionada) {
                                      adicionarNaGrade(disciplinaSelecionada.dia, disciplinaSelecionada.horario, disc);
                                    }
                                  }}
                                  disabled={!disciplinaSelecionada}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    disciplinaSelecionada
                                      ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                                      : 'bg-white/5 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  {disciplinaSelecionada ? 'Adicionar' : 'Selecione horário'}
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
                        <p className="text-slate-400">Nenhuma disciplina pendente</p>
                        <p className="text-slate-500 text-sm">Todas as disciplinas foram concluídas!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Configurações de Créditos */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Info size={16} />
                  Limites de Créditos
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Mínimo</label>
                    <input
                      type="number"
                      value={creditosLimite.min}
                      onChange={(e) => setCreditosLimite(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Máximo</label>
                    <input
                      type="number"
                      value={creditosLimite.max}
                      onChange={(e) => setCreditosLimite(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Alerta de seleção */}
              {disciplinaSelecionada && (
                <div className="bg-violet-500/20 border border-violet-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-violet-300">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">Horário selecionado</span>
                  </div>
                  <p className="text-violet-200/70 text-xs mt-1">
                    {DIAS_SEMANA.find(d => d.id === disciplinaSelecionada.dia)?.label} - {HORARIOS.find(h => h.id === disciplinaSelecionada.horario)?.label}
                  </p>
                  <p className="text-violet-200/70 text-xs mt-1">
                    Clique em uma disciplina para adicionar
                  </p>
                  <button
                    onClick={() => setDisciplinaSelecionada(null)}
                    className="mt-2 text-xs text-violet-400 hover:text-violet-300"
                  >
                    Cancelar seleção
                  </button>
                </div>
              )}

              {/* Status */}
              {creditosSelecionados > 0 && (
                <div className={`rounded-2xl p-4 border ${
                  creditosSelecionados >= creditosLimite.min && creditosSelecionados <= creditosLimite.max
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : creditosSelecionados > creditosLimite.max
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {creditosSelecionados >= creditosLimite.min && creditosSelecionados <= creditosLimite.max ? (
                      <>
                        <Check size={18} className="text-emerald-400" />
                        <span className="text-emerald-300 text-sm font-medium">Grade válida!</span>
                      </>
                    ) : creditosSelecionados > creditosLimite.max ? (
                      <>
                        <AlertCircle size={18} className="text-red-400" />
                        <span className="text-red-300 text-sm font-medium">Excedeu o limite de créditos</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={18} className="text-amber-400" />
                        <span className="text-amber-300 text-sm font-medium">Faltam créditos</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    {creditosSelecionados} de {creditosLimite.min}-{creditosLimite.max} créditos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
