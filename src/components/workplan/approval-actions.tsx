'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Lock,
  Loader2,
  History,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Workplan, WorkplanStatus } from '@/lib/types';
import { WORKPLAN_STATUS_LABELS, WORKPLAN_STATUS_COLORS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getUserById } from '@/lib/database';

interface WorkflowAction {
  id: string;
  workplanId: string;
  action: 'submit' | 'approve' | 'return' | 'reopen';
  userId: string;
  timestamp: Date;
  comments?: string;
  fromStatus: WorkplanStatus;
  toStatus: WorkplanStatus;
}

interface ApprovalActionsProps {
  workplan: Workplan;
  userRole: string;
  userId: string;
  onStatusChange: (newStatus: WorkplanStatus, comments?: string) => void;
  workflowHistory?: WorkflowAction[];
}

export function ApprovalActions({
  workplan,
  userRole,
  userId,
  onStatusChange,
  workflowHistory = [],
}: ApprovalActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnComments, setReturnComments] = useState('');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  // Determine available actions based on status and role
  const canSubmit = (userRole === 'agency_user' || userRole === 'agency_approver') &&
    workplan.status === 'draft';

  const canApprove = (userRole === 'dnpm_reviewer' || userRole === 'dnpm_approver' || userRole === 'system_admin') &&
    workplan.status === 'submitted';

  const canReturn = (userRole === 'dnpm_reviewer' || userRole === 'dnpm_approver' || userRole === 'system_admin') &&
    (workplan.status === 'submitted' || workplan.status === 'approved');

  const canReopen = (userRole === 'dnpm_approver' || userRole === 'system_admin') &&
    (workplan.status === 'completed' || workplan.status === 'approved');

  const canMarkInProgress = (userRole === 'agency_user' || userRole === 'agency_approver') &&
    workplan.status === 'approved';

  const canMarkComplete = (userRole === 'agency_approver' || userRole === 'dnpm_approver' || userRole === 'system_admin') &&
    workplan.status === 'in_progress';

  const handleAction = async (action: string, newStatus: WorkplanStatus, comments?: string) => {
    setIsSubmitting(true);
    try {
      await onStatusChange(newStatus, comments);
      toast.success(`Workplan ${action} successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} workplan`);
    } finally {
      setIsSubmitting(false);
      setShowReturnDialog(false);
      setReturnComments('');
    }
  };

  const getStatusIcon = (status: WorkplanStatus) => {
    switch (status) {
      case 'draft':
        return <RotateCcw className="h-4 w-4" />;
      case 'submitted':
        return <Send className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4" />;
      case 'completed':
        return <Lock className="h-4 w-4" />;
      case 'delayed':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Workflow Actions</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistoryDialog(true)}
            className="gap-1 text-xs"
          >
            <History className="h-3 w-3" />
            History
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <span className="text-sm text-slate-600 dark:text-slate-400">Current Status</span>
          <Badge className={cn('gap-1', WORKPLAN_STATUS_COLORS[workplan.status])}>
            {getStatusIcon(workplan.status)}
            {WORKPLAN_STATUS_LABELS[workplan.status]}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {canSubmit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600">
                  <Send className="h-4 w-4" />
                  Submit for Review
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Workplan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will submit the workplan to DNPM for review. You won't be able to edit it until it's returned.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction('submitted', 'submitted')}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {canApprove && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Workplan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Workplan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will approve the workplan and allow the agency to begin implementation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction('approved', 'approved')}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {canReturn && (
            <Button
              variant="outline"
              className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setShowReturnDialog(true)}
            >
              <XCircle className="h-4 w-4" />
              Return for Corrections
            </Button>
          )}

          {canMarkInProgress && (
            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleAction('started', 'in_progress')}
            >
              <Loader2 className="h-4 w-4" />
              Start Implementation
            </Button>
          )}

          {canMarkComplete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                  <Lock className="h-4 w-4" />
                  Mark as Complete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete Workplan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the workplan as completed for the financial year.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction('completed', 'completed')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Complete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {canReopen && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAction('reopened', 'in_progress')}
            >
              <RotateCcw className="h-4 w-4" />
              Reopen Workplan
            </Button>
          )}
        </div>

        {/* Status Info */}
        {workplan.submittedAt && (
          <div className="text-xs text-slate-500 pt-2 border-t">
            <p>Submitted: {new Date(workplan.submittedAt).toLocaleDateString()}</p>
            {workplan.approvedAt && (
              <p>Approved: {new Date(workplan.approvedAt).toLocaleDateString()}</p>
            )}
          </div>
        )}
      </CardContent>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Workplan</DialogTitle>
            <DialogDescription>
              Provide feedback on why the workplan is being returned for corrections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter your comments and required corrections..."
              value={returnComments}
              onChange={(e) => setReturnComments(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction('returned', 'draft', returnComments)}
              disabled={!returnComments.trim()}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Return Workplan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Workflow History</DialogTitle>
            <DialogDescription>
              Complete history of status changes for this workplan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {workflowHistory.length > 0 ? (
              workflowHistory.map((action, idx) => {
                const user = getUserById(action.userId);
                return (
                  <div key={action.id} className="flex gap-3 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        action.action === 'approve' && "bg-emerald-100 text-emerald-600",
                        action.action === 'submit' && "bg-amber-100 text-amber-600",
                        action.action === 'return' && "bg-red-100 text-red-600",
                        action.action === 'reopen' && "bg-blue-100 text-blue-600"
                      )}>
                        {action.action === 'approve' && <CheckCircle2 className="h-4 w-4" />}
                        {action.action === 'submit' && <Send className="h-4 w-4" />}
                        {action.action === 'return' && <XCircle className="h-4 w-4" />}
                        {action.action === 'reopen' && <RotateCcw className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                        {action.action}ed
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <User className="h-3 w-3" />
                        <span>{user?.name || 'Unknown'}</span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>{new Date(action.timestamp).toLocaleString()}</span>
                      </div>
                      {action.comments && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm">
                          <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5" />
                          <p className="text-slate-600 dark:text-slate-400">{action.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No workflow history yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
