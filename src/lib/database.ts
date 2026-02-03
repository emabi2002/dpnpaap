import type {
  User,
  Agency,
  FinancialYear,
  DonorCode,
  Project,
  BudgetLine,
  CashflowMonthly,
  WorkflowAction,
  Attachment,
  AuditLog,
  Workplan,
  WorkplanActivity,
  // Procurement types
  FundSource,
  UNSPSCCode,
  ProcurementMethod,
  ContractType,
  UnitOfMeasure,
  Province,
  District,
  ProcurementPlan,
  ProcurementPlanItem,
} from './types';

// Re-export types for convenience
export type {
  Agency,
  User,
  FinancialYear,
  DonorCode,
  Project,
  BudgetLine,
  CashflowMonthly,
  WorkflowAction,
  Attachment,
  AuditLog,
  Workplan,
  WorkplanActivity,
  // Procurement types
  FundSource,
  UNSPSCCode,
  ProcurementMethod,
  ContractType,
  UnitOfMeasure,
  Province,
  District,
  ProcurementPlan,
  ProcurementPlanItem,
};

// Generate unique IDs
let idCounter = 1000;
export function generateId(): string {
  return `id_${++idCounter}_${Date.now().toString(36)}`;
}

// ===== DONOR CODES (Seed Data) =====
export const donorCodes: DonorCode[] = [
  { id: 'donor_0', code: 0, donorName: 'GoPNG', active: true },
  { id: 'donor_1', code: 1, donorName: 'ADB', active: true },
  { id: 'donor_2', code: 2, donorName: 'World Bank', active: true },
  { id: 'donor_3', code: 3, donorName: 'European Union', active: true },
  { id: 'donor_4', code: 4, donorName: 'IFAD', active: true },
  { id: 'donor_5', code: 5, donorName: 'OECF', active: true },
  { id: 'donor_6', code: 6, donorName: 'JICA', active: true },
  { id: 'donor_7', code: 7, donorName: 'New Zealand', active: true },
  { id: 'donor_8', code: 8, donorName: 'AusAID', active: true },
  { id: 'donor_9', code: 9, donorName: 'Other', active: true },
];

