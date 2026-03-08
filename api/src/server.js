import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { errorHandler } from './utils/errors.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import routes from './routes/index.js';

const app = express();

// Segurança — desabilita CSP apenas para o admin dashboard (inline scripts)
app.use((req, res, next) => {
  if (req.path === '/api/admin/dashboard') {
    return helmet({ contentSecurityPolicy: false })(req, res, next);
  }
  return helmet()(req, res, next);
});

// CORS - permite requisições do frontend
app.use(cors({
  origin: config.corsOrigin.split(',').map(o => o.trim()),
  credentials: true,
}));

// Body parser
app.use(express.json());

// Request logging (in-memory buffer for admin dashboard)
app.use(requestLogger);

// Health check na raiz (Railway verifica / por padrão)
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Rotas
app.use('/api', routes);

// Handler de erros global
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, () => {
  logger.info(`API rodando na porta ${config.port}`);
  logger.info(`Health check: http://localhost:${config.port}/api/health`);
  logger.info(`Portal base URL: ${config.portalBaseUrl}`);
});
