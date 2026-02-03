'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  FileText,
  Plus,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  FileSpreadsheet,
  FileIcon,
  CheckCircle,
  Clock,
  Send,
  ArrowUpRight,
  Package,
  MapPin,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  getAgencyById,
  getFinancialYearById,
  getFundSourceById,
  getProcurementPlanById,
  getProcurementPlanItemsByPlanId,
  getProcurementMethodById,
  getContractTypeById,
  getUnitOfMeasureById,
  getProvinceById,
  getUNSPSCCodeById,
} from '@/lib/database';
import {
  PROCUREMENT_PLAN_STATUS_LABELS,
  PROCUREMENT_PLAN_STATUS_COLORS,
  LOCATION_SCOPE_LABELS,
  type ProcurementPlanStatus,
  type ProcurementPlan,
  type ProcurementPlanItem,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProcurementItemDialog } from '@/components/procurement/item-dialog';
import { ProcurementApprovalActions } from '@/components/procurement/approval-actions';
import { ProcurementBulkImport } from '@/components/procurement/bulk-import';
import { exportProcurementPlanToExcel, exportProcurementPlanToPDF } from '@/lib/procurement-export';

export default function ProcurementPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState('items');
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProcurementPlanItem | null>(null);

  const plan = getProcurementPlanById(planId);
  const items = getProcurementPlanItemsByPlanId(planId);
  const agency = plan ? getAgencyById(plan.agencyId) : null;
  const financialYear = plan ? getFinancialYearById(plan.financialYearId) : null;
  const fundSource = plan ? getFundSourceById(plan.fundSourceId) : null;

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + item.estimatedTotalCost, 0);
    const q1Total = items.reduce((sum, item) => sum + item.q1Budget, 0);
    const q2Total = items.reduce((sum, item) => sum + item.q2Budget, 0);
    const q3Total = items.reduce((sum, item) => sum + item.q3Budget, 0);
    const q4Total = items.reduce((sum, item) => sum + item.q4Budget, 0);

    const byMethod: Record<string, { count: number; value: number }> = {};
    const byContractType: Record<string, { count: number; value: number }> = {};
    const byLocation: Record<string, { count: number; value: number }> = {};

    items.forEach(item => {
      const method = getProcurementMethodById(item.procurementMethodId);
      const contractType = getContractTypeById(item.contractTypeId);

      if (method) {
        if (!byMethod[method.name]) byMethod[method.name] = { count: 0, value: 0 };
        byMethod[method.name].count++;
        byMethod[method.name].value += item.estimatedTotalCost;
      }

      if (contractType) {
        if (!byContractType[contractType.name]) byContractType[contractType.name] = { count: 0, value: 0 };
        byContractType[contractType.name].count++;
        byContractType[contractType.name].value += item.estimatedTotalCost;
      }

      if (!byLocation[item.locationScope]) byLocation[item.locationScope] = { count: 0, value: 0 };
      byLocation[item.locationScope].count++;
      byLocation[item.locationScope].value += item.estimatedTotalCost;
    });

    return {
      totalItems: items.length,
      totalValue,
      q1Total,
      q2Total,
      q3Total,
      q4Total,
      byMethod,
      byContractType,
      byLocation,
    };
  }, [items]);

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

  // Item dialog handlers
  const handleAddItem = () => {
    setSelectedItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: ProcurementPlanItem) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
  };

  const handleSaveItem = async (itemData: Partial<ProcurementPlanItem>) => {
    // Mock save - in real app this would call an API
    if (selectedItem) {
      toast.success('Item updated successfully');
    } else {
      toast.success('Item added successfully');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    // Mock delete - in real app this would call an API
    toast.success('Item deleted successfully');
  };

  const handleBulkImport = async (importedItems: Partial<ProcurementPlanItem>[]) => {
    // Mock bulk import - in real app this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`${importedItems.length} items imported successfully`);
  };

  const handleStatusChange = async (newStatus: ProcurementPlanStatus, comments?: string) => {
    // Mock status change - in real app this would call an API
    // For demo, we'll just show a toast
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success(`Plan status updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  const existingSequences = useMemo(() => items.map(i => i.sequenceNo), [items]);

  // Check if user can edit
  const canEdit = useMemo(() => {
    if (!plan || !user) return false;
    if (plan.status === 'locked') return false;
    if (isAdmin) return true;
    if (isDNPM && ['submitted', 'under_dnpm_review', 'approved_by_agency'].includes(plan.status)) return true;
    if (plan.agencyId === user.agency_id && ['draft', 'returned'].includes(plan.status)) return true;
    return false;
  }, [plan, user, isAdmin, isDNPM]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  if (!plan) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center flex-col gap-4">
          <ShoppingCart className="h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Procurement Plan not found</p>
          <Link href="/procurement">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header
        title={plan.planName}
        subtitle={`${agency?.agencyCode} | FY${financialYear?.year}`}
      />

      <div className="p-6 space-y-6">
        {/* Back Button & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/procurement">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </Button>
          </Link>
          <div className="flex gap-2">
            {canEdit && (
              <ProcurementBulkImport
                planId={planId}
                onImport={handleBulkImport}
                existingSequences={existingSequences}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  exportProcurementPlanToExcel(plan);
                  toast.success('Excel file downloaded');
                }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  exportProcurementPlanToPDF(plan);
                  toast.success('PDF file downloaded');
                }}>
                  <FileIcon className="h-4 w-4 mr-2 text-red-600" />
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canEdit && (
              <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{plan.planName}</h2>
                        <Badge className={cn(PROCUREMENT_PLAN_STATUS_COLORS[plan.status])}>
                          {PROCUREMENT_PLAN_STATUS_LABELS[plan.status]}
                        </Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                        {plan.agencyProcurementEntityName || agency?.agencyName}
                      </p>
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
                          <Package className="h-4 w-4" />
                          {summary.totalItems} Items
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(summary.totalValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="items">Line Items</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly View</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-4 space-y-4">
                {/* Line Items Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Procurement Items</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead className="min-w-[250px]">Item Description</TableHead>
                            <TableHead>UNSPSC</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Contract Type</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Unit Cost</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                            <TableHead>Location</TableHead>
                            {canEdit && <TableHead className="w-[50px]"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, idx) => {
                            const method = getProcurementMethodById(item.procurementMethodId);
                            const contractType = getContractTypeById(item.contractTypeId);
                            const uom = item.unitOfMeasureId ? getUnitOfMeasureById(item.unitOfMeasureId) : null;
                            const province = item.provinceId ? getProvinceById(item.provinceId) : null;

                            return (
                              <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <TableCell className="font-mono text-xs text-slate-500">
                                  {item.sequenceNo}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                                      {item.activityOrProcurementTitle}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate max-w-[250px]">
                                      {item.descriptionOfItem}
                                    </p>
                                    {item.multiYearFlag && (
                                      <Badge variant="outline" className="text-xs mt-1 bg-purple-50 text-purple-700 border-purple-200">
                                        Multi-Year
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {item.unspscCode && (
                                    <div className="text-xs">
                                      <p className="font-mono text-slate-600">{item.unspscCode}</p>
                                      <p className="text-slate-500 truncate max-w-[100px]">{item.unspscDescription}</p>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {method?.code || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-slate-600">{contractType?.code || 'N/A'}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-sm font-medium">{item.quantity}</span>
                                  {uom && <span className="text-xs text-slate-500 ml-1">{uom.abbreviation}</span>}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatCurrency(item.estimatedUnitCost)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <p className="font-semibold text-sm">{formatCurrency(item.estimatedTotalCost)}</p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin className="h-3 w-3" />
                                    {LOCATION_SCOPE_LABELS[item.locationScope]}
                                    {province && <span className="text-slate-400">({province.code})</span>}
                                  </div>
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
                                        <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteItem(item.id)}>
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
                          {items.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={canEdit ? 10 : 9} className="h-32 text-center text-slate-500">
                                <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                <p>No items in this plan</p>
                                {canEdit && (
                                  <Button variant="link" className="mt-2" onClick={handleAddItem}>
                                    Add your first item
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

              <TabsContent value="quarterly" className="mt-4 space-y-4">
                {/* Quarterly Budget Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Quarterly Budget Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Q1', value: summary.q1Total, isCurrent: true },
                        { label: 'Q2', value: summary.q2Total, isCurrent: false },
                        { label: 'Q3', value: summary.q3Total, isCurrent: false },
                        { label: 'Q4', value: summary.q4Total, isCurrent: false },
                      ].map(({ label, value, isCurrent }) => {
                        const percentage = summary.totalValue > 0 ? (value / summary.totalValue) * 100 : 0;
                        return (
                          <div key={label} className={cn(
                            "p-4 rounded-lg border",
                            isCurrent ? "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={cn("font-semibold", isCurrent ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-300")}>
                                {label}
                                {isCurrent && <Badge variant="outline" className="ml-2 text-xs bg-teal-100 text-teal-700">Current</Badge>}
                              </span>
                              <span className={cn("text-sm font-medium", isCurrent ? "text-teal-700" : "text-slate-600")}>{percentage.toFixed(0)}%</span>
                            </div>
                            <Progress value={percentage} className="h-2 mb-2" />
                            <p className={cn("text-lg font-bold", isCurrent ? "text-teal-900 dark:text-white" : "text-slate-900 dark:text-white")}>
                              {formatCurrency(value)}
                            </p>
                            <p className="text-xs text-slate-500">{formatFullCurrency(value)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quarterly Items Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Items by Quarter</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead className="min-w-[200px]">Item</TableHead>
                            <TableHead className="text-right">Q1</TableHead>
                            <TableHead className="text-right">Q2</TableHead>
                            <TableHead className="text-right">Q3</TableHead>
                            <TableHead className="text-right">Q4</TableHead>
                            <TableHead className="text-right">Annual Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono text-xs">{item.sequenceNo}</TableCell>
                              <TableCell className="text-sm font-medium">{item.activityOrProcurementTitle}</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(item.q1Budget)}</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(item.q2Budget)}</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(item.q3Budget)}</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(item.q4Budget)}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(item.annualBudgetYearValue)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-slate-50 dark:bg-slate-800 font-semibold">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">{formatCurrency(summary.q1Total)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(summary.q2Total)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(summary.q3Total)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(summary.q4Total)}</TableCell>
                            <TableCell className="text-right text-teal-600">{formatCurrency(summary.totalValue)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* By Procurement Method */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">By Procurement Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(summary.byMethod).map(([method, data]) => (
                        <div key={method} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-teal-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{method}</span>
                            <Badge variant="outline" className="text-xs">{data.count}</Badge>
                          </div>
                          <span className="font-semibold text-sm">{formatCurrency(data.value)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* By Contract Type */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">By Contract Type</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(summary.byContractType).map(([type, data]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{type}</span>
                            <Badge variant="outline" className="text-xs">{data.count}</Badge>
                          </div>
                          <span className="font-semibold text-sm">{formatCurrency(data.value)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* By Location Scope */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">By Location Scope</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(summary.byLocation).map(([scope, data]) => (
                        <div key={scope} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {LOCATION_SCOPE_LABELS[scope as keyof typeof LOCATION_SCOPE_LABELS] || scope}
                            </span>
                            <Badge variant="outline" className="text-xs">{data.count} items</Badge>
                          </div>
                          <span className="font-semibold text-sm">{formatCurrency(data.value)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Workflow Actions */}
            <ProcurementApprovalActions
              plan={plan}
              userRole={user?.role || 'agency_user'}
              userId={user?.id || ''}
              userAgencyId={user?.agency_id}
              onStatusChange={handleStatusChange}
            />

            {/* Budget Summary */}
            <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-200 dark:border-teal-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-teal-900 dark:text-teal-100">Budget Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-teal-700 dark:text-teal-300">Total Estimated Value</p>
                  <p className="text-2xl font-bold text-teal-900 dark:text-white">
                    K {summary.totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="pt-2 border-t border-teal-200 dark:border-teal-700">
                  <p className="text-xs text-teal-700 dark:text-teal-300">Fund Source</p>
                  <p className="text-lg font-semibold text-teal-800 dark:text-teal-200">
                    {fundSource?.name || 'N/A'}
                  </p>
                </div>
                <div className="pt-2 border-t border-teal-200 dark:border-teal-700">
                  <p className="text-xs text-teal-700 dark:text-teal-300">Total Items</p>
                  <p className="text-lg font-semibold text-teal-800 dark:text-teal-200">
                    {summary.totalItems}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Plan Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Agency</span>
                  <span className="font-medium">{agency?.agencyCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Financial Year</span>
                  <span className="font-medium">FY{financialYear?.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Period</span>
                  <span className="font-medium">
                    {new Date(plan.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} -
                    {new Date(plan.periodEnd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {plan.agencyBudgetCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Budget Code</span>
                    <span className="font-medium">{plan.agencyBudgetCode}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Item Dialog */}
      <ProcurementItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={selectedItem}
        planId={planId}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        existingSequences={existingSequences}
      />
    </AppLayout>
  );
}
