'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import type { WorkplanActivity } from '@/lib/types';
import { ACTIVITY_STATUS_COLORS, ACTIVITY_STATUS_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  activities: WorkplanActivity[];
  startDate?: Date;
  endDate?: Date;
  onActivityClick?: (activity: WorkplanActivity) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = {
  not_started: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  delayed: 'bg-red-500',
  cancelled: 'bg-slate-300',
};

const PROGRESS_COLORS = {
  not_started: 'bg-slate-500',
  in_progress: 'bg-blue-600',
  completed: 'bg-emerald-600',
  delayed: 'bg-red-600',
  cancelled: 'bg-slate-400',
};

export function GanttChart({
  activities,
  startDate,
  endDate,
  onActivityClick,
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Calculate date range
  const dateRange = useMemo(() => {
    const start = startDate || new Date(currentYear, 0, 1);
    const end = endDate || new Date(currentYear, 11, 31);
    return { start, end };
  }, [startDate, endDate, currentYear]);

  // Generate time periods based on view mode
  const periods = useMemo(() => {
    if (viewMode === 'month') {
      return MONTHS.map((month, idx) => ({
        label: month,
        start: new Date(currentYear, idx, 1),
        end: new Date(currentYear, idx + 1, 0),
      }));
    } else {
      return [
        { label: 'Q1', start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
        { label: 'Q2', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
        { label: 'Q3', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
        { label: 'Q4', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) },
      ];
    }
  }, [viewMode, currentYear]);

  // Calculate bar position and width for each activity
  const getActivityBar = (activity: WorkplanActivity) => {
    const actStart = new Date(activity.startDate);
    const actEnd = new Date(activity.endDate);
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    // Calculate total days in year
    const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate start position (clamped to year)
    const startOffset = Math.max(0, (actStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const startPercent = (startOffset / totalDays) * 100;

    // Calculate end position (clamped to year)
    const endOffset = Math.min(totalDays, (actEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const widthPercent = ((endOffset - startOffset) / totalDays) * 100;

    return {
      left: `${startPercent}%`,
      width: `${Math.max(widthPercent, 2)}%`,
    };
  };

  // Get current date position
  const getCurrentDatePosition = () => {
    const now = new Date();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    if (now < yearStart || now > yearEnd) return null;

    const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
    const currentOffset = (now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
    return `${(currentOffset / totalDays) * 100}%`;
  };

  const todayPosition = getCurrentDatePosition();

  // Sort activities by start date
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [activities]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-PG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'quarter')}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentYear(currentYear - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{currentYear}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentYear(currentYear + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with periods */}
            <div className="flex border-b bg-slate-50 dark:bg-slate-800">
              <div className="w-64 flex-shrink-0 p-3 border-r font-medium text-sm text-slate-600 dark:text-slate-400">
                Activity
              </div>
              <div className="flex-1 flex">
                {periods.map((period, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex-1 p-2 text-center text-xs font-medium border-r last:border-r-0",
                      viewMode === 'month' ? "min-w-[60px]" : "min-w-[150px]"
                    )}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'rgb(248, 250, 252)' : 'rgb(241, 245, 249)',
                    }}
                  >
                    {period.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div className="relative">
              {/* Today marker */}
              {todayPosition && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `calc(256px + (100% - 256px) * ${parseFloat(todayPosition) / 100})` }}
                >
                  <div className="absolute -top-1 -left-2 bg-red-500 text-white text-[10px] px-1 rounded">
                    Today
                  </div>
                </div>
              )}

              {sortedActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No activities to display
                </div>
              ) : (
                sortedActivities.map((activity, idx) => {
                  const bar = getActivityBar(activity);

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors",
                        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/30"
                      )}
                      onClick={() => onActivityClick?.(activity)}
                    >
                      {/* Activity name */}
                      <div className="w-64 flex-shrink-0 p-3 border-r">
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                            STATUS_COLORS[activity.status]
                          )} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {activity.activityName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {activity.activityCode}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Timeline bar */}
                      <div className="flex-1 relative py-2 px-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute h-8 rounded-md flex items-center justify-between px-2 text-white text-xs font-medium overflow-hidden",
                                  STATUS_COLORS[activity.status]
                                )}
                                style={{
                                  left: bar.left,
                                  width: bar.width,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                }}
                              >
                                {/* Progress overlay */}
                                <div
                                  className={cn(
                                    "absolute inset-y-0 left-0",
                                    PROGRESS_COLORS[activity.status]
                                  )}
                                  style={{ width: `${activity.progressPercent}%` }}
                                />
                                <span className="relative z-10 truncate">
                                  {activity.progressPercent}%
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{activity.activityName}</p>
                                <p className="text-xs text-slate-400">
                                  {formatDate(activity.startDate)} - {formatDate(activity.endDate)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className={cn('text-xs', ACTIVITY_STATUS_COLORS[activity.status])}>
                                    {ACTIVITY_STATUS_LABELS[activity.status]}
                                  </Badge>
                                  <span className="text-xs">{activity.progressPercent}% complete</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  {activity.responsibleUnit}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 p-3 border-t bg-slate-50 dark:bg-slate-800">
              <span className="text-xs text-slate-500">Legend:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-slate-400" />
                <span className="text-xs text-slate-600">Not Started</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-xs text-slate-600">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-slate-600">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-xs text-slate-600">Delayed</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-0.5 h-4 bg-red-500" />
                <span className="text-xs text-slate-600">Today</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
