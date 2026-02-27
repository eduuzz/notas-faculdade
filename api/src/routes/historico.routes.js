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
    const { ra, senha } = req.body;

    if (!ra || !senha) {
      return res.status(400).json({
        error: { message: 'RA e senha são obrigatórios' },
      });
    }

    const result = await PortalService.fetchHistorico(ra, senha);

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
