import React, { useState } from 'react';
import { Trash2, RotateCcw, RefreshCw, AlertTriangle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function DeleteMenuModal({ disc, onClose, onReset, onToggleTipo, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!disc) return null;

  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-sm" hover={false}>
        <div className="p-2">
          <div className="p-4 border-b border-[var(--border-input)]"><h3 className="font-semibold">{disc.nome}</h3></div>
          {disc.status !== 'NAO_INICIADA' && (
            <button onClick={onReset} className="w-full flex items-center gap-3 px-4 py-4 text-left text-amber-400 hover:bg-[var(--bg-input)] transition-colors">
              <RotateCcw size={18} /><div><div className="font-medium">Resetar andamento</div><div className="text-xs text-[var(--text-muted)]">Volta para "Pendente"</div></div>
            </button>
          )}
          <button onClick={onToggleTipo} className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-[var(--bg-input)] transition-colors border-t border-[var(--border-input)]" style={{ color: 'var(--accent-400)' }}>
            <RefreshCw size={18} /><div><div className="font-medium">{disc.tipo === 'optativa' ? 'Marcar como obrigatória' : 'Marcar como optativa'}</div><div className="text-xs text-[var(--text-muted)]">Altera classificação da disciplina</div></div>
          </button>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-3 px-4 py-4 text-left text-red-400 hover:bg-[var(--bg-input)] transition-colors border-t border-[var(--border-input)]">
              <Trash2 size={18} /><div><div className="font-medium">Excluir disciplina</div><div className="text-xs text-[var(--text-muted)]">Remove permanentemente</div></div>
            </button>
          ) : (
            <div className="border-t border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-3">
                <AlertTriangle size={16} /> Confirmar exclusão?
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg text-sm bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                  Cancelar
                </button>
                <button onClick={onDelete} className="flex-1 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-colors">
                  Excluir
                </button>
              </div>
            </div>
          )}

          <button onClick={onClose} className="w-full px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-input)] border-t border-[var(--border-input)]">Cancelar</button>
        </div>
      </GlassCard>
    </div>
  );
}
