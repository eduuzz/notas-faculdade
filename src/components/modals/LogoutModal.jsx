import React from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <LogOut size={32} className="text-red-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">Sair da conta?</h2>
        <p className="text-[var(--text-secondary)] text-center mb-6">Tem certeza que deseja sair? Seus dados estão salvos na nuvem.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-400 hover:to-red-500 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2">
            <LogOut size={18} />Sair
          </button>
        </div>
      </div>
    </div>
  );
}
