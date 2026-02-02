'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Building2,
  Edit,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { agencies, projects, users, generateId } from '@/lib/database';
import type { Agency } from '@/lib/types';

export default function AgenciesPage() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useSupabaseAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    agencyName: '',
    agencyCode: '',
    sector: '',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isAdmin, router]);

  const handleOpenDialog = (agency?: Agency) => {
    if (agency) {
      setEditingAgency(agency);
      setFormData({
        agencyName: agency.agencyName,
        agencyCode: agency.agencyCode || '',
        sector: agency.sector || '',
        contactPerson: agency.contactPerson,
        email: agency.email,
        phone: agency.phone || '',
        status: agency.status,
      });
    } else {
      setEditingAgency(null);
      setFormData({
        agencyName: '',
        agencyCode: '',
        sector: '',
        contactPerson: '',
        email: '',
        phone: '',
        status: 'active',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.agencyName || !formData.contactPerson || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (editingAgency) {
      const index = agencies.findIndex(a => a.id === editingAgency.id);
      if (index !== -1) {
        agencies[index] = {
          ...editingAgency,
          ...formData,
        };
      }
      toast.success('Agency updated');
    } else {
      agencies.push({
        id: generateId(),
        ...formData,
        createdAt: new Date(),
      });
      toast.success('Agency created');
    }

    setShowDialog(false);
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

  const filteredAgencies = agencies.filter(a =>
    a.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.agencyCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Agencies">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agencies</h1>
            <p className="text-slate-500">
              Manage government departments and agencies
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Agency
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search agencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map(agency => {
                  const projectCount = projects.filter(p => p.agencyId === agency.id).length;
                  const userCount = users.filter(u => u.agencyId === agency.id).length;

                  return (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium">{agency.agencyName}</p>
                            <p className="text-sm text-slate-500">{agency.agencyCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {agency.sector || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            <User className="h-3 w-3" />
                            {agency.contactPerson}
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Mail className="h-3 w-3" />
                            {agency.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{projectCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{userCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            agency.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }
                        >
                          {agency.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(agency)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAgency ? 'Edit Agency' : 'Add Agency'}
              </DialogTitle>
              <DialogDescription>
                {editingAgency
                  ? 'Update agency information'
                  : 'Create a new government agency'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name *</Label>
                <Input
                  id="agencyName"
                  value={formData.agencyName}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, agencyName: e.target.value }))
                  }
                  placeholder="e.g., Department of Finance"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyCode">Agency Code</Label>
                  <Input
                    id="agencyCode"
                    value={formData.agencyCode}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, agencyCode: e.target.value }))
                    }
                    placeholder="e.g., DOF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, sector: e.target.value }))
                    }
                    placeholder="e.g., Finance & Treasury"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, contactPerson: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="email@agency.gov.pg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+675 xxx xxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAgency ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
