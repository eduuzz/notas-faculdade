import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { portalLimiter } from '../middleware/rateLimit.js';
import authRoutes from './auth.routes.js';
import notasRoutes from './notas.routes.js';
import historicoRoutes from './historico.routes.js';
import cadeirasRoutes from './cadeiras.routes.js';
import horariosRoutes from './horarios.routes.js';
import cursosRoutes from './cursos.routes.js';
import analyzeRoutes from './analyze.routes.js';
import adminRoutes from './admin.routes.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Health check (sem auth)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas do portal (protegidas com auth Supabase + rate limit)
router.use('/portal', requireAuth, portalLimiter, authRoutes);
router.use('/portal', requireAuth, portalLimiter, notasRoutes);
router.use('/portal', requireAuth, portalLimiter, historicoRoutes);
router.use('/portal', requireAuth, portalLimiter, cadeirasRoutes);
router.use('/portal', requireAuth, portalLimiter, horariosRoutes);
router.use('/portal', requireAuth, portalLimiter, cursosRoutes);

// Rota de análise com IA (protegida + rate limit)
router.use('/analyze', requireAuth, portalLimiter, analyzeRoutes);

// Admin monitoring dashboard (protegido por ADMIN_SECRET)
router.use('/admin', requireAdmin, adminRoutes);

export default router;
