-- =============================================
-- PROCUREMENT MODULE SCHEMA
-- DNPM Budget & Cashflow System
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- LOOKUP TABLES
-- =============================================

-- Fund Sources
CREATE TABLE IF NOT EXISTS fund_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    donor_code_id UUID REFERENCES donor_codes(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement Methods
CREATE TABLE IF NOT EXISTS procurement_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    threshold_min DECIMAL(18,2),
    threshold_max DECIMAL(18,2),
    requires_approval BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Types
CREATE TABLE IF NOT EXISTS contract_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('goods', 'services', 'works', 'consulting')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units of Measure
CREATE TABLE IF NOT EXISTS units_of_measure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provinces (PNG)
CREATE TABLE IF NOT EXISTS provinces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL CHECK (region IN ('Southern', 'Highlands', 'Momase', 'Islands')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Districts (PNG)
CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UNSPSC Codes (United Nations Standard Products and Services Code)
CREATE TABLE IF NOT EXISTS unspsc_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    segment VARCHAR(2) NOT NULL,
    segment_title VARCHAR(255) NOT NULL,
    family VARCHAR(4) NOT NULL,
    family_title VARCHAR(255) NOT NULL,
    class_code VARCHAR(6) NOT NULL,
    class_title VARCHAR(255) NOT NULL,
    commodity_title VARCHAR(500) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for UNSPSC search
CREATE INDEX IF NOT EXISTS idx_unspsc_code ON unspsc_codes(code);
CREATE INDEX IF NOT EXISTS idx_unspsc_segment ON unspsc_codes(segment);
CREATE INDEX IF NOT EXISTS idx_unspsc_title ON unspsc_codes USING gin(to_tsvector('english', title || ' ' || commodity_title));

-- =============================================
-- PROCUREMENT PLAN TABLES
-- =============================================

-- Procurement Plan Status Type
DO $$ BEGIN
    CREATE TYPE procurement_plan_status AS ENUM (
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

-- Location Scope Type
DO $$ BEGIN
    CREATE TYPE location_scope AS ENUM (
        'national',
        'provincial',
        'district',
        'specific_sites'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Procurement Plans (Header)
CREATE TABLE IF NOT EXISTS procurement_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    financial_year_id UUID NOT NULL REFERENCES financial_years(id),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    plan_name VARCHAR(500) NOT NULL,
    agency_procurement_entity_name VARCHAR(500),
    agency_budget_code VARCHAR(50),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fund_source_id UUID NOT NULL REFERENCES fund_sources(id),
    status procurement_plan_status DEFAULT 'draft',
    total_estimated_value DECIMAL(18,2) DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_period CHECK (period_end >= period_start),
    CONSTRAINT unique_agency_year_plan UNIQUE (agency_id, financial_year_id, plan_name)
);

-- Create indexes for procurement plans
CREATE INDEX IF NOT EXISTS idx_procurement_plans_agency ON procurement_plans(agency_id);
CREATE INDEX IF NOT EXISTS idx_procurement_plans_year ON procurement_plans(financial_year_id);
CREATE INDEX IF NOT EXISTS idx_procurement_plans_status ON procurement_plans(status);

-- Procurement Plan Items (Line Items)
CREATE TABLE IF NOT EXISTS procurement_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procurement_plan_id UUID NOT NULL REFERENCES procurement_plans(id) ON DELETE CASCADE,
    sequence_no INTEGER NOT NULL,
    activity_or_procurement_title VARCHAR(500) NOT NULL,
    description_of_item TEXT NOT NULL,
    unspsc_id UUID REFERENCES unspsc_codes(id),
    unspsc_code VARCHAR(20),
    unspsc_description VARCHAR(500),
    estimated_contract_start DATE NOT NULL,
    estimated_contract_end DATE NOT NULL,
    anticipated_duration_months INTEGER NOT NULL,
    quantity DECIMAL(18,4) NOT NULL DEFAULT 1,
    unit_of_measure_id UUID REFERENCES units_of_measure(id),
    estimated_unit_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
    estimated_total_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
    cost_override_justification TEXT,
    multi_year_flag BOOLEAN DEFAULT false,
    multi_year_total_budget DECIMAL(18,2),
    annual_budget_year_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    q1_budget DECIMAL(18,2) DEFAULT 0,
    q2_budget DECIMAL(18,2) DEFAULT 0,
    q3_budget DECIMAL(18,2) DEFAULT 0,
    q4_budget DECIMAL(18,2) DEFAULT 0,
    location_scope location_scope DEFAULT 'national',
    location_notes TEXT,
    province_id UUID REFERENCES provinces(id),
    district_id UUID REFERENCES districts(id),
    procurement_method_id UUID NOT NULL REFERENCES procurement_methods(id),
    contract_type_id UUID NOT NULL REFERENCES contract_types(id),
    third_party_contract_mgmt_required BOOLEAN DEFAULT false,
    comments TEXT,
    risk_notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_contract_period CHECK (estimated_contract_end >= estimated_contract_start),
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT unique_sequence_per_plan UNIQUE (procurement_plan_id, sequence_no)
);

-- Create indexes for procurement items
CREATE INDEX IF NOT EXISTS idx_procurement_items_plan ON procurement_plan_items(procurement_plan_id);
CREATE INDEX IF NOT EXISTS idx_procurement_items_method ON procurement_plan_items(procurement_method_id);
CREATE INDEX IF NOT EXISTS idx_procurement_items_type ON procurement_plan_items(contract_type_id);
CREATE INDEX IF NOT EXISTS idx_procurement_items_province ON procurement_plan_items(province_id);

-- Procurement Workflow Actions
CREATE TABLE IF NOT EXISTS procurement_workflow_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procurement_plan_id UUID NOT NULL REFERENCES procurement_plans(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    from_status procurement_plan_status,
    to_status procurement_plan_status NOT NULL,
    action_by UUID NOT NULL REFERENCES users(id),
    action_date TIMESTAMPTZ DEFAULT NOW(),
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for workflow actions
CREATE INDEX IF NOT EXISTS idx_procurement_workflow_plan ON procurement_workflow_actions(procurement_plan_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update procurement plan totals
CREATE OR REPLACE FUNCTION update_procurement_plan_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE procurement_plans
    SET
        total_estimated_value = (
            SELECT COALESCE(SUM(annual_budget_year_value), 0)
            FROM procurement_plan_items
            WHERE procurement_plan_id = COALESCE(NEW.procurement_plan_id, OLD.procurement_plan_id)
        ),
        item_count = (
            SELECT COUNT(*)
            FROM procurement_plan_items
            WHERE procurement_plan_id = COALESCE(NEW.procurement_plan_id, OLD.procurement_plan_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.procurement_plan_id, OLD.procurement_plan_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update totals when items change
DROP TRIGGER IF EXISTS trigger_update_procurement_totals ON procurement_plan_items;
CREATE TRIGGER trigger_update_procurement_totals
AFTER INSERT OR UPDATE OR DELETE ON procurement_plan_items
FOR EACH ROW
EXECUTE FUNCTION update_procurement_plan_totals();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trigger_procurement_plans_updated_at ON procurement_plans;
CREATE TRIGGER trigger_procurement_plans_updated_at
BEFORE UPDATE ON procurement_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_procurement_items_updated_at ON procurement_plan_items;
CREATE TRIGGER trigger_procurement_items_updated_at
BEFORE UPDATE ON procurement_plan_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE fund_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE unspsc_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_workflow_actions ENABLE ROW LEVEL SECURITY;

-- Lookup tables: All authenticated users can read
CREATE POLICY "Allow read access to fund_sources" ON fund_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to procurement_methods" ON procurement_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to contract_types" ON contract_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to units_of_measure" ON units_of_measure FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to provinces" ON provinces FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to districts" ON districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to unspsc_codes" ON unspsc_codes FOR SELECT TO authenticated USING (true);

-- Procurement plans: Agency users see their own, DNPM sees all
CREATE POLICY "Agency users can view their procurement plans" ON procurement_plans
FOR SELECT TO authenticated
USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
    )
);

CREATE POLICY "Agency users can create procurement plans for their agency" ON procurement_plans
FOR INSERT TO authenticated
WITH CHECK (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'system_admin'
    )
);

CREATE POLICY "Agency users can update their draft procurement plans" ON procurement_plans
FOR UPDATE TO authenticated
USING (
    (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()) AND status IN ('draft', 'returned'))
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
    )
);

-- Procurement items: Follow parent plan permissions
CREATE POLICY "Users can view items of plans they can access" ON procurement_plan_items
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM procurement_plans pp
        WHERE pp.id = procurement_plan_id
        AND (
            pp.agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
            )
        )
    )
);

