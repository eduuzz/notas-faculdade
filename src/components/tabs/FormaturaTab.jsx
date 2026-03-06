import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, TrendingUp, AlertCircle, CheckCircle, GraduationCap, Edit2, RefreshCw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { staggerContainer, staggerItem } from '../../utils/animations';

export default function FormaturaTab({
  disciplinas,
  semestreAtualAno,
  semestreAtualNum,
  planejamentoSemestres, setPlanejamentoSemestres,
}) {
  const obrigatorias = disciplinas.filter(d => d.tipo !== 'optativa');
  const disciplinasAprovadas = obrigatorias.filter(d => d.status === 'APROVADA').length;
  const disciplinasEmCurso = obrigatorias.filter(d => d.status === 'EM_CURSO').length;
  const disciplinasRestantes = obrigatorias.filter(d => d.status === 'NAO_INICIADA').length;
  const totalDisciplinas = obrigatorias.length;
  const disciplinasParaConcluir = disciplinasRestantes + disciplinasEmCurso;

  const gerarProximoPeriodo = (ano, sem) => {
    sem++;
    if (sem > 2) { sem = 1; ano++; }
    return { ano, sem };
  };

  const periodoString = (ano, sem) => `${ano}/${sem}`;

  const inicializarPlanejamento = useCallback(() => {
    if (planejamentoSemestres.length > 0) return;
    const novoPlano = [];
    let ano = semestreAtualAno;
    let sem = semestreAtualNum;
    let restantes = disciplinasParaConcluir;

    if (disciplinasEmCurso > 0) {
      novoPlano.push({ periodo: periodoString(ano, sem), quantidade: disciplinasEmCurso, tipo: 'atual' });
      restantes -= disciplinasEmCurso;
      const prox = gerarProximoPeriodo(ano, sem);
      ano = prox.ano;
      sem = prox.sem;
    }

    while (restantes > 0) {
      const qtd = Math.min(6, restantes);
      novoPlano.push({ periodo: periodoString(ano, sem), quantidade: qtd, tipo: 'futuro' });
      restantes -= qtd;
      const prox = gerarProximoPeriodo(ano, sem);
      ano = prox.ano;
      sem = prox.sem;
    }

    setPlanejamentoSemestres(novoPlano);
  }, [planejamentoSemestres.length, semestreAtualAno, semestreAtualNum, disciplinasParaConcluir, disciplinasEmCurso, setPlanejamentoSemestres]);

  if (planejamentoSemestres.length === 0 && disciplinasParaConcluir > 0) {
    inicializarPlanejamento();
  }

  const totalPlanejado = planejamentoSemestres.reduce((acc, s) => acc + s.quantidade, 0);
  const disciplinasFaltando = disciplinasParaConcluir - totalPlanejado;

  const atualizarQuantidade = (index, novaQtd) => {
    const novoPlano = [...planejamentoSemestres];
    novoPlano[index].quantidade = Math.max(0, Math.min(10, novaQtd));
    setPlanejamentoSemestres(novoPlano);
  };

  const atualizarPeriodo = (index, novoPeriodo) => {
    const novoPlano = [...planejamentoSemestres];
    novoPlano[index].periodo = novoPeriodo;
    setPlanejamentoSemestres(novoPlano);
  };

  const adicionarSemestre = () => {
    if (planejamentoSemestres.length === 0) {
      setPlanejamentoSemestres([{ periodo: periodoString(semestreAtualAno, semestreAtualNum), quantidade: 6, tipo: 'futuro' }]);
      return;
    }
    const ultimo = planejamentoSemestres[planejamentoSemestres.length - 1];
    const [ano, sem] = ultimo.periodo.split('/').map(Number);
    const prox = gerarProximoPeriodo(ano, sem);
    setPlanejamentoSemestres([...planejamentoSemestres, { periodo: periodoString(prox.ano, prox.sem), quantidade: Math.min(6, Math.max(0, disciplinasFaltando)), tipo: 'futuro' }]);
  };

  const removerSemestre = (index) => {
    if (planejamentoSemestres.length <= 1) return;
    setPlanejamentoSemestres(planejamentoSemestres.filter((_, i) => i !== index));
  };

  const resetarPlanejamento = () => {
    setPlanejamentoSemestres([]);
    setTimeout(inicializarPlanejamento, 100);
  };

  const semestresComDisciplinas = planejamentoSemestres.filter(s => s.quantidade > 0);
  const previsaoFormatura = semestresComDisciplinas.length > 0 ? semestresComDisciplinas[semestresComDisciplinas.length - 1].periodo : '-';

  const calcularAnosAteFormar = () => {
    if (semestresComDisciplinas.length === 0) return '0';
    const primeiro = semestresComDisciplinas[0].periodo;
    const ultimo = semestresComDisciplinas[semestresComDisciplinas.length - 1].periodo;
    const [anoInicio, semInicio] = primeiro.split('/').map(Number);
    const [anoFim, semFim] = ultimo.split('/').map(Number);
    const diferenca = (anoFim * 2 + semFim) - (anoInicio * 2 + semInicio) + 1;
    const anos = diferenca / 2;
    return anos % 1 === 0 ? anos.toString() : anos.toFixed(1);
  };

  const progressoTotal = totalDisciplinas > 0 ? ((disciplinasAprovadas / totalDisciplinas) * 100) : 0;

  const calcularAcumulado = (index) => {
    let acum = disciplinasAprovadas;
    for (let i = 0; i <= index; i++) { acum += planejamentoSemestres[i].quantidade; }
    return acum;
  };

  return (
    <motion.div className="space-y-5" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div variants={staggerItem}><GlassCard className="p-5" hover={false}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-bg10)] flex items-center justify-center">
            <GraduationCap size={20} style={{ color: 'var(--accent-400)' }} />
          </div>
          <h3 className="text-base font-semibold">Previsão de Formatura</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-md bg-[var(--accent-bg10)] border border-[var(--accent-ring)]">
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-400)' }}>{previsaoFormatura}</div>
            <div className="text-[var(--text-muted)] text-xs">Conclusão Prevista</div>
          </div>
          <div className="text-center p-4 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]">
            <div className="text-3xl font-bold text-amber-400 mb-1">{calcularAnosAteFormar()}</div>
            <div className="text-[var(--text-muted)] text-xs">Anos até Formar</div>
          </div>
          <div className="text-center p-4 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]">
            <div className="text-3xl font-bold text-emerald-400 mb-1">{progressoTotal.toFixed(0)}%</div>
            <div className="text-[var(--text-muted)] text-xs">Progresso do Curso</div>
          </div>
        </div>
      </GlassCard></motion.div>

      <motion.div variants={staggerItem}><div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
              <Edit2 size={16} />
              Planejamento por Semestre
            </h3>
            <button onClick={resetarPlanejamento} className="text-xs text-[var(--text-muted)] flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors">
              <RefreshCw size={12} />Resetar
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {planejamentoSemestres.map((sem, index) => {
              const isAtual = index === 0;
              return (
                <div key={index} className={`flex items-center gap-2 p-2.5 rounded-md ${isAtual ? 'bg-blue-500/8 border border-blue-500/20' : 'bg-[var(--bg-input)] border border-[var(--border-input)]'}`}>
                  <div className="flex items-center gap-1">
                    <input type="text" value={sem.periodo} onChange={e => atualizarPeriodo(index, e.target.value)} className={`w-18 px-2 py-1 bg-[var(--bg-input)] rounded-md text-center text-sm font-medium border border-[var(--border-input)] focus:border-[var(--accent-500)] focus:outline-none ${isAtual ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`} />
                    {isAtual && <span className="text-[10px] text-blue-400">(atual)</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <button onClick={() => atualizarQuantidade(index, sem.quantidade - 1)} disabled={sem.quantidade <= 0} className="w-7 h-7 rounded-md bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-input)] flex items-center justify-center text-sm font-bold disabled:opacity-30 transition-colors">-</button>
                    <input type="number" value={sem.quantidade} onChange={e => atualizarQuantidade(index, parseInt(e.target.value) || 0)} className="w-12 px-1 py-1 bg-[var(--bg-input)] rounded-md text-center font-bold text-base border border-[var(--border-input)] focus:border-[var(--accent-500)] focus:outline-none" min="0" max="10" />
                    <button onClick={() => atualizarQuantidade(index, sem.quantidade + 1)} disabled={sem.quantidade >= 10} className="w-7 h-7 rounded-md bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-input)] flex items-center justify-center text-sm font-bold disabled:opacity-30 transition-colors">+</button>
                  </div>
                  {planejamentoSemestres.length > 1 && (
                    <button onClick={() => removerSemestre(index)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={adicionarSemestre} className="mt-3 w-full py-2.5 border border-dashed border-[var(--border-input)] rounded-md text-[var(--text-muted)] text-sm flex items-center justify-center gap-1.5 hover:border-[var(--accent-ring)] hover:text-[var(--accent-400)] transition-colors">
            <Plus size={16} />Adicionar Semestre
          </button>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <TrendingUp size={16} />
            Resumo do Planejamento
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-input)]">
                  <th className="text-left py-2 px-2 text-[var(--text-muted)] text-xs font-medium">Semestre</th>
                  <th className="text-center py-2 px-2 text-[var(--text-muted)] text-xs font-medium">Qtd</th>
                  <th className="text-center py-2 px-2 text-[var(--text-muted)] text-xs font-medium">Acum.</th>
                  <th className="text-right py-2 px-2 text-[var(--text-muted)] text-xs font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border-card)]">
                  <td className="py-2 px-2 text-emerald-400 text-xs">Aprovadas</td>
                  <td className="text-center py-2 px-2 font-bold text-emerald-400">{disciplinasAprovadas}</td>
                  <td className="text-center py-2 px-2 text-[var(--text-muted)]">{disciplinasAprovadas}</td>
                  <td className="text-right py-2 px-2 text-[var(--text-muted)]">{totalDisciplinas > 0 ? ((disciplinasAprovadas / totalDisciplinas) * 100).toFixed(0) : 0}%</td>
                </tr>
                {planejamentoSemestres.map((sem, index) => {
                  const acumulado = calcularAcumulado(index);
                  const percentual = totalDisciplinas > 0 ? (acumulado / totalDisciplinas) * 100 : 0;
                  const isAtual = index === 0;
                  return (
                    <tr key={index} className={`border-b border-[var(--border-card)] ${isAtual ? 'bg-blue-500/5' : ''}`}>
                      <td className={`py-2 px-2 text-xs ${isAtual ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`}>{sem.periodo} {isAtual && '(atual)'}</td>
                      <td className="text-center py-2 px-2 font-bold">{sem.quantidade}</td>
                      <td className="text-center py-2 px-2 text-[var(--text-muted)]">{acumulado}</td>
                      <td className="text-right py-2 px-2 text-[var(--text-muted)]">{percentual.toFixed(0)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-[var(--bg-input)] font-bold">
                  <td className="py-2.5 px-2 text-xs" style={{ color: 'var(--accent-400)' }}>Total Planejado</td>
                  <td className="text-center py-2.5 px-2" style={{ color: 'var(--accent-400)' }}>{totalPlanejado}</td>
                  <td className="text-center py-2.5 px-2">{disciplinasAprovadas + totalPlanejado}</td>
                  <td className="text-right py-2.5 px-2" style={{ color: 'var(--accent-400)' }}>{totalDisciplinas > 0 ? (((disciplinasAprovadas + totalPlanejado) / totalDisciplinas) * 100).toFixed(0) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {disciplinasFaltando > 0 && (
            <div className="mt-3 p-2.5 bg-amber-500/8 border border-amber-500/20 rounded-md flex items-center gap-2">
              <AlertCircle className="text-amber-400 shrink-0" size={16} />
              <span className="text-xs text-amber-300">Faltam <strong>{disciplinasFaltando}</strong> disciplinas no planejamento</span>
            </div>
          )}
          {disciplinasFaltando < 0 && (
            <div className="mt-3 p-2.5 bg-red-500/8 border border-red-500/20 rounded-md flex items-center gap-2">
              <AlertCircle className="text-red-400 shrink-0" size={16} />
              <span className="text-xs text-red-300">Planejamento excede em <strong>{Math.abs(disciplinasFaltando)}</strong> disciplinas</span>
            </div>
          )}
          {disciplinasFaltando === 0 && (
            <div className="mt-3 p-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-md flex items-center gap-2">
              <CheckCircle className="text-emerald-400 shrink-0" size={16} />
              <span className="text-xs text-emerald-300">Planejamento completo!</span>
            </div>
          )}
        </GlassCard>
      </div></motion.div>

      <motion.div variants={staggerItem}><GlassCard className="p-3.5" hover={false}>
        <div className="flex items-start gap-2.5">
          <AlertCircle className="shrink-0 mt-0.5" size={16} style={{ color: 'var(--accent-400)' }} />
          <p className="text-xs text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">Dica:</strong> Ajuste a quantidade de disciplinas por semestre usando os botões + e -.
            O sistema calcula automaticamente sua previsão de formatura baseado no planejamento.
          </p>
        </div>
      </GlassCard></motion.div>
    </motion.div>
  );
}
