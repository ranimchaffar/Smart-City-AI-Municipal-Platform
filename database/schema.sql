-- Automated Municipal Ticket System - Member 5 Database Schema
-- Compatible with PostgreSQL 13+
-- Author: Member 5 (Web App, Dashboard & Database)

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES & DOMAIN VALUES
-- Matches contracts agreed with Member 1 (n8n), Member 3, and Member 4
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE ticket_category AS ENUM (
        'ROAD_DAMAGE',
        'STREET_LIGHTING',
        'WASTE',
        'WATER_LEAK',
        'NONE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_severity AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM (
        'LOW',
        'NORMAL',
        'HIGH'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE municipal_department AS ENUM (
        'ROADS_DEPARTMENT',
        'PUBLIC_LIGHTING_DEPARTMENT',
        'SANITATION_DEPARTMENT',
        'WATER_SERVICES_DEPARTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM (
        'RECEIVED',
        'VALIDATING',
        'ANALYZING',
        'REVIEW_REQUIRED',
        'TICKET_CREATED',
        'ASSIGNED',
        'IN_PROGRESS',
        'RESOLVED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_decision AS ENUM (
        'PASS',
        'REVIEW',
        'REJECT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE 1: reports
-- Ingestion log for all inbound citizen reports.
-- report_id is unique caller- or proxy-generated idempotency key (e.g. RPT-001)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
    report_id VARCHAR(64) PRIMARY KEY,
    description TEXT NOT NULL CHECK (length(trim(description)) >= 5 AND length(description) <= 3000),
    media_ref VARCHAR(512) NOT NULL,
    location_address VARCHAR(300),
    location_latitude NUMERIC(10, 7) CHECK (location_latitude IS NULL OR (location_latitude >= -90 AND location_latitude <= 90)),
    location_longitude NUMERIC(10, 7) CHECK (location_longitude IS NULL OR (location_longitude >= -180 AND location_longitude <= 180)),
    decision VARCHAR(16) NOT NULL DEFAULT 'PASS',
    status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
    demo_mode BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_media_ref_format CHECK (
        media_ref ~ '^(mock://[a-z0-9_-]+|uploads/[A-Za-z0-9_./-]+)$' AND media_ref NOT LIKE '%..%'
    )
);

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ============================================================================
-- TABLE 2: tickets
-- Durable tickets created after workflow PASS.
-- Enforces 1-to-1 relationship with report_id (IDEMPOTENCY).
-- persisted = TRUE indicates real persistence in Member 5 database.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id VARCHAR(64) PRIMARY KEY,
    report_id VARCHAR(64) NOT NULL UNIQUE REFERENCES reports(report_id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    priority VARCHAR(16) NOT NULL,
    department VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'TICKET_CREATED',
    anonymized_media_ref VARCHAR(512),
    location_address VARCHAR(300),
    location_latitude NUMERIC(10, 7),
    location_longitude NUMERIC(10, 7),
    procedure TEXT,
    sources JSONB DEFAULT '[]'::jsonb,
    deadline TIMESTAMP WITH TIME ZONE,
    persisted BOOLEAN NOT NULL DEFAULT TRUE,
    storage_status VARCHAR(32) NOT NULL DEFAULT 'PERSISTED',
    is_mock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON tickets(department);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_severity ON tickets(severity);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- ============================================================================
-- TABLE 3: ticket_events
-- Immutable audit trail of every status transition and staff interaction.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ticket_events (
    event_id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    actor VARCHAR(64) NOT NULL DEFAULT 'system',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_created_at ON ticket_events(created_at DESC);

-- ============================================================================
-- TABLE 4: review_cases
-- Durable queue for submissions resulting in REVIEW (HTTP 202).
-- Saves reason codes and workflow state for municipal staff intervention.
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_cases (
    review_id VARCHAR(64) PRIMARY KEY,
    report_id VARCHAR(64) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    review_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED_TO_TICKET', 'DISMISSED')),
    raw_payload JSONB,
    decision_notes TEXT,
    resolved_by VARCHAR(64),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_cases_status ON review_cases(status);
CREATE INDEX IF NOT EXISTS idx_review_cases_created_at ON review_cases(created_at DESC);

-- ============================================================================
-- TRIGGER: update updated_at timestamp on tickets
-- ============================================================================
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ticket_timestamp ON tickets;
CREATE TRIGGER trg_update_ticket_timestamp
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_timestamp();

COMMENT ON TABLE reports IS 'Inbound citizen incident submissions and validation states';
COMMENT ON TABLE tickets IS 'Persistent municipal incident tickets committed after AI workflow PASS';
COMMENT ON TABLE ticket_events IS 'Immutable lifecycle log of state changes for accountability';
COMMENT ON TABLE review_cases IS 'Human-in-the-loop triage queue for ambiguous or mismatched reports';
