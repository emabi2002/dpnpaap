// @ts-nocheck
// Note: Type checking disabled because Supabase tables may not exist yet.
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getWorkplans,
  getWorkplanById,
  getActivitiesByWorkplanId,
  getWorkflowHistory,
  createWorkplan,
  updateWorkplan,
  updateWorkplanStatus,
  createActivity,
  updateActivity,
  deleteActivity,
  bulkCreateActivities,
  subscribeToWorkplans,
  subscribeToActivities,
  type WorkplanRow,
  type WorkplanActivityRow,
  type WorkplanWithDetails,
} from './workplan-service';
import type { Insertable, Updatable, WorkplanStatus } from './database.types';

// =============================================
// useWorkplans - List workplans with real-time
// =============================================

interface UseWorkplansOptions {
  financialYearId?: string;
  agencyId?: string;
  status?: WorkplanStatus;
  realtime?: boolean;
}

export function useWorkplans(options: UseWorkplansOptions = {}) {
  const [workplans, setWorkplans] = useState<WorkplanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkplans = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getWorkplans({
        financialYearId: options.financialYearId,
        agencyId: options.agencyId,
        status: options.status,
        includeAgency: true,
        includeFinancialYear: true,
      });
      setWorkplans(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options.financialYearId, options.agencyId, options.status]);

  useEffect(() => {
    fetchWorkplans();
  }, [fetchWorkplans]);

  // Real-time subscription
  useEffect(() => {
    if (!options.realtime) return;

    const unsubscribe = subscribeToWorkplans((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setWorkplans((prev) => [payload.new!, ...prev]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setWorkplans((prev) =>
          prev.map((wp) => (wp.id === payload.new!.id ? payload.new! : wp))
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setWorkplans((prev) => prev.filter((wp) => wp.id !== payload.old!.id));
      }
    });

    return () => unsubscribe();
  }, [options.realtime]);

  return {
    workplans,
    isLoading,
    error,
    refetch: fetchWorkplans,
  };
}

// =============================================
// useWorkplan - Single workplan with details
// =============================================

interface UseWorkplanOptions {
  realtime?: boolean;
}

export function useWorkplan(workplanId: string | null, options: UseWorkplanOptions = {}) {
  const [workplan, setWorkplan] = useState<WorkplanWithDetails | null>(null);
  const [activities, setActivities] = useState<WorkplanActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkplan = useCallback(async () => {
    if (!workplanId) {
      setWorkplan(null);
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getWorkplanById(workplanId);
      setWorkplan(data);
      setActivities(data?.activities || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [workplanId]);

  useEffect(() => {
    fetchWorkplan();
  }, [fetchWorkplan]);

  // Real-time subscription for activities
  useEffect(() => {
    if (!options.realtime || !workplanId) return;

    const unsubscribe = subscribeToActivities(workplanId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setActivities((prev) => [...prev, payload.new!]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setActivities((prev) =>
          prev.map((act) => (act.id === payload.new!.id ? payload.new! : act))
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setActivities((prev) => prev.filter((act) => act.id !== payload.old!.id));
      }
    });

    return () => unsubscribe();
  }, [options.realtime, workplanId]);

  // Action handlers
  const updateStatus = useCallback(
    async (newStatus: WorkplanStatus, userId: string, comments?: string) => {
      if (!workplanId) return;
      const updated = await updateWorkplanStatus(workplanId, newStatus, userId, comments);
      setWorkplan((prev) => (prev && updated ? { ...prev, ...updated } : null));
      return updated;
    },
    [workplanId]
  );

  const addActivity = useCallback(
    async (activity: Omit<Insertable<'workplan_activities'>, 'workplan_id'>) => {
      if (!workplanId) return;
      const newActivity = await createActivity({
        ...activity,
        workplan_id: workplanId,
      });
      setActivities((prev) => [...prev, newActivity]);
      return newActivity;
    },
    [workplanId]
  );

  const editActivity = useCallback(
    async (activityId: string, updates: Updatable<'workplan_activities'>) => {
      const updated = await updateActivity(activityId, updates);
      setActivities((prev) =>
        prev.map((act) => (act.id === activityId ? updated : act))
      );
      return updated;
    },
    []
  );

  const removeActivity = useCallback(async (activityId: string) => {
    await deleteActivity(activityId);
    setActivities((prev) => prev.filter((act) => act.id !== activityId));
  }, []);

  const importActivities = useCallback(
    async (activitiesToImport: Omit<Insertable<'workplan_activities'>, 'workplan_id'>[]) => {
      if (!workplanId) return;
      const withWorkplanId = activitiesToImport.map((a) => ({
        ...a,
        workplan_id: workplanId,
      }));
      const imported = await bulkCreateActivities(withWorkplanId);
      setActivities((prev) => [...prev, ...(imported || [])]);
      return imported;
    },
    [workplanId]
  );

  return {
    workplan,
    activities,
    isLoading,
    error,
    refetch: fetchWorkplan,
    updateStatus,
    addActivity,
    editActivity,
    removeActivity,
    importActivities,
  };
}

// =============================================
// useWorkflowHistory
// =============================================

export function useWorkflowHistory(workplanId: string | null) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!workplanId) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getWorkflowHistory(workplanId);
      setHistory(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [workplanId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

// =============================================
// useCreateWorkplan
// =============================================

export function useCreateWorkplan() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (workplan: Insertable<'workplans'>) => {
    try {
      setIsCreating(true);
      setError(null);
      const created = await createWorkplan(workplan);
      return created;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    create,
    isCreating,
    error,
  };
}

// =============================================
// useUpdateWorkplan
// =============================================

export function useUpdateWorkplan() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(async (id: string, updates: Updatable<'workplans'>) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updated = await updateWorkplan(id, updates);
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    update,
    isUpdating,
    error,
  };
}
