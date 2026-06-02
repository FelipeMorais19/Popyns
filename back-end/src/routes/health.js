import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime_seconds: Math.round(process.uptime()),
    now: new Date().toISOString(),
  });
});

export default router;
