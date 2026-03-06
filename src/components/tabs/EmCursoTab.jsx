import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Edit2, Calculator, MapPin, Monitor, CalendarDays, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { STATUS } from '../ui/STATUS';
import GlassCard from '../ui/GlassCard';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { useAuth } from '../../AuthContext';

const DIAS_LABEL = { dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb' };

export default function EmCursoTab({ disciplinas, setShowSimulador, startEditNotas, horarios, onSaveHorarios, recentlyUpdated = new Set() }) {
  const { supabase } = useAuth();
  const emCurso = disciplinas.filter(d => d.status === 'EM_CURSO');

  const [showHorarioForm, setShowHorarioForm] = useState(false);
  const [ra, setRa] = useState('');
  const [senha, setSenha] = useState('');
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [horarioError, setHorarioError] = useState('');
  const [horarioSuccess, setHorarioSuccess] = useState('');
  const [showSenha, setShowSenha] = useState(false);

  // Map codDisc/nome → horario info for quick lookup
  const horarioMap = useMemo(() => {
    if (!horarios || horarios.length === 0) return {};
    const map = {};
    for (const h of horarios) {
      if (h.codDisc) map[h.codDisc] = h;
      if (h.nome) map[h.nome.toLowerCase().trim()] = h;
    }
    return map;
  }, [horarios]);

  const temHorarios = horarios && horarios.length > 0;

  const handleBuscarHorarios = async () => {
    if (!ra.trim() || !senha) return;
    setLoadingHorarios(true);
    setHorarioError('');
    setHorarioSuccess('');

    try {
      let token = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/portal/horarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ra: ra.trim(), senha }),
        signal: AbortSignal.timeout(180000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        throw new Error(msg || 'Erro ao buscar horários');
      }

      const json = await res.json();
      if (json.data && json.data.length > 0) {
        onSaveHorarios(json.data);
        setHorarioSuccess(`${json.data.length} disciplinas com horários carregados`);
        setSenha('');
        setTimeout(() => {
          setShowHorarioForm(false);
          setHorarioSuccess('');
        }, 2000);
      } else {
        setHorarioError('Nenhum horário encontrado');
      }
    } catch (err) {
      setHorarioError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoadingHorarios(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Disciplinas em Curso</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHorarioForm(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              showHorarioForm
                ? 'bg-cyan-700 hover:bg-cyan-800 text-white'
                : 'bg-[var(--bg-input)] hover:bg-[var(--border-input)] text-[var(--text-secondary)] border border-[var(--border-input)]'
            }`}
          >
            <CalendarDays size={16} />
            <span className="hidden sm:inline">Horários</span>
          </button>
          <button
            onClick={() => setShowSimulador(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Calculator size={16} />
            <span className="hidden sm:inline">Simulador</span>
          </button>
        </div>
      </div>

      {/* Inline horario fetch form */}
      <AnimatePresence>
        {showHorarioForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="p-4" hover={false}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  {temHorarios ? 'Atualizar Horários do Portal' : 'Buscar Horários do Portal'}
                </h3>
                <button onClick={() => setShowHorarioForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="RA (login)"
                  value={ra}
                  onChange={e => setRa(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md text-sm bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                />
                <div className="flex-1 relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    placeholder="Senha"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBuscarHorarios()}
                    className="w-full px-3 py-2 pr-9 rounded-md text-sm bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={handleBuscarHorarios}
                  disabled={loadingHorarios || !ra.trim() || !senha}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center whitespace-nowrap"
                >
                  {loadingHorarios ? <><Loader2 size={14} className="animate-spin" /> Buscando...</> : 'Buscar'}
                </button>
              </div>
              {horarioError && <p className="text-xs text-red-400 mt-2">{horarioError}</p>}
              {horarioSuccess && <p className="text-xs text-emerald-400 mt-2">{horarioSuccess}</p>}
              {temHorarios && !horarioError && !horarioSuccess && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {horarios.length} disciplinas com horários carregados
                </p>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {emCurso.length === 0 ? (
        <GlassCard className="p-8 text-center" hover={false}>
          <Clock size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)] text-sm">Nenhuma disciplina em curso</p>
        </GlassCard>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
        {emCurso.map(disc => {
          const status = STATUS[disc.status];
          const horario = horarioMap[disc.codigo] || horarioMap[disc.nome?.toLowerCase().trim()];
          // Deduplicate aulas by dia+inicio (TOTVS returns per-date entries)
          const aulasUnicas = horario?.aulas
            ? Object.values(
                horario.aulas.reduce((acc, a) => {
                  const key = `${a.dia}-${a.inicio}`;
                  if (!acc[key]) acc[key] = a;
                  return acc;
                }, {})
              )
            : [];

          const isUpdated = recentlyUpdated.has(disc.id);
          return (
            <motion.div key={disc.id} variants={staggerItem}>
            <GlassCard className={`group cursor-pointer ${isUpdated ? '!border-blue-500/40 !bg-blue-500/5' : ''}`} hover={false} onClick={() => startEditNotas(disc)}>
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${status.bar}`} />
              <div className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm truncate">
                    {isUpdated && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 align-middle" />}
                    {disc.nome}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] text-[var(--text-muted)]">{disc.periodo}º Sem · {disc.creditos} cred</p>
                    {aulasUnicas.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <span className="text-[var(--border-input)]">·</span>
                        {aulasUnicas.map((a, i) => {
                          const isOnline = !a.sala && !a.predio;
                          return (
                            <span key={i} className="flex items-center gap-0.5">
                              {DIAS_LABEL[a.dia]} {a.inicio}
                              {isOnline
                                ? <Monitor size={9} className="text-cyan-400 ml-0.5" />
                                : a.sala && <span className="text-[var(--text-muted)] ml-0.5">({a.sala})</span>
                              }
                              {i < aulasUnicas.length - 1 && <span className="text-[var(--border-input)] mx-0.5">·</span>}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-medium">{disc.ga ?? '-'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">GA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{disc.gb ?? '-'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">GB</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{disc.notaFinal ?? '-'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Final</p>
                  </div>
                  <Edit2 size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                </div>
              </div>
            </GlassCard>
            </motion.div>
          );
        })}
        </motion.div>
      )}
    </div>
  );
}
