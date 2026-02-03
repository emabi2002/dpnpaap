-- DNPM Budget System - RLS Policy Fix
-- Run this AFTER schema.sql to fix the infinite recursion issue

-- Drop the problematic policies
DROP POLICY IF EXISTS "agencies_admin_write" ON agencies;
DROP POLICY IF EXISTS "users_admin_write" ON users;
DROP POLICY IF EXISTS "financial_years_admin_write" ON financial_years;
DROP POLICY IF EXISTS "donor_codes_admin_write" ON donor_codes;
DROP POLICY IF EXISTS "projects_read" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "budget_lines_read" ON budget_lines;
DROP POLICY IF EXISTS "budget_lines_write" ON budget_lines;
DROP POLICY IF EXISTS "cashflow_monthly_read" ON cashflow_monthly;
DROP POLICY IF EXISTS "cashflow_monthly_write" ON cashflow_monthly;
DROP POLICY IF EXISTS "workflow_actions_read" ON workflow_actions;
DROP POLICY IF EXISTS "workflow_actions_insert" ON workflow_actions;
DROP POLICY IF EXISTS "attachments_read" ON attachments;
DROP POLICY IF EXISTS "attachments_write" ON attachments;
DROP POLICY IF EXISTS "audit_logs_read" ON audit_logs;

-- Create a helper function to get user role (SECURITY DEFINER avoids recursion)
CREATE OR REPLACE FUNCTION get_user_role(user_auth_id UUID)
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = user_auth_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create a helper function to get user agency
CREATE OR REPLACE FUNCTION get_user_agency_id(user_auth_id UUID)
RETURNS UUID AS $$
  SELECT agency_id FROM users WHERE auth_id = user_auth_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) = 'system_admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create a helper function to check if user is DNPM
CREATE OR REPLACE FUNCTION is_dnpm()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- SIMPLIFIED RLS POLICIES (without recursion)
-- =====================================================

-- Agencies: Everyone can read, service role can write
CREATE POLICY "agencies_select_all" ON agencies FOR SELECT USING (true);
CREATE POLICY "agencies_insert_admin" ON agencies FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "agencies_update_admin" ON agencies FOR UPDATE USING (is_admin());
CREATE POLICY "agencies_delete_admin" ON agencies FOR DELETE USING (is_admin());

-- Users: Everyone can read, service role can write
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_admin" ON users FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "users_update_admin" ON users FOR UPDATE USING (is_admin());
CREATE POLICY "users_delete_admin" ON users FOR DELETE USING (is_admin());

-- Financial Years: Everyone can read, DNPM can write
CREATE POLICY "fy_select_all" ON financial_years FOR SELECT USING (true);
CREATE POLICY "fy_insert_dnpm" ON financial_years FOR INSERT WITH CHECK (is_dnpm());
CREATE POLICY "fy_update_dnpm" ON financial_years FOR UPDATE USING (is_dnpm());
CREATE POLICY "fy_delete_dnpm" ON financial_years FOR DELETE USING (is_dnpm());

-- Donor Codes: Everyone can read, admin can write
CREATE POLICY "dc_select_all" ON donor_codes FOR SELECT USING (true);
CREATE POLICY "dc_insert_admin" ON donor_codes FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "dc_update_admin" ON donor_codes FOR UPDATE USING (is_admin());
CREATE POLICY "dc_delete_admin" ON donor_codes FOR DELETE USING (is_admin());

-- Projects: DNPM sees all, agencies see their own
CREATE POLICY "projects_select" ON projects FOR SELECT USING (
  is_dnpm() OR agency_id = get_user_agency_id(auth.uid())
);
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (
  is_admin() OR agency_id = get_user_agency_id(auth.uid())
);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (
  is_dnpm() OR agency_id = get_user_agency_id(auth.uid())
);
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (is_admin());

-- Budget Lines: Based on project access
CREATE POLICY "bl_select" ON budget_lines FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = budget_lines.project_id
    AND (is_dnpm() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "bl_insert" ON budget_lines FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "bl_update" ON budget_lines FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = budget_lines.project_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "bl_delete" ON budget_lines FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = budget_lines.project_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);

-- Cashflow Monthly: Based on budget line access
CREATE POLICY "cf_select" ON cashflow_monthly FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM budget_lines bl
    JOIN projects p ON p.id = bl.project_id
    WHERE bl.id = cashflow_monthly.budget_line_id
    AND (is_dnpm() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "cf_insert" ON cashflow_monthly FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM budget_lines bl
    JOIN projects p ON p.id = bl.project_id
    WHERE bl.id = budget_line_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "cf_update" ON cashflow_monthly FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM budget_lines bl
    JOIN projects p ON p.id = bl.project_id
    WHERE bl.id = cashflow_monthly.budget_line_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "cf_delete" ON cashflow_monthly FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM budget_lines bl
    JOIN projects p ON p.id = bl.project_id
    WHERE bl.id = cashflow_monthly.budget_line_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);

-- Workflow Actions: Based on project access
CREATE POLICY "wa_select" ON workflow_actions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = workflow_actions.project_id
    AND (is_dnpm() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "wa_insert" ON workflow_actions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Attachments: Based on project access
CREATE POLICY "att_select" ON attachments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = attachments.project_id
    AND (is_dnpm() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "att_insert" ON attachments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "att_update" ON attachments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = attachments.project_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);
CREATE POLICY "att_delete" ON attachments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = attachments.project_id
    AND (is_admin() OR p.agency_id = get_user_agency_id(auth.uid()))
  )
);

-- Audit Logs: DNPM can read, anyone can insert
CREATE POLICY "al_select_dnpm" ON audit_logs FOR SELECT USING (is_dnpm());
CREATE POLICY "al_insert_all" ON audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Verification
SELECT 'RLS policies fixed successfully!' as status;
