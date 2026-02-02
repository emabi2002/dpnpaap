'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { Database, Tables, UserRole } from './database.types';

// =====================================================
// TEST MODE - Set to true to bypass login for testing
// =====================================================
const TEST_MODE = true;

// Test user to use when TEST_MODE is enabled
const TEST_USER = {
  id: 'user_admin',
  email: 'admin@dnpm.gov.pg',
  name: 'System Administrator',
  role: 'system_admin' as UserRole,
  agency_id: null,
  phone: '+675 321 4500',
  created_at: '2024-01-01T00:00:00Z',
  auth_id: 'test-auth-id',
  active: true,
};

// Create typed Supabase client
function getTypedClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type AppUser = Tables<'users'>;
export type Agency = Tables<'agencies'>;

interface AuthContextType {
  user: AppUser | null;
  authUser: SupabaseUser | null;
  session: Session | null;
  agency: Agency | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessAgency: (agencyId: string) => boolean;
  isDNPM: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from our users table
  const fetchUserProfile = useCallback(async (authId: string) => {
    const supabase = getTypedClient();

    // First try to find by auth_id
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single();

    let foundUser: AppUser | null = userData as AppUser | null;

    if (error || !foundUser) {
      // If not found by auth_id, try by email
      const { data: authUserData } = await supabase.auth.getUser();
      if (authUserData?.user?.email) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUserData.user.email)
          .single();

        if (userByEmail) {
          foundUser = userByEmail as AppUser;

          // Update the auth_id for this user
          await supabase
            .from('users')
            .update({ auth_id: authId } as never)
            .eq('id', foundUser.id);
        }
      }
    }

    if (foundUser) {
      setUser(foundUser);

      // Fetch agency if user has one
      if (foundUser.agency_id) {
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', foundUser.agency_id)
          .single();

        if (agencyData) {
          setAgency(agencyData as Agency);
        }
      } else {
        setAgency(null);
      }
    }

    return userData;
  }, []);

  // Initialize auth state
  useEffect(() => {
    // TEST MODE: Bypass authentication and use test user
    if (TEST_MODE) {
      setUser(TEST_USER as AppUser);
      setAgency(null);
      setIsLoading(false);
      return;
    }

    const supabase = getTypedClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setAuthUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setAgency(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const supabase = getTypedClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    const supabase = getTypedClient();
    await supabase.auth.signOut();
    setUser(null);
    setAgency(null);
    setAuthUser(null);
    setSession(null);
  }, []);

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  const canAccessAgency = useCallback((agencyId: string): boolean => {
    if (!user) return false;

    // DNPM and admin can access all agencies
    if (['dnpm_reviewer', 'dnpm_approver', 'system_admin'].includes(user.role)) {
      return true;
    }

    // Agency users can only access their own agency
    return user.agency_id === agencyId;
  }, [user]);

  const isDNPM = user?.role === 'dnpm_reviewer' || user?.role === 'dnpm_approver';
  const isAdmin = user?.role === 'system_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        session,
        agency,
        login,
        logout,
        isLoading,
        hasRole,
        canAccessAgency,
        isDNPM,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Permission helpers
export function canEditProject(user: AppUser | null, projectStatus: string, projectAgencyId: string): boolean {
  if (!user) return false;
  if (projectStatus === 'locked') return false;

  if (user.role === 'agency_user') {
    if (user.agency_id !== projectAgencyId) return false;
    return ['draft', 'returned'].includes(projectStatus);
  }

  if (user.role === 'agency_approver') {
    if (user.agency_id !== projectAgencyId) return false;
    return ['draft', 'returned', 'submitted'].includes(projectStatus);
  }

  if (user.role === 'dnpm_reviewer' || user.role === 'dnpm_approver') {
    return ['submitted', 'under_dnpm_review'].includes(projectStatus);
  }

  if (user.role === 'system_admin') return true;

  return false;
}

export function canSubmitProject(user: AppUser | null, projectStatus: string, projectAgencyId: string): boolean {
  if (!user) return false;
  if (!['agency_user', 'agency_approver'].includes(user.role)) return false;
  if (user.agency_id !== projectAgencyId) return false;
  return ['draft', 'returned'].includes(projectStatus);
}

export function canApproveProject(user: AppUser | null, projectStatus: string): boolean {
  if (!user) return false;
  if (user.role === 'agency_approver' && projectStatus === 'submitted') return true;
  if (user.role === 'dnpm_approver' && projectStatus === 'under_dnpm_review') return true;
  return false;
}

export function canReturnProject(user: AppUser | null, projectStatus: string): boolean {
  if (!user) return false;
  if (['dnpm_reviewer', 'dnpm_approver'].includes(user.role)) {
    return ['submitted', 'under_dnpm_review'].includes(projectStatus);
  }
  if (user.role === 'agency_approver') {
    return projectStatus === 'submitted';
  }
  return false;
}

export function canLockProject(user: AppUser | null, projectStatus: string): boolean {
  if (!user) return false;
  return user.role === 'dnpm_approver' && projectStatus === 'approved_by_dnpm';
}

export function canExportData(user: AppUser | null): boolean {
  if (!user) return false;
  return ['dnpm_reviewer', 'dnpm_approver', 'system_admin'].includes(user.role);
}
