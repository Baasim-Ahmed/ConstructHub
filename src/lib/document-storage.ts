import path from "path";
import { existsSync } from "fs";
import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

const DOCUMENT_UPLOAD_ROOT = path.join(process.cwd(), "uploads", "documents");
const RELATIVE_UPLOAD_ROOT = "uploads/documents";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function isLocalDocumentPath(value: string | null | undefined) {
  if (!value) return false;
  if (/^https?:\/\//i.test(value)) return false;
  return true;
}

export function resolveLocalDocumentPath(value: string) {
  if (!isLocalDocumentPath(value)) return null;

  const normalized = value.replace(/\\/g, "/").trim();
  const basename = path.basename(normalized);
  const candidates = [
    normalized.startsWith(`${RELATIVE_UPLOAD_ROOT}/`) ? path.join(process.cwd(), normalized) : null,
    normalized.startsWith("uploads/") ? path.join(process.cwd(), normalized) : null,
    path.isAbsolute(value) ? value : null,
    path.join(DOCUMENT_UPLOAD_ROOT, basename),
    path.join(process.cwd(), "uploads", basename),
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function resolveManagedDocumentPath(value: string) {
  if (!value) return null;

  const normalized = value.replace(/\\/g, "/").trim();
  const basename = path.basename(normalized);
  const candidates = [
    normalized.startsWith(`${RELATIVE_UPLOAD_ROOT}/`) ? path.join(process.cwd(), normalized) : null,
    path.join(DOCUMENT_UPLOAD_ROOT, basename),
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
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
  const absolutePath = resolveManagedDocumentPath(value);
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
