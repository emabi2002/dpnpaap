'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import {
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  Users,
  Settings,
  ClipboardCheck,
  BarChart3,
  LogOut,
  ChevronDown,
  Circle,
  FileText,
  History,
  Shield,
  Key,
  Activity,
  ShoppingCart,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'CORE OPERATIONS',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        label: 'Projects',
        href: '/projects',
        icon: <FolderKanban className="h-4 w-4" />,
        badge: 4,
      },
      {
        label: 'Workplans',
        href: '/workplans',
        icon: <FileText className="h-4 w-4" />,
        badge: 6,
      },
      {
        label: 'Procurement',
        href: '/procurement',
        icon: <ShoppingCart className="h-4 w-4" />,
        badge: 4,
      },
      {
        label: 'DNPM Review',
        href: '/review',
        icon: <ClipboardCheck className="h-4 w-4" />,
        badge: 2,
        roles: ['system_admin', 'dnpm_approver', 'dnpm_reviewer'],
      },
      {
        label: 'Reports',
        href: '/reports',
        icon: <BarChart3 className="h-4 w-4" />,
        roles: ['system_admin', 'dnpm_approver', 'dnpm_reviewer'],
      },
      {
        label: 'Export',
        href: '/export',
        icon: <Download className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      {
        label: 'Financial Years',
        href: '/admin/financial-years',
        icon: <Calendar className="h-4 w-4" />,
        roles: ['system_admin'],
      },
      {
        label: 'Agencies',
        href: '/admin/agencies',
        icon: <Building2 className="h-4 w-4" />,
        badge: 6,
        roles: ['system_admin'],
      },
      {
        label: 'User Management',
        href: '/admin/users',
        icon: <Users className="h-4 w-4" />,
        badge: 23,
        roles: ['system_admin'],
      },
      {
        label: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: <History className="h-4 w-4" />,
        roles: ['system_admin', 'dnpm_approver'],
      },
      {
        label: 'Workplan Settings',
        href: '/admin/workplan-settings',
        icon: <FileText className="h-4 w-4" />,
        roles: ['system_admin'],
      },
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: <Settings className="h-4 w-4" />,
        roles: ['system_admin'],
      },
    ],
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const { user, logout, isDNPM, isAdmin } = useSupabaseAuth();

  const canAccessItem = (item: NavItem) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 flex flex-col" style={{ backgroundColor: '#0f2a2a' }}>
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: '#1a3d3d' }}>
          <svg viewBox="0 0 32 32" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="none" stroke="#22c55e" strokeWidth="1.5"/>
            <path d="M16 6 L19 12 L16 10 L13 12 Z" fill="#f59e0b"/>
            <path d="M12 14 Q16 16 20 14 Q18 20 16 24 Q14 20 12 14" fill="#22c55e"/>
            <circle cx="16" cy="11" r="2" fill="#ef4444"/>
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-white">DNPM</h1>
          <p className="text-xs text-slate-400">Budget System</p>
        </div>
      </div>

      {/* User Info */}
      <div className="mx-3 mt-4 rounded-lg p-3" style={{ backgroundColor: '#1a3d3d' }}>
        <p className="text-sm font-medium text-white truncate">{user?.name || 'System User'}</p>
        <p className="text-xs text-slate-400 truncate">{user?.email || 'user@dnpm.gov.pg'}</p>
        <span className="mt-1 inline-block text-xs text-emerald-400">
          {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Admin'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(canAccessItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-6">
              <h3 className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          {item.icon}
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "h-5 min-w-[20px] justify-center text-xs",
                              isActive
                                ? "bg-emerald-500/30 text-emerald-300"
                                : "bg-white/10 text-slate-300"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
          <span className="text-xs text-slate-400">System Online</span>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
