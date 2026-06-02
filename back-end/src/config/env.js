// CLERK_WEBHOOK_SIGNING_SECRET é opcional pra boot:
// só existe depois que o webhook é criado no Clerk Dashboard.
// O handler do webhook checa em runtime e responde 503 se não configurado.
const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[env] Missing required env vars: ${missing.join(', ')}`);
  console.error('[env] Copie .env.example pra .env e preencha os valores.');
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  clerk: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    webhookSigningSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  },
};

export const isProduction = env.nodeEnv === 'production';