CREATE POLICY "Users can insert items to editable plans" ON procurement_plan_items
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM procurement_plans pp
        WHERE pp.id = procurement_plan_id
        AND pp.status IN ('draft', 'returned')
        AND (
            pp.agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND role = 'system_admin'
            )
        )
    )
);

CREATE POLICY "Users can update items in editable plans" ON procurement_plan_items
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM procurement_plans pp
        WHERE pp.id = procurement_plan_id
        AND pp.status IN ('draft', 'returned')
        AND (
            pp.agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND role IN ('dnpm_approver', 'system_admin')
            )
        )
    )
);

CREATE POLICY "Users can delete items from editable plans" ON procurement_plan_items
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM procurement_plans pp
        WHERE pp.id = procurement_plan_id
        AND pp.status IN ('draft', 'returned')
        AND (
            pp.agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND role = 'system_admin'
            )
        )
    )
);

-- Workflow actions: Read access follows plan, write for valid transitions
CREATE POLICY "Users can view workflow actions for accessible plans" ON procurement_workflow_actions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM procurement_plans pp
        WHERE pp.id = procurement_plan_id
        AND (
            pp.agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND role IN ('dnpm_reviewer', 'dnpm_approver', 'system_admin')
            )
        )
    )
);

CREATE POLICY "Users can create workflow actions" ON procurement_workflow_actions
FOR INSERT TO authenticated
WITH CHECK (action_by = auth.uid());

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT ON fund_sources TO authenticated;
GRANT SELECT ON procurement_methods TO authenticated;
GRANT SELECT ON contract_types TO authenticated;
GRANT SELECT ON units_of_measure TO authenticated;
GRANT SELECT ON provinces TO authenticated;
GRANT SELECT ON districts TO authenticated;
GRANT SELECT ON unspsc_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON procurement_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON procurement_plan_items TO authenticated;
GRANT SELECT, INSERT ON procurement_workflow_actions TO authenticated;

