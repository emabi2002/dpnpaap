'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Filter,
  Building2,
  Calendar,
  Loader2,
  FolderKanban,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
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
  type ProjectStatus,
} from '@/lib/types';

function ProjectsPageLoading() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </AppLayout>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageLoading />}>
      <ProjectsPageContent />
    </Suspense>
  );
}

function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, agency, isLoading, isDNPM, isAdmin } = useSupabaseAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Filter projects based on user role and filters
  const filteredProjects = useMemo(() => {
    let filtered = isDNPM || isAdmin
      ? projects
      : projects.filter(p => p.agencyId === user?.agency_id);

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(p => p.financialYearId === yearFilter);
    }

    if (agencyFilter !== 'all') {
      filtered = filtered.filter(p => p.agencyId === agencyFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.projectTitle.toLowerCase().includes(query) ||
          p.projectCode?.toLowerCase().includes(query) ||
          p.division?.toLowerCase().includes(query)
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [user, isDNPM, isAdmin, statusFilter, yearFilter, agencyFilter, searchQuery]);

  // Calculate total budget for each project
  const getProjectBudget = (projectId: string) => {
    const lines = getBudgetLinesByProjectId(projectId);
    return lines.reduce((sum, line) => sum + line.revisedBudget, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) return null;

  const currentFY = financialYears.find(fy => fy.status === 'open');
  const activeAgencies = agencies.filter(a => a.status === 'active');

  return (
    <AppLayout>
      <Header
        title="Projects"
        subtitle={isDNPM || isAdmin
          ? 'Manage and review all agency project submissions'
          : `Manage your agency's project submissions`}
        tabs={[
          { label: 'All Projects', href: '/projects' },
          { label: 'My Drafts', href: '/projects?status=draft' },
          { label: 'Submitted', href: '/projects?status=submitted' },
        ]}
      />
      <div className="p-6 space-y-6">

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by title, code, or division..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="under_dnpm_review">Under Review</SelectItem>
                  <SelectItem value="approved_by_dnpm">Approved</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>

              {/* Year Filter */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
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

              {/* Agency Filter (DNPM only) */}
              {(isDNPM || isAdmin) && (
                <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Agencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agencies</SelectItem>
                    {activeAgencies.map(agency => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.agencyCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </p>
          {statusFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="text-slate-500"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Projects Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Project</TableHead>
                  {(isDNPM || isAdmin) && <TableHead>Agency</TableHead>}
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revised Budget</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map(project => {
                  const projectAgency = getAgencyById(project.agencyId);
                  const projectFY = getFinancialYearById(project.financialYearId);
                  const projectBudget = getProjectBudget(project.id);

                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {project.projectTitle}
                            </p>
                            <p className="text-sm text-slate-500">
                              {project.projectCode || 'No code'}
                              {project.division && ` • ${project.division}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      {(isDNPM || isAdmin) && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{projectAgency?.agencyCode}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {projectFY?.year}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={PROJECT_STATUS_COLORS[project.status]}
                        >
                          {PROJECT_STATUS_LABELS[project.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(projectBudget)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-500">
                        {new Date(project.updatedAt).toLocaleDateString('en-PG', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isDNPM || isAdmin ? 6 : 5}
                      className="h-32 text-center text-slate-500"
                    >
                      <FolderKanban className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                      <p>No projects found</p>
                      {!isDNPM && (
                        <Link href="/projects/new">
                          <Button variant="link" className="mt-2">
                            Create your first project
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
