import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'default' }) {
  const btnClass = variant === 'danger'
    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
    : '';

  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-[var(--bg-modal)] border border-[var(--border-card)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          {variant === 'danger' && (
            <div className="bg-red-500/10 p-2 rounded-xl">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        </div>
        <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm text-white font-medium transition-all ${btnClass}`}
            style={variant !== 'danger' ? { background: 'linear-gradient(to right, var(--accent-600), var(--accent-500))' } : {}}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
