import { Router } from 'express';
import { PortalService } from '../services/portal.service.js';

const router = Router();

/**
 * POST /api/portal/notas
 * Busca notas do semestre atual (ou de um semestre específico).
 * Body: { ra: string, senha: string, semestre?: string }
 */
router.post('/notas', async (req, res, next) => {
  try {
    const { ra, senha, semestre } = req.body;

    if (!ra || !senha) {
      return res.status(400).json({
        error: { message: 'RA e senha são obrigatórios' },
      });
    }

    const result = await PortalService.fetchNotas(ra, senha, semestre);

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
