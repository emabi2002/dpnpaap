'use client';

import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  procurementMethods,
  contractTypes,
  unitsOfMeasure,
  provinces,
} from '@/lib/database';
import { downloadProcurementImportTemplate } from '@/lib/procurement-export';
import type { ProcurementPlanItem, LocationScope } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ImportRow {
  rowNumber: number;
  data: Partial<ProcurementPlanItem>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface BulkImportProps {
  planId: string;
  onImport: (items: Partial<ProcurementPlanItem>[]) => Promise<void>;
  existingSequences: number[];
}

export function ProcurementBulkImport({ planId, onImport, existingSequences }: BulkImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setParsedRows([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      if (jsonData.length < 2) {
        toast.error('File is empty or has no data rows');
        setIsProcessing(false);
        return;
      }

      // Skip header row
      const dataRows = jsonData.slice(1);
      let nextSequence = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;

      const parsed: ImportRow[] = dataRows
        .filter(row => Array.isArray(row) && row.some(cell => cell !== null && cell !== ''))
        .map((row, index) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          // Parse each column
          const title = String(row[0] || '').trim();
          const description = String(row[1] || '').trim();
          const unspscCode = String(row[2] || '').trim();
          const methodCode = String(row[3] || '').trim().toUpperCase();
          const contractTypeCode = String(row[4] || '').trim().toUpperCase();
          const quantity = parseFloat(String(row[5] || '0')) || 0;
          const uomCode = String(row[6] || '').trim().toUpperCase();
          const unitCost = parseFloat(String(row[7] || '0')) || 0;
          const startDate = row[8] ? new Date(String(row[8])) : null;
          const endDate = row[9] ? new Date(String(row[9])) : null;
          const q1 = parseFloat(String(row[10] || '0')) || 0;
          const q2 = parseFloat(String(row[11] || '0')) || 0;
          const q3 = parseFloat(String(row[12] || '0')) || 0;
          const q4 = parseFloat(String(row[13] || '0')) || 0;
          const locationScope = String(row[14] || 'national').toLowerCase() as LocationScope;
          const provinceCode = String(row[15] || '').trim().toUpperCase();
          const multiYear = String(row[16] || 'No').toLowerCase() === 'yes';
          const multiYearBudget = parseFloat(String(row[17] || '0')) || 0;
          const thirdParty = String(row[18] || 'No').toLowerCase() === 'yes';
          const comments = String(row[19] || '').trim();
          const riskNotes = String(row[20] || '').trim();

          // Validate required fields
          if (!title) errors.push('Title is required');
          if (!description) errors.push('Description is required');
          if (!methodCode) errors.push('Procurement Method is required');
          if (!contractTypeCode) errors.push('Contract Type is required');
          if (quantity <= 0) errors.push('Quantity must be greater than 0');
          if (unitCost <= 0) errors.push('Unit Cost must be greater than 0');
          if (!startDate || isNaN(startDate.getTime())) errors.push('Invalid Start Date');
          if (!endDate || isNaN(endDate.getTime())) errors.push('Invalid End Date');

          // Validate lookups
          const method = procurementMethods.find(m => m.code === methodCode);
          if (!method && methodCode) errors.push(`Invalid Procurement Method: ${methodCode}`);

          const contractType = contractTypes.find(ct => ct.code === contractTypeCode);
          if (!contractType && contractTypeCode) errors.push(`Invalid Contract Type: ${contractTypeCode}`);

          const uom = uomCode ? unitsOfMeasure.find(u => u.code === uomCode) : null;
          if (uomCode && !uom) warnings.push(`Unknown Unit of Measure: ${uomCode}`);

          const province = provinceCode ? provinces.find(p => p.code === provinceCode) : null;
          if (provinceCode && !province) warnings.push(`Unknown Province: ${provinceCode}`);

          // Validate location scope
          if (!['national', 'provincial', 'district', 'specific_sites'].includes(locationScope)) {
            errors.push(`Invalid Location Scope: ${locationScope}`);
          }

          // Validate dates
          if (startDate && endDate && startDate > endDate) {
            errors.push('Start Date must be before End Date');
          }

          // Calculate totals
          const totalCost = quantity * unitCost;
          const annualBudget = q1 + q2 + q3 + q4;

          // Check quarter totals
          if (annualBudget > 0 && Math.abs(annualBudget - totalCost) > 1) {
            warnings.push(`Quarter totals (K${annualBudget.toLocaleString()}) don't match total cost (K${totalCost.toLocaleString()})`);
          }

          const itemData: Partial<ProcurementPlanItem> = {
            procurementPlanId: planId,
            sequenceNo: nextSequence++,
            activityOrProcurementTitle: title,
            descriptionOfItem: description,
            unspscCode: unspscCode || undefined,
            procurementMethodId: method?.id || '',
            contractTypeId: contractType?.id || '',
            quantity,
            unitOfMeasureId: uom?.id,
            estimatedUnitCost: unitCost,
            estimatedTotalCost: totalCost,
            annualBudgetYearValue: annualBudget > 0 ? annualBudget : totalCost,
            q1Budget: q1,
            q2Budget: q2,
            q3Budget: q3,
            q4Budget: q4,
            estimatedContractStart: startDate || new Date(),
            estimatedContractEnd: endDate || new Date(),
            anticipatedDurationMonths: startDate && endDate
              ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
              : 12,
            locationScope,
            provinceId: province?.id,
            multiYearFlag: multiYear,
            multiYearTotalBudget: multiYear ? multiYearBudget : undefined,
            thirdPartyContractMgmtRequired: thirdParty,
            comments: comments || undefined,
            riskNotes: riskNotes || undefined,
          };

          return {
            rowNumber: index + 2, // +2 for 1-based and header row
            data: itemData,
            errors,
            warnings,
            isValid: errors.length === 0,
          };
        });

      setParsedRows(parsed);
    } catch (err) {
      console.error('Error parsing file:', err);
      toast.error('Failed to parse Excel file');
    } finally {
      setIsProcessing(false);
    }
  }, [planId, existingSequences]);

  const handleImport = async () => {
    if (validRows.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const itemsToImport = validRows.map(r => r.data);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await onImport(itemsToImport);

      clearInterval(progressInterval);
      setImportProgress(100);

      toast.success(`Successfully imported ${validRows.length} items`);
      setOpen(false);
      resetState();
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to import items');
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setImportProgress(0);
  };

  const handleClose = () => {
    if (!isImporting) {
      setOpen(false);
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-teal-600" />
            Bulk Import Procurement Items
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file to import multiple procurement items at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="text-sm font-medium">Download Template</p>
              <p className="text-xs text-slate-500">Get the Excel template with all required columns and reference data</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadProcurementImportTemplate();
                toast.success('Template downloaded');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="import-file"
              disabled={isProcessing || isImporting}
            />
            <label
              htmlFor="import-file"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
              ) : (
                <Upload className="h-10 w-10 text-slate-400" />
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-slate-400">.xlsx or .xls files only</p>
            </label>
          </div>

          {/* Results Summary */}
          {parsedRows.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">{validRows.length} Valid</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">{invalidRows.length} Invalid</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">
                  {parsedRows.filter(r => r.warnings.length > 0).length} Warnings
                </span>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <ScrollArea className="flex-1 border rounded-lg max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Row</TableHead>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 50).map((row) => (
                    <TableRow
                      key={row.rowNumber}
                      className={cn(!row.isValid && 'bg-red-50 dark:bg-red-900/20')}
                    >
                      <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.data.activityOrProcurementTitle}
                      </TableCell>
                      <TableCell>
                        {procurementMethods.find(m => m.id === row.data.procurementMethodId)?.code || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        K {(row.data.estimatedTotalCost || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <Badge variant="destructive" className="text-xs mr-1">
                            {row.errors.length} error{row.errors.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {row.warnings.length > 0 && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                            {row.warnings.length} warning{row.warnings.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRows.length > 50 && (
                <p className="text-xs text-slate-500 p-2 text-center">
                  Showing first 50 of {parsedRows.length} rows
                </p>
              )}
            </ScrollArea>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={importProgress} className="h-2" />
              <p className="text-xs text-slate-500 text-center">
                Importing {validRows.length} items... {importProgress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || isImporting}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import {validRows.length} Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
