import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";
import { inferDocumentMimeType, isOfficeMimeType, isPdfMimeType } from "@/lib/documents";
import { readStoredDocument } from "@/lib/document-storage";

const execFileAsync = promisify(execFile);

function getLibreOfficePath() {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => {
    try {
      return require("fs").existsSync(candidate);
    } catch {
      return false;
    }
  }) ?? null;
}

export async function GET(req: Request, context: any) {
  const params = await context.params;
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const { id, role, email } = (session as any).user;
  const document = await prisma.document.findFirst({
    where: {
      id: params.id,
      ...(role === "ADMIN" ? {} : {
        OR: [
          { uploadedById: id },
          { allowedViewers: { some: { id } } },
          {
            AND: [
              { allowedViewers: { none: {} } },
              role === "MANAGER"
                ? { project: { managerId: id } }
                : role === "ENGINEER"
                  ? { project: { tasks: { some: { assignedToId: id } } } }
                  : {
                    project: {
                      OR: [
                        { clientUserId: id },
                        { client: { email } },
                      ],
                    },
                  },
            ],
          },
        ],
      }),
    },
    select: { id: true, name: true, type: true, url: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const mimeType = inferDocumentMimeType(document.name, document.type, document.url);
  const disposition = new URL(req.url).searchParams.get("disposition") === "inline" ? "inline" : "attachment";

  if (isPdfMimeType(mimeType)) {
    const storedFile = await readStoredDocument(document.url);
    if (!storedFile) {
      return NextResponse.json({ error: "Stored PDF file was not found" }, { status: 404 });
    }

    return new NextResponse(storedFile.buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(storedFile.size),
        "Content-Disposition": `${disposition}; filename="${document.name.replace(/\.[^.]+$/, "")}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  if (!isOfficeMimeType(mimeType)) {
    return NextResponse.json({
      error: "PDF conversion is currently available for PDF and Office documents. Use the client-side PDF action for images or text files.",
    }, { status: 400 });
  }

  const libreOfficePath = getLibreOfficePath();
  if (!libreOfficePath) {
    return NextResponse.json({
      error: "Office to PDF conversion is not available on this server because LibreOffice is not installed.",
    }, { status: 501 });
  }

  const storedFile = await readStoredDocument(document.url);
  if (!storedFile) {
    return NextResponse.json({ error: "Stored document file was not found" }, { status: 404 });
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "constructhub-doc-"));
  const inputPath = path.join(tempRoot, document.name);
  const outputDir = path.join(tempRoot, "out");

  try {
    await mkdir(outputDir, { recursive: true });
    await writeFile(inputPath, storedFile.buffer);

    await execFileAsync(libreOfficePath, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      inputPath,
    ], {
      windowsHide: true,
      timeout: 120000,
    });

    const outputName = `${document.name.replace(/\.[^.]+$/, "")}.pdf`;
    const outputPath = path.join(outputDir, outputName);
    const pdfBuffer = await readFile(outputPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.byteLength),
        "Content-Disposition": `${disposition}; filename="${outputName}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Document PDF conversion failed", error);
    return NextResponse.json({ error: "Failed to convert this Office document to PDF." }, { status: 500 });
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}
