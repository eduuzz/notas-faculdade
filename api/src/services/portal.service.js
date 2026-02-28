import { config } from '../config/index.js';
import { PortalAuthError, PortalConnectionError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ParserService } from './parser.service.js';

const PORTAL = config.portalBaseUrl;
const LOGIN_URL = `${PORTAL}/frameHTML/web/app/edu/PortalEducacional/login/`;
const PORTAL_SPA = `${PORTAL}/frameHTML/web/app/edu/PortalEducacional`;

// Lazy-load Playwright
let chromium;
async function getChromium() {
  if (!chromium) {
    const pw = await import('playwright');
    chromium = pw.chromium;
  }
  return chromium;
}

/**
 * Fecha o modal de seleção de contexto via JS nativo.
 *
 * O PO-UI (biblioteca TOTVS) esconde os <input type="radio"> visualmente,
 * por isso Playwright não consegue clicar — usamos page.evaluate com
 * native .click() nos containers pai.
 */
async function dismissModal(page, preferPeriod = null) {
  const hasRadios = await page.evaluate(() =>
    document.querySelectorAll('input[type="radio"]').length > 0
  );
  if (!hasRadios) return false;

  await page.evaluate((preferPeriod) => {
    if (preferPeriod) {
      const radios = [...document.querySelectorAll('input[type="radio"]')];
      for (const radio of radios) {
        const container =
          radio.closest('li, .po-field-option, label') ?? radio.parentElement;
        if (container?.textContent?.includes(preferPeriod)) {
          (container.querySelector('label') ?? container).click();
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    }
    const btns = [...document.querySelectorAll('button')];
    const btn = btns.find(b =>
      ['confirmar', 'acessar', 'ok', 'selecionar'].some(kw =>
        b.textContent?.trim().toLowerCase().includes(kw)
      )
    );
    if (btn) btn.click();
  }, preferPeriod);

  await page.waitForTimeout(1500);
  return true;
}

/**
 * Aguarda até que `captured` contenha ao menos uma key que inclua algum dos keywords,
 * ou até expirar o timeout (ms). Faz polling a cada 500ms.
 */
async function waitForCapture(captured, keywords, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const kw of keywords) {
      if (Object.keys(captured).some(k => k.includes(kw))) return true;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

/**
 * Faz login no portal e navega pelas rotas fornecidas,
 * interceptando respostas da API TOTVS RM Educacional.
 *
 * IMPORTANTE: chamadas HTTP diretas (axios/fetch) falham com "Usuário sem permissão"
 * mesmo com cookies válidos, porque o portal valida que as requisições vêm do
 * AngularJS com contexto de sessão completo. A única abordagem que funciona é
 * navegar via Playwright e capturar as respostas que o AngularJS dispara.
 *
 * @param {string} ra - RA ou login do aluno
 * @param {string} senha - Senha do portal
 * @param {{ route: string, preferPeriod?: string, waitFor?: string[] }[]} navigations
 * @returns {Object} Mapa de path → { data, warn, status }
 */
async function withPortalSession(ra, senha, navigations) {
  const ch = await getChromium();
  const browser = await ch.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--no-first-run',
      '--single-process',
      '--disable-software-rasterizer',
      '--js-flags=--max-old-space-size=256',
    ],
  });

  try {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();

    // Bloquear recursos pesados (imagens, CSS, fonts) para economizar memória/tempo
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    // Interceptar todas as respostas da API TOTVS
    const captured = {};
    const pendingResponses = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('/FrameHTML/RM/API/')) return;
      const path = url.replace(PORTAL, '').split('?')[0];
      const p = (async () => {
        let data = null;
        try {
          data = await response.json();
        } catch {}
        const warn = !!data?.messages?.some(m => m.type === 'warning');
        logger.info(`  API interceptada: ${path} (status=${response.status()}, warn=${warn})`);
        // Prefere resposta sem warning
        if (!captured[path] || (captured[path].warn && !warn)) {
          captured[path] = { data, warn, status: response.status() };
        }
      })();
      pendingResponses.push(p);
    });

    // ── Login ──
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[name="User"]:visible', ra);
    await page.fill('input[name="Pass"]:visible', senha);
    await page.click('input[type="submit"]:visible');
    await page
      .waitForURL(u => !u.href.includes('/login'), { timeout: 15000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      throw new PortalAuthError();
    }

    // Fechar modal inicial (sem preferência de período)
    await dismissModal(page);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    logger.info('Login bem-sucedido no portal', { ra });

    // ── Navegar para cada rota e capturar respostas ──
    for (const { route, preferPeriod = null, waitFor = null } of navigations) {
      logger.info(`Navegando para #/${route}`, { ra });
      await page
        .goto(`${PORTAL_SPA}/#/${route}`, { timeout: 20000 })
        .catch(() => {});
      await page.waitForTimeout(2000);
      await dismissModal(page, preferPeriod);

      if (waitFor) {
        // Esperar ativamente até a resposta esperada ser capturada (até 20s)
        const found = await waitForCapture(captured, waitFor, 20000);
        if (!found) {
          logger.warn(`Resposta esperada não capturada para #/${route}`, { waitFor });
          // Tentar recarregar a rota uma vez
          logger.info(`Retry: recarregando #/${route}`);
          await page.goto(`${PORTAL_SPA}/#/${route}`, { timeout: 20000 }).catch(() => {});
          await page.waitForTimeout(2000);
          await dismissModal(page, preferPeriod);
          await waitForCapture(captured, waitFor, 15000);
        }
      } else {
        await page
          .waitForLoadState('networkidle', { timeout: 10000 })
          .catch(() => {});
        await page.waitForTimeout(3000);
      }
    }

    // Aguardar todas as respostas pendentes serem processadas
    await Promise.allSettled(pendingResponses);

    logger.info('Coleta concluída', {
      ra,
      endpoints: Object.keys(captured).length,
      paths: Object.keys(captured),
    });
    return captured;
  } finally {
    await browser.close();
  }
}

