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
} from './types';

// Re-export types for convenience
export type { Agency, User, FinancialYear, DonorCode, Project, BudgetLine, CashflowMonthly, WorkflowAction, Attachment, AuditLog };

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
