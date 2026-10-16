# Member 5 — Database Architecture & Schema Documentation

## Overview
This database supports the **Automated Municipal Ticket System**, fulfilling Member 5's responsibilities:
1. **Durable persistence** of valid tickets (`tickets` table) with `persisted: true`.
2. **Idempotency** on `report_id` ensuring multiple retries from n8n or citizens do not duplicate tickets.
3. **Auditability** via an append-only `ticket_events` lifecycle journal.
4. **Human Review Queue** (`review_cases`) for reports flagged by n8n validation gates (Gate 1 Intake, Gate 2 Vision, Gate 3 Knowledge).

## Tables Summary

| Table | Primary Key | Key Foreign Keys | Purpose |
|---|---|---|---|
| `reports` | `report_id` | - | Raw citizen submissions, validation status, timestamps |
| `tickets` | `ticket_id` | `report_id` (UNIQUE) | Authorized municipal tickets committed after workflow PASS |
| `ticket_events` | `event_id` | `ticket_id` | Immutable lifecycle change log (from_status -> to_status) |
| `review_cases` | `review_id` | `report_id` | Queue for reports needing human review (HTTP 202) |

## Allowed Domain Values

- **Category:** `ROAD_DAMAGE`, `STREET_LIGHTING`, `WASTE`, `WATER_LEAK`, `NONE`
- **Severity:** `LOW`, `MEDIUM`, `HIGH`
- **Priority:** `LOW`, `NORMAL`, `HIGH`
- **Department:** `ROADS_DEPARTMENT`, `PUBLIC_LIGHTING_DEPARTMENT`, `SANITATION_DEPARTMENT`, `WATER_SERVICES_DEPARTMENT`
- **Ticket Status:** `TICKET_CREATED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`
- **Review Status:** `PENDING`, `APPROVED_TO_TICKET`, `DISMISSED`

## Idempotency Guarantee
The `tickets.report_id` column has a `UNIQUE` constraint. If n8n or a client retries `POST /api/tickets` with the same `report_id`, the database gracefully returns the existing ticket record instead of inserting a duplicate.
