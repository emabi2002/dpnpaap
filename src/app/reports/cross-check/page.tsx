'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  AlertCircle,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import {
  financialYears,
  agencies,
  projects,
  budgetLines,
  cashflowMonthly,
  workplans,
  workplanActivities,
  procurementPlans,
  procurementPlanItems,
  getAgencyById,
  getFinancialYearById,
  getBudgetLinesByProjectId,
  getCashflowByBudgetLineId,
  getWorkplansByFinancialYearId,
  getActivitiesByWorkplanId,
  getProcurementPlansByFinancialYearId,
  getProcurementPlanItemsByPlanId,
} from '@/lib/database';
import { cn } from '@/lib/utils';

interface AgencyCrossCheck {
  agencyId: string;
  agencyCode: string;
  agencyName: string;
  projectBudget: number;
  cashflowTotal: number;
  workplanBudget: number;
  procurementValue: number;
  projectVsCashflow: number;
  workplanVsProcurement: number;
  hasDiscrepancy: boolean;
  discrepancyLevel: 'none' | 'minor' | 'major' | 'critical';
}

export default function CrossCheckDashboardPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [discrepancyFilter, setDiscrepancyFilter] = useState('all');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    const currentFY = financialYears.find(fy => fy.status === 'open');
    if (currentFY && !selectedYear) {
      setSelectedYear(currentFY.id);
    }
  }, [user, isLoading, router, selectedYear]);

  // Calculate cross-check data
  const crossCheckData = useMemo(() => {
    const agencyMap = new Map<string, AgencyCrossCheck>();

    // Initialize all agencies
    agencies.filter(a => a.status === 'active').forEach(agency => {
      agencyMap.set(agency.id, {
        agencyId: agency.id,
        agencyCode: agency.agencyCode || '',
        agencyName: agency.agencyName,
        projectBudget: 0,
        cashflowTotal: 0,
        workplanBudget: 0,
        procurementValue: 0,
        projectVsCashflow: 0,
        workplanVsProcurement: 0,
        hasDiscrepancy: false,
        discrepancyLevel: 'none',
      });
    });

    // Calculate Project Budgets
    projects.filter(p => p.financialYearId === selectedYear).forEach(project => {
      const bl = getBudgetLinesByProjectId(project.id);
      const totalBudget = bl.reduce((sum, b) => sum + b.revisedBudget, 0);
      const existing = agencyMap.get(project.agencyId);
      if (existing) {
        existing.projectBudget += totalBudget;
      }
    });

    // Calculate Cashflow Totals
    projects.filter(p => p.financialYearId === selectedYear).forEach(project => {
      const bl = getBudgetLinesByProjectId(project.id);
      bl.forEach(b => {
        const cf = getCashflowByBudgetLineId(b.id);
        if (cf) {
          const cfTotal = cf.jan + cf.feb + cf.mar + cf.apr + cf.may + cf.jun +
            cf.jul + cf.aug + cf.sep + cf.oct + cf.nov + cf.dec;
          const existing = agencyMap.get(project.agencyId);
          if (existing) {
            existing.cashflowTotal += cfTotal;
          }
        }
      });
    });

    // Calculate Workplan Budgets
    const yearWorkplans = getWorkplansByFinancialYearId(selectedYear);
    yearWorkplans.forEach(wp => {
      const activities = getActivitiesByWorkplanId(wp.id);
      const totalBudget = activities.reduce((sum, a) => sum + a.totalBudget, 0);
      const existing = agencyMap.get(wp.agencyId);
      if (existing) {
        existing.workplanBudget += totalBudget;
      }
    });

    // Calculate Procurement Values
    const yearPlans = getProcurementPlansByFinancialYearId(selectedYear);
    yearPlans.forEach(plan => {
      const items = getProcurementPlanItemsByPlanId(plan.id);
      const totalValue = items.reduce((sum, i) => sum + i.annualBudgetYearValue, 0);
      const existing = agencyMap.get(plan.agencyId);
      if (existing) {
        existing.procurementValue += totalValue;
      }
    });

    // Calculate discrepancies
    agencyMap.forEach(agency => {
      // Project vs Cashflow comparison
      if (agency.projectBudget > 0) {
        agency.projectVsCashflow = ((agency.cashflowTotal - agency.projectBudget) / agency.projectBudget) * 100;
      }

      // Workplan vs Procurement comparison
      if (agency.workplanBudget > 0) {
        agency.workplanVsProcurement = ((agency.procurementValue - agency.workplanBudget) / agency.workplanBudget) * 100;
      }

      // Determine discrepancy level
      const maxVariance = Math.max(
        Math.abs(agency.projectVsCashflow),
        Math.abs(agency.workplanVsProcurement)
      );

      if (maxVariance > 20) {
        agency.discrepancyLevel = 'critical';
        agency.hasDiscrepancy = true;
      } else if (maxVariance > 10) {
        agency.discrepancyLevel = 'major';
        agency.hasDiscrepancy = true;
      } else if (maxVariance > 5) {
        agency.discrepancyLevel = 'minor';
        agency.hasDiscrepancy = true;
      }
    });

    return Array.from(agencyMap.values())
      .filter(a => a.projectBudget > 0 || a.workplanBudget > 0 || a.procurementValue > 0);
  }, [selectedYear]);

  // Filter data based on discrepancy filter
  const filteredData = useMemo(() => {
    if (discrepancyFilter === 'all') return crossCheckData;
    if (discrepancyFilter === 'discrepancies') return crossCheckData.filter(d => d.hasDiscrepancy);
    if (discrepancyFilter === 'critical') return crossCheckData.filter(d => d.discrepancyLevel === 'critical');
    if (discrepancyFilter === 'major') return crossCheckData.filter(d => d.discrepancyLevel === 'major' || d.discrepancyLevel === 'critical');
    return crossCheckData;
  }, [crossCheckData, discrepancyFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const totalProjectBudget = crossCheckData.reduce((sum, d) => sum + d.projectBudget, 0);
    const totalCashflow = crossCheckData.reduce((sum, d) => sum + d.cashflowTotal, 0);
    const totalWorkplan = crossCheckData.reduce((sum, d) => sum + d.workplanBudget, 0);
    const totalProcurement = crossCheckData.reduce((sum, d) => sum + d.procurementValue, 0);

    const criticalCount = crossCheckData.filter(d => d.discrepancyLevel === 'critical').length;
    const majorCount = crossCheckData.filter(d => d.discrepancyLevel === 'major').length;
    const minorCount = crossCheckData.filter(d => d.discrepancyLevel === 'minor').length;
    const alignedCount = crossCheckData.filter(d => !d.hasDiscrepancy).length;

    return {
      totalProjectBudget,
      totalCashflow,
      totalWorkplan,
      totalProcurement,
      projectCashflowVariance: totalProjectBudget > 0
        ? ((totalCashflow - totalProjectBudget) / totalProjectBudget) * 100
        : 0,
      workplanProcurementVariance: totalWorkplan > 0
        ? ((totalProcurement - totalWorkplan) / totalWorkplan) * 100
        : 0,
      criticalCount,
      majorCount,
      minorCount,
      alignedCount,
      totalAgencies: crossCheckData.length,
    };
  }, [crossCheckData]);

  // Chart data
  const comparisonChartData = crossCheckData.slice(0, 8).map(d => ({
    name: d.agencyCode,
    'Project Budget': d.projectBudget / 1000000,
    'Cashflow': d.cashflowTotal / 1000000,
    'Workplan': d.workplanBudget / 1000000,
    'Procurement': d.procurementValue / 1000000,
  }));

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `K${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `K${(amount / 1000).toFixed(0)}K`;
    }
    return `K${amount.toLocaleString()}`;
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDiscrepancyBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case 'major':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Major</Badge>;
      case 'minor':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Minor</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aligned</Badge>;
    }
  };

  const getVarianceIndicator = (variance: number) => {
    if (Math.abs(variance) < 1) return null;
    if (variance > 0) {
      return (
        <span className="flex items-center text-amber-600 text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{variance.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="flex items-center text-red-600 text-xs">
        <TrendingDown className="h-3 w-3 mr-1" />
        {variance.toFixed(1)}%
      </span>
    );
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
        title="Budget Cross-Check Dashboard"
        subtitle={`FY${selectedFY?.year || ''} | Comparing Project, Cashflow, Workplan & Procurement`}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Reports
              </Button>
            </Link>
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
            <Select value={discrepancyFilter} onValueChange={setDiscrepancyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Agencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agencies</SelectItem>
                <SelectItem value="discrepancies">With Discrepancies</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="major">Major & Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700">Project vs Cashflow</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.projectCashflowVariance > 0 ? '+' : ''}{stats.projectCashflowVariance.toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-600">
                    {formatCurrency(stats.totalProjectBudget)} vs {formatCurrency(stats.totalCashflow)}
                  </p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  Math.abs(stats.projectCashflowVariance) < 5 ? "bg-green-100" : "bg-amber-100"
                )}>
                  {Math.abs(stats.projectCashflowVariance) < 5 ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-700">Workplan vs Procurement</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {stats.workplanProcurementVariance > 0 ? '+' : ''}{stats.workplanProcurementVariance.toFixed(1)}%
                  </p>
                  <p className="text-xs text-teal-600">
                    {formatCurrency(stats.totalWorkplan)} vs {formatCurrency(stats.totalProcurement)}
                  </p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  Math.abs(stats.workplanProcurementVariance) < 5 ? "bg-green-100" : "bg-amber-100"
                )}>
                  {Math.abs(stats.workplanProcurementVariance) < 5 ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-700">Critical</p>
                  <p className="text-2xl font-bold text-red-900">{stats.criticalCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700">Aligned</p>
                  <p className="text-2xl font-bold text-green-900">{stats.alignedCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="issues">Issues ({stats.criticalCount + stats.majorCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                  Agency Budget Comparison
                </CardTitle>
                <CardDescription>
                  Comparing Project, Cashflow, Workplan, and Procurement values by agency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `${v}M`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => `K${Number(value).toFixed(1)}M`} />
                      <Legend />
                      <Bar dataKey="Project Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Cashflow" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Workplan" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Procurement" fill="#5eead4" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">National Totals Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Comparison</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        Project Budgets
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(stats.totalProjectBudget)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell>
                        <Badge variant="outline">Baseline</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                        Cashflow Totals
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(stats.totalCashflow)}</TableCell>
                      <TableCell className="text-right">
                        {getVarianceIndicator(stats.projectCashflowVariance)}
                      </TableCell>
                      <TableCell>
                        {Math.abs(stats.projectCashflowVariance) < 5
                          ? <Badge className="bg-green-100 text-green-800">Aligned</Badge>
                          : <Badge className="bg-amber-100 text-amber-800">Variance</Badge>
                        }
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-500" />
                        Workplan Budgets
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(stats.totalWorkplan)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell>
                        <Badge variant="outline">Baseline</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-emerald-500" />
                        Procurement Values
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(stats.totalProcurement)}</TableCell>
                      <TableCell className="text-right">
                        {getVarianceIndicator(stats.workplanProcurementVariance)}
                      </TableCell>
                      <TableCell>
                        {Math.abs(stats.workplanProcurementVariance) < 5
                          ? <Badge className="bg-green-100 text-green-800">Aligned</Badge>
                          : <Badge className="bg-amber-100 text-amber-800">Variance</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Agency Cross-Check Details</CardTitle>
                <CardDescription>
                  Detailed comparison of budget allocations across all planning modules
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agency</TableHead>
                        <TableHead className="text-right">Project Budget</TableHead>
                        <TableHead className="text-right">Cashflow</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead className="text-right">Workplan</TableHead>
                        <TableHead className="text-right">Procurement</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map(agency => (
                        <TableRow key={agency.agencyId} className={cn(
                          agency.discrepancyLevel === 'critical' && 'bg-red-50 dark:bg-red-900/10'
                        )}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              <div>
                                <p className="font-medium">{agency.agencyCode}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[120px]">{agency.agencyName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(agency.projectBudget)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(agency.cashflowTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {agency.projectBudget > 0 && getVarianceIndicator(agency.projectVsCashflow)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(agency.workplanBudget)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(agency.procurementValue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {agency.workplanBudget > 0 && getVarianceIndicator(agency.workplanVsProcurement)}
                          </TableCell>
                          <TableCell>
                            {getDiscrepancyBadge(agency.discrepancyLevel)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="mt-4 space-y-4">
            {crossCheckData.filter(d => d.hasDiscrepancy).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    All Budgets Aligned
                  </h3>
                  <p className="text-slate-500">
                    No significant discrepancies found between budget modules for this financial year.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Critical Issues */}
                {crossCheckData.filter(d => d.discrepancyLevel === 'critical').length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader className="bg-red-50 dark:bg-red-900/20">
                      <CardTitle className="text-base font-semibold text-red-800 flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        Critical Discrepancies ({crossCheckData.filter(d => d.discrepancyLevel === 'critical').length})
                      </CardTitle>
                      <CardDescription className="text-red-600">
                        Variance greater than 20% - requires immediate attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agency</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {crossCheckData.filter(d => d.discrepancyLevel === 'critical').map(agency => (
                            <TableRow key={agency.agencyId}>
                              <TableCell className="font-medium">{agency.agencyCode}</TableCell>
                              <TableCell>
                                {Math.abs(agency.projectVsCashflow) > Math.abs(agency.workplanVsProcurement)
                                  ? 'Project Budget vs Cashflow mismatch'
                                  : 'Workplan vs Procurement mismatch'
                                }
                              </TableCell>
                              <TableCell className="text-right text-red-600 font-semibold">
                                {Math.max(Math.abs(agency.projectVsCashflow), Math.abs(agency.workplanVsProcurement)).toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" className="gap-1">
                                  Review <ArrowRight className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Major Issues */}
                {crossCheckData.filter(d => d.discrepancyLevel === 'major').length > 0 && (
                  <Card className="border-amber-200">
                    <CardHeader className="bg-amber-50 dark:bg-amber-900/20">
                      <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Major Discrepancies ({crossCheckData.filter(d => d.discrepancyLevel === 'major').length})
                      </CardTitle>
                      <CardDescription className="text-amber-600">
                        Variance between 10-20% - should be reviewed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agency</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {crossCheckData.filter(d => d.discrepancyLevel === 'major').map(agency => (
                            <TableRow key={agency.agencyId}>
                              <TableCell className="font-medium">{agency.agencyCode}</TableCell>
                              <TableCell>
                                {Math.abs(agency.projectVsCashflow) > Math.abs(agency.workplanVsProcurement)
                                  ? 'Project Budget vs Cashflow mismatch'
                                  : 'Workplan vs Procurement mismatch'
                                }
                              </TableCell>
                              <TableCell className="text-right text-amber-600 font-semibold">
                                {Math.max(Math.abs(agency.projectVsCashflow), Math.abs(agency.workplanVsProcurement)).toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" className="gap-1">
                                  Review <ArrowRight className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
