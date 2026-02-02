'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  financialYears,
  projects,
  generateId,
  getOpenFinancialYears,
} from '@/lib/database';
import type { Project } from '@/lib/types';

export default function NewProjectPage() {
  const router = useRouter();
  const { user, agency, isLoading } = useSupabaseAuth();

  const [formData, setFormData] = useState({
    projectTitle: '',
    projectCode: '',
    financialYearId: '',
    expenditureVoteNo: '',
    division: '',
    mainProgram: '',
    program: '',
    managerName: '',
    objective: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openYears = getOpenFinancialYears();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Set default financial year
    if (openYears.length > 0 && !formData.financialYearId) {
      setFormData(prev => ({ ...prev, financialYearId: openYears[0].id }));
    }
  }, [user, isLoading, router, openYears, formData.financialYearId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectTitle.trim()) {
      newErrors.projectTitle = 'Project title is required';
    }
    if (!formData.financialYearId) {
      newErrors.financialYearId = 'Financial year is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user || !agency) return;

    setIsSaving(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newProject: Project = {
      id: generateId(),
      financialYearId: formData.financialYearId,
      agencyId: agency.id,
      projectTitle: formData.projectTitle,
      projectCode: formData.projectCode || undefined,
      expenditureVoteNo: formData.expenditureVoteNo || undefined,
      division: formData.division || undefined,
      mainProgram: formData.mainProgram || undefined,
      program: formData.program || undefined,
      managerName: formData.managerName || undefined,
      objective: formData.objective || undefined,
      createdBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    };

    // Add to mock database
    projects.push(newProject);

    toast.success('Project created successfully');
    router.push(`/projects/${newProject.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Project</h1>
            <p className="text-slate-500">
              Add a new budget project/programme for {agency?.agency_name}
            </p>
          </div>
        </div>

        {/* Open Year Check */}
        {openYears.length === 0 && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <p className="font-medium">No Open Financial Year</p>
            <p className="text-sm">
              There is no open financial year for submissions. Please contact DNPM.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Enter the basic information for your project/programme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Financial Year */}
                <div className="space-y-2">
                  <Label htmlFor="financialYear">Financial Year *</Label>
                  <Select
                    value={formData.financialYearId}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, financialYearId: value }))
                    }
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

                {/* Agency (read-only) */}
                <div className="space-y-2">
                  <Label>Agency</Label>
                  <Input value={agency?.agency_name || ''} disabled className="bg-slate-100" />
                </div>
              </div>

              {/* Project Title */}
              <div className="space-y-2">
                <Label htmlFor="projectTitle">Project Title *</Label>
                <Input
                  id="projectTitle"
                  value={formData.projectTitle}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, projectTitle: e.target.value }))
                  }
                  placeholder="Enter project/programme title"
                  className={errors.projectTitle ? 'border-red-500' : ''}
                />
                {errors.projectTitle && (
                  <p className="text-sm text-red-500">{errors.projectTitle}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Project Code */}
                <div className="space-y-2">
                  <Label htmlFor="projectCode">Project Code</Label>
                  <Input
                    id="projectCode"
                    value={formData.projectCode}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, projectCode: e.target.value }))
                    }
                    placeholder="e.g., NPC-EGP-001"
                  />
                </div>

                {/* Expenditure Vote No */}
                <div className="space-y-2">
                  <Label htmlFor="expenditureVoteNo">Expenditure Vote No.</Label>
                  <Input
                    id="expenditureVoteNo"
                    value={formData.expenditureVoteNo}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, expenditureVoteNo: e.target.value }))
                    }
                    placeholder="e.g., 135"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Division */}
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Input
                    id="division"
                    value={formData.division}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, division: e.target.value }))
                    }
                    placeholder="e.g., ICT Division"
                  />
                </div>

                {/* Manager Name */}
                <div className="space-y-2">
                  <Label htmlFor="managerName">Project Manager</Label>
                  <Input
                    id="managerName"
                    value={formData.managerName}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, managerName: e.target.value }))
                    }
                    placeholder="Enter manager name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Main Program */}
                <div className="space-y-2">
                  <Label htmlFor="mainProgram">Main Program</Label>
                  <Input
                    id="mainProgram"
                    value={formData.mainProgram}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, mainProgram: e.target.value }))
                    }
                    placeholder="e.g., Digital Transformation"
                  />
                </div>

                {/* Program */}
                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Input
                    id="program"
                    value={formData.program}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, program: e.target.value }))
                    }
                    placeholder="e.g., E-Government"
                  />
                </div>
              </div>

              {/* Objective */}
              <div className="space-y-2">
                <Label htmlFor="objective">Project Objective</Label>
                <Textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, objective: e.target.value }))
                  }
                  placeholder="Describe the project's objective and expected outcomes..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href="/projects">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSaving || openYears.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
