import React, { useCallback } from 'react';
import { Plus, Trash2, TrendingUp, AlertCircle, CheckCircle, GraduationCap, Edit2, RefreshCw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

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
    <div className="space-y-6">
      {/* Card Principal - Previsão */}
      <GlassCard className="p-6" hover={false}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold">Previsão de Formatura</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
            <div className="text-4xl font-bold text-violet-400 mb-1">{previsaoFormatura}</div>
            <div className="text-[var(--text-secondary)] text-sm">Conclusão Prevista</div>
          </div>
          <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="text-4xl font-bold text-amber-400 mb-1">{calcularAnosAteFormar()}</div>
            <div className="text-[var(--text-secondary)] text-sm">Anos até Formar</div>
          </div>
          <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <div className="text-4xl font-bold text-emerald-400 mb-1">{progressoTotal.toFixed(0)}%</div>
            <div className="text-[var(--text-secondary)] text-sm">Progresso do Curso</div>
          </div>
        </div>
      </GlassCard>

      {/* Planejamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Lista Editável */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Edit2 size={20} className="text-[var(--text-secondary)]" />
              Planejamento por Semestre
            </h3>
            <button onClick={resetarPlanejamento} className="text-xs text-[var(--text-secondary)] hover:text-violet-400 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-input)] transition-all">
              <RefreshCw size={14} />Resetar
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {planejamentoSemestres.map((sem, index) => {
              const isAtual = index === 0;
              return (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-xl ${isAtual ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-[var(--bg-input)] border border-[var(--border-input)]'}`}>
                  <div className="flex items-center gap-1">
                    <input type="text" value={sem.periodo} onChange={e => atualizarPeriodo(index, e.target.value)} className={`w-20 px-2 py-1.5 bg-[var(--bg-input)] rounded-lg text-center text-sm font-medium border border-[var(--border-input)] focus:border-violet-500 focus:outline-none ${isAtual ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`} />
                    {isAtual && <span className="text-xs text-blue-400">(atual)</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <button onClick={() => atualizarQuantidade(index, sem.quantidade - 1)} disabled={sem.quantidade <= 0} className="w-8 h-8 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-input)] flex items-center justify-center text-lg font-bold disabled:opacity-30 transition-all">-</button>
                    <input type="number" value={sem.quantidade} onChange={e => atualizarQuantidade(index, parseInt(e.target.value) || 0)} className="w-14 px-2 py-1.5 bg-[var(--bg-input)] rounded-lg text-center font-bold text-lg border border-[var(--border-input)] focus:border-violet-500 focus:outline-none" min="0" max="10" />
                    <button onClick={() => atualizarQuantidade(index, sem.quantidade + 1)} disabled={sem.quantidade >= 10} className="w-8 h-8 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-input)] flex items-center justify-center text-lg font-bold disabled:opacity-30 transition-all">+</button>
                  </div>
                  {planejamentoSemestres.length > 1 && (
                    <button onClick={() => removerSemestre(index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"><Trash2 size={16} /></button>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={adicionarSemestre} className="mt-4 w-full py-3 border-2 border-dashed border-[var(--border-input)] hover:border-violet-500/50 rounded-xl text-[var(--text-secondary)] hover:text-violet-400 flex items-center justify-center gap-2 transition-all">
            <Plus size={18} />Adicionar Semestre
          </button>
        </GlassCard>

        {/* Tabela Resumo */}
        <GlassCard className="p-6" hover={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-[var(--text-secondary)]" />
            Resumo do Planejamento
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-input)]">
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Semestre</th>
                  <th className="text-center py-2 px-3 text-[var(--text-secondary)] font-medium">Qtd</th>
                  <th className="text-center py-2 px-3 text-[var(--text-secondary)] font-medium">Acum.</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3 text-emerald-400">✓ Aprovadas</td>
                  <td className="text-center py-2 px-3 font-bold text-emerald-400">{disciplinasAprovadas}</td>
                  <td className="text-center py-2 px-3 text-[var(--text-secondary)]">{disciplinasAprovadas}</td>
                  <td className="text-right py-2 px-3 text-[var(--text-secondary)]">{totalDisciplinas > 0 ? ((disciplinasAprovadas / totalDisciplinas) * 100).toFixed(0) : 0}%</td>
                </tr>
                {planejamentoSemestres.map((sem, index) => {
                  const acumulado = calcularAcumulado(index);
                  const percentual = totalDisciplinas > 0 ? (acumulado / totalDisciplinas) * 100 : 0;
                  const isAtual = index === 0;
                  return (
                    <tr key={index} className={`border-b border-white/5 ${isAtual ? 'bg-blue-500/5' : ''}`}>
                      <td className={`py-2 px-3 ${isAtual ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`}>{sem.periodo} {isAtual && '(atual)'}</td>
                      <td className="text-center py-2 px-3 font-bold">{sem.quantidade}</td>
                      <td className="text-center py-2 px-3 text-[var(--text-secondary)]">{acumulado}</td>
                      <td className="text-right py-2 px-3 text-[var(--text-secondary)]">{percentual.toFixed(0)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-[var(--bg-input)] font-bold">
                  <td className="py-3 px-3 text-violet-400">Total Planejado</td>
                  <td className="text-center py-3 px-3 text-violet-400">{totalPlanejado}</td>
                  <td className="text-center py-3 px-3">{disciplinasAprovadas + totalPlanejado}</td>
                  <td className="text-right py-3 px-3 text-violet-400">{totalDisciplinas > 0 ? (((disciplinasAprovadas + totalPlanejado) / totalDisciplinas) * 100).toFixed(0) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {disciplinasFaltando > 0 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-amber-400" size={18} />
              <span className="text-sm text-amber-200">Faltam <strong>{disciplinasFaltando}</strong> disciplinas no planejamento</span>
            </div>
          )}
          {disciplinasFaltando < 0 && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-400" size={18} />
              <span className="text-sm text-red-200">Planejamento excede em <strong>{Math.abs(disciplinasFaltando)}</strong> disciplinas</span>
            </div>
          )}
          {disciplinasFaltando === 0 && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
              <CheckCircle className="text-emerald-400" size={18} />
              <span className="text-sm text-emerald-200">Planejamento completo!</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Dica */}
      <GlassCard className="p-4" hover={false}>
        <div className="flex items-start gap-3">
          <AlertCircle className="text-violet-400 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-secondary)]">Dica:</strong> Ajuste a quantidade de disciplinas por semestre usando os botões + e -.
            O sistema calcula automaticamente sua previsão de formatura baseado no planejamento.
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
