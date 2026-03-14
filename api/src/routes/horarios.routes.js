import { Router } from 'express';
import { PortalService } from '../services/portal.service.js';
import { logPortalRequest } from '../utils/portalLogger.js';

const router = Router();

/**
 * POST /api/portal/horarios
 * Busca quadro de horários do semestre atual.
 * Body: { ra: string, senha: string }
 */
router.post('/horarios', async (req, res, next) => {
  // Playwright scraping can take 60-120s
  req.setTimeout(180000);
  res.setTimeout(180000);
  try {
    const { ra, senha, cursoIndex } = req.body;

    if (!ra || !senha) {
      return res.status(400).json({
        error: 'RA e senha são obrigatórios',
      });
    }

    if (typeof ra !== 'string' || typeof senha !== 'string' || ra.length > 50 || senha.length > 100) {
      return res.status(400).json({
        error: 'Formato de credenciais inválido',
      });
    }

    const ci = cursoIndex !== undefined && cursoIndex !== null ? parseInt(cursoIndex, 10) : null;
    const start = Date.now();
    let result;
    try {
      result = await PortalService.fetchHorarios(ra.trim(), senha, ci);
    } catch (err) {
      await logPortalRequest({
        ra: ra.trim(),
        tipo: 'horarios',
        success: false,
        error: err.message || String(err),
        duration: Date.now() - start,
      });
      throw err;
    }

    await logPortalRequest({
      ra: ra.trim(),
      tipo: 'horarios',
      success: true,
      error: null,
      duration: Date.now() - start,
    });

    res.json({
      success: true,
      method: result.method,
      count: result.data.length,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
