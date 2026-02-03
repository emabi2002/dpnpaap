'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Database,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useWorkplanData, type ConnectionStatus } from '@/lib/supabase/workplan-data-provider';
import { cn } from '@/lib/utils';

interface ConnectionStatusBadgeProps {
  showLabel?: boolean;
  showRefresh?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<ConnectionStatus, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  checking: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    label: 'Checking...',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    description: 'Checking database connection',
  },
  connected: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Supabase',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    description: 'Connected to Supabase (live data)',
  },
  disconnected: {
    icon: <CloudOff className="h-3 w-3" />,
    label: 'Offline',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Using local mock data (tables not found)',
  },
  error: {
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Error',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Database connection error',
  },
};

export function ConnectionStatusBadge({
  showLabel = true,
  showRefresh = false,
  className,
}: ConnectionStatusBadgeProps) {
  const { connectionStatus, isUsingSupabase, lastSyncTime, refreshConnection } = useWorkplanData();
  const config = STATUS_CONFIG[connectionStatus];

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshConnection();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5 font-medium',
                config.bgColor,
                config.color,
                'border-transparent'
              )}
            >
              {isUsingSupabase ? (
                <Cloud className="h-3 w-3" />
              ) : (
                <Database className="h-3 w-3" />
              )}
              {config.icon}
              {showLabel && <span>{config.label}</span>}
            </Badge>
            {showRefresh && connectionStatus !== 'checking' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.description}</p>
            {lastSyncTime && (
              <p className="text-xs text-slate-400">
                Last checked: {lastSyncTime.toLocaleTimeString()}
              </p>
            )}
            {!isUsingSupabase && connectionStatus !== 'checking' && (
              <p className="text-xs text-slate-400">
                Run the SQL schema in Supabase to enable live data
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for sidebar/header
export function ConnectionStatusDot() {
  const { connectionStatus, isUsingSupabase } = useWorkplanData();

  const dotColor = {
    checking: 'bg-slate-400 animate-pulse',
    connected: 'bg-emerald-500',
    disconnected: 'bg-amber-500',
    error: 'bg-red-500',
  }[connectionStatus];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', dotColor)} />
            <span className="text-xs text-slate-500">
              {isUsingSupabase ? 'Live' : 'Mock'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {STATUS_CONFIG[connectionStatus].description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
