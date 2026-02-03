'use client';

import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { WorkplanActivity, ActivityStatus } from '@/lib/types';

interface BulkImportProps {
  workplanId: string;
  onImport: (activities: Partial<WorkplanActivity>[]) => void;
  existingCodes?: string[];
}

interface ImportRow {
  rowNum: number;
  activityCode: string;
  activityName: string;
  description?: string;
  responsibleUnit: string;
  responsibleOfficer?: string;
  startDate: string;
  endDate: string;
  q1Target: number;
  q2Target: number;
  q3Target: number;
  q4Target: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
  kpi: string;
  expectedOutput: string;
  status: ActivityStatus;
  isValid: boolean;
  errors: string[];
}

const TEMPLATE_HEADERS = [
  'Activity Code',
  'Activity Name',
  'Description',
  'Responsible Unit',
  'Responsible Officer',
  'Start Date (YYYY-MM-DD)',
  'End Date (YYYY-MM-DD)',
  'Q1 Target',
  'Q2 Target',
  'Q3 Target',
  'Q4 Target',
  'Q1 Budget',
  'Q2 Budget',
  'Q3 Budget',
  'Q4 Budget',
  'KPI',
  'Expected Output',
];

const SAMPLE_DATA = [
  ['ACT-001', 'Sample Activity 1', 'Description of activity', 'Division A', 'John Doe', '2026-01-01', '2026-06-30', 100, 200, 300, 400, 500000, 600000, 700000, 800000, 'Number of units completed', 'Complete 1000 units'],
  ['ACT-002', 'Sample Activity 2', 'Another activity', 'Division B', 'Jane Smith', '2026-03-01', '2026-12-31', 50, 100, 150, 200, 250000, 300000, 350000, 400000, 'Percentage completion', 'Achieve 100% coverage'],
];

