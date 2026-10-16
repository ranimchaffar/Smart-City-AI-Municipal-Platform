import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { n8nClient } from '../services/n8n-client.js';
import { requireStaffAuth } from '../middleware/auth.js';

export const statsRouter = Router();

/**
 * GET /api/stats
 * Overview metrics and KPIs for municipal dashboard from PostgreSQL.
 */
statsRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * GET /api/health
 * System health check reporting PostgreSQL status and n8n mode.
 */
statsRouter.get('/health', async (_req: Request, res: Response) => {
  const dbHealth = await db.getHealth();
  return res.json({
    status: dbHealth.connected ? 'healthy' : 'degraded',
    service: 'municipal-member5-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    n8n_mode: n8nClient.getMode(),
  });
});

/**
 * POST /api/admin/set-n8n-mode
 * Toggle n8n execution mode ('live' vs 'mock') for audit verification.
 * Protected: Requires municipal staff authentication.
 */
statsRouter.post('/admin/set-n8n-mode', requireStaffAuth, (req: Request, res: Response) => {
  const { mode } = req.body;
  if (mode !== 'live' && mode !== 'mock') {
    return res.status(400).json({ error: 'INVALID_MODE', message: 'Mode must be "live" or "mock".' });
  }
  n8nClient.setMode(mode);
  return res.json({ message: `Orchestrator mode set to ${mode}`, mode: n8nClient.getMode() });
});
