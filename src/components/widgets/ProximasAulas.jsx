import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Monitor } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { staggerItem } from '../../utils/animations';

const DIAS_NOME = {
  dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta',
  qui: 'Quinta', sex: 'Sexta', sab: 'Sábado',
};

const DIAS_ORDEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

/**
 * Widget que mostra as próximas aulas do dia ou semana.
 * Recebe `horarios` no formato retornado por parseHorarios:
 * [{ codDisc, nome, codTurma, aulas: [{ dia, inicio, fim, data, sala, predio, bloco, online }] }]
 */
export default function ProximasAulas({ horarios }) {
  const { aulasHoje, aulasAmanha, proximaAula } = useMemo(() => {
    if (!horarios || horarios.length === 0) return { aulasHoje: [], aulasAmanha: [], proximaAula: null };

    const now = new Date();
    const hojeStr = now.toISOString().split('T')[0];
    const amanha = new Date(now);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    const hojeDia = DIAS_ORDEM[now.getDay()];
    const amanhaDia = DIAS_ORDEM[amanha.getDay()];
    const horaAtual = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Flatten all aulas with discipline info
    const todasAulas = [];
    for (const disc of horarios) {
      for (const aula of disc.aulas) {
        todasAulas.push({ ...aula, nome: disc.nome, codDisc: disc.codDisc });
      }
    }

    // Match by day of week, respecting date range if available
    const filtrarPorDia = (dia, dataStr) => {
      return todasAulas.filter(a => {
        if (a.dia !== dia) return false;
        if (a.data && a.dataFim) return dataStr >= a.data && dataStr <= a.dataFim;
        if (a.data) return dataStr >= a.data;
        return true;
      });
    };

    let aulasHoje = filtrarPorDia(hojeDia, hojeStr)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    let aulasAmanha = filtrarPorDia(amanhaDia, amanhaStr)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    // Próxima aula: primeira do dia que ainda não passou
    const proxima = aulasHoje.find(a => a.fim > horaAtual) || null;

    return { aulasHoje, aulasAmanha, proximaAula: proxima };
  }, [horarios]);

  if (!horarios || horarios.length === 0) return null;

  const temAulasHoje = aulasHoje.length > 0;
  const temAulasAmanha = aulasAmanha.length > 0;

  if (!temAulasHoje && !temAulasAmanha) return null;

  return (
    <motion.div variants={staggerItem}>
      <GlassCard className="p-5" hover={false}>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          {temAulasHoje ? 'Aulas de Hoje' : 'Aulas de Amanhã'}
        </h3>

        <div className="space-y-3">
          {(temAulasHoje ? aulasHoje : aulasAmanha).map((aula, i) => {
            const isProxima = temAulasHoje && proximaAula && aula.inicio === proximaAula.inicio && aula.nome === proximaAula.nome;
            const isOnline = !aula.sala && !aula.predio;

            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                  isProxima
                    ? 'bg-[var(--accent-bg10)] border border-[var(--accent-ring)]'
                    : 'bg-[var(--bg-input)] border border-[var(--border-input)]'
                }`}
              >
                {/* Horário */}
                <div className="flex flex-col items-center min-w-[50px]">
                  <span className={`text-sm font-bold tabular-nums ${isProxima ? 'text-[var(--accent-400)]' : 'text-[var(--text-primary)]'}`}>
                    {aula.inicio}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">{aula.fim}</span>
                </div>

                {/* Separador vertical */}
                <div className={`w-0.5 self-stretch rounded-full ${isProxima ? 'bg-[var(--accent-400)]' : 'bg-[var(--border-input)]'}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isProxima && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-500)] text-white font-medium shrink-0">
                        AGORA
                      </span>
                    )}
                    <p className={`text-sm font-medium truncate ${isProxima ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                      {aula.nome}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    {isOnline ? (
                      <span className="flex items-center gap-1 text-xs text-cyan-400">
                        <Monitor size={11} /> Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <MapPin size={11} /> {aula.sala || aula.predio || 'Presencial'}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Resumo de amanhã se hoje tem aulas */}
        {temAulasHoje && temAulasAmanha && (
          <div className="mt-3 pt-3 border-t border-[var(--border-input)]">
            <p className="text-xs text-[var(--text-muted)]">
              Amanhã: {aulasAmanha.length} aula{aulasAmanha.length > 1 ? 's' : ''} — {aulasAmanha[0].inicio}
              {aulasAmanha.length > 1 && ` a ${aulasAmanha[aulasAmanha.length - 1].fim}`}
            </p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
