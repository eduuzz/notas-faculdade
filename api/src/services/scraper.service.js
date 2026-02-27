import { config } from '../config/index.js';
import { PortalAuthError, PortalConnectionError, PortalParseError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const PORTAL = config.portalBaseUrl;
const PORTAL_URL = `${PORTAL}/frameHTML/web/app/edu/PortalEducacional/`;
const LOGIN_URL = `${PORTAL}/frameHTML/web/app/edu/PortalEducacional/login/`;

// Seletores reais do portal UNISINOS (descobertos via análise)
// O portal tem 2 formulários: mobile (User2/Pass2) e desktop (User/Pass)

let chromium;
async function getChromium() {
  if (!chromium) {
    const pw = await import('playwright');
    chromium = pw.chromium;
  }
  return chromium;
}

async function createBrowser() {
  const ch = await getChromium();
  return ch.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

/**
 * Faz login no portal e retorna { page, context, browser }.
 * O chamador é responsável por fechar o browser.
 */
async function loginAndGetPage(ra, senha) {
  const browser = await createBrowser();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Com viewport desktop (1920x1080), o formulário desktop aparece direto
  await page.fill('input[name="User"]:visible', ra);
  await page.fill('input[name="Pass"]:visible', senha);
  await page.click('input[type="submit"]:visible');

  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  if (page.url().includes('/login')) {
    await browser.close();
    throw new PortalAuthError();
  }

  logger.info('Login via scraper bem-sucedido', { ra, url: page.url() });
  return { page, context, browser };
}

/**
 * Intercepta chamadas da API TOTVS durante navegação no SPA.
 * O portal AngularJS faz chamadas REST quando navega entre seções.
 */
async function interceptApiCalls(page, route, apiPathFilter) {
  const captured = [];

  const handler = async (response) => {
    const url = response.url();
    if (url.includes('/FrameHTML/RM/API/') && url.includes(apiPathFilter)) {
      try {
        const json = await response.json();
        captured.push({ url, data: json });
      } catch (e) {
        // Resposta não é JSON
      }
    }
  };

  page.on('response', handler);

  // Navegar para a rota do SPA (rotas usam hash: /#/notas, /#/grade-curricular)
  await page.goto(`${PORTAL_URL}#/${route}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  page.off('response', handler);

  return captured;
}

/**
 * Fallback completo via Playwright.
 * Em vez de parsear HTML, intercepta as chamadas REST que o SPA faz
 * e retorna os dados JSON brutos.
 */
export class ScraperService {
  static async login(ra, senha) {
    const { browser } = await loginAndGetPage(ra, senha);
    await browser.close();
    return { success: true, method: 'scraper' };
  }

  static async fetchNotas(ra, senha) {
    let browser;
    try {
      const session = await loginAndGetPage(ra, senha);
      browser = session.browser;

      const results = await interceptApiCalls(session.page, 'notas', 'TOTVSEducacional');

      const notasData = results.find(r => r.url.includes('NotaEtapa'));
      const faltasData = results.find(r => r.url.includes('Falta'));

      logger.info('Notas extraídas via scraper', { endpoints: results.length });

      return {
        method: 'scraper',
        raw: { notas: notasData?.data || null, faltas: faltasData?.data || null },
      };
    } catch (err) {
      if (err instanceof PortalAuthError) throw err;
      throw new PortalParseError(`Falha ao extrair notas via scraper: ${err.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }

  static async fetchHistorico(ra, senha) {
    let browser;
    try {
      const session = await loginAndGetPage(ra, senha);
      browser = session.browser;

      const results = await interceptApiCalls(session.page, 'grade-curricular', 'GradeCurricular');
      const gradeData = results.find(r => r.url.includes('EnsinoSuperior'));

      logger.info('Histórico extraído via scraper', { endpoints: results.length });

      return { method: 'scraper', raw: gradeData?.data || null };
    } catch (err) {
      if (err instanceof PortalAuthError) throw err;
      throw new PortalParseError(`Falha ao extrair histórico via scraper: ${err.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }

  static async fetchCadeiras(ra, senha) {
    let browser;
    try {
      const session = await loginAndGetPage(ra, senha);
      browser = session.browser;

      const results = await interceptApiCalls(session.page, 'grade-curricular', 'GradeCurricular');
      const gradeData = results.find(r => r.url.includes('EnsinoSuperior'));

      logger.info('Cadeiras extraídas via scraper', { endpoints: results.length });

      return { method: 'scraper', raw: gradeData?.data || null };
    } catch (err) {
      if (err instanceof PortalAuthError) throw err;
      throw new PortalParseError(`Falha ao extrair cadeiras via scraper: ${err.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }
}