/**
 * Retorna o `.data` do primeiro path em `captured` que contenha algum dos keywords.
 */
function findCaptured(captured, ...keywords) {
  for (const kw of keywords) {
    const key = Object.keys(captured).find(k => k.includes(kw));
    if (key) return captured[key]?.data ?? null;
  }
  return null;
}

export class PortalService {
  /**
   * Testa as credenciais no portal. Retorna { success: true } se o login funcionar.
   */
  static async login(ra, senha) {
    try {
      await withPortalSession(ra, senha, []);
      return { success: true };
    } catch (err) {
      if (err instanceof PortalAuthError) throw err;
      logger.error('Login falhou', err.message);
      throw new PortalConnectionError(`Falha ao fazer login: ${err.message}`);
    }
  }

  /**
   * Busca notas do semestre atual.
   * Navega para #/notas (captura DisciplinasAlunoPeriodoLetivo) e
   * #/grade-curricular (captura GradeCurricular/EnsinoSuperior como fallback).
   */
  static async fetchNotas(ra, senha) {
    try {
      const captured = await withPortalSession(ra, senha, [
        { route: 'notas', waitFor: ['DisciplinasAluno'] },
        { route: 'grade-curricular', waitFor: ['GradeCurricular'] },
      ]);

      const disciplinas = findCaptured(captured, 'DisciplinasAluno');
      const grade = findCaptured(
        captured,
        'GradeCurricular/EnsinoSuperior',
        'GradeCurricular'
      );
      const faltas = findCaptured(
        captured,
        'Aluno/Falta/Aula',
        'FaltaEtapa',
        'FaltaAula'
      );

      return {
        method: 'api',
        data: ParserService.parseNotas({ disciplinas, grade, faltas }),
        raw: { disciplinas, grade, faltas },
      };
    } catch (err) {
      if (err instanceof PortalAuthError) throw err;
      logger.error('Erro ao buscar notas', err.message);
      throw new PortalConnectionError(`Falha ao buscar notas: ${err.message}`);
    }
  }

  /**
   * Busca histórico acadêmico completo (todas as disciplinas cursadas).
   * GradeCurricular/EnsinoSuperior retorna APRESENTACAOHISTORICO com todos os semestres.
   *
   * Nota: navegar para #/notas primeiro estabelece o contexto AngularJS necessário
   * para que #/grade-curricular carregue os dados.
   */
  static async fetchHistorico(ra, senha, _attempt = 1) {
    const MAX_ATTEMPTS = 2;
    try {
      const captured = await withPortalSession(ra, senha, [
        { route: 'notas' },
        { route: 'grade-curricular', waitFor: ['GradeCurricular'] },
      ]);

      logger.info('Endpoints capturados:', Object.keys(captured));

      const grade = findCaptured(
        captured,
        'GradeCurricular/EnsinoSuperior',
        'GradeCurricular'
      );

      const data = ParserService.parseHistorico(grade);

      // Se não encontrou disciplinas e ainda tem tentativas, retry
      if (data.length === 0 && _attempt < MAX_ATTEMPTS) {
        logger.warn(`fetchHistorico: 0 disciplinas na tentativa ${_attempt}, retentando...`);
        return this.fetchHistorico(ra, senha, _attempt + 1);
      }

      return {
        method: 'api',
        data,
        raw: grade,
      };
    } catch (err) {
      if (err instanceof PortalAuthError) throw err;
      // Se falhou e ainda tem tentativas, retry
      if (_attempt < MAX_ATTEMPTS) {
        logger.warn(`fetchHistorico: erro na tentativa ${_attempt}, retentando...`, err.message);
        return this.fetchHistorico(ra, senha, _attempt + 1);
      }
      logger.error('Erro ao buscar histórico', err.message);
      throw new PortalConnectionError(`Falha ao buscar histórico: ${err.message}`);
    }
  }

  /**
   * Busca grade curricular do curso (todas as disciplinas da grade, com status).
   */
  static async fetchCadeiras(ra, senha) {
    try {
      const captured = await withPortalSession(ra, senha, [
        { route: 'notas' },
        { route: 'grade-curricular', waitFor: ['GradeCurricular'] },
      ]);

      const grade = findCaptured(
        captured,
        'GradeCurricular/EnsinoSuperior',
        'GradeCurricular'
      );

      return {
        method: 'api',
        data: ParserService.parseCadeiras(grade),
        raw: grade,
      };
    } catch (err) {
      if (err instanceof PortalAuthError) throw err;
      logger.error('Erro ao buscar cadeiras', err.message);
      throw new PortalConnectionError(`Falha ao buscar cadeiras: ${err.message}`);
    }
  }
}
