'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Calendar,
  Users,
  Settings,
  ClipboardCheck,
  BarChart3,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: <FolderKanban className="h-4 w-4" />,
  },
  {
    label: 'DNPM Review',
    href: '/review',
    icon: <ClipboardCheck className="h-4 w-4" />,
    roles: ['dnpm_reviewer', 'dnpm_approver'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ['dnpm_reviewer', 'dnpm_approver', 'system_admin'],
  },
  {
    label: 'Export',
    href: '/export',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    roles: ['dnpm_reviewer', 'dnpm_approver', 'system_admin'],
  },
];

const adminItems: NavItem[] = [
  {
    label: 'Financial Years',
    href: '/admin/financial-years',
    icon: <Calendar className="h-4 w-4" />,
    roles: ['system_admin', 'dnpm_approver'],
  },
  {
    label: 'Agencies',
    href: '/admin/agencies',
    icon: <Building2 className="h-4 w-4" />,
    roles: ['system_admin'],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users className="h-4 w-4" />,
    roles: ['system_admin'],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings className="h-4 w-4" />,
    roles: ['system_admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, agency, logout, isDNPM, isAdmin } = useSupabaseAuth();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const filteredAdminItems = adminItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Logo / Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/National_emblem_of_Papua_New_Guinea.svg/330px-National_emblem_of_Papua_New_Guinea.svg.png"
            alt="PNG Emblem"
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">DNPM</span>
          <span className="text-xs text-slate-400">Budget System</span>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-slate-700 p-4">
        <div className="rounded-lg bg-slate-700/50 p-3">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
          {agency && (
            <p className="mt-1 text-xs text-amber-400">{agency.agency_code}</p>
          )}
          {(isDNPM || isAdmin) && (
            <p className="mt-1 text-xs text-emerald-400">
              {isAdmin ? 'System Admin' : 'DNPM Staff'}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {filteredNavItems.map(item => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 text-slate-300 hover:bg-slate-700 hover:text-white',
                  pathname === item.href && 'bg-slate-700 text-white'
                )}
              >
                {item.icon}
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        {filteredAdminItems.length > 0 && (
          <>
            <Separator className="my-4 bg-slate-700" />
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Administration
            </p>
            <div className="space-y-1">
              {filteredAdminItems.map(item => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 text-slate-300 hover:bg-slate-700 hover:text-white',
                      pathname.startsWith(item.href) && 'bg-slate-700 text-white'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </>
        )}
      </ScrollArea>

      {/* Logout */}
      <div className="border-t border-slate-700 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-300 hover:bg-red-500/20 hover:text-red-400"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
