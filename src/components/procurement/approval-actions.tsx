'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/alert-dialog';
import {
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  Lock,
  Unlock,
  Clock,
  User,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PROCUREMENT_PLAN_STATUS_LABELS,
  PROCUREMENT_PLAN_STATUS_COLORS,
  type ProcurementPlan,
  type ProcurementPlanStatus,
  type UserRole,
} from '@/lib/types';
import { getUserById } from '@/lib/database';
import { cn } from '@/lib/utils';

interface WorkflowAction {
  id: string;
  actionType: string;
  fromStatus: ProcurementPlanStatus | null;
  toStatus: ProcurementPlanStatus;
  actionBy: string;
  actionDate: Date;
  comments?: string;
}

interface ApprovalActionsProps {
  plan: ProcurementPlan;
  userRole: UserRole;
  userId: string;
  userAgencyId?: string | null;
  onStatusChange: (newStatus: ProcurementPlanStatus, comments?: string) => Promise<void>;
}

// Mock workflow history for demo
const getMockWorkflowHistory = (planId: string): WorkflowAction[] => {
  const baseHistory: WorkflowAction[] = [
    {
      id: '1',
      actionType: 'create',
      fromStatus: null,
      toStatus: 'draft',
      actionBy: 'user_npc_user',
      actionDate: new Date('2026-01-05'),
      comments: 'Plan created',
    },
  ];

  // Add more history based on plan status
  if (planId === 'pp_npc_2026') {
    return [
      ...baseHistory,
      {
        id: '2',
        actionType: 'submit',
        fromStatus: 'draft',
        toStatus: 'submitted',
        actionBy: 'user_npc_user',
        actionDate: new Date('2026-01-08'),
        comments: 'Submitting for agency approval',
      },
      {
        id: '3',
        actionType: 'approve_agency',
        fromStatus: 'submitted',
        toStatus: 'approved_by_agency',
        actionBy: 'user_npc_approver',
        actionDate: new Date('2026-01-10'),
        comments: 'Approved by agency head',
      },
      {
        id: '4',
        actionType: 'approve_dnpm',
        fromStatus: 'under_dnpm_review',
        toStatus: 'approved_by_dnpm',
        actionBy: 'user_dnpm_approver',
        actionDate: new Date('2026-01-18'),
        comments: 'Approved. Plan meets all requirements.',
      },
    ];
  }

  return baseHistory;
};

