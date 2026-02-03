'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole } from './types';
import { getUserByEmail, getAgencyById, type Agency } from './database';

interface AuthContextType {
  user: User | null;
  agency: Agency | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessAgency: (agencyId: string) => boolean;
  isDNPM: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('dnpm_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        if (parsedUser.agencyId) {
          const userAgency = getAgencyById(parsedUser.agencyId);
          setAgency(userAgency || null);
        }
      } catch {
        localStorage.removeItem('dnpm_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user by email (in production, this would verify password)
    const foundUser = getUserByEmail(email);

    if (foundUser && foundUser.active) {
      setUser(foundUser);
      localStorage.setItem('dnpm_user', JSON.stringify(foundUser));

      if (foundUser.agencyId) {
        const userAgency = getAgencyById(foundUser.agencyId);
        setAgency(userAgency || null);
      } else {
        setAgency(null);
      }

      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAgency(null);
    localStorage.removeItem('dnpm_user');
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
    return user.agencyId === agencyId;
  }, [user]);

  const isDNPM = user?.role === 'dnpm_reviewer' || user?.role === 'dnpm_approver';
  const isAdmin = user?.role === 'system_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Permission helpers
export function canEditProject(user: User | null, projectStatus: string, projectAgencyId: string): boolean {
  if (!user) return false;

  // Locked projects cannot be edited
  if (projectStatus === 'locked') return false;

  // Agency users can edit draft and returned projects for their agency
  if (user.role === 'agency_user') {
    if (user.agencyId !== projectAgencyId) return false;
    return ['draft', 'returned'].includes(projectStatus);
  }

  // Agency approvers can edit draft, returned, and submitted for their agency
  if (user.role === 'agency_approver') {
    if (user.agencyId !== projectAgencyId) return false;
    return ['draft', 'returned', 'submitted'].includes(projectStatus);
  }

  // DNPM can edit submitted and under_review projects
  if (user.role === 'dnpm_reviewer' || user.role === 'dnpm_approver') {
    return ['submitted', 'under_dnpm_review'].includes(projectStatus);
  }

  // Admin can edit all (except locked)
  if (user.role === 'system_admin') return true;

  return false;
}

export function canSubmitProject(user: User | null, projectStatus: string, projectAgencyId: string): boolean {
  if (!user) return false;

  // Only agency users can submit
  if (!['agency_user', 'agency_approver'].includes(user.role)) return false;

  // Must be their agency
  if (user.agencyId !== projectAgencyId) return false;

  // Can only submit draft or returned projects
  return ['draft', 'returned'].includes(projectStatus);
}

export function canApproveProject(user: User | null, projectStatus: string): boolean {
  if (!user) return false;

  // Agency approver can approve submitted projects
  if (user.role === 'agency_approver' && projectStatus === 'submitted') {
    return true;
  }

  // DNPM approver can approve under_review projects
  if (user.role === 'dnpm_approver' && projectStatus === 'under_dnpm_review') {
    return true;
  }

  return false;
}

export function canReturnProject(user: User | null, projectStatus: string): boolean {
  if (!user) return false;

  // DNPM reviewers and approvers can return submitted or under_review projects
  if (['dnpm_reviewer', 'dnpm_approver'].includes(user.role)) {
    return ['submitted', 'under_dnpm_review'].includes(projectStatus);
  }

  // Agency approvers can return submitted projects
  if (user.role === 'agency_approver') {
    return projectStatus === 'submitted';
  }

  return false;
}

export function canLockProject(user: User | null, projectStatus: string): boolean {
  if (!user) return false;

  // Only DNPM approver can lock approved projects
  return user.role === 'dnpm_approver' && projectStatus === 'approved_by_dnpm';
}

export function canExportData(user: User | null): boolean {
  if (!user) return false;

  // Only DNPM and admin can export
  return ['dnpm_reviewer', 'dnpm_approver', 'system_admin'].includes(user.role);
}
