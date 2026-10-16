# Project Implementation Plan — Member 5: Web Interface & Database
**Project:** Automated Municipal Ticket System  
**Role:** Member 5 — Citizen Web Application, Municipality Dashboard & Database  
**Workspace:** `c:\Users\ranni\OneDrive\Bureau\municipal-member5`  
**Reference Package:** `Member5_Handoff_Package/` (Preserved Unmodified)

---

## 1. Executive Summary & Objective

Member 5 is responsible for:
1. **Citizen Portal:** A responsive, modern citizen-facing application allowing users to submit infrastructure issues (potholes, street lighting, waste, water leaks), supply photos/demo fixtures and location details (GPS or manual), and track their report outcomes (PASS, REVIEW, REJECT).
2. **Municipality Dashboard:** An administrative operations hub for municipal agents to view incoming tickets, filter by department and priority, review flagged cases in the Review Queue, inspect RAG policy citations and anonymized media, and update ticket lifecycle states (`TICKET_CREATED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`).
3. **Backend Service & Storage API:** A robust Node.js/TypeScript REST API providing endpoints for ticket persistence (`POST /api/tickets`), file uploads (`POST /api/uploads`), human review handling (`POST /api/reviews`, `PATCH /api/reviews/:id`), status updates (`PATCH /api/tickets/:id/status`), and the proxy/orchestration bridge (`POST /api/municipal-ticket`).
4. **Database Architecture:** Complete PostgreSQL schema (`database/schema.sql`) for `reports`, `tickets`, `ticket_events`, and `review_cases`, with an automated dual-mode adapter (PostgreSQL + resilient local SQLite/file-backed fallback) ensuring 100% immediate out-of-the-box execution and testing.
5. **Transparency & Honesty:** Explicit adherence to the team rule: **Do not claim real AI image analysis or RAG retrieval when using simulated n8n responses.** All demo responses and fixture representations will clearly state their mock/simulated status.

---

## 2. Architecture & System Flow

