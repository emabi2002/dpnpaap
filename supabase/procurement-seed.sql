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
