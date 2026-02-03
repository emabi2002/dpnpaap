'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link2, Unlink } from 'lucide-react';
import { projects, getProjectById } from '@/lib/database';
import type { WorkplanActivity, ActivityStatus } from '@/lib/types';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: WorkplanActivity | null;
  workplanId: string;
  onSave: (activity: Partial<WorkplanActivity>) => void;
  onDelete?: (activityId: string) => void;
}

const ACTIVITY_STATUSES: { value: ActivityStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ActivityDialog({
  open,
  onOpenChange,
  activity,
  workplanId,
  onSave,
  onDelete,
}: ActivityDialogProps) {
  const isEditing = !!activity;
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Form state
  const [formData, setFormData] = useState({
    activityCode: '',
    activityName: '',
    description: '',
    responsibleUnit: '',
    responsibleOfficer: '',
    startDate: '',
    endDate: '',
    keyPerformanceIndicator: '',
    expectedOutput: '',
    status: 'not_started' as ActivityStatus,
    progressPercent: 0,
    remarks: '',
    projectId: '',
    // Quarterly targets
    q1Target: 0,
    q2Target: 0,
    q3Target: 0,
    q4Target: 0,
    // Quarterly actuals
    q1Actual: 0,
    q2Actual: 0,
    q3Actual: 0,
    q4Actual: 0,
    // Quarterly budgets
    q1Budget: 0,
    q2Budget: 0,
    q3Budget: 0,
    q4Budget: 0,
  });

  // Reset form when dialog opens/closes or activity changes
  useEffect(() => {
    if (open && activity) {
      setFormData({
        activityCode: activity.activityCode,
        activityName: activity.activityName,
        description: activity.description || '',
        responsibleUnit: activity.responsibleUnit,
        responsibleOfficer: activity.responsibleOfficer || '',
        startDate: activity.startDate.toISOString().split('T')[0],
        endDate: activity.endDate.toISOString().split('T')[0],
        keyPerformanceIndicator: activity.keyPerformanceIndicator,
        expectedOutput: activity.expectedOutput,
        status: activity.status,
        progressPercent: activity.progressPercent,
        remarks: activity.remarks || '',
        projectId: activity.projectId || '',
        q1Target: activity.q1Target,
        q2Target: activity.q2Target,
        q3Target: activity.q3Target,
        q4Target: activity.q4Target,
        q1Actual: activity.q1Actual,
        q2Actual: activity.q2Actual,
        q3Actual: activity.q3Actual,
        q4Actual: activity.q4Actual,
        q1Budget: activity.q1Budget,
        q2Budget: activity.q2Budget,
        q3Budget: activity.q3Budget,
        q4Budget: activity.q4Budget,
      });
    } else if (open && !activity) {
      // Reset for new activity
      setFormData({
        activityCode: '',
        activityName: '',
        description: '',
        responsibleUnit: '',
        responsibleOfficer: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
        keyPerformanceIndicator: '',
        expectedOutput: '',
        status: 'not_started',
        progressPercent: 0,
        remarks: '',
        projectId: '',
        q1Target: 0,
        q2Target: 0,
        q3Target: 0,
        q4Target: 0,
        q1Actual: 0,
        q2Actual: 0,
        q3Actual: 0,
        q4Actual: 0,
        q1Budget: 0,
        q2Budget: 0,
        q3Budget: 0,
        q4Budget: 0,
      });
    }
    setActiveTab('details');
  }, [open, activity]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalBudget = () => {
    return formData.q1Budget + formData.q2Budget + formData.q3Budget + formData.q4Budget;
  };

  const handleSave = async () => {
    setIsLoading(true);

    const activityData: Partial<WorkplanActivity> = {
      ...activity,
      workplanId,
      activityCode: formData.activityCode,
      activityName: formData.activityName,
      description: formData.description || undefined,
      responsibleUnit: formData.responsibleUnit,
      responsibleOfficer: formData.responsibleOfficer || undefined,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      keyPerformanceIndicator: formData.keyPerformanceIndicator,
      expectedOutput: formData.expectedOutput,
      status: formData.status,
      progressPercent: formData.progressPercent,
      remarks: formData.remarks || undefined,
      projectId: formData.projectId || undefined,
      q1Target: formData.q1Target,
      q2Target: formData.q2Target,
      q3Target: formData.q3Target,
      q4Target: formData.q4Target,
      q1Actual: formData.q1Actual,
      q2Actual: formData.q2Actual,
      q3Actual: formData.q3Actual,
      q4Actual: formData.q4Actual,
      q1Budget: formData.q1Budget,
      q2Budget: formData.q2Budget,
      q3Budget: formData.q3Budget,
      q4Budget: formData.q4Budget,
      totalBudget: calculateTotalBudget(),
      updatedAt: new Date(),
    };

    if (!isEditing) {
      activityData.id = `act_${Date.now()}`;
      activityData.createdAt = new Date();
    }

    await onSave(activityData);
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (activity && onDelete) {
      onDelete(activity.id);
      onOpenChange(false);
    }
  };

  const linkedProject = formData.projectId ? getProjectById(formData.projectId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Activity' : 'Add New Activity'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the activity details and quarterly targets.'
              : 'Create a new activity for this workplan.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="link">Project Link</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activityCode">Activity Code *</Label>
                <Input
                  id="activityCode"
                  value={formData.activityCode}
                  onChange={(e) => handleInputChange('activityCode', e.target.value)}
                  placeholder="e.g., ACT-2026-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityName">Activity Name *</Label>
              <Input
                id="activityName"
                value={formData.activityName}
                onChange={(e) => handleInputChange('activityName', e.target.value)}
                placeholder="Enter activity name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the activity..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsibleUnit">Responsible Unit *</Label>
                <Input
                  id="responsibleUnit"
                  value={formData.responsibleUnit}
                  onChange={(e) => handleInputChange('responsibleUnit', e.target.value)}
                  placeholder="e.g., ICT Division"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibleOfficer">Responsible Officer</Label>
                <Input
                  id="responsibleOfficer"
                  value={formData.responsibleOfficer}
                  onChange={(e) => handleInputChange('responsibleOfficer', e.target.value)}
                  placeholder="Officer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kpi">Key Performance Indicator *</Label>
              <Input
                id="kpi"
                value={formData.keyPerformanceIndicator}
                onChange={(e) => handleInputChange('keyPerformanceIndicator', e.target.value)}
                placeholder="e.g., Number of users trained"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedOutput">Expected Output *</Label>
              <Textarea
                id="expectedOutput"
                value={formData.expectedOutput}
                onChange={(e) => handleInputChange('expectedOutput', e.target.value)}
                placeholder="Describe the expected output..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="progressPercent">Progress (%)</Label>
                <Input
                  id="progressPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progressPercent}
                  onChange={(e) => handleInputChange('progressPercent', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="targets" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quarterly Targets & Actuals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-center mb-2">
                  <div className="text-xs font-medium text-slate-500">Quarter</div>
                  <div className="text-xs font-medium text-slate-500">Q1 (Jan-Mar)</div>
                  <div className="text-xs font-medium text-slate-500">Q2 (Apr-Jun)</div>
                  <div className="text-xs font-medium text-slate-500">Q3 (Jul-Sep)</div>
                  <div className="text-xs font-medium text-slate-500">Q4 (Oct-Dec)</div>
                </div>
                <div className="grid grid-cols-5 gap-4 items-center mb-3">
                  <Label className="text-sm">Target</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.q1Target}
                    onChange={(e) => handleInputChange('q1Target', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q2Target}
                    onChange={(e) => handleInputChange('q2Target', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q3Target}
                    onChange={(e) => handleInputChange('q3Target', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q4Target}
                    onChange={(e) => handleInputChange('q4Target', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                </div>
                <div className="grid grid-cols-5 gap-4 items-center">
                  <Label className="text-sm">Actual</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.q1Actual}
                    onChange={(e) => handleInputChange('q1Actual', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q2Actual}
                    onChange={(e) => handleInputChange('q2Actual', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q3Actual}
                    onChange={(e) => handleInputChange('q3Actual', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q4Actual}
                    onChange={(e) => handleInputChange('q4Actual', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quarterly Budget Allocation (PGK)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-center mb-2">
                  <div className="text-xs font-medium text-slate-500">Quarter</div>
                  <div className="text-xs font-medium text-slate-500">Q1</div>
                  <div className="text-xs font-medium text-slate-500">Q2</div>
                  <div className="text-xs font-medium text-slate-500">Q3</div>
                  <div className="text-xs font-medium text-slate-500">Q4</div>
                </div>
                <div className="grid grid-cols-5 gap-4 items-center">
                  <Label className="text-sm">Budget</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.q1Budget}
                    onChange={(e) => handleInputChange('q1Budget', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q2Budget}
                    onChange={(e) => handleInputChange('q2Budget', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q3Budget}
                    onChange={(e) => handleInputChange('q3Budget', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={formData.q4Budget}
                    onChange={(e) => handleInputChange('q4Budget', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                </div>
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Annual Budget</span>
                    <span className="text-lg font-bold text-emerald-600">
                      K {calculateTotalBudget().toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Link to Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Optionally link this activity to an existing project for budget synchronization.
                </p>

                <div className="space-y-2">
                  <Label>Select Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => handleInputChange('projectId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project to link..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project link</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.projectCode} - {project.projectTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {linkedProject && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Link2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-emerald-900 dark:text-emerald-100">
                          {linkedProject.projectTitle}
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          Code: {linkedProject.projectCode}
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          Division: {linkedProject.division}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!linkedProject && formData.projectId === '' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                    <Unlink className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No project linked</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-6">
          {isEditing && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              Delete Activity
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Activity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
