import { Router, Request, Response } from 'express';
import argon2 from 'argon2';
import { db } from '../db/index.js';
import { requireAdminAuth } from '../middleware/auth.js';

export const adminRouter = Router();

// Apply requireAdminAuth to all administrative endpoints
adminRouter.use(requireAdminAuth);

/**
 * GET /api/admin/users
 * Returns list of users with filtering and search.
 */
adminRouter.get('/users', async (req: Request, res: Response) => {
  const { role, department, search } = req.query;

  try {
    let query = `
      SELECT id, name, email, role, department, phone, is_active, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const values: any[] = [];
    let idx = 1;

    if (role && typeof role === 'string' && role !== 'ALL') {
      query += ` AND role = $${idx++}`;
      values.push(role);
    }

    if (department && typeof department === 'string' && department !== 'ALL') {
      query += ` AND department = $${idx++}`;
      values.push(department);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (name ILIKE $${idx} OR email ILIKE $${idx})`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.pool.query(query, values);

    return res.json({
      success: true,
      total: result.rows.length,
      users: result.rows,
    });
  } catch (err: any) {
    console.error('Admin users query error:', err);
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * POST /api/admin/users
 * Admin creation of municipal agents or administrators.
 */
adminRouter.post('/users', async (req: Request, res: Response) => {
  const { name, email, password, role, department, phone } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'INVALID_NAME', message: 'Nom complet requis.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Email invalide.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Mot de passe minimum 8 caractères requis.' });
  }

  const validRoles = ['CITIZEN', 'MUNICIPAL_AGENT', 'ADMINISTRATOR'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'INVALID_ROLE', message: 'Rôle invalide (CITIZEN, MUNICIPAL_AGENT, ADMINISTRATOR).' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await db.pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS', message: 'Un utilisateur avec cet email existe déjà.' });
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const insertRes = await db.pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, name, email, role, department, phone, is_active, created_at`,
      [name.trim(), normalizedEmail, passwordHash, role, department || null, phone || null]
    );

    const newUser = insertRes.rows[0];

    // Audit log
    await db.pool.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, user_email, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        'ADMIN_CREATE_USER',
        'USER',
        newUser.id,
        req.user?.id || null,
        req.user?.email || null,
        JSON.stringify({ created_email: newUser.email, created_role: newUser.role }),
        req.ip,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès.',
      user: newUser,
    });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Updates user role, department, or toggles active/inactive state.
 */
adminRouter.patch('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, department, is_active, name, phone } = req.body || {};

  try {
    const checkRes = await db.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Utilisateur introuvable.' });
    }

    const current = checkRes.rows[0];

    const updateRes = await db.pool.query(
      `UPDATE users
       SET role = COALESCE($1, role),
           department = COALESCE($2, department),
           is_active = COALESCE($3, is_active),
           name = COALESCE($4, name),
           phone = COALESCE($5, phone),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, email, role, department, phone, is_active, updated_at`,
      [
        role || null,
        department !== undefined ? department : null,
        typeof is_active === 'boolean' ? is_active : null,
        name ? name.trim() : null,
        phone ? phone.trim() : null,
        id,
      ]
    );

    const updatedUser = updateRes.rows[0];

    // If deactivated, revoke all existing sessions
    if (is_active === false) {
      await db.pool.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);
    }

    // Audit log
    await db.pool.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, user_email, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        'ADMIN_UPDATE_USER',
        'USER',
        id,
        req.user?.id || null,
        req.user?.email || null,
        JSON.stringify({ previous: current.role, updated: updatedUser.role, is_active: updatedUser.is_active }),
        req.ip,
      ]
    );

    return res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès.',
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('Admin update user error:', err);
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * POST /api/admin/tickets/:id/assign
 * Assigns a ticket to a specific municipal agent and logs the event.
 */
adminRouter.post('/tickets/:id/assign', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { agent_id } = req.body || {};

  if (!agent_id) {
    return res.status(400).json({ error: 'AGENT_ID_REQUIRED', message: 'Identifiant agent requis.' });
  }

  try {
    const agentRes = await db.pool.query(
      'SELECT id, name, email, department, is_active FROM users WHERE id = $1 AND role IN ($2, $3)',
      [agent_id, 'MUNICIPAL_AGENT', 'ADMINISTRATOR']
    );

    if (agentRes.rows.length === 0 || !agentRes.rows[0].is_active) {
      return res.status(404).json({ error: 'AGENT_NOT_FOUND', message: 'Agent municipal introuvable ou inactif.' });
    }

    const agent = agentRes.rows[0];

    const ticketRes = await db.pool.query('SELECT * FROM tickets WHERE ticket_id = $1', [id]);
    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: 'TICKET_NOT_FOUND', message: 'Ticket introuvable.' });
    }

    const ticket = ticketRes.rows[0];

    // Update ticket
    await db.pool.query(
      `UPDATE tickets
       SET assigned_to = $1,
           assigned_agent_name = $2,
           status = CASE WHEN status = 'TICKET_CREATED' THEN 'ASSIGNED' ELSE status END,
           updated_at = NOW()
       WHERE ticket_id = $3`,
      [agent.id, agent.name, id]
    );

    // Record immutable audit event in ticket_events
    await db.pool.query(
      `INSERT INTO ticket_events (ticket_id, from_status, to_status, actor, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        ticket.status,
        ticket.status === 'TICKET_CREATED' ? 'ASSIGNED' : ticket.status,
        req.user?.name || 'Administrateur',
        `Affectation officielle du ticket à l'agent : ${agent.name} (${agent.email})`,
      ]
    );

    return res.json({
      success: true,
      message: `Ticket affecté avec succès à ${agent.name}.`,
      assigned_to: agent.id,
      assigned_agent_name: agent.name,
    });
  } catch (err: any) {
    console.error('Ticket assignment error:', err);
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * GET /api/admin/audit-logs
 * Retrieves immutable audit trail for compliance.
 */
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  const { limit = '50', offset = '0' } = req.query;

  try {
    const logsRes = await db.pool.query(
      `SELECT * FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(String(limit), 10) || 50, parseInt(String(offset), 10) || 0]
    );

    const countRes = await db.pool.query('SELECT COUNT(*) FROM audit_logs');

    return res.json({
      success: true,
      total: parseInt(countRes.rows[0].count, 10),
      logs: logsRes.rows,
    });
  } catch (err: any) {
    console.error('Audit logs query error:', err);
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});
