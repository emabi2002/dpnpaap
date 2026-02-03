-- DNPM Budget & Cashflow System - Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor

-- =====================================================
-- DONOR CODES (Required seed data)
-- =====================================================
INSERT INTO donor_codes (code, donor_name, active) VALUES
    (0, 'GoPNG', true),
    (1, 'ADB', true),
    (2, 'World Bank', true),
    (3, 'European Union', true),
    (4, 'IFAD', true),
    (5, 'OECF', true),
    (6, 'JICA', true),
    (7, 'New Zealand', true),
    (8, 'AusAID', true),
    (9, 'Other', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- AGENCIES (Sample data)
-- =====================================================
INSERT INTO agencies (id, agency_name, agency_code, sector, contact_person, email, phone, status) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Department of National Planning & Monitoring', 'DNPM', 'Central Government', 'Michael Kumalu', 'mkumalu@dnpm.gov.pg', '+675 321 4560', 'active'),
    ('a1000000-0000-0000-0000-000000000002', 'National Procurement Commission', 'NPC', 'Finance & Treasury', 'Elizabeth Mave', 'emave@npc.gov.pg', '+675 321 4561', 'active'),
    ('a1000000-0000-0000-0000-000000000003', 'Department of Finance', 'DOF', 'Finance & Treasury', 'James Torovi', 'jtorovi@finance.gov.pg', '+675 321 4562', 'active'),
    ('a1000000-0000-0000-0000-000000000004', 'Department of Health', 'DOH', 'Health', 'Anna Kila', 'akila@health.gov.pg', '+675 321 4563', 'active'),
    ('a1000000-0000-0000-0000-000000000005', 'Department of Education', 'DOE', 'Education', 'Peter Kuman', 'pkuman@education.gov.pg', '+675 321 4564', 'active'),
    ('a1000000-0000-0000-0000-000000000006', 'Department of Works', 'DOW', 'Infrastructure', 'Thomas Wari', 'twari@works.gov.pg', '+675 321 4565', 'active')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FINANCIAL YEARS
-- =====================================================
INSERT INTO financial_years (id, year, status, submission_deadline, notes) VALUES
    ('f1000000-0000-0000-0000-000000000001', 2024, 'closed', '2024-03-31', 'Financial Year 2024 - Completed'),
    ('f1000000-0000-0000-0000-000000000002', 2025, 'closed', '2025-03-31', 'Financial Year 2025 - Completed'),
    ('f1000000-0000-0000-0000-000000000003', 2026, 'open', '2026-03-31', 'Financial Year 2026 - Currently accepting submissions')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- USERS (Demo accounts - passwords handled by Supabase Auth)
-- =====================================================
INSERT INTO users (id, email, name, role, agency_id, phone, active) VALUES
    -- System Admin
    ('u1000000-0000-0000-0000-000000000001', 'admin@dnpm.gov.pg', 'System Administrator', 'system_admin', NULL, '+675 321 4500', true),
    -- DNPM Staff
    ('u1000000-0000-0000-0000-000000000002', 'director@dnpm.gov.pg', 'Dr. Koney Samuel', 'dnpm_approver', NULL, '+675 321 4501', true),
    ('u1000000-0000-0000-0000-000000000003', 'analyst@dnpm.gov.pg', 'Janet Ila', 'dnpm_reviewer', NULL, '+675 321 4502', true),
    -- Agency Users - NPC
    ('u1000000-0000-0000-0000-000000000004', 'cfo@npc.gov.pg', 'Elizabeth Mave', 'agency_approver', 'a1000000-0000-0000-0000-000000000002', '+675 321 4561', true),
    ('u1000000-0000-0000-0000-000000000005', 'budget@npc.gov.pg', 'Paul Korare', 'agency_user', 'a1000000-0000-0000-0000-000000000002', '+675 321 4570', true),
    -- Agency Users - DOF
    ('u1000000-0000-0000-0000-000000000006', 'director@finance.gov.pg', 'James Torovi', 'agency_approver', 'a1000000-0000-0000-0000-000000000003', '+675 321 4562', true),
    ('u1000000-0000-0000-0000-000000000007', 'budget@finance.gov.pg', 'Sarah Manu', 'agency_user', 'a1000000-0000-0000-0000-000000000003', '+675 321 4571', true),
    -- Agency Users - DOH
    ('u1000000-0000-0000-0000-000000000008', 'budget@health.gov.pg', 'Anna Kila', 'agency_user', 'a1000000-0000-0000-0000-000000000004', '+675 321 4563', true),
    -- Agency Users - DOE
    ('u1000000-0000-0000-0000-000000000009', 'budget@education.gov.pg', 'Peter Kuman', 'agency_user', 'a1000000-0000-0000-0000-000000000005', '+675 321 4564', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE PROJECTS
-- =====================================================
INSERT INTO projects (id, financial_year_id, agency_id, project_title, project_code, expenditure_vote_no, division, main_program, program, manager_name, objective, created_by, status) VALUES
    ('p1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002',
     'Electronic Government Procurement System (eGP)', 'NPC-EGP-001', '135', 'ICT Division', 'Digital Transformation', 'E-Government', 'Paul Korare',
     'To implement a comprehensive electronic government procurement system to enhance transparency, efficiency, and accountability in public procurement across all government agencies in PNG.',
     'u1000000-0000-0000-0000-000000000005', 'draft'),

    ('p1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
     'Integrated Financial Management System Upgrade', 'DOF-IFMS-002', '140', 'Treasury Division', 'Financial Management', 'IFMS Enhancement', 'Sarah Manu',
     'To upgrade the existing IFMS to improve government financial reporting, budget execution tracking, and fiscal management capabilities.',
     'u1000000-0000-0000-0000-000000000007', 'submitted'),

    ('p1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004',
     'Rural Health Facilities Improvement Program', 'DOH-RHFIP-003', '200', 'Health Infrastructure', 'Health Services', 'Rural Health', 'Anna Kila',
     'To improve health service delivery in rural areas through facility upgrades, equipment procurement, and capacity building.',
     'u1000000-0000-0000-0000-000000000008', 'under_dnpm_review'),

    ('p1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005',
     'National Education Quality Improvement', 'DOE-NEQI-004', '210', 'Curriculum Division', 'Basic Education', 'Quality Standards', 'Peter Kuman',
     'To improve educational outcomes through teacher training, curriculum development, and learning resource provision.',
     'u1000000-0000-0000-0000-000000000009', 'approved_by_dnpm')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE BUDGET LINES
-- =====================================================
-- Get donor code IDs
DO $$
DECLARE
    donor_gopng UUID;
    donor_adb UUID;
    donor_wb UUID;
    donor_ausaid UUID;
    donor_jica UUID;
    donor_eu UUID;
BEGIN
    SELECT id INTO donor_gopng FROM donor_codes WHERE code = 0;
    SELECT id INTO donor_adb FROM donor_codes WHERE code = 1;
    SELECT id INTO donor_wb FROM donor_codes WHERE code = 2;
    SELECT id INTO donor_eu FROM donor_codes WHERE code = 3;
    SELECT id INTO donor_jica FROM donor_codes WHERE code = 6;
    SELECT id INTO donor_ausaid FROM donor_codes WHERE code = 8;

    -- Project 1 - eGP Budget Lines
    INSERT INTO budget_lines (id, project_id, item_no, description_of_item, donor_code_id, original_budget, revised_budget, notes) VALUES
        ('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', '135', 'Software Development & Licensing', donor_adb, 5000000, 5500000, 'ADB funded component'),
        ('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', '136', 'Hardware & Infrastructure', donor_gopng, 2000000, 2200000, 'GoPNG counterpart funding'),
        ('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000001', '137', 'Training & Capacity Building', donor_ausaid, 800000, 850000, 'AusAID technical assistance'),
        ('b1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000001', '138', 'Consultancy Services', donor_wb, 1200000, 1300000, 'World Bank advisory services')
    ON CONFLICT (id) DO NOTHING;

    -- Project 2 - IFMS Budget Lines
    INSERT INTO budget_lines (id, project_id, item_no, description_of_item, donor_code_id, original_budget, revised_budget, notes) VALUES
        ('b1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000002', '140', 'System Upgrade & Integration', donor_gopng, 3000000, 3200000, ''),
        ('b1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000002', '141', 'Data Migration & Testing', donor_gopng, 500000, 550000, '')
    ON CONFLICT (id) DO NOTHING;

    -- Project 3 - Health Budget Lines
    INSERT INTO budget_lines (id, project_id, item_no, description_of_item, donor_code_id, original_budget, revised_budget, notes) VALUES
        ('b1000000-0000-0000-0000-000000000007', 'p1000000-0000-0000-0000-000000000003', '200', 'Facility Construction & Renovation', donor_ausaid, 8000000, 8500000, 'AusAID main component'),
        ('b1000000-0000-0000-0000-000000000008', 'p1000000-0000-0000-0000-000000000003', '201', 'Medical Equipment Procurement', donor_jica, 4000000, 4200000, 'JICA equipment grant'),
        ('b1000000-0000-0000-0000-000000000009', 'p1000000-0000-0000-0000-000000000003', '202', 'Health Worker Training', donor_gopng, 1500000, 1600000, 'GoPNG component')
    ON CONFLICT (id) DO NOTHING;

    -- Project 4 - Education Budget Lines
    INSERT INTO budget_lines (id, project_id, item_no, description_of_item, donor_code_id, original_budget, revised_budget, notes) VALUES
        ('b1000000-0000-0000-0000-000000000010', 'p1000000-0000-0000-0000-000000000004', '210', 'Teacher Training Programs', donor_eu, 2500000, 2600000, 'EU education support'),
        ('b1000000-0000-0000-0000-000000000011', 'p1000000-0000-0000-0000-000000000004', '211', 'Learning Materials Development', donor_gopng, 1800000, 1900000, '')
    ON CONFLICT (id) DO NOTHING;
END $$;

-- =====================================================
-- SAMPLE CASHFLOW DATA
-- =====================================================
INSERT INTO cashflow_monthly (id, budget_line_id, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, "dec") VALUES
    -- Project 1 Budget Lines
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 400000, 450000, 500000, 450000, 480000, 450000, 500000, 520000, 480000, 450000, 420000, 400000),
    ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 200000, 180000, 200000, 190000, 180000, 170000, 180000, 190000, 180000, 190000, 170000, 170000),
    ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 60000, 70000, 75000, 70000, 75000, 70000, 75000, 70000, 70000, 70000, 75000, 70000),
    ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 100000, 110000, 120000, 100000, 110000, 100000, 110000, 120000, 110000, 100000, 110000, 110000),
    -- Project 2 Budget Lines
    ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 250000, 270000, 280000, 260000, 280000, 260000, 270000, 280000, 270000, 260000, 260000, 260000),
    ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006', 40000, 45000, 50000, 45000, 48000, 45000, 48000, 50000, 45000, 45000, 44000, 45000),
    -- Project 3 Budget Lines
    ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 600000, 700000, 750000, 700000, 750000, 700000, 750000, 800000, 700000, 700000, 680000, 670000),
    ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000008', 300000, 350000, 380000, 350000, 360000, 340000, 360000, 380000, 350000, 340000, 350000, 340000),
    ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000009', 120000, 140000, 140000, 130000, 140000, 130000, 140000, 140000, 130000, 130000, 130000, 130000),
    -- Project 4 Budget Lines
    ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000010', 200000, 220000, 230000, 210000, 220000, 210000, 220000, 230000, 220000, 210000, 220000, 210000),
    ('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000011', 150000, 160000, 170000, 155000, 165000, 155000, 165000, 165000, 160000, 155000, 150000, 150000)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE WORKFLOW ACTIONS
