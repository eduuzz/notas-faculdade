import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Calculator } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import { modalOverlay, modalContent } from '../../utils/animations';

export default function EditNotasModal({ nome, notasTemp, setNotasTemp, onClose, onSave }) {
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

  return (
    <motion.div
      className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
      {...modalOverlay}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-xl bg-[var(--bg-modal)] border border-[var(--border-card)] shadow-xl"
        {...modalContent}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-bg10)] flex items-center justify-center shrink-0">
              <BookOpen size={18} style={{ color: 'var(--accent-400)' }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">Editar Notas</h3>
              <p className="text-xs text-[var(--text-muted)] truncate">{nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Grade preview */}
          {notaFinalDisplay !== null && (
            <div className={`flex items-center justify-between p-3 rounded-lg border ${aprovado ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
              <div className="flex items-center gap-2">
                <Calculator size={14} className={aprovado ? 'text-emerald-400' : 'text-amber-400'} />
                <span className="text-xs text-[var(--text-muted)]">
                  {notasTemp.notaFinal !== '' ? 'Nota final' : 'Média calculada'}
                </span>
              </div>
              <span className={`text-lg font-bold tabular-nums ${aprovado ? 'text-emerald-400' : 'text-amber-400'}`}>
                {notaFinalDisplay.toFixed(1)}
              </span>
            </div>
          )}

          {/* GA / GB / Final */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'ga', label: 'GA' },
              { key: 'gb', label: 'GB' },
              { key: 'notaFinal', label: 'Final', placeholder: 'Auto' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider block mb-1.5">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={notasTemp[key]}
                  onChange={(e) => handleNota(key, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm tabular-nums focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors"
                  placeholder={placeholder || '0.0'}
                />
              </div>
            ))}
          </div>

          {/* Semestre */}
          <div>
            <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider block mb-1.5">Semestre</label>
            <input
              type="text"
              value={notasTemp.semestreCursado}
              onChange={(e) => setNotasTemp({ ...notasTemp, semestreCursado: e.target.value.slice(0, 6) })}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors"
              placeholder="2026/1"
              maxLength={6}
            />
          </div>

          {/* Observacao */}
          <div>
            <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider block mb-1.5">Observacao</label>
            <input
              type="text"
              value={notasTemp.observacao}
              onChange={(e) => setNotasTemp({ ...notasTemp, observacao: e.target.value.slice(0, 200) })}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors"
              placeholder="Opcional"
              maxLength={200}
            />
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
