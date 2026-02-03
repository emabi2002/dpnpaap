'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Calendar,
  FileText,
  GitBranch,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Database,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { financialYears } from '@/lib/database';
import { useWorkplanData } from '@/lib/supabase/workplan-data-provider';
import { cn } from '@/lib/utils';

// Activity template type
interface ActivityTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  defaultUnit: string;
  category: string;
  isActive: boolean;
}

// Status workflow configuration
interface StatusTransition {
  from: string;
  to: string;
  roles: string[];
  requiresComment: boolean;
}

// Sample activity templates
const defaultTemplates: ActivityTemplate[] = [
  { id: '1', name: 'Training Program', code: 'TRN', description: 'Conduct training sessions', defaultUnit: 'Training Unit', category: 'Capacity Building', isActive: true },
  { id: '2', name: 'Infrastructure Development', code: 'INF', description: 'Build or upgrade facilities', defaultUnit: 'Infrastructure', category: 'Capital Works', isActive: true },
  { id: '3', name: 'Equipment Procurement', code: 'EQP', description: 'Purchase equipment and supplies', defaultUnit: 'Procurement', category: 'Procurement', isActive: true },
  { id: '4', name: 'Policy Development', code: 'POL', description: 'Develop policies and guidelines', defaultUnit: 'Policy Division', category: 'Governance', isActive: true },
  { id: '5', name: 'Monitoring & Evaluation', code: 'M&E', description: 'Track progress and outcomes', defaultUnit: 'M&E Unit', category: 'Oversight', isActive: true },
];

// Default status transitions
const defaultTransitions: StatusTransition[] = [
  { from: 'draft', to: 'submitted', roles: ['agency_user', 'agency_approver'], requiresComment: false },
  { from: 'submitted', to: 'approved', roles: ['dnpm_reviewer', 'dnpm_approver'], requiresComment: false },
  { from: 'submitted', to: 'draft', roles: ['dnpm_reviewer', 'dnpm_approver'], requiresComment: true },
  { from: 'approved', to: 'in_progress', roles: ['agency_user', 'agency_approver'], requiresComment: false },
  { from: 'in_progress', to: 'completed', roles: ['agency_approver', 'dnpm_approver'], requiresComment: false },
  { from: 'in_progress', to: 'delayed', roles: ['agency_user', 'agency_approver'], requiresComment: true },
  { from: 'completed', to: 'in_progress', roles: ['dnpm_approver', 'system_admin'], requiresComment: true },
];

