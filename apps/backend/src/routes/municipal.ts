import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { n8nClient } from '../services/n8n-client.js';
import { MunicipalReportRequest } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';

export const municipalRouter = Router();

/**
 * POST /api/municipal-ticket
 * Main citizen report submission gateway.
 * Forwards to n8n (or explicitly configured simulator in mock mode),
 * and guarantees durable PostgreSQL persistence:
 * - PASS -> commits to tickets table (persisted: true, real ticket_id)
 * - REVIEW -> commits to review_cases table for municipal staff review
 * - REJECT -> returns validation feedback
 *
 * Attribution:
 * - If user is logged in (req.user), report is tied to their user_id.
 * - If anonymous, an unguessable 32-character tracking_token is generated and returned.
 */
municipalRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as MunicipalReportRequest;

    // Validate request structure
    if (!body || typeof body !== 'object') {
      return res.status(422).json({
        report_id: null,
        decision: 'REJECT',
        ticket: null,
        review_reasons: [],
        errors: ['INVALID_REQUEST_BODY'],
        demo_mode: true,
        agents_are_mock: true,
        orchestrator_mode: n8nClient.getMode() === 'live' ? 'REAL_N8N_WEBHOOK' : 'EXPLICIT_SIMULATED_MOCK',
        http_status: 422,
      });
    }

    const userId = req.user ? req.user.id : null;
    const trackingToken = userId ? null : crypto.randomBytes(16).toString('hex');

    // Execute n8n workflow (live webhook or explicit simulator)
    let workflowResult;
    try {
      workflowResult = await n8nClient.executeWorkflow(body);
    } catch (err: any) {
      // In live mode: do NOT silently fallback to mock!
      return res.status(502).json({
        report_id: body.report_id || null,
        decision: 'REJECT',
        ticket: null,
        review_reasons: [],
        errors: ['N8N_LIVE_WEBHOOK_UNREACHABLE'],
        demo_mode: false,
        agents_are_mock: false,
        orchestrator_mode: 'LIVE_N8N_FAILED',
        notice: `Real n8n workflow execution failed: ${err.message}`,
        http_status: 502,
      });
    }

    const { response, source } = workflowResult;

    // Attach orchestrator execution source metadata and tracking token to response
    (response as any).orchestrator_mode = source;
    if (trackingToken) {
      (response as any).tracking_token = trackingToken;
    }

    // If report was rejected by Input Check
    if (response.decision === 'REJECT') {
      if (body.report_id) {
        const rep = await db.getReport(body.report_id);
        if (rep) {
          rep.decision = 'REJECT';
          rep.status = 'REJECTED';
          await db.saveReport(rep);
        }
      }
      return res.status(422).json(response);
    }

    // If decision is REVIEW (HTTP 202) -> SAVE TO PostgreSQL review_cases & reports
    if (response.decision === 'REVIEW') {
      if (body.report_id) {
        await db.saveReport({
          report_id: body.report_id,
          description: body.description || '',
          media_ref: body.media_ref || '',
          location: body.location || null,
          decision: 'REVIEW',
          status: 'REVIEW_REQUIRED',
          demo_mode: false,
          user_id: userId,
          tracking_token: trackingToken,
        });

        await db.saveReviewCase({
          report_id: body.report_id,
          review_reasons: response.review_reasons || [],
          raw_payload: body,
          decision_notes: `Flagged during workflow execution (${source}). Requires municipal staff triage.`,
        });
      }
      return res.status(202).json(response);
    }

    // If decision is PASS (HTTP 200) -> PERSIST TO PostgreSQL reports & tickets table
    if (response.decision === 'PASS' && response.ticket) {
      await db.saveReport({
        report_id: body.report_id,
        description: body.description || '',
        media_ref: body.media_ref || '',
        location: body.location || null,
        decision: 'PASS',
        status: 'TICKET_CREATED',
        demo_mode: false,
        user_id: userId,
        tracking_token: trackingToken,
      });

      const saveResult = await db.saveTicket({
        ...response.ticket,
        report_id: body.report_id,
      });

      // Update returned ticket object with persistent DB record details
      response.ticket = saveResult.ticket;

      if (response.audit) {
        response.audit.storage = 'PERSISTED';
      }

      return res.status(200).json(response);
    }

    return res.status(response.http_status || 200).json(response);
  } catch (error: any) {
    console.error('Error in /api/municipal-ticket:', error);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/municipal-ticket/citizen/my-reports
 * Citizen report history. Requires authenticated citizen session.
 */
municipalRouter.get('/citizen/my-reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const reports = await db.getUserReports(req.user!.id);
    return res.json({
      total: reports.length,
      reports,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * GET /api/municipal-ticket/:report_id
 * Look up report and its associated ticket or review case from PostgreSQL.
 * Secure ownership & tracking checks enforced.
 */
municipalRouter.get('/:report_id', async (req: Request, res: Response) => {
  const { report_id } = req.params;
  const token = req.query.token as string | undefined;

  try {
    const report = await db.getReport(report_id);

    if (!report) {
      return res.status(404).json({ error: 'NOT_FOUND', message: `Report ${report_id} not found` });
    }

    // Access control evaluation:
    const isStaffOrAdmin = req.user && ['MUNICIPAL_AGENT', 'ADMINISTRATOR'].includes(req.user.role);
    const isOwner = req.user && report.user_id && req.user.id === report.user_id;
    const hasValidToken = token && report.tracking_token && token === report.tracking_token;
    // Allow historical records that predated the auth migration without restriction
    const isLegacyOpen = !report.user_id && !report.tracking_token;

    if (!isStaffOrAdmin && !isOwner && !hasValidToken && !isLegacyOpen) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Accès non autorisé. Veuillez vous connecter ou fournir un jeton de suivi valide.',
      });
    }

    const ticket = await db.getTicketByReportId(report_id);
    const reviewCases = await db.getReviewCases();
    const reviewCase = reviewCases.find((r) => r.report_id === report_id);
    const events = ticket ? await db.getTicketEvents(ticket.ticket_id) : [];

    return res.json({
      report,
      ticket,
      reviewCase: reviewCase || null,
      events,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});
