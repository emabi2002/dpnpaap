'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Check,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  projects,
  agencies,
  financialYears,
  donorCodes,
  getAgencyById,
  getFinancialYearById,
  getBudgetLinesByProjectId,
  getCashflowByBudgetLineId,
} from '@/lib/database';
import { PROJECT_STATUS_LABELS, type CashflowMonthly } from '@/lib/types';
import {
  exportProjectToExcel,
  exportMultipleProjectsToExcel,
  downloadExcel,
  generateFilename,
} from '@/lib/excel-export';
import {
  exportProjectToPDF,
  exportMultipleProjectsToPDF,
  downloadPDF,
  generatePDFFilename,
} from '@/lib/pdf-export';

type ExportFormat = 'excel' | 'pdf';
type ExportScope = 'project' | 'agency' | 'national';

export default function ExportPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();

  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [exportScope, setExportScope] = useState<ExportScope>('agency');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [includeOptions, setIncludeOptions] = useState({
    budgetLines: true,
    cashflow: true,
    donorSummary: true,
    quarterlyTotals: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ filename: string; time: Date } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && !isDNPM && !isAdmin) {
      router.push('/dashboard');
    }
    // Set default year
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

  // Filter projects based on selections
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (selectedYear && p.financialYearId !== selectedYear) return false;
      if (exportScope === 'project') {
        if (selectedAgency && selectedAgency !== 'all' && p.agencyId !== selectedAgency) return false;
      } else if (exportScope === 'agency') {
        if (selectedAgency !== 'all' && p.agencyId !== selectedAgency) return false;
      }
      return true;
    });
  }, [selectedYear, selectedAgency, exportScope]);

  // Calculate total budget for preview
  const totalBudget = useMemo(() => {
    let total = 0;
    const projectsToSum = exportScope === 'project' && selectedProject
      ? filteredProjects.filter(p => p.id === selectedProject)
      : filteredProjects;

    projectsToSum.forEach(p => {
      const lines = getBudgetLinesByProjectId(p.id);
      total += lines.reduce((sum, bl) => sum + bl.revisedBudget, 0);
    });
    return total;
  }, [filteredProjects, exportScope, selectedProject]);

  // Prepare export data for a project
  const prepareProjectData = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const agency = getAgencyById(project.agencyId);
    const financialYear = getFinancialYearById(project.financialYearId);
    if (!agency || !financialYear) return null;

    const budgetLines = getBudgetLinesByProjectId(projectId);
    const cashflows: Record<string, CashflowMonthly> = {};

    budgetLines.forEach(bl => {
      const cf = getCashflowByBudgetLineId(bl.id);
      if (cf) {
        cashflows[bl.id] = cf;
      }
    });

    return {
      project,
      agency,
      financialYear,
      budgetLines,
      cashflows,
      donorCodes,
    };
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const selectedFY = financialYears.find(fy => fy.id === selectedYear);
      if (!selectedFY) {
        throw new Error('Please select a financial year');
      }

      let filename: string;

      if (exportFormat === 'excel') {
        // Excel Export
        let workbook;

        if (exportScope === 'project') {
          if (!selectedProject) {
            throw new Error('Please select a project');
          }

          const projectData = prepareProjectData(selectedProject);
          if (!projectData) {
            throw new Error('Project data not found');
          }

          workbook = exportProjectToExcel(projectData, { includeOptions });
          filename = generateFilename(
            'project',
            selectedFY.year,
            projectData.agency.agencyCode || undefined,
            projectData.project.projectCode || undefined
          );
        } else if (exportScope === 'agency') {
          const projectsToExport = selectedAgency === 'all'
            ? filteredProjects
            : filteredProjects.filter(p => p.agencyId === selectedAgency);

          if (projectsToExport.length === 0) {
            throw new Error('No projects found to export');
          }

          const projectDataArray = projectsToExport
            .map(p => prepareProjectData(p.id))
            .filter((d): d is NonNullable<typeof d> => d !== null);

          const agencyName = selectedAgency === 'all'
            ? 'All Agencies'
            : agencies.find(a => a.id === selectedAgency)?.agencyCode || 'Agency';

          const title = `Agency Budget Report - ${agencyName} - FY ${selectedFY.year}`;
          workbook = exportMultipleProjectsToExcel(projectDataArray, title, { includeOptions });
          filename = generateFilename('agency', selectedFY.year, agencyName);
        } else {
          const projectDataArray = filteredProjects
            .map(p => prepareProjectData(p.id))
            .filter((d): d is NonNullable<typeof d> => d !== null);

          if (projectDataArray.length === 0) {
            throw new Error('No projects found to export');
          }

          const title = `National Budget Report - FY ${selectedFY.year}`;
          workbook = exportMultipleProjectsToExcel(projectDataArray, title, { includeOptions });
          filename = generateFilename('national', selectedFY.year);
        }

        downloadExcel(workbook, filename);
        setLastExport({ filename: `${filename}.xlsx`, time: new Date() });

        toast.success('Excel export generated successfully!', {
          description: `Downloaded: ${filename}.xlsx`,
        });
      } else {
        // PDF Export
        let pdfDoc;

        if (exportScope === 'project') {
          if (!selectedProject) {
            throw new Error('Please select a project');
          }

          const projectData = prepareProjectData(selectedProject);
          if (!projectData) {
            throw new Error('Project data not found');
          }

          pdfDoc = exportProjectToPDF(projectData, { includeOptions });
          filename = generatePDFFilename(
            'project',
            selectedFY.year,
            projectData.agency.agencyCode || undefined,
            projectData.project.projectCode || undefined
          );
        } else if (exportScope === 'agency') {
          const projectsToExport = selectedAgency === 'all'
            ? filteredProjects
            : filteredProjects.filter(p => p.agencyId === selectedAgency);

          if (projectsToExport.length === 0) {
            throw new Error('No projects found to export');
          }

          const projectDataArray = projectsToExport
            .map(p => prepareProjectData(p.id))
            .filter((d): d is NonNullable<typeof d> => d !== null);

          const agencyName = selectedAgency === 'all'
            ? 'All Agencies'
            : agencies.find(a => a.id === selectedAgency)?.agencyCode || 'Agency';

          const title = `Agency Budget Report - ${agencyName} - FY ${selectedFY.year}`;
          pdfDoc = exportMultipleProjectsToPDF(projectDataArray, title, { includeOptions });
          filename = generatePDFFilename('agency', selectedFY.year, agencyName);
        } else {
          const projectDataArray = filteredProjects
            .map(p => prepareProjectData(p.id))
            .filter((d): d is NonNullable<typeof d> => d !== null);

          if (projectDataArray.length === 0) {
            throw new Error('No projects found to export');
          }

          const title = `National Budget Report - FY ${selectedFY.year}`;
          pdfDoc = exportMultipleProjectsToPDF(projectDataArray, title, { includeOptions });
          filename = generatePDFFilename('national', selectedFY.year);
        }

        downloadPDF(pdfDoc, filename);
        setLastExport({ filename: `${filename}.pdf`, time: new Date() });

        toast.success('PDF export generated successfully!', {
          description: `Downloaded: ${filename}.pdf`,
        });
      }
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || (!isDNPM && !isAdmin)) return null;

  const activeAgencies = agencies.filter(a => a.status === 'active');
  const selectedFY = financialYears.find(fy => fy.id === selectedYear);
  const projectCount = exportScope === 'project' && selectedProject ? 1 : filteredProjects.length;

  return (
    <AppLayout title="Export Data">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Export Data</h1>
          <p className="text-slate-500">
            Generate Excel exports of budget and cashflow data
          </p>
        </div>

        {/* Last Export Notification */}
        {lastExport && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">Last export: {lastExport.filename}</p>
              <p className="text-xs text-emerald-600">
                Downloaded at {lastExport.time.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
              <CardDescription>Choose the output format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  exportFormat === 'excel'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    exportFormat === 'excel' ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                  }`}>
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Excel Spreadsheet</p>
                    <p className="text-sm text-slate-500">
                      .xlsx format with multiple sheets
                    </p>
                  </div>
                  {exportFormat === 'excel' && (
                    <Check className="h-5 w-5 text-emerald-500 ml-auto" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  exportFormat === 'pdf'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    exportFormat === 'pdf' ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">PDF Document</p>
                    <p className="text-sm text-slate-500">
                      Printable format for signing
                    </p>
                  </div>
                  {exportFormat === 'pdf' && (
                    <Check className="h-5 w-5 text-emerald-500 ml-auto" />
                  )}
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Scope Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Scope</CardTitle>
              <CardDescription>Choose what data to include</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                onClick={() => setExportScope('project')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  exportScope === 'project'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    exportScope === 'project' ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Single Project</p>
                    <p className="text-sm text-slate-500">
                      Export one project submission
                    </p>
                  </div>
                  {exportScope === 'project' && (
                    <Check className="h-5 w-5 text-emerald-500 ml-auto" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('agency')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  exportScope === 'agency'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    exportScope === 'agency' ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                  }`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Agency Total</p>
                    <p className="text-sm text-slate-500">
                      All projects for one or all agencies
                    </p>
                  </div>
                  {exportScope === 'agency' && (
                    <Check className="h-5 w-5 text-emerald-500 ml-auto" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('national')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  exportScope === 'national'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    exportScope === 'national' ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                  }`}>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">National Consolidated</p>
                    <p className="text-sm text-slate-500">
                      All agencies for financial year
                    </p>
                  </div>
                  {exportScope === 'national' && (
                    <Check className="h-5 w-5 text-emerald-500 ml-auto" />
                  )}
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selection</CardTitle>
            <CardDescription>Choose the data to export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Year */}
              <div className="space-y-2">
                <Label>Financial Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
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

              {/* Agency */}
              {(exportScope === 'agency' || exportScope === 'project') && (
                <div className="space-y-2">
                  <Label>Agency</Label>
                  <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {exportScope === 'agency' && (
                        <SelectItem value="all">All Agencies</SelectItem>
                      )}
                      {activeAgencies.map(agency => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.agencyCode} - {agency.agencyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Project */}
              {exportScope === 'project' && (
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.projectTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Include Options */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Include in export:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="budgetLines"
                    checked={includeOptions.budgetLines}
                    onCheckedChange={(checked) =>
                      setIncludeOptions(prev => ({ ...prev, budgetLines: !!checked }))
                    }
                  />
                  <Label htmlFor="budgetLines" className="text-sm">
                    Budget Lines
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cashflow"
                    checked={includeOptions.cashflow}
                    onCheckedChange={(checked) =>
                      setIncludeOptions(prev => ({ ...prev, cashflow: !!checked }))
                    }
                  />
                  <Label htmlFor="cashflow" className="text-sm">
                    Monthly Cashflow
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="donorSummary"
                    checked={includeOptions.donorSummary}
                    onCheckedChange={(checked) =>
                      setIncludeOptions(prev => ({ ...prev, donorSummary: !!checked }))
                    }
                  />
                  <Label htmlFor="donorSummary" className="text-sm">
                    Donor Summary
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="quarterlyTotals"
                    checked={includeOptions.quarterlyTotals}
                    onCheckedChange={(checked) =>
                      setIncludeOptions(prev => ({ ...prev, quarterlyTotals: !!checked }))
                    }
                  />
                  <Label htmlFor="quarterlyTotals" className="text-sm">
                    Quarterly Totals
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {exportFormat === 'excel' ? 'Excel Spreadsheet (.xlsx)' : 'PDF Document'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {exportScope === 'national' && `National Consolidated - FY ${selectedFY?.year}`}
                    {exportScope === 'agency' && `Agency: ${
                      selectedAgency === 'all'
                        ? 'All Agencies'
                        : agencies.find(a => a.id === selectedAgency)?.agencyCode
                    } - FY ${selectedFY?.year}`}
                    {exportScope === 'project' && `Project: ${
                      projects.find(p => p.id === selectedProject)?.projectTitle || 'Not selected'
                    }`}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-white mb-1">
                    {projectCount} project{projectCount !== 1 ? 's' : ''}
                  </Badge>
                  <p className="text-sm font-medium text-emerald-600">
                    {formatCurrency(totalBudget)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {includeOptions.budgetLines && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Budget Lines
                  </div>
                )}
                {includeOptions.cashflow && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Monthly Cashflow
                  </div>
                )}
                {includeOptions.donorSummary && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Donor Summary
                  </div>
                )}
                {includeOptions.quarterlyTotals && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Quarterly Totals
                  </div>
                )}
              </div>

              {/* Sheets Preview */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500 mb-2">Excel sheets that will be generated:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Project Details</Badge>
                  {includeOptions.budgetLines && <Badge variant="secondary">Budget Lines</Badge>}
                  {includeOptions.cashflow && <Badge variant="secondary">Cashflow</Badge>}
                  {includeOptions.donorSummary && <Badge variant="secondary">Donor Summary</Badge>}
                  {exportScope !== 'project' && <Badge variant="secondary">By Agency</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              (exportScope === 'project' && !selectedProject) ||
              !selectedYear
            }
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Generating...' : `Export ${exportFormat.toUpperCase()}`}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-slate-400">
          {exportFormat === 'excel'
            ? 'Excel exports include formatted data with multiple worksheets for detailed analysis.'
            : 'PDF exports are formatted for printing with tables and summaries.'}
        </p>
      </div>
    </AppLayout>
  );
}
