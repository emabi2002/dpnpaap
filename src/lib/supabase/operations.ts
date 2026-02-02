'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database, Insertable, Updatable, Tables } from './database.types';

// Create a typed Supabase client
function getTypedClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Project = Tables<'projects'>;
type BudgetLine = Tables<'budget_lines'>;
type CashflowMonthly = Tables<'cashflow_monthly'>;
type WorkflowAction = Tables<'workflow_actions'>;
type Attachment = Tables<'attachments'>;
type User = Tables<'users'>;
type Agency = Tables<'agencies'>;
type FinancialYear = Tables<'financial_years'>;
type DonorCode = Tables<'donor_codes'>;
type AuditLog = Tables<'audit_logs'>;

// =====================================================
// PROJECT OPERATIONS
// =====================================================
export async function createProject(project: Insertable<'projects'>): Promise<Project> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('projects')
    .insert(project as never)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, updates: Updatable<'projects'>): Promise<Project> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('projects')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = getTypedClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getProjectWithDetails(id: string) {
  const supabase = getTypedClient();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError) throw projectError;
  const p = project as Project;

  // Get agency
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', p.agency_id)
    .single();

  // Get financial year
  const { data: financialYear } = await supabase
    .from('financial_years')
    .select('*')
    .eq('id', p.financial_year_id)
    .single();

  // Get created by user
  const { data: createdByUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', p.created_by)
    .single();

  // Get budget lines
  const { data: budgetLinesData, error: blError } = await supabase
    .from('budget_lines')
    .select('*')
    .eq('project_id', id)
    .order('item_no');

  if (blError) throw blError;
  const budgetLines = (budgetLinesData || []) as BudgetLine[];

  // Get donor codes
  const { data: donorCodesData } = await supabase
    .from('donor_codes')
    .select('*');
  const donorCodes = (donorCodesData || []) as DonorCode[];

  // Get cashflows for budget lines
  const budgetLineIds = budgetLines.map(bl => bl.id);
  let cashflows: CashflowMonthly[] = [];

  if (budgetLineIds.length > 0) {
    const { data: cfData, error: cfError } = await supabase
      .from('cashflow_monthly')
      .select('*')
      .in('budget_line_id', budgetLineIds);

    if (cfError) throw cfError;
    cashflows = (cfData || []) as CashflowMonthly[];
  }

  // Get workflow actions
  const { data: waData, error: waError } = await supabase
    .from('workflow_actions')
    .select('*')
    .eq('project_id', id)
    .order('action_date', { ascending: false });

  if (waError) throw waError;
  const workflowActions = (waData || []) as WorkflowAction[];

  // Get action users
  const actionUserIds = [...new Set(workflowActions.map(wa => wa.action_by_user))];
  let actionUsers: User[] = [];
  if (actionUserIds.length > 0) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .in('id', actionUserIds);
    actionUsers = (userData || []) as User[];
  }

  // Get attachments
  const { data: attData, error: attError } = await supabase
    .from('attachments')
    .select('*')
    .eq('project_id', id)
    .order('uploaded_at', { ascending: false });

  if (attError) throw attError;
  const attachments = (attData || []) as Attachment[];

  return {
    ...p,
    agency: agency as Agency | null,
    financial_year: financialYear as FinancialYear | null,
    created_by_user: createdByUser as User | null,
    budgetLines: budgetLines.map(bl => ({
      ...bl,
      donor_code: donorCodes.find(dc => dc.id === bl.donor_code_id),
      cashflow: cashflows.find(cf => cf.budget_line_id === bl.id) || null
    })),
    workflowActions: workflowActions.map(wa => ({
      ...wa,
      user: actionUsers.find(u => u.id === wa.action_by_user)
    })),
    attachments
  };
}

// =====================================================
// BUDGET LINE OPERATIONS
// =====================================================
export async function createBudgetLine(budgetLine: Insertable<'budget_lines'>): Promise<BudgetLine> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('budget_lines')
    .insert(budgetLine as never)
    .select()
    .single();

  if (error) throw error;
  const bl = data as BudgetLine;

  // Create empty cashflow record
  await supabase
    .from('cashflow_monthly')
    .insert({
      budget_line_id: bl.id,
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
    } as never);

  return bl;
}

export async function updateBudgetLine(id: string, updates: Updatable<'budget_lines'>): Promise<BudgetLine> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('budget_lines')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BudgetLine;
}

