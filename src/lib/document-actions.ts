type DocumentLike = {
  id: string;
  name: string;
};

export function getDocumentFileUrl(documentId: string, disposition: "inline" | "attachment" = "attachment") {
  return `/api/documents/${documentId}/file?disposition=${disposition}`;
}

export async function downloadDocument(document: DocumentLike) {
  const response = await fetch(getDocumentFileUrl(document.id, "attachment"));
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to download document");
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = document.name;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}
