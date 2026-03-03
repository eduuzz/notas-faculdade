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
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-lg" hover={false}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Adicionar Cadeira</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-all">
              <X size={20} className="text-[var(--text-secondary)]" />
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setModoAdicionar('uma')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                modoAdicionar === 'uma' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Uma Cadeira
            </button>
            <button
              onClick={() => setModoAdicionar('varias')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                modoAdicionar === 'varias' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-input)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Várias Cadeiras
            </button>
          </div>

          {modoAdicionar === 'uma' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-2">Nome da Cadeira</label>
                <input
                  type="text"
                  value={novaDisciplina.nome}
                  onChange={(e) => setNovaDisciplina({ ...novaDisciplina, nome: e.target.value.slice(0, 100) })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50"
                  placeholder="Ex: Cálculo I"
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">Semestre</label>
                  <select
                    value={novaDisciplina.periodo}
                    onChange={(e) => setNovaDisciplina({ ...novaDisciplina, periodo: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none"
                  >
                    {periodos.map(p => (<option key={p} value={p} className="bg-slate-800">{p}º</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">Tipo</label>
                  <select
                    value={novaDisciplina.tipo}
                    onChange={(e) => setNovaDisciplina({ ...novaDisciplina, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="obrigatoria" className="bg-slate-800">Obrigatória</option>
                    <option value="optativa" className="bg-slate-800">Optativa</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">Créditos</label>
                  <input
                    type="number"
                    min="1" max="30"
                    value={novaDisciplina.creditos}
                    onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setNovaDisciplina({ ...novaDisciplina, creditos: Math.min(30, Math.max(1, v)) }); }}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">Carga H.</label>
                  <input
                    type="number"
                    min="1" max="600"
                    value={novaDisciplina.cargaHoraria}
                    onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setNovaDisciplina({ ...novaDisciplina, cargaHoraria: Math.min(600, Math.max(1, v)) }); }}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <GradientButton variant="secondary" className="flex-1" onClick={onClose}>Cancelar</GradientButton>
                <GradientButton className="flex-1" onClick={handleAddDisciplina}>Adicionar</GradientButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-2">Semestre</label>
                <select
                  value={periodoMultiplas}
                  onChange={(e) => setPeriodoMultiplas(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none"
                >
                  {periodos.map(p => (<option key={p} value={p} className="bg-slate-800">{p}º Semestre</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-2">Cadeiras (uma por linha)</label>
                <textarea
                  value={disciplinasMultiplas}
                  onChange={(e) => setDisciplinasMultiplas(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none resize-none"
                  placeholder={"Cálculo I\nFísica I\nProgramação I\nÁlgebra Linear"}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Cada linha será uma cadeira nova com 4 créditos e 60h de carga horária
              </p>
              <div className="flex gap-3 mt-6">
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
