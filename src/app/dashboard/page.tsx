'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Monitor,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  FolderKanban,
  Wifi,
  WifiOff,
  Circle,
  Server,
} from 'lucide-react';
import {
  projects,
  agencies,
  financialYears,
  getFinancialYearById,
  getAgencyById,
  getBudgetLinesByProjectId,
} from '@/lib/database';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  // Calculate stats
  const activeYear = financialYears.find(y => y.status === 'open');
  const yearProjects = projects.filter(p => p.financialYearId === activeYear?.id);
  const totalProjects = yearProjects.length;
  const pendingReview = yearProjects.filter(p => ['submitted', 'under_dnpm_review'].includes(p.status)).length;
  const approved = yearProjects.filter(p => p.status === 'approved_by_dnpm').length;
  const returned = yearProjects.filter(p => p.status === 'returned').length;
  const drafts = yearProjects.filter(p => p.status === 'draft').length;

  // Calculate total budget
  const totalBudget = yearProjects.reduce((sum, p) => {
    const lines = getBudgetLinesByProjectId(p.id);
    return sum + lines.reduce((s, l) => s + l.revisedBudget, 0);
  }, 0);

  // Agency progress data with more details
  const agencyProgress = agencies
    .filter(a => a.status === 'active')
    .map(agency => {
      const agencyProjects = yearProjects.filter(p => p.agencyId === agency.id);
      const completed = agencyProjects.filter(p => p.status === 'approved_by_dnpm').length;
      const submitted = agencyProjects.filter(p => ['submitted', 'under_dnpm_review'].includes(p.status)).length;
      const draft = agencyProjects.filter(p => p.status === 'draft').length;
      const total = agencyProjects.length || 1;
      const budget = agencyProjects.reduce((sum, p) => {
        const lines = getBudgetLinesByProjectId(p.id);
        return sum + lines.reduce((s, l) => s + l.revisedBudget, 0);
      }, 0);
      return {
        name: agency.agencyName,
        code: agency.agencyCode,
        progress: Math.round((completed / total) * 100),
        submissionRate: Math.round(((completed + submitted) / total) * 100),
        count: agencyProjects.length,
        completed,
        submitted,
        draft,
        budget,
      };
    })
    .sort((a, b) => b.submissionRate - a.submissionRate);

  // Device/System status (simulated)
  const deviceStatus = {
    online: 10,
    offline: 2,
    degraded: 1,
    total: 13,
    operationalPercent: 76.9,
  };

  // Status breakdown
  const statusBreakdown = [
    { status: 'Draft', count: drafts, color: 'bg-slate-400' },
    { status: 'Submitted', count: yearProjects.filter(p => p.status === 'submitted').length, color: 'bg-amber-400' },
    { status: 'Under Review', count: yearProjects.filter(p => p.status === 'under_dnpm_review').length, color: 'bg-blue-400' },
    { status: 'Approved', count: approved, color: 'bg-emerald-400' },
    { status: 'Returned', count: returned, color: 'bg-red-400' },
  ];

  // Recent activity with more variety
  const recentActivity = [
    { time: '12:45 PM', action: 'Project Submitted', detail: 'NPC - Procurement System', type: 'info' },
    { time: '10:56 AM', action: 'Budget Updated', detail: 'DOH - Rural Health Program', type: 'success' },
    { time: '09:35 AM', action: 'Project Returned', detail: 'DOE - Education Quality', type: 'warning' },
    { time: '08:12 AM', action: 'Project Approved', detail: 'DOF - IFMS Upgrade', type: 'success' },
    { time: 'Yesterday', action: 'New Project Created', detail: 'DOW - Road Infrastructure', type: 'info' },
  ];

  const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'By Agency', value: 'agency' },
    { label: 'By Status', value: 'status' },
    { label: 'Timeline', value: 'timeline' },
  ];

  return (
    <AppLayout>
      <Header
        title="Dashboard"
        subtitle={`FY${activeYear?.year || '2026'} National Budget | Budget & Cashflow Overview`}
        tabs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Analytics', href: '/reports' },
          { label: 'Export', href: '/export' },
        ]}
        showRefresh={true}
        onRefresh={handleRefresh}
      />

      <div className="p-6">
        {/* Command Center Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Command Center</h2>
            <p className="text-sm text-slate-500">FY{activeYear?.year || '2026'} National Budget | Consolidated Overview</p>
          </div>
          <div className="flex items-center gap-2">
            {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />}
            <Badge variant="outline" className={cn(
              "gap-1.5",
              autoRefresh ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50"
            )}>
              <Circle className={cn("h-2 w-2", autoRefresh ? "fill-emerald-500 text-emerald-500" : "fill-slate-400 text-slate-400")} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Projects */}
          <Card className="stat-card border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Projects</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{totalProjects}</p>
                  <Link href="/projects" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3" />
                    View all projects
                  </Link>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <FolderKanban className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Review */}
          <Card className="stat-card border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Review</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{pendingReview}</p>
                  <span className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3" />
                    Awaiting DNPM review
                  </span>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved */}
          <Card className="stat-card border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Approved</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{approved}</p>
                  <span className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Ready for execution
                  </span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Returned / Needs Attention */}
          <Card className="stat-card border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Returned</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{returned}</p>
                  <span className="text-xs text-red-600 flex items-center gap-1 mt-2">
                    <AlertTriangle className="h-3 w-3" />
                    Needs attention
                  </span>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 w-fit border">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress by Agency - Enhanced */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Submission by Agency</CardTitle>
                <Link href="/reports" className="text-sm text-emerald-600 hover:text-emerald-700">
                  View All
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {agencyProgress.slice(0, 6).map((agency) => (
                  <div key={agency.code} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-medium">{agency.name}</span>
                        <Badge variant="outline" className="text-xs">{agency.code}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{agency.count} projects</span>
                        <span className="font-semibold text-slate-900">{agency.submissionRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                        {/* Approved portion */}
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${agency.progress}%` }}
                        />
                        {/* Submitted portion */}
                        <div
                          className="h-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${((agency.submitted / (agency.count || 1)) * 100)}%` }}
                        />
                        {/* Draft portion */}
                        <div
                          className="h-full bg-slate-300 transition-all duration-500"
                          style={{ width: `${((agency.draft / (agency.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Approved: {agency.completed}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Submitted: {agency.submitted}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                        Draft: {agency.draft}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Device Status - New */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">System Status</CardTitle>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                  Live
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <div className="p-2 bg-emerald-100 rounded-full">
                      <Wifi className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">{deviceStatus.online}</p>
                      <p className="text-xs text-emerald-600">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="p-2 bg-red-100 rounded-full">
                      <WifiOff className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-700">{deviceStatus.offline}</p>
                      <p className="text-xs text-red-600">Offline</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-700">{deviceStatus.degraded}</p>
                      <p className="text-xs text-amber-600">Degraded</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">System Operational</span>
                    <span className="font-semibold text-slate-900">{deviceStatus.operationalPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${(deviceStatus.online / deviceStatus.total) * 100}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${(deviceStatus.degraded / deviceStatus.total) * 100}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${(deviceStatus.offline / deviceStatus.total) * 100}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <Link href="/reports" className="text-sm text-emerald-600 hover:text-emerald-700">
                  View All
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-xs text-slate-400 w-16 pt-0.5">{activity.time}</span>
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5",
                        activity.type === 'success' && "bg-emerald-500",
                        activity.type === 'warning' && "bg-amber-500",
                        activity.type === 'info' && "bg-blue-500"
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                        <p className="text-xs text-slate-500">{activity.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Sync Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Sync Status</CardTitle>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Sync Completion</span>
                    <span className="font-semibold text-emerald-600">94.5%</span>
                  </div>
                  <Progress value={94.5} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <Clock className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-slate-900">3</p>
                      <p className="text-xs text-slate-500">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-slate-900">29</p>
                      <p className="text-xs text-slate-500">Synced</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Overview */}
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-emerald-900">Total Revised Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-emerald-700">K</span>
                  <span className="text-3xl font-bold text-emerald-900">
                    {(totalBudget / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">FY{activeYear?.year || '2026'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Project Status Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', item.color)} />
                      <span className="text-sm text-slate-600">{item.status}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/projects/new" className="block">
                  <Button variant="outline" className="w-full justify-between group">
                    <span className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      Create New Project
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
                <Link href="/review" className="block">
                  <Button variant="outline" className="w-full justify-between group">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Review Submissions
                    </span>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{pendingReview}</Badge>
                  </Button>
                </Link>
                <Link href="/export" className="block">
                  <Button variant="outline" className="w-full justify-between group">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Export Reports
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Deadline */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Submission Deadline</p>
                    <p className="text-lg font-bold text-amber-700">31 March 2026</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
