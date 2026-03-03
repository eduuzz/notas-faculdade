import React from 'react';
import { Calculator } from 'lucide-react';

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
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-amber-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Calculator size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Simulador de Notas</h2>
            <p className="text-amber-400 text-sm">Calcule suas notas</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-[var(--text-secondary)] block mb-2">Disciplina</label>
          <select
            value={simuladorDisciplina || ''}
            onChange={(e) => {
              const d = disciplinas.find(x => x.id === e.target.value);
              setSimuladorDisciplina(e.target.value);
              setSimuladorGA(d?.ga?.toString() || '');
              setSimuladorGB(d?.gb?.toString() || '');
            }}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
          >
            <option value="" className="bg-slate-800">Selecione uma disciplina</option>
            {disciplinas.filter(d => d.status === 'EM_CURSO').map(d => (
              <option key={d.id} value={d.id} className="bg-slate-800">{d.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">Nota GA (atual ou esperada)</label>
            <input type="number" step="0.1" min="0" max="10" value={simuladorGA} onChange={(e) => setSimuladorGA(e.target.value)} onBlur={() => { if (simuladorGA !== '') { const n = parseFloat(simuladorGA); if (!isNaN(n)) setSimuladorGA(Math.min(10, Math.max(0, n)).toString()); } }} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500 text-center text-xl" placeholder="0.0" />
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">Nota GB (atual ou esperada)</label>
            <input type="number" step="0.1" min="0" max="10" value={simuladorGB} onChange={(e) => setSimuladorGB(e.target.value)} onBlur={() => { if (simuladorGB !== '') { const n = parseFloat(simuladorGB); if (!isNaN(n)) setSimuladorGB(Math.min(10, Math.max(0, n)).toString()); } }} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500 text-center text-xl" placeholder="0.0" />
          </div>
        </div>

        {(simuladorGA || simuladorGB) && (
          <div className="mb-6">
            <div className={`p-4 rounded-xl border ${aprovado ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[var(--text-secondary)]">Média calculada:</span>
                <span className={`text-2xl font-bold ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>{mediaFinal.toFixed(1)}</span>
              </div>
              {simuladorGA && !simuladorGB && (
                <div className="pt-3 border-t border-[var(--border-input)]">
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Para atingir média {notaMinima}:</p>
                  <p className="text-lg font-semibold text-amber-400">Você precisa de {precisaNaGB.toFixed(1)} na GB</p>
                  {precisaNaGB > 10 && <p className="text-xs text-red-400 mt-1">Nota necessária maior que 10</p>}
                </div>
              )}
              {simuladorGA && simuladorGB && (
                <p className={`text-sm font-medium ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>
                  {aprovado ? 'Aprovado!' : 'Reprovado - média abaixo de ' + notaMinima}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-[var(--bg-input)] rounded-xl p-3 mb-6">
          <p className="text-xs text-[var(--text-secondary)]">
            <strong>Dica:</strong> Digite apenas a nota da GA para descobrir quanto você precisa tirar na GB para passar.
          </p>
        </div>

        <button onClick={onClose} className="w-full py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] transition-colors">
          Fechar
        </button>
      </div>
    </div>
  );
}
