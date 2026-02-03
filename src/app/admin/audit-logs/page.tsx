'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  FileText,
  Settings,
  Shield,
  Edit,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock audit log data
const auditLogs = [
  {
    id: '1',
    timestamp: new Date('2026-01-28T14:45:00'),
    user: 'Dr. Koney Samuel',
    userEmail: 'director@dnpm.gov.pg',
    action: 'approve',
    entity: 'project',
    entityName: 'National Education Quality Improvement',
    entityId: 'proj_001',
    details: 'Project approved by DNPM',
    ipAddress: '192.168.1.100',
    status: 'success',
  },
  {
    id: '2',
    timestamp: new Date('2026-01-28T12:30:00'),
    user: 'Janet Ila',
    userEmail: 'analyst@dnpm.gov.pg',
    action: 'update',
    entity: 'budget_line',
    entityName: 'Personnel Costs - DOH',
    entityId: 'bl_045',
    details: 'Revised budget updated from K 500,000 to K 550,000',
    ipAddress: '192.168.1.101',
    status: 'success',
  },
  {
    id: '3',
    timestamp: new Date('2026-01-28T10:15:00'),
    user: 'Paul Korare',
    userEmail: 'budget@npc.gov.pg',
    action: 'create',
    entity: 'project',
    entityName: 'Procurement System Upgrade',
    entityId: 'proj_005',
    details: 'New project created for FY2026',
    ipAddress: '192.168.1.102',
    status: 'success',
  },
  {
    id: '4',
    timestamp: new Date('2026-01-27T16:20:00'),
    user: 'Elizabeth Mave',
    userEmail: 'cfo@npc.gov.pg',
    action: 'submit',
    entity: 'project',
    entityName: 'Procurement System Upgrade',
    entityId: 'proj_005',
    details: 'Project submitted for DNPM review',
    ipAddress: '192.168.1.103',
    status: 'success',
  },
  {
    id: '5',
    timestamp: new Date('2026-01-27T14:00:00'),
    user: 'System Administrator',
    userEmail: 'admin@dnpm.gov.pg',
    action: 'update',
    entity: 'user',
    entityName: 'New User Account',
    entityId: 'user_012',
    details: 'User role changed from agency_user to agency_approver',
    ipAddress: '192.168.1.1',
    status: 'success',
  },
  {
    id: '6',
    timestamp: new Date('2026-01-27T11:30:00'),
    user: 'Dr. Koney Samuel',
    userEmail: 'director@dnpm.gov.pg',
    action: 'return',
    entity: 'project',
    entityName: 'Rural Health Facilities Program',
    entityId: 'proj_003',
    details: 'Project returned for corrections - missing cashflow data',
    ipAddress: '192.168.1.100',
    status: 'success',
  },
  {
    id: '7',
    timestamp: new Date('2026-01-26T09:45:00'),
    user: 'System',
    userEmail: 'system@dnpm.gov.pg',
    action: 'backup',
    entity: 'system',
    entityName: 'Database Backup',
    entityId: 'backup_026',
    details: 'Automated daily backup completed successfully',
    ipAddress: '127.0.0.1',
    status: 'success',
  },
  {
    id: '8',
    timestamp: new Date('2026-01-26T08:00:00'),
    user: 'Janet Ila',
    userEmail: 'analyst@dnpm.gov.pg',
    action: 'login',
    entity: 'session',
    entityName: 'User Session',
    entityId: 'sess_189',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.101',
    status: 'success',
  },
  {
    id: '9',
    timestamp: new Date('2026-01-25T17:30:00'),
    user: 'Unknown',
    userEmail: 'unknown@test.com',
    action: 'login',
    entity: 'session',
    entityName: 'Failed Login Attempt',
    entityId: 'sess_fail_012',
    details: 'Failed login attempt - invalid credentials',
    ipAddress: '203.45.67.89',
    status: 'failed',
  },
  {
    id: '10',
    timestamp: new Date('2026-01-25T14:15:00'),
    user: 'System Administrator',
    userEmail: 'admin@dnpm.gov.pg',
    action: 'delete',
    entity: 'attachment',
    entityName: 'Old Budget Document',
    entityId: 'att_034',
    details: 'Attachment deleted from project',
    ipAddress: '192.168.1.1',
    status: 'success',
  },
];

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  approve: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  submit: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  return: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  login: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  backup: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-3 w-3" />,
  update: <Edit className="h-3 w-3" />,
  delete: <Trash2 className="h-3 w-3" />,
  approve: <CheckCircle className="h-3 w-3" />,
  submit: <FileText className="h-3 w-3" />,
  return: <XCircle className="h-3 w-3" />,
  login: <User className="h-3 w-3" />,
  backup: <Settings className="h-3 w-3" />,
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useSupabaseAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesEntity = entityFilter === 'all' || log.entity === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [searchQuery, actionFilter, entityFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header
        title="Audit Logs"
        subtitle="Track all system activities and changes"
        tabs={[
          { label: 'All Logs', href: '/admin/audit-logs' },
          { label: 'Security', href: '/admin/audit-logs?type=security' },
          { label: 'Changes', href: '/admin/audit-logs?type=changes' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Logs</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{auditLogs.length}</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Today</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">4</p>
                </div>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Users Active</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">6</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Failed Actions</p>
                  <p className="text-2xl font-bold text-red-600">1</p>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by user, entity, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="submit">Submit</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="budget_line">Budget Line</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="session">Session</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {log.timestamp.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {log.timestamp.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{log.user}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{log.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('gap-1 capitalize', actionColors[log.action])}>
                        {actionIcons[log.action]}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
                          {log.entityName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{log.entity.replace('_', ' ')}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[300px]">
                        {log.details}
                      </p>
                    </TableCell>
                    <TableCell>
                      {log.status === 'success' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700">
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700">
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
