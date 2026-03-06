import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Calculator, Monitor, MapPin, Calendar, Plus, Trash2 } from 'lucide-react';
import { STATUS } from '../ui/STATUS';
import GradientButton from '../ui/GradientButton';
import { modalOverlay, modalContent } from '../../utils/animations';

const DIAS_LABEL = { dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado' };
const DIAS_OPTIONS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export default function EditNotasModal({ disciplina, horarios, onSaveHorarios, notasTemp, setNotasTemp, onClose, onSave }) {
  const nome = disciplina?.nome;
  const status = disciplina ? STATUS[disciplina.status] : null;

  // Find horario for this discipline
  const horario = useMemo(() => {
    if (!horarios || !disciplina) return null;
    return horarios.find(h =>
      (h.codDisc && h.codDisc === disciplina.codigo) ||
      (h.nome && h.nome.toLowerCase().trim() === disciplina.nome?.toLowerCase().trim())
    ) || null;
  }, [horarios, disciplina]);

  // Deduplicate aulas by dia+inicio, derive modalidade and date range
  const { aulasUnicas, isOnline, dateRange } = useMemo(() => {
    if (!horario?.aulas?.length) return { aulasUnicas: [], isOnline: null, dateRange: null };

    const uniqueMap = {};
    let minDate = null;
    let maxDate = null;
    let allOnline = true;
    let anyOnline = false;

    for (const a of horario.aulas) {
      const key = `${a.dia}-${a.inicio}`;
      if (!uniqueMap[key]) uniqueMap[key] = a;

      if (a.sala || a.predio) allOnline = false;
      else anyOnline = true;

      // Track date range from all aula entries
      for (const d of [a.data, a.dataFim]) {
        if (!d) continue;
        if (!minDate || d < minDate) minDate = d;
        if (!maxDate || d > maxDate) maxDate = d;
      }
    }

    return {
      aulasUnicas: Object.values(uniqueMap).sort((a, b) => {
        const order = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
        return order.indexOf(a.dia) - order.indexOf(b.dia) || a.inicio.localeCompare(b.inicio);
      }),
      isOnline: allOnline ? 'online' : anyOnline ? 'hibrido' : 'presencial',
      dateRange: minDate && maxDate ? { inicio: minDate, fim: maxDate } : null,
    };
  }, [horario]);

  // Per-aula modalidade overrides (localStorage)
  const discKey = disciplina?.nome?.toLowerCase().trim();
  const STORAGE_KEY = 'aulaModalidadeOverrides';

  const [aulaOverrides, setAulaOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
  });

  const getAulaKey = (dia, inicio) => `${discKey}|${dia}|${inicio}`;

  const isAulaOnline = (aula) => {
    const key = getAulaKey(aula.dia, aula.inicio);
    if (aulaOverrides[key] !== undefined) return aulaOverrides[key];
    return !aula.sala && !aula.predio;
  };

  const toggleAulaModalidade = useCallback((dia, inicio) => {
    const key = getAulaKey(dia, inicio);
    setAulaOverrides(prev => {
      const next = { ...prev };
      const aula = aulasUnicas.find(a => a.dia === dia && a.inicio === inicio);
      const autoOnline = aula ? (!aula.sala && !aula.predio) : true;
      if (next[key] !== undefined) {
        // Has override → remove it (back to auto)
        delete next[key];
      } else {
        // No override → set to opposite of auto
        next[key] = !autoOnline;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [discKey, aulasUnicas]);

  // Derive discipline-level modalidade from per-aula states
  const modalidade = useMemo(() => {
    if (!aulasUnicas.length) return null;
    let allOnline = true;
    let allPresencial = true;
    for (const a of aulasUnicas) {
      if (isAulaOnline(a)) allPresencial = false;
      else allOnline = false;
    }
    if (allOnline) return 'online';
    if (allPresencial) return 'presencial';
    return 'hibrido';
  }, [aulasUnicas, aulaOverrides]);

  // Manual aula add/remove
  const [showAddAula, setShowAddAula] = useState(false);
  const [newAula, setNewAula] = useState({ dia: 'seg', inicio: '19:00', fim: '22:30', sala: '' });

  const addManualAula = useCallback(() => {
    if (!disciplina || !onSaveHorarios) return;
    const discName = disciplina.nome;
    const discCode = disciplina.codigo;

    const updated = [...(horarios || [])];
    let entry = updated.find(h =>
      (h.codDisc && h.codDisc === discCode) ||
      (h.nome && h.nome.toLowerCase().trim() === discName?.toLowerCase().trim())
    );

    const aula = { dia: newAula.dia, inicio: newAula.inicio, fim: newAula.fim, sala: newAula.sala || null, predio: null, manual: true };

    if (entry) {
      entry.aulas = [...entry.aulas, aula];
    } else {
      updated.push({ codDisc: discCode, nome: discName, codTurma: null, aulas: [aula] });
    }

    onSaveHorarios(updated);
    setShowAddAula(false);
    setNewAula({ dia: 'seg', inicio: '19:00', fim: '22:30', sala: '' });
  }, [disciplina, horarios, onSaveHorarios, newAula]);

  const removeAula = useCallback((dia, inicio) => {
    if (!disciplina || !onSaveHorarios) return;
    const discName = disciplina.nome;
    const discCode = disciplina.codigo;

    const updated = (horarios || []).map(h => {
      const match = (h.codDisc && h.codDisc === discCode) ||
        (h.nome && h.nome.toLowerCase().trim() === discName?.toLowerCase().trim());
      if (!match) return h;
      return { ...h, aulas: h.aulas.filter(a => !(a.dia === dia && a.inicio === inicio)) };
    }).filter(h => h.aulas.length > 0);

    onSaveHorarios(updated);
  }, [disciplina, horarios, onSaveHorarios]);

  const handleNota = (field, value) => {
    if (value === '') { setNotasTemp({ ...notasTemp, [field]: '' }); return; }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setNotasTemp({ ...notasTemp, [field]: Math.min(10, Math.max(0, num)).toString() });
  };

  const mediaCalculada = useMemo(() => {
    const ga = parseFloat(notasTemp.ga);
    const gb = parseFloat(notasTemp.gb);
    if (!isNaN(ga) && !isNaN(gb)) return ((ga + gb) / 2).toFixed(1);
    return null;
  }, [notasTemp.ga, notasTemp.gb]);

  const notaFinalDisplay = notasTemp.notaFinal !== '' ? parseFloat(notasTemp.notaFinal) : mediaCalculada ? parseFloat(mediaCalculada) : null;
  const aprovado = notaFinalDisplay !== null && notaFinalDisplay >= 6;

  const formatDate = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <motion.div
      className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
      {...modalOverlay}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg rounded-xl bg-[var(--bg-modal)] border border-[var(--border-card)] shadow-xl max-h-[90vh] flex flex-col"
        {...modalContent}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-[var(--border-input)]">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">{nome}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {status && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.text}`}>{status.label}</span>}
              {disciplina?.tipo === 'optativa' && <span className="text-[10px] text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-500/10">Optativa</span>}
              {modalidade && (
                <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  modalidade === 'online' ? 'text-cyan-400 bg-cyan-500/10' :
                  modalidade === 'hibrido' ? 'text-violet-400 bg-violet-500/10' :
                  'text-emerald-400 bg-emerald-500/10'
                }`}>
                  {modalidade === 'online' ? <><Monitor size={10} /> Online</> :
                   modalidade === 'hibrido' ? <><Monitor size={10} /> Híbrido</> :
                   <><MapPin size={10} /> Presencial</>}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-3">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Info blocks */}
          {disciplina && (
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-center">
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Semestre</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{disciplina.periodo}º</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-center">
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Créditos</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{disciplina.creditos}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-center">
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Carga H.</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{disciplina.cargaHoraria}h</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-center">
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Nota Mín.</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{disciplina.notaMinima ?? 6.0}</p>
              </div>
            </div>
          )}

          {/* Horário block — always visible */}
          <div className="rounded-lg border border-[var(--border-input)] overflow-hidden">
            <div className="px-3 py-2 bg-[var(--bg-input)] border-b border-[var(--border-input)] flex items-center justify-between">
              <p className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider">HORÁRIOS</p>
              <div className="flex items-center gap-2">
                {dateRange && (
                  <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Calendar size={12} />
                    {formatDate(dateRange.inicio)} — {formatDate(dateRange.fim)}
                  </span>
                )}
                <button
                  onClick={() => setShowAddAula(v => !v)}
                  className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded text-[var(--accent-400)] hover:bg-[var(--accent-bg10)] transition-colors"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1">
              {aulasUnicas.length > 0 ? aulasUnicas.map((a, i) => {
                const online = isAulaOnline(a);
                const hasOverride = aulaOverrides[getAulaKey(a.dia, a.inicio)] !== undefined;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm group">
                    <span className="text-[var(--text-primary)] font-medium w-16 shrink-0">{DIAS_LABEL[a.dia]}</span>
                    <span className="text-[var(--text-secondary)] tabular-nums">{a.inicio} – {a.fim}</span>
                    <button
                      onClick={() => toggleAulaModalidade(a.dia, a.inicio)}
                      title="Clique para alternar Online/Presencial"
                      className={`flex items-center gap-1 text-[11px] ml-auto px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        online
                          ? 'text-cyan-400 hover:bg-cyan-500/10'
                          : 'text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {online ? <><Monitor size={11} /> Online</> : <><MapPin size={11} /> {a.sala || 'Presencial'}</>}
                      {hasOverride && <span className="text-[9px] text-[var(--text-muted)] ml-0.5">(editado)</span>}
                    </button>
                    <button
                      onClick={() => removeAula(a.dia, a.inicio)}
                      className="text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                      title="Remover horário"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              }) : (
                <p className="text-xs text-[var(--text-muted)] py-1">Nenhum horário cadastrado. Clique em "Adicionar" para incluir.</p>
              )}

              {/* Add aula form */}
              {showAddAula && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border-input)]">
                  <select
                    value={newAula.dia}
                    onChange={e => setNewAula(p => ({ ...p, dia: e.target.value }))}
                    className="px-2 py-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-xs"
                  >
                    {DIAS_OPTIONS.map(d => <option key={d} value={d}>{DIAS_LABEL[d]}</option>)}
                  </select>
                  <input
                    type="time"
                    value={newAula.inicio}
                    onChange={e => setNewAula(p => ({ ...p, inicio: e.target.value }))}
                    className="px-2 py-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-xs tabular-nums w-20"
                  />
                  <input
                    type="time"
                    value={newAula.fim}
                    onChange={e => setNewAula(p => ({ ...p, fim: e.target.value }))}
                    className="px-2 py-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-xs tabular-nums w-20"
                  />
                  <input
                    type="text"
                    value={newAula.sala}
                    onChange={e => setNewAula(p => ({ ...p, sala: e.target.value }))}
                    placeholder="Sala"
                    className="px-2 py-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-xs w-16"
                  />
                  <button
                    onClick={addManualAula}
                    className="px-2 py-1.5 rounded-md bg-[var(--accent-500)] text-white text-xs font-medium hover:bg-[var(--accent-600)] transition-colors"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          <div className="rounded-lg border border-[var(--border-input)] overflow-hidden">
            <div className="px-3 py-2 bg-[var(--bg-input)] border-b border-[var(--border-input)]">
              <p className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider">NOTAS</p>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'ga', label: 'GA' },
                  { key: 'gb', label: 'GB' },
                  { key: 'notaFinal', label: 'Final', placeholder: 'Auto' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] text-[var(--text-muted)] block mb-1">{label}</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={notasTemp[key]}
                      onChange={(e) => handleNota(key, e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm tabular-nums focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors"
                      placeholder={placeholder || '0.0'}
                    />
                  </div>
                ))}
              </div>
              {notaFinalDisplay !== null && (
                <div className={`flex items-center justify-between mt-3 p-2.5 rounded-md border ${aprovado ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <span className="text-xs text-[var(--text-muted)]">
                    {notasTemp.notaFinal !== '' ? 'Nota final' : 'Média calculada'}
                  </span>
                  <span className={`text-base font-bold tabular-nums ${aprovado ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {notaFinalDisplay.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Semestre e Observação */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Semestre cursado</label>
              <input
                type="text"
                value={notasTemp.semestreCursado}
                onChange={(e) => setNotasTemp({ ...notasTemp, semestreCursado: e.target.value.slice(0, 6) })}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors"
                placeholder="2026/1"
                maxLength={6}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Observação</label>
              <input
                type="text"
                value={notasTemp.observacao}
                onChange={(e) => setNotasTemp({ ...notasTemp, observacao: e.target.value.slice(0, 200) })}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors"
                placeholder="Opcional"
                maxLength={200}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <GradientButton variant="secondary" className="flex-1" onClick={onClose}>Cancelar</GradientButton>
            <GradientButton className="flex-1" onClick={onSave}>Salvar</GradientButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
