import { Request, Response, NextFunction } from 'express';

export function getStaffSecretToken(): string {
  return process.env.STAFF_AUTH_TOKEN || process.env.STAFF_TOKEN || 'municipal-staff-secret-2026';
}

/**
 * Authentication middleware for municipal staff management actions:
 * - Status transitions (PATCH /api/tickets/:id/status)
 * - Review queue access (GET /api/reviews)
 * - Review case triage (PATCH /api/reviews/:id)
 * - Administrative n8n mode switching (POST /api/admin/set-n8n-mode)
 * - Access to raw and confidential citizen uploads
 */
export function requireStaffAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-staff-token'];

  let token = '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof customHeader === 'string') {
    token = customHeader.trim();
  }

  const expected = getStaffSecretToken();

  if (!token || token !== expected) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Municipal management action requires a valid staff authentication token.',
    });
  }

  next();
}
