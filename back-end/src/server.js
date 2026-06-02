import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { clerkMiddleware } from '@clerk/express';

import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import healthRouter from './routes/health.js';
import clerkWebhookRouter from './routes/clerkWebhook.js';
import meRouter from './routes/me.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(pinoHttp({ logger }));
app.use(cors({ origin: env.cors.origin, credentials: true }));

// ─── Webhook ANTES do express.json() ─────────────────────────────────────────
// svix verifica a assinatura sobre o body cru. Se um JSON parser global
// rodar antes, ele consome os bytes e a verificação falha.
app.use('/api', clerkWebhookRouter);

// ─── A partir daqui, parser JSON pra todas as rotas ──────────────────────────
app.use(express.json({ limit: '1mb' }));

// /health vai antes do Clerk — health check não deve depender de auth configurado
app.use('/', healthRouter);

// Clerk middleware: popula req.auth nas rotas seguintes.
// Não bloqueia request sem token — quem bloqueia é o requireAuth() por rota.
app.use(clerkMiddleware());

// Rotas autenticadas
app.use('/api', meRouter);

// 404 e error handler ficam por último.
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  logger.info(
    { port: env.port, env: env.nodeEnv },
    `POPYNS API listening on http://localhost:${env.port}`,
  );
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    logger.info({ sig }, 'Received shutdown signal');
    server.close((err) => {
      if (err) {
        logger.error({ err }, 'Error closing server');
        process.exit(1);
      }
      process.exit(0);
    });
  });
}
