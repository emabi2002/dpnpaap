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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Check,
  Database,
  Edit,
  Loader2,
  Save,
  Settings,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { donorCodes } from '@/lib/database';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useSupabaseAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    strictBudgetValidation: false,
    requireRevisedBudget: true,
    allowZeroCashflow: true,
    emailNotifications: true,
    auditLogRetention: 365,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isAdmin, router]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Settings saved successfully');
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
            <p className="text-slate-500">
              Configure system behavior and validation rules
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Validation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Validation Rules
            </CardTitle>
            <CardDescription>
              Configure budget and cashflow validation behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="strictValidation" className="text-base">
                  Strict Budget Validation
                </Label>
                <p className="text-sm text-slate-500">
                  Prevent submission if annual cashflow does not match revised budget
                </p>
              </div>
              <Switch
                id="strictValidation"
                checked={settings.strictBudgetValidation}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, strictBudgetValidation: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireRevised" className="text-base">
                  Require Revised Budget
                </Label>
                <p className="text-sm text-slate-500">
                  Require revised budget to be entered before submission
                </p>
              </div>
              <Switch
                id="requireRevised"
                checked={settings.requireRevisedBudget}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, requireRevisedBudget: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowZero" className="text-base">
                  Allow Zero Cashflow
                </Label>
                <p className="text-sm text-slate-500">
                  Allow budget lines with all months set to zero
                </p>
              </div>
              <Switch
                id="allowZero"
                checked={settings.allowZeroCashflow}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, allowZeroCashflow: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure system notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotif" className="text-base">
                  Email Notifications
                </Label>
                <p className="text-sm text-slate-500">
                  Send email notifications for workflow actions
                </p>
              </div>
              <Switch
                id="emailNotif"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              System data and audit settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="retention">Audit Log Retention (days)</Label>
              <Input
                id="retention"
                type="number"
                value={settings.auditLogRetention}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, auditLogRetention: parseInt(e.target.value) }))
                }
                className="max-w-[200px]"
              />
              <p className="text-sm text-slate-500">
                Number of days to retain audit log entries
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Donor Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Donor Codes</CardTitle>
            <CardDescription>
              Funding source codes used in budget submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Code</TableHead>
                  <TableHead>Donor Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donorCodes.map(donor => (
                  <TableRow key={donor.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {donor.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{donor.donorName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          donor.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }
                      >
                        {donor.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <p>DNPM Budget System v1.0.0</p>
                <p className="text-slate-400">Papua New Guinea Government</p>
              </div>
              <Badge variant="outline" className="bg-white">
                <Check className="h-3 w-3 mr-1 text-emerald-500" />
                System Online
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
