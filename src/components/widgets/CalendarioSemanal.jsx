import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, MapPin, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DIAS_LABEL = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado' };
const DIAS_LABEL_SHORT = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sab' };

// Paleta de cores ciclada por disciplina
// Mock para preview quando não há horários importados
const MOCK_HORARIOS = [
  { nome: 'Cálculo II', codDisc: 'MAT102', aulas: [
    { dia: 'seg', inicio: '08:00', fim: '09:45', sala: 'A201' },
    { dia: 'qua', inicio: '08:00', fim: '09:45', sala: 'A201' },
  ]},
  { nome: 'Algoritmos e Estruturas de Dados', codDisc: 'INF201', aulas: [
    { dia: 'ter', inicio: '10:00', fim: '11:45', sala: 'Lab 3' },
    { dia: 'qui', inicio: '10:00', fim: '11:45', sala: 'Lab 3' },
  ]},
  { nome: 'Engenharia de Software', codDisc: 'INF301', aulas: [
    { dia: 'seg', inicio: '19:30', fim: '21:00', sala: null },
    { dia: 'qua', inicio: '19:30', fim: '21:00', sala: null },
  ]},
  { nome: 'Banco de Dados', codDisc: 'INF202', aulas: [
    { dia: 'ter', inicio: '19:30', fim: '21:00', sala: 'B102' },
    { dia: 'sex', inicio: '19:30', fim: '21:00', sala: 'B102' },
  ]},
  { nome: 'Redes de Computadores', codDisc: 'INF401', aulas: [
    { dia: 'qui', inicio: '21:00', fim: '22:45', sala: 'A301' },
  ]},
];

