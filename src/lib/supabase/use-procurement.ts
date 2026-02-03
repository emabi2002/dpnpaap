'use client';

import { useState, useEffect, useCallback } from 'react';
import * as procurementService from './procurement-service';
import * as mockDb from '../database';
import type {
  ProcurementPlan,
  ProcurementPlanItem,
  ProcurementPlanStatus,
  FundSource,
  ProcurementMethod,
  ContractType,
  UnitOfMeasure,
  Province,
  District,
  UNSPSCCode,
} from '../types';

// Flag to track if Supabase tables are available
let supabaseAvailable: boolean | null = null;

async function checkSupabaseAvailability(): Promise<boolean> {
  if (supabaseAvailable !== null) return supabaseAvailable;

  try {
    const fundSources = await procurementService.getFundSources();
    supabaseAvailable = fundSources.length > 0;
    return supabaseAvailable;
  } catch {
    supabaseAvailable = false;
    return false;
  }
}

// =============================================
// LOOKUP DATA HOOKS
// =============================================

export function useFundSources() {
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const available = await checkSupabaseAvailability();
        if (available) {
          const data = await procurementService.getFundSources();
          setFundSources(data);
        } else {
          setFundSources(mockDb.fundSources.filter(fs => fs.active));
        }
      } catch (err) {
        setError(err as Error);
        setFundSources(mockDb.fundSources.filter(fs => fs.active));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { fundSources, isLoading, error };
}

export function useProcurementMethods() {
  const [methods, setMethods] = useState<ProcurementMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const available = await checkSupabaseAvailability();
        if (available) {
          const data = await procurementService.getProcurementMethods();
          setMethods(data);
        } else {
          setMethods(mockDb.procurementMethods.filter(pm => pm.active));
        }
      } catch (err) {
        setError(err as Error);
        setMethods(mockDb.procurementMethods.filter(pm => pm.active));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { methods, isLoading, error };
}

export function useContractTypes() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const available = await checkSupabaseAvailability();
        if (available) {
          const data = await procurementService.getContractTypes();
          setContractTypes(data);
        } else {
          setContractTypes(mockDb.contractTypes.filter(ct => ct.active));
        }
      } catch (err) {
        setError(err as Error);
        setContractTypes(mockDb.contractTypes.filter(ct => ct.active));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { contractTypes, isLoading, error };
}

export function useUnitsOfMeasure() {
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const available = await checkSupabaseAvailability();
        if (available) {
          const data = await procurementService.getUnitsOfMeasure();
          setUnits(data);
        } else {
          setUnits(mockDb.unitsOfMeasure.filter(uom => uom.active));
        }
      } catch (err) {
        setError(err as Error);
        setUnits(mockDb.unitsOfMeasure.filter(uom => uom.active));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { units, isLoading, error };
}

export function useProvinces() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const available = await checkSupabaseAvailability();
        if (available) {
          const data = await procurementService.getProvinces();
          setProvinces(data);
        } else {
          setProvinces(mockDb.provinces.filter(p => p.active));
        }
      } catch (err) {
        setError(err as Error);
        setProvinces(mockDb.provinces.filter(p => p.active));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { provinces, isLoading, error };
}

export function useDistricts(provinceId: string | undefined) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }

    const currentProvinceId = provinceId;

    async function load() {
      setIsLoading(true);
      try {
        const available = await checkSupabaseAvailability();
        if (available) {
          const data = await procurementService.getDistrictsByProvince(currentProvinceId);
          setDistricts(data);
        } else {
          setDistricts(mockDb.districts.filter(d => d.provinceId === currentProvinceId && d.active));
        }
      } catch (err) {
        setError(err as Error);
        setDistricts(mockDb.districts.filter(d => d.provinceId === currentProvinceId && d.active));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [provinceId]);

  return { districts, isLoading, error };
}

export function useUNSPSCSearch() {
  const [results, setResults] = useState<UNSPSCCode[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const data = await procurementService.searchUNSPSCCodes(query);
        setResults(data);
      } else {
        setResults(mockDb.searchUNSPSCCodes(query));
      }
    } catch {
      setResults(mockDb.searchUNSPSCCodes(query));
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { results, search, isSearching };
}

// =============================================
// PROCUREMENT PLAN HOOKS
// =============================================

