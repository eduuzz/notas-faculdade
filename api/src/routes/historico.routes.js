import { Router } from 'express';
import { PortalService } from '../services/portal.service.js';

const router = Router();

/**
 * POST /api/portal/historico
 * Busca histórico acadêmico completo.
 * Body: { ra: string, senha: string }
 */
router.post('/historico', async (req, res, next) => {
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
    const result = await PortalService.fetchHistorico(ra.trim(), senha, ci);

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
