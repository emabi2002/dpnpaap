'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  PieChart,
  TrendingUp,
  Users,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import {
  projects,
  agencies,
  financialYears,
  budgetLines,
  donorCodes,
  cashflowMonthly,
  getAgencyById,
  getBudgetLinesByProjectId,
  getCashflowByBudgetLineId,
} from '@/lib/database';
import { MONTH_LABELS, calculateCashflowTotals } from '@/lib/types';

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && !isDNPM && !isAdmin) {
      router.push('/dashboard');
    }
    // Set current year as default
    const currentFY = financialYears.find(fy => fy.status === 'open');
    if (currentFY && !selectedYear) {
      setSelectedYear(currentFY.id);
    }
  }, [user, isLoading, isDNPM, isAdmin, router, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate reports data
  const reportData = useMemo(() => {
    const yearProjects = projects.filter(p => p.financialYearId === selectedYear);

    // Budget by Agency
    const byAgency = agencies.map(agency => {
      const agencyProjects = yearProjects.filter(p => p.agencyId === agency.id);
      const agencyBudgetLines = agencyProjects.flatMap(p => getBudgetLinesByProjectId(p.id));
      const totalOriginal = agencyBudgetLines.reduce((sum, bl) => sum + bl.originalBudget, 0);
      const totalRevised = agencyBudgetLines.reduce((sum, bl) => sum + bl.revisedBudget, 0);
      const approvedProjects = agencyProjects.filter(p =>
        ['approved_by_dnpm', 'locked'].includes(p.status)
      ).length;

      return {
        agency,
        projectCount: agencyProjects.length,
        approvedCount: approvedProjects,
        originalBudget: totalOriginal,
        revisedBudget: totalRevised,
      };
    }).filter(a => a.projectCount > 0);

    // Budget by Donor
    const byDonor = donorCodes.map(donor => {
      const donorBudgetLines = yearProjects.flatMap(p =>
        getBudgetLinesByProjectId(p.id).filter(bl => bl.donorCodeId === donor.id)
      );
      const totalOriginal = donorBudgetLines.reduce((sum, bl) => sum + bl.originalBudget, 0);
      const totalRevised = donorBudgetLines.reduce((sum, bl) => sum + bl.revisedBudget, 0);

      const monthlyTotals = {
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
      };

      donorBudgetLines.forEach(bl => {
        const cf = getCashflowByBudgetLineId(bl.id);
        if (cf) {
          Object.keys(monthlyTotals).forEach(month => {
            monthlyTotals[month as keyof typeof monthlyTotals] += cf[month as keyof typeof cf] as number;
          });
        }
      });

      return {
        donor,
        originalBudget: totalOriginal,
        revisedBudget: totalRevised,
        monthlyTotals,
      };
    }).filter(d => d.revisedBudget > 0);

    // Monthly Cash Requirements (National)
    const monthlyNational = {
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
    };

    yearProjects.forEach(p => {
      const projectBLs = getBudgetLinesByProjectId(p.id);
      projectBLs.forEach(bl => {
        const cf = getCashflowByBudgetLineId(bl.id);
        if (cf) {
          Object.keys(monthlyNational).forEach(month => {
            monthlyNational[month as keyof typeof monthlyNational] += cf[month as keyof typeof cf] as number;
          });
        }
      });
    });

    // Summary stats
    const allBudgetLines = yearProjects.flatMap(p => getBudgetLinesByProjectId(p.id));
    const totalOriginal = allBudgetLines.reduce((sum, bl) => sum + bl.originalBudget, 0);
    const totalRevised = allBudgetLines.reduce((sum, bl) => sum + bl.revisedBudget, 0);
    const approvedBudget = yearProjects
      .filter(p => ['approved_by_dnpm', 'locked'].includes(p.status))
      .flatMap(p => getBudgetLinesByProjectId(p.id))
      .reduce((sum, bl) => sum + bl.revisedBudget, 0);

    return {
      byAgency,
      byDonor,
      monthlyNational,
      summary: {
        totalProjects: yearProjects.length,
        totalOriginal,
        totalRevised,
        approvedBudget,
        approvalRate: yearProjects.length > 0
          ? (yearProjects.filter(p => ['approved_by_dnpm', 'locked'].includes(p.status)).length / yearProjects.length) * 100
          : 0,
      },
    };
  }, [selectedYear]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || (!isDNPM && !isAdmin)) return null;

  const selectedFY = financialYears.find(fy => fy.id === selectedYear);

  return (
    <AppLayout>
      <Header
        title="National Reports"
        subtitle="Consolidated budget and cashflow analysis across all agencies"
        tabs={[
          { label: 'Overview', href: '/reports' },
          { label: 'By Agency', href: '/reports?view=agency' },
          { label: 'By Donor', href: '/reports?view=donor' },
        ]}
      />
      <div className="p-6 space-y-6">
        {/* Year Selector */}
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {financialYears.map(fy => (
                <SelectItem key={fy.id} value={fy.id}>
                  FY {fy.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Projects</p>
                  <p className="text-2xl font-bold">{reportData.summary.totalProjects}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Revised Budget</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(reportData.summary.totalRevised)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Approved Budget</p>
                  <p className="text-2xl font-bold text-sky-600">
                    {formatCurrency(reportData.summary.approvedBudget)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-sky-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Approval Rate</p>
                  <p className="text-2xl font-bold">
                    {reportData.summary.approvalRate.toFixed(0)}%
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-amber-400" />
              </div>
              <Progress
                value={reportData.summary.approvalRate}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>
        </div>

        {/* Monthly Cash Requirements Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Cash Requirements - National
            </CardTitle>
            <CardDescription>
              Projected monthly cash outflow across all approved projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {MONTH_LABELS.map((month, i) => {
                const monthKey = month.toLowerCase().slice(0, 3) as keyof typeof reportData.monthlyNational;
                const value = reportData.monthlyNational[monthKey];
                const maxValue = Math.max(...Object.values(reportData.monthlyNational));
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

                return (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-slate-100 rounded-t relative" style={{ height: '200px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{month}</p>
                    <p className="text-xs font-medium">
                      {(value / 1000000).toFixed(1)}M
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Budget by Agency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Budget by Agency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Revised Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.byAgency.map(row => (
                    <TableRow key={row.agency.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.agency.agencyCode}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">
                            {row.agency.agencyName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {row.approvedCount}/{row.projectCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.revisedBudget)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reportData.byAgency.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                        No data for selected year
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Budget by Donor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Budget by Donor/Funding Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead className="text-right">Original</TableHead>
                    <TableHead className="text-right">Revised</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.byDonor.map(row => {
                    const percentage = reportData.summary.totalRevised > 0
                      ? (row.revisedBudget / reportData.summary.totalRevised) * 100
                      : 0;

                    return (
                      <TableRow key={row.donor.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-slate-200 text-xs font-medium">
                              {row.donor.code}
                            </span>
                            <div>
                              <p className="font-medium">{row.donor.donorName}</p>
                              <Progress value={percentage} className="h-1 w-20 mt-1" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-slate-500">
                          {formatCurrency(row.originalBudget)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.revisedBudget)}
                          <span className="text-xs text-slate-500 ml-1">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {reportData.byDonor.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                        No data for selected year
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