-- Admin can manage lookup tables
GRANT INSERT, UPDATE, DELETE ON fund_sources TO authenticated;
GRANT INSERT, UPDATE, DELETE ON procurement_methods TO authenticated;
GRANT INSERT, UPDATE, DELETE ON contract_types TO authenticated;
GRANT INSERT, UPDATE, DELETE ON units_of_measure TO authenticated;
GRANT INSERT, UPDATE, DELETE ON provinces TO authenticated;
GRANT INSERT, UPDATE, DELETE ON districts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON unspsc_codes TO authenticated;
-- =============================================
-- PROCUREMENT MODULE SEED DATA
-- DNPM Budget & Cashflow System
-- =============================================

-- =============================================
-- FUND SOURCES
-- =============================================

INSERT INTO fund_sources (code, name, description, active) VALUES
    ('GOPNG-DEV', 'GoPNG Development Budget', 'Government of PNG Development Budget', true),
    ('GOPNG-REC', 'GoPNG Recurrent Budget', 'Government of PNG Recurrent Budget', true),
    ('ADB', 'Asian Development Bank', 'ADB Loan/Grant Funded', true),
    ('WB', 'World Bank', 'World Bank Loan/Grant Funded', true),
    ('EU', 'European Union', 'EU Grant Funded', true),
    ('JICA', 'Japan International Cooperation Agency', 'JICA Loan/Grant Funded', true),
    ('DFAT', 'Australian DFAT', 'Australian Aid Funded', true),
    ('MFAT', 'New Zealand MFAT', 'New Zealand Aid Funded', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- PROCUREMENT METHODS
-- =============================================

INSERT INTO procurement_methods (code, name, description, threshold_min, threshold_max, requires_approval, active) VALUES
    ('RFQ', 'Request for Quotation', 'For low-value purchases below K50,000', NULL, 50000, false, true),
    ('RFT', 'Request for Tender', 'Open competitive tender for goods and services', 50000, NULL, true, true),
    ('RFP', 'Request for Proposal', 'For consulting and professional services', NULL, NULL, true, true),
    ('ICB', 'International Competitive Bidding', 'For high-value international procurement', 5000000, NULL, true, true),
    ('NCB', 'National Competitive Bidding', 'For national-level competitive procurement', 500000, 5000000, true, true),
    ('RT', 'Restricted Tender', 'Limited to pre-qualified suppliers', NULL, NULL, true, true),
    ('DP', 'Direct Procurement', 'Single source procurement with justification', NULL, NULL, true, true),
    ('SH', 'Shopping', 'Comparison of prices from multiple suppliers', NULL, 100000, false, true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- CONTRACT TYPES
-- =============================================

INSERT INTO contract_types (code, name, description, category, active) VALUES
    ('SUP', 'Supply Contract', 'For supply of goods', 'goods', true),
    ('WRK', 'Works Contract', 'For construction and civil works', 'works', true),
    ('SVC', 'Service Contract', 'For general services', 'services', true),
    ('CON', 'Consulting Contract', 'For consulting and advisory services', 'consulting', true),
    ('FWK', 'Framework Agreement', 'Long-term agreement with call-off orders', 'services', true),
    ('PNL', 'Panel Contract', 'Multiple suppliers on a panel', 'services', true),
    ('TRK', 'Turnkey Contract', 'Design, build, and operate', 'works', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- UNITS OF MEASURE
-- =============================================

INSERT INTO units_of_measure (code, name, abbreviation, active) VALUES
    ('EA', 'Each', 'ea', true),
    ('SET', 'Set', 'set', true),
    ('LOT', 'Lot', 'lot', true),
    ('PKG', 'Package', 'pkg', true),
    ('KG', 'Kilogram', 'kg', true),
    ('TON', 'Metric Ton', 't', true),
    ('M', 'Meter', 'm', true),
    ('KM', 'Kilometer', 'km', true),
    ('SQM', 'Square Meter', 'm2', true),
    ('CBM', 'Cubic Meter', 'm3', true),
    ('L', 'Liter', 'L', true),
    ('HR', 'Hour', 'hr', true),
    ('DAY', 'Day', 'day', true),
    ('MTH', 'Month', 'mth', true),
    ('YR', 'Year', 'yr', true),
    ('LS', 'Lump Sum', 'LS', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- PROVINCES (PNG)
-- =============================================

INSERT INTO provinces (code, name, region, active) VALUES
    -- Southern Region
    ('NCD', 'National Capital District', 'Southern', true),
    ('CEN', 'Central Province', 'Southern', true),
    ('GUL', 'Gulf Province', 'Southern', true),
    ('MIL', 'Milne Bay Province', 'Southern', true),
    ('NIP', 'Northern (Oro) Province', 'Southern', true),
    ('WES', 'Western Province', 'Southern', true),
    -- Highlands Region
    ('EHP', 'Eastern Highlands Province', 'Highlands', true),
    ('SIM', 'Simbu Province', 'Highlands', true),
    ('WHP', 'Western Highlands Province', 'Highlands', true),
    ('SHP', 'Southern Highlands Province', 'Highlands', true),
    ('ENG', 'Enga Province', 'Highlands', true),
    ('JWA', 'Jiwaka Province', 'Highlands', true),
    ('HEL', 'Hela Province', 'Highlands', true),
    -- Momase Region
    ('MAD', 'Madang Province', 'Momase', true),
    ('MOR', 'Morobe Province', 'Momase', true),
    ('ESP', 'East Sepik Province', 'Momase', true),
    ('WSP', 'West Sepik (Sandaun) Province', 'Momase', true),
    -- Islands Region
    ('ENB', 'East New Britain Province', 'Islands', true),
    ('WNB', 'West New Britain Province', 'Islands', true),
    ('NIR', 'New Ireland Province', 'Islands', true),
    ('MAN', 'Manus Province', 'Islands', true),
    ('ARB', 'Autonomous Region of Bougainville', 'Islands', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- DISTRICTS (Sample - need province IDs)
-- =============================================

-- Insert districts using subqueries to get province IDs
INSERT INTO districts (province_id, code, name, active)
SELECT p.id, 'NCD-N', 'North East', true FROM provinces p WHERE p.code = 'NCD'
ON CONFLICT (code) DO NOTHING;

INSERT INTO districts (province_id, code, name, active)
SELECT p.id, 'NCD-S', 'South', true FROM provinces p WHERE p.code = 'NCD'
ON CONFLICT (code) DO NOTHING;

INSERT INTO districts (province_id, code, name, active)
SELECT p.id, 'NCD-M', 'Moresby', true FROM provinces p WHERE p.code = 'NCD'
ON CONFLICT (code) DO NOTHING;

INSERT INTO districts (province_id, code, name, active)
SELECT p.id, 'MOR-LAE', 'Lae', true FROM provinces p WHERE p.code = 'MOR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO districts (province_id, code, name, active)
SELECT p.id, 'MOR-HUB', 'Huon Gulf', true FROM provinces p WHERE p.code = 'MOR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO districts (province_id, code, name, active)
SELECT p.id, 'MOR-FNS', 'Finschhafen', true FROM provinces p WHERE p.code = 'MOR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO districts (province_id, code, name, active)
SELECT p.id, 'EHP-GOR', 'Goroka', true FROM provinces p WHERE p.code = 'EHP'
ON CONFLICT (code) DO NOTHING;

INSERT INTO districts (province_id, code, name, active)
SELECT p.id, 'EHP-KAI', 'Kainantu', true FROM provinces p WHERE p.code = 'EHP'
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- UNSPSC CODES (Sample Categories)
-- =============================================

INSERT INTO unspsc_codes (code, title, segment, segment_title, family, family_title, class_code, class_title, commodity_title, active) VALUES
    -- IT Equipment (43)
    ('43211500', 'Computers', '43', 'Information Technology Broadcasting and Telecommunications', '4321', 'Computer Equipment and Accessories', '432115', 'Computers', 'Computers', true),
    ('43211503', 'Notebook computers', '43', 'Information Technology Broadcasting and Telecommunications', '4321', 'Computer Equipment and Accessories', '432115', 'Computers', 'Notebook computers', true),
    ('43211507', 'Desktop computers', '43', 'Information Technology Broadcasting and Telecommunications', '4321', 'Computer Equipment and Accessories', '432115', 'Computers', 'Desktop computers', true),
    ('43211509', 'Tablet computers', '43', 'Information Technology Broadcasting and Telecommunications', '4321', 'Computer Equipment and Accessories', '432115', 'Computers', 'Tablet computers', true),
    ('43212100', 'Printers', '43', 'Information Technology Broadcasting and Telecommunications', '4321', 'Computer Equipment and Accessories', '432121', 'Printers', 'Printers', true),
    -- Office Supplies (44)
    ('44121600', 'Office furniture', '44', 'Office Equipment and Accessories', '4412', 'Office Furniture', '441216', 'Office furniture', 'Office furniture', true),
    ('44121700', 'Office seating', '44', 'Office Equipment and Accessories', '4412', 'Office Furniture', '441217', 'Office seating', 'Office seating', true),
    -- Vehicles (25)
    ('25101500', 'Motor vehicles', '25', 'Commercial and Military and Private Vehicles', '2510', 'Motor vehicles', '251015', 'Motor vehicles', 'Motor vehicles', true),
    ('25101503', 'Light trucks or sport utility vehicles', '25', 'Commercial and Military and Private Vehicles', '2510', 'Motor vehicles', '251015', 'Motor vehicles', 'Light trucks or sport utility vehicles', true),
    -- Construction (72)
    ('72101500', 'Building construction services', '72', 'Building and Facility Construction and Maintenance Services', '7210', 'Building construction and support and maintenance services', '721015', 'Building construction services', 'Building construction services', true),
    ('72121400', 'Road construction services', '72', 'Building and Facility Construction and Maintenance Services', '7212', 'General building construction', '721214', 'Road construction services', 'Road construction services', true),
    -- Medical Equipment (42)
    ('42181500', 'Patient examination and monitoring', '42', 'Medical Equipment and Accessories', '4218', 'Patient exam and monitoring products', '421815', 'Patient examination and monitoring', 'Patient examination and monitoring', true),
    ('42182000', 'Medical diagnostic imaging', '42', 'Medical Equipment and Accessories', '4218', 'Patient exam and monitoring products', '421820', 'Medical diagnostic imaging', 'Medical diagnostic imaging', true),
    -- Professional Services (80)
    ('80101500', 'Business and corporate management consulting', '80', 'Management and Business Professionals and Administrative Services', '8010', 'Management advisory services', '801015', 'Business and corporate management consulting', 'Business and corporate management consulting', true),
    ('80111600', 'Temporary personnel services', '80', 'Management and Business Professionals and Administrative Services', '8011', 'Human resources services', '801116', 'Temporary personnel services', 'Temporary personnel services', true),
    -- Education (86)
    ('86101700', 'Training courses', '86', 'Education and Training Services', '8610', 'Vocational training', '861017', 'Training courses', 'Training courses', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify data was inserted
SELECT 'fund_sources' as table_name, COUNT(*) as count FROM fund_sources
UNION ALL
SELECT 'procurement_methods', COUNT(*) FROM procurement_methods
UNION ALL
SELECT 'contract_types', COUNT(*) FROM contract_types
UNION ALL
SELECT 'units_of_measure', COUNT(*) FROM units_of_measure
UNION ALL
SELECT 'provinces', COUNT(*) FROM provinces
UNION ALL
SELECT 'districts', COUNT(*) FROM districts
UNION ALL
SELECT 'unspsc_codes', COUNT(*) FROM unspsc_codes;
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
