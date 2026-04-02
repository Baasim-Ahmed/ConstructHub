'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Trash2, Pencil, FileText, Calendar, User } from 'lucide-react';
import type { Document } from '@prisma/client';
import { generateDocumentPDF } from '@/lib/pdf-generator';
import { AddDocumentModal } from '@/components/modals/AddDocumentModal';
import { useRole, roleChecks } from '@/hooks/useCurrentUser';
import { useRefetchOnRoleChange } from '@/hooks/useRefetchOnRoleChange';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
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
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';

export default function DocumentsPage() {
  const role = useRole();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data: Document[] = await res.json();
      data.sort((a, b) => new Date((b as any).uploadedAt).getTime() - new Date((a as any).uploadedAt).getTime());
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load documents');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useRefetchOnRoleChange(fetchDocuments);

  const handleEdit = (document: Document) => {
    setEditDocument(document);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    try {
      const res = await fetch(`/api/documents/${documentToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete document');
    }
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditDocument(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Documents"
        description="Centralized repository for project blueprints, contracts, and reports."
        actionLabel={roleChecks.canEditDocuments(role) ? "Upload Document" : undefined}
        onActionClick={() => setModalOpen(true)}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto h-12 w-12 text-slate-400 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">Upload your first document to get started.</p>
          {roleChecks.canEditDocuments(role) && (
            <Button onClick={() => setModalOpen(true)} className="mt-4" variant="outline">
              Upload Document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 cursor-pointer">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  {roleChecks.canEditDocuments(role) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 -mr-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(doc)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => { setDocumentToDelete(doc.id); setDeleteDialogOpen(true); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <h3 className="font-bold text-slate-800 text-base mb-2 line-clamp-2 min-h-[3rem]" title={doc.name}>
                  {doc.name}
                </h3>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Badge variant="secondary" className="font-normal truncate max-w-[120px]">
                      {(doc as any).project?.name || 'No Project'}
                    </Badge>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5" title={`Uploaded by ${(doc as any).uploadedBy?.name}`}>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Uploaded</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate((doc as any).uploadedAt)}
                      </div>
                    </div>

                    {doc.url ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-full" onClick={() => generateDocumentPDF(doc)} title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" disabled className="h-8 w-8 text-slate-300">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddDocumentModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onSuccess={fetchDocuments}
        editDocument={editDocument}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
