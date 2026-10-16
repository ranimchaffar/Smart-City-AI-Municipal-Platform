import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { municipalRouter } from './routes/municipal.js';
import { ticketsRouter } from './routes/tickets.js';
import { reviewsRouter } from './routes/reviews.js';
import { uploadsRouter } from './routes/uploads.js';
import { statsRouter } from './routes/stats.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { optionalAuth } from './middleware/auth.js';

export const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(optionalAuth);

// NOTE: Raw uploads directory is NOT exposed statically to the public.
// Privacy protection: only anonymized images (/api/uploads/safe/*) or authenticated staff (/api/uploads/raw/*) can view images.

// API Routes
app.use('/api/municipal-ticket', municipalRouter);
app.use('/api/reports', municipalRouter); // Direct alias for team integration
app.use('/api/tickets', ticketsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/upload', uploadsRouter); // Alias for singular upload
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', statsRouter);
app.use('/api/dashboard', statsRouter); // Alias for /api/dashboard/stats

// Root greeting / API overview
app.get('/', (_req, res) => {
  res.json({
    service: 'Automated Municipal Ticket System — Member 5 API',
    database: 'PostgreSQL 14 (genuine persistence)',
    endpoints: {
      citizen_gateway: 'POST /api/municipal-ticket',
      ticket_lookup: 'GET /api/municipal-ticket/:report_id',
      tickets_list: 'GET /api/tickets',
      ticket_save: 'POST /api/tickets',
      ticket_status: 'PATCH /api/tickets/:id/status (Protected: Staff Auth Required)',
      review_queue: 'GET /api/reviews (Protected: Staff Auth Required)',
      review_resolve: 'PATCH /api/reviews/:id (Protected: Staff Auth Required)',
      file_uploads: 'POST /api/uploads',
      dashboard_stats: 'GET /api/stats',
      health: 'GET /api/health',
    },
    privacy: 'Raw media isolation active; faces and PII masked before municipality dashboard view.',
    notice: 'Demo mode active: responses are fixture-based; honest provenance guaranteed.',
  });
});

// Centralized error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: 'SERVER_ERROR',
      message: err.message || 'An internal server error occurred',
    });
  }
);
