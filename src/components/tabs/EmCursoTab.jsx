import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Edit2, Calculator } from 'lucide-react';
import { STATUS } from '../ui/STATUS';
import GlassCard from '../ui/GlassCard';
import { staggerContainer, staggerItem } from '../../utils/animations';

export default function EmCursoTab({ disciplinas, setShowSimulador, startEditNotas }) {
  const emCurso = disciplinas.filter(d => d.status === 'EM_CURSO');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Disciplinas em Curso</h2>
        <button
          onClick={() => setShowSimulador(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Calculator size={16} />
          Simulador
        </button>
      </div>

      {emCurso.length === 0 ? (
        <GlassCard className="p-8 text-center" hover={false}>
          <Clock size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)] text-sm">Nenhuma disciplina em curso</p>
        </GlassCard>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
        {emCurso.map(disc => {
          const status = STATUS[disc.status];
          return (
            <motion.div key={disc.id} variants={staggerItem}>
            <GlassCard className="group cursor-pointer" hover={false} onClick={() => startEditNotas(disc)}>
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${status.bar}`} />
              <div className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm truncate">{disc.nome}</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">{disc.periodo}º Sem · {disc.creditos} cred</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-medium">{disc.ga ?? '-'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">GA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{disc.gb ?? '-'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">GB</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{disc.notaFinal ?? '-'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Final</p>
                  </div>
                  <Edit2 size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                </div>
              </div>
            </GlassCard>
            </motion.div>
          );
        })}
        </motion.div>
      )}
    </div>
  );
}