```text
+-----------------------------------------------------------------------------------+
|                                 CITIZEN CLIENT                                    |
|   - Issue Form (Description, Fixture/Upload, Location: GPS / Manual)              |
|   - Real-time Validation (Report ID, 5-3000 chars, safe media_ref)                |
|   - Live Submission Feedback & Ticket Tracker (Search by Report ID / Ticket ID)   |
+---------------------------------------------------+-------------------------------+
                                                    |
                                                    v
+-----------------------------------------------------------------------------------+
|                        MEMBER 5 BACKEND API & PROXY LAYER                         |
|   - POST /api/municipal-ticket  (Relay to n8n OR high-fidelity fallback engine)  |
|   - POST /api/uploads           (Controlled media storage & safe ref generation)  |
|   - POST /api/tickets           (Idempotent commit by report_id -> persisted:true)|
|   - POST /api/reviews           (Review queue persistence for Gate 1/2/3 flags)   |
|   - GET  /api/tickets           (Filtering, searching, pagination, sorting)       |
|   - GET  /api/tickets/:id       (Full details, RAG citations, event audit trail)  |
|   - PATCH /api/tickets/:id/status (Lifecycle validation -> append ticket_events)  |
|   - GET  /api/reviews           (Review queue list & statistics)                  |
|   - PATCH /api/reviews/:id      (Review resolution: Approve -> Ticket, or Reject) |
|   - GET  /api/stats             (KPI metrics for municipal dashboard)             |
+--------------------------+--------------------------------+-----------------------+
                           |                                |
                           v                                v
+-------------------------------------+  +------------------------------------------+
|       n8n PHASE 5 WORKFLOW          |  |           PERSISTENCE LAYER              |
|  (POST /webhook/municipal-ticket)   |  |   - PostgreSQL Schema (database/schema)  |
|  - Input Check -> Gate 1 (Intake)   |  |   - Tables:                              |
|  - Gate 2 (Vision) -> Routing Rules |  |     * reports (idempotency key)          |
|  - Gate 3 (Knowledge) -> Audit Trace|  |     * tickets (official record, SLA)     |
|  (Mock engine when n8n offline)     |  |     * ticket_events (immutable audit log)|
+-------------------------------------+  |     * review_cases (human review queue)  |
                                         +------------------+-----------------------+
                                                            |
                                                            v
+-----------------------------------------------------------------------------------+
|                        MUNICIPALITY OPERATIONS DASHBOARD                          |
|   - KPI Overview (Total, Open, In Review, Resolved, Avg SLA)                     |
|   - Tickets Table with Search & Faceted Filters (Category, Dept, Severity, Status)|
|   - Detail Drawer with Anonymized Media, RAG Citations & Audit Event Timeline     |
|   - Action Buttons (Approve, Assign, Mark In Progress, Resolve, Reject)          |
|   - Dedicated Human Review Queue Tab with Decision Modals                         |
|   - Civic Transparency & Incident Heatmap view                                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Implementation Phases

### Phase 1: Environment & Project Foundation
- Verify runtime availability (Node.js LTS, npm, TypeScript).
- Scaffold project directory structure in workspace root:
  - `backend/`: Express / TypeScript backend, CORS, file upload handling, DB layer, and test runners.
  - `frontend/`: Vite + React + TypeScript frontend with modern styling tokens, Lucide icons, glassmorphism design.
  - `database/`: `schema.sql` (PostgreSQL), `seed.sql` (realistic initial tickets).
  - `tests/`: Automated test suite covering all handoff scenarios.
- Configure scripts and environment variables (`.env.example`).

### Phase 2: Database Schema & Storage Adapter
- Design `schema.sql` with PostgreSQL best practices:
  - `reports`: Tracks all inbound citizen submissions (`report_id`, `description`, `media_ref`, `location`, `status`, `created_at`).
  - `tickets`: Stores finalized tickets (`ticket_id` PK, `report_id` unique FK, `category`, `severity`, `priority`, `department`, `procedure`, `sources`, `deadline`, `status`, `persisted`, `created_at`, `updated_at`).
  - `ticket_events`: Immutable audit trail (`event_id`, `ticket_id`, `from_status`, `to_status`, `actor`, `notes`, `created_at`).
  - `review_cases`: Human review queue (`review_id`, `report_id`, `review_reasons`, `raw_payload`, `status`, `decision_notes`, `resolved_by`, `created_at`).
- Create database adapter that connects to PostgreSQL if `DATABASE_URL` is provided, and gracefully defaults to a local file-backed SQLite database (`municipal.db`) so the app runs without external DB setup.
- Seed database with realistic demonstration tickets across all 4 municipal departments.

### Phase 3: Backend API & n8n Integration Bridge
- Implement `POST /api/municipal-ticket`:
  - Validates request payload against Member 1's contracts.
  - Attempts forward to live n8n webhook (`http://localhost:5678/webhook/municipal-ticket-phase5` or test path).
  - If n8n is unreachable or not started, seamlessly invokes the embedded high-fidelity Phase 5 engine reproducing the exact 20 nodes, 3 gates, and 6 fixture behaviors.
  - Automatically persists successful tickets to `tickets` table (setting `persisted: true` and returning real DB `ticket_id`), and persists review cases to `review_cases`.
- Implement `POST /api/uploads`: Secure multipart upload, MIME validation, saving to `backend/uploads/`, generating `uploads/<filename>` safe reference.
- Implement `POST /api/tickets` & `POST /api/reviews`: Explicit persistence endpoints matching Member 1's handoff contract.
- Implement `GET /api/tickets`, `GET /api/tickets/:id`, and `PATCH /api/tickets/:id/status`.
- Implement `GET /api/reviews` and `PATCH /api/reviews/:id`.
- Implement `GET /api/stats` and `GET /api/health`.

