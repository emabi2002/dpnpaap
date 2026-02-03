// @ts-nocheck
// Note: Type checking disabled because Supabase tables may not exist yet.
// The app falls back to mock data when tables are not found.
import { getSupabaseClient } from './client';
import type { Tables, Insertable, Updatable, WorkplanStatus, ActivityStatus } from './database.types';

// Type aliases for convenience
export type WorkplanRow = Tables<'workplans'>;
export type WorkplanActivityRow = Tables<'workplan_activities'>;
export type WorkplanWorkflowActionRow = Tables<'workplan_workflow_actions'>;

// Workplan with related data
export interface WorkplanWithDetails extends WorkplanRow {
  agency?: Tables<'agencies'>;
  financial_year?: Tables<'financial_years'>;
  activities?: WorkplanActivityRow[];
  workflow_actions?: WorkplanWorkflowActionRow[];
}

// =============================================
// WORKPLAN OPERATIONS
// =============================================

/**
 * Get all workplans with optional filtering
 */
export async function getWorkplans(options?: {
  financialYearId?: string;
  agencyId?: string;
  status?: WorkplanStatus;
  includeAgency?: boolean;
  includeFinancialYear?: boolean;
}) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('workplans')
    .select(`
      *
      ${options?.includeAgency ? ', agency:agencies(*)' : ''}
      ${options?.includeFinancialYear ? ', financial_year:financial_years(*)' : ''}
    `)
    .order('created_at', { ascending: false });

  if (options?.financialYearId) {
    query = query.eq('financial_year_id', options.financialYearId);
  }

  if (options?.agencyId) {
    query = query.eq('agency_id', options.agencyId);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workplans:', error);
    throw error;
  }

  return data;
}

/**
 * Get a single workplan by ID with full details
 */
