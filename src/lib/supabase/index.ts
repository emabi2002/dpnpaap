// Supabase clients
export { createClient, getSupabaseClient } from './client';
export { createServerSupabaseClient, createAdminClient } from './server';

// Types
export type { Database, Tables, Insertable, Updatable } from './database.types';
export type { UserRole, ProjectStatus, FinancialYearStatus, AgencyStatus, WorkflowActionType, WorkplanStatus, ActivityStatus } from './database.types';

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

// Workplan Hooks
export {
  useWorkplans,
  useWorkplan,
  useWorkflowHistory,
  useCreateWorkplan,
  useUpdateWorkplan,
} from './use-workplans';

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

// Workplan Operations
export {
  getWorkplans,
  getWorkplanById,
  createWorkplan,
  updateWorkplan,
  deleteWorkplan,
  updateWorkplanStatus,
  getActivitiesByWorkplanId,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  bulkCreateActivities,
  getWorkflowHistory,
  subscribeToWorkplans,
  subscribeToActivities,
  workplanExists,
  getWorkplanStats,
  type WorkplanRow,
  type WorkplanActivityRow,
  type WorkplanWorkflowActionRow,
  type WorkplanWithDetails,
} from './workplan-service';
