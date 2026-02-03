/**
 * Types and interfaces for the project management system
 */

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

// Workplan Status
export type WorkplanStatus = 'draft' | 'submitted' | 'approved' | 'in_progress' | 'completed' | 'delayed';

// Workplan Activity Status
export type ActivityStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

// Quarter type
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

// Workplan entity - represents annual workplan for an agency
export interface Workplan {
  id: string;
  financialYearId: string;
  agencyId: string;
  title: string;
  description?: string;
  totalBudget: number;
  status: WorkplanStatus;
  submittedBy?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Workplan Activity - individual activities within a workplan
export interface WorkplanActivity {
  id: string;
  workplanId: string;
  projectId?: string; // Link to project if applicable
  activityCode: string;
  activityName: string;
  description?: string;
  responsibleUnit: string;
  responsibleOfficer?: string;
  startDate: Date;
  endDate: Date;
  q1Target: number;
  q2Target: number;
  q3Target: number;
  q4Target: number;
  q1Actual: number;
  q2Actual: number;
  q3Actual: number;
  q4Actual: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
  totalBudget: number;
  keyPerformanceIndicator: string;
  expectedOutput: string;
  status: ActivityStatus;
  progressPercent: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Workplan Milestone
export interface WorkplanMilestone {
  id: string;
  activityId: string;
  milestoneName: string;
  description?: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  weight: number; // Percentage weight for progress calculation (0-100)
  createdAt: Date;
  updatedAt: Date;
}

// Activity Dependency
export interface ActivityDependency {
  id: string;
  activityId: string; // The activity that depends on another
  dependsOnActivityId: string; // The activity that must be completed first
  dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lagDays: number; // Number of days delay after dependency is met
  isMandatory: boolean; // If true, activity cannot start until dependency is met
  createdAt: Date;
}

// Milestone status labels
export const MILESTONE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

export const MILESTONE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

// Dependency type labels
export const DEPENDENCY_TYPE_LABELS: Record<string, string> = {
  finish_to_start: 'Finish to Start (FS)',
  start_to_start: 'Start to Start (SS)',
  finish_to_finish: 'Finish to Finish (FF)',
  start_to_finish: 'Start to Finish (SF)',
};

// Workplan with details
export interface WorkplanWithDetails extends Workplan {
  agency: Agency;
  financialYear: FinancialYear;
  activities: WorkplanActivity[];
  totalActivities: number;
  completedActivities: number;
  progressPercent: number;
}

// National Workplan Summary
export interface NationalWorkplanSummary {
  financialYearId: string;
  totalAgencies: number;
  totalWorkplans: number;
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  delayedActivities: number;
  totalBudget: number;
  executedBudget: number;
  overallProgress: number;
  byAgency: {
    agencyId: string;
    agencyName: string;
    agencyCode: string;
    activitiesCount: number;
    completedCount: number;
    progressPercent: number;
    budget: number;
  }[];
  byQuarter: {
    quarter: Quarter;
    targetActivities: number;
    completedActivities: number;
    budget: number;
    executed: number;
  }[];
}

// Workplan status labels and colors
export const WORKPLAN_STATUS_LABELS: Record<WorkplanStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
};

export const WORKPLAN_STATUS_COLORS: Record<WorkplanStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-800',
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
};

export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-800',
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

// ===== PROCUREMENT MODULE TYPES =====

// Procurement Plan Status
export type ProcurementPlanStatus =
  | 'draft'
  | 'submitted'
  | 'returned'
  | 'approved_by_agency'
  | 'under_dnpm_review'
  | 'approved_by_dnpm'
  | 'locked';

// Location Scope
export type LocationScope = 'national' | 'provincial' | 'district' | 'specific_sites';

// Fund Source entity
export interface FundSource {
  id: string;
  code: string;
  name: string;
  description?: string;
  donorCodeId?: string; // Links to existing donor codes if applicable
  active: boolean;
}

// UNSPSC Code entity (United Nations Standard Products and Services Code)
export interface UNSPSCCode {
  id: string;
  code: string; // e.g., "43211500"
  title: string;
  segment: string; // First 2 digits
  segmentTitle: string;
  family: string; // First 4 digits
  familyTitle: string;
  classCode: string; // First 6 digits
  classTitle: string;
  commodityTitle: string; // Full 8 digits
  active: boolean;
}

// Procurement Method entity
export interface ProcurementMethod {
  id: string;
  code: string;
  name: string;
  description?: string;
  thresholdMin?: number; // Minimum value for this method
  thresholdMax?: number; // Maximum value for this method
  requiresApproval: boolean;
  active: boolean;
}

// Contract Type entity
export interface ContractType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: 'goods' | 'services' | 'works' | 'consulting';
  active: boolean;
}

// Unit of Measure entity
export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  active: boolean;
}

// Province entity (PNG)
export interface Province {
  id: string;
  code: string;
  name: string;
  region: 'Southern' | 'Highlands' | 'Momase' | 'Islands';
  active: boolean;
}

// District entity (PNG)
export interface District {
  id: string;
  provinceId: string;
  code: string;
  name: string;
  active: boolean;
}

