import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { TicketDemo, TicketStatus, Category, Department, Severity, Priority } from '../types/index.js';
import { requireStaffAuth } from '../middleware/auth.js';

export const ticketsRouter = Router();

const ALLOWED_STATUSES: TicketStatus[] = [
  'RECEIVED',
  'VALIDATING',
  'ANALYZING',
  'REVIEW_REQUIRED',
  'TICKET_CREATED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
];

/**
 * POST /api/tickets
 * Explicit ticket persistence endpoint.
 * Idempotent by report_id.
 */
ticketsRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<TicketDemo>;

  if (!body.report_id || !body.category || !body.department) {
    return res.status(400).json({
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'report_id, category, and department are required to save a ticket.',
    });
  }

  try {
    const { ticket, isNew } = await db.saveTicket({
      ticket_id: body.ticket_id || '',
      report_id: body.report_id,
      category: body.category as Category,
      severity: (body.severity as Severity) || 'MEDIUM',
      priority: (body.priority as Priority) || 'NORMAL',
      department: body.department as Department,
      status: body.status || 'TICKET_CREATED',
      location: body.location || null,
      anonymized_media_ref: body.anonymized_media_ref || null,
      procedure: body.procedure || 'Standard municipal triage procedure.',
      sources: body.sources || [],
      deadline: body.deadline || null,
      is_mock: body.is_mock !== false,
    });

    return res.status(isNew ? 201 : 200).json({
      message: isNew
        ? 'Ticket successfully created and persisted to PostgreSQL.'
        : 'Ticket already exists in PostgreSQL (idempotent return).',
      ticket,
      persisted: true,
    });
  } catch (error: any) {
    console.error('Error saving ticket to PostgreSQL:', error);
    return res.status(500).json({ error: 'DATABASE_ERROR', message: error.message });
  }
});

/**
 * GET /api/tickets
 * Query tickets with search, filtering, and sorting from PostgreSQL.
 */
ticketsRouter.get('/', async (req: Request, res: Response) => {
  const { category, department, status, severity, priority, search } = req.query;

  try {
    const tickets = await db.getTickets({
      category: category as Category,
      department: department as Department,
      status: status as TicketStatus,
      severity: severity as Severity,
      priority: priority as Priority,
      search: search as string,
    });

    return res.json({
      total: tickets.length,
      tickets,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'DATABASE_ERROR', message: error.message });
  }
});

/**
 * GET /api/tickets/:id
 * Retrieve a single ticket with full metadata and PostgreSQL audit events.
 */
ticketsRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const ticket = await db.getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: `Ticket ${id} not found.` });
    }

    const events = await db.getTicketEvents(id);

    return res.json({
      ticket,
      events,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'DATABASE_ERROR', message: error.message });
  }
});

/**
 * PATCH /api/tickets/:id/status
 * Protected by requireStaffAuth: Municipal staff action only.
 * Update ticket lifecycle status and record audit event in PostgreSQL.
 */
ticketsRouter.patch('/:id/status', requireStaffAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, actor, notes } = req.body;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'INVALID_STATUS',
      message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
    });
  }

  try {
    const updated = await db.updateTicketStatus(
      id,
      status as TicketStatus,
      actor || 'municipal_supervisor',
      notes
    );

    const events = await db.getTicketEvents(id);

    return res.json({
      message: `Ticket status successfully updated to ${status} in PostgreSQL.`,
      ticket: updated,
      events,
    });
  } catch (error: any) {
    return res.status(404).json({ error: 'NOT_FOUND', message: error.message });
  }
});
