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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Building2,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  financialYears,
  agencies,
  fundSources,
  getOpenFinancialYears,
  getActiveAgencies,
  getActiveFundSources,
} from '@/lib/database';

export default function NewProcurementPlanPage() {
  const router = useRouter();
  const { user, isLoading, isDNPM, isAdmin } = useSupabaseAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    financialYearId: '',
    agencyId: '',
    planName: '',
    agencyProcurementEntityName: '',
    agencyBudgetCode: '',
    periodStart: '',
    periodEnd: '',
    fundSourceId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const openYears = getOpenFinancialYears();
  const activeAgencies = getActiveAgencies();
  const activeFundSources = getActiveFundSources();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }

    // Set defaults
    if (openYears.length > 0 && !formData.financialYearId) {
      const currentYear = openYears[0];
      setFormData(prev => ({
        ...prev,
        financialYearId: currentYear.id,
        periodStart: `${currentYear.year}-01-01`,
        periodEnd: `${currentYear.year}-12-31`,
      }));
    }

    // For agency users, pre-select their agency
    if (user?.agency_id && !isDNPM && !isAdmin && !formData.agencyId) {
      const userAgency = agencies.find(a => a.id === user.agency_id);
      if (userAgency) {
        setFormData(prev => ({
          ...prev,
          agencyId: userAgency.id,
          agencyProcurementEntityName: userAgency.agencyName,
          planName: `${userAgency.agencyCode} Annual Procurement Plan FY${openYears[0]?.year || ''}`,
        }));
      }
    }
  }, [user, isLoading, router, isDNPM, isAdmin, openYears, formData.financialYearId, formData.agencyId]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-generate plan name when agency or year changes
    if (field === 'agencyId' || field === 'financialYearId') {
      const agency = agencies.find(a => a.id === (field === 'agencyId' ? value : formData.agencyId));
      const year = financialYears.find(fy => fy.id === (field === 'financialYearId' ? value : formData.financialYearId));
      if (agency && year) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          planName: `${agency.agencyCode} Annual Procurement Plan FY${year.year}`,
          agencyProcurementEntityName: prev.agencyProcurementEntityName || agency.agencyName,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.financialYearId) newErrors.financialYearId = 'Financial year is required';
    if (!formData.agencyId) newErrors.agencyId = 'Agency is required';
    if (!formData.planName) newErrors.planName = 'Plan name is required';
    if (!formData.periodStart) newErrors.periodStart = 'Start date is required';
    if (!formData.periodEnd) newErrors.periodEnd = 'End date is required';
    if (!formData.fundSourceId) newErrors.fundSourceId = 'Fund source is required';

    if (formData.periodStart && formData.periodEnd) {
      if (new Date(formData.periodStart) > new Date(formData.periodEnd)) {
        newErrors.periodEnd = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Procurement plan created successfully');
      router.push('/procurement');
    } catch (error) {
      toast.error('Failed to create procurement plan');
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

  if (!user) return null;

  return (
    <AppLayout>
      <Header
        title="New Procurement Plan"
        subtitle="Create a new annual procurement plan for your agency"
      />

      <div className="p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Back Button */}
          <Link href="/procurement">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </Button>
          </Link>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-teal-600" />
                Plan Information
              </CardTitle>
              <CardDescription>
                Enter the basic details for the procurement plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="financialYearId">Financial Year *</Label>
                  <Select
                    value={formData.financialYearId}
                    onValueChange={(value) => handleChange('financialYearId', value)}
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
                  {errors.financialYearId && <p className="text-xs text-red-500">{errors.financialYearId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencyId">Agency *</Label>
                  <Select
                    value={formData.agencyId}
                    onValueChange={(value) => handleChange('agencyId', value)}
                    disabled={!isDNPM && !isAdmin}
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
                  {errors.agencyId && <p className="text-xs text-red-500">{errors.agencyId}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name *</Label>
                <Input
                  id="planName"
                  value={formData.planName}
                  onChange={(e) => handleChange('planName', e.target.value)}
                  placeholder="e.g., NPC Annual Procurement Plan FY2026"
                  className={errors.planName ? 'border-red-500' : ''}
                />
                {errors.planName && <p className="text-xs text-red-500">{errors.planName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencyProcurementEntityName">Procurement Entity Name</Label>
                <Input
                  id="agencyProcurementEntityName"
                  value={formData.agencyProcurementEntityName}
                  onChange={(e) => handleChange('agencyProcurementEntityName', e.target.value)}
                  placeholder="Full name of the procurement entity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencyBudgetCode">Agency Budget Code</Label>
                <Input
                  id="agencyBudgetCode"
                  value={formData.agencyBudgetCode}
                  onChange={(e) => handleChange('agencyBudgetCode', e.target.value)}
                  placeholder="e.g., NPC-135"
                />
              </div>
            </CardContent>
          </Card>

          {/* Period & Fund Source */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                Period & Funding
              </CardTitle>
              <CardDescription>
                Specify the plan period and primary fund source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Period Start *</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => handleChange('periodStart', e.target.value)}
                    className={errors.periodStart ? 'border-red-500' : ''}
                  />
                  {errors.periodStart && <p className="text-xs text-red-500">{errors.periodStart}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Period End *</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => handleChange('periodEnd', e.target.value)}
                    className={errors.periodEnd ? 'border-red-500' : ''}
                  />
                  {errors.periodEnd && <p className="text-xs text-red-500">{errors.periodEnd}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundSourceId">Primary Fund Source *</Label>
                <Select
                  value={formData.fundSourceId}
                  onValueChange={(value) => handleChange('fundSourceId', value)}
                >
                  <SelectTrigger className={errors.fundSourceId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select fund source" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeFundSources.map(fs => (
                      <SelectItem key={fs.id} value={fs.id}>
                        {fs.code} - {fs.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fundSourceId && <p className="text-xs text-red-500">{errors.fundSourceId}</p>}
                <p className="text-xs text-slate-500">
                  Select the primary fund source. Individual items can have different sources.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/procurement">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
