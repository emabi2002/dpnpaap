-- =============================================
-- SAMPLE PROCUREMENT PLANS
-- Run this after procurement-schema.sql and procurement-seed.sql
-- Also requires agencies, financial_years, and users tables to exist
-- =============================================

-- First, let's check if required tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies') THEN
        RAISE EXCEPTION 'agencies table does not exist. Run the main schema first.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_years') THEN
        RAISE EXCEPTION 'financial_years table does not exist. Run the main schema first.';
    END IF;
END $$;

-- =============================================
-- CREATE SAMPLE PROCUREMENT PLAN FOR NPC
-- =============================================

-- Insert NPC Procurement Plan
INSERT INTO procurement_plans (
    financial_year_id,
    agency_id,
    plan_name,
    agency_procurement_entity_name,
    agency_budget_code,
    period_start,
    period_end,
    fund_source_id,
    status,
    created_by
)
SELECT
    fy.id,
    a.id,
    'NPC Annual Procurement Plan FY2026',
    'National Procurement Commission',
    'NPC-135',
    '2026-01-01',
    '2026-12-31',
    fs.id,
    'approved_by_dnpm',
    u.id
FROM financial_years fy
CROSS JOIN agencies a
CROSS JOIN fund_sources fs
CROSS JOIN users u
WHERE fy.year = 2026
  AND a.agency_code = 'NPC'
  AND fs.code = 'GOPNG-DEV'
  AND u.email = 'budget@npc.gov.pg'
ON CONFLICT DO NOTHING;

-- Get the NPC plan ID for inserting items
DO $$
DECLARE
    v_plan_id UUID;
    v_user_id UUID;
    v_method_icb UUID;
    v_method_ncb UUID;
    v_method_rft UUID;
    v_type_supply UUID;
    v_type_service UUID;
    v_uom_ea UUID;
    v_uom_ls UUID;