### Phase 4: Modern Citizen Web Application
- Build a responsive, accessible citizen portal using modern design aesthetics (Inter & Space Grotesk fonts, curated municipal color palette, glassmorphism, fluid micro-interactions).
- **Incident Reporting Form:**
  - Category selector & quick demo fixture picker (`mock://pothole`, `mock://streetlight`, `mock://waste`, `mock://water_leak`, `mock://unrelated`, `mock://blurry`).
  - File upload with instant preview and safe reference generation.
  - Incident description (with live character counter, 5–3000 chars validation).
  - Geolocation component: One-click browser GPS capture with address reverse-lookup fallback and manual address input.
  - Unique Report ID generator (`RPT-YYYY-XXXX`).
- **Interactive Outcome Display:**
  - PASS: Animated ticket card with tracking ID, department routing, severity badge, RAG procedure, sources, and persistence badge.
  - REVIEW: Clear notification that report was routed to human reviewers, displaying specific review reasons and estimated resolution timeline.
  - REJECT: Contextual error messages with guidance to fix input.
- **Citizen Report Lookup / Tracking Tab:**
  - Input `report_id` or `ticket_id` to retrieve real-time status and event log.

### Phase 5: Municipality Staff Operations Dashboard
- **Navigation & Brand:** Premium municipal control center layout with dark/light mode toggle.
- **KPI Metrics Header:** Cards for Total Issues, Open, Under Review, In Progress, Resolved, and Average SLA.
- **Live Ticket Management Table:**
  - Faceted filters (Department, Category, Status, Severity, Priority).
  - Search by Ticket ID, Report ID, or Description keyword.
  - Sortable columns, status pills, and SLA countdowns.
- **Detailed Ticket Inspection Drawer / Modal:**
  - Full issue details, category, severity, priority, department.
  - Anonymized media view with privacy badge.
  - Geographic location with map preview.
  - RAG procedure and source provenance card (Document Title, Chunk ID, Score, Mock vs Official indicator).
  - Audit trace stages from n8n pipeline.
  - Chronological `ticket_events` history with actor notes.
  - Status management controls: Approve, Assign to Crew, Mark In Progress, Mark Resolved, or Reject.
- **Human Review Queue View:**
  - Filter and inspect flagged cases (`IMAGE_TEXT_MISMATCH_OR_UNCLEAR`, `INTAKE_MEDIA_OR_PRIVACY_NOT_VERIFIED`, etc.).
  - Human review decision modal: manually approve into an official ticket or reject with feedback.
- **Civic Transparency / Incident Map View:**
  - Interactive map view / neighborhood cluster of reported urban issues.

### Phase 6: Automated Testing & Verification
- Unit & integration test suite (`tests/api.test.ts` or standalone test runner):
  - PASS submission test with pothole fixture (`examples/pass_pothole.json`).
  - Idempotent submission test (duplicate `report_id` does not create duplicate tickets).
  - REVIEW submission test with mismatch fixture (`examples/review_mismatch.json`).
  - REJECT submission test with missing media fixture (`examples/reject_missing_media.json`).
  - Knowledge outage / empty sources test.
  - Status transition workflow test (`TICKET_CREATED` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED`).
  - File upload and safe media reference test.
- Cross-browser verification and screenshot captures.

### Phase 7: Documentation & Final Evidence
- Complete `README.md` with step-by-step setup, API endpoints, environment config, and screenshots.
- Ensure all handoff files in `Member5_Handoff_Package/` remain strictly untouched.
- Verify that no false claims of real AI analysis or RAG retrieval are made when using simulated responses.

---

## 4. Verification & Acceptance Criteria
- [ ] Backend starts cleanly and serves REST APIs.
- [ ] Database schema creates all tables and constraints without errors.
- [ ] Frontend builds and renders both Citizen and Municipality views smoothly.
- [ ] All 6 handoff test fixtures execute and produce exact expected outcomes (PASS 200, REVIEW 202, REJECT 422).
- [ ] Ticket persistence writes to database and returns real `ticket_id` with `persisted: true`.
- [ ] Status updates validate transitions and append immutable records to `ticket_events`.
- [ ] Review cases are visible and actionable in the Review Queue.
