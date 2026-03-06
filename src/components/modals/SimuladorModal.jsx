import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, X } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import { modalOverlay, modalContent } from '../../utils/animations';

export default function SimuladorModal({
  disciplinas,
  simuladorDisciplina, setSimuladorDisciplina,
  simuladorGA, setSimuladorGA,
  simuladorGB, setSimuladorGB,
  onClose,
}) {
  const ga = parseFloat(simuladorGA) || 0;
  const gb = parseFloat(simuladorGB) || 0;
  const disc = disciplinas.find(d => d.id === simuladorDisciplina);
  const notaMinima = disc?.notaMinima || 6.0;
  const mediaFinal = (ga + gb) / 2;
  const precisaNaGB = Math.max(0, (notaMinima * 2) - ga);
  const aprovado = mediaFinal >= notaMinima;

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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Calculator size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Simulador de Notas</h3>
              <p className="text-xs text-[var(--text-muted)]">Calcule suas notas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Disciplina */}
          <div>
            <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider block mb-1.5">Disciplina</label>
            <select
              value={simuladorDisciplina || ''}
              onChange={(e) => {
                const d = disciplinas.find(x => x.id === e.target.value);
                setSimuladorDisciplina(e.target.value);
                setSimuladorGA(d?.ga?.toString() || '');
                setSimuladorGB(d?.gb?.toString() || '');
              }}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors cursor-pointer"
            >
              <option value="">Selecione uma disciplina</option>
              {disciplinas.filter(d => d.status === 'EM_CURSO').map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          {/* GA / GB */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider block mb-1.5">Nota GA</label>
              <input
                type="number" step="0.1" min="0" max="10"
                value={simuladorGA}
                onChange={(e) => setSimuladorGA(e.target.value)}
                onBlur={() => { if (simuladorGA !== '') { const n = parseFloat(simuladorGA); if (!isNaN(n)) setSimuladorGA(Math.min(10, Math.max(0, n)).toString()); } }}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm tabular-nums focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider block mb-1.5">Nota GB</label>
              <input
                type="number" step="0.1" min="0" max="10"
                value={simuladorGB}
                onChange={(e) => setSimuladorGB(e.target.value)}
                onBlur={() => { if (simuladorGB !== '') { const n = parseFloat(simuladorGB); if (!isNaN(n)) setSimuladorGB(Math.min(10, Math.max(0, n)).toString()); } }}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm tabular-nums focus:outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Result */}
          {(simuladorGA || simuladorGB) && (
            <div className={`p-3 rounded-lg border ${aprovado ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">Média calculada</span>
                <span className={`text-lg font-bold tabular-nums ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>{mediaFinal.toFixed(1)}</span>
              </div>
              {simuladorGA && !simuladorGB && (
                <div className="pt-2 mt-2 border-t border-[var(--border-card)]">
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Para atingir média {notaMinima}:</p>
                  <p className="text-sm font-semibold text-amber-400">Precisa de {precisaNaGB.toFixed(1)} na GB</p>
                  {precisaNaGB > 10 && <p className="text-[11px] text-red-400 mt-1">Nota necessária maior que 10</p>}
                </div>
              )}
              {simuladorGA && simuladorGB && (
                <p className={`text-xs font-medium ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>
                  {aprovado ? 'Aprovado!' : `Reprovado - média abaixo de ${notaMinima}`}
                </p>
              )}
            </div>
          )}

          {/* Tip */}
          <div className="p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)]">
            <p className="text-[11px] text-[var(--text-muted)]">
              <strong className="text-[var(--text-secondary)]">Dica:</strong> Digite apenas a nota da GA para descobrir quanto precisa tirar na GB.
            </p>
          </div>

          {/* Close */}
          <GradientButton variant="secondary" className="w-full" onClick={onClose}>Fechar</GradientButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