const CORES = [
  { bg: 'rgba(167,139,255,0.12)', border: 'rgba(167,139,255,0.3)', text: '#A78BFF', dot: '#A78BFF' },   // purple
  { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  text: '#60A5FA', dot: '#60A5FA' },   // blue
  { bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)',  text: '#4ADE80', dot: '#4ADE80' },   // green
  { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#FCD34D', dot: '#FCD34D' },   // amber
  { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)',  text: '#FB923C', dot: '#FB923C' },   // orange
  { bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)', text: '#FB7185', dot: '#FB7185' },   // rose
  { bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)',  text: '#22D3EE', dot: '#22D3EE' },   // cyan
  { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  text: '#34D399', dot: '#34D399' },   // teal
];

export default function CalendarioSemanal({ horarios }) {
  const [showSab, setShowSab] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isMock = !horarios || horarios.length === 0;
  const dados = isMock ? MOCK_HORARIOS : horarios;

  const { slots, grid, corMap, diasComAula } = useMemo(() => {
    if (!dados || dados.length === 0) return { slots: [], grid: {}, corMap: {}, diasComAula: [] };

    // Mapeia cor por disciplina
    const corMap = {};
    dados.forEach((disc, i) => {
      corMap[disc.nome] = CORES[i % CORES.length];
    });

    // Coleta todos os slots únicos (inicio + fim)
    const slotsSet = new Set();
    for (const disc of dados) {
      for (const aula of disc.aulas || []) {
        slotsSet.add(`${aula.inicio}|${aula.fim}`);
      }
    }
    const slots = [...slotsSet]
      .sort((a, b) => a.localeCompare(b))
      .map(s => { const [inicio, fim] = s.split('|'); return { inicio, fim }; });

    // Monta grid: { dia: { 'inicio|fim': [{ nome, sala, online }] } }
    const grid = {};
    for (const dia of DIAS) {
      grid[dia] = {};
      for (const slot of slots) {
        grid[dia][`${slot.inicio}|${slot.fim}`] = [];
      }
    }

    for (const disc of dados) {
      // Deduplicar aulas por dia+inicio pra não mostrar duplicadas
      const seen = new Set();
      for (const aula of disc.aulas || []) {
        const key = `${aula.dia}|${aula.inicio}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!DIAS.includes(aula.dia)) continue;
        const slotKey = `${aula.inicio}|${aula.fim}`;
        if (grid[aula.dia] && grid[aula.dia][slotKey] !== undefined) {
          grid[aula.dia][slotKey].push({
            nome: disc.nome,
            sala: aula.sala,
            predio: aula.predio,
            online: !aula.sala && !aula.predio,
            dataInicio: aula.data || null,
          });
        }
      }
    }

    // Dias que têm pelo menos uma aula
    const diasComAula = DIAS.filter(dia =>
      Object.values(grid[dia] || {}).some(arr => arr.length > 0)
    );

    return { slots, grid, corMap, diasComAula };
  }, [dados]);

  if (!horarios || horarios.length === 0) return null;
  if (slots.length === 0) return null;

  const diasVisiveis = DIAS.filter(d => {
    if (d === 'sab') return showSab || diasComAula.includes('sab');
    return true;
  });

  const temSab = diasComAula.includes('sab');

  return (
    <GlassCard hover={false} className="overflow-hidden">
      {/* Header do card */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-input)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Quadro de Horários</span>
          {isMock && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium">
              Preview
            </span>
          )}
          {/* Legenda de cores */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            {horarios.slice(0, 5).map((disc, i) => {
              const cor = CORES[i % CORES.length];
              return (
                <span
                  key={disc.nome}
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cor.dot }}
                  title={disc.nome}
                />
              );
            })}
            {horarios.length > 5 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{horarios.length - 5}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!temSab && (
            <button
              onClick={() => setShowSab(v => !v)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)]"
            >
              {showSab ? 'Ocultar Sábado' : 'Ver Sábado'}
            </button>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {/* Tabela */}
      <motion.div
        initial={false}
        animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr>
                {/* Coluna de horário */}
                <th className="w-[68px] px-3 py-2.5 text-[11px] font-medium text-[var(--text-muted)] text-left border-b border-[var(--border-input)] border-r border-[var(--border-input)] bg-[var(--bg-input)]">
                  Horário
                </th>
                {diasVisiveis.map(dia => (
                  <th
                    key={dia}
                    className="px-3 py-2.5 text-[11px] font-semibold text-[var(--text-secondary)] text-center border-b border-[var(--border-input)] bg-[var(--bg-input)]"
                  >
                    <span className="hidden sm:inline">{DIAS_LABEL[dia]}</span>
                    <span className="sm:hidden">{DIAS_LABEL_SHORT[dia]}</span>
                    {/* Destaque no dia de hoje */}
                    {(() => {
                      const hoje = ['dom','seg','ter','qua','qui','sex','sab'][new Date().getDay()];
                      return hoje === dia ? (
                        <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-400)] align-middle" />
                      ) : null;
                    })()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map(({ inicio, fim }, rowIdx) => (
                <tr key={`${inicio}-${fim}`} className={rowIdx % 2 === 0 ? '' : 'bg-white/[0.015]'}>
                  {/* Coluna de hora */}
                  <td className="px-3 py-2 border-r border-[var(--border-input)] align-top">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">{inicio}</span>
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{fim}</span>
                    </div>
                  </td>
                  {/* Células por dia */}
                  {diasVisiveis.map(dia => {
                    const aulas = grid[dia]?.[`${inicio}|${fim}`] || [];
                    return (
                      <td key={dia} className="px-1.5 py-1.5 align-top min-w-[110px]">
                        {aulas.length === 0 ? (
                          <div className="h-full min-h-[44px] rounded-lg border border-dashed border-[var(--border-input)] opacity-30" />
                        ) : (
                          <div className="space-y-1">
                            {aulas.map((aula, i) => {
                              const cor = corMap[aula.nome] || CORES[0];
                              const hoje = new Date().toISOString().split('T')[0];
                              const futura = aula.dataInicio && aula.dataInicio > hoje;
                              const dataFormatada = aula.dataInicio
                                ? new Date(aula.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                : null;
                              return (
                                <div
                                  key={i}
                                  className="rounded-lg px-2 py-1.5 border transition-opacity"
                                  style={{
                                    backgroundColor: futura ? 'rgba(255,255,255,0.03)' : cor.bg,
                                    borderColor: futura ? 'rgba(255,255,255,0.08)' : cor.border,
                                    opacity: futura ? 0.6 : 1,
                                    borderStyle: futura ? 'dashed' : 'solid',
                                  }}
                                >
                                  <p
                                    className="text-[11px] font-semibold leading-tight line-clamp-2"
                                    style={{ color: futura ? 'var(--text-muted)' : cor.text }}
                                  >
                                    {aula.nome}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                    {futura ? (
                                      <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                                        <Clock size={8} /> Início {dataFormatada}
                                      </span>
                                    ) : aula.online ? (
                                      <span className="flex items-center gap-0.5 text-[9px] text-cyan-400">
                                        <Monitor size={8} /> Online
                                      </span>
                                    ) : aula.sala ? (
                                      <span className="flex items-center gap-0.5 text-[9px] text-[var(--text-muted)]">
                                        <MapPin size={8} /> {aula.sala}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </GlassCard>
  );
}