export function useProcurementPlans(financialYearId?: string, agencyId?: string) {
  const [plans, setPlans] = useState<ProcurementPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const data = await procurementService.getProcurementPlans(financialYearId, agencyId);
        setPlans(data);
      } else {
        let data = mockDb.procurementPlans;
        if (financialYearId) {
          data = data.filter(p => p.financialYearId === financialYearId);
        }
        if (agencyId) {
          data = data.filter(p => p.agencyId === agencyId);
        }
        setPlans(data);
      }
    } catch (err) {
      setError(err as Error);
      let data = mockDb.procurementPlans;
      if (financialYearId) {
        data = data.filter(p => p.financialYearId === financialYearId);
      }
      if (agencyId) {
        data = data.filter(p => p.agencyId === agencyId);
      }
      setPlans(data);
    } finally {
      setIsLoading(false);
    }
  }, [financialYearId, agencyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { plans, isLoading, error, refetch };
}

export function useProcurementPlan(id: string) {
  const [plan, setPlan] = useState<ProcurementPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const data = await procurementService.getProcurementPlanById(id);
        setPlan(data);
      } else {
        const data = mockDb.getProcurementPlanById(id) || null;
        setPlan(data);
      }
    } catch (err) {
      setError(err as Error);
      const data = mockDb.getProcurementPlanById(id) || null;
      setPlan(data);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateStatus = useCallback(async (
    newStatus: ProcurementPlanStatus,
    userId: string,
    comments?: string
  ): Promise<boolean> => {
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const success = await procurementService.updatePlanStatus(id, newStatus, userId, comments);
        if (success) {
          await refetch();
        }
        return success;
      }
      // Mock update for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch {
      return false;
    }
  }, [id, refetch]);

  return { plan, isLoading, error, refetch, updateStatus };
}

// =============================================
// PROCUREMENT PLAN ITEM HOOKS
// =============================================

export function useProcurementPlanItems(planId: string) {
  const [items, setItems] = useState<ProcurementPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const data = await procurementService.getProcurementPlanItems(planId);
        setItems(data);
      } else {
        setItems(mockDb.getProcurementPlanItemsByPlanId(planId));
      }
    } catch (err) {
      setError(err as Error);
      setItems(mockDb.getProcurementPlanItemsByPlanId(planId));
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createItem = useCallback(async (
    item: Omit<ProcurementPlanItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProcurementPlanItem | null> => {
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const newItem = await procurementService.createProcurementPlanItem(item);
        if (newItem) {
          await refetch();
        }
        return newItem;
      }
      // Mock create for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      return null;
    } catch {
      return null;
    }
  }, [refetch]);

  const updateItem = useCallback(async (
    id: string,
    updates: Partial<ProcurementPlanItem>
  ): Promise<ProcurementPlanItem | null> => {
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const updatedItem = await procurementService.updateProcurementPlanItem(id, updates);
        if (updatedItem) {
          await refetch();
        }
        return updatedItem;
      }
      // Mock update for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      return null;
    } catch {
      return null;
    }
  }, [refetch]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const success = await procurementService.deleteProcurementPlanItem(id);
        if (success) {
          await refetch();
        }
        return success;
      }
      // Mock delete for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch {
      return false;
    }
  }, [refetch]);

  const bulkImport = useCallback(async (
    newItems: Omit<ProcurementPlanItem, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<ProcurementPlanItem[]> => {
    try {
      const available = await checkSupabaseAvailability();
      if (available) {
        const createdItems = await procurementService.bulkCreateProcurementPlanItems(newItems);
        if (createdItems.length > 0) {
          await refetch();
        }
        return createdItems;
      }
      // Mock bulk import for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [];
    } catch {
      return [];
    }
  }, [refetch]);

  return {
    items,
    isLoading,
    error,
    refetch,
    createItem,
    updateItem,
    deleteItem,
    bulkImport,
  };
}

// =============================================
// COMBINED LOOKUP HOOK
// =============================================

export function useProcurementLookups() {
  const { fundSources, isLoading: loadingFundSources } = useFundSources();
  const { methods, isLoading: loadingMethods } = useProcurementMethods();
  const { contractTypes, isLoading: loadingContractTypes } = useContractTypes();
  const { units, isLoading: loadingUnits } = useUnitsOfMeasure();
  const { provinces, isLoading: loadingProvinces } = useProvinces();

  return {
    fundSources,
    methods,
    contractTypes,
    units,
    provinces,
    isLoading: loadingFundSources || loadingMethods || loadingContractTypes || loadingUnits || loadingProvinces,
  };
}
