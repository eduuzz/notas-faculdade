import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Calendar, Monitor, RefreshCw, BarChart3 } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import { modalOverlay, modalContent } from '../../utils/animations';

// Incrementar a versão e adicionar entrada aqui a cada deploy
export const APP_VERSION = '1.1.0';

export const CHANGELOG = [
  {
    version: '1.1.0',
    date: '06/03/2026',
    title: 'Horários e informações das disciplinas',
    items: [
      { icon: Calendar, text: 'Aulas de hoje e amanhã na tela inicial da Grade Curricular' },
      { icon: Monitor, text: 'Horários das aulas com indicação Online/Presencial/Híbrido (editável)' },
      { icon: RefreshCw, text: 'Botão "Horários" na aba Em Curso para buscar do portal sem reimportar' },
      { icon: BarChart3, text: 'Modal de disciplina redesenhado com informações completas e bloco de horários' },
      { icon: Sparkles, text: 'Indicador visual de notas alteradas ao importar do portal' },
    ],
  },
];

function VersionBlock({ entry, isFirst }) {
  return (
    <div className={isFirst ? '' : 'pt-4 border-t border-[var(--border-input)]'}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-[var(--accent-400)]">v{entry.version}</span>
        <span className="text-[10px] text-[var(--text-muted)]">{entry.date}</span>
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">{entry.title}</p>
      <div className="space-y-2.5">
        {entry.items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={14} className="text-[var(--accent-400)]" />
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{item.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WhatsNewModal({ onClose, showAll = false }) {
  const entries = showAll ? CHANGELOG : [CHANGELOG[0]];

  return (
    <motion.div
      className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
      {...modalOverlay}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-xl bg-[var(--bg-modal)] border border-[var(--border-card)] shadow-xl max-h-[85vh] flex flex-col"
        {...modalContent}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-[var(--border-input)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-bg10)] flex items-center justify-center">
              <Sparkles size={18} style={{ color: 'var(--accent-400)' }} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {showAll ? 'Histórico de atualizações' : 'O que há de novo'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">v{CHANGELOG[0].version} — {CHANGELOG[0].date}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {entries.map((entry, i) => (
            <VersionBlock key={entry.version} entry={entry} isFirst={i === 0} />
          ))}
        </div>

        <div className="p-5 pt-0 shrink-0">
          <GradientButton className="w-full" onClick={onClose}>Entendi</GradientButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
