import React from 'react';
import { Clock, Edit2, Calculator } from 'lucide-react';
import { STATUS } from '../ui/STATUS';
import GlassCard from '../ui/GlassCard';
import GradientButton from '../ui/GradientButton';

export default function EmCursoTab({ disciplinas, setShowSimulador, startEditNotas }) {
  const emCurso = disciplinas.filter(d => d.status === 'EM_CURSO');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Disciplinas em Curso</h2>
        <button
          onClick={() => setShowSimulador(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:scale-105"
        >
          <Calculator size={18} />
          Simulador
        </button>
      </div>

      {emCurso.length === 0 ? (
        <GlassCard className="p-8 text-center" hover={false}>
          <Clock size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-[var(--text-secondary)]">Nenhuma disciplina em curso</p>
        </GlassCard>
      ) : (
        emCurso.map(disc => {
          const status = STATUS[disc.status];
          return (
            <GlassCard key={disc.id} className="group" hover={false}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.bar}`} />
              <div className="p-5 pl-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-lg">{disc.nome}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{disc.periodo}º Semestre • {disc.creditos} créditos</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${status.bg} ${status.text} border ${status.border}`}>{status.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 rounded-xl bg-[var(--bg-input)]">
                    <p className="text-lg sm:text-2xl font-semibold">{disc.ga ?? '-'}</p>
                    <p className="text-xs text-[var(--text-muted)]">Grau A</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-xl bg-[var(--bg-input)]">
                    <p className="text-lg sm:text-2xl font-semibold">{disc.gb ?? '-'}</p>
                    <p className="text-xs text-[var(--text-muted)]">Grau B</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-xl bg-[var(--bg-input)]">
                    <p className="text-lg sm:text-2xl font-semibold">{disc.notaFinal ?? '-'}</p>
                    <p className="text-xs text-[var(--text-muted)]">Final</p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <GradientButton size="sm" onClick={() => startEditNotas(disc)}><Edit2 size={16} />Editar Notas</GradientButton>
                </div>
              </div>
            </GlassCard>
          );
        })
      )}
    </div>
  );
}
