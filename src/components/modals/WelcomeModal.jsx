import React from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';


export default function WelcomeModal({ cursoInput, setCursoInput, savingCurso, onSave, onSkip }) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <img src="/icon-192.png" alt="Semestry" className="w-20 h-20 rounded-[24px] mx-auto mb-4" style={{ filter: 'var(--accent-icon-filter)' }} />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Bem-vindo ao Semestry!</h2>
          <p className="text-[var(--text-secondary)]">Para personalizar sua experiência, conte-nos qual curso você está fazendo.</p>
        </div>
        <div className="mb-6">
          <label className="text-sm text-[var(--text-secondary)] block mb-2">Qual é o seu curso?</label>
          <input
            type="text"
            value={cursoInput}
            onChange={(e) => setCursoInput(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-white text-lg focus:outline-none transition-colors"
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
            onBlur={(e) => e.target.style.borderColor = ''}
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
            className="flex-1 py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(to right, var(--accent-600), var(--accent-500))' }}
          >
            {savingCurso ? <RefreshCw size={18} className="animate-spin" /> : <><CheckCircle size={18} />Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
