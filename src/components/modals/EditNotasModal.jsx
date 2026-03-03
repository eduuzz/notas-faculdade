import React from 'react';
import GlassCard from '../ui/GlassCard';
import GradientButton from '../ui/GradientButton';

export default function EditNotasModal({ nome, notasTemp, setNotasTemp, onClose, onSave }) {
  const handleNota = (field, value) => {
    if (value === '') { setNotasTemp({ ...notasTemp, [field]: '' }); return; }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setNotasTemp({ ...notasTemp, [field]: Math.min(10, Math.max(0, num)).toString() });
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md" hover={false}>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">Editar Notas</h3>
          <p className="text-[var(--text-secondary)] mb-6">{nome}</p>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm text-[var(--text-secondary)] block mb-2">GA</label><input type="number" step="0.1" min="0" max="10" value={notasTemp.ga} onChange={(e) => handleNota('ga', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none" placeholder="0.0" /></div>
              <div><label className="text-sm text-[var(--text-secondary)] block mb-2">GB</label><input type="number" step="0.1" min="0" max="10" value={notasTemp.gb} onChange={(e) => handleNota('gb', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none" placeholder="0.0" /></div>
              <div><label className="text-sm text-[var(--text-secondary)] block mb-2">Final</label><input type="number" step="0.1" min="0" max="10" value={notasTemp.notaFinal} onChange={(e) => handleNota('notaFinal', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none" placeholder="Auto" /></div>
            </div>
            <div><label className="text-sm text-[var(--text-secondary)] block mb-2">Semestre</label><input type="text" value={notasTemp.semestreCursado} onChange={(e) => setNotasTemp({ ...notasTemp, semestreCursado: e.target.value.slice(0, 6) })} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none" placeholder="2024.2" maxLength={6} /></div>
            <div><label className="text-sm text-[var(--text-secondary)] block mb-2">Observação</label><input type="text" value={notasTemp.observacao} onChange={(e) => setNotasTemp({ ...notasTemp, observacao: e.target.value.slice(0, 200) })} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none" placeholder="Opcional" maxLength={200} /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <GradientButton variant="secondary" className="flex-1" onClick={onClose}>Cancelar</GradientButton>
            <GradientButton className="flex-1" onClick={onSave}>Salvar</GradientButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
