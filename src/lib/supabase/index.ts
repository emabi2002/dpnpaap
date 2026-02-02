// Supabase clients
export { createClient, getSupabaseClient } from './client';
export { createServerSupabaseClient, createAdminClient } from './server';

// Types
export type { Database, Tables, Insertable, Updatable } from './database.types';
export type { UserRole, ProjectStatus, FinancialYearStatus, AgencyStatus, WorkflowActionType } from './database.types';

// Auth
export {
  SupabaseAuthProvider,
  useSupabaseAuth,
  canEditProject,
  canSubmitProject,
  canApproveProject,
  canReturnProject,
  canLockProject,
  canExportData,
  type AppUser,
  type Agency
} from './auth-provider';

// Hooks
export {
  useAgencies,
  useActiveAgencies,
  useFinancialYears,
  useOpenFinancialYears,
  useDonorCodes,
  useUsers,
  useProjects,
  useProject,
  useBudgetLines,
  useCashflowMonthly,
  useWorkflowActions,
  useAttachments
} from './hooks';

// Operations
export {
  createProject,
  updateProject,
  deleteProject,
  getProjectWithDetails,
  createBudgetLine,
  updateBudgetLine,
  deleteBudgetLine,
  updateCashflow,
  upsertCashflow,
  createWorkflowAction,
  submitProject,
  returnProject,
  approveProjectByAgency,
  approveProjectByDNPM,
  lockProject,
  createAttachment,
  deleteAttachment,
  createFinancialYear,
  updateFinancialYear,
  createAgency,
  updateAgency,
  createUser,
  updateUser,
  createAuditLog,
  getAuditLogs
} from './operations';
