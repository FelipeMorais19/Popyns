import { isProduction } from '../config/env.js';
import { logger } from '../lib/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status ?? err.statusCode ?? 500;
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(status).json({
    error: err.message ?? 'Internal server error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