BEGIN
    -- Get plan ID
    SELECT id INTO v_plan_id FROM procurement_plans WHERE plan_name = 'NPC Annual Procurement Plan FY2026' LIMIT 1;

    IF v_plan_id IS NULL THEN
        RAISE NOTICE 'NPC plan not found, skipping items';
        RETURN;
    END IF;

    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'budget@npc.gov.pg' LIMIT 1;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users LIMIT 1;
    END IF;

    -- Get lookup IDs
    SELECT id INTO v_method_icb FROM procurement_methods WHERE code = 'ICB';
    SELECT id INTO v_method_ncb FROM procurement_methods WHERE code = 'NCB';
    SELECT id INTO v_method_rft FROM procurement_methods WHERE code = 'RFT';
    SELECT id INTO v_type_supply FROM contract_types WHERE code = 'SUP';
    SELECT id INTO v_type_service FROM contract_types WHERE code = 'SVC';
    SELECT id INTO v_uom_ea FROM units_of_measure WHERE code = 'EA';
    SELECT id INTO v_uom_ls FROM units_of_measure WHERE code = 'LS';

    -- Insert items
    INSERT INTO procurement_plan_items (
        procurement_plan_id, sequence_no, activity_or_procurement_title, description_of_item,
        unspsc_code, unspsc_description,
        estimated_contract_start, estimated_contract_end, anticipated_duration_months,
        quantity, unit_of_measure_id, estimated_unit_cost, estimated_total_cost,
        annual_budget_year_value, q1_budget, q2_budget, q3_budget, q4_budget,
        location_scope, procurement_method_id, contract_type_id,
        third_party_contract_mgmt_required, comments, created_by
    ) VALUES
    (
        v_plan_id, 1, 'eGP System Software Development',
        'Development of Electronic Government Procurement System including portal, database, and integration modules',
        '43211500', 'Computers',
        '2026-02-01', '2026-11-30', 10,
        1, v_uom_ls, 5500000, 5500000,
        5500000, 1000000, 1500000, 1500000, 1500000,
        'national', v_method_icb, v_type_service,
        false, 'Key priority project for digital transformation', v_user_id
    ),
    (
        v_plan_id, 2, 'IT Equipment for eGP',
        'Servers, networking equipment, and workstations for eGP system deployment',
        '43211507', 'Desktop computers',
        '2026-03-01', '2026-06-30', 4,
        50, v_uom_ea, 25000, 1250000,
        1250000, 0, 1250000, 0, 0,
        'national', v_method_ncb, v_type_supply,
        false, NULL, v_user_id
    ),
    (
        v_plan_id, 3, 'Training Services',
        'Training for government procurement officers on eGP system usage and procurement procedures',
        '86101700', 'Training courses',
        '2026-04-01', '2026-12-31', 9,
        500, v_uom_ea, 5000, 2500000,
        2500000, 0, 700000, 900000, 900000,
        'national', v_method_rft, v_type_service,
        false, NULL, v_user_id
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'NPC plan items inserted successfully';
END $$;

-- =============================================
-- CREATE SAMPLE PROCUREMENT PLAN FOR DOH
-- =============================================

-- Insert DOH Procurement Plan
INSERT INTO procurement_plans (
    financial_year_id,
    agency_id,
    plan_name,
    agency_procurement_entity_name,
    agency_budget_code,
    period_start,
    period_end,
    fund_source_id,
    status,
    created_by
)
SELECT
    fy.id,
    a.id,
    'DOH Annual Procurement Plan FY2026',
    'Department of Health',
    'DOH-200',
    '2026-01-01',
    '2026-12-31',
    fs.id,
    'approved_by_agency',
    u.id
FROM financial_years fy
CROSS JOIN agencies a
CROSS JOIN fund_sources fs
CROSS JOIN users u
WHERE fy.year = 2026
  AND a.agency_code = 'DOH'
  AND fs.code = 'DFAT'
  AND u.email = 'budget@health.gov.pg'
ON CONFLICT DO NOTHING;

-- Get the DOH plan ID for inserting items
DO $$
DECLARE
    v_plan_id UUID;
    v_user_id UUID;
    v_method_icb UUID;
    v_method_ncb UUID;
    v_type_supply UUID;
    v_type_works UUID;
    v_uom_ea UUID;
    v_uom_set UUID;
    v_province_mor UUID;
BEGIN
    -- Get plan ID
    SELECT id INTO v_plan_id FROM procurement_plans WHERE plan_name = 'DOH Annual Procurement Plan FY2026' LIMIT 1;

    IF v_plan_id IS NULL THEN
        RAISE NOTICE 'DOH plan not found, skipping items';
        RETURN;
    END IF;

    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'budget@health.gov.pg' LIMIT 1;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users LIMIT 1;
    END IF;

    -- Get lookup IDs
    SELECT id INTO v_method_icb FROM procurement_methods WHERE code = 'ICB';
    SELECT id INTO v_method_ncb FROM procurement_methods WHERE code = 'NCB';
    SELECT id INTO v_type_supply FROM contract_types WHERE code = 'SUP';
    SELECT id INTO v_type_works FROM contract_types WHERE code = 'WRK';
    SELECT id INTO v_uom_ea FROM units_of_measure WHERE code = 'EA';
    SELECT id INTO v_uom_set FROM units_of_measure WHERE code = 'SET';
    SELECT id INTO v_province_mor FROM provinces WHERE code = 'MOR';

    -- Insert items
    INSERT INTO procurement_plan_items (
        procurement_plan_id, sequence_no, activity_or_procurement_title, description_of_item,
        unspsc_code, unspsc_description,
        estimated_contract_start, estimated_contract_end, anticipated_duration_months,
        quantity, unit_of_measure_id, estimated_unit_cost, estimated_total_cost,
        annual_budget_year_value, q1_budget, q2_budget, q3_budget, q4_budget,
        location_scope, province_id, procurement_method_id, contract_type_id,
        third_party_contract_mgmt_required, risk_notes, created_by
    ) VALUES
    (
        v_plan_id, 1, 'Medical Equipment for Rural Health Centers',
        'Basic diagnostic and treatment equipment for 50 rural health centers',
        '42181500', 'Patient examination and monitoring',
        '2026-02-01', '2026-10-31', 9,
        50, v_uom_set, 200000, 10000000,
        10000000, 2000000, 3000000, 3000000, 2000000,
        'provincial', v_province_mor, v_method_icb, v_type_supply,
        true, 'Complex logistics for rural delivery', v_user_id
    ),
    (
        v_plan_id, 2, 'Health Center Construction',
        'Construction of 10 new rural health centers in priority areas',
        '72101500', 'Building construction services',
        '2026-03-01', '2026-12-31', 10,
        10, v_uom_ea, 800000, 8000000,
        8000000, 500000, 2500000, 2500000, 2500000,
        'provincial', NULL, v_method_icb, v_type_works,
        true, 'Multi-year project, weather-dependent construction', v_user_id
    ),
    (
        v_plan_id, 3, 'Ambulance Vehicles',
        'Procurement of 10 ambulance vehicles for provincial hospitals',
        '25101503', 'Light trucks or sport utility vehicles',
        '2026-04-01', '2026-08-31', 5,
        10, v_uom_ea, 450000, 4500000,
        4500000, 0, 2250000, 2250000, 0,
        'national', NULL, v_method_ncb, v_type_supply,
        false, NULL, v_user_id
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'DOH plan items inserted successfully';
END $$;

-- =============================================
-- UPDATE PLAN TOTALS (trigger should handle this, but just in case)
-- =============================================

UPDATE procurement_plans pp
SET
    total_estimated_value = (
        SELECT COALESCE(SUM(annual_budget_year_value), 0)
        FROM procurement_plan_items
        WHERE procurement_plan_id = pp.id
    ),
    item_count = (
        SELECT COUNT(*)
        FROM procurement_plan_items
        WHERE procurement_plan_id = pp.id
    );

-- =============================================
-- VERIFICATION
-- =============================================

SELECT
    pp.plan_name,
    a.agency_code,
    pp.status,
    pp.item_count,
    pp.total_estimated_value
FROM procurement_plans pp
JOIN agencies a ON a.id = pp.agency_id
ORDER BY pp.created_at DESC;

SELECT
    pp.plan_name,
    ppi.sequence_no,
    ppi.activity_or_procurement_title,
    ppi.annual_budget_year_value,
    pm.code as method_code,
    ct.code as contract_type
FROM procurement_plan_items ppi
JOIN procurement_plans pp ON pp.id = ppi.procurement_plan_id
JOIN procurement_methods pm ON pm.id = ppi.procurement_method_id
JOIN contract_types ct ON ct.id = ppi.contract_type_id
ORDER BY pp.plan_name, ppi.sequence_no;
