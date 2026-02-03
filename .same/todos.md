# DNPM Budget & Cashflow System - Development Todos

## Current Status: PROCUREMENT MODULE - Version 51

### Live URL
**Development Server Running**

---

## Supabase Deployment Status

### Files Ready for Deployment
All procurement SQL files are ready to be executed in Supabase SQL Editor:

1. **`supabase/procurement-schema.sql`** - Table definitions, triggers, RLS policies
   - Creates: fund_sources, procurement_methods, contract_types, units_of_measure, provinces, districts, unspsc_codes, procurement_plans, procurement_plan_items, procurement_workflow_actions

2. **`supabase/procurement-seed.sql`** - Lookup data (fund sources, methods, contract types, provinces, UNSPSC codes)
   - Fixed: Uses auto-generated UUIDs and subqueries for foreign keys

3. **`supabase/procurement-sample-plans.sql`** - Sample procurement plans for NPC and DOH agencies
   - Creates sample plans with realistic items for testing

### Deployment Steps
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/xisychoksilrwwesfosk
2. Go to SQL Editor
3. Run `supabase/procurement-schema.sql` first
4. Run `supabase/procurement-seed.sql` second
5. Run `supabase/procurement-sample-plans.sql` third (optional, for test data)

---

## NEW MODULE: Annual Procurement Plan (APP)

### Phase 1: Core Types & Data Layer - COMPLETE
- [x] Add procurement types to types.ts
- [x] Add lookup tables (UNSPSC, procurement methods, contract types, etc.)
- [x] Add mock data for procurement plans
- [x] Add PNG provinces and districts

### Phase 2: Basic Pages - COMPLETE
- [x] Procurement Plans list page (/procurement)
- [x] Procurement Plan detail page (/procurement/[id])
- [x] Create new procurement plan (/procurement/new)
- [x] Add to sidebar navigation
- [x] National Summary page (/procurement/national) with charts

### Phase 3: Line Items Management - COMPLETE
- [x] Line item dialog (Add/Edit) with tabs
- [x] UNSPSC search component with autocomplete
- [x] Quarter budget distribution (auto-split)
- [x] Bulk import from Excel component
- [x] Integrate bulk import into detail page
- [ ] Inline grid editing (spreadsheet-like) - FUTURE

### Phase 4: Validation & Workflow - COMPLETE
- [x] Quarter total validation (Q1+Q2+Q3+Q4 = Annual)
- [x] Estimated cost calculations (qty * unit cost)
- [x] Approval workflow actions (Submit/Approve/Return)
- [x] Workflow history with toggle

### Phase 5: Export & Reporting - COMPLETE
- [x] Export to Excel with formatted template
- [x] Export to PDF with formatted table
- [x] Download import template with reference sheets
- [x] National consolidation summary with charts

### Phase 6: Integration - COMPLETE
- [x] Cross-check with Workplan budgets
- [x] Cross-check with Cashflow totals
- [x] Discrepancy flagging dashboard (Reports > Cross-Check)
- [x] Supabase schema created (procurement-schema.sql)
- [x] Supabase seed data created (procurement-seed.sql)
- [x] Sample plans SQL created (procurement-sample-plans.sql)
- [x] Procurement service layer (procurement-service.ts)
- [x] React hooks with fallback to mock data (use-procurement.ts)

### Phase 7: Supabase Deployment - PENDING USER ACTION
- [ ] User to run SQL files in Supabase SQL Editor
- [ ] Verify data loads from Supabase in the app
- [ ] Deploy to production (Netlify)

---

## Component Structure (Procurement)

```
src/app/procurement/
├── page.tsx              # Plans list with filters
├── [id]/page.tsx         # Plan detail with items, quarterly, analysis tabs
├── new/page.tsx          # Create new plan form
└── national/page.tsx     # DNPM national summary with charts

src/components/procurement/
├── item-dialog.tsx       # Add/Edit item dialog with UNSPSC search
├── approval-actions.tsx  # Workflow actions with history
└── bulk-import.tsx       # Excel bulk import with validation

src/app/reports/
└── cross-check/page.tsx  # Budget cross-check dashboard

src/lib/supabase/
├── procurement-service.ts  # Supabase CRUD operations for procurement
└── use-procurement.ts      # React hooks with mock data fallback

supabase/
├── procurement-schema.sql      # Table definitions, triggers, RLS policies
├── procurement-seed.sql        # Lookup data and sample records
└── procurement-sample-plans.sql # Sample procurement plans for testing
```

---

## Completed Features (Previous Versions)

