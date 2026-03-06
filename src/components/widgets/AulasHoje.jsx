import React, { useMemo } from 'react';
import { Clock, MapPin, Monitor, Coffee, ChevronRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const DIAS_ORDEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DIAS_NOME = { dom: 'Domingo', seg: 'Segunda-feira', ter: 'Terça-feira', qua: 'Quarta-feira', qui: 'Quinta-feira', sex: 'Sexta-feira', sab: 'Sábado' };

function getAulaModalidade(aula, discKey) {
  try {
    const overrides = JSON.parse(localStorage.getItem('aulaModalidadeOverrides') || '{}');
    const key = `${discKey}|${aula.dia}|${aula.inicio}`;
    if (overrides[key] !== undefined) return overrides[key]; // true = online, false = presencial
  } catch {}
  return !aula.sala && !aula.predio; // auto-detect
}

function deduplicar(aulas) {
  const map = {};
  for (const a of aulas) {
    const key = `${a.nome}|${a.dia}|${a.inicio}`;
    if (!map[key]) map[key] = a;
  }
  return Object.values(map).sort((a, b) => a.inicio.localeCompare(b.inicio));
}

function AulaCard({ aula, isProxima }) {
  const discKey = aula.nome?.toLowerCase().trim();
  const online = getAulaModalidade(aula, discKey);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
      isProxima
        ? 'bg-[var(--accent-bg10)] border border-[var(--accent-ring)]'
        : 'bg-[var(--bg-input)] border border-[var(--border-input)]'
    }`}>
      <div className="flex flex-col items-center min-w-[44px]">
        <span className={`text-sm font-bold tabular-nums ${isProxima ? 'text-[var(--accent-400)]' : 'text-[var(--text-primary)]'}`}>
          {aula.inicio}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">{aula.fim}</span>
      </div>
      <div className={`w-0.5 self-stretch rounded-full ${isProxima ? 'bg-[var(--accent-400)]' : 'bg-[var(--border-input)]'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isProxima && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-500)] text-white font-medium shrink-0">
              PRÓXIMA
            </span>
          )}
          <p className="text-sm font-medium truncate text-[var(--text-primary)]">{aula.nome}</p>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {online ? (
            <span className="flex items-center gap-1 text-[11px] text-cyan-400">
              <Monitor size={11} /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <MapPin size={11} /> {aula.sala || aula.predio || 'Presencial'}
            </span>
          )}
        </div>
      </div>
      {isProxima && <ChevronRight size={14} className="text-[var(--accent-400)] shrink-0 self-center" />}
    </div>
  );
}

function DiaColumn({ titulo, aulas, proximaAula, semAulaMsg }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-[var(--text-muted)] tracking-wider mb-2.5">{titulo}</p>
      {aulas.length > 0 ? (
        <div className="space-y-2">
          {aulas.map((aula, i) => (
            <AulaCard
              key={i}
              aula={aula}
              isProxima={proximaAula && aula.inicio === proximaAula.inicio && aula.nome === proximaAula.nome}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-4 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)]">
          <Coffee size={18} className="text-[var(--text-muted)] shrink-0" />
          <p className="text-sm text-[var(--text-muted)]">{semAulaMsg}</p>
        </div>
      )}
    </div>
  );
}

export default function AulasHoje({ horarios }) {
  const { aulasHoje, aulasAmanha, proximaAula, hojeDia, amanhaDia } = useMemo(() => {
    if (!horarios || horarios.length === 0) return { aulasHoje: [], aulasAmanha: [], proximaAula: null, hojeDia: 'seg', amanhaDia: 'ter' };

    const now = new Date();
    const hojeStr = now.toISOString().split('T')[0];
    const amanha = new Date(now);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    const hojeDia = DIAS_ORDEM[now.getDay()];
    const amanhaDia = DIAS_ORDEM[amanha.getDay()];
    const horaAtual = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todasAulas = [];
    for (const disc of horarios) {
      for (const aula of disc.aulas) {
        todasAulas.push({ ...aula, nome: disc.nome, codDisc: disc.codDisc });
      }
    }

    const filtrarPorDia = (dia, dataStr) =>
      todasAulas.filter(a => a.data ? a.data === dataStr : a.dia === dia);

    const aulasHoje = deduplicar(filtrarPorDia(hojeDia, hojeStr));
    const aulasAmanha = deduplicar(filtrarPorDia(amanhaDia, amanhaStr));
    const proxima = aulasHoje.find(a => a.fim > horaAtual) || null;

    return { aulasHoje, aulasAmanha, proximaAula: proxima, hojeDia, amanhaDia };
  }, [horarios]);

  if (!horarios || horarios.length === 0) return null;

  return (
    <GlassCard className="p-5" hover={false}>
      <div className="flex flex-col sm:flex-row gap-5">
        <DiaColumn
          titulo={`HOJE — ${DIAS_NOME[hojeDia]}`}
          aulas={aulasHoje}
          proximaAula={proximaAula}
          semAulaMsg="Sem aulas hoje, pode descansar!"
        />
        <div className="hidden sm:block w-px bg-[var(--border-input)] shrink-0" />
        <div className="sm:hidden border-t border-[var(--border-input)]" />
        <DiaColumn
          titulo={`AMANHÃ — ${DIAS_NOME[amanhaDia]}`}
          aulas={aulasAmanha}
          proximaAula={null}
          semAulaMsg="Sem aulas amanhã, aproveite!"
        />
      </div>
    </GlassCard>
  );
}
