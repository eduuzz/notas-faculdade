import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { errorHandler } from './utils/errors.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';

const app = express();

// Segurança
app.use(helmet());

// CORS - permite requisições do frontend
app.use(cors({
  origin: config.corsOrigin.split(',').map(o => o.trim()),
  credentials: true,
}));

// Body parser
app.use(express.json());

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
