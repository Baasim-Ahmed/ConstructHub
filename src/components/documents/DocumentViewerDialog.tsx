'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

import { downloadDocument, getDocumentFileUrl } from '@/lib/document-actions';

type ViewerDocument = {
  id: string;
  name: string;
  type?: string | null;
};

interface DocumentViewerDialogProps {
  document: ViewerDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewerDialog({ document, open, onOpenChange }: DocumentViewerDialogProps) {
  if (!document) return null;

  const fileType = (document.type || '').toLowerCase();
  const inlineUrl = getDocumentFileUrl(document.id, 'inline');
  const isPdf = fileType.includes('pdf');
  const isImage = fileType.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{document.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="h-[70vh] overflow-hidden rounded-xl border bg-slate-50">
            {isPdf || isImage ? (
              <iframe src={inlineUrl} title={document.name} className="h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-500">
                <FileText className="h-10 w-10 text-slate-300" />
                <p>Preview is available for PDF and image files.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => window.open(inlineUrl, '_blank', 'noopener,noreferrer')}>
              Open in New Tab
            </Button>
            <Button onClick={() => void downloadDocument(document)}>
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
