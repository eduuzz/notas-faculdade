import React from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
            <LogOut size={24} className="text-red-400" />
          </div>
        </div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] text-center mb-1.5">Sair da conta?</h2>
        <p className="text-sm text-[var(--text-muted)] text-center mb-5">Seus dados estão salvos na nuvem.</p>
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
            <LogOut size={16} />Sair
          </button>
        </div>
      </div>
    </div>
  );
}
