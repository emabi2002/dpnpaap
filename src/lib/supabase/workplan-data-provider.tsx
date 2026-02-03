'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from './client';
import * as workplanService from './workplan-service';
import * as mockDb from '../database';
import type { Workplan, WorkplanActivity, WorkplanStatus, ActivityStatus } from '../types';
import type { Insertable, Updatable } from './database.types';

// Connection status
export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

interface WorkplanDataContextType {
  // Connection status
  connectionStatus: ConnectionStatus;
  isUsingSupabase: boolean;
  lastSyncTime: Date | null;

  // Workplan operations
  getWorkplans: (financialYearId?: string, agencyId?: string) => Promise<Workplan[]>;
  getWorkplanById: (id: string) => Promise<Workplan | null>;
  createWorkplan: (data: Partial<Workplan>) => Promise<Workplan>;
  updateWorkplan: (id: string, data: Partial<Workplan>) => Promise<Workplan>;
  deleteWorkplan: (id: string) => Promise<boolean>;
  updateWorkplanStatus: (id: string, status: WorkplanStatus, userId: string, comments?: string) => Promise<Workplan>;

  // Activity operations
  getActivities: (workplanId: string) => Promise<WorkplanActivity[]>;
  createActivity: (data: Partial<WorkplanActivity>) => Promise<WorkplanActivity>;
  updateActivity: (id: string, data: Partial<WorkplanActivity>) => Promise<WorkplanActivity>;
  deleteActivity: (id: string) => Promise<boolean>;
  bulkImportActivities: (activities: Partial<WorkplanActivity>[]) => Promise<WorkplanActivity[]>;

  // Refresh
  refreshConnection: () => Promise<void>;
}

const WorkplanDataContext = createContext<WorkplanDataContextType | null>(null);

