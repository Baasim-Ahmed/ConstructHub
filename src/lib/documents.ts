export interface DocumentRecord {
  id: string;
  name: string;
  url: string;
  type?: string | null;
  mimeType: string;
  extension: string;
  uploadedAt: string;
  projectId?: string | null;
  uploadedById?: string | null;
  fileUrl: string;
  previewUrl: string;
  originalDownloadUrl: string;
  pdfDownloadUrl: string;
  project?: {
    id: string;
    name: string;
  } | null;
  uploadedBy?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  allowedViewers?: Array<{
    id: string;
    name: string;
    email?: string | null;
  }>;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

const OFFICE_MIME_PREFIXES = [
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument",
];

export function getDocumentExtension(name: string, fallbackUrl?: string | null) {
  const source = fallbackUrl && fallbackUrl.includes(".") ? fallbackUrl : name;
  const extension = source.split(".").pop()?.toLowerCase() ?? "";
  return extension;
}

export function inferDocumentMimeType(name: string, explicitType?: string | null, fallbackUrl?: string | null) {
  if (explicitType && explicitType.includes("/")) {
    return explicitType;
  }

  const extension = getDocumentExtension(name, fallbackUrl);
  return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

export function isPdfMimeType(mimeType: string) {
  return mimeType === "application/pdf";
}

export function isImageMimeType(mimeType: string) {
  return mimeType.startsWith("image/");
}

export function isTextMimeType(mimeType: string) {
  return mimeType.startsWith("text/") || mimeType === "application/json";
}

export function isOfficeMimeType(mimeType: string) {
  return OFFICE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export function buildDocumentUrls(documentId: string) {
  const originalDownloadUrl = `/api/documents/${documentId}/file?disposition=attachment`;
  return {
    fileUrl: originalDownloadUrl,
    previewUrl: `/api/documents/${documentId}/file?disposition=inline`,
    originalDownloadUrl,
    pdfDownloadUrl: `/api/documents/${documentId}/pdf`,
  };
}

type SerializableDocument = {
  id: string;
  name: string;
  url: string;
  type?: string | null;
  uploadedAt: Date | string;
  projectId?: string | null;
  uploadedById?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
  uploadedBy?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  allowedViewers?: Array<{
    id: string;
    name: string;
    email?: string | null;
  }>;
};

export function toDocumentRecord(_baseUrl: string, document: SerializableDocument): DocumentRecord {
  const mimeType = inferDocumentMimeType(document.name, document.type, document.url);
  const extension = getDocumentExtension(document.name, document.url);

  return {
    id: document.id,
    name: document.name,
    url: document.url,
    type: document.type ?? null,
    mimeType,
    extension,
    uploadedAt: new Date(document.uploadedAt).toISOString(),
    projectId: document.projectId ?? null,
    uploadedById: document.uploadedById ?? null,
    ...buildDocumentUrls(document.id),
    project: document.project ?? null,
    uploadedBy: document.uploadedBy ?? null,
    allowedViewers: document.allowedViewers ?? [],
  };
}