// Procurement Plan entity - Header
export interface ProcurementPlan {
  id: string;
  financialYearId: string;
  agencyId: string;
  planName: string;
  agencyProcurementEntityName?: string;
  agencyBudgetCode?: string;
  periodStart: Date;
  periodEnd: Date;
  fundSourceId: string;
  status: ProcurementPlanStatus;
  totalEstimatedValue: number; // Computed from items
  itemCount: number; // Computed from items
  submittedBy?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Procurement Plan Item entity - Line Items
export interface ProcurementPlanItem {
  id: string;
  procurementPlanId: string;
  sequenceNo: number;
  activityOrProcurementTitle: string;
  descriptionOfItem: string;
  unspscId?: string;
  unspscCode?: string;
  unspscDescription?: string;
  estimatedContractStart: Date;
  estimatedContractEnd: Date;
  anticipatedDurationMonths: number;
  quantity: number;
  unitOfMeasureId?: string;
  estimatedUnitCost: number;
  estimatedTotalCost: number; // quantity * unitCost, can be overridden
  costOverrideJustification?: string; // Required if total != quantity * unit
  multiYearFlag: boolean;
  multiYearTotalBudget?: number;
  annualBudgetYearValue: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
  locationScope: LocationScope;
  locationNotes?: string;
  provinceId?: string;
  districtId?: string;
  procurementMethodId: string;
  contractTypeId: string;
  thirdPartyContractMgmtRequired: boolean;
  comments?: string;
  riskNotes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Procurement Plan with details
export interface ProcurementPlanWithDetails extends ProcurementPlan {
  agency: Agency;
  financialYear: FinancialYear;
  fundSource: FundSource;
  items: ProcurementPlanItemWithDetails[];
}

// Procurement Plan Item with lookup details
export interface ProcurementPlanItemWithDetails extends ProcurementPlanItem {
  unspsc?: UNSPSCCode;
  unitOfMeasure?: UnitOfMeasure;
  province?: Province;
  district?: District;
  procurementMethod: ProcurementMethod;
  contractType: ContractType;
}

// Procurement validation result
export interface ProcurementValidationResult {
  isValid: boolean;
  errors: ProcurementValidationError[];
  warnings: ProcurementValidationWarning[];
}

export interface ProcurementValidationError {
  itemId?: string;
  field: string;
  message: string;
}

export interface ProcurementValidationWarning {
  itemId?: string;
  field: string;
  message: string;
}

// National Procurement Summary
export interface NationalProcurementSummary {
  financialYearId: string;
  totalPlans: number;
  totalItems: number;
  totalEstimatedValue: number;
  byAgency: {
    agencyId: string;
    agencyName: string;
    agencyCode: string;
    planCount: number;
    itemCount: number;
    totalValue: number;
  }[];
  byFundSource: {
    fundSourceId: string;
    fundSourceName: string;
    totalValue: number;
    itemCount: number;
  }[];
  byProcurementMethod: {
    methodId: string;
    methodName: string;
    totalValue: number;
    itemCount: number;
  }[];
  byContractType: {
    typeId: string;
    typeName: string;
    totalValue: number;
    itemCount: number;
  }[];
  byQuarter: {
    quarter: Quarter;
    budget: number;
    itemCount: number;
  }[];
  byProvince: {
    provinceId: string;
    provinceName: string;
    totalValue: number;
    itemCount: number;
  }[];
  byUNSPSCSegment: {
    segment: string;
    segmentTitle: string;
    totalValue: number;
    itemCount: number;
  }[];
}

// Procurement Plan status labels
export const PROCUREMENT_PLAN_STATUS_LABELS: Record<ProcurementPlanStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  returned: 'Returned for Correction',
  approved_by_agency: 'Approved by Agency',
  under_dnpm_review: 'Under DNPM Review',
  approved_by_dnpm: 'Approved by DNPM',
  locked: 'Locked',
};

export const PROCUREMENT_PLAN_STATUS_COLORS: Record<ProcurementPlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-amber-100 text-amber-800',
  returned: 'bg-red-100 text-red-800',
  approved_by_agency: 'bg-emerald-100 text-emerald-800',
  under_dnpm_review: 'bg-sky-100 text-sky-800',
  approved_by_dnpm: 'bg-green-100 text-green-800',
  locked: 'bg-slate-100 text-slate-800',
};

export const LOCATION_SCOPE_LABELS: Record<LocationScope, string> = {
  national: 'National',
  provincial: 'Provincial',
  district: 'District',
  specific_sites: 'Specific Sites',
};

export const CONTRACT_CATEGORY_LABELS: Record<string, string> = {
  goods: 'Goods',
  services: 'Services',
  works: 'Works',
  consulting: 'Consulting Services',
};

// PNG Regions
export const PNG_REGIONS = ['Southern', 'Highlands', 'Momase', 'Islands'] as const;
export type PNGRegion = typeof PNG_REGIONS[number];

// Helper to validate quarter totals
export function validateQuarterTotals(
  q1: number,
  q2: number,
  q3: number,
  q4: number,
  annualValue: number,
  tolerance: number = 0.01
): { isValid: boolean; difference: number } {
  const quarterSum = q1 + q2 + q3 + q4;
  const difference = Math.abs(quarterSum - annualValue);
  const isValid = difference <= tolerance * annualValue;
  return { isValid, difference };
}

// Helper to distribute annual value equally across quarters
export function distributeToQuarters(annualValue: number): {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
} {
  const quarterValue = Math.floor(annualValue / 4);
  const remainder = annualValue - quarterValue * 4;
  return {
    q1: quarterValue + (remainder > 0 ? 1 : 0),
    q2: quarterValue + (remainder > 1 ? 1 : 0),
    q3: quarterValue + (remainder > 2 ? 1 : 0),
    q4: quarterValue,
  };
}

// Helper to calculate duration in months
export function calculateDurationMonths(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) + 1;
  return Math.max(1, months);
}