// Convert Supabase row to app type
function supabaseToWorkplan(row: workplanService.WorkplanRow): Workplan {
  return {
    id: row.id,
    financialYearId: row.financial_year_id,
    agencyId: row.agency_id,
    title: row.title,
    description: row.description || undefined,
    totalBudget: Number(row.total_budget),
    status: row.status as WorkplanStatus,
    submittedBy: row.submitted_by || undefined,
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function supabaseToActivity(row: workplanService.WorkplanActivityRow): WorkplanActivity {
  return {
    id: row.id,
    workplanId: row.workplan_id,
    projectId: row.project_id || undefined,
    activityCode: row.activity_code,
    activityName: row.activity_name,
    description: row.description || undefined,
    responsibleUnit: row.responsible_unit,
    responsibleOfficer: row.responsible_officer || undefined,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    q1Target: Number(row.q1_target),
    q2Target: Number(row.q2_target),
    q3Target: Number(row.q3_target),
    q4Target: Number(row.q4_target),
    q1Actual: Number(row.q1_actual),
    q2Actual: Number(row.q2_actual),
    q3Actual: Number(row.q3_actual),
    q4Actual: Number(row.q4_actual),
    q1Budget: Number(row.q1_budget),
    q2Budget: Number(row.q2_budget),
    q3Budget: Number(row.q3_budget),
    q4Budget: Number(row.q4_budget),
    totalBudget: Number(row.total_budget),
    keyPerformanceIndicator: row.key_performance_indicator,
    expectedOutput: row.expected_output,
    status: row.status as ActivityStatus,
    progressPercent: row.progress_percent,
    remarks: row.remarks || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Convert app type to Supabase insertable
function workplanToSupabase(data: Partial<Workplan>): Insertable<'workplans'> {
  return {
    financial_year_id: data.financialYearId!,
    agency_id: data.agencyId!,
    title: data.title!,
    description: data.description,
    total_budget: data.totalBudget || 0,
    status: data.status || 'draft',
    created_by: data.createdBy!,
  };
}

function activityToSupabase(data: Partial<WorkplanActivity>): Insertable<'workplan_activities'> {
  return {
    workplan_id: data.workplanId!,
    project_id: data.projectId,
    activity_code: data.activityCode!,
    activity_name: data.activityName!,
    description: data.description,
    responsible_unit: data.responsibleUnit!,
    responsible_officer: data.responsibleOfficer,
    start_date: (data.startDate instanceof Date ? data.startDate.toISOString().split('T')[0] : String(data.startDate))!,
    end_date: (data.endDate instanceof Date ? data.endDate.toISOString().split('T')[0] : String(data.endDate))!,
    q1_target: data.q1Target || 0,
    q2_target: data.q2Target || 0,
    q3_target: data.q3Target || 0,
    q4_target: data.q4Target || 0,
    q1_actual: data.q1Actual || 0,
    q2_actual: data.q2Actual || 0,
    q3_actual: data.q3Actual || 0,
    q4_actual: data.q4Actual || 0,
    q1_budget: data.q1Budget || 0,
    q2_budget: data.q2Budget || 0,
    q3_budget: data.q3Budget || 0,
    q4_budget: data.q4Budget || 0,
    key_performance_indicator: data.keyPerformanceIndicator!,
    expected_output: data.expectedOutput!,
    status: data.status || 'not_started',
    progress_percent: data.progressPercent || 0,
    remarks: data.remarks,
  };
}

interface WorkplanDataProviderProps {
  children: ReactNode;
}

export function WorkplanDataProvider({ children }: WorkplanDataProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Check Supabase connection
  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('workplans').select('id').limit(1);

      if (error) {
        // Table might not exist yet - check if it's a table not found error
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Workplans table not found, using mock data');
          setConnectionStatus('disconnected');
          setIsUsingSupabase(false);
        } else {
          console.error('Supabase error:', error);
          setConnectionStatus('error');
          setIsUsingSupabase(false);
        }
      } else {
        setConnectionStatus('connected');
        setIsUsingSupabase(true);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.error('Connection check failed:', err);
      setConnectionStatus('error');
      setIsUsingSupabase(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Workplan operations
  const getWorkplans = useCallback(async (financialYearId?: string, agencyId?: string): Promise<Workplan[]> => {
    if (isUsingSupabase) {
      try {
        const data = await workplanService.getWorkplans({ financialYearId, agencyId });
        return (data || []).map(supabaseToWorkplan);
      } catch (err) {
        console.error('Supabase getWorkplans failed, falling back to mock:', err);
      }
    }

    // Fallback to mock data
    let workplans = [...mockDb.workplans];
    if (financialYearId) {
      workplans = workplans.filter(wp => wp.financialYearId === financialYearId);
    }
    if (agencyId) {
      workplans = workplans.filter(wp => wp.agencyId === agencyId);
    }
    return workplans;
  }, [isUsingSupabase]);

  const getWorkplanById = useCallback(async (id: string): Promise<Workplan | null> => {
    if (isUsingSupabase) {
      try {
        const data = await workplanService.getWorkplanById(id);
        return data ? supabaseToWorkplan(data) : null;
      } catch (err) {
        console.error('Supabase getWorkplanById failed, falling back to mock:', err);
      }
    }
    return mockDb.getWorkplanById(id) || null;
  }, [isUsingSupabase]);

  const createWorkplan = useCallback(async (data: Partial<Workplan>): Promise<Workplan> => {
    if (isUsingSupabase) {
      try {
        const result = await workplanService.createWorkplan(workplanToSupabase(data));
        return supabaseToWorkplan(result);
      } catch (err) {
        console.error('Supabase createWorkplan failed, falling back to mock:', err);
      }
    }

    // Mock data creation
    const newWorkplan: Workplan = {
      id: `wp_${Date.now()}`,
      financialYearId: data.financialYearId!,
      agencyId: data.agencyId!,
      title: data.title!,
      description: data.description,
      totalBudget: data.totalBudget || 0,
      status: data.status || 'draft',
      createdBy: data.createdBy!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.workplans.push(newWorkplan);
    return newWorkplan;
  }, [isUsingSupabase]);

  const updateWorkplan = useCallback(async (id: string, data: Partial<Workplan>): Promise<Workplan> => {
    if (isUsingSupabase) {
      try {
        const updateData: Updatable<'workplans'> = {};
        if (data.title) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.totalBudget !== undefined) updateData.total_budget = data.totalBudget;
        if (data.status) updateData.status = data.status;

        const result = await workplanService.updateWorkplan(id, updateData);
        return supabaseToWorkplan(result);
      } catch (err) {
        console.error('Supabase updateWorkplan failed, falling back to mock:', err);
      }
    }

    // Mock data update
    const index = mockDb.workplans.findIndex(wp => wp.id === id);
    if (index !== -1) {
      mockDb.workplans[index] = { ...mockDb.workplans[index], ...data, updatedAt: new Date() };
      return mockDb.workplans[index];
    }
    throw new Error('Workplan not found');
  }, [isUsingSupabase]);

  const deleteWorkplan = useCallback(async (id: string): Promise<boolean> => {
    if (isUsingSupabase) {
      try {
        return await workplanService.deleteWorkplan(id);
      } catch (err) {
        console.error('Supabase deleteWorkplan failed:', err);
      }
    }

    const index = mockDb.workplans.findIndex(wp => wp.id === id);
    if (index !== -1) {
      mockDb.workplans.splice(index, 1);
      return true;
    }
    return false;
  }, [isUsingSupabase]);

  const updateWorkplanStatus = useCallback(async (
    id: string,
    status: WorkplanStatus,
    userId: string,
    comments?: string
  ): Promise<Workplan> => {
    if (isUsingSupabase) {
      try {
        const result = await workplanService.updateWorkplanStatus(id, status, userId, comments);
        return supabaseToWorkplan(result);
      } catch (err) {
        console.error('Supabase updateWorkplanStatus failed, falling back to mock:', err);
      }
    }

    const index = mockDb.workplans.findIndex(wp => wp.id === id);
    if (index !== -1) {
      mockDb.workplans[index] = {
        ...mockDb.workplans[index],
        status,
        updatedAt: new Date(),
        ...(status === 'submitted' && { submittedBy: userId, submittedAt: new Date() }),
        ...(status === 'approved' && { approvedBy: userId, approvedAt: new Date() }),
      };
      return mockDb.workplans[index];
    }
    throw new Error('Workplan not found');
  }, [isUsingSupabase]);

  // Activity operations
  const getActivities = useCallback(async (workplanId: string): Promise<WorkplanActivity[]> => {
    if (isUsingSupabase) {
      try {
        const data = await workplanService.getActivitiesByWorkplanId(workplanId);
        return (data || []).map(supabaseToActivity);
      } catch (err) {
        console.error('Supabase getActivities failed, falling back to mock:', err);
      }
    }
    return mockDb.getActivitiesByWorkplanId(workplanId);
  }, [isUsingSupabase]);

  const createActivity = useCallback(async (data: Partial<WorkplanActivity>): Promise<WorkplanActivity> => {
    if (isUsingSupabase) {
      try {
        const result = await workplanService.createActivity(activityToSupabase(data));
        return supabaseToActivity(result);
      } catch (err) {
        console.error('Supabase createActivity failed, falling back to mock:', err);
      }
    }

    const newActivity: WorkplanActivity = {
      id: `act_${Date.now()}`,
      workplanId: data.workplanId!,
      projectId: data.projectId,
      activityCode: data.activityCode!,
      activityName: data.activityName!,
      description: data.description,
      responsibleUnit: data.responsibleUnit!,
      responsibleOfficer: data.responsibleOfficer,
      startDate: data.startDate || new Date(),
      endDate: data.endDate || new Date(),
      q1Target: data.q1Target || 0,
      q2Target: data.q2Target || 0,
      q3Target: data.q3Target || 0,
      q4Target: data.q4Target || 0,
      q1Actual: data.q1Actual || 0,
      q2Actual: data.q2Actual || 0,
      q3Actual: data.q3Actual || 0,
      q4Actual: data.q4Actual || 0,
      q1Budget: data.q1Budget || 0,
      q2Budget: data.q2Budget || 0,
      q3Budget: data.q3Budget || 0,
      q4Budget: data.q4Budget || 0,
      totalBudget: (data.q1Budget || 0) + (data.q2Budget || 0) + (data.q3Budget || 0) + (data.q4Budget || 0),
      keyPerformanceIndicator: data.keyPerformanceIndicator!,
      expectedOutput: data.expectedOutput!,
      status: data.status || 'not_started',
      progressPercent: data.progressPercent || 0,
      remarks: data.remarks,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.workplanActivities.push(newActivity);
    return newActivity;
  }, [isUsingSupabase]);

  const updateActivity = useCallback(async (id: string, data: Partial<WorkplanActivity>): Promise<WorkplanActivity> => {
    if (isUsingSupabase) {
      try {
        const updateData: Updatable<'workplan_activities'> = {};
        if (data.activityName) updateData.activity_name = data.activityName;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.responsibleUnit) updateData.responsible_unit = data.responsibleUnit;
        if (data.responsibleOfficer !== undefined) updateData.responsible_officer = data.responsibleOfficer;
        if (data.status) updateData.status = data.status;
        if (data.progressPercent !== undefined) updateData.progress_percent = data.progressPercent;
        if (data.q1Target !== undefined) updateData.q1_target = data.q1Target;
        if (data.q2Target !== undefined) updateData.q2_target = data.q2Target;
        if (data.q3Target !== undefined) updateData.q3_target = data.q3Target;
        if (data.q4Target !== undefined) updateData.q4_target = data.q4Target;
        if (data.q1Actual !== undefined) updateData.q1_actual = data.q1Actual;
        if (data.q2Actual !== undefined) updateData.q2_actual = data.q2Actual;
        if (data.q3Actual !== undefined) updateData.q3_actual = data.q3Actual;
        if (data.q4Actual !== undefined) updateData.q4_actual = data.q4Actual;
        if (data.q1Budget !== undefined) updateData.q1_budget = data.q1Budget;
        if (data.q2Budget !== undefined) updateData.q2_budget = data.q2Budget;
        if (data.q3Budget !== undefined) updateData.q3_budget = data.q3Budget;
        if (data.q4Budget !== undefined) updateData.q4_budget = data.q4Budget;

        const result = await workplanService.updateActivity(id, updateData);
        return supabaseToActivity(result);
      } catch (err) {
        console.error('Supabase updateActivity failed, falling back to mock:', err);
      }
    }

    const index = mockDb.workplanActivities.findIndex(a => a.id === id);
    if (index !== -1) {
      mockDb.workplanActivities[index] = { ...mockDb.workplanActivities[index], ...data, updatedAt: new Date() };
      return mockDb.workplanActivities[index];
    }
    throw new Error('Activity not found');
  }, [isUsingSupabase]);

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    if (isUsingSupabase) {
      try {
        return await workplanService.deleteActivity(id);
      } catch (err) {
        console.error('Supabase deleteActivity failed:', err);
      }
    }

    const index = mockDb.workplanActivities.findIndex(a => a.id === id);
    if (index !== -1) {
      mockDb.workplanActivities.splice(index, 1);
      return true;
    }
    return false;
  }, [isUsingSupabase]);

  const bulkImportActivities = useCallback(async (activities: Partial<WorkplanActivity>[]): Promise<WorkplanActivity[]> => {
    if (isUsingSupabase) {
      try {
        const toInsert = activities.map(activityToSupabase);
        const results = await workplanService.bulkCreateActivities(toInsert);
        return (results || []).map(supabaseToActivity);
      } catch (err) {
        console.error('Supabase bulkImportActivities failed, falling back to mock:', err);
      }
    }

    const imported: WorkplanActivity[] = [];
    for (const data of activities) {
      const newActivity = await createActivity(data);
      imported.push(newActivity);
    }
    return imported;
  }, [isUsingSupabase, createActivity]);

  const value: WorkplanDataContextType = {
    connectionStatus,
    isUsingSupabase,
    lastSyncTime,
    getWorkplans,
    getWorkplanById,
    createWorkplan,
    updateWorkplan,
    deleteWorkplan,
    updateWorkplanStatus,
    getActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    bulkImportActivities,
    refreshConnection: checkConnection,
  };

  return (
    <WorkplanDataContext.Provider value={value}>
      {children}
    </WorkplanDataContext.Provider>
  );
}

// Default values for when hook is used outside provider (e.g., during SSG)
const defaultContextValue: WorkplanDataContextType = {
  connectionStatus: 'checking',
  isUsingSupabase: false,
  lastSyncTime: null,
  getWorkplans: async () => [],
  getWorkplanById: async () => null,
  createWorkplan: async () => { throw new Error('Provider not available'); },
  updateWorkplan: async () => { throw new Error('Provider not available'); },
  deleteWorkplan: async () => false,
  updateWorkplanStatus: async () => { throw new Error('Provider not available'); },
  getActivities: async () => [],
  createActivity: async () => { throw new Error('Provider not available'); },
  updateActivity: async () => { throw new Error('Provider not available'); },
  deleteActivity: async () => false,
  bulkImportActivities: async () => [],
  refreshConnection: async () => {},
};

export function useWorkplanData() {
  const context = useContext(WorkplanDataContext);
  // Return default values if used outside provider (e.g., during SSG/SSR)
  if (!context) {
    return defaultContextValue;
  }
  return context;
}