export async function getWorkplanById(id: string): Promise<WorkplanWithDetails | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplans')
    .select(`
      *,
      agency:agencies(*),
      financial_year:financial_years(*),
      activities:workplan_activities(*),
      workflow_actions:workplan_workflow_actions(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching workplan:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new workplan
 */
export async function createWorkplan(workplan: Insertable<'workplans'>) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplans')
    .insert(workplan as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating workplan:', error);
    throw error;
  }

  return data;
}

/**
 * Update a workplan
 */
export async function updateWorkplan(id: string, updates: Updatable<'workplans'>) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplans')
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating workplan:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a workplan (cascades to activities and workflow actions)
 */
export async function deleteWorkplan(id: string) {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('workplans')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting workplan:', error);
    throw error;
  }

  return true;
}

/**
 * Update workplan status with workflow action
 */
export async function updateWorkplanStatus(
  workplanId: string,
  newStatus: WorkplanStatus,
  userId: string,
  comments?: string
) {
  const supabase = getSupabaseClient();

  // Get current workplan status
  const { data: workplan, error: fetchError } = await supabase
    .from('workplans')
    .select('status')
    .eq('id', workplanId)
    .single();

  if (fetchError) throw fetchError;

  const oldStatus = workplan.status;

  // Determine action type based on status change
  let actionType = 'status_change';
  if (newStatus === 'submitted') actionType = 'submit';
  else if (newStatus === 'approved') actionType = 'approve';
  else if (newStatus === 'draft' && oldStatus === 'submitted') actionType = 'return';
  else if (newStatus === 'in_progress') actionType = 'start';
  else if (newStatus === 'completed') actionType = 'complete';

  // Update workplan status
  const updateData: Updatable<'workplans'> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'submitted') {
    updateData.submitted_by = userId;
    updateData.submitted_at = new Date().toISOString();
  } else if (newStatus === 'approved') {
    updateData.approved_by = userId;
    updateData.approved_at = new Date().toISOString();
  }

  const { data: updatedWorkplan, error: updateError } = await supabase
    .from('workplans')
    .update(updateData as any)
    .eq('id', workplanId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Create workflow action record
  const { error: actionError } = await supabase
    .from('workplan_workflow_actions')
    .insert({
      workplan_id: workplanId,
      action_type: actionType,
      from_status: oldStatus,
      to_status: newStatus,
      action_by: userId,
      comments,
    } as any);

  if (actionError) {
    console.error('Error creating workflow action:', actionError);
    // Don't throw - the main update succeeded
  }

  return updatedWorkplan;
}

// =============================================
// ACTIVITY OPERATIONS
// =============================================

/**
 * Get activities for a workplan
 */
export async function getActivitiesByWorkplanId(workplanId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplan_activities')
    .select('*')
    .eq('workplan_id', workplanId)
    .order('activity_code');

  if (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }

  return data;
}

/**
 * Get a single activity by ID
 */
export async function getActivityById(id: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplan_activities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching activity:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new activity
 */
export async function createActivity(activity: Insertable<'workplan_activities'>) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplan_activities')
    .insert(activity as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    throw error;
  }

  // Update workplan total budget
  await recalculateWorkplanBudget(activity.workplan_id);

  return data;
}

/**
 * Update an activity
 */
export async function updateActivity(id: string, updates: Updatable<'workplan_activities'>) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplan_activities')
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating activity:', error);
    throw error;
  }

  // Update workplan total budget
  if (data.workplan_id) {
    await recalculateWorkplanBudget(data.workplan_id);
  }

  return data;
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: string) {
  const supabase = getSupabaseClient();

  // Get workplan ID first for budget recalculation
  const { data: activity } = await supabase
    .from('workplan_activities')
    .select('workplan_id')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('workplan_activities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }

  // Update workplan total budget
  if (activity?.workplan_id) {
    await recalculateWorkplanBudget(activity.workplan_id);
  }

  return true;
}

/**
 * Bulk create activities
 */
export async function bulkCreateActivities(activities: Insertable<'workplan_activities'>[]) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplan_activities')
    .insert(activities as any)
    .select();

  if (error) {
    console.error('Error bulk creating activities:', error);
    throw error;
  }

  // Update workplan total budgets
  const workplanIds = [...new Set(activities.map(a => a.workplan_id))];
  for (const workplanId of workplanIds) {
    await recalculateWorkplanBudget(workplanId);
  }

  return data;
}

/**
 * Recalculate workplan total budget from activities
 */
async function recalculateWorkplanBudget(workplanId: string) {
  const supabase = getSupabaseClient();

  const { data: activities, error: fetchError } = await supabase
    .from('workplan_activities')
    .select('total_budget')
    .eq('workplan_id', workplanId);

  if (fetchError) {
    console.error('Error fetching activities for budget calc:', fetchError);
    return;
  }

  const totalBudget = activities?.reduce((sum, a) => sum + (a.total_budget || 0), 0) || 0;

  const { error: updateError } = await supabase
    .from('workplans')
    .update({ total_budget: totalBudget, updated_at: new Date().toISOString() } as any)
    .eq('id', workplanId);

  if (updateError) {
    console.error('Error updating workplan budget:', updateError);
  }
}

// =============================================
// WORKFLOW ACTIONS
// =============================================

/**
 * Get workflow history for a workplan
 */
export async function getWorkflowHistory(workplanId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplan_workflow_actions')
    .select(`
      *,
      user:users(id, name, email)
    `)
    .eq('workplan_id', workplanId)
    .order('action_date', { ascending: false });

  if (error) {
    console.error('Error fetching workflow history:', error);
    throw error;
  }

  return data;
}

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================

/**
 * Subscribe to workplan changes
 */
export function subscribeToWorkplans(
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: WorkplanRow | null;
    old: WorkplanRow | null;
  }) => void
) {
  const supabase = getSupabaseClient();

  const channel = supabase
    .channel('workplans_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'workplans' },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as WorkplanRow | null,
          old: payload.old as WorkplanRow | null,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to activity changes for a workplan
 */
export function subscribeToActivities(
  workplanId: string,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: WorkplanActivityRow | null;
    old: WorkplanActivityRow | null;
  }) => void
) {
  const supabase = getSupabaseClient();

  const channel = supabase
    .channel(`activities_${workplanId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workplan_activities',
        filter: `workplan_id=eq.${workplanId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as WorkplanActivityRow | null,
          old: payload.old as WorkplanActivityRow | null,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Check if workplan exists for agency and financial year
 */
export async function workplanExists(agencyId: string, financialYearId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workplans')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('financial_year_id', financialYearId)
    .maybeSingle();

  if (error) {
    console.error('Error checking workplan existence:', error);
    throw error;
  }

  return data !== null;
}

/**
 * Get workplan statistics for dashboard
 */
export async function getWorkplanStats(financialYearId?: string) {
  const supabase = getSupabaseClient();

  let query = supabase.from('workplans').select('status, total_budget');

  if (financialYearId) {
    query = query.eq('financial_year_id', financialYearId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workplan stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    in_progress: 0,
    completed: 0,
    delayed: 0,
    totalBudget: 0,
  };

  data?.forEach((wp) => {
    stats[wp.status as keyof typeof stats]++;
    stats.totalBudget += wp.total_budget || 0;
  });

  return stats;
}
