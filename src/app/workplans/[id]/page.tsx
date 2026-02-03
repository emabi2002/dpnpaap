'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { useWorkplanData } from '@/lib/supabase/workplan-data-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Loader2,
  FileText,
  Download,
  Plus,
  User,
  Activity,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  FileSpreadsheet,
  FileIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAgencyById,
  getFinancialYearById,
  getProjectById,
} from '@/lib/database';
import {
  WORKPLAN_STATUS_LABELS,
  WORKPLAN_STATUS_COLORS,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_COLORS,
  type WorkplanStatus,
  type WorkplanActivity,
  type Workplan,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { ActivityDialog } from '@/components/workplan/activity-dialog';
import { ApprovalActions } from '@/components/workplan/approval-actions';
import { GanttChart } from '@/components/workplan/gantt-chart';
import { BulkImport } from '@/components/workplan/bulk-import';
import { BudgetVariance } from '@/components/workplan/budget-variance';
import { exportWorkplanToExcel, exportWorkplanToPDF } from '@/lib/workplan-export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WorkplanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workplanId = params.id as string;
  const { user, isLoading: authLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const {
    getWorkplanById: fetchWorkplan,
    getActivities: fetchActivities,
    updateWorkplanStatus: updateStatus,
    createActivity: addActivity,
    updateActivity: editActivity,
    deleteActivity: removeActivity,
    bulkImportActivities,
  } = useWorkplanData();

  const [statusFilter, setStatusFilter] = useState('all');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<WorkplanActivity | null>(null);
  const [activeView, setActiveView] = useState<'activities' | 'timeline' | 'variance'>('activities');
  const [workplan, setWorkplan] = useState<Workplan | null>(null);
  const [activities, setActivities] = useState<WorkplanActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch workplan and activities
  const loadData = useCallback(async () => {
    if (!workplanId) return;
    setIsLoading(true);
    try {
      const wpData = await fetchWorkplan(workplanId);
      setWorkplan(wpData);
      if (wpData) {
        const actData = await fetchActivities(workplanId);
        setActivities(actData);
      }
    } catch (err) {
      console.error('Error loading workplan:', err);
      toast.error('Failed to load workplan');
    } finally {
      setIsLoading(false);
    }
  }, [workplanId, fetchWorkplan, fetchActivities]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const agency = workplan ? getAgencyById(workplan.agencyId) : null;
  const financialYear = workplan ? getFinancialYearById(workplan.financialYearId) : null;

  const filteredActivities = useMemo(() => {
    if (statusFilter === 'all') return activities;
    return activities.filter(a => a.status === statusFilter);
  }, [activities, statusFilter]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
    const delayedActivities = activities.filter(a => a.status === 'delayed').length;
    const notStartedActivities = activities.filter(a => a.status === 'not_started').length;

    const overallProgress = totalActivities > 0
      ? Math.round(activities.reduce((sum, a) => sum + a.progressPercent, 0) / totalActivities)
      : 0;

    const totalBudget = activities.reduce((sum, a) => sum + a.totalBudget, 0);

    const q1 = {
      target: activities.reduce((sum, a) => sum + a.q1Target, 0),
      actual: activities.reduce((sum, a) => sum + a.q1Actual, 0),
      budget: activities.reduce((sum, a) => sum + a.q1Budget, 0),
    };
    const q2 = {
      target: activities.reduce((sum, a) => sum + a.q2Target, 0),
      actual: activities.reduce((sum, a) => sum + a.q2Actual, 0),
      budget: activities.reduce((sum, a) => sum + a.q2Budget, 0),
    };
    const q3 = {
      target: activities.reduce((sum, a) => sum + a.q3Target, 0),
      actual: activities.reduce((sum, a) => sum + a.q3Actual, 0),
      budget: activities.reduce((sum, a) => sum + a.q3Budget, 0),
    };
    const q4 = {
      target: activities.reduce((sum, a) => sum + a.q4Target, 0),
      actual: activities.reduce((sum, a) => sum + a.q4Actual, 0),
      budget: activities.reduce((sum, a) => sum + a.q4Budget, 0),
    };

    return {
      totalActivities,
      completedActivities,
      inProgressActivities,
      delayedActivities,
      notStartedActivities,
      overallProgress,
      totalBudget,
      q1, q2, q3, q4,
    };
  }, [activities]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `K${(amount / 1000000).toFixed(1)}M`;
    }
    return `K${(amount / 1000).toFixed(0)}K`;
  };

  // Activity CRUD handlers
  const handleAddActivity = () => {
    setSelectedActivity(null);
    setActivityDialogOpen(true);
  };

  const handleEditActivity = (activity: WorkplanActivity) => {
    setSelectedActivity(activity);
    setActivityDialogOpen(true);
  };

  const handleSaveActivity = useCallback(async (activityData: Partial<WorkplanActivity>) => {
    try {
      if (selectedActivity) {
        // Update existing activity
        const updated = await editActivity(selectedActivity.id, activityData);
        setActivities(prev => prev.map(a => a.id === selectedActivity.id ? updated : a));
        toast.success('Activity updated successfully');
      } else {
        // Add new activity
        const newActivity = await addActivity({ ...activityData, workplanId });
        setActivities(prev => [...prev, newActivity]);
        toast.success('Activity added successfully');
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      toast.error('Failed to save activity');
    }
  }, [selectedActivity, editActivity, addActivity, workplanId]);

  const handleDeleteActivity = useCallback(async (activityId: string) => {
    try {
      await removeActivity(activityId);
      setActivities(prev => prev.filter(a => a.id !== activityId));
      toast.success('Activity deleted successfully');
    } catch (err) {
      console.error('Error deleting activity:', err);
      toast.error('Failed to delete activity');
    }
  }, [removeActivity]);

  // Bulk import handler
  const handleBulkImport = useCallback(async (importedActivities: Partial<WorkplanActivity>[]) => {
    try {
      const imported = await bulkImportActivities(importedActivities.map(a => ({ ...a, workplanId })));
      setActivities(prev => [...prev, ...imported]);
      toast.success(`Successfully imported ${imported.length} activities`);
    } catch (err) {
      console.error('Error importing activities:', err);
      toast.error('Failed to import activities');
    }
  }, [bulkImportActivities, workplanId]);

  // Get existing activity codes for duplicate checking
  const existingCodes = useMemo(() =>
    activities.map(a => a.activityCode),
    [activities]
  );

  // Workplan status change handler
  const handleStatusChange = useCallback(async (newStatus: WorkplanStatus, comments?: string) => {
    if (!workplan || !user) return;
    try {
      const updated = await updateStatus(workplan.id, newStatus, user.id, comments);
      setWorkplan(updated);
      toast.success(`Workplan ${newStatus === 'approved' ? 'approved' : 'updated'} successfully`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update workplan status');
    }
  }, [workplan, user, updateStatus]);

  // Export handlers
  const handleExportExcel = () => {
    if (workplan) {
      exportWorkplanToExcel(workplan);
      toast.success('Excel file downloaded');
    }
  };

  const handleExportPDF = () => {
    if (workplan) {
      exportWorkplanToPDF(workplan);
      toast.success('PDF file downloaded');
    }
  };

  // Determine if user can edit
  const canEdit = useMemo(() => {
    if (!workplan || !user) return false;
    if (workplan.status === 'completed') return false;
    if (isAdmin) return true;
    if (isDNPM && ['submitted', 'approved'].includes(workplan.status)) return true;
    if (workplan.agencyId === user.agency_id && ['draft', 'in_progress'].includes(workplan.status)) return true;
    return false;
  }, [workplan, user, isAdmin, isDNPM]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  if (!workplan) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center flex-col gap-4">
          <FileText className="h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Workplan not found</p>
          <Link href="/workplans">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workplans
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header
        title={workplan.title}
        subtitle={`${agency?.agencyName} | FY${financialYear?.year}`}
        tabs={[
          { label: 'Activities', href: `/workplans/${workplanId}` },
          { label: 'Quarterly View', href: `/workplans/${workplanId}?view=quarterly` },
          { label: 'Budget', href: `/workplans/${workplanId}?view=budget` },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Back Button & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/workplans">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Workplans
            </Button>
          </Link>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileIcon className="h-4 w-4 mr-2 text-red-600" />
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canEdit && (
              <>
                <BulkImport
                  workplanId={workplanId}
                  onImport={handleBulkImport}
                  existingCodes={existingCodes}
                />
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  onClick={handleAddActivity}
                >
                  <Plus className="h-4 w-4" />
                  Add Activity
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workplan Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{workplan.title}</h2>
                        <Badge className={cn(WORKPLAN_STATUS_COLORS[workplan.status])}>
                          {WORKPLAN_STATUS_LABELS[workplan.status]}
                        </Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">{workplan.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {agency?.agencyCode}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          FY{financialYear?.year}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          {summary.totalActivities} Activities
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(workplan.totalBudget)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Circle */}
                  <div className="text-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48" cy="48" r="40"
                          stroke="currentColor" strokeWidth="8" fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="48" cy="48" r="40"
                          stroke="currentColor" strokeWidth="8" fill="none"
                          strokeDasharray={`${summary.overallProgress * 2.51} 251`}
                          className="text-emerald-500" strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{summary.overallProgress}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Overall Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Tabs */}
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="variance">Budget Variance</TabsTrigger>
              </TabsList>

              <TabsContent value="activities" className="mt-4 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="stat-card">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalActivities}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </CardContent>
              </Card>
              <Card className="stat-card bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{summary.completedActivities}</p>
                  <p className="text-xs text-green-600">Completed</p>
                </CardContent>
              </Card>
              <Card className="stat-card bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{summary.inProgressActivities}</p>
                  <p className="text-xs text-blue-600">In Progress</p>
                </CardContent>
              </Card>
              <Card className="stat-card bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{summary.delayedActivities}</p>
                  <p className="text-xs text-amber-600">Delayed</p>
                </CardContent>
              </Card>
              <Card className="stat-card bg-slate-50 dark:bg-slate-800 border-slate-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-slate-600">{summary.notStartedActivities}</p>
                  <p className="text-xs text-slate-500">Not Started</p>
                </CardContent>
              </Card>
            </div>

            {/* Quarterly Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Quarterly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Q1', data: summary.q1, isCurrent: true },
                    { label: 'Q2', data: summary.q2, isCurrent: false },
                    { label: 'Q3', data: summary.q3, isCurrent: false },
                    { label: 'Q4', data: summary.q4, isCurrent: false },
                  ].map(({ label, data, isCurrent }) => {
                    const progress = data.target > 0 ? Math.round((data.actual / data.target) * 100) : 0;
                    return (
                      <div key={label} className={cn(
                        "p-4 rounded-lg border",
                        isCurrent ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("font-semibold", isCurrent ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300")}>
                            {label}
                            {isCurrent && <Badge variant="outline" className="ml-2 text-xs bg-emerald-100 text-emerald-700">Current</Badge>}
                          </span>
                          <span className={cn("font-bold", isCurrent ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2 mb-2" />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Target: {data.target}</span>
                          <span>Actual: {data.actual}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Budget: {formatCurrency(data.budget)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Activities Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Activities</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Code</TableHead>
                        <TableHead className="min-w-[250px]">Activity</TableHead>
                        <TableHead>Responsible</TableHead>
                        <TableHead className="text-center">Q1</TableHead>
                        <TableHead className="text-center">Q2</TableHead>
                        <TableHead className="text-center">Q3</TableHead>
                        <TableHead className="text-center">Q4</TableHead>
                        <TableHead className="text-center">Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        {canEdit && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivities.map(activity => {
                        const project = activity.projectId ? getProjectById(activity.projectId) : null;

                        return (
                          <TableRow key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <TableCell className="font-mono text-xs text-slate-500">
                              {activity.activityCode.split('-').pop()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white text-sm">{activity.activityName}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[250px]">{activity.description}</p>
                                {project && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Linked: {project.projectCode}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="text-slate-700 dark:text-slate-300">{activity.responsibleUnit}</p>
                                {activity.responsibleOfficer && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {activity.responsibleOfficer}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-xs">
                                <span className={cn("font-medium", activity.q1Actual >= activity.q1Target ? "text-green-600" : "text-slate-600")}>
                                  {activity.q1Actual}
                                </span>
                                <span className="text-slate-400">/{activity.q1Target}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-xs">
                                <span className="font-medium text-slate-600">{activity.q2Actual}</span>
                                <span className="text-slate-400">/{activity.q2Target}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-xs">
                                <span className="font-medium text-slate-600">{activity.q3Actual}</span>
                                <span className="text-slate-400">/{activity.q3Target}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-xs">
                                <span className="font-medium text-slate-600">{activity.q4Actual}</span>
                                <span className="text-slate-400">/{activity.q4Target}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Progress value={activity.progressPercent} className="h-2 w-12" />
                                <span className="text-xs font-medium text-slate-600">{activity.progressPercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('text-xs', ACTIVITY_STATUS_COLORS[activity.status])}>
                                {ACTIVITY_STATUS_LABELS[activity.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-sm">
                              {formatCurrency(activity.totalBudget)}
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteActivity(activity.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      {filteredActivities.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={canEdit ? 11 : 10} className="h-32 text-center text-slate-500">
                            <Activity className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                            <p>No activities found</p>
                            {canEdit && (
                              <Button variant="link" onClick={handleAddActivity} className="mt-2">
                                Add your first activity
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <GanttChart
                  activities={activities}
                  onActivityClick={(activity) => handleEditActivity(activity)}
                />
              </TabsContent>

              <TabsContent value="variance" className="mt-4">
                <BudgetVariance
                  activities={activities}
                  allocatedBudget={workplan.totalBudget}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Approval Actions */}
            <ApprovalActions
              workplan={workplan}
              userRole={user?.role || 'agency_user'}
              userId={user?.id || ''}
              onStatusChange={handleStatusChange}
            />

            {/* Budget Summary */}
            <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-200 dark:border-teal-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-teal-900 dark:text-teal-100">Budget Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-teal-700 dark:text-teal-300">Allocated Budget</p>
                  <p className="text-2xl font-bold text-teal-900 dark:text-white">
                    K {workplan.totalBudget.toLocaleString()}
                  </p>
                </div>
                <div className="pt-2 border-t border-teal-200 dark:border-teal-700">
                  <p className="text-xs text-teal-700 dark:text-teal-300">Activities Budget</p>
                  <p className="text-lg font-semibold text-teal-800 dark:text-teal-200">
                    K {summary.totalBudget.toLocaleString()}
                  </p>
                </div>
                <div className="pt-2 border-t border-teal-200 dark:border-teal-700">
                  <p className="text-xs text-teal-700 dark:text-teal-300">Remaining</p>
                  <p className={cn(
                    "text-lg font-semibold",
                    workplan.totalBudget - summary.totalBudget >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-600"
                  )}>
                    K {(workplan.totalBudget - summary.totalBudget).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Activity Status Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Activity Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
                  </div>
                  <span className="text-sm font-semibold">{summary.completedActivities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">In Progress</span>
                  </div>
                  <span className="text-sm font-semibold">{summary.inProgressActivities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Delayed</span>
                  </div>
                  <span className="text-sm font-semibold">{summary.delayedActivities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Not Started</span>
                  </div>
                  <span className="text-sm font-semibold">{summary.notStartedActivities}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Activity Dialog */}
      <ActivityDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        activity={selectedActivity}
        workplanId={workplanId}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
      />
    </AppLayout>
  );
}
