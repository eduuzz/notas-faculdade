import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, Award, TrendingUp, CheckCircle, Clock, Edit2, ChevronDown, ChevronUp, Search, Download, Upload as UploadIcon, List, LayoutGrid, Share2 } from 'lucide-react';
import { STATUS } from '../ui/STATUS';
import GlassCard from '../ui/GlassCard';
import GradientButton from '../ui/GradientButton';
import AulasHoje from '../widgets/AulasHoje';
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
  setShowShareModal,
  recentlyUpdated = new Set(),
  horarios,
}) {
  return (
    <div className="space-y-6">
      {/* Aulas de hoje e amanhã */}
      <AulasHoje horarios={horarios} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'APROVADAS', value: estatisticas.aprovadas, sub: `de ${estatisticas.total}` },
          { label: 'EM CURSO', value: estatisticas.emCurso },
          { label: 'PROGRESSO', value: `${estatisticas.progresso}%` },
          { label: 'MÉDIA', value: estatisticas.mediaGeral.toFixed(1) },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)]">
            <p className="text-[var(--text-muted)] text-[11px] font-medium tracking-wider mb-2">{stat.label}</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">{stat.value}</p>
            {stat.sub && <p className="text-xs text-[var(--text-muted)] mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" placeholder="Buscar disciplina..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-500)] transition-colors" />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none cursor-pointer">
          <option value="TODOS">Todos</option>
          <option value="APROVADA">Aprovadas</option>
          <option value="EM_CURSO">Em Curso</option>
          <option value="NAO_INICIADA">Pendentes</option>
          <option value="REPROVADA">Reprovadas</option>
        </select>
        <div className="flex gap-2">
          <GradientButton variant="secondary" size="md" onClick={() => exportarPDF()}>
            <Download size={14} />
            <span>PDF</span>
          </GradientButton>
          <GradientButton variant="secondary" size="md" onClick={() => setShowShareModal(true)}>
            <Share2 size={14} />
            <span>Compartilhar</span>
          </GradientButton>
          <GradientButton variant="amber" size="md" onClick={() => setShowImportModal(true)}>
            <UploadIcon size={14} />
            <span>Importar</span>
          </GradientButton>
          <GradientButton size="md" onClick={() => setShowAddDisciplina(true)}>
            <Plus size={14} />
            <span>Adicionar</span>
          </GradientButton>
        </div>
      </div>

      {/* Toggle buttons */}
      <div className="flex items-center justify-between">
        <button onClick={() => setModoCompacto(!modoCompacto)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          {modoCompacto ? <LayoutGrid size={14} /> : <List size={14} />}
          {modoCompacto ? 'Expandido' : 'Compacto'}
        </button>
        <button onClick={toggleAllPeriodos} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          {periodos.every(p => expandedPeriodos[p]) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {periodos.every(p => expandedPeriodos[p]) ? 'Minimizar' : 'Expandir'}
        </button>
      </div>

      {/* Periodos */}
      <div className="space-y-3">
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
            <div key={periodo} className="space-y-2">
              {/* Semester header */}
              <button onClick={() => togglePeriodo(periodo)} className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] hover:bg-[var(--bg-card-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[var(--accent-400)] tabular-nums w-6">{periodo}</span>
                  <div>
                    <h3 className="font-medium text-sm text-[var(--text-primary)]">{periodo}º Semestre</h3>
                    <p className="text-xs text-[var(--text-muted)]">{aprovadas}/{totalObrig} concluídas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-[var(--border-input)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent-500)] transition-all" style={{ width: `${progresso}%` }} />
                    </div>
                    <span className="text-xs text-[var(--text-muted)] tabular-nums w-8">{progresso.toFixed(0)}%</span>
                  </div>
                  {expandedPeriodos[periodo] ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                </div>
              </button>

              {expandedPeriodos[periodo] && (
                <div className="space-y-1.5 pl-0 sm:pl-2">
                  {optativas.length > 0 && (
                    <div className="flex gap-1.5 mb-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setAbaSemestre(prev => ({ ...prev, [periodo]: 'obrigatorias' })); }}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${abaAtiva === 'obrigatorias' ? 'bg-[var(--accent-bg10)] text-[var(--accent-400)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                      >
                        Obrigatórias ({obrigatorias.length})
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAbaSemestre(prev => ({ ...prev, [periodo]: 'optativas' })); }}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${abaAtiva === 'optativas' ? 'bg-amber-500/10 text-amber-400' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                      >
                        Optativas ({optativas.length})
                      </button>
                    </div>
                  )}
                  {discsVisiveis.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-xs py-6 text-center">
                      {abaAtiva === 'optativas' ? 'Nenhuma optativa neste período' : 'Nenhuma disciplina neste período'}
                    </p>
                  ) : modoCompacto ? (
                    <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[var(--border-input)]">
                            <th className="text-left p-2.5 text-[var(--text-muted)] font-medium text-xs">Disciplina</th>
                            <th className="text-center p-2.5 text-[var(--text-muted)] font-medium text-xs hidden sm:table-cell">Cr</th>
                            <th className="text-center p-2.5 text-[var(--text-muted)] font-medium text-xs">Status</th>
                            <th className="text-center p-2.5 text-[var(--text-muted)] font-medium text-xs">Nota</th>
                            <th className="p-2.5 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {discsVisiveis.map(disc => {
                            const status = STATUS[disc.status];
                            const isUpdated = recentlyUpdated.has(disc.id);
                            return (
                              <tr key={disc.id} onClick={() => startEditNotas(disc)} className={`border-b border-[var(--border-card)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group ${isUpdated ? 'bg-blue-500/5' : ''}`}>
                                <td className="p-2.5">
                                  <span className="font-medium text-xs text-[var(--text-primary)] truncate block max-w-[180px] sm:max-w-none">
                                    {isUpdated && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 align-middle" />}
                                    {disc.nome}
                                  </span>
                                  {disc.tipo === 'optativa' && <span className="ml-1.5 text-[10px] text-amber-400">OPT</span>}
                                </td>
                                <td className="p-2.5 text-center text-[var(--text-muted)] text-xs hidden sm:table-cell tabular-nums">{disc.creditos}</td>
                                <td className="p-2.5 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.text}`}>{status.label}</span></td>
                                <td className="p-2.5 text-center font-medium text-xs tabular-nums">{disc.notaFinal ? disc.notaFinal.toFixed(1) : '–'}</td>
                                <td className="p-2.5 text-center">
                                  <button onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(disc.id); }} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-1.5">
                    {discsVisiveis.map(disc => {
                      const status = STATUS[disc.status];
                      const isUpdated = recentlyUpdated.has(disc.id);
                      return (
                        <motion.div key={disc.id} variants={staggerItem}>
                        <div
                          onClick={() => startEditNotas(disc)}
                          className={`group rounded-lg bg-[var(--bg-card)] border ${isUpdated ? 'border-blue-500/40 bg-blue-500/5' : 'border-[var(--border-card)]'} hover:bg-[var(--bg-card-hover)] transition-colors relative cursor-pointer`}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${status.bar}`} />
                          <div className="flex items-center justify-between p-3 pl-3.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                {isUpdated && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                                <h4 className="font-medium text-sm text-[var(--text-primary)]">{disc.nome}</h4>
                                {disc.tipo === 'optativa' && <span className="text-[10px] text-amber-400 font-medium">OPT</span>}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.text}`}>{status.label}</span>
                              </div>
                              <p className="text-xs text-[var(--text-muted)]">{disc.creditos} cr · {disc.cargaHoraria}h{disc.semestreCursado && ` · ${disc.semestreCursado}`}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {disc.status !== 'NAO_INICIADA' && (disc.ga !== null || disc.gb !== null || disc.notaFinal !== null) ? (
                                <div className="flex items-center gap-3">
                                  <div className="hidden sm:flex items-center gap-2 text-xs">
                                    <span className="text-[var(--text-muted)]">GA <span className="text-[var(--text-secondary)] font-medium tabular-nums">{disc.ga !== null ? disc.ga.toFixed(1) : '–'}</span></span>
                                    <span className="text-[var(--text-muted)]">GB <span className="text-[var(--text-secondary)] font-medium tabular-nums">{disc.gb !== null ? disc.gb.toFixed(1) : '–'}</span></span>
                                  </div>
                                  {disc.notaFinal !== null && (
                                    <span className="text-lg font-semibold tabular-nums">{disc.notaFinal.toFixed(1)}</span>
                                  )}
                                </div>
                              ) : null}
                              <button onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(disc.id); }} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </div>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[var(--text-muted)]"
          >
            <Minus size={14} />
            <span className="hidden sm:inline">Remover</span>
          </button>
          <span className="text-xs text-[var(--text-muted)] tabular-nums">{numSemestres} semestres</span>
          <button
            onClick={addSemestre}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