export function BulkImport({ workplanId, onImport, existingCodes = [] }: BulkImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...SAMPLE_DATA]);

    // Set column widths
    ws['!cols'] = TEMPLATE_HEADERS.map((_, idx) => ({ wch: idx < 2 ? 20 : 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Activities Template');
    XLSX.writeFile(wb, 'Workplan_Activities_Template.xlsx');
    toast.success('Template downloaded');
  };

  const validateRow = (row: any, rowNum: number): ImportRow => {
    const errors: string[] = [];

    const activityCode = String(row['Activity Code'] || '').trim();
    const activityName = String(row['Activity Name'] || '').trim();
    const responsibleUnit = String(row['Responsible Unit'] || '').trim();
    const kpi = String(row['KPI'] || '').trim();
    const expectedOutput = String(row['Expected Output'] || '').trim();

    // Required field validation
    if (!activityCode) errors.push('Activity Code is required');
    if (!activityName) errors.push('Activity Name is required');
    if (!responsibleUnit) errors.push('Responsible Unit is required');
    if (!kpi) errors.push('KPI is required');
    if (!expectedOutput) errors.push('Expected Output is required');

    // Duplicate check
    if (activityCode && existingCodes.includes(activityCode)) {
      errors.push(`Activity Code "${activityCode}" already exists`);
    }

    // Date validation
    const startDateStr = row['Start Date (YYYY-MM-DD)'];
    const endDateStr = row['End Date (YYYY-MM-DD)'];
    let startDate = '';
    let endDate = '';

    if (startDateStr) {
      const parsed = parseExcelDate(startDateStr);
      if (parsed) {
        startDate = parsed;
      } else {
        errors.push('Invalid Start Date format');
      }
    } else {
      errors.push('Start Date is required');
    }

    if (endDateStr) {
      const parsed = parseExcelDate(endDateStr);
      if (parsed) {
        endDate = parsed;
      } else {
        errors.push('Invalid End Date format');
      }
    } else {
      errors.push('End Date is required');
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push('Start Date must be before End Date');
    }

    // Parse numbers
    const q1Target = parseNumber(row['Q1 Target']);
    const q2Target = parseNumber(row['Q2 Target']);
    const q3Target = parseNumber(row['Q3 Target']);
    const q4Target = parseNumber(row['Q4 Target']);
    const q1Budget = parseNumber(row['Q1 Budget']);
    const q2Budget = parseNumber(row['Q2 Budget']);
    const q3Budget = parseNumber(row['Q3 Budget']);
    const q4Budget = parseNumber(row['Q4 Budget']);

    return {
      rowNum,
      activityCode,
      activityName,
      description: String(row['Description'] || '').trim() || undefined,
      responsibleUnit,
      responsibleOfficer: String(row['Responsible Officer'] || '').trim() || undefined,
      startDate,
      endDate,
      q1Target,
      q2Target,
      q3Target,
      q4Target,
      q1Budget,
      q2Budget,
      q3Budget,
      q4Budget,
      kpi,
      expectedOutput,
      status: 'not_started',
      isValid: errors.length === 0,
      errors,
    };
  };

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;

    // If it's already a string in YYYY-MM-DD format
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    // If it's an Excel serial number
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }

    // Try to parse as date string
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return null;
  };

  const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('No data found in the file');
        setIsProcessing(false);
        return;
      }

      // Skip sample rows if they exist
      const filteredData = jsonData.filter((row: any) =>
        !String(row['Activity Code'] || '').startsWith('ACT-00')
      );

      const validated = filteredData.map((row, idx) => validateRow(row, idx + 2));

      setImportData(validated);
      setStep('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  }, [existingCodes]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
    }
  };

  const handleImport = async () => {
    const validRows = importData.filter(row => row.isValid);

    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    const activities: Partial<WorkplanActivity>[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      activities.push({
        id: `act_import_${Date.now()}_${i}`,
        workplanId,
        activityCode: row.activityCode,
        activityName: row.activityName,
        description: row.description,
        responsibleUnit: row.responsibleUnit,
        responsibleOfficer: row.responsibleOfficer,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        q1Target: row.q1Target,
        q2Target: row.q2Target,
        q3Target: row.q3Target,
        q4Target: row.q4Target,
        q1Actual: 0,
        q2Actual: 0,
        q3Actual: 0,
        q4Actual: 0,
        q1Budget: row.q1Budget,
        q2Budget: row.q2Budget,
        q3Budget: row.q3Budget,
        q4Budget: row.q4Budget,
        totalBudget: row.q1Budget + row.q2Budget + row.q3Budget + row.q4Budget,
        keyPerformanceIndicator: row.kpi,
        expectedOutput: row.expectedOutput,
        status: 'not_started',
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    onImport(activities);
    toast.success(`Successfully imported ${activities.length} activities`);

    // Reset and close
    setIsOpen(false);
    setStep('upload');
    setImportData([]);
    setImportProgress(0);
  };

  const validCount = importData.filter(r => r.isValid).length;
  const invalidCount = importData.filter(r => !r.isValid).length;

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" />
        Bulk Import
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          setStep('upload');
          setImportData([]);
        }
        setIsOpen(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Bulk Import Activities
            </DialogTitle>
            <DialogDescription>
              Import multiple activities from an Excel spreadsheet
            </DialogDescription>
          </DialogHeader>

          {step === 'upload' && (
            <div className="py-6 space-y-4">
              {/* Download template */}
              <Card className="bg-slate-50 dark:bg-slate-800 border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-emerald-600" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Download Template</p>
                        <p className="text-sm text-slate-500">Use our Excel template for correct formatting</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Upload area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
                  ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-300 hover:border-slate-400'}
                  ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isProcessing ? (
                  <Loader2 className="h-12 w-12 mx-auto text-emerald-500 animate-spin" />
                ) : (
                  <Upload className={`h-12 w-12 mx-auto ${isDragging ? 'text-emerald-500' : 'text-slate-400'}`} />
                )}

                <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isDragging ? 'Drop file here' : 'Drag & drop Excel file or click to browse'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Supports .xlsx and .xls files
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Summary */}
              <div className="flex items-center gap-4 py-4">
                <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="gap-1 bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3" />
                    {invalidCount} Invalid
                  </Badge>
                )}
                <span className="text-sm text-slate-500 ml-auto">
                  {importData.length} total rows
                </span>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-slate-900">
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Activity Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead className="text-right">Total Budget</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.map((row) => (
                      <TableRow key={row.rowNum} className={row.isValid ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                        <TableCell className="text-xs text-slate-500">{row.rowNum}</TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.activityCode}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{row.activityName}</TableCell>
                        <TableCell className="text-sm">{row.responsibleUnit}</TableCell>
                        <TableCell className="text-xs">
                          {row.startDate && row.endDate ? `${row.startDate} to ${row.endDate}` : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          K {(row.q1Budget + row.q2Budget + row.q3Budget + row.q4Budget).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              {row.errors[0]}
                              {row.errors.length > 1 && ` +${row.errors.length - 1} more`}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-emerald-500 animate-spin" />
              <p className="text-lg font-medium text-slate-900 dark:text-white">
                Importing activities...
              </p>
              <Progress value={importProgress} className="w-64 mx-auto" />
              <p className="text-sm text-slate-500">{importProgress}% complete</p>
            </div>
          )}

          <DialogFooter>
            {step === 'preview' && (
              <>
                <Button variant="outline" onClick={() => { setStep('upload'); setImportData([]); }}>
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Import {validCount} Activities
                </Button>
              </>
            )}
            {step === 'upload' && (
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
