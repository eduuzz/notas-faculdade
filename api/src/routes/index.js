import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { portalLimiter } from '../middleware/rateLimit.js';
import authRoutes from './auth.routes.js';
import notasRoutes from './notas.routes.js';
import historicoRoutes from './historico.routes.js';
import cadeirasRoutes from './cadeiras.routes.js';

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

export default router;
