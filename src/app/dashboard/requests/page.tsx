'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RequestDetailsDialog } from '@/components/requests/RequestDetailsDialog';
import { AlertCircle, CheckCircle2, Eye, RefreshCw, Clock, MessageSquare, ArrowRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getDevRoleFromStorage } from '@/context/DevRoleContext';
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useRole } from '@/hooks/useCurrentUser';

interface Request {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
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

export default function RequestsPage() {
  const role = useRole();
  const currentRole = getDevRoleFromStorage();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("PENDING");

  // Use authenticated role if available, otherwise use dev role
  const effectiveRole = role !== "CLIENT" ? role : currentRole;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const currentRole = getDevRoleFromStorage();
      const userId = `dev-${currentRole.toLowerCase()}`;

      const res = await fetch("/api/requests", {
        headers: {
          "x-dev-role": currentRole,
          "x-user-id": userId,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch requests");
      }
      const data = await res.json();
      // Sort newest first
      data.sort((a: Request, b: Request) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string, comment?: string) => {
    try {
      const currentRole = getDevRoleFromStorage();
      const userId = `dev-${currentRole.toLowerCase()}`;

      const res = await fetch(`/api/requests/${requestId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dev-role": currentRole,
          "x-user-id": userId,
        },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve request");
      }
      toast.success("Request approved successfully");
      const updatedRequest = await res.json();
      setRequests(requests.map(r => r.id === requestId ? { ...r, status: "APPROVED", comment: comment } : r));
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve request");
      throw err;
    }
  };

  const canApproveRequest = (roleToCheck: string, requestType: string) => {
    if (roleToCheck === "ADMIN") return true;
    if (roleToCheck === "MANAGER" && ["ADD_TASK", "EDIT_TASK", "ADD_DOCUMENT", "EDIT_DOCUMENT"].includes(requestType)) return true;
    // Managers cannot approve project requests
    return false;
  };

  const handleDeny = async (requestId: string, comment: string) => {
    try {
      const currentRole = getDevRoleFromStorage();
      const userId = `dev-${currentRole.toLowerCase()}`;

      const res = await fetch(`/api/requests/${requestId}/deny`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dev-role": currentRole,
          "x-user-id": userId,
        },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deny request");
      }
      toast.success("Request denied successfully");
      setRequests(requests.map(r => r.id === requestId ? { ...r, status: "DENIED", comment } : r));
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to deny request");
      throw err;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ADD_PROJECT: "Project Creation",
      EDIT_PROJECT: "Project Update",
      ADD_TASK: "Task Creation",
      EDIT_TASK: "Task Update",
      CLIENT_CONTACT: "Client Message",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "DENIED": return "bg-red-100 text-red-800 border-red-200";
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleResubmit = (request: Request) => {
    window.location.href = `/dashboard/submit-request?requestId=${request.id}`;
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === "ALL") return true;
    return req.status === activeTab;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={role === "ENGINEER" ? "My Requests" : "Approval Requests"}
        description={role === "ENGINEER" ? "Track status of your submitted requests." : "Review and approve/deny requests from engineers."}
        actionLabel="Refresh"
        onActionClick={fetchRequests}
        actionIcon={RefreshCw}
      />

      <Tabs defaultValue="PENDING" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-xl mb-8 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="PENDING" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Approved</TabsTrigger>
          <TabsTrigger value="DENIED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Denied</TabsTrigger>
          <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">All History</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <div className="mx-auto h-12 w-12 text-slate-400 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500">No requests in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="group hover:shadow-md transition-all duration-200 border-slate-200 overflow-hidden">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    <div className={`w-2 ${request.status === 'APPROVED' ? 'bg-emerald-500' :
                      request.status === 'DENIED' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />

                    <div className="p-5 flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-semibold">{getRequestTypeLabel(request.type)}</Badge>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h3 className="font-medium text-slate-900">{request.payload.name || request.payload.title || 'Untitled Request'}</h3>
                        <p className="text-sm text-slate-500">Submitted by <span className="text-slate-700 font-medium">{request.createdBy.name}</span></p>
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-center">
                        {request.status === 'DENIED' && (
                          <div className="text-right mr-4 hidden md:block">
                            <p className="text-xs text-red-600 font-medium flex items-center justify-end gap-1">
                              <MessageSquare className="h-3 w-3" /> Denied Reason
                            </p>
                            <p className="text-xs text-slate-500 max-w-[200px] truncate" title={request.comment}>{request.comment}</p>
                          </div>
                        )}

                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>

                        <div className="flex gap-2">
                          {role === "ENGINEER" && request.status === "DENIED" && (
                            <Button size="sm" variant="outline" onClick={() => handleResubmit(request)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resubmit
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedRequest(request); setDialogOpen(true); }}>
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <RequestDetailsDialog
        request={selectedRequest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApprove={handleApprove}
        onDeny={handleDeny}
        canApprove={selectedRequest ? canApproveRequest(effectiveRole, selectedRequest.type) : false}
      />
    </div>
  );
}
