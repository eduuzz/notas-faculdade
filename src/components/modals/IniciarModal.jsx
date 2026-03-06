import React from 'react';
import GlassCard from '../ui/GlassCard';
import GradientButton from '../ui/GradientButton';

export default function IniciarModal({ nome, semestreIniciar, setSemestreIniciar, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-sm" hover={false}>
        <div className="p-5">
          <h3 className="text-base font-semibold mb-1.5">Iniciar Disciplina</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">{nome}</p>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1.5">Semestre</label>
            <input type="text" value={semestreIniciar} onChange={(e) => setSemestreIniciar(e.target.value.slice(0, 6))} className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-500)] transition-colors" placeholder="2024.2" maxLength={6} />
          </div>
          <div className="flex gap-2.5 mt-5">
            <GradientButton variant="secondary" className="flex-1" onClick={onClose}>Cancelar</GradientButton>
            <GradientButton className="flex-1" onClick={onConfirm}>Iniciar</GradientButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
