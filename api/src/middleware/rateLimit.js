import rateLimit from 'express-rate-limit';

export const portalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Muitas requisições. Tente novamente em 1 minuto.',
    },
  },
});
