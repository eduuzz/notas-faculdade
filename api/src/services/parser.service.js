import { logger } from '../utils/logger.js';

/**
 * Normaliza dados vindos da API TOTVS RM para o formato
 * compatível com a tabela `disciplinas` do app.
 *
 * A API TOTVS retorna dados no formato do RM Educacional.
 * Os campos exatos dependem da configuração da instituição.
 * O parser tenta múltiplos nomes de campo conhecidos.
 *
 * Estrutura conhecida da resposta de GradeCurricular/EnsinoSuperior:
 * {
 *   APRESENTACAOHISTORICO: [...],  // Array de disciplinas com histórico
 *   SHabilitacaoAluno: {...},       // Info da habilitação
 *   SDisciplinaTCC: [...],          // Disciplinas de TCC
 *   SDiscEquivEmCurso: [...],       // Equivalências em curso
 *   SDiscEquivConcluidas: [...],    // Equivalências concluídas
 * }
 */
export class ParserService {
  /**
   * Mapeia status do portal para o formato do app.
   */
  static #mapStatus(raw) {
    if (!raw) return 'NAO_INICIADA';
    const s = raw.toString().toUpperCase().trim();

    if (s.includes('APROV')) return 'APROVADA';
    if (s.includes('REPROV')) return 'REPROVADA';
    if (s.includes('CURS') || s.includes('MATRIC')) return 'EM_CURSO';
    if (s.includes('DISPENS')) return 'APROVADA';
    if (s.includes('TRANCAD')) return 'NAO_INICIADA';

