import React from 'react';
import { GraduationCap, CheckCircle, RefreshCw } from 'lucide-react';

export default function WelcomeModal({ cursoInput, setCursoInput, savingCurso, onSave, onSkip }) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mx-auto mb-4">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Bem-vindo ao Sistema de Notas!</h2>
          <p className="text-[var(--text-secondary)]">Para personalizar sua experiência, conte-nos qual curso você está fazendo.</p>
        </div>
        <div className="mb-6">
          <label className="text-sm text-[var(--text-secondary)] block mb-2">Qual é o seu curso?</label>
          <input
            type="text"
            value={cursoInput}
            onChange={(e) => setCursoInput(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-white text-lg focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Ex: Ciência da Computação"
            autoFocus
          />
        </div>
        <p className="text-[var(--text-muted)] text-sm text-center mb-6">
          Você pode alterar isso depois nas configurações.
        </p>
        <div className="flex gap-3">
          <button onClick={onSkip} className="flex-1 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] transition-colors">
            Pular
          </button>
          <button
            onClick={onSave}
            disabled={!cursoInput.trim() || savingCurso}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {savingCurso ? <RefreshCw size={18} className="animate-spin" /> : <><CheckCircle size={18} />Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
