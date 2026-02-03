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