export async function deleteBudgetLine(id: string): Promise<void> {
  const supabase = getTypedClient();
  const { error } = await supabase
    .from('budget_lines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// CASHFLOW OPERATIONS
// =====================================================
export async function updateCashflow(budgetLineId: string, updates: Updatable<'cashflow_monthly'>): Promise<CashflowMonthly> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('cashflow_monthly')
    .update(updates as never)
    .eq('budget_line_id', budgetLineId)
    .select()
    .single();

  if (error) throw error;
  return data as CashflowMonthly;
}

export async function upsertCashflow(cashflow: Insertable<'cashflow_monthly'>): Promise<CashflowMonthly> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('cashflow_monthly')
    .upsert(cashflow as never, { onConflict: 'budget_line_id' })
    .select()
    .single();

  if (error) throw error;
  return data as CashflowMonthly;
}

// =====================================================
// WORKFLOW OPERATIONS
// =====================================================
export async function createWorkflowAction(action: Insertable<'workflow_actions'>): Promise<WorkflowAction> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('workflow_actions')
    .insert(action as never)
    .select()
    .single();

  if (error) throw error;
  return data as WorkflowAction;
}

export async function submitProject(projectId: string, userId: string, comments?: string) {
  await createWorkflowAction({
    project_id: projectId,
    action_type: 'submit',
    action_by_user: userId,
    comments
  });
  return updateProject(projectId, { status: 'submitted' });
}

export async function returnProject(projectId: string, userId: string, comments?: string) {
  await createWorkflowAction({
    project_id: projectId,
    action_type: 'return',
    action_by_user: userId,
    comments
  });
  return updateProject(projectId, { status: 'returned' });
}

export async function approveProjectByAgency(projectId: string, userId: string, comments?: string) {
  await createWorkflowAction({
    project_id: projectId,
    action_type: 'approve_agency',
    action_by_user: userId,
    comments
  });
  return updateProject(projectId, { status: 'approved_by_agency' });
}

export async function approveProjectByDNPM(projectId: string, userId: string, comments?: string) {
  await createWorkflowAction({
    project_id: projectId,
    action_type: 'approve_dnpm',
    action_by_user: userId,
    comments
  });
  return updateProject(projectId, { status: 'approved_by_dnpm' });
}

export async function lockProject(projectId: string, userId: string, comments?: string) {
  await createWorkflowAction({
    project_id: projectId,
    action_type: 'lock',
    action_by_user: userId,
    comments
  });
  return updateProject(projectId, { status: 'locked' });
}

// =====================================================
// ATTACHMENT OPERATIONS
// =====================================================
export async function createAttachment(attachment: Insertable<'attachments'>): Promise<Attachment> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('attachments')
    .insert(attachment as never)
    .select()
    .single();

  if (error) throw error;
  return data as Attachment;
}

export async function deleteAttachment(id: string): Promise<void> {
  const supabase = getTypedClient();
  const { error } = await supabase
    .from('attachments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// ADMIN OPERATIONS
// =====================================================
export async function createFinancialYear(fy: Insertable<'financial_years'>): Promise<FinancialYear> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('financial_years')
    .insert(fy as never)
    .select()
    .single();

  if (error) throw error;
  return data as FinancialYear;
}

export async function updateFinancialYear(id: string, updates: Updatable<'financial_years'>): Promise<FinancialYear> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('financial_years')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FinancialYear;
}

export async function createAgency(agency: Insertable<'agencies'>): Promise<Agency> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('agencies')
    .insert(agency as never)
    .select()
    .single();

  if (error) throw error;
  return data as Agency;
}

export async function updateAgency(id: string, updates: Updatable<'agencies'>): Promise<Agency> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('agencies')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Agency;
}

export async function createUser(user: Insertable<'users'>): Promise<User> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('users')
    .insert(user as never)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function updateUser(id: string, updates: Updatable<'users'>): Promise<User> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('users')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

// =====================================================
// AUDIT LOG OPERATIONS
// =====================================================
export async function createAuditLog(log: Insertable<'audit_logs'>): Promise<AuditLog> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .insert(log as never)
    .select()
    .single();

  if (error) throw error;
  return data as AuditLog;
}

export async function getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
  const supabase = getTypedClient();
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  if (entityId) {
    query = query.eq('entity_id', entityId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as AuditLog[];
}
