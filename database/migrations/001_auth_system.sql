-- Migration 001: Authentication, User Management, Sessions, and Audit Logs
-- Safe to run on existing PostgreSQL 14 instance without data loss.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('CITIZEN', 'MUNICIPAL_AGENT', 'ADMINISTRATOR')),
    department VARCHAR(64) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    phone VARCHAR(64) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. User Sessions Table (Stateful server-managed sessions with HttpOnly cookies)
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- 3. Password Resets Table
CREATE TABLE IF NOT EXISTS password_resets (
    token VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NULL,
    details JSONB NULL,
    ip_address VARCHAR(64) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 5. Add user_id to reports for citizen ownership tracking (backward compatible)
DO $$ BEGIN
    ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 6. Add assigned_to and assigned_agent_name to tickets (backward compatible)
DO $$ BEGIN
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_agent_name VARCHAR(255) NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
