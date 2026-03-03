import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlassCard from '../ui/GlassCard';

export default function DashboardTab({ dadosGrafico, dadosPorPeriodo, estatisticas }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={dadosGrafico.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {dadosGrafico.filter(d => d.value > 0).map((entry, index) => (<Cell key={index} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-6" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Progresso por Semestre</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosPorPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="periodo" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              <Bar dataKey="aprovadas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="emCurso" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendentes" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
      <GlassCard className="p-6" hover={false}>
        <h3 className="text-lg font-semibold mb-4">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-[var(--bg-input)]"><p className="text-3xl font-bold text-emerald-400">{estatisticas.aprovadas}</p><p className="text-sm text-[var(--text-muted)]">Aprovadas</p></div>
          <div className="text-center p-4 rounded-xl bg-[var(--bg-input)]"><p className="text-3xl font-bold text-blue-400">{estatisticas.emCurso}</p><p className="text-sm text-[var(--text-muted)]">Em Curso</p></div>
          <div className="text-center p-4 rounded-xl bg-[var(--bg-input)]"><p className="text-3xl font-bold text-[var(--text-secondary)]">{estatisticas.naoIniciadas}</p><p className="text-sm text-[var(--text-muted)]">Pendentes</p></div>
          <div className="text-center p-4 rounded-xl bg-[var(--bg-input)]"><p className="text-3xl font-bold text-red-400">{estatisticas.reprovadas}</p><p className="text-sm text-[var(--text-muted)]">Reprovadas</p></div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20"><p className="text-[var(--text-secondary)] text-sm mb-1">Total de Créditos</p><p className="text-2xl font-bold">{estatisticas.creditosConcluidos}/{estatisticas.creditosTotal}</p></div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"><p className="text-[var(--text-secondary)] text-sm mb-1">Média Geral</p><p className="text-2xl font-bold">{estatisticas.mediaGeral.toFixed(2)}</p></div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20"><p className="text-[var(--text-secondary)] text-sm mb-1">Progresso</p><p className="text-2xl font-bold">{estatisticas.progresso.toFixed(1)}%</p></div>
        </div>
      </GlassCard>
    </div>
  );
}
