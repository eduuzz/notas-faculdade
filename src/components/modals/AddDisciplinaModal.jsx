import React from 'react';
import { X } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GradientButton from '../ui/GradientButton';

export default function AddDisciplinaModal({
  onClose,
  modoAdicionar, setModoAdicionar,
  novaDisciplina, setNovaDisciplina,
  handleAddDisciplina,
  disciplinasMultiplas, setDisciplinasMultiplas,
  periodoMultiplas, setPeriodoMultiplas,
  handleAddMultiplas,
  periodos,
}) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-xl" hover={false}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold">Adicionar Cadeira</h3>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors">
              <X size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setModoAdicionar('uma')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                modoAdicionar === 'uma' ? 'bg-[var(--accent-bg10)] text-[var(--accent-400)] border border-[var(--accent-ring)]' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Uma Cadeira
            </button>
            <button
              onClick={() => setModoAdicionar('varias')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                modoAdicionar === 'varias' ? 'bg-[var(--accent-bg10)] text-[var(--accent-400)] border border-[var(--accent-ring)]' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Várias Cadeiras
            </button>
          </div>

          {modoAdicionar === 'uma' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5">Nome da Cadeira</label>
                <input
                  type="text"
                  value={novaDisciplina.nome}
                  onChange={(e) => setNovaDisciplina({ ...novaDisciplina, nome: e.target.value.slice(0, 100) })}
                  className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                  placeholder="Ex: Cálculo I"
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1.5">Semestre</label>
                  <select
                    value={novaDisciplina.periodo}
                    onChange={(e) => setNovaDisciplina({ ...novaDisciplina, periodo: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none cursor-pointer"
                  >
                    {periodos.map(p => (<option key={p} value={p}>{p}º</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1.5">Tipo</label>
                  <select
                    value={novaDisciplina.tipo}
                    onChange={(e) => setNovaDisciplina({ ...novaDisciplina, tipo: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="obrigatoria">Obrigatória</option>
                    <option value="optativa">Optativa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1.5">Créditos</label>
                  <input
                    type="number"
                    min="1" max="30"
                    value={novaDisciplina.creditos}
                    onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setNovaDisciplina({ ...novaDisciplina, creditos: Math.min(30, Math.max(1, v)) }); }}
                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1.5">Carga H.</label>
                  <input
                    type="number"
                    min="1" max="600"
                    value={novaDisciplina.cargaHoraria}
                    onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setNovaDisciplina({ ...novaDisciplina, cargaHoraria: Math.min(600, Math.max(1, v)) }); }}
                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2.5 mt-5">
                <GradientButton variant="secondary" className="flex-1" onClick={onClose}>Cancelar</GradientButton>
                <GradientButton className="flex-1" onClick={handleAddDisciplina}>Adicionar</GradientButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5">Semestre</label>
                <select
                  value={periodoMultiplas}
                  onChange={(e) => setPeriodoMultiplas(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none cursor-pointer"
                >
                  {periodos.map(p => (<option key={p} value={p}>{p}º Semestre</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1.5">Cadeiras (uma por linha)</label>
                <textarea
                  value={disciplinasMultiplas}
                  onChange={(e) => setDisciplinasMultiplas(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none resize-none"
                  placeholder={"Cálculo I\nFísica I\nProgramação I\nÁlgebra Linear"}
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Cada linha será uma cadeira nova com 4 créditos e 60h
              </p>
              <div className="flex gap-2.5 mt-5">
                <GradientButton variant="secondary" className="flex-1" onClick={() => { onClose(); setDisciplinasMultiplas(''); }}>Cancelar</GradientButton>
                <GradientButton className="flex-1" onClick={handleAddMultiplas}>
                  Adicionar {disciplinasMultiplas.split('\n').filter(l => l.trim()).length || ''} Cadeiras
                </GradientButton>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
