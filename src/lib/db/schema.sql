-- BillSync Database Schema
-- Run this file against your Supabase SQL editor or any Postgres instance
-- Supabase: Dashboard → SQL Editor → paste and run
-- Self-hosted: psql -d yourdb -f schema.sql

-- ROLES
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- PERMISSIONS
CREATE TABLE permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  key        TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ROLE PERMISSIONS
CREATE TABLE role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- USERS (mirrors Supabase auth.users)
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER ROLES
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- PROJECTS
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- JIRA CONFIGURATION
CREATE TABLE project_jira_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  instance_url        TEXT NOT NULL,
  jira_project_key    TEXT NOT NULL,
  user_email          TEXT NOT NULL,
  encrypted_api_token TEXT NOT NULL,
  is_verified         BOOLEAN DEFAULT false,
  last_verified_at    TIMESTAMPTZ,
  jql_scope           TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Migration (run if table already exists):
-- ALTER TABLE project_jira_configs ADD COLUMN IF NOT EXISTS jql_scope TEXT;

-- BILLING PERIODS
CREATE TABLE billings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WORKLOG SNAPSHOTS
CREATE TABLE worklogs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id       UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,
  jira_worklog_id  TEXT NOT NULL,
  jira_issue_key   TEXT NOT NULL,
  issue_summary    TEXT,
  author_name      TEXT NOT NULL,
  author_jira_id   TEXT NOT NULL,
  work_started     DATE NOT NULL,
  original_seconds INTEGER NOT NULL,
  modified_seconds INTEGER,
  original_comment       TEXT,
  modified_comment       TEXT,
  is_manual              BOOLEAN NOT NULL DEFAULT false,
  custom_summary         TEXT,
  jira_reference_removed BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- EXPORT AUDIT LOG
CREATE TABLE export_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id  UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,
  exported_by UUID REFERENCES users(id),
  exported_at TIMESTAMPTZ DEFAULT now(),
  format      TEXT DEFAULT 'xlsx'
);

-- SEED: Admin role and all permissions
INSERT INTO roles (name, description)
VALUES ('admin', 'Full access to all features');

INSERT INTO permissions (name, key) VALUES
  ('View Project',       'project:view'),
  ('Create Project',     'project:create'),
  ('Edit Project',       'project:edit'),
  ('Archive Project',    'project:archive'),
  ('Manage Jira Config', 'jira:manage'),
  ('Create Billing',     'billing:create'),
  ('Edit Worklog',       'worklog:edit'),
  ('Finalize Billing',   'billing:finalize'),
  ('Export Billing',     'billing:export');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin';

-- ALLOWED EMAILS (login allowlist)
-- Add email addresses here before they can log in.
-- Emails are case-insensitive — store in lowercase, compare in lowercase.
CREATE TABLE allowed_emails (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  note       TEXT,                    -- optional label e.g. "John - Engineering lead"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed: add your allowed emails here before running the schema
-- INSERT INTO allowed_emails (email, note) VALUES
--   ('you@yourcompany.com', 'Admin'),
--   ('teammate@yourcompany.com', 'Billing team');
