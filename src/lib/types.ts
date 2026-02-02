// User roles
export type UserRole =
  | 'agency_user'
  | 'agency_approver'
  | 'dnpm_reviewer'
  | 'dnpm_approver'
  | 'system_admin';

// Project statuses
export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'returned'
  | 'approved_by_agency'
  | 'under_dnpm_review'
  | 'approved_by_dnpm'
  | 'locked';

// Financial year status
export type FinancialYearStatus = 'open' | 'closed';

// Agency status
export type AgencyStatus = 'active' | 'inactive';

// Workflow action types
export type WorkflowActionType =
  | 'submit'
  | 'return'
  | 'approve_agency'
  | 'approve_dnpm'
  | 'lock'
  | 'reopen';

// User entity
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  agencyId: string | null; // null for DNPM/Admin users
  phone?: string;
  createdAt: Date;
  lastLogin?: Date;
  active: boolean;
}

// Agency entity
export interface Agency {
  id: string;
  agencyName: string;
  agencyCode?: string;
  sector?: string;
  contactPerson: string;
  email: string;
  phone?: string;
  status: AgencyStatus;
  createdAt: Date;
}

// Financial Year entity
export interface FinancialYear {
  id: string;
  year: number;
  status: FinancialYearStatus;
  submissionDeadline: Date;
  notes?: string;
  createdAt: Date;
}

// Donor Code entity
export interface DonorCode {
  id: string;
  code: number; // 0-9
  donorName: string;
  active: boolean;
}

// Project entity
export interface Project {
  id: string;
  financialYearId: string;
  agencyId: string;
  projectTitle: string;
  projectCode?: string;
  expenditureVoteNo?: string;
  division?: string;
  mainProgram?: string;
  program?: string;
  managerName?: string;
  objective?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: ProjectStatus;
}

// Budget Line entity
export interface BudgetLine {
  id: string;
  projectId: string;
  itemNo: string;
  descriptionOfItem: string;
  donorCodeId: string;
  originalBudget: number;
  revisedBudget: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cashflow Monthly entity
export interface CashflowMonthly {
  id: string;
  budgetLineId: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

// Workflow Action entity
export interface WorkflowAction {
  id: string;
  projectId: string;
  actionType: WorkflowActionType;
  actionByUser: string;
  actionDate: Date;
  comments?: string;
}

// Attachment entity
export interface Attachment {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

// Audit Log entity
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  userId: string;
  timestamp: Date;
  oldValue?: string;
  newValue?: string;
  fieldName?: string;
}

// Computed cashflow with totals
export interface CashflowWithTotals extends CashflowMonthly {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  annualTotal: number;
}

// Budget line with cashflow and donor info
export interface BudgetLineWithDetails extends BudgetLine {
  cashflow: CashflowMonthly | null;
  donorCode: DonorCode;
}

// Project with all related data
export interface ProjectWithDetails extends Project {
  agency: Agency;
  financialYear: FinancialYear;
  budgetLines: BudgetLineWithDetails[];
  workflowActions: WorkflowAction[];
  attachments: Attachment[];
  createdByUser: User;
}

// Donor Summary Row
export interface DonorSummaryRow {
  donorCode: DonorCode;
  originalBudget: number;
  revisedBudget: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  annualTotal: number;
}

// Dashboard stats
export interface DashboardStats {
  totalProjects: number;
  projectsByStatus: Record<ProjectStatus, number>;
  totalBudget: number;
  totalRevisedBudget: number;
  agencyCount: number;
  pendingApprovals: number;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completenessScore: number; // 0-100
}

// Status display info
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  returned: 'Returned for Correction',
  approved_by_agency: 'Approved by Agency',
  under_dnpm_review: 'Under DNPM Review',
  approved_by_dnpm: 'Approved by DNPM',
  locked: 'Locked',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-amber-100 text-amber-800',
  returned: 'bg-red-100 text-red-800',
  approved_by_agency: 'bg-emerald-100 text-emerald-800',
  under_dnpm_review: 'bg-sky-100 text-sky-800',
  approved_by_dnpm: 'bg-green-100 text-green-800',
  locked: 'bg-slate-100 text-slate-800',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  agency_user: 'Agency User',
  agency_approver: 'Agency Approver',
  dnpm_reviewer: 'DNPM Reviewer',
  dnpm_approver: 'DNPM Approver',
  system_admin: 'System Admin',
};

// Helper to calculate quarterly and annual totals
export function calculateCashflowTotals(cashflow: CashflowMonthly): CashflowWithTotals {
  const q1 = cashflow.jan + cashflow.feb + cashflow.mar;
  const q2 = cashflow.apr + cashflow.may + cashflow.jun;
  const q3 = cashflow.jul + cashflow.aug + cashflow.sep;
  const q4 = cashflow.oct + cashflow.nov + cashflow.dec;
  const annualTotal = q1 + q2 + q3 + q4;

  return {
    ...cashflow,
    q1,
    q2,
    q3,
    q4,
    annualTotal,
  };
}

// Month labels
export const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
] as const;

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
