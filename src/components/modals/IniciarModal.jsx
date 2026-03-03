import React from 'react';
import GlassCard from '../ui/GlassCard';
import GradientButton from '../ui/GradientButton';

export default function IniciarModal({ nome, semestreIniciar, setSemestreIniciar, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-sm" hover={false}>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">Iniciar Disciplina</h3>
          <p className="text-[var(--text-secondary)] mb-6">{nome}</p>
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">Semestre</label>
            <input type="text" value={semestreIniciar} onChange={(e) => setSemestreIniciar(e.target.value.slice(0, 6))} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none" placeholder="2024.2" maxLength={6} />
          </div>
          <div className="flex gap-3 mt-6">
            <GradientButton variant="secondary" className="flex-1" onClick={onClose}>Cancelar</GradientButton>
            <GradientButton className="flex-1" onClick={onConfirm}>Iniciar</GradientButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