// ===== AGENCIES (Seed Data) =====
export const agencies: Agency[] = [
  {
    id: 'agency_1',
    agencyName: 'Department of National Planning & Monitoring',
    agencyCode: 'DNPM',
    sector: 'Central Government',
    contactPerson: 'Michael Kumalu',
    email: 'mkumalu@dnpm.gov.pg',
    phone: '+675 321 4560',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'agency_2',
    agencyName: 'National Procurement Commission',
    agencyCode: 'NPC',
    sector: 'Finance & Treasury',
    contactPerson: 'Elizabeth Mave',
    email: 'emave@npc.gov.pg',
    phone: '+675 321 4561',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'agency_3',
    agencyName: 'Department of Finance',
    agencyCode: 'DOF',
    sector: 'Finance & Treasury',
    contactPerson: 'James Torovi',
    email: 'jtorovi@finance.gov.pg',
    phone: '+675 321 4562',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'agency_4',
    agencyName: 'Department of Health',
    agencyCode: 'DOH',
    sector: 'Health',
    contactPerson: 'Anna Kila',
    email: 'akila@health.gov.pg',
    phone: '+675 321 4563',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'agency_5',
    agencyName: 'Department of Education',
    agencyCode: 'DOE',
    sector: 'Education',
    contactPerson: 'Peter Kuman',
    email: 'pkuman@education.gov.pg',
    phone: '+675 321 4564',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'agency_6',
    agencyName: 'Department of Works',
    agencyCode: 'DOW',
    sector: 'Infrastructure',
    contactPerson: 'Thomas Wari',
    email: 'twari@works.gov.pg',
    phone: '+675 321 4565',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
];

// ===== FINANCIAL YEARS (Seed Data) =====
export const financialYears: FinancialYear[] = [
  {
    id: 'fy_2024',
    year: 2024,
    status: 'closed',
    submissionDeadline: new Date('2024-03-31'),
    notes: 'Financial Year 2024 - Completed',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'fy_2025',
    year: 2025,
    status: 'closed',
    submissionDeadline: new Date('2025-03-31'),
    notes: 'Financial Year 2025 - Completed',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'fy_2026',
    year: 2026,
    status: 'open',
    submissionDeadline: new Date('2026-03-31'),
    notes: 'Financial Year 2026 - Currently accepting submissions',
    createdAt: new Date('2026-01-01'),
  },
];

// ===== USERS (Seed Data) =====
export const users: User[] = [
  // System Admin
  {
    id: 'user_admin',
    email: 'admin@dnpm.gov.pg',
    name: 'System Administrator',
    role: 'system_admin',
    agencyId: null,
    phone: '+675 321 4500',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
  // DNPM Staff
  {
    id: 'user_dnpm_approver',
    email: 'director@dnpm.gov.pg',
    name: 'Dr. Koney Samuel',
    role: 'dnpm_approver',
    agencyId: null,
    phone: '+675 321 4501',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
  {
    id: 'user_dnpm_reviewer',
    email: 'analyst@dnpm.gov.pg',
    name: 'Janet Ila',
    role: 'dnpm_reviewer',
    agencyId: null,
    phone: '+675 321 4502',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
  // Agency Users
  {
    id: 'user_npc_approver',
    email: 'cfo@npc.gov.pg',
    name: 'Elizabeth Mave',
    role: 'agency_approver',
    agencyId: 'agency_2',
    phone: '+675 321 4561',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
  {
    id: 'user_npc_user',
    email: 'budget@npc.gov.pg',
    name: 'Paul Korare',
    role: 'agency_user',
    agencyId: 'agency_2',
    phone: '+675 321 4570',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
  {
    id: 'user_dof_approver',
    email: 'director@finance.gov.pg',
    name: 'James Torovi',
    role: 'agency_approver',
    agencyId: 'agency_3',
    phone: '+675 321 4562',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
  {
    id: 'user_dof_user',
    email: 'budget@finance.gov.pg',
    name: 'Sarah Manu',
    role: 'agency_user',
    agencyId: 'agency_3',
    phone: '+675 321 4571',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
  {
    id: 'user_doh_user',
    email: 'budget@health.gov.pg',
    name: 'Anna Kila',
    role: 'agency_user',
    agencyId: 'agency_4',
    phone: '+675 321 4563',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
  {
    id: 'user_doe_user',
    email: 'budget@education.gov.pg',
    name: 'Peter Kuman',
    role: 'agency_user',
    agencyId: 'agency_5',
    phone: '+675 321 4564',
    createdAt: new Date('2024-01-01'),
    active: true,
  },
];

// ===== PROJECTS (Seed Data) =====
export const projects: Project[] = [
  {
    id: 'project_1',
    financialYearId: 'fy_2026',
    agencyId: 'agency_2',
    projectTitle: 'Electronic Government Procurement System (eGP)',
    projectCode: 'NPC-EGP-001',
    expenditureVoteNo: '135',
    division: 'ICT Division',
    mainProgram: 'Digital Transformation',
    program: 'E-Government',
    managerName: 'Paul Korare',
    objective: 'To implement a comprehensive electronic government procurement system to enhance transparency, efficiency, and accountability in public procurement across all government agencies in PNG.',
    createdBy: 'user_npc_user',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
    status: 'draft',
  },
  {
    id: 'project_2',
    financialYearId: 'fy_2026',
    agencyId: 'agency_3',
    projectTitle: 'Integrated Financial Management System Upgrade',
    projectCode: 'DOF-IFMS-002',
    expenditureVoteNo: '140',
    division: 'Treasury Division',
    mainProgram: 'Financial Management',
    program: 'IFMS Enhancement',
    managerName: 'Sarah Manu',
    objective: 'To upgrade the existing IFMS to improve government financial reporting, budget execution tracking, and fiscal management capabilities.',
    createdBy: 'user_dof_user',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-22'),
    status: 'submitted',
  },
  {
    id: 'project_3',
    financialYearId: 'fy_2026',
    agencyId: 'agency_4',
    projectTitle: 'Rural Health Facilities Improvement Program',
    projectCode: 'DOH-RHFIP-003',
    expenditureVoteNo: '200',
    division: 'Health Infrastructure',
    mainProgram: 'Health Services',
    program: 'Rural Health',
    managerName: 'Anna Kila',
    objective: 'To improve health service delivery in rural areas through facility upgrades, equipment procurement, and capacity building.',
    createdBy: 'user_doh_user',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-25'),
    status: 'under_dnpm_review',
  },
  {
    id: 'project_4',
    financialYearId: 'fy_2026',
    agencyId: 'agency_5',
    projectTitle: 'National Education Quality Improvement',
    projectCode: 'DOE-NEQI-004',
    expenditureVoteNo: '210',
    division: 'Curriculum Division',
    mainProgram: 'Basic Education',
    program: 'Quality Standards',
    managerName: 'Peter Kuman',
    objective: 'To improve educational outcomes through teacher training, curriculum development, and learning resource provision.',
    createdBy: 'user_doe_user',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-28'),
    status: 'approved_by_dnpm',
  },
];

// ===== BUDGET LINES (Seed Data) =====
export const budgetLines: BudgetLine[] = [
  // Project 1 - eGP Budget Lines
  {
    id: 'bl_1_1',
    projectId: 'project_1',
    itemNo: '135',
    descriptionOfItem: 'Software Development & Licensing',
    donorCodeId: 'donor_1',
    originalBudget: 5000000,
    revisedBudget: 5500000,
    notes: 'ADB funded component',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'bl_1_2',
    projectId: 'project_1',
    itemNo: '136',
    descriptionOfItem: 'Hardware & Infrastructure',
    donorCodeId: 'donor_0',
    originalBudget: 2000000,
    revisedBudget: 2200000,
    notes: 'GoPNG counterpart funding',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'bl_1_3',
    projectId: 'project_1',
    itemNo: '137',
    descriptionOfItem: 'Training & Capacity Building',
    donorCodeId: 'donor_8',
    originalBudget: 800000,
    revisedBudget: 850000,
    notes: 'AusAID technical assistance',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'bl_1_4',
    projectId: 'project_1',
    itemNo: '138',
    descriptionOfItem: 'Consultancy Services',
    donorCodeId: 'donor_2',
    originalBudget: 1200000,
    revisedBudget: 1300000,
    notes: 'World Bank advisory services',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  },
  // Project 2 - IFMS Budget Lines
  {
    id: 'bl_2_1',
    projectId: 'project_2',
    itemNo: '140',
    descriptionOfItem: 'System Upgrade & Integration',
    donorCodeId: 'donor_0',
    originalBudget: 3000000,
    revisedBudget: 3200000,
    notes: '',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-22'),
  },
  {
    id: 'bl_2_2',
    projectId: 'project_2',
    itemNo: '141',
    descriptionOfItem: 'Data Migration & Testing',
    donorCodeId: 'donor_0',
    originalBudget: 500000,
    revisedBudget: 550000,
    notes: '',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-22'),
  },
  // Project 3 - Health Budget Lines
  {
    id: 'bl_3_1',
    projectId: 'project_3',
    itemNo: '200',
    descriptionOfItem: 'Facility Construction & Renovation',
    donorCodeId: 'donor_8',
    originalBudget: 8000000,
    revisedBudget: 8500000,
    notes: 'AusAID main component',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-25'),
  },
  {
    id: 'bl_3_2',
    projectId: 'project_3',
    itemNo: '201',
    descriptionOfItem: 'Medical Equipment Procurement',
    donorCodeId: 'donor_6',
    originalBudget: 4000000,
    revisedBudget: 4200000,
    notes: 'JICA equipment grant',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-25'),
  },
  {
    id: 'bl_3_3',
    projectId: 'project_3',
    itemNo: '202',
    descriptionOfItem: 'Health Worker Training',
    donorCodeId: 'donor_0',
    originalBudget: 1500000,
    revisedBudget: 1600000,
    notes: 'GoPNG component',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-25'),
  },
  // Project 4 - Education Budget Lines
  {
    id: 'bl_4_1',
    projectId: 'project_4',
    itemNo: '210',
    descriptionOfItem: 'Teacher Training Programs',
    donorCodeId: 'donor_3',
    originalBudget: 2500000,
    revisedBudget: 2600000,
    notes: 'EU education support',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'bl_4_2',
    projectId: 'project_4',
    itemNo: '211',
    descriptionOfItem: 'Learning Materials Development',
    donorCodeId: 'donor_0',
    originalBudget: 1800000,
    revisedBudget: 1900000,
    notes: '',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-28'),
  },
];

// ===== CASHFLOW MONTHLY (Seed Data) =====
export const cashflowMonthly: CashflowMonthly[] = [
  // Project 1 Budget Lines
  {
    id: 'cf_1_1',
    budgetLineId: 'bl_1_1',
    jan: 400000, feb: 450000, mar: 500000,
    apr: 450000, may: 480000, jun: 450000,
    jul: 500000, aug: 520000, sep: 480000,
    oct: 450000, nov: 420000, dec: 400000,
  },
  {
    id: 'cf_1_2',
    budgetLineId: 'bl_1_2',
    jan: 200000, feb: 180000, mar: 200000,
    apr: 190000, may: 180000, jun: 170000,
    jul: 180000, aug: 190000, sep: 180000,
    oct: 190000, nov: 170000, dec: 170000,
  },
  {
    id: 'cf_1_3',
    budgetLineId: 'bl_1_3',
    jan: 60000, feb: 70000, mar: 75000,
    apr: 70000, may: 75000, jun: 70000,
    jul: 75000, aug: 70000, sep: 70000,
    oct: 70000, nov: 75000, dec: 70000,
  },
  {
    id: 'cf_1_4',
    budgetLineId: 'bl_1_4',
    jan: 100000, feb: 110000, mar: 120000,
    apr: 100000, may: 110000, jun: 100000,
    jul: 110000, aug: 120000, sep: 110000,
    oct: 100000, nov: 110000, dec: 110000,
  },
  // Project 2 Budget Lines
  {
    id: 'cf_2_1',
    budgetLineId: 'bl_2_1',
    jan: 250000, feb: 270000, mar: 280000,
    apr: 260000, may: 280000, jun: 260000,
    jul: 270000, aug: 280000, sep: 270000,
    oct: 260000, nov: 260000, dec: 260000,
  },
  {
    id: 'cf_2_2',
    budgetLineId: 'bl_2_2',
    jan: 40000, feb: 45000, mar: 50000,
    apr: 45000, may: 48000, jun: 45000,
    jul: 48000, aug: 50000, sep: 45000,
    oct: 45000, nov: 44000, dec: 45000,
  },
  // Project 3 Budget Lines
  {
    id: 'cf_3_1',
    budgetLineId: 'bl_3_1',
    jan: 600000, feb: 700000, mar: 750000,
    apr: 700000, may: 750000, jun: 700000,
    jul: 750000, aug: 800000, sep: 700000,
    oct: 700000, nov: 680000, dec: 670000,
  },
  {
    id: 'cf_3_2',
    budgetLineId: 'bl_3_2',
    jan: 300000, feb: 350000, mar: 380000,
    apr: 350000, may: 360000, jun: 340000,
    jul: 360000, aug: 380000, sep: 350000,
    oct: 340000, nov: 350000, dec: 340000,
  },
  {
    id: 'cf_3_3',
    budgetLineId: 'bl_3_3',
    jan: 120000, feb: 140000, mar: 140000,
    apr: 130000, may: 140000, jun: 130000,
    jul: 140000, aug: 140000, sep: 130000,
    oct: 130000, nov: 130000, dec: 130000,
  },
  // Project 4 Budget Lines
  {
    id: 'cf_4_1',
    budgetLineId: 'bl_4_1',
    jan: 200000, feb: 220000, mar: 230000,
    apr: 210000, may: 220000, jun: 210000,
    jul: 220000, aug: 230000, sep: 220000,
    oct: 210000, nov: 220000, dec: 210000,
  },
  {
    id: 'cf_4_2',
    budgetLineId: 'bl_4_2',
    jan: 150000, feb: 160000, mar: 170000,
    apr: 155000, may: 165000, jun: 155000,
    jul: 165000, aug: 165000, sep: 160000,
    oct: 155000, nov: 150000, dec: 150000,
  },
];

// ===== WORKFLOW ACTIONS (Seed Data) =====
export const workflowActions: WorkflowAction[] = [
  {
    id: 'wf_1',
    projectId: 'project_2',
    actionType: 'submit',
    actionByUser: 'user_dof_user',
    actionDate: new Date('2026-01-22'),
    comments: 'Submitting for review. All budget lines and cashflows have been entered.',
  },
  {
    id: 'wf_2',
    projectId: 'project_3',
    actionType: 'submit',
    actionByUser: 'user_doh_user',
    actionDate: new Date('2026-01-25'),
    comments: 'Budget submission for FY2026 ready for DNPM review.',
  },
  {
    id: 'wf_3',
    projectId: 'project_4',
    actionType: 'submit',
    actionByUser: 'user_doe_user',
    actionDate: new Date('2026-01-26'),
    comments: 'Complete submission with all supporting documents.',
  },
  {
    id: 'wf_4',
    projectId: 'project_4',
    actionType: 'approve_dnpm',
    actionByUser: 'user_dnpm_approver',
    actionDate: new Date('2026-01-28'),
    comments: 'Approved. Budget allocation confirmed for FY2026.',
  },
];

// ===== ATTACHMENTS (Seed Data) =====
export const attachments: Attachment[] = [
  {
    id: 'att_1',
    projectId: 'project_1',
    fileName: 'eGP_Project_Plan.pdf',
    fileUrl: '/attachments/egp_project_plan.pdf',
    uploadedBy: 'user_npc_user',
    uploadedAt: new Date('2026-01-15'),
    description: 'Detailed project implementation plan',
  },
  {
    id: 'att_2',
    projectId: 'project_3',
    fileName: 'Health_Facility_Assessment.pdf',
    fileUrl: '/attachments/health_assessment.pdf',
    uploadedBy: 'user_doh_user',
    uploadedAt: new Date('2026-01-08'),
    description: 'Baseline assessment of rural health facilities',
  },
];

// ===== AUDIT LOGS (initially empty, populated as changes occur) =====
export const auditLogs: AuditLog[] = [];

// ===== WORKPLANS (Seed Data) =====
export const workplans: Workplan[] = [
  {
    id: 'wp_npc_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_2',
    title: 'NPC Annual Workplan FY2026',
    description: 'National Procurement Commission Annual Work Programme for Financial Year 2026',
    totalBudget: 15000000,
    status: 'in_progress',
    submittedBy: 'user_npc_approver',
    submittedAt: new Date('2026-01-10'),
    approvedBy: 'user_dnpm_approver',
    approvedAt: new Date('2026-01-15'),
    createdBy: 'user_npc_user',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'wp_dof_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_3',
    title: 'DOF Annual Workplan FY2026',
    description: 'Department of Finance Annual Work Programme for Financial Year 2026',
    totalBudget: 25000000,
    status: 'in_progress',
    submittedBy: 'user_dof_approver',
    submittedAt: new Date('2026-01-08'),
    approvedBy: 'user_dnpm_approver',
    approvedAt: new Date('2026-01-12'),
    createdBy: 'user_dof_user',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'wp_doh_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_4',
    title: 'DOH Annual Workplan FY2026',
    description: 'Department of Health Annual Work Programme for Financial Year 2026',
    totalBudget: 85000000,
    status: 'approved',
    submittedBy: 'user_doh_user',
    submittedAt: new Date('2026-01-06'),
    approvedBy: 'user_dnpm_approver',
    approvedAt: new Date('2026-01-10'),
    createdBy: 'user_doh_user',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-25'),
  },
  {
    id: 'wp_doe_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_5',
    title: 'DOE Annual Workplan FY2026',
    description: 'Department of Education Annual Work Programme for Financial Year 2026',
    totalBudget: 120000000,
    status: 'in_progress',
    submittedBy: 'user_doe_user',
    submittedAt: new Date('2026-01-07'),
    approvedBy: 'user_dnpm_approver',
    approvedAt: new Date('2026-01-11'),
    createdBy: 'user_doe_user',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'wp_dow_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_6',
    title: 'DOW Annual Workplan FY2026',
    description: 'Department of Works Annual Work Programme for Financial Year 2026',
    totalBudget: 200000000,
    status: 'submitted',
    submittedBy: undefined,
    submittedAt: new Date('2026-01-20'),
    createdBy: 'user_admin',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'wp_dnpm_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_1',
    title: 'DNPM Annual Workplan FY2026',
    description: 'Department of National Planning & Monitoring Annual Work Programme for Financial Year 2026',
    totalBudget: 18000000,
    status: 'draft',
    createdBy: 'user_admin',
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-01-28'),
  },
];

// ===== WORKPLAN ACTIVITIES (Seed Data) =====
export const workplanActivities: WorkplanActivity[] = [
  // NPC Activities
  {
    id: 'act_npc_001',
    workplanId: 'wp_npc_2026',
    projectId: 'project_1',
    activityCode: 'NPC-2026-001',
    activityName: 'Implement Electronic Government Procurement System',
    description: 'Deploy and roll out the eGP system across all government agencies',
    responsibleUnit: 'ICT Division',
    responsibleOfficer: 'Paul Korare',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 25,
    q2Target: 50,
    q3Target: 75,
    q4Target: 100,
    q1Actual: 15,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 2000000,
    q2Budget: 2500000,
    q3Budget: 2500000,
    q4Budget: 2850000,
    totalBudget: 9850000,
    keyPerformanceIndicator: 'Number of agencies onboarded to eGP system',
    expectedOutput: '50 agencies using eGP system by end of FY2026',
    status: 'in_progress',
    progressPercent: 15,
    remarks: 'Phase 1 pilot agencies identified and training commenced',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'act_npc_002',
    workplanId: 'wp_npc_2026',
    activityCode: 'NPC-2026-002',
    activityName: 'Procurement Capacity Building Program',
    description: 'Train government officers in procurement procedures and compliance',
    responsibleUnit: 'Training Unit',
    responsibleOfficer: 'Elizabeth Mave',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-11-30'),
    q1Target: 50,
    q2Target: 150,
    q3Target: 300,
    q4Target: 500,
    q1Actual: 45,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 500000,
    q2Budget: 800000,
    q3Budget: 800000,
    q4Budget: 500000,
    totalBudget: 2600000,
    keyPerformanceIndicator: 'Number of officers trained and certified',
    expectedOutput: '500 officers trained in procurement by November 2026',
    status: 'in_progress',
    progressPercent: 9,
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'act_npc_003',
    workplanId: 'wp_npc_2026',
    activityCode: 'NPC-2026-003',
    activityName: 'Procurement Audit and Compliance Review',
    description: 'Conduct annual procurement audits across government agencies',
    responsibleUnit: 'Compliance Division',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 5,
    q2Target: 15,
    q3Target: 30,
    q4Target: 50,
    q1Actual: 0,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 300000,
    q2Budget: 600000,
    q3Budget: 600000,
    q4Budget: 550000,
    totalBudget: 2050000,
    keyPerformanceIndicator: 'Number of agencies audited',
    expectedOutput: '50 agency procurement audits completed',
    status: 'not_started',
    progressPercent: 0,
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-28'),
  },

  // DOF Activities
  {
    id: 'act_dof_001',
    workplanId: 'wp_dof_2026',
    projectId: 'project_2',
    activityCode: 'DOF-2026-001',
    activityName: 'IFMS System Upgrade Implementation',
    description: 'Upgrade the Integrated Financial Management System to latest version',
    responsibleUnit: 'Treasury Division',
    responsibleOfficer: 'Sarah Manu',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-09-30'),
    q1Target: 20,
    q2Target: 50,
    q3Target: 100,
    q4Target: 100,
    q1Actual: 25,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 1000000,
    q2Budget: 1200000,
    q3Budget: 1550000,
    q4Budget: 0,
    totalBudget: 3750000,
    keyPerformanceIndicator: 'System modules upgraded and tested',
    expectedOutput: 'IFMS v3.0 fully operational by Q3 2026',
    status: 'in_progress',
    progressPercent: 25,
    remarks: 'Ahead of schedule - Q1 targets exceeded',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'act_dof_002',
    workplanId: 'wp_dof_2026',
    activityCode: 'DOF-2026-002',
    activityName: 'Revenue Collection Enhancement',
    description: 'Implement improved revenue collection mechanisms and monitoring',
    responsibleUnit: 'Revenue Division',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 2500,
    q2Target: 5500,
    q3Target: 8500,
    q4Target: 12000,
    q1Actual: 2800,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 2000000,
    q2Budget: 2500000,
    q3Budget: 2500000,
    q4Budget: 2000000,
    totalBudget: 9000000,
    keyPerformanceIndicator: 'Revenue collected (in millions PGK)',
    expectedOutput: 'K12 billion revenue target for FY2026',
    status: 'in_progress',
    progressPercent: 23,
    remarks: 'Strong Q1 performance',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'act_dof_003',
    workplanId: 'wp_dof_2026',
    activityCode: 'DOF-2026-003',
    activityName: 'Provincial Financial Management Support',
    description: 'Provide technical assistance to provincial treasuries',
    responsibleUnit: 'Provincial Liaison',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 5,
    q2Target: 12,
    q3Target: 18,
    q4Target: 22,
    q1Actual: 4,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 1500000,
    q2Budget: 2000000,
    q3Budget: 2000000,
    q4Budget: 1500000,
    totalBudget: 7000000,
    keyPerformanceIndicator: 'Provinces receiving technical support',
    expectedOutput: 'All 22 provinces supported',
    status: 'in_progress',
    progressPercent: 18,
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-28'),
  },

  // DOH Activities
  {
    id: 'act_doh_001',
    workplanId: 'wp_doh_2026',
    projectId: 'project_3',
    activityCode: 'DOH-2026-001',
    activityName: 'Rural Health Facility Construction',
    description: 'Construct and upgrade rural health facilities across the nation',
    responsibleUnit: 'Health Infrastructure',
    responsibleOfficer: 'Anna Kila',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 5,
    q2Target: 15,
    q3Target: 30,
    q4Target: 50,
    q1Actual: 6,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 10000000,
    q2Budget: 15000000,
    q3Budget: 15000000,
    q4Budget: 10000000,
    totalBudget: 50000000,
    keyPerformanceIndicator: 'Number of facilities constructed/upgraded',
    expectedOutput: '50 rural health facilities operational',
    status: 'in_progress',
    progressPercent: 12,
    remarks: 'Construction progressing well in Highlands region',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-25'),
  },
  {
    id: 'act_doh_002',
    workplanId: 'wp_doh_2026',
    activityCode: 'DOH-2026-002',
    activityName: 'Medical Equipment Procurement',
    description: 'Procure essential medical equipment for hospitals and health centers',
    responsibleUnit: 'Medical Supplies',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-10-31'),
    q1Target: 100,
    q2Target: 350,
    q3Target: 600,
    q4Target: 800,
    q1Actual: 80,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 5000000,
    q2Budget: 7000000,
    q3Budget: 7000000,
    q4Budget: 3000000,
    totalBudget: 22000000,
    keyPerformanceIndicator: 'Medical equipment items procured',
    expectedOutput: '800 essential equipment items delivered',
    status: 'in_progress',
    progressPercent: 10,
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-25'),
  },
  {
    id: 'act_doh_003',
    workplanId: 'wp_doh_2026',
    activityCode: 'DOH-2026-003',
    activityName: 'Community Health Worker Training',
    description: 'Train community health workers for rural health service delivery',
    responsibleUnit: 'Human Resources',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-11-30'),
    q1Target: 200,
    q2Target: 500,
    q3Target: 900,
    q4Target: 1200,
    q1Actual: 220,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 2000000,
    q2Budget: 3000000,
    q3Budget: 3000000,
    q4Budget: 2000000,
    totalBudget: 10000000,
    keyPerformanceIndicator: 'CHWs trained and deployed',
    expectedOutput: '1,200 CHWs active in communities',
    status: 'in_progress',
    progressPercent: 18,
    remarks: 'Training programs running in all regions',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-25'),
  },

  // DOE Activities
  {
    id: 'act_doe_001',
    workplanId: 'wp_doe_2026',
    projectId: 'project_4',
    activityCode: 'DOE-2026-001',
    activityName: 'Teacher Training and Development',
    description: 'Conduct in-service training for primary and secondary teachers',
    responsibleUnit: 'Teacher Education',
    responsibleOfficer: 'Peter Kuman',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 500,
    q2Target: 1500,
    q3Target: 3000,
    q4Target: 5000,
    q1Actual: 650,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 5000000,
    q2Budget: 8000000,
    q3Budget: 8000000,
    q4Budget: 5000000,
    totalBudget: 26000000,
    keyPerformanceIndicator: 'Teachers trained',
    expectedOutput: '5,000 teachers complete professional development',
    status: 'in_progress',
    progressPercent: 13,
    remarks: 'Exceeding Q1 training targets',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'act_doe_002',
    workplanId: 'wp_doe_2026',
    activityCode: 'DOE-2026-002',
    activityName: 'School Infrastructure Development',
    description: 'Construct and renovate school buildings across PNG',
    responsibleUnit: 'Infrastructure',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 10,
    q2Target: 30,
    q3Target: 60,
    q4Target: 100,
    q1Actual: 8,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 15000000,
    q2Budget: 20000000,
    q3Budget: 20000000,
    q4Budget: 15000000,
    totalBudget: 70000000,
    keyPerformanceIndicator: 'Schools constructed/renovated',
    expectedOutput: '100 school buildings completed',
    status: 'in_progress',
    progressPercent: 8,
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'act_doe_003',
    workplanId: 'wp_doe_2026',
    activityCode: 'DOE-2026-003',
    activityName: 'Curriculum Materials Distribution',
    description: 'Distribute textbooks and learning materials to schools',
    responsibleUnit: 'Curriculum Division',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-06-30'),
    q1Target: 50000,
    q2Target: 200000,
    q3Target: 200000,
    q4Target: 200000,
    q1Actual: 45000,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 3000000,
    q2Budget: 6000000,
    q3Budget: 0,
    q4Budget: 0,
    totalBudget: 9000000,
    keyPerformanceIndicator: 'Textbooks distributed',
    expectedOutput: '200,000 textbooks delivered to schools',
    status: 'in_progress',
    progressPercent: 22,
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-28'),
  },

  // DOW Activities
  {
    id: 'act_dow_001',
    workplanId: 'wp_dow_2026',
    activityCode: 'DOW-2026-001',
    activityName: 'National Highway Maintenance Program',
    description: 'Routine and periodic maintenance of national highways',
    responsibleUnit: 'Highway Maintenance',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 100,
    q2Target: 300,
    q3Target: 600,
    q4Target: 1000,
    q1Actual: 0,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 25000000,
    q2Budget: 35000000,
    q3Budget: 35000000,
    q4Budget: 25000000,
    totalBudget: 120000000,
    keyPerformanceIndicator: 'Kilometers of road maintained',
    expectedOutput: '1,000 km of highway maintained',
    status: 'not_started',
    progressPercent: 0,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'act_dow_002',
    workplanId: 'wp_dow_2026',
    activityCode: 'DOW-2026-002',
    activityName: 'Bridge Construction and Rehabilitation',
    description: 'Construct new bridges and rehabilitate existing ones',
    responsibleUnit: 'Structures Division',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-12-31'),
    q1Target: 2,
    q2Target: 6,
    q3Target: 12,
    q4Target: 20,
    q1Actual: 0,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    q1Budget: 10000000,
    q2Budget: 20000000,
    q3Budget: 20000000,
    q4Budget: 15000000,
    totalBudget: 65000000,
    keyPerformanceIndicator: 'Bridges completed',
    expectedOutput: '20 bridges constructed/rehabilitated',
    status: 'not_started',
    progressPercent: 0,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  },
];

// ===== HELPER FUNCTIONS =====

// Get agency by ID
export function getAgencyById(id: string): Agency | undefined {
  return agencies.find(a => a.id === id);
}

// Get user by ID
export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

// Get user by email (for login)
export function getUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}

// Get financial year by ID
export function getFinancialYearById(id: string): FinancialYear | undefined {
  return financialYears.find(fy => fy.id === id);
}

// Get donor code by ID
export function getDonorCodeById(id: string): DonorCode | undefined {
  return donorCodes.find(d => d.id === id);
}

// Get project by ID
export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

// Get budget lines for a project
export function getBudgetLinesByProjectId(projectId: string): BudgetLine[] {
  return budgetLines.filter(bl => bl.projectId === projectId);
}

// Get cashflow for a budget line
export function getCashflowByBudgetLineId(budgetLineId: string): CashflowMonthly | undefined {
  return cashflowMonthly.find(cf => cf.budgetLineId === budgetLineId);
}

// Get workflow actions for a project
export function getWorkflowActionsByProjectId(projectId: string): WorkflowAction[] {
  return workflowActions.filter(wa => wa.projectId === projectId).sort((a, b) =>
    new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime()
  );
}

// Get attachments for a project
export function getAttachmentsByProjectId(projectId: string): Attachment[] {
  return attachments.filter(att => att.projectId === projectId);
}

// Get projects by agency
export function getProjectsByAgencyId(agencyId: string): Project[] {
  return projects.filter(p => p.agencyId === agencyId);
}

// Get projects by financial year
export function getProjectsByFinancialYearId(financialYearId: string): Project[] {
  return projects.filter(p => p.financialYearId === financialYearId);
}

// Add audit log entry
export function addAuditLog(log: Omit<AuditLog, 'id'>): void {
  auditLogs.push({
    ...log,
    id: generateId(),
  });
}

// Get open financial years
export function getOpenFinancialYears(): FinancialYear[] {
  return financialYears.filter(fy => fy.status === 'open');
}

// Get active agencies
export function getActiveAgencies(): Agency[] {
  return agencies.filter(a => a.status === 'active');
}

// Get active donor codes
export function getActiveDonorCodes(): DonorCode[] {
  return donorCodes.filter(d => d.active);
}

// Get workplans by financial year
export function getWorkplansByFinancialYearId(financialYearId: string): Workplan[] {
  return workplans.filter(wp => wp.financialYearId === financialYearId);
}

// Get workplan by ID
export function getWorkplanById(id: string): Workplan | undefined {
  return workplans.find(wp => wp.id === id);
}

// Get workplan by agency
export function getWorkplanByAgencyId(agencyId: string, financialYearId?: string): Workplan[] {
  return workplans.filter(wp =>
    wp.agencyId === agencyId &&
    (financialYearId ? wp.financialYearId === financialYearId : true)
  );
}

// Get activities by workplan ID
export function getActivitiesByWorkplanId(workplanId: string): WorkplanActivity[] {
  return workplanActivities.filter(act => act.workplanId === workplanId);
}

// Get activity by ID
export function getActivityById(id: string): WorkplanActivity | undefined {
  return workplanActivities.find(act => act.id === id);
}

// Get all activities for a financial year (national consolidated)
export function getActivitiesByFinancialYear(financialYearId: string): WorkplanActivity[] {
  const yearWorkplans = getWorkplansByFinancialYearId(financialYearId);
  const workplanIds = yearWorkplans.map(wp => wp.id);
  return workplanActivities.filter(act => workplanIds.includes(act.workplanId));
}

// =============================================
// PROCUREMENT MODULE DATA
// =============================================

// ===== PROVINCES (PNG) =====
export const provinces: Province[] = [
  // Southern Region
  { id: 'prov_ncd', code: 'NCD', name: 'National Capital District', region: 'Southern', active: true },
  { id: 'prov_cen', code: 'CEN', name: 'Central Province', region: 'Southern', active: true },
  { id: 'prov_gul', code: 'GUL', name: 'Gulf Province', region: 'Southern', active: true },
  { id: 'prov_mil', code: 'MIL', name: 'Milne Bay Province', region: 'Southern', active: true },
  { id: 'prov_nip', code: 'NIP', name: 'Northern (Oro) Province', region: 'Southern', active: true },
  { id: 'prov_wes', code: 'WES', name: 'Western Province', region: 'Southern', active: true },
  // Highlands Region
  { id: 'prov_ehp', code: 'EHP', name: 'Eastern Highlands Province', region: 'Highlands', active: true },
  { id: 'prov_sim', code: 'SIM', name: 'Simbu Province', region: 'Highlands', active: true },
  { id: 'prov_whp', code: 'WHP', name: 'Western Highlands Province', region: 'Highlands', active: true },
  { id: 'prov_shp', code: 'SHP', name: 'Southern Highlands Province', region: 'Highlands', active: true },
  { id: 'prov_eng', code: 'ENG', name: 'Enga Province', region: 'Highlands', active: true },
  { id: 'prov_jwa', code: 'JWA', name: 'Jiwaka Province', region: 'Highlands', active: true },
  { id: 'prov_hel', code: 'HEL', name: 'Hela Province', region: 'Highlands', active: true },
  // Momase Region
  { id: 'prov_mad', code: 'MAD', name: 'Madang Province', region: 'Momase', active: true },
  { id: 'prov_mor', code: 'MOR', name: 'Morobe Province', region: 'Momase', active: true },
  { id: 'prov_esp', code: 'ESP', name: 'East Sepik Province', region: 'Momase', active: true },
  { id: 'prov_wsp', code: 'WSP', name: 'West Sepik (Sandaun) Province', region: 'Momase', active: true },
  // Islands Region
  { id: 'prov_enb', code: 'ENB', name: 'East New Britain Province', region: 'Islands', active: true },
  { id: 'prov_wnb', code: 'WNB', name: 'West New Britain Province', region: 'Islands', active: true },
  { id: 'prov_nir', code: 'NIR', name: 'New Ireland Province', region: 'Islands', active: true },
  { id: 'prov_man', code: 'MAN', name: 'Manus Province', region: 'Islands', active: true },
  { id: 'prov_arb', code: 'ARB', name: 'Autonomous Region of Bougainville', region: 'Islands', active: true },
];

// ===== DISTRICTS (Sample - Selected Provinces) =====
export const districts: District[] = [
  // NCD
  { id: 'dist_ncd_n', provinceId: 'prov_ncd', code: 'NCD-N', name: 'North East', active: true },
  { id: 'dist_ncd_s', provinceId: 'prov_ncd', code: 'NCD-S', name: 'South', active: true },
  { id: 'dist_ncd_m', provinceId: 'prov_ncd', code: 'NCD-M', name: 'Moresby', active: true },
  // Morobe
  { id: 'dist_mor_lae', provinceId: 'prov_mor', code: 'MOR-LAE', name: 'Lae', active: true },
  { id: 'dist_mor_hub', provinceId: 'prov_mor', code: 'MOR-HUB', name: 'Huon Gulf', active: true },
  { id: 'dist_mor_fns', provinceId: 'prov_mor', code: 'MOR-FNS', name: 'Finschhafen', active: true },
  // Eastern Highlands
  { id: 'dist_ehp_gor', provinceId: 'prov_ehp', code: 'EHP-GOR', name: 'Goroka', active: true },
  { id: 'dist_ehp_kai', provinceId: 'prov_ehp', code: 'EHP-KAI', name: 'Kainantu', active: true },
];

// ===== FUND SOURCES =====
export const fundSources: FundSource[] = [
  { id: 'fs_gopng_dev', code: 'GOPNG-DEV', name: 'GoPNG Development Budget', description: 'Government of PNG Development Budget', donorCodeId: 'donor_0', active: true },
  { id: 'fs_gopng_rec', code: 'GOPNG-REC', name: 'GoPNG Recurrent Budget', description: 'Government of PNG Recurrent Budget', donorCodeId: 'donor_0', active: true },
  { id: 'fs_adb', code: 'ADB', name: 'Asian Development Bank', description: 'ADB Loan/Grant Funded', donorCodeId: 'donor_1', active: true },
  { id: 'fs_wb', code: 'WB', name: 'World Bank', description: 'World Bank Loan/Grant Funded', donorCodeId: 'donor_2', active: true },
  { id: 'fs_eu', code: 'EU', name: 'European Union', description: 'EU Grant Funded', donorCodeId: 'donor_3', active: true },
  { id: 'fs_jica', code: 'JICA', name: 'Japan International Cooperation Agency', description: 'JICA Loan/Grant Funded', donorCodeId: 'donor_6', active: true },
  { id: 'fs_ausaid', code: 'DFAT', name: 'Australian DFAT', description: 'Australian Aid Funded', donorCodeId: 'donor_8', active: true },
  { id: 'fs_nzaid', code: 'MFAT', name: 'New Zealand MFAT', description: 'New Zealand Aid Funded', donorCodeId: 'donor_7', active: true },
];

// ===== PROCUREMENT METHODS =====
export const procurementMethods: ProcurementMethod[] = [
  { id: 'pm_rfq', code: 'RFQ', name: 'Request for Quotation', description: 'For low-value purchases below K50,000', thresholdMax: 50000, requiresApproval: false, active: true },
  { id: 'pm_rft', code: 'RFT', name: 'Request for Tender', description: 'Open competitive tender for goods and services', thresholdMin: 50000, requiresApproval: true, active: true },
  { id: 'pm_rfp', code: 'RFP', name: 'Request for Proposal', description: 'For consulting and professional services', requiresApproval: true, active: true },
  { id: 'pm_icb', code: 'ICB', name: 'International Competitive Bidding', description: 'For high-value international procurement', thresholdMin: 5000000, requiresApproval: true, active: true },
  { id: 'pm_ncb', code: 'NCB', name: 'National Competitive Bidding', description: 'For national-level competitive procurement', thresholdMin: 500000, thresholdMax: 5000000, requiresApproval: true, active: true },
  { id: 'pm_restricted', code: 'RT', name: 'Restricted Tender', description: 'Limited to pre-qualified suppliers', requiresApproval: true, active: true },
  { id: 'pm_direct', code: 'DP', name: 'Direct Procurement', description: 'Single source procurement with justification', requiresApproval: true, active: true },
  { id: 'pm_shopping', code: 'SH', name: 'Shopping', description: 'Comparison of prices from multiple suppliers', thresholdMax: 100000, requiresApproval: false, active: true },
];

// ===== CONTRACT TYPES =====
export const contractTypes: ContractType[] = [
  { id: 'ct_supply', code: 'SUP', name: 'Supply Contract', description: 'For supply of goods', category: 'goods', active: true },
  { id: 'ct_works', code: 'WRK', name: 'Works Contract', description: 'For construction and civil works', category: 'works', active: true },
  { id: 'ct_service', code: 'SVC', name: 'Service Contract', description: 'For general services', category: 'services', active: true },
  { id: 'ct_consulting', code: 'CON', name: 'Consulting Contract', description: 'For consulting and advisory services', category: 'consulting', active: true },
  { id: 'ct_framework', code: 'FWK', name: 'Framework Agreement', description: 'Long-term agreement with call-off orders', category: 'services', active: true },
  { id: 'ct_panel', code: 'PNL', name: 'Panel Contract', description: 'Multiple suppliers on a panel', category: 'services', active: true },
  { id: 'ct_turnkey', code: 'TRK', name: 'Turnkey Contract', description: 'Design, build, and operate', category: 'works', active: true },
];

// ===== UNITS OF MEASURE =====
export const unitsOfMeasure: UnitOfMeasure[] = [
  { id: 'uom_ea', code: 'EA', name: 'Each', abbreviation: 'ea', active: true },
  { id: 'uom_set', code: 'SET', name: 'Set', abbreviation: 'set', active: true },
  { id: 'uom_lot', code: 'LOT', name: 'Lot', abbreviation: 'lot', active: true },
  { id: 'uom_pkg', code: 'PKG', name: 'Package', abbreviation: 'pkg', active: true },
  { id: 'uom_kg', code: 'KG', name: 'Kilogram', abbreviation: 'kg', active: true },
  { id: 'uom_ton', code: 'TON', name: 'Metric Ton', abbreviation: 't', active: true },
  { id: 'uom_m', code: 'M', name: 'Meter', abbreviation: 'm', active: true },
  { id: 'uom_km', code: 'KM', name: 'Kilometer', abbreviation: 'km', active: true },
  { id: 'uom_sqm', code: 'SQM', name: 'Square Meter', abbreviation: 'm2', active: true },
  { id: 'uom_cbm', code: 'CBM', name: 'Cubic Meter', abbreviation: 'm3', active: true },
  { id: 'uom_l', code: 'L', name: 'Liter', abbreviation: 'L', active: true },
  { id: 'uom_hr', code: 'HR', name: 'Hour', abbreviation: 'hr', active: true },
  { id: 'uom_day', code: 'DAY', name: 'Day', abbreviation: 'day', active: true },
  { id: 'uom_mth', code: 'MTH', name: 'Month', abbreviation: 'mth', active: true },
  { id: 'uom_yr', code: 'YR', name: 'Year', abbreviation: 'yr', active: true },
  { id: 'uom_lsum', code: 'LS', name: 'Lump Sum', abbreviation: 'LS', active: true },
];

// ===== UNSPSC CODES (Sample - Common Categories) =====
export const unspscCodes: UNSPSCCode[] = [
  // IT Equipment (43)
  { id: 'unspsc_43211500', code: '43211500', title: 'Computers', segment: '43', segmentTitle: 'Information Technology Broadcasting and Telecommunications', family: '4321', familyTitle: 'Computer Equipment and Accessories', classCode: '432115', classTitle: 'Computers', commodityTitle: 'Computers', active: true },
  { id: 'unspsc_43211503', code: '43211503', title: 'Notebook computers', segment: '43', segmentTitle: 'Information Technology Broadcasting and Telecommunications', family: '4321', familyTitle: 'Computer Equipment and Accessories', classCode: '432115', classTitle: 'Computers', commodityTitle: 'Notebook computers', active: true },
  { id: 'unspsc_43211507', code: '43211507', title: 'Desktop computers', segment: '43', segmentTitle: 'Information Technology Broadcasting and Telecommunications', family: '4321', familyTitle: 'Computer Equipment and Accessories', classCode: '432115', classTitle: 'Computers', commodityTitle: 'Desktop computers', active: true },
  { id: 'unspsc_43211509', code: '43211509', title: 'Tablet computers', segment: '43', segmentTitle: 'Information Technology Broadcasting and Telecommunications', family: '4321', familyTitle: 'Computer Equipment and Accessories', classCode: '432115', classTitle: 'Computers', commodityTitle: 'Tablet computers', active: true },
  { id: 'unspsc_43212100', code: '43212100', title: 'Printers', segment: '43', segmentTitle: 'Information Technology Broadcasting and Telecommunications', family: '4321', familyTitle: 'Computer Equipment and Accessories', classCode: '432121', classTitle: 'Printers', commodityTitle: 'Printers', active: true },
  // Office Supplies (44)
  { id: 'unspsc_44121600', code: '44121600', title: 'Office furniture', segment: '44', segmentTitle: 'Office Equipment and Accessories', family: '4412', familyTitle: 'Office Furniture', classCode: '441216', classTitle: 'Office furniture', commodityTitle: 'Office furniture', active: true },
  { id: 'unspsc_44121700', code: '44121700', title: 'Office seating', segment: '44', segmentTitle: 'Office Equipment and Accessories', family: '4412', familyTitle: 'Office Furniture', classCode: '441217', classTitle: 'Office seating', commodityTitle: 'Office seating', active: true },
  // Vehicles (25)
  { id: 'unspsc_25101500', code: '25101500', title: 'Motor vehicles', segment: '25', segmentTitle: 'Commercial and Military and Private Vehicles', family: '2510', familyTitle: 'Motor vehicles', classCode: '251015', classTitle: 'Motor vehicles', commodityTitle: 'Motor vehicles', active: true },
  { id: 'unspsc_25101503', code: '25101503', title: 'Light trucks or sport utility vehicles', segment: '25', segmentTitle: 'Commercial and Military and Private Vehicles', family: '2510', familyTitle: 'Motor vehicles', classCode: '251015', classTitle: 'Motor vehicles', commodityTitle: 'Light trucks or sport utility vehicles', active: true },
  // Construction (72)
  { id: 'unspsc_72101500', code: '72101500', title: 'Building construction services', segment: '72', segmentTitle: 'Building and Facility Construction and Maintenance Services', family: '7210', familyTitle: 'Building construction and support and maintenance services', classCode: '721015', classTitle: 'Building construction services', commodityTitle: 'Building construction services', active: true },
  { id: 'unspsc_72121400', code: '72121400', title: 'Road construction services', segment: '72', segmentTitle: 'Building and Facility Construction and Maintenance Services', family: '7212', familyTitle: 'General building construction', classCode: '721214', classTitle: 'Road construction services', commodityTitle: 'Road construction services', active: true },
  // Medical Equipment (42)
  { id: 'unspsc_42181500', code: '42181500', title: 'Patient examination and monitoring', segment: '42', segmentTitle: 'Medical Equipment and Accessories', family: '4218', familyTitle: 'Patient exam and monitoring products', classCode: '421815', classTitle: 'Patient examination and monitoring', commodityTitle: 'Patient examination and monitoring', active: true },
  { id: 'unspsc_42182000', code: '42182000', title: 'Medical diagnostic imaging', segment: '42', segmentTitle: 'Medical Equipment and Accessories', family: '4218', familyTitle: 'Patient exam and monitoring products', classCode: '421820', classTitle: 'Medical diagnostic imaging', commodityTitle: 'Medical diagnostic imaging', active: true },
  // Professional Services (80)
  { id: 'unspsc_80101500', code: '80101500', title: 'Business and corporate management consulting', segment: '80', segmentTitle: 'Management and Business Professionals and Administrative Services', family: '8010', familyTitle: 'Management advisory services', classCode: '801015', classTitle: 'Business and corporate management consulting', commodityTitle: 'Business and corporate management consulting', active: true },
  { id: 'unspsc_80111600', code: '80111600', title: 'Temporary personnel services', segment: '80', segmentTitle: 'Management and Business Professionals and Administrative Services', family: '8011', familyTitle: 'Human resources services', classCode: '801116', classTitle: 'Temporary personnel services', commodityTitle: 'Temporary personnel services', active: true },
  // Education (86)
  { id: 'unspsc_86101700', code: '86101700', title: 'Training courses', segment: '86', segmentTitle: 'Education and Training Services', family: '8610', familyTitle: 'Vocational training', classCode: '861017', classTitle: 'Training courses', commodityTitle: 'Training courses', active: true },
];

// ===== PROCUREMENT PLANS (Sample) =====
export const procurementPlans: ProcurementPlan[] = [
  {
    id: 'pp_npc_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_2',
    planName: 'NPC Annual Procurement Plan FY2026',
    agencyProcurementEntityName: 'National Procurement Commission',
    agencyBudgetCode: 'NPC-135',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-12-31'),
    fundSourceId: 'fs_gopng_dev',
    status: 'approved_by_dnpm',
    totalEstimatedValue: 9850000,
    itemCount: 5,
    submittedBy: 'user_npc_approver',
    submittedAt: new Date('2026-01-10'),
    approvedBy: 'user_dnpm_approver',
    approvedAt: new Date('2026-01-18'),
    createdBy: 'user_npc_user',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-18'),
  },
  {
    id: 'pp_dof_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_3',
    planName: 'DOF Annual Procurement Plan FY2026',
    agencyProcurementEntityName: 'Department of Finance',
    agencyBudgetCode: 'DOF-140',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-12-31'),
    fundSourceId: 'fs_gopng_dev',
    status: 'under_dnpm_review',
    totalEstimatedValue: 5500000,
    itemCount: 4,
    submittedBy: 'user_dof_approver',
    submittedAt: new Date('2026-01-22'),
    createdBy: 'user_dof_user',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-22'),
  },
  {
    id: 'pp_doh_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_4',
    planName: 'DOH Annual Procurement Plan FY2026',
    agencyProcurementEntityName: 'Department of Health',
    agencyBudgetCode: 'DOH-200',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-12-31'),
    fundSourceId: 'fs_ausaid',
    status: 'approved_by_agency',
    totalEstimatedValue: 22500000,
    itemCount: 8,
    submittedBy: 'user_doh_user',
    submittedAt: new Date('2026-01-20'),
    createdBy: 'user_doh_user',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'pp_doe_2026',
    financialYearId: 'fy_2026',
    agencyId: 'agency_5',
    planName: 'DOE Annual Procurement Plan FY2026',
    agencyProcurementEntityName: 'Department of Education',
    agencyBudgetCode: 'DOE-210',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-12-31'),
    fundSourceId: 'fs_eu',
    status: 'draft',
    totalEstimatedValue: 15000000,
    itemCount: 6,
    createdBy: 'user_doe_user',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-25'),
  },
];

// ===== PROCUREMENT PLAN ITEMS (Sample) =====
export const procurementPlanItems: ProcurementPlanItem[] = [
  // NPC Items
  {
    id: 'ppi_npc_001',
    procurementPlanId: 'pp_npc_2026',
    sequenceNo: 1,
    activityOrProcurementTitle: 'eGP System Software Development',
    descriptionOfItem: 'Development of Electronic Government Procurement System including portal, database, and integration modules',
    unspscId: 'unspsc_43211500',
    unspscCode: '43211500',
    unspscDescription: 'Computers',
    estimatedContractStart: new Date('2026-02-01'),
    estimatedContractEnd: new Date('2026-11-30'),
    anticipatedDurationMonths: 10,
    quantity: 1,
    unitOfMeasureId: 'uom_lsum',
    estimatedUnitCost: 5500000,
    estimatedTotalCost: 5500000,
    multiYearFlag: false,
    annualBudgetYearValue: 5500000,
    q1Budget: 1000000,
    q2Budget: 1500000,
    q3Budget: 1500000,
    q4Budget: 1500000,
    locationScope: 'national',
    procurementMethodId: 'pm_icb',
    contractTypeId: 'ct_service',
    thirdPartyContractMgmtRequired: false,
    comments: 'Key priority project for digital transformation',
    createdBy: 'user_npc_user',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'ppi_npc_002',
    procurementPlanId: 'pp_npc_2026',
    sequenceNo: 2,
    activityOrProcurementTitle: 'IT Equipment for eGP',
    descriptionOfItem: 'Servers, networking equipment, and workstations for eGP system deployment',
    unspscId: 'unspsc_43211507',
    unspscCode: '43211507',
    unspscDescription: 'Desktop computers',
    estimatedContractStart: new Date('2026-03-01'),
    estimatedContractEnd: new Date('2026-06-30'),
    anticipatedDurationMonths: 4,
    quantity: 50,
    unitOfMeasureId: 'uom_ea',
    estimatedUnitCost: 25000,
    estimatedTotalCost: 1250000,
    multiYearFlag: false,
    annualBudgetYearValue: 1250000,
    q1Budget: 0,
    q2Budget: 1250000,
    q3Budget: 0,
    q4Budget: 0,
    locationScope: 'national',
    procurementMethodId: 'pm_ncb',
    contractTypeId: 'ct_supply',
    thirdPartyContractMgmtRequired: false,
    createdBy: 'user_npc_user',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'ppi_npc_003',
    procurementPlanId: 'pp_npc_2026',
    sequenceNo: 3,
    activityOrProcurementTitle: 'Training Services',
    descriptionOfItem: 'Training for government procurement officers on eGP system usage and procurement procedures',
    unspscId: 'unspsc_86101700',
    unspscCode: '86101700',
    unspscDescription: 'Training courses',
    estimatedContractStart: new Date('2026-04-01'),
    estimatedContractEnd: new Date('2026-12-31'),
    anticipatedDurationMonths: 9,
    quantity: 500,
    unitOfMeasureId: 'uom_ea',
    estimatedUnitCost: 5000,
    estimatedTotalCost: 2500000,
    multiYearFlag: false,
    annualBudgetYearValue: 2500000,
    q1Budget: 0,
    q2Budget: 700000,
    q3Budget: 900000,
    q4Budget: 900000,
    locationScope: 'national',
    procurementMethodId: 'pm_rft',
    contractTypeId: 'ct_service',
    thirdPartyContractMgmtRequired: false,
    createdBy: 'user_npc_user',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-10'),
  },
  // DOH Items
  {
    id: 'ppi_doh_001',
    procurementPlanId: 'pp_doh_2026',
    sequenceNo: 1,
    activityOrProcurementTitle: 'Medical Equipment for Rural Health Centers',
    descriptionOfItem: 'Basic diagnostic and treatment equipment for 50 rural health centers',
    unspscId: 'unspsc_42181500',
    unspscCode: '42181500',
    unspscDescription: 'Patient examination and monitoring',
    estimatedContractStart: new Date('2026-02-01'),
    estimatedContractEnd: new Date('2026-10-31'),
    anticipatedDurationMonths: 9,
    quantity: 50,
    unitOfMeasureId: 'uom_set',
    estimatedUnitCost: 200000,
    estimatedTotalCost: 10000000,
    multiYearFlag: false,
    annualBudgetYearValue: 10000000,
    q1Budget: 2000000,
    q2Budget: 3000000,
    q3Budget: 3000000,
    q4Budget: 2000000,
    locationScope: 'provincial',
    provinceId: 'prov_mor',
    procurementMethodId: 'pm_icb',
    contractTypeId: 'ct_supply',
    thirdPartyContractMgmtRequired: true,
    riskNotes: 'Complex logistics for rural delivery',
    createdBy: 'user_doh_user',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'ppi_doh_002',
    procurementPlanId: 'pp_doh_2026',
    sequenceNo: 2,
    activityOrProcurementTitle: 'Health Center Construction',
    descriptionOfItem: 'Construction of 10 new rural health centers in priority areas',
    unspscId: 'unspsc_72101500',
    unspscCode: '72101500',
    unspscDescription: 'Building construction services',
    estimatedContractStart: new Date('2026-03-01'),
    estimatedContractEnd: new Date('2026-12-31'),
    anticipatedDurationMonths: 10,
    quantity: 10,
    unitOfMeasureId: 'uom_ea',
    estimatedUnitCost: 800000,
    estimatedTotalCost: 8000000,
    multiYearFlag: true,
    multiYearTotalBudget: 16000000,
    annualBudgetYearValue: 8000000,
    q1Budget: 500000,
    q2Budget: 2500000,
    q3Budget: 2500000,
    q4Budget: 2500000,
    locationScope: 'provincial',
    procurementMethodId: 'pm_icb',
    contractTypeId: 'ct_works',
    thirdPartyContractMgmtRequired: true,
    riskNotes: 'Multi-year project, weather-dependent construction',
    createdBy: 'user_doh_user',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'ppi_doh_003',
    procurementPlanId: 'pp_doh_2026',
    sequenceNo: 3,
    activityOrProcurementTitle: 'Ambulance Vehicles',
    descriptionOfItem: 'Procurement of 10 ambulance vehicles for provincial hospitals',
    unspscId: 'unspsc_25101503',
    unspscCode: '25101503',
    unspscDescription: 'Light trucks or sport utility vehicles',
    estimatedContractStart: new Date('2026-04-01'),
    estimatedContractEnd: new Date('2026-08-31'),
    anticipatedDurationMonths: 5,
    quantity: 10,
    unitOfMeasureId: 'uom_ea',
    estimatedUnitCost: 450000,
    estimatedTotalCost: 4500000,
    multiYearFlag: false,
    annualBudgetYearValue: 4500000,
    q1Budget: 0,
    q2Budget: 2250000,
    q3Budget: 2250000,
    q4Budget: 0,
    locationScope: 'national',
    procurementMethodId: 'pm_ncb',
    contractTypeId: 'ct_supply',
    thirdPartyContractMgmtRequired: false,
    createdBy: 'user_doh_user',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-15'),
  },
];

// ===== PROCUREMENT HELPER FUNCTIONS =====

// Get province by ID
export function getProvinceById(id: string): Province | undefined {
  return provinces.find(p => p.id === id);
}

// Get provinces by region
export function getProvincesByRegion(region: string): Province[] {
  return provinces.filter(p => p.region === region && p.active);
}

// Get districts by province
export function getDistrictsByProvinceId(provinceId: string): District[] {
  return districts.filter(d => d.provinceId === provinceId && d.active);
}

// Get fund source by ID
export function getFundSourceById(id: string): FundSource | undefined {
  return fundSources.find(fs => fs.id === id);
}

// Get active fund sources
export function getActiveFundSources(): FundSource[] {
  return fundSources.filter(fs => fs.active);
}

// Get procurement method by ID
export function getProcurementMethodById(id: string): ProcurementMethod | undefined {
  return procurementMethods.find(pm => pm.id === id);
}

// Get active procurement methods
export function getActiveProcurementMethods(): ProcurementMethod[] {
  return procurementMethods.filter(pm => pm.active);
}

// Get contract type by ID
export function getContractTypeById(id: string): ContractType | undefined {
  return contractTypes.find(ct => ct.id === id);
}

// Get active contract types
export function getActiveContractTypes(): ContractType[] {
  return contractTypes.filter(ct => ct.active);
}

// Get unit of measure by ID
export function getUnitOfMeasureById(id: string): UnitOfMeasure | undefined {
  return unitsOfMeasure.find(uom => uom.id === id);
}

// Get active units of measure
export function getActiveUnitsOfMeasure(): UnitOfMeasure[] {
  return unitsOfMeasure.filter(uom => uom.active);
}

// Get UNSPSC code by ID
export function getUNSPSCCodeById(id: string): UNSPSCCode | undefined {
  return unspscCodes.find(u => u.id === id);
}

// Search UNSPSC codes
export function searchUNSPSCCodes(query: string): UNSPSCCode[] {
  const lowerQuery = query.toLowerCase();
  return unspscCodes.filter(u =>
    u.code.includes(query) ||
    u.title.toLowerCase().includes(lowerQuery) ||
    u.commodityTitle.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}

// Get procurement plans by financial year
export function getProcurementPlansByFinancialYearId(financialYearId: string): ProcurementPlan[] {
  return procurementPlans.filter(pp => pp.financialYearId === financialYearId);
}

// Get procurement plans by agency
export function getProcurementPlansByAgencyId(agencyId: string, financialYearId?: string): ProcurementPlan[] {
  return procurementPlans.filter(pp =>
    pp.agencyId === agencyId &&
    (financialYearId ? pp.financialYearId === financialYearId : true)
  );
}

// Get procurement plan by ID
export function getProcurementPlanById(id: string): ProcurementPlan | undefined {
  return procurementPlans.find(pp => pp.id === id);
}

// Get procurement plan items by plan ID
export function getProcurementPlanItemsByPlanId(planId: string): ProcurementPlanItem[] {
  return procurementPlanItems.filter(ppi => ppi.procurementPlanId === planId)
    .sort((a, b) => a.sequenceNo - b.sequenceNo);
}

// Get procurement plan item by ID
export function getProcurementPlanItemById(id: string): ProcurementPlanItem | undefined {
  return procurementPlanItems.find(ppi => ppi.id === id);
}

// Get all procurement items for a financial year (national consolidated)
export function getProcurementItemsByFinancialYear(financialYearId: string): ProcurementPlanItem[] {
  const yearPlans = getProcurementPlansByFinancialYearId(financialYearId);
  const planIds = yearPlans.map(pp => pp.id);
  return procurementPlanItems.filter(ppi => planIds.includes(ppi.procurementPlanId));
}
