import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'default' }) {
  const btnClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-[var(--accent-500)] hover:bg-[var(--accent-600)]';

  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-[var(--bg-modal)] border border-[var(--border-card)] rounded-lg p-5 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          {variant === 'danger' && (
            <div className="bg-red-500/10 p-2 rounded-lg">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
          )}
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        </div>
        <p className="text-[var(--text-secondary)] text-sm mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-sm text-white font-medium transition-colors ${btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
