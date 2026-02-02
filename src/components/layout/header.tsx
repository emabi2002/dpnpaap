'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Plus,
  RefreshCw,
  Wifi,
  CheckCircle2,
  Clock,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
  tabs?: { label: string; href: string }[];
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export function Header({ title, subtitle, tabs, showRefresh = true, onRefresh }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useSupabaseAuth();
  const [lastUpdated, setLastUpdated] = React.useState(new Date());

  const handleRefresh = () => {
    setLastUpdated(new Date());
    onRefresh?.();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-white dark:bg-slate-900 dark:border-slate-700">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left: Page Title & Tabs */}
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
          {tabs && (
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    pathname === tab.href
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Search, Status, Actions, User */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="w-64 pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-3 border-l pl-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-slate-600">Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-slate-600">97.3% Synced</span>
            </div>
          </div>

          {/* Primary Action */}
          <Link href="/projects/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors">
                <Avatar className="h-8 w-8 bg-teal-600">
                  <AvatarFallback className="bg-teal-600 text-white text-sm">
                    {user?.name ? getInitials(user.name) : 'SA'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-slate-900">{user?.name || 'System Admin'}</p>
                  <p className="text-xs text-slate-500">{user?.role?.replace('_', ' ') || 'super_admin'}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Subtitle Bar with Refresh */}
      {(subtitle || showRefresh) && (
        <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-2">
          {subtitle && (
            <p className="text-sm text-slate-600">{subtitle}</p>
          )}
          {showRefresh && (
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Last updated: {formatTime(lastUpdated)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