export default function WorkplanSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAdmin } = useSupabaseAuth();
  const { connectionStatus, isUsingSupabase, refreshConnection } = useWorkplanData();

  const [templates, setTemplates] = useState<ActivityTemplate[]>(defaultTemplates);
  const [transitions, setTransitions] = useState<StatusTransition[]>(defaultTransitions);
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    requireApprovalForSubmission: true,
    allowBulkImport: true,
    maxActivitiesPerWorkplan: 100,
    budgetWarningThreshold: 90,
    autoCalculateTotalBudget: true,
    enableRealTimeSync: true,
    defaultFinancialYear: 'fy_2026',
    submissionDeadlineReminder: 7,
  });

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center flex-col gap-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <p className="text-lg font-medium text-slate-700">Access Denied</p>
          <p className="text-slate-500">You need admin privileges to access this page.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Settings saved successfully');
    setIsSaving(false);
  };

  const handleAddTemplate = () => {
    setEditingTemplate({
      id: `template_${Date.now()}`,
      name: '',
      code: '',
      description: '',
      defaultUnit: '',
      category: '',
      isActive: true,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: ActivityTemplate) => {
    setEditingTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    if (templates.find(t => t.id === editingTemplate.id)) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));
      toast.success('Template updated');
    } else {
      setTemplates(prev => [...prev, editingTemplate]);
      toast.success('Template created');
    }
    setIsTemplateDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      submitted: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      delayed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <AppLayout>
      <Header
        title="Workplan Settings"
        subtitle="Configure workplan system settings and templates"
      />

      <div className="p-6 space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>Configure basic workplan system behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultFY">Default Financial Year</Label>
                    <Select
                      value={settings.defaultFinancialYear}
                      onValueChange={(v) => setSettings(prev => ({ ...prev, defaultFinancialYear: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {financialYears.map(fy => (
                          <SelectItem key={fy.id} value={fy.id}>
                            FY {fy.year} ({fy.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxActivities">Max Activities per Workplan</Label>
                    <Input
                      id="maxActivities"
                      type="number"
                      value={settings.maxActivitiesPerWorkplan}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxActivitiesPerWorkplan: parseInt(e.target.value) || 100 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetThreshold">Budget Warning Threshold (%)</Label>
                    <Input
                      id="budgetThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.budgetWarningThreshold}
                      onChange={(e) => setSettings(prev => ({ ...prev, budgetWarningThreshold: parseInt(e.target.value) || 90 }))}
                    />
                    <p className="text-xs text-slate-500">Show warning when budget utilization exceeds this threshold</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">Submission Deadline Reminder (days)</Label>
                    <Input
                      id="reminderDays"
                      type="number"
                      value={settings.submissionDeadlineReminder}
                      onChange={(e) => setSettings(prev => ({ ...prev, submissionDeadlineReminder: parseInt(e.target.value) || 7 }))}
                    />
                    <p className="text-xs text-slate-500">Days before deadline to send reminder</p>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium text-slate-700">Feature Toggles</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Approval for Submission</Label>
                      <p className="text-sm text-slate-500">Agency approver must approve before DNPM submission</p>
                    </div>
                    <Switch
                      checked={settings.requireApprovalForSubmission}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, requireApprovalForSubmission: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Bulk Import</Label>
                      <p className="text-sm text-slate-500">Enable Excel bulk import for activities</p>
                    </div>
                    <Switch
                      checked={settings.allowBulkImport}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, allowBulkImport: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Calculate Total Budget</Label>
                      <p className="text-sm text-slate-500">Automatically sum quarterly budgets</p>
                    </div>
                    <Switch
                      checked={settings.autoCalculateTotalBudget}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, autoCalculateTotalBudget: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Real-Time Sync</Label>
                      <p className="text-sm text-slate-500">Sync data in real-time with Supabase</p>
                    </div>
                    <Switch
                      checked={settings.enableRealTimeSync}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, enableRealTimeSync: v }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Templates */}
          <TabsContent value="templates" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Activity Templates</CardTitle>
                  <CardDescription>Pre-defined activity templates for quick creation</CardDescription>
                </div>
                <Button onClick={handleAddTemplate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Template
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Default Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell className="font-mono text-sm">{template.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-slate-500">{template.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{template.defaultUnit}</TableCell>
                        <TableCell>
                          <Badge className={template.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Configuration */}
          <TabsContent value="workflow" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Workflow</CardTitle>
                <CardDescription>Configure allowed status transitions and required roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From Status</TableHead>
                      <TableHead></TableHead>
                      <TableHead>To Status</TableHead>
                      <TableHead>Allowed Roles</TableHead>
                      <TableHead>Requires Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transitions.map((transition, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge className={getStatusColor(transition.from)}>
                            {transition.from.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">→</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transition.to)}>
                            {transition.to.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {transition.roles.map(role => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {transition.requiresComment ? (
                            <CheckCircle2 className="h-4 w-4 text-amber-500" />
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Status */}
          <TabsContent value="database" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Database Connection</CardTitle>
                <CardDescription>Supabase connection status and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      connectionStatus === 'connected' && "bg-emerald-500",
                      connectionStatus === 'disconnected' && "bg-amber-500",
                      connectionStatus === 'error' && "bg-red-500",
                      connectionStatus === 'checking' && "bg-slate-400 animate-pulse"
                    )} />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {connectionStatus === 'connected' && 'Connected to Supabase'}
                        {connectionStatus === 'disconnected' && 'Using Mock Data'}
                        {connectionStatus === 'error' && 'Connection Error'}
                        {connectionStatus === 'checking' && 'Checking Connection...'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {isUsingSupabase
                          ? 'Live data from Supabase database'
                          : 'Local mock data (run SQL schema to enable live data)'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={refreshConnection} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-slate-500">Supabase URL</p>
                    <p className="font-mono text-sm truncate">https://xisychoksilrwwesfosk.supabase.co</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-slate-500">Project ID</p>
                    <p className="font-mono text-sm">xisychoksilrwwesfosk</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Setup Instructions</h4>
                  <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
                    <li>Open Supabase Dashboard at the URL above</li>
                    <li>Navigate to SQL Editor</li>
                    <li>Run <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">supabase/workplan-schema.sql</code></li>
                    <li>Optionally run <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">supabase/workplan-seed.sql</code> for sample data</li>
                    <li>Click Refresh above to verify connection</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Edit Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id.startsWith('template_') ? 'Add Template' : 'Edit Template'}</DialogTitle>
            <DialogDescription>Create or modify activity templates</DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={editingTemplate.code}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, code: e.target.value.toUpperCase() })}
                    placeholder="TRN"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                    placeholder="Capacity Building"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Training Program"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="Conduct training sessions..."
                />
              </div>
              <div className="space-y-2">
                <Label>Default Responsible Unit</Label>
                <Input
                  value={editingTemplate.defaultUnit}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultUnit: e.target.value })}
                  placeholder="Training Unit"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingTemplate.isActive}
                  onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, isActive: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