export function ProcurementApprovalActions({
  plan,
  userRole,
  userId,
  userAgencyId,
  onStatusChange,
}: ApprovalActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    status: ProcurementPlanStatus;
    label: string;
    type: 'approve' | 'return' | 'submit' | 'lock' | 'unlock';
  } | null>(null);
  const [comments, setComments] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const workflowHistory = getMockWorkflowHistory(plan.id);

  const isDNPM = ['dnpm_reviewer', 'dnpm_approver', 'system_admin'].includes(userRole);
  const isAgencyApprover = userRole === 'agency_approver';
  const isAgencyUser = userRole === 'agency_user';
  const isAdmin = userRole === 'system_admin';
  const isOwnAgency = userAgencyId === plan.agencyId;

  // Determine available actions based on current status and user role
  const getAvailableActions = () => {
    const actions: {
      status: ProcurementPlanStatus;
      label: string;
      icon: React.ReactNode;
      variant: 'default' | 'destructive' | 'outline' | 'secondary';
      type: 'approve' | 'return' | 'submit' | 'lock' | 'unlock';
      requiresComments: boolean;
    }[] = [];

    switch (plan.status) {
      case 'draft':
        if ((isAgencyUser || isAgencyApprover) && isOwnAgency) {
          actions.push({
            status: 'submitted',
            label: 'Submit for Approval',
            icon: <Send className="h-4 w-4" />,
            variant: 'default',
            type: 'submit',
            requiresComments: false,
          });
        }
        break;

      case 'submitted':
        if (isAgencyApprover && isOwnAgency) {
          actions.push({
            status: 'approved_by_agency',
            label: 'Approve (Agency)',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'default',
            type: 'approve',
            requiresComments: false,
          });
          actions.push({
            status: 'draft',
            label: 'Return to Draft',
            icon: <RotateCcw className="h-4 w-4" />,
            variant: 'outline',
            type: 'return',
            requiresComments: true,
          });
        }
        break;

      case 'approved_by_agency':
        if (isDNPM) {
          actions.push({
            status: 'under_dnpm_review',
            label: 'Start DNPM Review',
            icon: <Clock className="h-4 w-4" />,
            variant: 'secondary',
            type: 'approve',
            requiresComments: false,
          });
        }
        break;

      case 'under_dnpm_review':
        if (isDNPM) {
          actions.push({
            status: 'approved_by_dnpm',
            label: 'Approve (DNPM)',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'default',
            type: 'approve',
            requiresComments: false,
          });
          actions.push({
            status: 'returned',
            label: 'Return for Correction',
            icon: <XCircle className="h-4 w-4" />,
            variant: 'destructive',
            type: 'return',
            requiresComments: true,
          });
        }
        break;

      case 'approved_by_dnpm':
        if (isAdmin) {
          actions.push({
            status: 'locked',
            label: 'Lock Plan',
            icon: <Lock className="h-4 w-4" />,
            variant: 'outline',
            type: 'lock',
            requiresComments: false,
          });
        }
        break;

      case 'locked':
        if (isAdmin) {
          actions.push({
            status: 'approved_by_dnpm',
            label: 'Unlock Plan',
            icon: <Unlock className="h-4 w-4" />,
            variant: 'outline',
            type: 'unlock',
            requiresComments: true,
          });
        }
        break;

      case 'returned':
        if ((isAgencyUser || isAgencyApprover) && isOwnAgency) {
          actions.push({
            status: 'submitted',
            label: 'Resubmit',
            icon: <Send className="h-4 w-4" />,
            variant: 'default',
            type: 'submit',
            requiresComments: false,
          });
        }
        break;
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  const handleActionClick = (action: typeof availableActions[0]) => {
    setPendingAction({
      status: action.status,
      label: action.label,
      type: action.type,
    });

    if (action.requiresComments) {
      setComments('');
      setShowCommentsDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    setIsProcessing(true);
    try {
      await onStatusChange(pendingAction.status, comments || undefined);
      toast.success(`Plan ${pendingAction.label.toLowerCase()} successfully`);
    } catch (error) {
      toast.error('Failed to update plan status');
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setShowCommentsDialog(false);
      setPendingAction(null);
      setComments('');
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <Clock className="h-4 w-4 text-slate-500" />;
      case 'submit':
        return <Send className="h-4 w-4 text-amber-500" />;
      case 'approve_agency':
      case 'approve_dnpm':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'return':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'lock':
        return <Lock className="h-4 w-4 text-slate-500" />;
      case 'unlock':
        return <Unlock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'Created';
      case 'submit':
        return 'Submitted';
      case 'approve_agency':
        return 'Agency Approved';
      case 'approve_dnpm':
        return 'DNPM Approved';
      case 'return':
        return 'Returned';
      case 'lock':
        return 'Locked';
      case 'unlock':
        return 'Unlocked';
      default:
        return actionType;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Workflow Actions</span>
            <Badge className={cn('text-xs', PROCUREMENT_PLAN_STATUS_COLORS[plan.status])}>
              {PROCUREMENT_PLAN_STATUS_LABELS[plan.status]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Action Buttons */}
          {availableActions.length > 0 ? (
            <div className="space-y-2">
              {availableActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant={action.variant}
                  className={cn(
                    'w-full gap-2',
                    action.type === 'approve' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                    action.type === 'submit' && 'bg-amber-500 hover:bg-amber-600 text-white'
                  )}
                  onClick={() => handleActionClick(action)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-2">
              No actions available for your role
            </p>
          )}

          {/* Status Info */}
          <div className="pt-2 border-t text-xs text-slate-500 space-y-1">
            {plan.submittedAt && (
              <p className="flex items-center gap-1">
                <Send className="h-3 w-3" />
                Submitted: {new Date(plan.submittedAt).toLocaleDateString()}
              </p>
            )}
            {plan.approvedAt && (
              <p className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Approved: {new Date(plan.approvedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Workflow History Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide History
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show History ({workflowHistory.length})
              </>
            )}
          </Button>

          {/* Workflow History */}
          {showHistory && (
            <div className="pt-2 border-t space-y-2 max-h-48 overflow-y-auto">
              {workflowHistory.map((action) => {
                const actionUser = getUserById(action.actionBy);
                return (
                  <div key={action.id} className="flex gap-2 text-xs">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionTypeIcon(action.actionType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {getActionTypeLabel(action.actionType)}
                      </p>
                      <p className="text-slate-500 truncate">
                        {actionUser?.name || 'Unknown'} - {new Date(action.actionDate).toLocaleDateString()}
                      </p>
                      {action.comments && (
                        <p className="text-slate-500 italic mt-0.5 truncate">
                          "{action.comments}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingAction?.label}</DialogTitle>
            <DialogDescription>
              Please provide a reason or comments for this action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="comments">Comments *</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter your comments..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentsDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              disabled={!comments.trim() || isProcessing}
              className={cn(
                pendingAction?.type === 'return' && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingAction?.label.toLowerCase()}?
              This action will change the plan status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={cn(
                pendingAction?.type === 'approve' && 'bg-emerald-600 hover:bg-emerald-700',
                pendingAction?.type === 'submit' && 'bg-amber-500 hover:bg-amber-600'
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
