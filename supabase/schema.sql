-- DNPM Budget & Cashflow System - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'agency_user',
        'agency_approver',
        'dnpm_reviewer',
        'dnpm_approver',
        'system_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'draft',
        'submitted',
        'returned',
        'approved_by_agency',
        'under_dnpm_review',
        'approved_by_dnpm',
        'locked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE financial_year_status AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE agency_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_action_type AS ENUM (
        'submit',
        'return',
        'approve_agency',
        'approve_dnpm',
        'lock',
        'reopen'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- AGENCIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_name TEXT NOT NULL,
    agency_code TEXT,
    sector TEXT,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    status agency_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status);
CREATE INDEX IF NOT EXISTS idx_agencies_code ON agencies(agency_code);

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'agency_user',
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- FINANCIAL YEARS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS financial_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE,
    status financial_year_status DEFAULT 'open',
    submission_deadline DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_years_status ON financial_years(status);
CREATE INDEX IF NOT EXISTS idx_financial_years_year ON financial_years(year);

-- =====================================================
-- DONOR CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS donor_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code INTEGER NOT NULL UNIQUE CHECK (code >= 0 AND code <= 9),
    donor_name TEXT NOT NULL,
    active BOOLEAN DEFAULT true
);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    financial_year_id UUID NOT NULL REFERENCES financial_years(id) ON DELETE RESTRICT,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
    project_title TEXT NOT NULL,
    project_code TEXT,
    expenditure_vote_no TEXT,
    division TEXT,
    main_program TEXT,
    program TEXT,
    manager_name TEXT,
    objective TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status project_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_financial_year_id ON projects(financial_year_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- =====================================================
-- BUDGET LINES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_no TEXT NOT NULL,
    description_of_item TEXT NOT NULL,
    donor_code_id UUID NOT NULL REFERENCES donor_codes(id) ON DELETE RESTRICT,
    original_budget DECIMAL(15,2) DEFAULT 0,
    revised_budget DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_lines_project_id ON budget_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_donor_code_id ON budget_lines(donor_code_id);

-- =====================================================
-- CASHFLOW MONTHLY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS cashflow_monthly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_line_id UUID NOT NULL UNIQUE REFERENCES budget_lines(id) ON DELETE CASCADE,
    jan DECIMAL(15,2) DEFAULT 0,
    feb DECIMAL(15,2) DEFAULT 0,
    mar DECIMAL(15,2) DEFAULT 0,
    apr DECIMAL(15,2) DEFAULT 0,
    may DECIMAL(15,2) DEFAULT 0,
    jun DECIMAL(15,2) DEFAULT 0,
    jul DECIMAL(15,2) DEFAULT 0,
    aug DECIMAL(15,2) DEFAULT 0,
    sep DECIMAL(15,2) DEFAULT 0,
    oct DECIMAL(15,2) DEFAULT 0,
    nov DECIMAL(15,2) DEFAULT 0,
    "dec" DECIMAL(15,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cashflow_monthly_budget_line_id ON cashflow_monthly(budget_line_id);

-- =====================================================
-- WORKFLOW ACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    action_type workflow_action_type NOT NULL,
    action_by_user UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action_date TIMESTAMPTZ DEFAULT NOW(),
    comments TEXT
);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_project_id ON workflow_actions(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_action_by_user ON workflow_actions(action_by_user);

-- =====================================================
-- ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_attachments_project_id ON attachments(project_id);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    old_value JSONB,
    new_value JSONB,
    field_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for agencies (all users can read, admins can write)
CREATE POLICY "agencies_read_all" ON agencies FOR SELECT USING (true);
CREATE POLICY "agencies_admin_write" ON agencies FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.auth_id = auth.uid()
        AND users.role = 'system_admin'
    )
);

-- Create policies for users
CREATE POLICY "users_read_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_admin_write" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.auth_id = auth.uid()
        AND users.role = 'system_admin'
    )
);

