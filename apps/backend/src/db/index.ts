import pg from 'pg';
import {
  ReportRecord,
  TicketDemo,
  TicketEventRecord,
  ReviewCaseRecord,
  Category,
  Department,
  Severity,
  Priority,
  TicketStatus,
  ReviewStatus,
} from '../types/index.js';

const { Pool } = pg;

export class PostgreSQLDatabase {
  public pool: pg.Pool;
  private isConnected = false;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/municipal_tickets';

    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }

  public async init() {
    try {
      const client = await this.pool.connect();
      const res = await client.query('SELECT version();');
      client.release();
      this.isConnected = true;
      console.log('🐘 PostgreSQL connected successfully:', res.rows[0].version.split(' on ')[0]);
    } catch (err: any) {
      this.isConnected = false;
      console.error('❌ Failed to connect to PostgreSQL database:', err.message);
      throw err;
    }
  }

  public async getHealth() {
    try {
      const res = await this.pool.query('SELECT version(), current_database(), current_user;');
      return {
        connected: true,
        engine: 'PostgreSQL',
        version: res.rows[0].version,
        database: res.rows[0].current_database,
        user: res.rows[0].current_user,
      };
    } catch (e: any) {
      return {
        connected: false,
        engine: 'PostgreSQL',
        error: e.message,
      };
    }
  }

  // --- Reports ---
  public async saveReport(report: Omit<ReportRecord, 'created_at'> & { created_at?: string }): Promise<ReportRecord> {
    const lat = report.location?.latitude ?? null;
    const lon = report.location?.longitude ?? null;
    const addr = report.location?.address ?? null;

    const query = `
      INSERT INTO reports (report_id, description, media_ref, location_address, location_latitude, location_longitude, decision, status, demo_mode, user_id, tracking_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (report_id) DO UPDATE SET
        description = EXCLUDED.description,
        media_ref = EXCLUDED.media_ref,
        location_address = EXCLUDED.location_address,
        location_latitude = EXCLUDED.location_latitude,
        location_longitude = EXCLUDED.location_longitude,
        decision = EXCLUDED.decision,
        status = EXCLUDED.status,
        user_id = COALESCE(EXCLUDED.user_id, reports.user_id),
        tracking_token = COALESCE(EXCLUDED.tracking_token, reports.tracking_token)
      RETURNING *;
    `;

    const values = [
      report.report_id,
      report.description,
      report.media_ref,
      addr,
      lat,
      lon,
      report.decision || 'PASS',
      report.status || 'RECEIVED',
      report.demo_mode ?? true,
      report.user_id || null,
      report.tracking_token || null,
    ];

    const res = await this.pool.query(query, values);
    return this.mapReportRow(res.rows[0]);
  }

  public async getReport(report_id: string): Promise<ReportRecord | null> {
    const res = await this.pool.query('SELECT * FROM reports WHERE report_id = $1', [report_id]);
    if (res.rows.length === 0) return null;
    return this.mapReportRow(res.rows[0]);
  }

  public async getUserReports(userId: string): Promise<ReportRecord[]> {
    const res = await this.pool.query('SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map((r) => this.mapReportRow(r));
  }

  // --- Tickets ---
  /**
   * Idempotent save: if ticket with report_id already exists in Postgres, returns existing ticket!
   */
  public async saveTicket(ticketInput: Omit<TicketDemo, 'persisted' | 'storage_status'> & {
    persisted?: boolean;
    storage_status?: string;
  }): Promise<{ ticket: TicketDemo; isNew: boolean }> {
    // 1. Check if ticket for report_id already exists (IDEMPOTENCY GUARANTEE)
    const existingRes = await this.pool.query(
      'SELECT * FROM tickets WHERE report_id = $1',
      [ticketInput.report_id]
    );

    if (existingRes.rows.length > 0) {
      return { ticket: this.mapTicketRow(existingRes.rows[0]), isNew: false };
    }

    // 2. Generate new sequential ticket_id if not given or if temporary DEMO-TKT
    let ticketId = ticketInput.ticket_id;
    if (!ticketId || ticketId.startsWith('DEMO-TKT-')) {
      const countRes = await this.pool.query('SELECT COUNT(*) FROM tickets;');
      const seq = parseInt(countRes.rows[0].count, 10) + 1;
      ticketId = `TKT-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
    }

    const lat = ticketInput.location?.latitude ?? null;
    const lon = ticketInput.location?.longitude ?? null;
    const addr = ticketInput.location?.address ?? null;
    const sourcesJson = JSON.stringify(ticketInput.sources || []);

    // Ensure parent report exists in reports table to satisfy FK
    const repCheck = await this.pool.query('SELECT report_id FROM reports WHERE report_id = $1', [ticketInput.report_id]);
    if (repCheck.rows.length === 0) {
      await this.pool.query(
        `INSERT INTO reports (report_id, description, media_ref, location_address, location_latitude, location_longitude, decision, status, demo_mode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (report_id) DO NOTHING;`,
        [
          ticketInput.report_id,
          ticketInput.procedure || 'Municipal ticket report',
          ticketInput.anonymized_media_ref || 'mock://general-report',
          addr,
          lat,
          lon,
          'PASS',
          ticketInput.status || 'TICKET_CREATED',
          ticketInput.is_mock ?? true,
        ]
      );
    }

    const insertQuery = `
      INSERT INTO tickets (
        ticket_id, report_id, category, severity, priority, department,
        status, anonymized_media_ref, location_address, location_latitude, location_longitude,
        procedure, sources, deadline, persisted, storage_status, is_mock
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13::jsonb, $14, true, 'PERSISTED', $15
      )
      RETURNING *;
    `;

    const values = [
      ticketId,
      ticketInput.report_id,
      ticketInput.category,
      ticketInput.severity,
      ticketInput.priority,
      ticketInput.department,
      ticketInput.status || 'TICKET_CREATED',
      ticketInput.anonymized_media_ref || null,
      addr,
      lat,
      lon,
      ticketInput.procedure || '',
      sourcesJson,
      ticketInput.deadline ? new Date(ticketInput.deadline) : null,
      ticketInput.is_mock ?? true,
    ];

    const res = await this.pool.query(insertQuery, values);
    const newTicket = this.mapTicketRow(res.rows[0]);

    // 3. Record audit event in ticket_events
    await this.addTicketEvent({
      ticket_id: ticketId,
      from_status: null,
      to_status: newTicket.status,
      actor: 'n8n_persistence',
      notes: `Ticket registered from report ${newTicket.report_id}. Committed to PostgreSQL.`,
      created_at: new Date().toISOString(),
    });

    // 4. Update parent report status
    await this.pool.query('UPDATE reports SET status = $1 WHERE report_id = $2', [
      newTicket.status,
      newTicket.report_id,
    ]);

    return { ticket: newTicket, isNew: true };
  }

  public async getTickets(filters?: {
    category?: Category;
    department?: Department;
    status?: TicketStatus;
    severity?: Severity;
    priority?: Priority;
    search?: string;
  }): Promise<TicketDemo[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters?.category) {
      conditions.push(`category = $${idx++}`);
      values.push(filters.category);
    }
    if (filters?.department) {
      conditions.push(`department = $${idx++}`);
      values.push(filters.department);
    }
    if (filters?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters?.severity) {
      conditions.push(`severity = $${idx++}`);
      values.push(filters.severity);
    }
    if (filters?.priority) {
      conditions.push(`priority = $${idx++}`);
      values.push(filters.priority);
    }
    if (filters?.search) {
      conditions.push(`(
        ticket_id ILIKE $${idx} OR
        report_id ILIKE $${idx} OR
        procedure ILIKE $${idx} OR
        location_address ILIKE $${idx}
      )`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM tickets ${whereClause} ORDER BY created_at DESC;`;

    const res = await this.pool.query(query, values);
    return res.rows.map((r) => this.mapTicketRow(r));
  }

  public async getTicketById(ticket_id: string): Promise<TicketDemo | null> {
    const res = await this.pool.query('SELECT * FROM tickets WHERE ticket_id = $1', [ticket_id]);
    if (res.rows.length === 0) return null;
    return this.mapTicketRow(res.rows[0]);
  }

  public async getTicketByReportId(report_id: string): Promise<TicketDemo | null> {
    const res = await this.pool.query('SELECT * FROM tickets WHERE report_id = $1', [report_id]);
    if (res.rows.length === 0) return null;
    return this.mapTicketRow(res.rows[0]);
  }

  public async updateTicketStatus(
    ticket_id: string,
    to_status: TicketStatus,
    actor: string,
    notes?: string
  ): Promise<TicketDemo> {
    const current = await this.getTicketById(ticket_id);
    if (!current) {
      throw new Error(`Ticket ${ticket_id} not found`);
    }

    const from_status = current.status;
    const updateRes = await this.pool.query(
      'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $2 RETURNING *;',
      [to_status, ticket_id]
    );

    await this.addTicketEvent({
      ticket_id,
      from_status,
      to_status,
      actor: actor || 'municipal_staff',
      notes: notes || `Status changed from ${from_status} to ${to_status}`,
      created_at: new Date().toISOString(),
    });

    await this.pool.query('UPDATE reports SET status = $1 WHERE report_id = $2', [
      to_status,
      current.report_id,
    ]);

    return this.mapTicketRow(updateRes.rows[0]);
  }

  // --- Ticket Events ---
  public async addTicketEvent(event: Omit<TicketEventRecord, 'event_id'>): Promise<TicketEventRecord> {
    const query = `
      INSERT INTO ticket_events (ticket_id, from_status, to_status, actor, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const res = await this.pool.query(query, [
      event.ticket_id,
      event.from_status,
      event.to_status,
      event.actor,
      event.notes,
      event.created_at ? new Date(event.created_at) : new Date(),
    ]);

    return this.mapEventRow(res.rows[0]);
  }

  public async getTicketEvents(ticket_id: string): Promise<TicketEventRecord[]> {
    const res = await this.pool.query(
      'SELECT * FROM ticket_events WHERE ticket_id = $1 ORDER BY event_id ASC',
      [ticket_id]
    );
    return res.rows.map((r) => this.mapEventRow(r));
  }

  // --- Review Cases ---
  public async saveReviewCase(input: {
    report_id: string;
    review_reasons: string[];
    raw_payload?: any;
    decision_notes?: string;
  }): Promise<ReviewCaseRecord> {
    const review_id = `REV-${input.report_id}`;
    const reasonsJson = JSON.stringify(input.review_reasons || []);
    const payloadJson = JSON.stringify(input.raw_payload || {});

    // Ensure parent report exists in reports table to satisfy FK
    const repCheck = await this.pool.query('SELECT report_id FROM reports WHERE report_id = $1', [input.report_id]);
    if (repCheck.rows.length === 0) {
      await this.pool.query(
        `INSERT INTO reports (report_id, description, media_ref, decision, status, demo_mode)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (report_id) DO NOTHING;`,
        [
          input.report_id,
          input.raw_payload?.description || 'Citizen report pending review',
          input.raw_payload?.media_ref || 'mock://review-evidence',
          'REVIEW',
          'REVIEW_REQUIRED',
          true,
        ]
      );
    }

    const query = `
      INSERT INTO review_cases (review_id, report_id, review_reasons, status, raw_payload, decision_notes)
      VALUES ($1, $2, $3::jsonb, 'PENDING', $4::jsonb, $5)
      ON CONFLICT (review_id) DO UPDATE SET
        review_reasons = EXCLUDED.review_reasons,
        raw_payload = EXCLUDED.raw_payload,
        decision_notes = EXCLUDED.decision_notes
      RETURNING *;
    `;

    const res = await this.pool.query(query, [
      review_id,
      input.report_id,
      reasonsJson,
      payloadJson,
      input.decision_notes || null,
    ]);

    await this.pool.query('UPDATE reports SET status = $1 WHERE report_id = $2', [
      'REVIEW_REQUIRED',
      input.report_id,
    ]);

    return this.mapReviewRow(res.rows[0]);
  }

  public async getReviewCases(filters?: { status?: ReviewStatus }): Promise<ReviewCaseRecord[]> {
    let query = 'SELECT * FROM review_cases';
    const values: any[] = [];
    if (filters?.status) {
      query += ' WHERE status = $1';
      values.push(filters.status);
    }
    query += ' ORDER BY created_at DESC;';

    const res = await this.pool.query(query, values);
    return res.rows.map((r) => this.mapReviewRow(r));
  }

  public async getReviewCaseById(review_id: string): Promise<ReviewCaseRecord | null> {
    const res = await this.pool.query('SELECT * FROM review_cases WHERE review_id = $1', [
      review_id,
    ]);
    if (res.rows.length === 0) return null;
    return this.mapReviewRow(res.rows[0]);
  }

  public async resolveReviewCase(
    review_id: string,
    status: ReviewStatus,
    resolved_by: string,
    decision_notes?: string,
    approvedTicketData?: Partial<TicketDemo>
  ): Promise<{ reviewCase: ReviewCaseRecord; createdTicket?: TicketDemo }> {
    const updateQuery = `
      UPDATE review_cases
      SET status = $1, resolved_by = $2, resolved_at = CURRENT_TIMESTAMP, decision_notes = $3
      WHERE review_id = $4
      RETURNING *;
    `;

    const res = await this.pool.query(updateQuery, [
      status,
      resolved_by,
      decision_notes || null,
      review_id,
    ]);

    if (res.rows.length === 0) {
      throw new Error(`Review case ${review_id} not found`);
    }

    const reviewCase = this.mapReviewRow(res.rows[0]);
    let createdTicket: TicketDemo | undefined;

    if (status === 'APPROVED_TO_TICKET') {
      const report = await this.getReport(reviewCase.report_id);
      const category: Category = approvedTicketData?.category || 'ROAD_DAMAGE';
      const severity: Severity = approvedTicketData?.severity || 'MEDIUM';
      const department: Department =
        approvedTicketData?.department || 'ROADS_DEPARTMENT';

      const saveRes = await this.saveTicket({
        ticket_id: '',
        report_id: reviewCase.report_id,
        category,
        severity,
        priority: severity === 'HIGH' ? 'HIGH' : severity === 'LOW' ? 'LOW' : 'NORMAL',
        department,
        status: 'TICKET_CREATED',
        location: report?.location || null,
        anonymized_media_ref: 'safe/reviewed_image.jpg',
        procedure:
          approvedTicketData?.procedure ||
          'Manually approved from human review queue by municipal supervisor.',
        sources: [
          {
            document_title: 'Manual Supervisor Triage Assessment',
            source_url: null,
            chunk_id: 'manual-review-override',
            search_score: 1.0,
            is_official: true,
            is_mock: false,
          },
        ],
        deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        is_mock: false,
      });

      createdTicket = saveRes.ticket;
    }

    return { reviewCase, createdTicket };
  }

  // --- Aggregate Stats ---
  public async getStats() {
    const [countsRes, reviewRes, catRes, deptRes, sevRes] = await Promise.all([
      this.pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status IN ('TICKET_CREATED', 'OPEN', 'RECEIVED')) as open,
          COUNT(*) FILTER (WHERE status IN ('IN_PROGRESS', 'ASSIGNED')) as in_progress,
          COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved,
          COUNT(*) FILTER (WHERE priority = 'HIGH' OR severity = 'HIGH') as high_priority,
          COUNT(*) FILTER (WHERE assigned_to IS NULL AND status IN ('TICKET_CREATED', 'OPEN', 'RECEIVED')) as unassigned,
          COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline < NOW() AND status NOT IN ('RESOLVED', 'REJECTED')) as overdue,
          COUNT(*) FILTER (WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL) as geocoded
        FROM tickets;
      `),
      this.pool.query("SELECT COUNT(*) as count FROM review_cases WHERE status = 'PENDING';"),
      this.pool.query('SELECT category, COUNT(*) as count FROM tickets GROUP BY category;'),
      this.pool.query('SELECT department, COUNT(*) as count FROM tickets GROUP BY department;'),
      this.pool.query('SELECT severity, COUNT(*) as count FROM tickets GROUP BY severity;'),
    ]);

    const row = countsRes.rows[0];
    const totalTickets = parseInt(row.total, 10);
    const openTickets = parseInt(row.open, 10);
    const inProgressTickets = parseInt(row.in_progress, 10);
    const resolvedTickets = parseInt(row.resolved, 10);
    const highPriorityTickets = parseInt(row.high_priority, 10);
    const unassignedTickets = parseInt(row.unassigned, 10);
    const overdueTickets = parseInt(row.overdue, 10);
    const geocodedTickets = parseInt(row.geocoded, 10);
    const pendingReviews = parseInt(reviewRes.rows[0].count, 10);

    const byCategory: Record<string, number> = {};
    for (const r of catRes.rows) {
      byCategory[r.category] = parseInt(r.count, 10);
    }

    const byDepartment: Record<string, number> = {};
    for (const r of deptRes.rows) {
      byDepartment[r.department] = parseInt(r.count, 10);
    }

    const bySeverity: Record<string, number> = {};
    for (const r of sevRes.rows) {
      bySeverity[r.severity] = parseInt(r.count, 10);
    }

    return {
      totalTickets,
      openTickets,
      assignedTickets: inProgressTickets,
      inProgressTickets,
      resolvedTickets,
      highPriorityTickets,
      unassignedTickets,
      overdueTickets,
      geocodedTickets,
      pendingReviews,
      byCategory,
      byDepartment,
      bySeverity,
      resolvedRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
      avgResponseTime: null, // "Non disponible" when insufficient data, per Requirement 5
      avgResolutionTime: null, // "Non disponible" when insufficient data, per Requirement 5
    };
  }

  // --- Row Mappers ---
  private mapReportRow(row: any): ReportRecord {
    return {
      report_id: row.report_id,
      description: row.description,
      media_ref: row.media_ref,
      location:
        row.location_address || row.location_latitude !== null
          ? {
              address: row.location_address,
              latitude: row.location_latitude !== null ? parseFloat(row.location_latitude) : null,
              longitude: row.location_longitude !== null ? parseFloat(row.location_longitude) : null,
            }
          : null,
      decision: row.decision,
      status: row.status,
      demo_mode: row.demo_mode,
      user_id: row.user_id || null,
      tracking_token: row.tracking_token || null,
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  private mapTicketRow(row: any): TicketDemo {
    return {
      ticket_id: row.ticket_id,
      report_id: row.report_id,
      status: row.status,
      category: row.category,
      severity: row.severity,
      priority: row.priority,
      department: row.department,
      location:
        row.location_address || row.location_latitude !== null
          ? {
              address: row.location_address,
              latitude: row.location_latitude !== null ? parseFloat(row.location_latitude) : null,
              longitude: row.location_longitude !== null ? parseFloat(row.location_longitude) : null,
            }
          : null,
      anonymized_media_ref: row.anonymized_media_ref,
      procedure: row.procedure,
      sources: typeof row.sources === 'string' ? JSON.parse(row.sources) : row.sources || [],
      deadline: row.deadline ? new Date(row.deadline).toISOString() : null,
      persisted: row.persisted,
      storage_status: row.storage_status,
      is_mock: row.is_mock,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  private mapEventRow(row: any): TicketEventRecord {
    return {
      event_id: row.event_id,
      ticket_id: row.ticket_id,
      from_status: row.from_status,
      to_status: row.to_status,
      actor: row.actor,
      notes: row.notes,
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  private mapReviewRow(row: any): ReviewCaseRecord {
    return {
      review_id: row.review_id,
      report_id: row.report_id,
      review_reasons:
        typeof row.review_reasons === 'string'
          ? JSON.parse(row.review_reasons)
          : row.review_reasons || [],
      status: row.status,
      raw_payload:
        typeof row.raw_payload === 'string'
          ? JSON.parse(row.raw_payload)
          : row.raw_payload || {},
      decision_notes: row.decision_notes,
      resolved_by: row.resolved_by,
      resolved_at: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
    };
  }
}

export const db = new PostgreSQLDatabase();
