-- =============================================
-- WORKPLAN SEED DATA
-- Run after workplan-schema.sql
-- =============================================

-- Use UUIDs that match the existing mock data IDs for consistency
-- In production, use gen_random_uuid() for real UUIDs

-- =============================================
-- WORKPLANS
-- =============================================
INSERT INTO workplans (id, financial_year_id, agency_id, title, description, total_budget, status, created_by, created_at, updated_at)
VALUES
  -- NPC Workplan
  (
    'wp-npc-2026-0001-0001-000000000001',
    'fy-2026-0001-0001-000000000001', -- FY 2026
    'ag-npc-0001-0001-000000000002',  -- NPC
    'NPC Annual Workplan FY2026',
    'National Procurement Commission Annual Work Programme for Financial Year 2026',
    15000000,
    'in_progress',
    'user-admin-001-0001-000000000001',
    '2026-01-05 00:00:00+00',
    '2026-01-28 00:00:00+00'
  ),
  -- DOF Workplan
  (
    'wp-dof-2026-0001-0001-000000000002',
    'fy-2026-0001-0001-000000000001',
    'ag-dof-0001-0001-000000000003',  -- DOF
    'DOF Annual Workplan FY2026',
    'Department of Finance Annual Work Programme for Financial Year 2026',
    25000000,
    'in_progress',
    'user-admin-001-0001-000000000001',
    '2026-01-03 00:00:00+00',
    '2026-01-28 00:00:00+00'
  ),
  -- DOH Workplan
  (
    'wp-doh-2026-0001-0001-000000000003',
    'fy-2026-0001-0001-000000000001',
    'ag-doh-0001-0001-000000000004',  -- DOH
    'DOH Annual Workplan FY2026',
    'Department of Health Annual Work Programme for Financial Year 2026',
    85000000,
    'approved',
    'user-admin-001-0001-000000000001',
    '2026-01-02 00:00:00+00',
    '2026-01-25 00:00:00+00'
  ),
  -- DOE Workplan
  (
    'wp-doe-2026-0001-0001-000000000004',
    'fy-2026-0001-0001-000000000001',
    'ag-doe-0001-0001-000000000005',  -- DOE
    'DOE Annual Workplan FY2026',
    'Department of Education Annual Work Programme for Financial Year 2026',
    120000000,
    'in_progress',
    'user-admin-001-0001-000000000001',
    '2026-01-02 00:00:00+00',
    '2026-01-28 00:00:00+00'
  ),
  -- DOW Workplan
  (
    'wp-dow-2026-0001-0001-000000000005',
    'fy-2026-0001-0001-000000000001',
    'ag-dow-0001-0001-000000000006',  -- DOW
    'DOW Annual Workplan FY2026',
    'Department of Works Annual Work Programme for Financial Year 2026',
    200000000,
    'submitted',
    'user-admin-001-0001-000000000001',
    '2026-01-15 00:00:00+00',
    '2026-01-20 00:00:00+00'
  ),
  -- DNPM Workplan
  (
    'wp-dnpm-2026-001-0001-000000000006',
    'fy-2026-0001-0001-000000000001',
    'ag-dnpm-0001-0001-000000000001', -- DNPM
    'DNPM Annual Workplan FY2026',
    'Department of National Planning & Monitoring Annual Work Programme for Financial Year 2026',
    18000000,
    'draft',
    'user-admin-001-0001-000000000001',
    '2026-01-25 00:00:00+00',
    '2026-01-28 00:00:00+00'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_budget = EXCLUDED.total_budget,
  status = EXCLUDED.status,
  updated_at = NOW();

-- =============================================
-- WORKPLAN ACTIVITIES - NPC
-- =============================================
INSERT INTO workplan_activities (
  id, workplan_id, activity_code, activity_name, description,
  responsible_unit, responsible_officer, start_date, end_date,
  q1_target, q2_target, q3_target, q4_target,
  q1_actual, q2_actual, q3_actual, q4_actual,
  q1_budget, q2_budget, q3_budget, q4_budget,
  key_performance_indicator, expected_output, status, progress_percent
)
VALUES
  (
    'act-npc-001-0001-0001-000000000001',
    'wp-npc-2026-0001-0001-000000000001',
    'NPC-2026-001',
    'Implement Electronic Government Procurement System',
    'Deploy and roll out the eGP system across all government agencies',
    'ICT Division',
    'Paul Korare',
    '2026-01-01',
    '2026-12-31',
    25, 50, 75, 100,
    15, 0, 0, 0,
    2000000, 2500000, 2500000, 2850000,
    'Number of agencies onboarded to eGP system',
    '50 agencies using eGP system by end of FY2026',
    'in_progress',
    15
  ),
  (
    'act-npc-002-0001-0001-000000000002',
    'wp-npc-2026-0001-0001-000000000001',
    'NPC-2026-002',
    'Procurement Capacity Building Program',
    'Train government officers in procurement procedures and compliance',
    'Training Unit',
    'Elizabeth Mave',
    '2026-02-01',
    '2026-11-30',
    50, 150, 300, 500,
    45, 0, 0, 0,
    500000, 800000, 800000, 500000,
    'Number of officers trained and certified',
    '500 officers trained in procurement by November 2026',
    'in_progress',
    9
  ),
  (
    'act-npc-003-0001-0001-000000000003',
    'wp-npc-2026-0001-0001-000000000001',
    'NPC-2026-003',
    'Procurement Audit and Compliance Review',
    'Conduct annual procurement audits across government agencies',
    'Compliance Division',
    NULL,
    '2026-03-01',
    '2026-12-31',
    5, 15, 30, 50,
    0, 0, 0, 0,
    300000, 600000, 600000, 550000,
    'Number of agencies audited',
    '50 agency procurement audits completed',
    'not_started',
    0
  );

-- =============================================
-- WORKPLAN ACTIVITIES - DOF
-- =============================================
INSERT INTO workplan_activities (
  id, workplan_id, activity_code, activity_name, description,
  responsible_unit, responsible_officer, start_date, end_date,
  q1_target, q2_target, q3_target, q4_target,
  q1_actual, q2_actual, q3_actual, q4_actual,
  q1_budget, q2_budget, q3_budget, q4_budget,
  key_performance_indicator, expected_output, status, progress_percent
)
VALUES
  (
    'act-dof-001-0001-0001-000000000004',
    'wp-dof-2026-0001-0001-000000000002',
    'DOF-2026-001',
    'IFMS System Upgrade Implementation',
    'Upgrade the Integrated Financial Management System to latest version',
    'Treasury Division',
    'Sarah Manu',
    '2026-01-15',
    '2026-09-30',
    20, 50, 100, 100,
    25, 0, 0, 0,
    1000000, 1200000, 1550000, 0,
    'System modules upgraded and tested',
    'IFMS v3.0 fully operational by Q3 2026',
    'in_progress',
    25
  ),
  (
    'act-dof-002-0001-0001-000000000005',
    'wp-dof-2026-0001-0001-000000000002',
    'DOF-2026-002',
    'Revenue Collection Enhancement',
    'Implement improved revenue collection mechanisms and monitoring',
    'Revenue Division',
    NULL,
    '2026-01-01',
    '2026-12-31',
    2500, 5500, 8500, 12000,
    2800, 0, 0, 0,
    2000000, 2500000, 2500000, 2000000,
    'Revenue collected (in millions PGK)',
    'K12 billion revenue target for FY2026',
    'in_progress',
    23
  ),
  (
    'act-dof-003-0001-0001-000000000006',
    'wp-dof-2026-0001-0001-000000000002',
    'DOF-2026-003',
    'Provincial Financial Management Support',
    'Provide technical assistance to provincial treasuries',
    'Provincial Liaison',
    NULL,
    '2026-02-01',
    '2026-12-31',
    5, 12, 18, 22,
    4, 0, 0, 0,
    1500000, 2000000, 2000000, 1500000,
    'Provinces receiving technical support',
    'All 22 provinces supported',
    'in_progress',
    18
  );

-- =============================================
-- WORKPLAN ACTIVITIES - DOH
-- =============================================
INSERT INTO workplan_activities (
  id, workplan_id, activity_code, activity_name, description,
  responsible_unit, responsible_officer, start_date, end_date,
  q1_target, q2_target, q3_target, q4_target,
  q1_actual, q2_actual, q3_actual, q4_actual,
  q1_budget, q2_budget, q3_budget, q4_budget,
  key_performance_indicator, expected_output, status, progress_percent
)
VALUES
  (
    'act-doh-001-0001-0001-000000000007',
    'wp-doh-2026-0001-0001-000000000003',
    'DOH-2026-001',
    'Rural Health Facility Construction',
    'Construct and upgrade rural health facilities across the nation',
    'Health Infrastructure',
    'Anna Kila',
    '2026-01-01',
    '2026-12-31',
    5, 15, 30, 50,
    6, 0, 0, 0,
    10000000, 15000000, 15000000, 10000000,
    'Number of facilities constructed/upgraded',
    '50 rural health facilities operational',
    'in_progress',
    12
  ),
  (
    'act-doh-002-0001-0001-000000000008',
    'wp-doh-2026-0001-0001-000000000003',
    'DOH-2026-002',
    'Medical Equipment Procurement',
    'Procure essential medical equipment for hospitals and health centers',
    'Medical Supplies',
    NULL,
    '2026-02-01',
    '2026-10-31',
    100, 350, 600, 800,
    80, 0, 0, 0,
    5000000, 7000000, 7000000, 3000000,
    'Medical equipment items procured',
    '800 essential equipment items delivered',
    'in_progress',
    10
  ),
  (
    'act-doh-003-0001-0001-000000000009',
    'wp-doh-2026-0001-0001-000000000003',
    'DOH-2026-003',
    'Community Health Worker Training',
    'Train community health workers for rural health service delivery',
    'Human Resources',
    NULL,
    '2026-01-15',
    '2026-11-30',
    200, 500, 900, 1200,
    220, 0, 0, 0,
    2000000, 3000000, 3000000, 2000000,
    'CHWs trained and deployed',
    '1,200 CHWs active in communities',
    'in_progress',
    18
  );

-- =============================================
-- WORKPLAN ACTIVITIES - DOE
-- =============================================
INSERT INTO workplan_activities (
  id, workplan_id, activity_code, activity_name, description,
  responsible_unit, responsible_officer, start_date, end_date,
  q1_target, q2_target, q3_target, q4_target,
  q1_actual, q2_actual, q3_actual, q4_actual,
  q1_budget, q2_budget, q3_budget, q4_budget,
  key_performance_indicator, expected_output, status, progress_percent
)
VALUES
  (
    'act-doe-001-0001-0001-000000000010',
    'wp-doe-2026-0001-0001-000000000004',
    'DOE-2026-001',
    'Teacher Training and Development',
    'Conduct in-service training for primary and secondary teachers',
    'Teacher Education',
    'Peter Kuman',
    '2026-01-01',
    '2026-12-31',
    500, 1500, 3000, 5000,
    650, 0, 0, 0,
    5000000, 8000000, 8000000, 5000000,
    'Teachers trained',
    '5,000 teachers complete professional development',
    'in_progress',
    13
  ),
  (
    'act-doe-002-0001-0001-000000000011',
    'wp-doe-2026-0001-0001-000000000004',
    'DOE-2026-002',
    'School Infrastructure Development',
    'Construct and renovate school buildings across PNG',
    'Infrastructure',
    NULL,
    '2026-01-01',
    '2026-12-31',
    10, 30, 60, 100,
    8, 0, 0, 0,
    15000000, 20000000, 20000000, 15000000,
    'Schools constructed/renovated',
    '100 school buildings completed',
    'in_progress',
    8
  ),
  (
    'act-doe-003-0001-0001-000000000012',
    'wp-doe-2026-0001-0001-000000000004',
    'DOE-2026-003',
    'Curriculum Materials Distribution',
    'Distribute textbooks and learning materials to schools',
    'Curriculum Division',
    NULL,
    '2026-02-01',
    '2026-06-30',
    50000, 200000, 200000, 200000,
    45000, 0, 0, 0,
    3000000, 6000000, 0, 0,
    'Textbooks distributed',
    '200,000 textbooks delivered to schools',
    'in_progress',
    22
  );

-- =============================================
-- WORKPLAN ACTIVITIES - DOW
-- =============================================
INSERT INTO workplan_activities (
  id, workplan_id, activity_code, activity_name, description,
  responsible_unit, responsible_officer, start_date, end_date,
  q1_target, q2_target, q3_target, q4_target,
  q1_actual, q2_actual, q3_actual, q4_actual,
  q1_budget, q2_budget, q3_budget, q4_budget,
  key_performance_indicator, expected_output, status, progress_percent
)
VALUES
  (
    'act-dow-001-0001-0001-000000000013',
    'wp-dow-2026-0001-0001-000000000005',
    'DOW-2026-001',
    'National Highway Maintenance Program',
    'Routine and periodic maintenance of national highways',
    'Highway Maintenance',
    NULL,
    '2026-01-01',
    '2026-12-31',
    100, 300, 600, 1000,
    0, 0, 0, 0,
    25000000, 35000000, 35000000, 25000000,
    'Kilometers of road maintained',
    '1,000 km of highway maintained',
    'not_started',
    0
  ),
  (
    'act-dow-002-0001-0001-000000000014',
    'wp-dow-2026-0001-0001-000000000005',
    'DOW-2026-002',
    'Bridge Construction and Rehabilitation',
    'Construct new bridges and rehabilitate existing ones',
    'Structures Division',
    NULL,
    '2026-02-01',
    '2026-12-31',
    2, 6, 12, 20,
    0, 0, 0, 0,
    10000000, 20000000, 20000000, 15000000,
    'Bridges completed',
    '20 bridges constructed/rehabilitated',
    'not_started',
    0
  );

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'WORKPLAN SEED DATA INSERTED SUCCESSFULLY';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Inserted:';
  RAISE NOTICE '  - 6 workplans';
  RAISE NOTICE '  - 14 activities';
  RAISE NOTICE '==========================================';
END $$;
