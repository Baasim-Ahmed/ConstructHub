import { jsPDF } from "jspdf";

import {
  DocumentRecord,
  buildDocumentUrls,
  isImageMimeType,
  isOfficeMimeType,
  isPdfMimeType,
  isTextMimeType,
} from "@/lib/documents";

export function getDocumentFileUrl(documentId: string, disposition: "inline" | "attachment" = "attachment") {
  return buildDocumentUrls(documentId)[disposition === "inline" ? "previewUrl" : "originalDownloadUrl"];
}

export function getDocumentPdfUrl(documentId: string, disposition?: "inline" | "attachment") {
  const baseUrl = buildDocumentUrls(documentId).pdfDownloadUrl;
  return disposition ? `${baseUrl}?disposition=${disposition}` : baseUrl;
}

function getDocumentUrls(
  document: Pick<DocumentRecord, "id"> & Partial<Pick<DocumentRecord, "previewUrl" | "originalDownloadUrl" | "pdfDownloadUrl">>,
) {
  const fallback = buildDocumentUrls(document.id);
  return {
    previewUrl: document.previewUrl || fallback.previewUrl,
    originalDownloadUrl: document.originalDownloadUrl || fallback.originalDownloadUrl,
    pdfDownloadUrl: document.pdfDownloadUrl || fallback.pdfDownloadUrl,
  };
}

async function downloadBlob(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

async function fetchBlob(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to fetch document");
    }
    return response.blob();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch document");
  }
}

async function convertTextDocumentToPdf(document: DocumentRecord) {
  const response = await fetch(getDocumentUrls(document).previewUrl, { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to load text document");
  }
  const text = await response.text();
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const lines = pdf.splitTextToSize(text || "(empty file)", 520);
  pdf.setFont("courier", "normal");
  pdf.setFontSize(10);
  pdf.text(lines, 40, 50);
  pdf.save(`${document.name.replace(/\.[^.]+$/, "")}.pdf`);
}

async function convertImageDocumentToPdf(document: DocumentRecord) {
  const blob = await fetchBlob(getDocumentUrls(document).previewUrl);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(blob);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error("Failed to load image preview"));
    nextImage.src = dataUrl;
  });

  const pdf = new jsPDF({
    orientation: image.width >= image.height ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / image.width, pageHeight / image.height);
  const renderWidth = image.width * ratio;
  const renderHeight = image.height * ratio;
  const offsetX = (pageWidth - renderWidth) / 2;
  const offsetY = (pageHeight - renderHeight) / 2;
  const imageType = document.mimeType.includes("png") ? "PNG" : "JPEG";

  pdf.addImage(dataUrl, imageType, offsetX, offsetY, renderWidth, renderHeight);
  pdf.save(`${document.name.replace(/\.[^.]+$/, "")}.pdf`);
}

export async function downloadOriginalDocument(document: Pick<DocumentRecord, "id" | "originalDownloadUrl" | "name">) {
  const blob = await fetchBlob(getDocumentUrls(document).originalDownloadUrl);
  await downloadBlob(blob, document.name);
}

export async function downloadDocumentAsPdf(document: DocumentRecord) {
  if (isPdfMimeType(document.mimeType)) {
    await downloadOriginalDocument(document);
    return;
  }

  if (isImageMimeType(document.mimeType)) {
    await convertImageDocumentToPdf(document);
    return;
  }

  if (isTextMimeType(document.mimeType)) {
    await convertTextDocumentToPdf(document);
    return;
  }

  if (isOfficeMimeType(document.mimeType)) {
    const blob = await fetchBlob(getDocumentUrls(document).pdfDownloadUrl);
    await downloadBlob(blob, `${document.name.replace(/\.[^.]+$/, "")}.pdf`);
    return;
  }

  throw new Error("PDF download is not available for this file type yet. Please download the original document.");
}
