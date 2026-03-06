import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlassCard from '../ui/GlassCard';
import ProximasAulas from '../widgets/ProximasAulas';
import { staggerContainer, staggerItem } from '../../utils/animations';

const tooltipStyle = { backgroundColor: '#141415', border: '1px solid #1f1f23', borderRadius: '6px' };

export default function DashboardTab({ dadosGrafico, dadosPorPeriodo, estatisticas, horarios }) {
  return (
    <motion.div className="space-y-5" variants={staggerContainer} initial="initial" animate="animate">
      {/* Widget de próximas aulas */}
      <ProximasAulas horarios={horarios} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={staggerItem}><GlassCard className="p-5" hover={false}>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={dadosGrafico.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {dadosGrafico.filter(d => d.value > 0).map((entry, index) => (<Cell key={index} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard></motion.div>
        <motion.div variants={staggerItem}><GlassCard className="p-5" hover={false}>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Progresso por Semestre</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosPorPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
              <XAxis dataKey="periodo" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="aprovadas" fill="#3a9e97" radius={[3, 3, 0, 0]} />
              <Bar dataKey="emCurso" fill="#4283d4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pendentes" fill="#5c5c60" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard></motion.div>
      </div>
      <motion.div variants={staggerItem}><GlassCard className="p-5" hover={false}>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-md bg-[var(--bg-input)]"><p className="text-2xl font-bold text-emerald-400">{estatisticas.aprovadas}</p><p className="text-xs text-[var(--text-muted)] mt-1">Aprovadas</p></div>
          <div className="text-center p-3 rounded-md bg-[var(--bg-input)]"><p className="text-2xl font-bold text-blue-400">{estatisticas.emCurso}</p><p className="text-xs text-[var(--text-muted)] mt-1">Em Curso</p></div>
          <div className="text-center p-3 rounded-md bg-[var(--bg-input)]"><p className="text-2xl font-bold text-[var(--text-secondary)]">{estatisticas.naoIniciadas}</p><p className="text-xs text-[var(--text-muted)] mt-1">Pendentes</p></div>
          <div className="text-center p-3 rounded-md bg-[var(--bg-input)]"><p className="text-2xl font-bold text-red-400">{estatisticas.reprovadas}</p><p className="text-xs text-[var(--text-muted)] mt-1">Reprovadas</p></div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-md bg-[var(--accent-bg10)] border border-[var(--accent-ring)]"><p className="text-xs text-[var(--text-muted)] mb-1">Total de Créditos</p><p className="text-xl font-bold text-[var(--text-primary)]">{estatisticas.creditosConcluidos}/{estatisticas.creditosTotal}</p></div>
          <div className="p-3 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]"><p className="text-xs text-[var(--text-muted)] mb-1">Média Geral</p><p className="text-xl font-bold text-[var(--text-primary)]">{estatisticas.mediaGeral.toFixed(2)}</p></div>
          <div className="p-3 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]"><p className="text-xs text-[var(--text-muted)] mb-1">Progresso</p><p className="text-xl font-bold text-[var(--text-primary)]">{estatisticas.progresso.toFixed(1)}%</p></div>
        </div>
      </GlassCard></motion.div>
    </motion.div>
  );
}
