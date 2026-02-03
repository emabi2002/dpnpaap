'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { useWorkplanData } from '@/lib/supabase/workplan-data-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Building2,
  Calendar,
  Loader2,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Activity,
  Download,
  FileSpreadsheet,
  FileIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { exportNationalWorkplanToExcel, exportNationalWorkplanToPDF } from '@/lib/workplan-export';
import {
  agencies,
  financialYears,
  getAgencyById,
  getFinancialYearById,
} from '@/lib/database';
import {
  WORKPLAN_STATUS_LABELS,
  WORKPLAN_STATUS_COLORS,
  type WorkplanStatus,
  type Workplan,
  type WorkplanActivity,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export default function WorkplansPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const { getWorkplans, getActivities, connectionStatus, isUsingSupabase } = useWorkplanData();

  const [selectedYear, setSelectedYear] = useState<string>('fy_2026');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [workplansList, setWorkplansList] = useState<Workplan[]>([]);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, WorkplanActivity[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch workplans data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWorkplans(selectedYear, selectedAgency === 'all' ? undefined : selectedAgency);
      setWorkplansList(data);

      // Fetch activities for each workplan
      const activitiesData: Record<string, WorkplanActivity[]> = {};
      for (const wp of data) {
        activitiesData[wp.id] = await getActivities(wp.id);
      }
      setActivitiesMap(activitiesData);
    } catch (err) {
      console.error('Error fetching workplans:', err);
      toast.error('Failed to load workplans');
    } finally {
      setIsLoading(false);
    }
  }, [getWorkplans, getActivities, selectedYear, selectedAgency]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Get workplans for selected year (filtered by search)
  const yearWorkplans = useMemo(() => {
    let filtered = [...workplansList];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(wp =>
        wp.title.toLowerCase().includes(query) ||
        wp.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [workplansList, searchQuery]);

  // Get all activities from the map
  const getAllActivities = useCallback(() => {
    return Object.values(activitiesMap).flat();
  }, [activitiesMap]);

  // Calculate national summary
  const nationalSummary = useMemo(() => {
    const allWorkplans = workplansList;
    const allActivities = getAllActivities();

    const totalBudget = allWorkplans.reduce((sum, wp) => sum + wp.totalBudget, 0);
    const executedBudget = allActivities.reduce((sum, act) => {
      const executed = act.q1Budget * (act.q1Actual / (act.q1Target || 1));
      return sum + executed;
    }, 0);

    const completedActivities = allActivities.filter(a => a.status === 'completed').length;
    const inProgressActivities = allActivities.filter(a => a.status === 'in_progress').length;
    const delayedActivities = allActivities.filter(a => a.status === 'delayed').length;
    const notStartedActivities = allActivities.filter(a => a.status === 'not_started').length;

    const overallProgress = allActivities.length > 0
      ? Math.round(allActivities.reduce((sum, a) => sum + a.progressPercent, 0) / allActivities.length)
      : 0;

    // By agency breakdown
    const byAgency = agencies
      .filter(a => a.status === 'active')
      .map(agency => {
        const agencyWorkplans = allWorkplans.filter(wp => wp.agencyId === agency.id);
        const agencyActivities = agencyWorkplans.flatMap(wp => activitiesMap[wp.id] || []);
        const completed = agencyActivities.filter(a => a.status === 'completed').length;
        const progress = agencyActivities.length > 0
          ? Math.round(agencyActivities.reduce((sum, a) => sum + a.progressPercent, 0) / agencyActivities.length)
          : 0;
        const budget = agencyWorkplans.reduce((sum, wp) => sum + wp.totalBudget, 0);

        return {
          agencyId: agency.id,
          agencyName: agency.agencyName,
          agencyCode: agency.agencyCode || '',
          workplanCount: agencyWorkplans.length,
          activitiesCount: agencyActivities.length,
          completedCount: completed,
          progressPercent: progress,
          budget,
          status: agencyWorkplans[0]?.status || 'draft',
        };
      })
      .filter(a => a.workplanCount > 0)
      .sort((a, b) => b.progressPercent - a.progressPercent);

    // By quarter
    const byQuarter = [
      { quarter: 'Q1', targetBudget: 0, actualBudget: 0, targetActivities: 0, actualActivities: 0 },
      { quarter: 'Q2', targetBudget: 0, actualBudget: 0, targetActivities: 0, actualActivities: 0 },
      { quarter: 'Q3', targetBudget: 0, actualBudget: 0, targetActivities: 0, actualActivities: 0 },
      { quarter: 'Q4', targetBudget: 0, actualBudget: 0, targetActivities: 0, actualActivities: 0 },
    ];

    allActivities.forEach(act => {
      byQuarter[0].targetBudget += act.q1Budget;
      byQuarter[1].targetBudget += act.q2Budget;
      byQuarter[2].targetBudget += act.q3Budget;
      byQuarter[3].targetBudget += act.q4Budget;
      byQuarter[0].targetActivities += act.q1Target;
      byQuarter[1].targetActivities += act.q2Target;
      byQuarter[2].targetActivities += act.q3Target;
      byQuarter[3].targetActivities += act.q4Target;
      byQuarter[0].actualActivities += act.q1Actual;
      byQuarter[1].actualActivities += act.q2Actual;
      byQuarter[2].actualActivities += act.q3Actual;
      byQuarter[3].actualActivities += act.q4Actual;
    });

    return {
      totalAgencies: allWorkplans.length,
      totalActivities: allActivities.length,
      completedActivities,
      inProgressActivities,
      delayedActivities,
      notStartedActivities,
      totalBudget,
      executedBudget,
      overallProgress,
      byAgency,
      byQuarter,
    };
  }, [workplansList, activitiesMap, getAllActivities]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `K${(amount / 1000000).toFixed(1)}M`;
    }
    return `K${(amount / 1000).toFixed(0)}K`;
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const selectedFY = getFinancialYearById(selectedYear);

  return (
    <AppLayout>
      <Header
        title="Workplans"
        subtitle="Annual work programmes and activity tracking across agencies"
        tabs={[
          { label: 'National Overview', href: '/workplans' },
          { label: 'By Agency', href: '/workplans?view=agency' },
          { label: 'Activities', href: '/workplans?view=activities' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {financialYears.map(fy => (
                  <SelectItem key={fy.id} value={fy.id}>
                    FY {fy.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(isDNPM || isAdmin) && (
              <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  {agencies.filter(a => a.status === 'active').map(agency => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.agencyCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search workplans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                exportNationalWorkplanToExcel(yearWorkplans);
                toast.success('Excel file downloaded');
              }}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportNationalWorkplanToPDF(yearWorkplans);
                toast.success('PDF file downloaded');
              }}>
                <FileIcon className="h-4 w-4 mr-2 text-red-600" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/workplans/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Workplan
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="stat-card border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Agencies</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{nationalSummary.totalAgencies}</p>
                  <p className="text-xs text-slate-500">with workplans</p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                  <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Activities</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{nationalSummary.totalActivities}</p>
                  <p className="text-xs text-slate-500">total activities</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{nationalSummary.completedActivities}</p>
                  <p className="text-xs text-slate-500">activities done</p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">In Progress</p>
                  <p className="text-2xl font-bold text-amber-600">{nationalSummary.inProgressActivities}</p>
                  <p className="text-xs text-slate-500">activities running</p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Not Started</p>
                  <p className="text-2xl font-bold text-red-600">{nationalSummary.notStartedActivities}</p>
                  <p className="text-xs text-slate-500">pending start</p>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* National Progress Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">National Workplan Progress</CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  FY{selectedFY?.year || '2026'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Overall Progress</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{nationalSummary.overallProgress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${nationalSummary.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Agency Progress Bars */}
                <div className="space-y-4 mt-6">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">By Agency</h4>
                  {nationalSummary.byAgency.map((agency) => (
                    <div key={agency.agencyId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{agency.agencyCode}</span>
                          <Badge variant="outline" className={cn('text-xs', WORKPLAN_STATUS_COLORS[agency.status as WorkplanStatus])}>
                            {WORKPLAN_STATUS_LABELS[agency.status as WorkplanStatus]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{agency.activitiesCount} activities</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{agency.progressPercent}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${agency.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workplans Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Agency Workplans</CardTitle>
                <span className="text-sm text-slate-500">{yearWorkplans.length} workplans</span>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Workplan</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearWorkplans.map(workplan => {
                      const agency = getAgencyById(workplan.agencyId);
                      const activities = activitiesMap[workplan.id] || [];
                      const progress = activities.length > 0
                        ? Math.round(activities.reduce((sum, a) => sum + a.progressPercent, 0) / activities.length)
                        : 0;

                      return (
                        <TableRow
                          key={workplan.id}
                          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => router.push(`/workplans/${workplan.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-5 w-5 text-slate-500" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white text-sm">
                                  {workplan.title}
                                </p>
                                <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                  {workplan.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <Building2 className="h-3 w-3 mr-1" />
                              {agency?.agencyCode}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{activities.length}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="h-2 w-16" />
                              <span className="text-xs text-slate-500">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs', WORKPLAN_STATUS_COLORS[workplan.status])}>
                              {WORKPLAN_STATUS_LABELS[workplan.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(workplan.totalBudget)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {yearWorkplans.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                          <p>No workplans found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Budget Summary */}
            <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-200 dark:border-teal-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-teal-900 dark:text-teal-100">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-teal-700 dark:text-teal-300">K</span>
                  <span className="text-3xl font-bold text-teal-900 dark:text-white">
                    {(nationalSummary.totalBudget / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm text-teal-700 dark:text-teal-300">FY{selectedFY?.year || '2026'} Allocation</span>
                </div>
              </CardContent>
            </Card>

            {/* Quarterly Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Quarterly Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nationalSummary.byQuarter.map((q, idx) => {
                  const progress = q.targetActivities > 0
                    ? Math.round((q.actualActivities / q.targetActivities) * 100)
                    : 0;
                  const isCurrent = idx === 0; // Q1 is current in our mock data

                  return (
                    <div key={q.quarter} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={cn(
                          "font-medium",
                          isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                        )}>
                          {q.quarter}
                          {isCurrent && (
                            <Badge variant="outline" className="ml-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                              Current
                            </Badge>
                          )}
                        </span>
                        <span className="text-slate-900 dark:text-white font-semibold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Target: {formatCurrency(q.targetBudget)}</span>
                        <span>Actual: {q.actualActivities}/{q.targetActivities}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Activity Status Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Activity Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{nationalSummary.completedActivities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">In Progress</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{nationalSummary.inProgressActivities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Delayed</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{nationalSummary.delayedActivities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Not Started</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{nationalSummary.notStartedActivities}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/workplans/new" className="block">
                  <Button variant="outline" className="w-full justify-between group">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Workplan
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
                <Link href="/reports" className="block">
                  <Button variant="outline" className="w-full justify-between group">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      View Reports
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
                <Link href="/export" className="block">
                  <Button variant="outline" className="w-full justify-between group">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Export Data
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
