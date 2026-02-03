'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Plus,
  Edit,
  Trash2,
  Flag,
  Link2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  WorkplanActivity,
  WorkplanMilestone,
  ActivityDependency
} from '@/lib/types';
import {
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_COLORS,
  DEPENDENCY_TYPE_LABELS,
} from '@/lib/types';
import { cn } from '@/lib/utils';

interface MilestonesPanelProps {
  activity: WorkplanActivity;
  allActivities: WorkplanActivity[];
  milestones: WorkplanMilestone[];
  dependencies: ActivityDependency[];
  onMilestoneAdd: (milestone: Omit<WorkplanMilestone, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onMilestoneUpdate: (id: string, milestone: Partial<WorkplanMilestone>) => void;
  onMilestoneDelete: (id: string) => void;
  onDependencyAdd: (dependency: Omit<ActivityDependency, 'id' | 'createdAt'>) => void;
  onDependencyDelete: (id: string) => void;
  readOnly?: boolean;
}

export function MilestonesPanel({
  activity,
  allActivities,
  milestones,
  dependencies,
  onMilestoneAdd,
  onMilestoneUpdate,
  onMilestoneDelete,
  onDependencyAdd,
  onDependencyDelete,
  readOnly = false,
}: MilestonesPanelProps) {
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [dependencyDialogOpen, setDependencyDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<WorkplanMilestone | null>(null);

  // Milestone form state
  const [milestoneForm, setMilestoneForm] = useState({
    milestoneName: '',
    description: '',
    targetDate: '',
    weight: 20,
  });

  // Dependency form state
  const [dependencyForm, setDependencyForm] = useState({
    dependsOnActivityId: '',
    dependencyType: 'finish_to_start' as const,
    lagDays: 0,
    isMandatory: true,
  });

  // Calculate milestone progress
  const completedWeight = milestones
    .filter(m => m.status === 'completed')
    .reduce((sum, m) => sum + m.weight, 0);

  const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
  const milestoneProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  // Get activities that can be dependencies (not this activity, not already a dependency)
  const availableActivities = allActivities.filter(a =>
    a.id !== activity.id &&
    !dependencies.some(d => d.dependsOnActivityId === a.id)
  );

  const handleAddMilestone = () => {
    setEditingMilestone(null);
    setMilestoneForm({
      milestoneName: '',
      description: '',
      targetDate: '',
      weight: 20,
    });
    setMilestoneDialogOpen(true);
  };

  const handleEditMilestone = (milestone: WorkplanMilestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      milestoneName: milestone.milestoneName,
      description: milestone.description || '',
      targetDate: milestone.targetDate.toISOString().split('T')[0],
      weight: milestone.weight,
    });
    setMilestoneDialogOpen(true);
  };

