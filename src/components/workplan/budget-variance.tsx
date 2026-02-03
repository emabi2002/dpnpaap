'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { WorkplanActivity } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BudgetVarianceProps {
  activities: WorkplanActivity[];
  allocatedBudget: number;
}

interface VarianceData {
  activity: WorkplanActivity;
  plannedBudget: number;
  executedBudget: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'on-track' | 'over';
  q1Variance: number;
  q2Variance: number;
  q3Variance: number;
  q4Variance: number;
}

export function BudgetVariance({ activities, allocatedBudget }: BudgetVarianceProps) {
  // Calculate variance data for each activity
  const varianceData = useMemo<VarianceData[]>(() => {
    return activities.map(activity => {
      const plannedBudget = activity.totalBudget;

      // Calculate executed budget based on progress
      // This is a simplified calculation - in reality this would come from actual spending data
      const q1Executed = activity.q1Target > 0
        ? (activity.q1Actual / activity.q1Target) * activity.q1Budget
        : 0;
      const q2Executed = activity.q2Target > 0
        ? (activity.q2Actual / activity.q2Target) * activity.q2Budget
        : 0;
      const q3Executed = activity.q3Target > 0
        ? (activity.q3Actual / activity.q3Target) * activity.q3Budget
        : 0;
      const q4Executed = activity.q4Target > 0
        ? (activity.q4Actual / activity.q4Target) * activity.q4Budget
        : 0;

      const executedBudget = q1Executed + q2Executed + q3Executed + q4Executed;
      const variance = plannedBudget - executedBudget;
      const variancePercent = plannedBudget > 0
        ? ((plannedBudget - executedBudget) / plannedBudget) * 100
        : 0;

      // Determine status based on variance
      let status: 'under' | 'on-track' | 'over';
      if (variancePercent > 10) {
        status = 'under'; // Under budget (good)
      } else if (variancePercent < -10) {
        status = 'over'; // Over budget (bad)
      } else {
        status = 'on-track';
      }

      return {
        activity,
        plannedBudget,
        executedBudget,
        variance,
        variancePercent,
        status,
        q1Variance: activity.q1Budget - q1Executed,
        q2Variance: activity.q2Budget - q2Executed,
        q3Variance: activity.q3Budget - q3Executed,
        q4Variance: activity.q4Budget - q4Executed,
      };
    });
  }, [activities]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalPlanned = varianceData.reduce((sum, v) => sum + v.plannedBudget, 0);
    const totalExecuted = varianceData.reduce((sum, v) => sum + v.executedBudget, 0);
    const totalVariance = totalPlanned - totalExecuted;
    const variancePercent = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0;

    const underBudget = varianceData.filter(v => v.status === 'under').length;
    const onTrack = varianceData.filter(v => v.status === 'on-track').length;
    const overBudget = varianceData.filter(v => v.status === 'over').length;

    // Quarterly summaries
    const q1Planned = varianceData.reduce((sum, v) => sum + v.activity.q1Budget, 0);
    const q1Executed = varianceData.reduce((sum, v) => sum + (v.activity.q1Budget - v.q1Variance), 0);
    const q2Planned = varianceData.reduce((sum, v) => sum + v.activity.q2Budget, 0);
    const q2Executed = varianceData.reduce((sum, v) => sum + (v.activity.q2Budget - v.q2Variance), 0);
    const q3Planned = varianceData.reduce((sum, v) => sum + v.activity.q3Budget, 0);
    const q3Executed = varianceData.reduce((sum, v) => sum + (v.activity.q3Budget - v.q3Variance), 0);
    const q4Planned = varianceData.reduce((sum, v) => sum + v.activity.q4Budget, 0);
    const q4Executed = varianceData.reduce((sum, v) => sum + (v.activity.q4Budget - v.q4Variance), 0);

    return {
      totalPlanned,
      totalExecuted,
      totalVariance,
      variancePercent,
      underBudget,
      onTrack,
      overBudget,
      allocatedBudget,
      utilizationRate: allocatedBudget > 0 ? (totalExecuted / allocatedBudget) * 100 : 0,
      quarterly: [
        { quarter: 'Q1', planned: q1Planned, executed: q1Executed, variance: q1Planned - q1Executed },
        { quarter: 'Q2', planned: q2Planned, executed: q2Executed, variance: q2Planned - q2Executed },
        { quarter: 'Q3', planned: q3Planned, executed: q3Executed, variance: q3Planned - q3Executed },
        { quarter: 'Q4', planned: q4Planned, executed: q4Executed, variance: q4Planned - q4Executed },
      ],
    };
  }, [varianceData, allocatedBudget]);

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000) {
      return `K${(amount / 1000000).toFixed(1)}M`;
    }
    return `K${(amount / 1000).toFixed(0)}K`;
  };

  const formatFullCurrency = (amount: number) => {
    return `K ${amount.toLocaleString()}`;
  };

  const getVarianceIcon = (status: string) => {
    switch (status) {
      case 'under':
        return <TrendingDown className="h-4 w-4 text-emerald-500" />;
      case 'over':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getVarianceColor = (status: string) => {
    switch (status) {
      case 'under':
        return 'text-emerald-600';
      case 'over':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  const getVarianceBadge = (status: string) => {
    switch (status) {
      case 'under':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Under Budget</Badge>;
      case 'over':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Over Budget</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">On Track</Badge>;
    }
  };

  // Sort by variance (most over budget first)
  const sortedVariance = [...varianceData].sort((a, b) => a.variance - b.variance);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Allocated Budget</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(summary.allocatedBudget)}
                </p>
                <p className="text-xs text-slate-500">Total workplan budget</p>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Executed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summary.totalExecuted)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Progress value={summary.utilizationRate} className="h-1 w-16" />
                  <span className="text-xs text-slate-500">{summary.utilizationRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Variance</p>
                <p className={cn(
                  "text-2xl font-bold",
                  summary.totalVariance >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {summary.totalVariance >= 0 ? '+' : ''}{formatCurrency(summary.totalVariance)}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  {summary.totalVariance >= 0 ? (
                    <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={summary.totalVariance >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {Math.abs(summary.variancePercent).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className={cn(
                "p-2 rounded-lg",
                summary.totalVariance >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
              )}>
                {summary.totalVariance >= 0 ? (
                  <TrendingDown className="h-5 w-5 text-emerald-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Status Breakdown</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {summary.underBudget}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    {summary.onTrack}
                  </Badge>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {summary.overBudget}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Quarterly Budget Performance</CardTitle>
          <CardDescription>Planned vs executed budget by quarter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {summary.quarterly.map((q, idx) => {
              const utilizationRate = q.planned > 0 ? (q.executed / q.planned) * 100 : 0;
              const isOverBudget = q.variance < 0;
              const isCurrent = idx === 0; // Q1 is current in our mock data

              return (
                <div
                  key={q.quarter}
                  className={cn(
                    "p-4 rounded-lg border",
                    isCurrent
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "font-semibold",
                      isCurrent ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                    )}>
                      {q.quarter}
                      {isCurrent && (
                        <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-700">
                          Current
                        </Badge>
                      )}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Planned</span>
                      <span className="font-medium">{formatCurrency(q.planned)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Executed</span>
                      <span className="font-medium">{formatCurrency(q.executed)}</span>
                    </div>
                    <Progress value={utilizationRate} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{utilizationRate.toFixed(0)}% utilized</span>
                      <span className={cn(
                        "font-medium",
                        isOverBudget ? "text-red-600" : "text-emerald-600"
                      )}>
                        {isOverBudget ? '' : '+'}{formatCurrency(q.variance)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activities Variance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Activity Budget Variance</CardTitle>
          <CardDescription>Detailed variance analysis by activity (sorted by variance)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Activity</TableHead>
                  <TableHead className="text-right">Planned Budget</TableHead>
                  <TableHead className="text-right">Executed</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-center">Variance %</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVariance.map((item) => (
                  <TableRow key={item.activity.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {item.activity.activityName}
                        </p>
                        <p className="text-xs text-slate-500">{item.activity.activityCode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatFullCurrency(item.plannedBudget)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatFullCurrency(item.executedBudget)}
                    </TableCell>
                    <TableCell className={cn("text-right font-medium", getVarianceColor(item.status))}>
                      <div className="flex items-center justify-end gap-1">
                        {getVarianceIcon(item.status)}
                        {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "text-sm font-medium",
                        getVarianceColor(item.status)
                      )}>
                        {item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getVarianceBadge(item.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {sortedVariance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No activities to analyze
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
