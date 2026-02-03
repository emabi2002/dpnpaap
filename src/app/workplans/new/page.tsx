'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { agencies, financialYears, workplans } from '@/lib/database';
import type { Workplan } from '@/lib/types';

export default function NewWorkplanPage() {
  const router = useRouter();
  const { user, isLoading, agency, isDNPM, isAdmin } = useSupabaseAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    financialYearId: '',
    agencyId: '',
    totalBudget: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }

    // Set default values
    const openYear = financialYears.find(fy => fy.status === 'open');
    if (openYear) {
      setFormData(prev => ({ ...prev, financialYearId: openYear.id }));
    }

    // For agency users, auto-select their agency
    if (user?.agency_id && !isDNPM && !isAdmin) {
      setFormData(prev => ({ ...prev, agencyId: user.agency_id! }));
    }
  }, [user, isLoading, isDNPM, isAdmin, router]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Workplan title is required';
    }

    if (!formData.financialYearId) {
      newErrors.financialYearId = 'Financial year is required';
    }

    if (!formData.agencyId) {
      newErrors.agencyId = 'Agency is required';
    }

    if (formData.totalBudget <= 0) {
      newErrors.totalBudget = 'Budget must be greater than 0';
    }

    // Check for existing workplan
    const existingWorkplan = workplans.find(
      wp => wp.agencyId === formData.agencyId && wp.financialYearId === formData.financialYearId
    );
    if (existingWorkplan) {
      newErrors.agencyId = 'A workplan already exists for this agency and financial year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (asDraft: boolean = true) => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      const selectedAgency = agencies.find(a => a.id === formData.agencyId);
      const selectedYear = financialYears.find(fy => fy.id === formData.financialYearId);

      const newWorkplan: Workplan = {
        id: `wp_${Date.now()}`,
        financialYearId: formData.financialYearId,
        agencyId: formData.agencyId,
        title: formData.title || `${selectedAgency?.agencyCode} Annual Workplan FY${selectedYear?.year}`,
        description: formData.description,
        totalBudget: formData.totalBudget,
        status: asDraft ? 'draft' : 'submitted',
        submittedBy: asDraft ? undefined : user?.id,
        submittedAt: asDraft ? undefined : new Date(),
        createdBy: user?.id || 'unknown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // In a real app, this would save to the database
      // For now, we'll add it to the mock data
      workplans.push(newWorkplan);

      toast.success(
        asDraft
          ? 'Workplan saved as draft'
          : 'Workplan submitted successfully'
      );

      router.push(`/workplans/${newWorkplan.id}`);
    } catch (error) {
      toast.error('Failed to save workplan');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  const selectedAgency = agencies.find(a => a.id === formData.agencyId);
  const selectedYear = financialYears.find(fy => fy.id === formData.financialYearId);
  const activeAgencies = agencies.filter(a => a.status === 'active');
  const openYears = financialYears.filter(fy => fy.status === 'open');

  return (
    <AppLayout>
      <Header
        title="Create New Workplan"
        subtitle="Set up an annual workplan for an agency"
        showRefresh={false}
      />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Link href="/workplans">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workplans
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Workplan Details
                </CardTitle>
                <CardDescription>
                  Enter the basic information for the new workplan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Financial Year & Agency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="financialYear">Financial Year *</Label>
                    <Select
                      value={formData.financialYearId}
                      onValueChange={(value) => handleInputChange('financialYearId', value)}
                    >
                      <SelectTrigger className={errors.financialYearId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {openYears.map(fy => (
                          <SelectItem key={fy.id} value={fy.id}>
                            FY {fy.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.financialYearId && (
                      <p className="text-sm text-red-500">{errors.financialYearId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agency">Agency *</Label>
                    <Select
                      value={formData.agencyId}
                      onValueChange={(value) => handleInputChange('agencyId', value)}
                      disabled={!isDNPM && !isAdmin && !!user?.agency_id}
                    >
                      <SelectTrigger className={errors.agencyId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeAgencies.map(agency => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.agencyCode} - {agency.agencyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.agencyId && (
                      <p className="text-sm text-red-500">{errors.agencyId}</p>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Workplan Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={`e.g., ${selectedAgency?.agencyCode || 'Agency'} Annual Workplan FY${selectedYear?.year || '2026'}`}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the workplan objectives and scope..."
                    rows={4}
                  />
                </div>

                {/* Total Budget */}
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget (PGK) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="totalBudget"
                      type="number"
                      min="0"
                      value={formData.totalBudget}
                      onChange={(e) => handleInputChange('totalBudget', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className={`pl-9 ${errors.totalBudget ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.totalBudget && (
                    <p className="text-sm text-red-500">{errors.totalBudget}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    Formatted: K {formData.totalBudget.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => router.push('/workplans')}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Workplan
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAgency ? (
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedAgency.agencyCode}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedAgency.agencyName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Select an agency</p>
                  </div>
                )}

                {selectedYear && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">FY{selectedYear.year}</span>
                    <Badge variant="outline" className="ml-auto">
                      {selectedYear.status}
                    </Badge>
                  </div>
                )}

                {formData.totalBudget > 0 && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">Total Budget</p>
                    <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                      K {formData.totalBudget.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Fill in the workplan details including title, description, and budget
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Save as draft to continue editing later
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Add activities after creating the workplan
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Only one workplan per agency per financial year is allowed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submission Deadline */}
            {selectedYear && (
              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Submission Deadline
                      </p>
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                        {new Date(selectedYear.submissionDeadline).toLocaleDateString('en-PG', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
