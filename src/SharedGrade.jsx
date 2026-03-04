import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, CheckCircle, Clock, TrendingUp, Award, BookOpen } from 'lucide-react';
import { fetchSharedGrade } from './utils/share';

const STATUS_MAP = {
  APROVADA: { label: 'Aprovada', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  EM_CURSO: { label: 'Em Curso', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  REPROVADA: { label: 'Reprovada', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  NAO_INICIADA: { label: 'Pendente', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export default function SharedGrade({ token }) {
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSharedGrade(token)
      .then(data => setDisciplinas(data || []))
      .catch(() => setError('Grade nao encontrada ou link expirado.'))
      .finally(() => setLoading(false));
  }, [token]);

  const periodos = useMemo(() => {
    const set = new Set(disciplinas.map(d => d.periodo));
    return [...set].sort((a, b) => a - b);
  }, [disciplinas]);

  const stats = useMemo(() => {
    const obrig = disciplinas.filter(d => d.tipo !== 'optativa');
    const aprovadas = obrig.filter(d => d.status === 'APROVADA').length;
    const emCurso = obrig.filter(d => d.status === 'EM_CURSO').length;
    const total = obrig.length;
    const notasAprov = obrig.filter(d => d.status === 'APROVADA' && d.notaFinal);
    const media = notasAprov.length > 0 ? notasAprov.reduce((s, d) => s + d.notaFinal, 0) / notasAprov.length : 0;
    const progresso = total > 0 ? (aprovadas / total) * 100 : 0;
    return { total, aprovadas, emCurso, media, progresso };
  }, [disciplinas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: 'linear-gradient(to bottom right, var(--accent-500), var(--accent-600))' }}>
            <GraduationCap size={32} className="text-white" />
          </div>
          <p className="text-slate-400">Carregando grade...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-red-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Link invalido</h1>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(to bottom right, var(--accent-500), var(--accent-600))', boxShadow: '0 20px 25px -5px var(--accent-ring)' }}>
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Grade Compartilhada</h1>
            <p className="text-slate-400 text-sm">Visualizacao publica (somente leitura)</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Aprovadas', value: stats.aprovadas, icon: CheckCircle, color: 'from-emerald-500 to-green-600' },
            { label: 'Em Curso', value: stats.emCurso, icon: Clock, color: 'from-blue-500 to-indigo-600' },
            { label: 'Progresso', value: `${stats.progresso.toFixed(0)}%`, icon: TrendingUp, accentGradient: true },
            { label: 'Media', value: stats.media.toFixed(1), icon: Award, color: 'from-amber-500 to-orange-600' },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                  <p className="text-2xl font-semibold">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.accentGradient ? '' : `bg-gradient-to-br ${s.color}`}`} style={s.accentGradient ? { background: 'linear-gradient(to bottom right, var(--accent-500), var(--accent-600))' } : {}}>
                  <s.icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disciplinas por semestre */}
        <div className="space-y-6">
          {periodos.map(periodo => {
            const discs = disciplinas.filter(d => d.periodo === periodo);
            const aprovadas = discs.filter(d => d.status === 'APROVADA').length;

            return (
              <div key={periodo}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">{periodo}. Semestre</h2>
                  <span className="text-sm text-slate-400">{aprovadas}/{discs.length} concluidas</span>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left p-3 text-slate-400 text-xs font-medium">Disciplina</th>
                        <th className="text-center p-3 text-slate-400 text-xs font-medium hidden sm:table-cell">Cr</th>
                        <th className="text-center p-3 text-slate-400 text-xs font-medium">Status</th>
                        <th className="text-center p-3 text-slate-400 text-xs font-medium">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discs.map(d => {
                        const st = STATUS_MAP[d.status] || STATUS_MAP.NAO_INICIADA;
                        return (
                          <tr key={d.id} className="border-b border-white/5">
                            <td className="p-3 text-sm">{d.nome}</td>
                            <td className="p-3 text-center text-sm text-slate-400 hidden sm:table-cell">{d.creditos}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${st.bg} ${st.text} border ${st.border}`}>{st.label}</span>
                            </td>
                            <td className="p-3 text-center text-sm font-medium">{d.notaFinal ? d.notaFinal.toFixed(1) : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-10">
          Semestry
        </p>
      </div>
    </div>
  );
}
