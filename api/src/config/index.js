import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  portalBaseUrl: process.env.PORTAL_BASE_URL || 'https://portal.asav.org.br',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