    return 'NAO_INICIADA';
  }

  static #parseNota(value) {
    if (value === null || value === undefined || value === '' || value === '-') return null;
    const num = parseFloat(String(value).replace(',', '.'));
    return isNaN(num) ? null : num;
  }

  static #parseInt(value) {
    if (value === null || value === undefined || value === '') return 0;
    return parseInt(String(value), 10) || 0;
  }

  /**
   * Classifica uma disciplina como obrigatória ou optativa.
   * No TOTVS RM, SUBGRUPO contém "Grupo optativas / eletivas" para optativas.
   */
  static #classifyTipo(item) {
    const subgrupo = item.SUBGRUPO || item.Subgrupo || item.subgrupo || '';
    if (subgrupo && subgrupo.toLowerCase().includes('optativ')) return 'optativa';
    if (subgrupo && subgrupo.toLowerCase().includes('eletiv')) return 'optativa';
    return 'obrigatoria';
  }

  /**
   * Extrai o array de disciplinas de uma resposta TOTVS.
   * A estrutura pode variar - tenta vários caminhos possíveis.
   */
  static #extractDisciplinas(raw) {
    if (!raw) return [];

    // Se já é um array, usar diretamente
    if (Array.isArray(raw)) return raw;

    // Resposta do GradeCurricular/EnsinoSuperior (direto)
    if (raw.APRESENTACAOHISTORICO) return raw.APRESENTACAOHISTORICO;

    // Resposta do GradeCurricular/EnsinoSuperior (aninhado em .data)
    if (raw.data?.APRESENTACAOHISTORICO) return raw.data.APRESENTACAOHISTORICO;

    // DisciplinasAlunoPeriodoLetivo — array dentro de .data
    if (raw.data && Array.isArray(raw.data)) return raw.data;
    if (raw.Data && Array.isArray(raw.Data)) return raw.Data;

    // Campos comuns de outros endpoints TOTVS
    if (raw.Notas && Array.isArray(raw.Notas)) return raw.Notas;
    if (raw.items && Array.isArray(raw.items)) return raw.items;

    // Se é um objeto com campos numéricos (0, 1, 2...), converter para array
    const keys = Object.keys(raw);
    if (keys.length > 0 && keys.every(k => !isNaN(k))) {
      return keys.map(k => raw[k]);
    }

    return [];
  }

  /**
   * Lê um campo de um item TOTVS, tentando múltiplos nomes possíveis.
   */
  static #getField(item, ...fieldNames) {
    for (const name of fieldNames) {
      if (item[name] !== undefined && item[name] !== null) return item[name];
    }
    return null;
  }

  /**
   * Parse de notas do aluno.
   *
   * Aceita dois formatos:
   *   1. { disciplinas, grade, faltas } — vindo do PortalService.fetchNotas (navigate+intercept)
   *      - disciplinas: DisciplinasAlunoPeriodoLetivo (disciplinas do semestre atual)
   *      - grade: GradeCurricular/EnsinoSuperior com APRESENTACAOHISTORICO (fallback)
   *   2. Formato legado: array direto ou objeto com campo de dados
   *
   * Campos reais do APRESENTACAOHISTORICO (TOTVS RM Educacional):
   *   CODDISC, DISCIPLINA, STATUS, PLETIVO, NOTA, FALTAS, NUMCREDITOS, CH, IDTURMADISC
   */
  static parseNotas(raw) {
    if (!raw) return [];

    // Formato novo: { disciplinas, grade, faltas }
    if ('grade' in raw || 'disciplinas' in raw) {
      const { disciplinas, grade } = raw;

      // Tenta DisciplinasAlunoPeriodoLetivo primeiro (semestre atual)
      let items = disciplinas ? this.#extractDisciplinas(disciplinas) : [];

      // Fallback: filtra APRESENTACAOHISTORICO pelo status "Em Curso"
      if (items.length === 0 && grade) {
        const allDisc = this.#extractDisciplinas(grade);
        items = allDisc.filter(d => {
          const s = String(d.STATUS || d.SITUACAO || '').toUpperCase();
          return s.includes('CURS') || s.includes('MATRIC');
        });
      }

      if (items.length === 0) {
        logger.warn('parseNotas: nenhuma disciplina em curso encontrada');
        return [];
      }

      return items.map(item => ({
        codigo: this.#getField(item,
          'CODDISC', 'CodDisc', 'codDisc', 'codigo', 'CODIGO',
          'CODDISCIPLINA', 'CodDisciplina') || '',
        nome: this.#getField(item,
          'DISCIPLINA', 'Disciplina', 'NOMEDISC', 'NomeDisc', 'nome', 'NOME',
          'DESCRICAO', 'Descricao') || '',
        ga: this.#parseNota(this.#getField(item,
          'NOTA1', 'Nota1', 'GA', 'ga', 'ETAPA1', 'Etapa1')),
        gb: this.#parseNota(this.#getField(item,
          'NOTA2', 'Nota2', 'GB', 'gb', 'ETAPA2', 'Etapa2')),
        notaFinal: this.#parseNota(this.#getField(item,
          'NOTA', 'NOTAFINAL', 'NotaFinal', 'MEDIA', 'Media', 'MEDIAFINAL')),
        faltas: this.#parseInt(this.#getField(item,
          'FALTAS', 'Faltas', 'NROFALTAS', 'NroFaltas', 'TOTALFALTAS')),
        // DisciplinasAlunoPeriodoLetivo usa DESCRICAO para o status ("Matriculado")
        status: this.#mapStatus(this.#getField(item,
          'STATUS', 'Status', 'SITUACAO', 'Situacao', 'DESCSITUACAO', 'DESCRICAO')),
        semestreCursado: this.#getField(item,
          'PLETIVO', 'PERIODO', 'Periodo', 'SEMESTRE', 'PERIODOCURSADO') || null,
      }));
    }

    // Formato legado: { notas, faltas, grade } ou array direto
    const notasRaw = raw.notas || raw;
    const disciplinas = this.#extractDisciplinas(notasRaw);

    if (disciplinas.length === 0) {
      logger.warn('parseNotas: nenhuma disciplina encontrada');
      return [];
    }

    return disciplinas.map(item => ({
      codigo: this.#getField(item,
        'CODDISC', 'CodDisc', 'codDisc', 'codigo', 'CODIGO',
        'CODDISCIPLINA', 'CodDisciplina') || '',
      nome: this.#getField(item,
        'DISCIPLINA', 'Disciplina', 'NOMEDISC', 'NomeDisc', 'nome', 'NOME',
        'DESCRICAO', 'Descricao') || '',
      ga: this.#parseNota(this.#getField(item,
        'NOTA1', 'Nota1', 'nota1', 'GA', 'ga', 'ETAPA1', 'Etapa1')),
      gb: this.#parseNota(this.#getField(item,
        'NOTA2', 'Nota2', 'nota2', 'GB', 'gb', 'ETAPA2', 'Etapa2')),
      notaFinal: this.#parseNota(this.#getField(item,
        'NOTA', 'NOTAFINAL', 'NotaFinal', 'notaFinal', 'MEDIA', 'Media',
        'MEDIAFINAL', 'MediaFinal')),
      faltas: this.#parseInt(this.#getField(item,
        'FALTAS', 'Faltas', 'faltas', 'NROFALTAS', 'NroFaltas',
        'TOTALFALTAS', 'TotalFaltas')),
      status: this.#mapStatus(this.#getField(item,
        'SITUACAO', 'Situacao', 'situacao', 'STATUS', 'Status',
        'DESCSITUACAO', 'DescSituacao')),
      semestreCursado: this.#getField(item,
        'PLETIVO', 'PERIODO', 'Periodo', 'periodo', 'SEMESTRE',
        'PERIODOCURSADO', 'PeriodoCursado') || null,
    }));
  }

  /**
   * Parse do histórico acadêmico.
   * Recebe dados de GradeCurricular/EnsinoSuperior que contém APRESENTACAOHISTORICO.
   */
  static parseHistorico(raw) {
    if (!raw) return [];

    const disciplinas = this.#extractDisciplinas(raw);

    if (disciplinas.length === 0) {
      logger.warn('parseHistorico: nenhuma disciplina encontrada');
      return [];
    }

    return disciplinas.map(item => ({
      codigo: this.#getField(item,
        'CODDISC', 'CodDisc', 'codDisc', 'codigo', 'CODIGO') || '',
      nome: this.#getField(item,
        'DISCIPLINA', 'Disciplina', 'NOMEDISC', 'NomeDisc', 'nome', 'NOME',
        'DESCRICAO') || '',
      creditos: this.#parseInt(this.#getField(item,
        'NUMCREDITOS', 'NumCreditos', 'CREDITOS', 'Creditos', 'creditos')),
      cargaHoraria: this.#parseInt(this.#getField(item,
        'CH', 'CARGAHORARIA', 'CargaHoraria', 'cargaHoraria',
        'HORASAULA', 'HorasAula', 'horasAula')),
      notaFinal: this.#parseNota(this.#getField(item,
        'NOTA', 'NOTAFINAL', 'NotaFinal', 'notaFinal', 'MEDIA', 'Media',
        'MEDIAFINAL', 'MediaFinal')),
      status: this.#mapStatus(this.#getField(item,
        'STATUS', 'Status', 'SITUACAO', 'Situacao', 'situacao',
        'DESCSITUACAO', 'DescSituacao')),
      semestreCursado: this.#getField(item,
        'PLETIVO', 'PERIODO', 'Periodo', 'periodo', 'SEMESTRE',
        'PERIODOCURSADO', 'PeriodoCursado') || null,
      periodo: this.#parseInt(this.#getField(item,
        'CODPERIODO', 'NUMPERIODO', 'NumPeriodo', 'numPeriodo',
        'PERIODO_GRADE', 'PeriodoGrade', 'SEMESTRE_GRADE')),
      tipo: this.#classifyTipo(item),
    }));
  }

  /**
   * Parse da grade curricular (cadeiras do curso).
   * Recebe dados de GradeCurricular/EnsinoSuperior.
   */
  static parseCadeiras(raw) {
    if (!raw) return [];

    const disciplinas = this.#extractDisciplinas(raw);

    if (disciplinas.length === 0) {
      logger.warn('parseCadeiras: nenhuma disciplina encontrada');
      return [];
    }

    return disciplinas.map(item => ({
      codigo: this.#getField(item,
        'CODDISC', 'CodDisc', 'codDisc', 'codigo', 'CODIGO') || '',
      nome: this.#getField(item,
        'DISCIPLINA', 'Disciplina', 'NOMEDISC', 'NomeDisc', 'nome', 'NOME',
        'DESCRICAO') || '',
      creditos: this.#parseInt(this.#getField(item,
        'NUMCREDITOS', 'NumCreditos', 'CREDITOS', 'Creditos', 'creditos')),
      cargaHoraria: this.#parseInt(this.#getField(item,
        'CH', 'CARGAHORARIA', 'CargaHoraria', 'cargaHoraria',
        'HORASAULA', 'HorasAula', 'horasAula')),
      periodo: this.#parseInt(this.#getField(item,
        'CODPERIODO', 'NUMPERIODO', 'NumPeriodo', 'numPeriodo',
        'PERIODO_GRADE', 'PeriodoGrade', 'SEMESTRE_GRADE')) || 1,
      notaMinima: 6.0,
      status: this.#mapStatus(this.#getField(item,
        'STATUS', 'Status', 'SITUACAO', 'Situacao', 'situacao',
        'DESCSITUACAO', 'DescSituacao')),
    }));
  }
}
