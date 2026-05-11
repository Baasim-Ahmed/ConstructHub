import path from "path";
import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

const DOCUMENT_UPLOAD_ROOT = path.join(process.cwd(), "uploads", "documents");
const RELATIVE_UPLOAD_ROOT = "uploads/documents";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function isLocalDocumentPath(value: string | null | undefined) {
  return Boolean(value) && (value as string).startsWith(`${RELATIVE_UPLOAD_ROOT}/`);
}

export function resolveLocalDocumentPath(value: string) {
  if (!isLocalDocumentPath(value)) return null;
  return path.join(process.cwd(), value);
}

export async function persistDocumentFile(file: File) {
  await mkdir(DOCUMENT_UPLOAD_ROOT, { recursive: true });
  const filename = `${randomUUID()}-${sanitizeFilename(file.name)}`;
  const relativePath = `${RELATIVE_UPLOAD_ROOT}/${filename}`;
  const absolutePath = path.join(DOCUMENT_UPLOAD_ROOT, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    relativePath,
  };
}

export async function removeStoredDocument(value: string | null | undefined) {
  if (!value || !isLocalDocumentPath(value)) return;
  const absolutePath = resolveLocalDocumentPath(value);
  if (!absolutePath) return;
  await rm(absolutePath, { force: true });
}

export async function readStoredDocument(value: string) {
  const absolutePath = resolveLocalDocumentPath(value);
  if (!absolutePath) return null;
  const [file, fileStats] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
  return {
    buffer: file,
    size: fileStats.size,
    absolutePath,
  };
}
