-- =============================================
-- WORKPLAN SCHEMA FOR DNPM BUDGET SYSTEM
-- Run this in Supabase SQL Editor
-- =============================================
--
-- PREREQUISITES: Run the main schema.sql first to create:
-- - financial_years table
-- - agencies table
-- - users table
-- - projects table
--
-- If you want to run this standalone (for testing),
-- set USE_FOREIGN_KEYS to false below.
-- =============================================

-- Set to false for standalone mode (no foreign key constraints)
DO $$
BEGIN
  -- This block handles whether to use foreign keys or not
  -- For production, ensure schema.sql is run first
  RAISE NOTICE 'Creating workplan schema...';
END $$;

-- =============================================
-- DROP EXISTING (if rerunning)
-- =============================================
DROP TRIGGER IF EXISTS calculate_activity_budget ON workplan_activities;
DROP TRIGGER IF EXISTS update_activities_timestamp ON workplan_activities;
DROP TRIGGER IF EXISTS update_workplans_timestamp ON workplans;
DROP FUNCTION IF EXISTS calculate_activity_total_budget();
DROP FUNCTION IF EXISTS update_workplan_timestamp();
DROP TABLE IF EXISTS workplan_workflow_actions CASCADE;
DROP TABLE IF EXISTS workplan_activities CASCADE;
DROP TABLE IF EXISTS workplans CASCADE;
DROP TYPE IF EXISTS workplan_status CASCADE;
DROP TYPE IF EXISTS activity_status CASCADE;

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE workplan_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'in_progress',
  'completed',
  'delayed'
);

CREATE TYPE activity_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'delayed',
  'cancelled'
);

-- =============================================
-- WORKPLANS TABLE
-- =============================================
CREATE TABLE workplans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_year_id UUID NOT NULL,
  agency_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  total_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status workplan_status NOT NULL DEFAULT 'draft',
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one workplan per agency per financial year
  UNIQUE(financial_year_id, agency_id)
);

-- Add foreign keys only if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_years') THEN
    ALTER TABLE workplans ADD CONSTRAINT fk_workplan_financial_year
      FOREIGN KEY (financial_year_id) REFERENCES financial_years(id) ON DELETE RESTRICT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies') THEN
    ALTER TABLE workplans ADD CONSTRAINT fk_workplan_agency
      FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE workplans ADD CONSTRAINT fk_workplan_submitted_by
      FOREIGN KEY (submitted_by) REFERENCES users(id);
    ALTER TABLE workplans ADD CONSTRAINT fk_workplan_approved_by
      FOREIGN KEY (approved_by) REFERENCES users(id);
    ALTER TABLE workplans ADD CONSTRAINT fk_workplan_created_by
      FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some foreign keys could not be added: %', SQLERRM;
END $$;

-- =============================================
-- WORKPLAN ACTIVITIES TABLE
-- =============================================
CREATE TABLE workplan_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplan_id UUID NOT NULL REFERENCES workplans(id) ON DELETE CASCADE,
  project_id UUID,
  activity_code VARCHAR(50) NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  description TEXT,
  responsible_unit VARCHAR(100) NOT NULL,
  responsible_officer VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Quarterly targets
  q1_target DECIMAL(12, 2) NOT NULL DEFAULT 0,
  q2_target DECIMAL(12, 2) NOT NULL DEFAULT 0,
  q3_target DECIMAL(12, 2) NOT NULL DEFAULT 0,
  q4_target DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Quarterly actuals
  q1_actual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  q2_actual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  q3_actual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  q4_actual DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Quarterly budgets
  q1_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  q2_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  q3_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  q4_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,

  total_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  key_performance_indicator TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  status activity_status NOT NULL DEFAULT 'not_started',
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique activity codes within a workplan
  UNIQUE(workplan_id, activity_code)
);

-- Add project FK if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE workplan_activities ADD CONSTRAINT fk_activity_project
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Project FK could not be added: %', SQLERRM;
END $$;

-- =============================================
-- WORKPLAN WORKFLOW ACTIONS TABLE
-- =============================================
CREATE TABLE workplan_workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplan_id UUID NOT NULL REFERENCES workplans(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  from_status workplan_status,
  to_status workplan_status NOT NULL,
  action_by UUID NOT NULL,
  action_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comments TEXT
);

-- Add user FK if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE workplan_workflow_actions ADD CONSTRAINT fk_workflow_action_by
      FOREIGN KEY (action_by) REFERENCES users(id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'User FK could not be added: %', SQLERRM;
END $$;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_workplans_agency ON workplans(agency_id);
CREATE INDEX idx_workplans_financial_year ON workplans(financial_year_id);
CREATE INDEX idx_workplans_status ON workplans(status);
CREATE INDEX idx_activities_workplan ON workplan_activities(workplan_id);
CREATE INDEX idx_activities_project ON workplan_activities(project_id);
CREATE INDEX idx_activities_status ON workplan_activities(status);
CREATE INDEX idx_workflow_workplan ON workplan_workflow_actions(workplan_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================
ALTER TABLE workplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workplan_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workplan_workflow_actions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (simplified for demo)
-- In production, use more restrictive policies
CREATE POLICY "Allow all for authenticated users" ON workplans
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON workplan_activities
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON workplan_workflow_actions
  FOR ALL USING (auth.role() = 'authenticated');

-- Also allow access via service role
CREATE POLICY "Allow service role full access" ON workplans
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON workplan_activities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON workplan_workflow_actions
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_workplan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workplans_timestamp
  BEFORE UPDATE ON workplans
  FOR EACH ROW
  EXECUTE FUNCTION update_workplan_timestamp();

CREATE TRIGGER update_activities_timestamp
  BEFORE UPDATE ON workplan_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_workplan_timestamp();

-- =============================================
-- FUNCTION TO CALCULATE ACTIVITY TOTAL BUDGET
-- =============================================
CREATE OR REPLACE FUNCTION calculate_activity_total_budget()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_budget = NEW.q1_budget + NEW.q2_budget + NEW.q3_budget + NEW.q4_budget;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_activity_budget
  BEFORE INSERT OR UPDATE ON workplan_activities
  FOR EACH ROW
  EXECUTE FUNCTION calculate_activity_total_budget();

-- =============================================
-- ENABLE REALTIME
-- =============================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE workplans;
  ALTER PUBLICATION supabase_realtime ADD TABLE workplan_activities;
  ALTER PUBLICATION supabase_realtime ADD TABLE workplan_workflow_actions;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication already exists or could not be added';
END $$;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'WORKPLAN SCHEMA CREATED SUCCESSFULLY';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - workplans';
  RAISE NOTICE '  - workplan_activities';
  RAISE NOTICE '  - workplan_workflow_actions';
  RAISE NOTICE '';
  RAISE NOTICE 'Run workplan-seed.sql to add sample data';
  RAISE NOTICE '==========================================';
END $$;
