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
  ShoppingCart,
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileIcon,
  Loader2,
  TrendingUp,
  Package,
  MapPin,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  financialYears,
  agencies,
  procurementPlans,
  procurementPlanItems,
  getAgencyById,
  getFundSourceById,
  getProcurementMethodById,
  getContractTypeById,
  getProvinceById,
  getProcurementPlansByFinancialYearId,
  getProcurementItemsByFinancialYear,
  fundSources,
  procurementMethods,
  contractTypes,
  provinces,
} from '@/lib/database';
import {
  PROCUREMENT_PLAN_STATUS_LABELS,
  PROCUREMENT_PLAN_STATUS_COLORS,
  LOCATION_SCOPE_LABELS,
  type Quarter,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const COLORS = ['#0f766e', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#2563eb', '#8b5cf6', '#ec4899'];

export default function NationalProcurementSummaryPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && !isDNPM && !isAdmin) {
      router.push('/procurement');
    }
    const currentFY = financialYears.find(fy => fy.status === 'open');
    if (currentFY && !selectedYear) {
      setSelectedYear(currentFY.id);
    }
  }, [user, isLoading, isDNPM, isAdmin, router, selectedYear]);

  // Calculate national summary
  const summary = useMemo(() => {
    const plans = getProcurementPlansByFinancialYearId(selectedYear);
    const items = getProcurementItemsByFinancialYear(selectedYear);

    const totalValue = items.reduce((sum, item) => sum + item.estimatedTotalCost, 0);
    const q1Total = items.reduce((sum, item) => sum + item.q1Budget, 0);
    const q2Total = items.reduce((sum, item) => sum + item.q2Budget, 0);
    const q3Total = items.reduce((sum, item) => sum + item.q3Budget, 0);
    const q4Total = items.reduce((sum, item) => sum + item.q4Budget, 0);

    // By Agency
    const byAgency: Record<string, { planCount: number; itemCount: number; value: number }> = {};
    plans.forEach(plan => {
      const agency = getAgencyById(plan.agencyId);
      if (!agency) return;
      if (!byAgency[agency.agencyCode || agency.id]) {
        byAgency[agency.agencyCode || agency.id] = { planCount: 0, itemCount: 0, value: 0 };
      }
      byAgency[agency.agencyCode || agency.id].planCount++;
    });
    items.forEach(item => {
      const plan = plans.find(p => p.id === item.procurementPlanId);
      if (!plan) return;
      const agency = getAgencyById(plan.agencyId);
      if (!agency) return;
      byAgency[agency.agencyCode || agency.id].itemCount++;
      byAgency[agency.agencyCode || agency.id].value += item.estimatedTotalCost;
    });

    // By Fund Source
    const byFundSource: Record<string, { count: number; value: number }> = {};
    plans.forEach(plan => {
      const fs = getFundSourceById(plan.fundSourceId);
      if (!fs) return;
      if (!byFundSource[fs.name]) {
        byFundSource[fs.name] = { count: 0, value: 0 };
      }
      byFundSource[fs.name].count++;
      byFundSource[fs.name].value += plan.totalEstimatedValue;
    });

    // By Procurement Method
    const byMethod: Record<string, { count: number; value: number }> = {};
    items.forEach(item => {
      const method = getProcurementMethodById(item.procurementMethodId);
      if (!method) return;
      if (!byMethod[method.name]) {
        byMethod[method.name] = { count: 0, value: 0 };
      }
      byMethod[method.name].count++;
      byMethod[method.name].value += item.estimatedTotalCost;
    });

    // By Contract Type
    const byContractType: Record<string, { count: number; value: number }> = {};
    items.forEach(item => {
      const ct = getContractTypeById(item.contractTypeId);
      if (!ct) return;
      if (!byContractType[ct.name]) {
        byContractType[ct.name] = { count: 0, value: 0 };
      }
      byContractType[ct.name].count++;
      byContractType[ct.name].value += item.estimatedTotalCost;
    });

    // By Location
    const byLocation: Record<string, { count: number; value: number }> = {};
    items.forEach(item => {
      const scope = LOCATION_SCOPE_LABELS[item.locationScope] || item.locationScope;
      if (!byLocation[scope]) {
        byLocation[scope] = { count: 0, value: 0 };
      }
      byLocation[scope].count++;
      byLocation[scope].value += item.estimatedTotalCost;
    });

    // By Province (for provincial/district scope)
    const byProvince: Record<string, { count: number; value: number }> = {};
    items.forEach(item => {
      if (item.provinceId) {
        const province = getProvinceById(item.provinceId);
        if (province) {
          if (!byProvince[province.name]) {
            byProvince[province.name] = { count: 0, value: 0 };
          }
          byProvince[province.name].count++;
          byProvince[province.name].value += item.estimatedTotalCost;
        }
      }
    });

    return {
      totalPlans: plans.length,
      totalItems: items.length,
      totalValue,
      q1Total,
      q2Total,
      q3Total,
      q4Total,
      byAgency,
      byFundSource,
      byMethod,
      byContractType,
      byLocation,
      byProvince,
    };
  }, [selectedYear]);

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

  // Chart data
  const quarterlyChartData = [
    { name: 'Q1', value: summary.q1Total },
    { name: 'Q2', value: summary.q2Total },
    { name: 'Q3', value: summary.q3Total },
    { name: 'Q4', value: summary.q4Total },
  ];

  const agencyChartData = Object.entries(summary.byAgency)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 6)
    .map(([name, data]) => ({ name, value: data.value }));

  const methodChartData = Object.entries(summary.byMethod)
    .map(([name, data]) => ({ name, value: data.value, count: data.count }));

  const contractTypeChartData = Object.entries(summary.byContractType)
    .map(([name, data]) => ({ name, value: data.value }));

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
        title="National Procurement Summary"
        subtitle={`FY${selectedFY?.year || ''} | Consolidated across all agencies`}
      />

      <div className="p-6 space-y-6">
        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/procurement">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
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
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileIcon className="h-4 w-4 mr-2 text-red-600" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-200 col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-700 dark:text-teal-300">Total Procurement Value</p>
                  <p className="text-3xl font-bold text-teal-900 dark:text-white">{formatCurrency(summary.totalValue)}</p>
                  <p className="text-xs text-teal-600">{formatFullCurrency(summary.totalValue)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-teal-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total Plans</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalPlans}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total Items</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Agencies</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{Object.keys(summary.byAgency).length}</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Avg per Plan</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {summary.totalPlans > 0 ? formatCurrency(summary.totalValue / summary.totalPlans) : 'K0'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agency">By Agency</TabsTrigger>
            <TabsTrigger value="method">By Method</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quarterly Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-teal-600" />
                    Quarterly Procurement Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip formatter={(value) => formatFullCurrency(value as number)} />
                        <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* By Contract Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-teal-600" />
                    Distribution by Contract Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={contractTypeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {contractTypeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatFullCurrency(value as number)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Agencies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  Top Agencies by Procurement Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agencyChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatFullCurrency(value as number)} />
                      <Bar dataKey="value" fill="#0891b2" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agency" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Procurement by Agency</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agency</TableHead>
                        <TableHead className="text-center">Plans</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-right">% of National</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(summary.byAgency)
                        .sort((a, b) => b[1].value - a[1].value)
                        .map(([agency, data]) => {
                          const percentage = summary.totalValue > 0 ? (data.value / summary.totalValue) * 100 : 0;
                          return (
                            <TableRow key={agency}>
                              <TableCell className="font-medium">{agency}</TableCell>
                              <TableCell className="text-center">{data.planCount}</TableCell>
                              <TableCell className="text-center">{data.itemCount}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(data.value)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Progress value={percentage} className="w-16 h-2" />
                                  <span className="text-sm text-slate-500">{percentage.toFixed(1)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="method" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">By Procurement Method</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-center">Items</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(summary.byMethod)
                          .sort((a, b) => b[1].value - a[1].value)
                          .map(([method, data]) => (
                            <TableRow key={method}>
                              <TableCell className="font-medium">{method}</TableCell>
                              <TableCell className="text-center">{data.count}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(data.value)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">By Location Scope</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-center">Items</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(summary.byLocation)
                          .sort((a, b) => b[1].value - a[1].value)
                          .map(([location, data]) => (
                            <TableRow key={location}>
                              <TableCell className="font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                {location}
                              </TableCell>
                              <TableCell className="text-center">{data.count}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(data.value)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quarterly" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Quarterly Budget Distribution</CardTitle>
                <CardDescription>National procurement pipeline by quarter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Q1 (Jan-Mar)', value: summary.q1Total, color: 'teal' },
                    { label: 'Q2 (Apr-Jun)', value: summary.q2Total, color: 'blue' },
                    { label: 'Q3 (Jul-Sep)', value: summary.q3Total, color: 'purple' },
                    { label: 'Q4 (Oct-Dec)', value: summary.q4Total, color: 'amber' },
                  ].map(({ label, value, color }) => {
                    const percentage = summary.totalValue > 0 ? (value / summary.totalValue) * 100 : 0;
                    return (
                      <div key={label} className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                          <span className="text-sm text-slate-500">{percentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2 mb-2" />
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(value)}</p>
                        <p className="text-xs text-slate-500">{formatFullCurrency(value)}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">Annual Total</span>
                    <span className="text-2xl font-bold text-teal-600">{formatCurrency(summary.totalValue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
