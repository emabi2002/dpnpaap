'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Edit,
  Loader2,
  Lock,
  Plus,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import { financialYears, projects, generateId } from '@/lib/database';
import type { FinancialYear } from '@/lib/types';

export default function FinancialYearsPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [editingFY, setEditingFY] = useState<FinancialYear | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear() + 1,
    status: 'open' as 'open' | 'closed',
    submissionDeadline: '',
    notes: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && !isDNPM && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isDNPM, isAdmin, router]);

  const handleOpenDialog = (fy?: FinancialYear) => {
    if (fy) {
      setEditingFY(fy);
      setFormData({
        year: fy.year,
        status: fy.status,
        submissionDeadline: new Date(fy.submissionDeadline).toISOString().split('T')[0],
        notes: fy.notes || '',
      });
    } else {
      setEditingFY(null);
      setFormData({
        year: new Date().getFullYear() + 1,
        status: 'open',
        submissionDeadline: '',
        notes: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (editingFY) {
      // Update existing
      const index = financialYears.findIndex(fy => fy.id === editingFY.id);
      if (index !== -1) {
        financialYears[index] = {
          ...editingFY,
          year: formData.year,
          status: formData.status,
          submissionDeadline: new Date(formData.submissionDeadline),
          notes: formData.notes,
        };
      }
      toast.success('Financial year updated');
    } else {
      // Create new
      financialYears.push({
        id: generateId(),
        year: formData.year,
        status: formData.status,
        submissionDeadline: new Date(formData.submissionDeadline),
        notes: formData.notes,
        createdAt: new Date(),
      });
      toast.success('Financial year created');
    }

    setShowDialog(false);
    setIsSaving(false);
  };

  const handleToggleStatus = async (fy: FinancialYear) => {
    const index = financialYears.findIndex(f => f.id === fy.id);
    if (index !== -1) {
      financialYears[index].status = fy.status === 'open' ? 'closed' : 'open';
      toast.success(`Financial year ${financialYears[index].status === 'open' ? 'opened' : 'closed'}`);
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

  const sortedYears = [...financialYears].sort((a, b) => b.year - a.year);

  return (
    <AppLayout title="Financial Years">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Financial Years</h1>
            <p className="text-slate-500">
              Manage submission periods and deadlines
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Financial Year
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submission Deadline</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedYears.map(fy => {
                  const projectCount = projects.filter(p => p.financialYearId === fy.id).length;

                  return (
                    <TableRow key={fy.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          FY {fy.year}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            fy.status === 'open'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }
                        >
                          {fy.status === 'open' ? (
                            <Unlock className="h-3 w-3 mr-1" />
                          ) : (
                            <Lock className="h-3 w-3 mr-1" />
                          )}
                          {fy.status === 'open' ? 'Open' : 'Closed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(fy.submissionDeadline).toLocaleDateString('en-PG', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{projectCount} projects</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-500">
                        {fy.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(fy)}
                          >
                            {fy.status === 'open' ? (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Close
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3 w-3 mr-1" />
                                Open
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(fy)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFY ? 'Edit Financial Year' : 'Add Financial Year'}
              </DialogTitle>
              <DialogDescription>
                {editingFY
                  ? 'Update the financial year settings'
                  : 'Create a new financial year for submissions'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'open' | 'closed') =>
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Submission Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.submissionDeadline}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, submissionDeadline: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Optional notes about this financial year..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.submissionDeadline}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingFY ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