  const handleSaveMilestone = () => {
    if (!milestoneForm.milestoneName || !milestoneForm.targetDate) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingMilestone) {
      onMilestoneUpdate(editingMilestone.id, {
        milestoneName: milestoneForm.milestoneName,
        description: milestoneForm.description,
        targetDate: new Date(milestoneForm.targetDate),
        weight: milestoneForm.weight,
      });
      toast.success('Milestone updated');
    } else {
      onMilestoneAdd({
        activityId: activity.id,
        milestoneName: milestoneForm.milestoneName,
        description: milestoneForm.description,
        targetDate: new Date(milestoneForm.targetDate),
        weight: milestoneForm.weight,
        status: 'pending',
      });
      toast.success('Milestone added');
    }
    setMilestoneDialogOpen(false);
  };

  const handleToggleMilestoneComplete = (milestone: WorkplanMilestone) => {
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
    onMilestoneUpdate(milestone.id, {
      status: newStatus,
      completedDate: newStatus === 'completed' ? new Date() : undefined,
    });
  };

  const handleAddDependency = () => {
    setDependencyForm({
      dependsOnActivityId: '',
      dependencyType: 'finish_to_start',
      lagDays: 0,
      isMandatory: true,
    });
    setDependencyDialogOpen(true);
  };

  const handleSaveDependency = () => {
    if (!dependencyForm.dependsOnActivityId) {
      toast.error('Please select an activity');
      return;
    }

    onDependencyAdd({
      activityId: activity.id,
      dependsOnActivityId: dependencyForm.dependsOnActivityId,
      dependencyType: dependencyForm.dependencyType,
      lagDays: dependencyForm.lagDays,
      isMandatory: dependencyForm.isMandatory,
    });
    toast.success('Dependency added');
    setDependencyDialogOpen(false);
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Flag className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-PG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Milestones Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Milestones
            </CardTitle>
            <CardDescription>Track key deliverables and checkpoints</CardDescription>
          </div>
          {!readOnly && (
            <Button size="sm" onClick={handleAddMilestone} className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {milestones.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Milestone Progress</span>
                <span className="font-medium">{milestoneProgress}%</span>
              </div>
              <Progress value={milestoneProgress} className="h-2" />
            </div>
          )}

          {milestones.length > 0 ? (
            <div className="space-y-2">
              {milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    milestone.status === 'completed' && "bg-green-50 border-green-200",
                    milestone.status === 'overdue' && "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => !readOnly && handleToggleMilestoneComplete(milestone)}
                      disabled={readOnly}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    >
                      {getMilestoneStatusIcon(milestone.status)}
                    </button>
                    <div>
                      <p className={cn(
                        "font-medium text-sm",
                        milestone.status === 'completed' && "line-through text-slate-500"
                      )}>
                        {milestone.milestoneName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(milestone.targetDate)}
                        <Badge variant="outline" className="text-xs">
                          {milestone.weight}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditMilestone(milestone)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => onMilestoneDelete(milestone.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Flag className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>No milestones defined</p>
              {!readOnly && (
                <Button variant="link" size="sm" onClick={handleAddMilestone}>
                  Add your first milestone
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependencies Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Dependencies
            </CardTitle>
            <CardDescription>Activities that must be completed before this one</CardDescription>
          </div>
          {!readOnly && availableActivities.length > 0 && (
            <Button size="sm" onClick={handleAddDependency} className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {dependencies.length > 0 ? (
            <div className="space-y-2">
              {dependencies.map(dep => {
                const depActivity = allActivities.find(a => a.id === dep.dependsOnActivityId);
                if (!depActivity) return null;

                return (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-mono text-xs">
                          {depActivity.activityCode}
                        </Badge>
                        <span className="text-slate-600">{depActivity.activityName}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{activity.activityCode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {DEPENDENCY_TYPE_LABELS[dep.dependencyType]}
                      </Badge>
                      {dep.lagDays > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +{dep.lagDays}d
                        </Badge>
                      )}
                      {dep.isMandatory && (
                        <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>
                      )}
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => onDependencyDelete(dep.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Link2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>No dependencies defined</p>
              <p className="text-xs">This activity can start independently</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Dialog */}
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
            <DialogDescription>Define a key deliverable or checkpoint</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Milestone Name *</Label>
              <Input
                value={milestoneForm.milestoneName}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, milestoneName: e.target.value }))}
                placeholder="e.g., Phase 1 Complete"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the milestone"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Date *</Label>
                <Input
                  type="date"
                  value={milestoneForm.targetDate}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, targetDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={milestoneForm.weight}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-slate-500">Percentage of overall activity completion</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMilestone}>
              {editingMilestone ? 'Save Changes' : 'Add Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dependency Dialog */}
      <Dialog open={dependencyDialogOpen} onOpenChange={setDependencyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
            <DialogDescription>Select an activity that must be completed first</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Depends On *</Label>
              <Select
                value={dependencyForm.dependsOnActivityId}
                onValueChange={(v) => setDependencyForm(prev => ({ ...prev, dependsOnActivityId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an activity" />
                </SelectTrigger>
                <SelectContent>
                  {availableActivities.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.activityCode} - {a.activityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dependency Type</Label>
              <Select
                value={dependencyForm.dependencyType}
                onValueChange={(v) => setDependencyForm(prev => ({ ...prev, dependencyType: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPENDENCY_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lag Days</Label>
              <Input
                type="number"
                min="0"
                value={dependencyForm.lagDays}
                onChange={(e) => setDependencyForm(prev => ({ ...prev, lagDays: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-slate-500">Days to wait after dependency is complete</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDependencyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDependency}>Add Dependency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
