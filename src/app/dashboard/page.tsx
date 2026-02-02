'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FolderKanban,
  FileCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Calendar,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  projects,
  agencies,
  financialYears,
  budgetLines,
  cashflowMonthly,
  getAgencyById,
  getFinancialYearById,
} from '@/lib/database';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  type ProjectStatus,
} from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, agency, isLoading, isDNPM, isAdmin } = useSupabaseAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) return null;

  // Get current financial year
  const currentFY = financialYears.find(fy => fy.status === 'open');

  // Filter projects based on user role
  const visibleProjects = isDNPM || isAdmin
    ? projects
    : projects.filter(p => p.agencyId === user.agency_id);

  const currentYearProjects = visibleProjects.filter(
    p => p.financialYearId === currentFY?.id
  );

  // Calculate statistics
  const stats = {
    total: currentYearProjects.length,
    draft: currentYearProjects.filter(p => p.status === 'draft').length,
    submitted: currentYearProjects.filter(p => p.status === 'submitted').length,
    underReview: currentYearProjects.filter(p => p.status === 'under_dnpm_review').length,
    approved: currentYearProjects.filter(p => p.status === 'approved_by_dnpm').length,
    returned: currentYearProjects.filter(p => p.status === 'returned').length,
  };

  // Calculate total budget
  const totalBudget = budgetLines
    .filter(bl => currentYearProjects.some(p => p.id === bl.projectId))
    .reduce((sum, bl) => sum + bl.revisedBudget, 0);

  // Get recent projects
  const recentProjects = [...currentYearProjects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // DNPM specific: pending approvals
  const pendingApprovals = isDNPM
    ? projects.filter(p => ['submitted', 'under_dnpm_review'].includes(p.status))
    : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="text-slate-500">
              {isDNPM || isAdmin
                ? 'National overview for all agencies'
                : `${agency?.agency_name || 'Your Agency'} submissions`}
            </p>
          </div>
          <div className="flex gap-3">
            {currentFY && (
              <Badge variant="outline" className="py-1.5 px-3 text-sm">
                <Calendar className="h-4 w-4 mr-1.5" />
                FY {currentFY.year}
              </Badge>
            )}
            {!isDNPM && !isAdmin && (
              <Link href="/projects/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-slate-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Projects</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending Review</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.submitted + stats.underReview}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Approved</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FileCheck className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Returned</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.returned}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Overview & Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Budget Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Budget Overview</CardTitle>
              <CardDescription>FY{currentFY?.year} consolidated budget summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Total Revised Budget</p>
                    <p className="text-3xl font-bold text-emerald-700">
                      {formatCurrency(totalBudget)}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-emerald-400" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Submission Progress</span>
                    <span className="font-medium">
                      {stats.total > 0
                        ? Math.round(((stats.submitted + stats.approved + stats.underReview) / stats.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.total > 0
                        ? ((stats.submitted + stats.approved + stats.underReview) / stats.total) * 100
                        : 0
                    }
                    className="h-2"
                  />
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-gray-300" />
                      Draft: {stats.draft}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Submitted: {stats.submitted}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Approved: {stats.approved}
                    </span>
                  </div>
                </div>

                {(isDNPM || isAdmin) && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center p-3 rounded-lg bg-slate-50">
                      <p className="text-2xl font-bold text-slate-700">
                        {agencies.filter(a => a.status === 'active').length}
                      </p>
                      <p className="text-xs text-slate-500">Active Agencies</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-50">
                      <p className="text-2xl font-bold text-slate-700">
                        {pendingApprovals.length}
                      </p>
                      <p className="text-xs text-slate-500">Pending Approvals</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isDNPM ? 'Pending Actions' : 'Quick Actions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDNPM ? (
                // DNPM View: Show pending approvals
                pendingApprovals.length > 0 ? (
                  pendingApprovals.slice(0, 4).map(project => {
                    const projectAgency = getAgencyById(project.agencyId);
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="p-3 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {project.projectTitle}
                              </p>
                              <p className="text-xs text-slate-500">
                                {projectAgency?.agencyCode}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`ml-2 text-xs ${PROJECT_STATUS_COLORS[project.status]}`}
                            >
                              {PROJECT_STATUS_LABELS[project.status]}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-400" />
                    <p>No pending approvals</p>
                  </div>
                )
              ) : (
                // Agency View: Quick actions
                <>
                  <Link href="/projects/new" className="block">
                    <div className="p-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-200 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-emerald-700" />
                        </div>
                        <span className="font-medium text-emerald-700">Create New Project</span>
                      </div>
                    </div>
                  </Link>

                  {stats.draft > 0 && (
                    <Link href="/projects?status=draft" className="block">
                      <div className="p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <FileCheck className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm text-slate-700">
                              Complete {stats.draft} draft{stats.draft > 1 ? 's' : ''}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </Link>
                  )}

                  {stats.returned > 0 && (
                    <Link href="/projects?status=returned" className="block">
                      <div className="p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-200 flex items-center justify-center">
                              <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <span className="text-sm text-red-700">
                              Review {stats.returned} returned project{stats.returned > 1 ? 's' : ''}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-red-400" />
                        </div>
                      </div>
                    </Link>
                  )}

                  {currentFY && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Deadline</p>
                          <p className="text-xs text-amber-600">
                            {new Date(currentFY.submissionDeadline).toLocaleDateString('en-PG', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Projects</CardTitle>
              <CardDescription>Latest project submissions and updates</CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      Project
                    </th>
                    {(isDNPM || isAdmin) && (
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                        Agency
                      </th>
                    )}
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map(project => {
                    const projectAgency = getAgencyById(project.agencyId);
                    return (
                      <tr
                        key={project.id}
                        className="border-b last:border-0 hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{project.projectTitle}</p>
                            <p className="text-xs text-slate-500">{project.projectCode}</p>
                          </div>
                        </td>
                        {(isDNPM || isAdmin) && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-600">
                                {projectAgency?.agencyCode}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={PROJECT_STATUS_COLORS[project.status]}
                          >
                            {PROJECT_STATUS_LABELS[project.status]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-slate-500">
                          {new Date(project.updatedAt).toLocaleDateString('en-PG', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                  {recentProjects.length === 0 && (
                    <tr>
                      <td colSpan={isDNPM || isAdmin ? 4 : 3} className="py-8 text-center text-slate-500">
                        No projects found. Create your first project to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
