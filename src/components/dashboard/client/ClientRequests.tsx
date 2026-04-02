'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Request {
    id: string;
    type: string;
    payload: any;
    status: string;
    comment?: string;
    createdAt: string;
    updatedAt: string;
}

export function ClientRequests() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await fetch('/api/requests');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        // Sort by updated at to show most recent activity first
                        data.sort((a: Request, b: Request) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                        setRequests(data);
                    } else {
                        console.error('Invalid requests format', data);
                        setRequests([]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch requests', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();

        // Poll for updates every 30 seconds
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'DENIED': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-amber-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'DENIED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    if (loading) return <div className="text-sm text-slate-500">Loading messages...</div>;
    if (requests.length === 0) return (
        <div className="text-center py-8 text-slate-500 text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            No history yet
        </div>
    );

    return (
        <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
                {requests.map((req) => (
                    <div key={req.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1">
                                <p className="font-medium text-slate-800 text-sm">
                                    {req.payload?.title || req.type.replace(/_/g, ' ')}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="h-3 w-3" />
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <Badge variant="outline" className={`${getStatusColor(req.status)} text-[10px] px-2 py-0`}>
                                <span className="mr-1">{getStatusIcon(req.status)}</span>
                                {req.status}
                            </Badge>
                        </div>

                        {/* Message Preview */}
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2 bg-white p-2 rounded border border-slate-100 italic">
                            "{req.payload?.description || 'No content'}"
                        </p>

                        {/* Manager Reply */}
                        {(req.status === 'DENIED' || (req.status === 'APPROVED' && req.comment)) && (
                            <div className="mt-2 text-xs bg-blue-50 text-blue-800 p-2 rounded-md border border-blue-100 flex gap-2 items-start">
                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                <div>
                                    <span className="font-semibold block mb-0.5">Manager Reply:</span>
                                    {req.comment || "Request processed."}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
