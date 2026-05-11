'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DocumentRecord,
  isImageMimeType,
  isOfficeMimeType,
  isPdfMimeType,
  isTextMimeType,
} from '@/lib/documents';
import { downloadDocumentAsPdf, downloadOriginalDocument, getDocumentFileUrl, getDocumentPdfUrl } from '@/lib/document-actions';

interface DocumentViewerDialogProps {
  document: DocumentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewerDialog({ document, open, onOpenChange }: DocumentViewerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [originalDownloading, setOriginalDownloading] = useState(false);

  const previewKind = useMemo(() => {
    if (!document) return 'none';
    if (isPdfMimeType(document.mimeType)) return 'pdf';
    if (isImageMimeType(document.mimeType)) return 'image';
    if (isTextMimeType(document.mimeType)) return 'text';
    if (isOfficeMimeType(document.mimeType)) return 'office';
    return 'unsupported';
  }, [document]);

  useEffect(() => {
    if (!document || !open) return;

    let cancelled = false;
    let nextObjectUrl: string | null = null;

    const loadPreview = async () => {
      setLoading(true);
      setError(null);
      setTextContent('');
      setObjectUrl(null);

      try {
        if (previewKind === 'text') {
          const response = await fetch(getDocumentFileUrl(document.id, 'inline'), { cache: 'no-store' });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Failed to load the document preview.');
          }
          const text = await response.text();
          if (!cancelled) setTextContent(text);
          return;
        }

        if (previewKind === 'pdf' || previewKind === 'image') {
          const response = await fetch(getDocumentFileUrl(document.id, 'inline'), { cache: 'no-store' });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Failed to load the document preview.');
          }
          const blob = await response.blob();
          nextObjectUrl = URL.createObjectURL(blob);
          if (!cancelled) setObjectUrl(nextObjectUrl);
          return;
        }

        if (previewKind === 'office') {
          const response = await fetch(getDocumentPdfUrl(document.id, 'inline'), { cache: 'no-store' });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Office preview is not available for this document.');
          }
          const blob = await response.blob();
          nextObjectUrl = URL.createObjectURL(blob);
          if (!cancelled) setObjectUrl(nextObjectUrl);
          return;
        }
      } catch (previewError) {
        if (!cancelled) {
          setError(previewError instanceof Error ? previewError.message : 'Failed to load the document preview.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
      setObjectUrl(null);
    };
  }, [document, open, previewKind]);

  const handleDownloadAsPdf = async () => {
    if (!document) return;
    setPdfDownloading(true);
    try {
      await downloadDocumentAsPdf(document);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download the document as PDF.');
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleDownloadOriginal = async () => {
    if (!document) return;
    setOriginalDownloading(true);
    try {
      await downloadOriginalDocument(document);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download the original document.');
    } finally {
      setOriginalDownloading(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>{document.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>{document.mimeType}</span>
              <span className="uppercase">{document.extension || 'file'}</span>
            </div>

            <div className="min-h-[65vh] overflow-hidden rounded-xl border bg-white">
              {loading ? (
                <div className="space-y-4 p-6">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-[52vh] w-full" />
                </div>
              ) : error ? (
                <div className="flex h-[65vh] flex-col items-center justify-center gap-4 px-8 text-center text-slate-500">
                  <AlertCircle className="h-10 w-10 text-amber-500" />
                  <div>
                    <p className="font-medium text-slate-700">Preview unavailable</p>
                    <p className="mt-1 max-w-xl text-sm">{error}</p>
                  </div>
                  <Button variant="outline" onClick={() => window.open(getDocumentFileUrl(document.id), '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Download Original
                  </Button>
                </div>
              ) : previewKind === 'text' ? (
                <pre className="h-[65vh] overflow-auto whitespace-pre-wrap p-6 text-sm leading-6 text-slate-700">{textContent || '(empty file)'}</pre>
              ) : objectUrl ? (
                <iframe src={objectUrl} title={document.name} className="h-[65vh] w-full" />
              ) : (
                <div className="flex h-[65vh] flex-col items-center justify-center gap-4 text-slate-500">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <p>No preview is available for this file.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadOriginal}
              disabled={originalDownloading}
            >
              {originalDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download Original
            </Button>
            <Button
              onClick={handleDownloadAsPdf}
              disabled={pdfDownloading}
            >
              {pdfDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Download as PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
