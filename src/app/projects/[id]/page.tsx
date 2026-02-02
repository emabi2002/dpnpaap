'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth, canEditProject, canSubmitProject, canApproveProject, canReturnProject, canLockProject } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  Paperclip,
  Plus,
  Save,
  Send,
  Trash2,
  Undo2,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { FileUpload } from '@/components/file-upload';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  projects,
  budgetLines,
  cashflowMonthly,
  workflowActions,
  attachments,
  donorCodes,
  getAgencyById,
  getFinancialYearById,
  getUserById,
  getBudgetLinesByProjectId,
  getCashflowByBudgetLineId,
  getWorkflowActionsByProjectId,
  getAttachmentsByProjectId,
  generateId,
} from '@/lib/database';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  MONTHS,
  MONTH_LABELS,
  calculateCashflowTotals,
  type ProjectStatus,
  type BudgetLine,
  type CashflowMonthly,
  type DonorSummaryRow,
} from '@/lib/types';

// Currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PG', {
    style: 'currency',
    currency: 'PGK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Number input parser
const parseNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();

  // Project data
  const [project, setProject] = useState(projects.find(p => p.id === projectId));
  const [localBudgetLines, setLocalBudgetLines] = useState<BudgetLine[]>([]);
  const [localCashflows, setLocalCashflows] = useState<Record<string, CashflowMonthly>>({});
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<'submit' | 'approve' | 'return' | 'lock' | null>(null);
  const [workflowComment, setWorkflowComment] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [localAttachments, setLocalAttachments] = useState<typeof attachments>([]);

  // Initialize data
  useEffect(() => {
    if (projectId) {
      const lines = getBudgetLinesByProjectId(projectId);
      setLocalBudgetLines(lines);

      const flows: Record<string, CashflowMonthly> = {};
      lines.forEach(line => {
        const cf = getCashflowByBudgetLineId(line.id);
        if (cf) {
          flows[line.id] = { ...cf };
        } else {
          flows[line.id] = {
            id: generateId(),
            budgetLineId: line.id,
            jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
            jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
          };
        }
      });
      setLocalCashflows(flows);
    }
  }, [projectId]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const agency = project ? getAgencyById(project.agencyId) : null;
  const financialYear = project ? getFinancialYearById(project.financialYearId) : null;
  const projectWorkflowActions = project ? getWorkflowActionsByProjectId(project.id) : [];
  const baseAttachments = project ? getAttachmentsByProjectId(project.id) : [];
  const createdByUser = project ? getUserById(project.createdBy) : null;

  // Merge base attachments with locally added ones
  const projectAttachments = [...baseAttachments, ...localAttachments];

  // Permissions
  const canEdit = canEditProject(user, project?.status || 'draft', project?.agencyId || '');
  const canSubmit = canSubmitProject(user, project?.status || 'draft', project?.agencyId || '');
  const canApprove = canApproveProject(user, project?.status || 'draft');
  const canReturn = canReturnProject(user, project?.status || 'draft');
  const canLock = canLockProject(user, project?.status || 'draft');

  // Calculate donor summary
  const donorSummary = useMemo((): DonorSummaryRow[] => {
    const summary: Record<string, DonorSummaryRow> = {};

    localBudgetLines.forEach(line => {
      const donor = donorCodes.find(d => d.id === line.donorCodeId);
      if (!donor) return;

      if (!summary[donor.id]) {
        summary[donor.id] = {
          donorCode: donor,
          originalBudget: 0,
          revisedBudget: 0,
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
          q1: 0, q2: 0, q3: 0, q4: 0, annualTotal: 0,
        };
      }

      summary[donor.id].originalBudget += line.originalBudget;
      summary[donor.id].revisedBudget += line.revisedBudget;

      const cf = localCashflows[line.id];
      if (cf) {
        MONTHS.forEach(month => {
          summary[donor.id][month] += cf[month];
        });
      }
    });

    // Calculate quarterly and annual totals
    Object.values(summary).forEach(row => {
      row.q1 = row.jan + row.feb + row.mar;
      row.q2 = row.apr + row.may + row.jun;
      row.q3 = row.jul + row.aug + row.sep;
      row.q4 = row.oct + row.nov + row.dec;
      row.annualTotal = row.q1 + row.q2 + row.q3 + row.q4;
    });

    return Object.values(summary).sort((a, b) => a.donorCode.code - b.donorCode.code);
  }, [localBudgetLines, localCashflows]);

  // Grand totals
  const grandTotals = useMemo(() => {
    const totals = {
      originalBudget: 0,
      revisedBudget: 0,
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
      q1: 0, q2: 0, q3: 0, q4: 0, annualTotal: 0,
    };

    donorSummary.forEach(row => {
      totals.originalBudget += row.originalBudget;
      totals.revisedBudget += row.revisedBudget;
      MONTHS.forEach(month => {
        totals[month] += row[month];
      });
      totals.q1 += row.q1;
      totals.q2 += row.q2;
      totals.q3 += row.q3;
      totals.q4 += row.q4;
      totals.annualTotal += row.annualTotal;
    });

    return totals;
  }, [donorSummary]);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!project?.projectTitle) errors.push('Project title is required');
    if (localBudgetLines.length === 0) errors.push('At least one budget line is required');

    localBudgetLines.forEach((line, index) => {
      if (!line.itemNo) errors.push(`Budget line ${index + 1}: Item number is required`);
      if (!line.descriptionOfItem) errors.push(`Budget line ${index + 1}: Description is required`);

      const cf = localCashflows[line.id];
      if (cf) {
        const cfTotal = calculateCashflowTotals(cf);
        if (Math.abs(cfTotal.annualTotal - line.revisedBudget) > 0.01) {
          warnings.push(`Budget line "${line.itemNo}": Annual cashflow (${formatCurrency(cfTotal.annualTotal)}) differs from revised budget (${formatCurrency(line.revisedBudget)})`);
        }
      }
    });

    const completenessScore = Math.max(0, Math.min(100,
      100 - (errors.length * 20) - (warnings.length * 5)
    ));

    return { errors, warnings, completenessScore, isValid: errors.length === 0 };
  }, [project, localBudgetLines, localCashflows]);

  // Update budget line
  const updateBudgetLine = (lineId: string, field: keyof BudgetLine, value: string | number) => {
    setLocalBudgetLines(prev =>
      prev.map(line =>
        line.id === lineId ? { ...line, [field]: value, updatedAt: new Date() } : line
      )
    );
  };

  // Update cashflow
  const updateCashflow = (lineId: string, month: typeof MONTHS[number], value: number) => {
    setLocalCashflows(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [month]: value,
      },
    }));
  };

  // Add new budget line
  const addBudgetLine = () => {
    const newLine: BudgetLine = {
      id: generateId(),
      projectId,
      itemNo: '',
      descriptionOfItem: '',
      donorCodeId: 'donor_0',
      originalBudget: 0,
      revisedBudget: 0,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLocalBudgetLines(prev => [...prev, newLine]);
    setLocalCashflows(prev => ({
      ...prev,
      [newLine.id]: {
        id: generateId(),
        budgetLineId: newLine.id,
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
      },
    }));
  };

  // Delete budget line
  const deleteBudgetLine = (lineId: string) => {
    setLocalBudgetLines(prev => prev.filter(line => line.id !== lineId));
    setLocalCashflows(prev => {
      const { [lineId]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Changes saved successfully');
    setIsSaving(false);
  };

  // Handle workflow action
  const handleWorkflowAction = async () => {
    if (!workflowAction || !project) return;

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newStatus: Record<string, ProjectStatus> = {
      submit: 'submitted',
      approve: project.status === 'submitted' ? 'approved_by_agency' : 'approved_by_dnpm',
      return: 'returned',
      lock: 'locked',
    };

    setProject({ ...project, status: newStatus[workflowAction] });
    setShowWorkflowDialog(false);
    setWorkflowComment('');
    setWorkflowAction(null);

    const actionLabels: Record<string, string> = {
      submit: 'submitted',
      approve: 'approved',
      return: 'returned',
      lock: 'locked',
    };
    toast.success(`Project ${actionLabels[workflowAction]} successfully`);
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) return null;

  if (!project) {
    return (
      <AppLayout title="Project Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <XCircle className="h-16 w-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Project Not Found</h2>
          <p className="text-slate-500 mb-4">The project you're looking for doesn't exist.</p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                  {project.projectTitle}
                </h1>
                <Badge
                  variant="outline"
                  className={PROJECT_STATUS_COLORS[project.status]}
                >
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {agency?.agencyCode}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  FY {financialYear?.year}
                </span>
                {project.projectCode && (
                  <span className="text-slate-400">
                    Code: {project.projectCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            )}

            {canSubmit && (
              <Button
                variant="outline"
                onClick={() => {
                  setWorkflowAction('submit');
                  setShowWorkflowDialog(true);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
            )}

            {canReturn && (
              <Button
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  setWorkflowAction('return');
                  setShowWorkflowDialog(true);
                }}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Return
              </Button>
            )}

            {canApprove && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setWorkflowAction('approve');
                  setShowWorkflowDialog(true);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}

            {canLock && (
              <Button
                variant="outline"
                onClick={() => {
                  setWorkflowAction('lock');
                  setShowWorkflowDialog(true);
                }}
              >
                <Lock className="h-4 w-4 mr-2" />
                Lock
              </Button>
            )}
          </div>
        </div>

        {/* Validation Alerts */}
        {(validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="space-y-2">
            {validation.errors.map((error, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
              >
                <XCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            ))}
            {validation.warnings.map((warning, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Completeness Score */}
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Submission Completeness</p>
                <p className="text-xs text-slate-500">
                  {validation.isValid ? 'Ready for submission' : 'Complete all required fields'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      validation.completenessScore >= 80 ? 'bg-emerald-500' :
                      validation.completenessScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${validation.completenessScore}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-slate-700">
                  {validation.completenessScore}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border p-1">
            <TabsTrigger value="details" className="data-[state=active]:bg-slate-100">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-slate-100">
              <Users className="h-4 w-4 mr-2" />
              Budget Lines
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="data-[state=active]:bg-slate-100">
              <Calendar className="h-4 w-4 mr-2" />
              Cashflow
            </TabsTrigger>
            <TabsTrigger value="donor" className="data-[state=active]:bg-slate-100">
              <Building2 className="h-4 w-4 mr-2" />
              Donor Summary
            </TabsTrigger>
            <TabsTrigger value="attachments" className="data-[state=active]:bg-slate-100">
              <Paperclip className="h-4 w-4 mr-2" />
              Attachments
            </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-slate-100">
              <MessageSquare className="h-4 w-4 mr-2" />
              Workflow
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Basic information about this project/programme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="projectTitle">Project Title *</Label>
                    <Input
                      id="projectTitle"
                      value={project.projectTitle}
                      disabled={!canEdit}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectCode">Project Code</Label>
                    <Input
                      id="projectCode"
                      value={project.projectCode || ''}
                      disabled={!canEdit}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenditureVoteNo">Expenditure Vote No.</Label>
                    <Input
                      id="expenditureVoteNo"
                      value={project.expenditureVoteNo || ''}
                      disabled={!canEdit}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="division">Division</Label>
                    <Input
                      id="division"
                      value={project.division || ''}
                      disabled={!canEdit}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mainProgram">Main Program</Label>
                    <Input
                      id="mainProgram"
                      value={project.mainProgram || ''}
                      disabled={!canEdit}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Input
                      id="program"
                      value={project.program || ''}
                      disabled={!canEdit}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerName">Project Manager</Label>
                    <Input
                      id="managerName"
                      value={project.managerName || ''}
                      disabled={!canEdit}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agency</Label>
                    <Input
                      value={agency?.agencyName || ''}
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective">Project Objective</Label>
                  <Textarea
                    id="objective"
                    value={project.objective || ''}
                    rows={4}
                    disabled={!canEdit}
                    className="bg-slate-50"
                  />
                </div>
                <Separator />
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Created By</p>
                    <p className="font-medium">{createdByUser?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Created At</p>
                    <p className="font-medium">
                      {new Date(project.createdAt).toLocaleDateString('en-PG', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Last Updated</p>
                    <p className="font-medium">
                      {new Date(project.updatedAt).toLocaleDateString('en-PG', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Lines Tab */}
          <TabsContent value="budget" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Budget Lines</CardTitle>
                  <CardDescription>Add and manage budget line items</CardDescription>
                </div>
                {canEdit && (
                  <Button onClick={addBudgetLine} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Item No.</TableHead>
                        <TableHead className="min-w-[200px]">Description</TableHead>
                        <TableHead className="w-32">Donor</TableHead>
                        <TableHead className="w-32 text-right">Original Budget</TableHead>
                        <TableHead className="w-32 text-right">Revised Budget</TableHead>
                        <TableHead className="w-48">Notes</TableHead>
                        {canEdit && <TableHead className="w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {localBudgetLines.map((line, index) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Input
                              value={line.itemNo}
                              onChange={(e) => updateBudgetLine(line.id, 'itemNo', e.target.value)}
                              disabled={!canEdit}
                              className="w-16 h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.descriptionOfItem}
                              onChange={(e) => updateBudgetLine(line.id, 'descriptionOfItem', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={line.donorCodeId}
                              onValueChange={(value) => updateBudgetLine(line.id, 'donorCodeId', value)}
                              disabled={!canEdit}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {donorCodes.map(donor => (
                                  <SelectItem key={donor.id} value={donor.id}>
                                    {donor.code} - {donor.donorName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={line.originalBudget.toLocaleString()}
                              onChange={(e) => updateBudgetLine(line.id, 'originalBudget', parseNumber(e.target.value))}
                              disabled={!canEdit}
                              className="w-28 h-8 text-sm text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={line.revisedBudget.toLocaleString()}
                              onChange={(e) => updateBudgetLine(line.id, 'revisedBudget', parseNumber(e.target.value))}
                              disabled={!canEdit}
                              className="w-28 h-8 text-sm text-right font-medium"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.notes || ''}
                              onChange={(e) => updateBudgetLine(line.id, 'notes', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-sm"
                              placeholder="Optional notes"
                            />
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteBudgetLine(line.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {localBudgetLines.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={canEdit ? 7 : 6} className="h-24 text-center text-slate-500">
                            No budget lines yet. Click "Add Line" to create one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                {localBudgetLines.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <div className="bg-slate-50 rounded-lg p-4 min-w-[300px]">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Total Original Budget:</span>
                        <span className="font-medium">{formatCurrency(grandTotals.originalBudget)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Revised Budget:</span>
                        <span className="text-emerald-600">{formatCurrency(grandTotals.revisedBudget)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashflow Tab */}
          <TabsContent value="cashflow" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Cashflow</CardTitle>
                <CardDescription>
                  Enter projected monthly cash requirements for each budget line
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <div className="min-w-[1200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-white z-10 min-w-[150px]">Item</TableHead>
                          {MONTH_LABELS.map((month, i) => (
                            <TableHead key={month} className="w-20 text-center text-xs">
                              {month}
                            </TableHead>
                          ))}
                          <TableHead className="w-24 text-center bg-sky-50 text-xs">Q1</TableHead>
                          <TableHead className="w-24 text-center bg-sky-50 text-xs">Q2</TableHead>
                          <TableHead className="w-24 text-center bg-sky-50 text-xs">Q3</TableHead>
                          <TableHead className="w-24 text-center bg-sky-50 text-xs">Q4</TableHead>
                          <TableHead className="w-28 text-center bg-emerald-50 text-xs font-bold">Annual</TableHead>
                          <TableHead className="w-28 text-center bg-amber-50 text-xs">Revised</TableHead>
                          <TableHead className="w-20 text-center text-xs">Variance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {localBudgetLines.map((line) => {
                          const cf = localCashflows[line.id];
                          if (!cf) return null;

                          const cfTotals = calculateCashflowTotals(cf);
                          const variance = cfTotals.annualTotal - line.revisedBudget;
                          const hasVariance = Math.abs(variance) > 0.01;

                          return (
                            <TableRow key={line.id}>
                              <TableCell className="sticky left-0 bg-white z-10 font-medium">
                                <div className="min-w-[150px]">
                                  <p className="truncate">{line.itemNo}</p>
                                  <p className="text-xs text-slate-500 truncate">{line.descriptionOfItem}</p>
                                </div>
                              </TableCell>
                              {MONTHS.map((month) => (
                                <TableCell key={month} className="p-1">
                                  <Input
                                    type="text"
                                    value={cf[month].toLocaleString()}
                                    onChange={(e) => updateCashflow(line.id, month, parseNumber(e.target.value))}
                                    disabled={!canEdit}
                                    className="w-20 h-7 text-xs text-right"
                                  />
                                </TableCell>
                              ))}
                              <TableCell className="text-right bg-sky-50 font-medium text-xs">
                                {cfTotals.q1.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right bg-sky-50 font-medium text-xs">
                                {cfTotals.q2.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right bg-sky-50 font-medium text-xs">
                                {cfTotals.q3.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right bg-sky-50 font-medium text-xs">
                                {cfTotals.q4.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right bg-emerald-50 font-bold text-xs">
                                {cfTotals.annualTotal.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right bg-amber-50 text-xs">
                                {line.revisedBudget.toLocaleString()}
                              </TableCell>
                              <TableCell className={`text-right text-xs font-medium ${
                                hasVariance ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                                {hasVariance ? (
                                  <span className="flex items-center justify-end gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                                  </span>
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mx-auto" />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {/* Totals Row */}
                        {localBudgetLines.length > 0 && (
                          <TableRow className="bg-slate-100 font-bold">
                            <TableCell className="sticky left-0 bg-slate-100 z-10">
                              TOTAL
                            </TableCell>
                            {MONTHS.map((month) => (
                              <TableCell key={month} className="text-right text-xs">
                                {grandTotals[month].toLocaleString()}
                              </TableCell>
                            ))}
                            <TableCell className="text-right bg-sky-100 text-xs">
                              {grandTotals.q1.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right bg-sky-100 text-xs">
                              {grandTotals.q2.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right bg-sky-100 text-xs">
                              {grandTotals.q3.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right bg-sky-100 text-xs">
                              {grandTotals.q4.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right bg-emerald-100 text-sm">
                              {grandTotals.annualTotal.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right bg-amber-100 text-xs">
                              {grandTotals.revisedBudget.toLocaleString()}
                            </TableCell>
                            <TableCell className={`text-right text-xs ${
                              Math.abs(grandTotals.annualTotal - grandTotals.revisedBudget) > 0.01
                                ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              {(grandTotals.annualTotal - grandTotals.revisedBudget).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>

                {localBudgetLines.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    Add budget lines first to enter cashflow projections.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Donor Summary Tab */}
          <TabsContent value="donor" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Donor Summary</CardTitle>
                <CardDescription>
                  Auto-generated summary of budget and cashflow by donor/funding source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <div className="min-w-[1000px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Donor</TableHead>
                          <TableHead className="text-right">Original</TableHead>
                          <TableHead className="text-right">Revised</TableHead>
                          <TableHead className="text-right bg-sky-50">Q1</TableHead>
                          <TableHead className="text-right bg-sky-50">Q2</TableHead>
                          <TableHead className="text-right bg-sky-50">Q3</TableHead>
                          <TableHead className="text-right bg-sky-50">Q4</TableHead>
                          <TableHead className="text-right bg-emerald-50 font-bold">Annual Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donorSummary.map((row) => (
                          <TableRow key={row.donorCode.id}>
                            <TableCell className="font-medium">
                              <div>
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-slate-200 text-xs mr-2">
                                  {row.donorCode.code}
                                </span>
                                {row.donorCode.donorName}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.originalBudget)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(row.revisedBudget)}
                            </TableCell>
                            <TableCell className="text-right bg-sky-50">
                              {formatCurrency(row.q1)}
                            </TableCell>
                            <TableCell className="text-right bg-sky-50">
                              {formatCurrency(row.q2)}
                            </TableCell>
                            <TableCell className="text-right bg-sky-50">
                              {formatCurrency(row.q3)}
                            </TableCell>
                            <TableCell className="text-right bg-sky-50">
                              {formatCurrency(row.q4)}
                            </TableCell>
                            <TableCell className="text-right bg-emerald-50 font-bold">
                              {formatCurrency(row.annualTotal)}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Grand Total */}
                        {donorSummary.length > 0 && (
                          <TableRow className="bg-slate-100 font-bold">
                            <TableCell>GRAND TOTAL</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(grandTotals.originalBudget)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(grandTotals.revisedBudget)}
                            </TableCell>
                            <TableCell className="text-right bg-sky-100">
                              {formatCurrency(grandTotals.q1)}
                            </TableCell>
                            <TableCell className="text-right bg-sky-100">
                              {formatCurrency(grandTotals.q2)}
                            </TableCell>
                            <TableCell className="text-right bg-sky-100">
                              {formatCurrency(grandTotals.q3)}
                            </TableCell>
                            <TableCell className="text-right bg-sky-100">
                              {formatCurrency(grandTotals.q4)}
                            </TableCell>
                            <TableCell className="text-right bg-emerald-100 text-lg">
                              {formatCurrency(grandTotals.annualTotal)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>

                {donorSummary.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    Add budget lines to see donor summary.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Attachments</CardTitle>
                  <CardDescription>Supporting documents for this project</CardDescription>
                </div>
                {canEdit && (
                  <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {projectAttachments.length > 0 ? (
                  <div className="space-y-2">
                    {projectAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{att.fileName}</p>
                            <p className="text-sm text-slate-500">{att.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {new Date(att.uploadedAt).toLocaleDateString()}
                          </span>
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open
                            </Button>
                          </a>
                          <a href={att.fileUrl} download={att.fileName}>
                            <Button variant="ghost" size="sm">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Paperclip className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p>No attachments yet</p>
                    {canEdit && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowUploadDialog(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Your First File
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow History</CardTitle>
                <CardDescription>Track submission, review, and approval actions</CardDescription>
              </CardHeader>
              <CardContent>
                {projectWorkflowActions.length > 0 ? (
                  <div className="space-y-4">
                    {projectWorkflowActions.map((action) => {
                      const actionUser = getUserById(action.actionByUser);
                      const actionColors: Record<string, string> = {
                        submit: 'bg-amber-100 text-amber-700 border-amber-200',
                        return: 'bg-red-100 text-red-700 border-red-200',
                        approve_agency: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                        approve_dnpm: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                        lock: 'bg-slate-100 text-slate-700 border-slate-200',
                        reopen: 'bg-sky-100 text-sky-700 border-sky-200',
                      };
                      const actionLabels: Record<string, string> = {
                        submit: 'Submitted',
                        return: 'Returned',
                        approve_agency: 'Agency Approved',
                        approve_dnpm: 'DNPM Approved',
                        lock: 'Locked',
                        reopen: 'Reopened',
                      };

                      return (
                        <div
                          key={action.id}
                          className={`p-4 rounded-lg border ${actionColors[action.actionType] || 'bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {actionLabels[action.actionType] || action.actionType}
                              </Badge>
                              <p className="font-medium text-slate-900">
                                {actionUser?.name || 'Unknown User'}
                              </p>
                              {action.comments && (
                                <p className="text-sm mt-2 text-slate-600">
                                  "{action.comments}"
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-slate-500">
                              {new Date(action.actionDate).toLocaleDateString('en-PG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p>No workflow actions yet</p>
                    <p className="text-sm mt-1">Actions will appear here when the project is submitted</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Workflow Dialog */}
        <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {workflowAction === 'submit' && 'Submit Project'}
                {workflowAction === 'approve' && 'Approve Project'}
                {workflowAction === 'return' && 'Return Project'}
                {workflowAction === 'lock' && 'Lock Project'}
              </DialogTitle>
              <DialogDescription>
                {workflowAction === 'submit' && 'Submit this project for review. You will not be able to edit it until it is returned.'}
                {workflowAction === 'approve' && 'Approve this project submission.'}
                {workflowAction === 'return' && 'Return this project to the agency for corrections.'}
                {workflowAction === 'lock' && 'Lock this project. No further edits will be allowed.'}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                value={workflowComment}
                onChange={(e) => setWorkflowComment(e.target.value)}
                placeholder="Add a comment..."
                className="mt-2"
                rows={3}
              />
            </div>

            {workflowAction === 'submit' && !validation.isValid && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                <p className="font-medium mb-1">Cannot submit - errors found:</p>
                <ul className="list-disc list-inside">
                  {validation.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleWorkflowAction}
                disabled={isSaving || (workflowAction === 'submit' && !validation.isValid)}
                className={
                  workflowAction === 'return'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : workflowAction === 'lock'
                    ? 'bg-slate-600 hover:bg-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Attachments</DialogTitle>
              <DialogDescription>
                Add supporting documents to this project submission
              </DialogDescription>
            </DialogHeader>

            <FileUpload
              projectId={projectId}
              userId={user?.id || ''}
              onUploadComplete={(attachment) => {
                // Add to local attachments list
                const newAttachment = {
                  id: `att_${Date.now()}`,
                  projectId,
                  fileName: attachment.fileName,
                  fileUrl: attachment.fileUrl,
                  uploadedBy: user?.id || '',
                  uploadedAt: new Date(),
                  description: attachment.description || '',
                };
                setLocalAttachments(prev => [...prev, newAttachment]);
              }}
              disabled={!canEdit}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
