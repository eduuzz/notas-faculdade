import React from 'react';
import { Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function ResetModal({
  disciplinasCount,
  resetCode, resetConfirmText, setResetConfirmText,
  resettingAll, onClose, onConfirm,
}) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && !resettingAll && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
            <AlertCircle size={40} className="text-red-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">Excluir todas as cadeiras?</h2>
        <p className="text-[var(--text-secondary)] text-center mb-4">
          Esta ação é <span className="text-red-400 font-semibold">irreversível</span>.
          Todas as <span className="text-white font-semibold">{disciplinasCount} cadeiras</span> serão
          permanentemente excluídas, incluindo notas e histórico.
        </p>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Trash2 size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-red-300 font-medium mb-1">Atenção!</p>
              <p className="text-red-200/70">
                Você perderá todas as disciplinas cadastradas, notas lançadas,
                status de aprovação e planejamento de matrícula.
              </p>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <label className="text-sm text-[var(--text-secondary)] block mb-2">
            Para confirmar, digite <span className="font-mono bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{resetCode}</span> abaixo:
          </label>
          <input
            type="text"
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
            placeholder="Digite o código de confirmação"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-red-500/30 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-red-500 transition-colors uppercase"
            maxLength={6}
            disabled={resettingAll}
          />
          {resetConfirmText && resetConfirmText !== resetCode && (
            <p className="text-red-400 text-xs mt-2 text-center">Código incorreto. Digite exatamente: {resetCode}</p>
          )}
          {resetConfirmText === resetCode && (
            <p className="text-emerald-400 text-xs mt-2 text-center flex items-center justify-center gap-1">
              <CheckCircle size={12} /> Código confirmado
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={resettingAll} className="flex-1 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={resetConfirmText !== resetCode || resettingAll} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-600 disabled:hover:to-red-700">
            {resettingAll ? <><RefreshCw size={18} className="animate-spin" />Excluindo...</> : <><Trash2 size={18} />Excluir Tudo</>}
          </button>
        </div>
      </div>
    </div>
  );
}
