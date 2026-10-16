import { Router, Request, Response } from 'express';
import { getStaffSecretToken, requireStaffAuth } from '../middleware/auth.js';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Verifies staff token or secret and establishes authorized session.
 */
authRouter.post('/login', (req: Request, res: Response) => {
  const { token, secret } = req.body || {};
  const providedToken = (token || secret || '').trim();
  const expectedToken = getStaffSecretToken();

  if (!providedToken || providedToken !== expectedToken) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid municipal staff authentication credentials.',
    });
  }

  return res.json({
    success: true,
    message: 'Municipal staff credentials authenticated successfully.',
    role: 'municipal_staff',
    authenticated: true,
  });
});

/**
 * GET /api/auth/verify
 * Confirms current authorization status.
 */
authRouter.get('/verify', requireStaffAuth, (_req: Request, res: Response) => {
  return res.json({
    authenticated: true,
    role: 'municipal_staff',
  });
});
