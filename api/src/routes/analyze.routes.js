import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';

const router = Router();

const SYSTEM_PROMPT = `Analise este texto de grade curricular universitária e extraia as disciplinas.

ESTRUTURA DO PDF:
- "Seq." = Semestre (1-8 para obrigatórias, 9+ ou "Trilha X" para optativas/trilhas)
- "N." = Código da disciplina (número de 5 dígitos, ex: 60963)
- "Atividades Acadêmicas" = Nome da disciplina
- "Cred." = Créditos
- "Horas-Aula" = Carga horária principal (usar este valor)
- "Horas Práticas" = ignorar para carga horária
- "Horas de Estágio" = ignorar
- "Pré-requisitos" = códigos das disciplinas necessárias antes
- "Correquisitos" = códigos das disciplinas que devem ser cursadas junto
- "Obs." = ignorar

REGRAS IMPORTANTES:
1. Extrair APENAS disciplinas reais (que tem código de 5 dígitos)
2. O período/semestre vem da coluna "Seq." (1-8 = semestre regular, outros = optativas/trilhas)
3. Trilhas como "Trilha Empreendedorismo", "Trilha Mestrado", etc. devem ter periodo = 9
4. Disciplinas optativas sem semestre definido devem ter periodo = 0
5. NÃO duplicar disciplinas (mesmo código = mesma disciplina)
6. Ignorar cabeçalhos, totais, observações e textos que não são disciplinas

Retorne APENAS um JSON válido:
{
  "disciplinas": [
    {
      "codigo": "60963",
      "nome": "Raciocínio Lógico",
      "creditos": 4,
      "cargaHoraria": 60,
      "periodo": 1
    }
  ]
}

IMPORTANTE: Retorne SOMENTE o JSON, sem explicações.

Texto do PDF:
`;

/**
 * POST /api/analyze/analyze-pdf
 * Analisa texto de grade curricular com IA.
 * Body: { texto: string }
 */
router.post('/analyze-pdf', async (req, res, next) => {
  try {
    const { texto } = req.body;

    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      return res.status(400).json({
        error: { message: 'Texto é obrigatório' },
      });
    }

    if (texto.length > 50000) {
      return res.status(400).json({
        error: { message: 'Texto excede o tamanho máximo permitido' },
      });
    }

    if (!config.anthropicApiKey) {
      return res.status(503).json({
        error: { message: 'Análise com IA não disponível no momento' },
      });
    }

    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: SYSTEM_PROMPT + texto.substring(0, 20000),
        },
      ],
    });

    const conteudo = message.content[0].text;
    const jsonMatch = conteudo.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(422).json({
        error: { message: 'IA retornou formato inválido' },
      });
    }

    let resultado;
    try {
      resultado = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(422).json({
        error: { message: 'IA retornou JSON malformado' },
      });
    }

    if (!resultado.disciplinas || !Array.isArray(resultado.disciplinas)) {
      return res.status(422).json({
        error: { message: 'IA não encontrou disciplinas no texto' },
      });
    }

    // Deduplicar por código
    const codigosVistos = new Set();
    const disciplinas = resultado.disciplinas
      .filter(d => {
        if (!d.codigo || codigosVistos.has(d.codigo)) return false;
        codigosVistos.add(d.codigo);
        return true;
      })
      .map(d => ({
        codigo: d.codigo,
        nome: d.nome,
        creditos: d.creditos || 4,
        cargaHoraria: d.cargaHoraria || 60,
        periodo: d.periodo || 1,
      }));

    res.json({
      success: true,
      count: disciplinas.length,
      disciplinas,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
