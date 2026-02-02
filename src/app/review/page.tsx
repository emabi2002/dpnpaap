'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileCheck,
  Loader2,
  MessageSquare,
  Send,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import {
  projects,
  agencies,
  financialYears,
  budgetLines,
  getAgencyById,
  getFinancialYearById,
  getBudgetLinesByProjectId,
} from '@/lib/database';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  type Project,
} from '@/lib/types';

export default function ReviewPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && !isDNPM && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isDNPM, isAdmin, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProjectBudget = (projectId: string) => {
    return getBudgetLinesByProjectId(projectId).reduce(
      (sum, line) => sum + line.revisedBudget,
      0
    );
  };

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    if (selectedAgency !== 'all') {
      filtered = filtered.filter(p => p.agencyId === selectedAgency);
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(p => p.financialYearId === selectedYear);
    }

    if (activeTab === 'pending') {
      filtered = filtered.filter(p =>
        ['submitted', 'under_dnpm_review'].includes(p.status)
      );
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(p =>
        ['approved_by_dnpm', 'locked'].includes(p.status)
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [selectedAgency, selectedYear, activeTab]);

  // Statistics
  const stats = useMemo(() => {
    const pending = projects.filter(p =>
      ['submitted', 'under_dnpm_review'].includes(p.status)
    );
    const approved = projects.filter(p =>
      ['approved_by_dnpm', 'locked'].includes(p.status)
    );
    const returned = projects.filter(p => p.status === 'returned');

    const totalPendingBudget = pending.reduce(
      (sum, p) => sum + getProjectBudget(p.id),
      0
    );
    const totalApprovedBudget = approved.reduce(
      (sum, p) => sum + getProjectBudget(p.id),
      0
    );

    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      returnedCount: returned.length,
      totalPendingBudget,
      totalApprovedBudget,
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || (!isDNPM && !isAdmin)) return null;

  const activeAgencies = agencies.filter(a => a.status === 'active');
  const currentFY = financialYears.find(fy => fy.status === 'open');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Console</h1>
          <p className="text-slate-500">
            Review and approve agency budget submissions
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700">Pending Review</p>
                  <p className="text-2xl font-bold text-amber-800">
                    {stats.pendingCount}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {formatCurrency(stats.totalPendingBudget)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700">Approved</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {stats.approvedCount}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {formatCurrency(stats.totalApprovedBudget)}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Returned</p>
                  <p className="text-2xl font-bold text-red-800">
                    {stats.returnedCount}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Awaiting corrections
                  </p>
                </div>
                <Undo2 className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Active Agencies</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {activeAgencies.length}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    FY {currentFY?.year} submissions
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  {activeAgencies.map(agency => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.agencyCode} - {agency.agencyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {financialYears.map(fy => (
                    <SelectItem key={fy.id} value={fy.id}>
                      FY {fy.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Project List */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({stats.pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved ({stats.approvedCount})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              All Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {filteredProjects.map(project => {
                      const agency = getAgencyById(project.agencyId);
                      const fy = getFinancialYearById(project.financialYearId);
                      const budget = getProjectBudget(project.id);

                      return (
                        <div
                          key={project.id}
                          className="p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="font-medium text-slate-900 hover:text-emerald-600 truncate"
                                >
                                  {project.projectTitle}
                                </Link>
                                <Badge
                                  variant="outline"
                                  className={PROJECT_STATUS_COLORS[project.status]}
                                >
                                  {PROJECT_STATUS_LABELS[project.status]}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {agency?.agencyCode}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  FY {fy?.year}
                                </span>
                                {project.projectCode && (
                                  <span className="text-slate-400">
                                    {project.projectCode}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold text-slate-900">
                                {formatCurrency(budget)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Updated {new Date(project.updatedAt).toLocaleDateString('en-PG', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/projects/${project.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredProjects.length === 0 && (
                      <div className="p-12 text-center text-slate-500">
                        <FileCheck className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p>No projects found</p>
                        <p className="text-sm mt-1">
                          {activeTab === 'pending'
                            ? 'All submissions have been processed'
                            : 'No matching projects'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
