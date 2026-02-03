'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Plus,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Search,
  Eye,
  Edit,
  Loader2,
  MoreHorizontal,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  financialYears,
  agencies,
  procurementPlans,
  procurementPlanItems,
  getAgencyById,
  getFinancialYearById,
  getFundSourceById,
  getProcurementPlansByFinancialYearId,
  getProcurementPlanItemsByPlanId,
} from '@/lib/database';
import {
  PROCUREMENT_PLAN_STATUS_LABELS,
  PROCUREMENT_PLAN_STATUS_COLORS,
  type ProcurementPlanStatus,
  type ProcurementPlan,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ProcurementPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Set current year as default
    const currentFY = financialYears.find(fy => fy.status === 'open');
    if (currentFY && !selectedYear) {
      setSelectedYear(currentFY.id);
    }
  }, [user, isLoading, router, selectedYear]);

  // Get filtered plans
  const filteredPlans = useMemo(() => {
    let plans = getProcurementPlansByFinancialYearId(selectedYear);

    // Filter by agency (for agency users, only show their agency)
    if (!isDNPM && !isAdmin && user?.agency_id) {
      plans = plans.filter(pp => pp.agencyId === user.agency_id);
    } else if (selectedAgency !== 'all') {
      plans = plans.filter(pp => pp.agencyId === selectedAgency);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      plans = plans.filter(pp => pp.status === selectedStatus);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      plans = plans.filter(pp =>
        pp.planName.toLowerCase().includes(query) ||
        getAgencyById(pp.agencyId)?.agencyCode?.toLowerCase().includes(query) ||
        getAgencyById(pp.agencyId)?.agencyName?.toLowerCase().includes(query)
      );
    }

    return plans;
  }, [selectedYear, selectedAgency, selectedStatus, searchQuery, user, isDNPM, isAdmin]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const yearPlans = getProcurementPlansByFinancialYearId(selectedYear);
    const totalValue = yearPlans.reduce((sum, pp) => sum + pp.totalEstimatedValue, 0);
    const totalItems = yearPlans.reduce((sum, pp) => sum + pp.itemCount, 0);
    const approvedCount = yearPlans.filter(pp =>
      ['approved_by_dnpm', 'locked'].includes(pp.status)
    ).length;
    const pendingCount = yearPlans.filter(pp =>
      ['submitted', 'under_dnpm_review', 'approved_by_agency'].includes(pp.status)
    ).length;
    const draftCount = yearPlans.filter(pp => pp.status === 'draft').length;

    return {
      totalPlans: yearPlans.length,
      totalValue,
      totalItems,
      approvedCount,
      pendingCount,
      draftCount,
    };
  }, [selectedYear]);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) return null;

  const selectedFY = financialYears.find(fy => fy.id === selectedYear);

  return (
    <AppLayout>
      <Header
        title="Annual Procurement Plans"
        subtitle={`FY${selectedFY?.year || ''} | Consolidated Procurement Planning`}
        tabs={[
          { label: 'All Plans', href: '/procurement' },
          { label: 'By Agency', href: '/procurement?view=agency' },
          { label: 'National Summary', href: '/procurement/national' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  {agencies.filter(a => a.status === 'active').map(agency => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.agencyCode} - {agency.agencyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved_by_agency">Approved by Agency</SelectItem>
                <SelectItem value="under_dnpm_review">Under DNPM Review</SelectItem>
                <SelectItem value="approved_by_dnpm">Approved by DNPM</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
          </div>

          <Link href="/procurement/new">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Procurement Plan
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-700 dark:text-teal-300">Total Plans</p>
                  <p className="text-2xl font-bold text-teal-900 dark:text-white">{stats.totalPlans}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total Items</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700">Approved</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.approvedCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700">Pending</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Draft</p>
                  <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{stats.draftCount}</p>
                </div>
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-teal-600" />
              Procurement Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Plan Name</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Fund Source</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map(plan => {
                    const agency = getAgencyById(plan.agencyId);
                    const fundSource = getFundSourceById(plan.fundSourceId);
                    const items = getProcurementPlanItemsByPlanId(plan.id);

                    return (
                      <TableRow key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableCell>
                          <div>
                            <Link href={`/procurement/${plan.id}`} className="font-medium text-slate-900 dark:text-white hover:text-teal-600">
                              {plan.planName}
                            </Link>
                            {plan.agencyBudgetCode && (
                              <p className="text-xs text-slate-500 mt-0.5">Code: {plan.agencyBudgetCode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="font-medium text-sm">{agency?.agencyCode}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[120px]">{agency?.agencyName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {fundSource?.code || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-medium">
                            {plan.itemCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(plan.totalEstimatedValue)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFullCurrency(plan.totalEstimatedValue)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', PROCUREMENT_PLAN_STATUS_COLORS[plan.status])}>
                            {PROCUREMENT_PLAN_STATUS_LABELS[plan.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-500">
                            <p>{new Date(plan.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                            <p>to {new Date(plan.periodEnd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/procurement/${plan.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {plan.status === 'draft' && (
                                <DropdownMenuItem onClick={() => router.push(`/procurement/${plan.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Plan
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredPlans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-slate-500">No procurement plans found</p>
                        <Link href="/procurement/new">
                          <Button variant="link" className="mt-2">
                            Create your first procurement plan
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
