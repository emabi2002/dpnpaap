'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from './client';
import type { Tables } from './database.types';

// Generic hook for fetching data
export function useSupabaseQuery<T>(
  tableName: string,
  options?: {
    filter?: { column: string; value: string | number | boolean };
    orderBy?: { column: string; ascending?: boolean };
    enabled?: boolean;
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) return;

    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      let query = supabase.from(tableName).select('*');

      if (options?.filter) {
        query = query.eq(options.filter.column, options.filter.value);
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true
        });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;
      setData(result as T[]);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, options?.filter?.column, options?.filter?.value, options?.orderBy?.column, options?.orderBy?.ascending, options?.enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook for agencies
export function useAgencies() {
  return useSupabaseQuery<Tables<'agencies'>>('agencies', {
    orderBy: { column: 'agency_name', ascending: true }
  });
}

// Hook for active agencies
export function useActiveAgencies() {
  return useSupabaseQuery<Tables<'agencies'>>('agencies', {
    filter: { column: 'status', value: 'active' },
    orderBy: { column: 'agency_name', ascending: true }
  });
}

// Hook for financial years
export function useFinancialYears() {
  return useSupabaseQuery<Tables<'financial_years'>>('financial_years', {
    orderBy: { column: 'year', ascending: false }
  });
}

// Hook for open financial years
export function useOpenFinancialYears() {
  return useSupabaseQuery<Tables<'financial_years'>>('financial_years', {
    filter: { column: 'status', value: 'open' },
    orderBy: { column: 'year', ascending: false }
  });
}

// Hook for donor codes
export function useDonorCodes() {
  return useSupabaseQuery<Tables<'donor_codes'>>('donor_codes', {
    orderBy: { column: 'code', ascending: true }
  });
}

// Hook for users
export function useUsers() {
  return useSupabaseQuery<Tables<'users'>>('users', {
    orderBy: { column: 'name', ascending: true }
  });
}

// Hook for projects
export function useProjects(agencyId?: string, financialYearId?: string) {
  const [data, setData] = useState<Tables<'projects'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      let query = supabase.from('projects').select('*');

      if (agencyId) {
        query = query.eq('agency_id', agencyId);
      }

      if (financialYearId) {
        query = query.eq('financial_year_id', financialYearId);
      }

      query = query.order('updated_at', { ascending: false });

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;
      setData(result as Tables<'projects'>[]);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId, financialYearId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook for single project with details
export function useProject(projectId: string) {
  const [data, setData] = useState<Tables<'projects'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      const { data: result, error: queryError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (queryError) throw queryError;
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook for budget lines
export function useBudgetLines(projectId: string) {
  return useSupabaseQuery<Tables<'budget_lines'>>('budget_lines', {
    filter: { column: 'project_id', value: projectId },
    orderBy: { column: 'item_no', ascending: true },
    enabled: !!projectId
  });
}

// Hook for cashflow monthly
export function useCashflowMonthly(budgetLineIds: string[]) {
  const [data, setData] = useState<Tables<'cashflow_monthly'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (budgetLineIds.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      const { data: result, error: queryError } = await supabase
        .from('cashflow_monthly')
        .select('*')
        .in('budget_line_id', budgetLineIds);

      if (queryError) throw queryError;
      setData(result as Tables<'cashflow_monthly'>[]);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [budgetLineIds.join(',')]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook for workflow actions
export function useWorkflowActions(projectId: string) {
  return useSupabaseQuery<Tables<'workflow_actions'>>('workflow_actions', {
    filter: { column: 'project_id', value: projectId },
    orderBy: { column: 'action_date', ascending: false },
    enabled: !!projectId
  });
}

// Hook for attachments
export function useAttachments(projectId: string) {
  return useSupabaseQuery<Tables<'attachments'>>('attachments', {
    filter: { column: 'project_id', value: projectId },
    orderBy: { column: 'uploaded_at', ascending: false },
    enabled: !!projectId
  });
}