-- =====================================================
INSERT INTO workflow_actions (id, project_id, action_type, action_by_user, action_date, comments) VALUES
    ('w1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000002', 'submit', 'u1000000-0000-0000-0000-000000000007', '2026-01-22 10:30:00+00', 'Submitting for review. All budget lines and cashflows have been entered.'),
    ('w1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000003', 'submit', 'u1000000-0000-0000-0000-000000000008', '2026-01-25 14:00:00+00', 'Budget submission for FY2026 ready for DNPM review.'),
    ('w1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000004', 'submit', 'u1000000-0000-0000-0000-000000000009', '2026-01-26 09:00:00+00', 'Complete submission with all supporting documents.'),
    ('w1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'approve_dnpm', 'u1000000-0000-0000-0000-000000000002', '2026-01-28 16:30:00+00', 'Approved. Budget allocation confirmed for FY2026.')
ON CONFLICT (id) DO NOTHING;

-- Verify the seed data
SELECT 'Donor Codes:', COUNT(*) FROM donor_codes;
SELECT 'Agencies:', COUNT(*) FROM agencies;
SELECT 'Financial Years:', COUNT(*) FROM financial_years;
SELECT 'Users:', COUNT(*) FROM users;
SELECT 'Projects:', COUNT(*) FROM projects;
SELECT 'Budget Lines:', COUNT(*) FROM budget_lines;
SELECT 'Cashflow Records:', COUNT(*) FROM cashflow_monthly;
SELECT 'Workflow Actions:', COUNT(*) FROM workflow_actions;
