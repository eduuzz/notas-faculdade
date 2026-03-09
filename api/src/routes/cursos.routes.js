import { Router } from 'express';
import { PortalService } from '../services/portal.service.js';

const router = Router();

/**
 * POST /api/portal/cursos
 * Detecta cursos/habilitações disponíveis para o aluno.
 * Body: { ra: string, senha: string }
 * Returns: { cursos: [{ label, index }] }
 */
router.post('/cursos', async (req, res, next) => {
  req.setTimeout(180000);
  res.setTimeout(180000);
  try {
    const { ra, senha } = req.body;

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

    const result = await PortalService.fetchCursos(ra.trim(), senha);

    res.json({
      success: true,
      count: result.cursos.length,
      cursos: result.cursos,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