#### Core System
- [x] Next.js 16 with Turbopack
- [x] shadcn/ui components with custom styling
- [x] Supabase backend integration
- [x] Role-based access control (RBAC)
- [x] Dark mode support with theme toggle
- [x] Responsive design

#### Project Management
- [x] Project CRUD operations
- [x] Budget lines with donor codes (0-9)
- [x] Monthly/quarterly cashflow entry
- [x] Excel and PDF exports
- [x] File attachments
- [x] Approval workflow

#### Workplan System - Complete
- [x] Workplan CRUD operations
- [x] Activity CRUD with tabbed dialog
- [x] Quarterly targets and actuals tracking
- [x] Approval workflow
- [x] Project linking with budget sync
- [x] Gantt Chart Timeline View
- [x] Bulk Activity Import
- [x] Budget Variance Analysis
- [x] Supabase Real-time Schema

---

## Database Schema (Supabase)

```
workplans
├── id (UUID)
├── financial_year_id (FK)
├── agency_id (FK)
├── title, description
├── total_budget
├── status (enum)
├── submitted_by/at, approved_by/at
└── created_at, updated_at

workplan_activities
├── id (UUID)
├── workplan_id (FK)
├── project_id (FK, optional)
├── activity_code, activity_name
├── responsible_unit, responsible_officer
├── start_date, end_date
├── q1-q4 targets, actuals, budgets
├── kpi, expected_output
├── status (enum), progress_percent
└── created_at, updated_at

workplan_workflow_actions
├── id (UUID)
├── workplan_id (FK)
├── action_type, from_status, to_status
├── action_by (FK), action_date
└── comments
```

## Database Schema: Procurement Module

### ProcurementPlans (Header)
- id, financial_year_id, agency_id
- plan_name, agency_procurement_entity_name
- period_start, period_end
- fund_source_id, status
- created_by, created_at, updated_at

### ProcurementPlanItems (Line Items)
- id, procurement_plan_id, sequence_no
- activity_or_procurement_title, description
- unspsc_id, unspsc_code, unspsc_description
- estimated_contract_start, estimated_contract_end
- quantity, unit_of_measure_id
- estimated_unit_cost, estimated_total_cost
- annual_budget_year_value
- q1_budget, q2_budget, q3_budget, q4_budget
- location_scope, province_id, district_id
- procurement_method_id, contract_type_id
- comments, risk_notes, created_by

### Lookup Tables
- FundSources
- UNSPSC_Codes
- ProcurementMethods
- ContractTypes
- UnitsOfMeasure
- Provinces, Districts

## Demo Accounts

- `admin@dnpm.gov.pg` - System Admin (full access)
- `director@dnpm.gov.pg` - DNPM Approver
- `analyst@dnpm.gov.pg` - DNPM Reviewer
- `cfo@npc.gov.pg` - Agency Approver
- `budget@npc.gov.pg` - Agency User

Password: `DnpmDemo2026!`

## Key File Locations
- Workplan types: `src/lib/types.ts`
- Workplan data: `src/lib/database.ts`
- Workplans page: `src/app/workplans/page.tsx`
- Workplan detail: `src/app/workplans/[id]/page.tsx`
- New workplan: `src/app/workplans/new/page.tsx`
- Workplan schema: `supabase/workplan-schema.sql`
- Export utilities: `src/lib/workplan-export.ts`

## Supabase Integration Status

### Completed
- [x] Created `workplan-service.ts` with full CRUD operations
- [x] Created `use-workplans.ts` React hooks with real-time subscriptions
- [x] Updated `database.types.ts` with workplan table types
- [x] Updated `workplan-schema.sql` with improved compatibility
- [x] Created `workplan-seed.sql` with sample data

### To Deploy to Supabase
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/xisychoksilrwwesfosk
2. Go to SQL Editor
3. Run `supabase/workplan-schema.sql`
4. Run `supabase/workplan-seed.sql` (optional, for sample data)
5. Update the workplan pages to use the new hooks instead of mock data

## Future Enhancements (Backlog)

- [ ] Switch workplan pages to use Supabase hooks instead of mock data
- [ ] Email notifications for workflow actions
- [ ] Activity milestones and dependencies
- [ ] Resource allocation tracking
- [ ] Dashboard charts with Recharts
- [ ] Mobile responsive improvements
- [ ] Audit trail viewer
- [ ] Multi-language support
- [ ] Inline grid editing for procurement items
- [ ] UNSPSC spend profile drill-down reports

## Technical Notes

### Database Connection
- Supabase URL: https://xisychoksilrwwesfosk.supabase.co
- Environment variables configured in `.env.local`
- Run `supabase/workplan-schema.sql` in Supabase SQL Editor to create tables