-- Create policies for financial_years
CREATE POLICY "financial_years_read_all" ON financial_years FOR SELECT USING (true);
CREATE POLICY "financial_years_admin_write" ON financial_years FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.auth_id = auth.uid()
        AND users.role IN ('system_admin', 'dnpm_approver')
    )
);

-- Create policies for donor_codes
CREATE POLICY "donor_codes_read_all" ON donor_codes FOR SELECT USING (true);
CREATE POLICY "donor_codes_admin_write" ON donor_codes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.auth_id = auth.uid()
        AND users.role = 'system_admin'
    )
);

-- Create policies for projects (agency can only see their own, DNPM sees all)
CREATE POLICY "projects_read" ON projects FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.auth_id = auth.uid()
        AND (
            users.role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
            OR users.agency_id = projects.agency_id
        )
    )
);

CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.auth_id = auth.uid()
        AND (
            users.role IN ('system_admin')
            OR users.agency_id = agency_id
        )
    )
);

CREATE POLICY "projects_update" ON projects FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.auth_id = auth.uid()
        AND (
            users.role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
            OR users.agency_id = projects.agency_id
        )
    )
);

-- Create policies for budget_lines
CREATE POLICY "budget_lines_read" ON budget_lines FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN users u ON u.auth_id = auth.uid()
        WHERE p.id = budget_lines.project_id
        AND (
            u.role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
            OR u.agency_id = p.agency_id
        )
    )
);

CREATE POLICY "budget_lines_write" ON budget_lines FOR ALL USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN users u ON u.auth_id = auth.uid()
        WHERE p.id = budget_lines.project_id
        AND (
            u.role IN ('system_admin')
            OR u.agency_id = p.agency_id
        )
    )
);

-- Create policies for cashflow_monthly
CREATE POLICY "cashflow_monthly_read" ON cashflow_monthly FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM budget_lines bl
        JOIN projects p ON p.id = bl.project_id
        JOIN users u ON u.auth_id = auth.uid()
        WHERE bl.id = cashflow_monthly.budget_line_id
        AND (
            u.role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
            OR u.agency_id = p.agency_id
        )
    )
);

CREATE POLICY "cashflow_monthly_write" ON cashflow_monthly FOR ALL USING (
    EXISTS (
        SELECT 1 FROM budget_lines bl
        JOIN projects p ON p.id = bl.project_id
        JOIN users u ON u.auth_id = auth.uid()
        WHERE bl.id = cashflow_monthly.budget_line_id
        AND (
            u.role IN ('system_admin')
            OR u.agency_id = p.agency_id
        )
    )
);

-- Create policies for workflow_actions
CREATE POLICY "workflow_actions_read" ON workflow_actions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN users u ON u.auth_id = auth.uid()
        WHERE p.id = workflow_actions.project_id
        AND (
            u.role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
            OR u.agency_id = p.agency_id
        )
    )
);

CREATE POLICY "workflow_actions_insert" ON workflow_actions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users WHERE users.auth_id = auth.uid()
    )
);

-- Create policies for attachments
CREATE POLICY "attachments_read" ON attachments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN users u ON u.auth_id = auth.uid()
        WHERE p.id = attachments.project_id
        AND (
            u.role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
            OR u.agency_id = p.agency_id
        )
    )
);

CREATE POLICY "attachments_write" ON attachments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN users u ON u.auth_id = auth.uid()
        WHERE p.id = attachments.project_id
        AND (
            u.role IN ('system_admin')
            OR u.agency_id = p.agency_id
        )
    )
);

-- Create policies for audit_logs (read-only for admins)
CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.auth_id = auth.uid()
        AND users.role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
    )
);

CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_lines_updated_at ON budget_lines;
CREATE TRIGGER update_budget_lines_updated_at
    BEFORE UPDATE ON budget_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after auth signup
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'agency_user'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_auth_user();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
