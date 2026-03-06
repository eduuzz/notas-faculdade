import React from 'react';
import { Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function ResetModal({
  disciplinasCount,
  resetCode, resetConfirmText, setResetConfirmText,
  resettingAll, onClose, onConfirm,
}) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && !resettingAll && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-red-500/20 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
        </div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] text-center mb-1.5">Excluir todas as cadeiras?</h2>
        <p className="text-sm text-[var(--text-muted)] text-center mb-4">
          Esta ação é <span className="text-red-400 font-medium">irreversível</span>.
          Todas as <span className="text-[var(--text-primary)] font-medium">{disciplinasCount} cadeiras</span> serão permanentemente excluídas.
        </p>
        <div className="bg-red-500/5 border border-red-500/20 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2.5">
            <Trash2 size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300/70">
              Você perderá todas as disciplinas, notas, status de aprovação e planejamento.
            </p>
          </div>
        </div>
        <div className="mb-5">
          <label className="text-xs text-[var(--text-muted)] block mb-1.5">
            Para confirmar, digite <span className="font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">{resetCode}</span>
          </label>
          <input
            type="text"
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
            placeholder="Digite o código"
            className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-red-500/20 text-[var(--text-primary)] font-mono text-center text-sm tracking-widest focus:outline-none focus:border-red-500 transition-colors uppercase"
            maxLength={6}
            disabled={resettingAll}
          />
          {resetConfirmText && resetConfirmText !== resetCode && (
            <p className="text-red-400 text-xs mt-1.5 text-center">Código incorreto</p>
          )}
          {resetConfirmText === resetCode && (
            <p className="text-emerald-400 text-xs mt-1.5 text-center flex items-center justify-center gap-1">
              <CheckCircle size={12} /> Código confirmado
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          <button onClick={onClose} disabled={resettingAll} className="flex-1 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={resetConfirmText !== resetCode || resettingAll} className="flex-1 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
            {resettingAll ? <><RefreshCw size={16} className="animate-spin" />Excluindo...</> : <><Trash2 size={16} />Excluir Tudo</>}
          </button>
        </div>
      </div>
    </div>
  );
}
