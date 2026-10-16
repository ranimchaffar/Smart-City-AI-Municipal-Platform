import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { ReviewStatus } from '../types/index.js';
import { requireStaffAuth } from '../middleware/auth.js';

export const reviewsRouter = Router();

/**
 * POST /api/reviews
 * Explicit review case persistence.
 */
reviewsRouter.post('/', async (req: Request, res: Response) => {
  const { report_id, review_reasons, raw_payload, decision_notes } = req.body;

  if (!report_id || !Array.isArray(review_reasons)) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'report_id and an array of review_reasons are required.',
    });
  }

  try {
    const reviewCase = await db.saveReviewCase({
      report_id,
      review_reasons,
      raw_payload,
      decision_notes,
    });

    return res.status(201).json({
      message: 'Review case persisted to PostgreSQL.',
      reviewCase,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * GET /api/reviews
 * Protected: List review cases for municipal triage (staff auth required).
 */
reviewsRouter.get('/', requireStaffAuth, async (req: Request, res: Response) => {
  const { status } = req.query;
  try {
    const cases = await db.getReviewCases({
      status: status as ReviewStatus,
    });

    return res.json({
      total: cases.length,
      reviewCases: cases,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * GET /api/reviews/:id
 * Retrieve specific review case details (staff auth required).
 */
reviewsRouter.get('/:id', requireStaffAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const rCase = await db.getReviewCaseById(id);

    if (!rCase) {
      return res.status(404).json({ error: 'NOT_FOUND', message: `Review case ${id} not found.` });
    }

    const report = await db.getReport(rCase.report_id);

    return res.json({
      reviewCase: rCase,
      report,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * PATCH /api/reviews/:id
 * Protected: Resolve review case (Approve into ticket or Dismiss) with staff auth.
 */
reviewsRouter.patch('/:id', requireStaffAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resolved_by, decision_notes, approvedTicketData } = req.body;

  if (!status || !['APPROVED_TO_TICKET', 'DISMISSED'].includes(status)) {
    return res.status(400).json({
      error: 'INVALID_STATUS',
      message: 'Status must be APPROVED_TO_TICKET or DISMISSED.',
    });
  }

  try {
    const result = await db.resolveReviewCase(
      id,
      status as ReviewStatus,
      resolved_by || 'municipal_supervisor',
      decision_notes,
      approvedTicketData
    );

    return res.json({
      message: `Review case ${status === 'APPROVED_TO_TICKET' ? 'approved into ticket in PostgreSQL' : 'dismissed'}.`,
      ...result,
    });
  } catch (error: any) {
    return res.status(404).json({ error: 'NOT_FOUND', message: error.message });
  }
});
