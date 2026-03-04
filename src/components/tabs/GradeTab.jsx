import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, Award, TrendingUp, CheckCircle, Clock, Edit2, ChevronDown, ChevronUp, Search, Download, Upload as UploadIcon, List, LayoutGrid } from 'lucide-react';
import { STATUS } from '../ui/STATUS';
import GlassCard from '../ui/GlassCard';
import GradientButton from '../ui/GradientButton';
import { staggerContainer, staggerItem } from '../../utils/animations';

export default function GradeTab({
  estatisticas,
  busca, setBusca,
  filtroStatus, setFiltroStatus,
  exportarPDF,
  setShowImportModal,
  setShowAddDisciplina,
  modoCompacto, setModoCompacto,
  expandedPeriodos, togglePeriodo, toggleAllPeriodos,
  periodos,
  addSemestre, removeSemestre,
  numSemestres, disciplinas,
  disciplinasPorPeriodo,
  abaSemestre, setAbaSemestre,
  setShowIniciarModal,
  setShowDeleteMenu,
  startEditNotas,
}) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Aprovadas', value: estatisticas.aprovadas, icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/30' },
          { label: 'Em Curso', value: estatisticas.emCurso, icon: Clock, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
          { label: 'Progresso', value: `${estatisticas.progresso.toFixed(0)}%`, icon: TrendingUp, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30' },
          { label: 'Média', value: estatisticas.mediaGeral.toFixed(1), icon: Award, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-3 sm:p-5" hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-semibold">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                <stat.icon size={20} className="text-white sm:hidden" />
                <stat.icon size={24} className="text-white hidden sm:block" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" placeholder="Buscar disciplina..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-violet-500/50 transition-all" />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-4 py-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none cursor-pointer">
          <option value="TODOS" className="bg-slate-800">Todos</option>
          <option value="APROVADA" className="bg-slate-800">Aprovadas</option>
          <option value="EM_CURSO" className="bg-slate-800">Em Curso</option>
          <option value="NAO_INICIADA" className="bg-slate-800">Pendentes</option>
          <option value="REPROVADA" className="bg-slate-800">Reprovadas</option>
        </select>
        <div className="flex gap-2 flex-wrap">
          <GradientButton variant="success" onClick={() => exportarPDF()}>
            <Download size={16} />
            <span className="text-xs sm:text-sm">PDF</span>
          </GradientButton>
          <GradientButton variant="amber" onClick={() => setShowImportModal(true)}><UploadIcon size={16} /><span className="text-xs sm:text-sm">Importar</span></GradientButton>
          <GradientButton onClick={() => setShowAddDisciplina(true)}>
            <Plus size={16} /><span className="text-xs sm:text-sm">Adicionar</span>
          </GradientButton>
        </div>
      </div>

      {/* Toggle buttons */}
      <div className="flex items-center justify-between">
        <button onClick={() => setModoCompacto(!modoCompacto)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
          {modoCompacto ? <LayoutGrid size={18} /> : <List size={18} />}
          <span className="text-sm">{modoCompacto ? 'Expandido' : 'Compacto'}</span>
        </button>
        <button onClick={toggleAllPeriodos} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
          {periodos.every(p => expandedPeriodos[p]) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          <span className="text-sm">{periodos.every(p => expandedPeriodos[p]) ? 'Minimizar' : 'Expandir'}</span>
        </button>
      </div>

      {/* Periodos */}
      <div className="space-y-4">
        {periodos.map(periodo => {
          const discs = disciplinasPorPeriodo[periodo];
          const obrigatorias = discs.filter(d => d.tipo !== 'optativa');
          const optativas = discs.filter(d => d.tipo === 'optativa');
          const aprovadas = obrigatorias.filter(d => d.status === 'APROVADA').length;
          const totalObrig = obrigatorias.length;
          const progresso = totalObrig > 0 ? (aprovadas / totalObrig) * 100 : 0;
          const total = discs.length;
          if (total === 0 && filtroStatus !== 'TODOS') return null;
          const abaAtiva = abaSemestre[periodo] || 'obrigatorias';
          const discsVisiveis = abaAtiva === 'optativas' ? optativas : obrigatorias;

          return (
            <div key={periodo} className="space-y-3">
              <GlassCard className="p-3 sm:p-4" onClick={() => togglePeriodo(periodo)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--accent-bg10), var(--accent-bg10))', border: '1px solid var(--accent-ring)' }}>
                      <span className="text-lg sm:text-xl font-bold" style={{ color: 'var(--accent-400)' }}>{periodo}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">{periodo}º Semestre</h3>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)]">{aprovadas} de {totalObrig} concluídas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="h-2.5 w-32 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all" style={{ width: `${progresso}%` }} />
                      </div>
                      <span className="text-sm text-[var(--text-secondary)] w-12">{progresso.toFixed(0)}%</span>
                    </div>
                    {expandedPeriodos[periodo] ? <ChevronUp size={20} className="text-[var(--text-muted)]" /> : <ChevronDown size={20} className="text-[var(--text-muted)]" />}
                  </div>
                </div>
              </GlassCard>

              {expandedPeriodos[periodo] && (
                <div className={`space-y-2 ${modoCompacto ? '' : 'sm:pl-4'}`}>
                  {optativas.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setAbaSemestre(prev => ({ ...prev, [periodo]: 'obrigatorias' })); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${abaAtiva === 'obrigatorias' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)]'}`}
                      >
                        Obrigatórias ({obrigatorias.length})
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAbaSemestre(prev => ({ ...prev, [periodo]: 'optativas' })); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${abaAtiva === 'optativas' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)]'}`}
                      >
                        Optativas ({optativas.length})
                      </button>
                    </div>
                  )}
                  {discsVisiveis.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-sm py-4 text-center">
                      {abaAtiva === 'optativas' ? 'Nenhuma optativa neste período' : 'Nenhuma disciplina neste período'}
                    </p>
                  ) : modoCompacto ? (
                    <GlassCard className="overflow-hidden" hover={false}>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[var(--border-input)]">
                            <th className="text-left p-2 sm:p-3 text-[var(--text-secondary)] font-medium text-xs sm:text-sm">Disciplina</th>
                            <th className="text-center p-2 sm:p-3 text-[var(--text-secondary)] font-medium text-xs sm:text-sm hidden sm:table-cell">Cr</th>
                            <th className="text-center p-2 sm:p-3 text-[var(--text-secondary)] font-medium text-xs sm:text-sm">Status</th>
                            <th className="text-center p-2 sm:p-3 text-[var(--text-secondary)] font-medium text-xs sm:text-sm">Nota</th>
                            <th className="text-center p-2 sm:p-3 text-[var(--text-secondary)] font-medium text-xs sm:text-sm w-20 sm:w-28">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {discsVisiveis.map(disc => {
                            const status = STATUS[disc.status];
                            return (
                              <tr key={disc.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                <td className="p-2 sm:p-3"><span className="font-medium text-xs sm:text-sm max-w-[150px] sm:max-w-none inline-block truncate sm:truncate-none align-middle">{disc.nome}</span>{disc.tipo === 'optativa' && <span className="ml-1 sm:ml-2 px-1 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">OPT</span>}</td>
                                <td className="p-2 sm:p-3 text-center text-[var(--text-secondary)] text-xs sm:text-sm hidden sm:table-cell">{disc.creditos}</td>
                                <td className="p-2 sm:p-3 text-center"><span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>{status.label}</span></td>
                                <td className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm">{disc.notaFinal ? disc.notaFinal.toFixed(1) : '-'}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {disc.status === 'NAO_INICIADA' ? (
                                      <button onClick={() => setShowIniciarModal(disc.id)} className="px-2 py-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">Iniciar</button>
                                    ) : (
                                      <button onClick={() => startEditNotas(disc)} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"><Edit2 size={14} /></button>
                                    )}
                                    <button onClick={() => setShowDeleteMenu(disc.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </GlassCard>
                  ) : (
                    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
                    {discsVisiveis.map(disc => {
                      const status = STATUS[disc.status];
                      return (
                        <motion.div key={disc.id} variants={staggerItem}>
                        <GlassCard className="group">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.bar}`} />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-5 pl-4 sm:pl-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-1.5 flex-wrap">
                                <h4 className="font-medium text-sm sm:text-base text-[var(--text-primary)] group-hover:text-violet-300 transition-colors">{disc.nome}</h4>
                                {disc.tipo === 'optativa' && <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">OPT</span>}
                                <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold ${status.bg} ${status.text} border ${status.border}`}>{status.label}</span>
                              </div>
                              <p className="text-xs sm:text-sm text-[var(--text-muted)]">{disc.creditos} créditos • {disc.cargaHoraria}h{disc.semestreCursado && ` • ${disc.semestreCursado}`}</p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0 self-end sm:self-auto">
                              {disc.status === 'NAO_INICIADA' ? (
                                <button onClick={() => setShowIniciarModal(disc.id)} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">Iniciar</button>
                              ) : (disc.ga !== null || disc.gb !== null || disc.notaFinal !== null) ? (
                                <div className="flex items-center gap-2 sm:gap-4">
                                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <div className="text-center">
                                      <p className="text-[var(--text-muted)] text-[10px] sm:text-xs mb-0.5">GA</p>
                                      <p className="font-medium text-[var(--text-secondary)]">{disc.ga !== null ? disc.ga.toFixed(1) : '-'}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[var(--text-muted)] text-[10px] sm:text-xs mb-0.5">GB</p>
                                      <p className="font-medium text-[var(--text-secondary)]">{disc.gb !== null ? disc.gb.toFixed(1) : '-'}</p>
                                    </div>
                                  </div>
                                  {disc.notaFinal !== null && (
                                    <div className="text-right">
                                      <p className="text-lg sm:text-2xl font-semibold">{disc.notaFinal.toFixed(1)}</p>
                                      <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">Final</p>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                              <div className="flex items-center gap-1">
                                {disc.status !== 'NAO_INICIADA' && (
                                  <button onClick={() => startEditNotas(disc)} className="p-1.5 sm:p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"><Edit2 size={14} /></button>
                                )}
                                <button onClick={() => setShowDeleteMenu(disc.id)} className="p-1.5 sm:p-2 rounded-xl hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                        </motion.div>
                      );
                    })}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Botões adicionar/remover semestre */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={removeSemestre}
            disabled={numSemestres <= 1 || disciplinas.some(d => d.periodo === numSemestres)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-input)] disabled:hover:text-[var(--text-secondary)] disabled:hover:border-[var(--border-input)]"
            title={disciplinas.some(d => d.periodo === numSemestres) ? 'Remova as cadeiras do último semestre primeiro' : 'Remover último semestre'}
          >
            <Minus size={16} />
            <span className="hidden sm:inline">Remover Semestre</span>
          </button>
          <span className="text-sm text-[var(--text-muted)]">{numSemestres} semestres</span>
          <button
            onClick={addSemestre}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/30"
            title="Adicionar semestre"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Adicionar Semestre</span>
          </button>
        </div>
      </div>
    </div>
  );
}
