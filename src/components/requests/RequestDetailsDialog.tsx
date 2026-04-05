"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle, Loader } from "lucide-react";

interface Request {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

interface RequestDetailsDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (requestId: string, comment?: string) => Promise<void>;
  onDeny?: (requestId: string, comment: string) => Promise<void>;
  canApprove?: boolean;
}

export function RequestDetailsDialog({
  request,
  open,
  onOpenChange,
  onApprove,
  onDeny,
  canApprove = true,
}: RequestDetailsDialogProps) {
  const [denyComment, setDenyComment] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [isDenying, setIsDenying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState("");

  if (!request) return null;

  const handleApprove = async () => {
    if (!onApprove) return;
    try {
      setError("");
      setIsApproving(true);
      await onApprove(request.id, approveComment);
      setApproveComment("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to approve request");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeny = async () => {
    if (!onDeny) return;
    if (!denyComment.trim()) {
      setError("Comment is required when denying a request");
      return;
    }
    try {
      setError("");
      setIsDenying(true);
      await onDeny(request.id, denyComment);
      setDenyComment("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to deny request");
    } finally {
      setIsDenying(false);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ADD_PROJECT: "Create Project",
      EDIT_PROJECT: "Edit Project",
      ADD_TASK: "Create Task",
      EDIT_TASK: "Edit Task",
      CLIENT_CONTACT: "Client Message",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "DENIED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderPayload = () => {
    if (request.type === "CLIENT_CONTACT") {
      return (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="font-medium text-slate-900 mb-1">{request.payload.title}</h4>
            <div className="text-sm text-slate-600 whitespace-pre-wrap">
              {request.payload.description}
            </div>
            {request.payload.timestamp && (
              <div className="mt-2 text-xs text-slate-400">
                Sent: {new Date(request.payload.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default rendering for other types
    return (
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">
          Request Details
        </h3>
        {Object.entries(request.payload).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start text-sm">
            <span className="font-medium text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
            </span>
            <span className="text-gray-900 text-right break-words max-w-xs">
              {typeof value === "string" || typeof value === "number"
                ? String(value)
                : JSON.stringify(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getRequestTypeLabel(request.type)}
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Submitted by {request.createdBy.name} on{" "}
            {new Date(request.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Details */}
          {renderPayload()}

          {/* Status Info */}
          {request.status !== "PENDING" && request.reviewedBy && (
            <>
              <Separator />
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-blue-900 flex items-center gap-2">
                  {request.status === "APPROVED" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> {request.type === 'CLIENT_CONTACT' ? 'Resolved / Replied' : 'Approved'}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" /> Denied
                    </>
                  )}
                </h3>
                <p className="text-xs text-blue-700">
                  Reviewed by <strong>{request.reviewedBy.name}</strong> on{" "}
                  {new Date(request.updatedAt).toLocaleString()}
                </p>
                {request.comment && (
                  <div className="mt-2 bg-white rounded p-2 border border-blue-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {request.status === 'APPROVED' ? 'Reply / Comment:' : 'Reason / Comment:'}
                    </p>
                    <p className="text-sm text-gray-900">{request.comment}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Comments for PENDING */}
          {request.status === "PENDING" && (
            <div className="grid gap-4">
              {request.type === 'CLIENT_CONTACT' ? (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Reply Message
                  </label>
                  <Textarea
                    placeholder="Type your reply to the client here..."
                    value={approveComment}
                    onChange={(e) => setApproveComment(e.target.value)}
                    className="mb-2"
                  />
                  <p className="text-xs text-slate-500">
                    Clicking "Resolve & Reply" will send this message and mark the request as resolved.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Optional: Approval Note</label>
                    <Textarea
                      placeholder="Add a note..."
                      value={approveComment}
                      onChange={(e) => setApproveComment(e.target.value)}
                      className="text-sm h-20"
                    />
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <label className="text-xs font-medium text-red-800 mb-1 block">Denial Reason</label>
                    <Textarea
                      placeholder="Required if denying..."
                      value={denyComment}
                      onChange={(e) => setDenyComment(e.target.value)}
                      className="text-sm h-20 border-red-200 focus-visible:ring-red-500"
                    />
                  </div>
                </>
              )}
              {!canApprove && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Only an admin can approve this request type.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {request.status === "PENDING" && (
            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isApproving || isDenying}
              >
                Cancel
              </Button>

              {request.type !== 'CLIENT_CONTACT' && (
                <Button
                  variant="destructive"
                  onClick={handleDeny}
                  disabled={isApproving || isDenying}
                >
                  {isDenying ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Denying...
                    </>
                  ) : (
                    "Deny"
                  )}
                </Button>
              )}

              <Button
                onClick={handleApprove}
                disabled={isApproving || isDenying || !canApprove}
                className={request.type === 'CLIENT_CONTACT' ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}
              >
                {isApproving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {request.type === 'CLIENT_CONTACT' ? "Sending..." : "Approving..."}
                  </>
                ) : (
                  request.type === 'CLIENT_CONTACT' ? "Resolve & Reply" : "Approve"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
