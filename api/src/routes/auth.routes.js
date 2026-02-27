import { Router } from 'express';
import { PortalService } from '../services/portal.service.js';

const router = Router();

/**
 * POST /api/portal/login
 * Testa credenciais do portal da universidade.
 * Body: { ra: string, senha: string }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { ra, senha } = req.body;

    if (!ra || !senha) {
      return res.status(400).json({
        error: { message: 'RA e senha são obrigatórios' },
      });
    }

    const result = await PortalService.login(ra, senha);

    res.json({
      success: true,
      method: result.method,
      message: 'Autenticação no portal bem-sucedida',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
