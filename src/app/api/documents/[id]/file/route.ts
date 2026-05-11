import path from "path";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";
import { inferDocumentMimeType } from "@/lib/documents";
import { readStoredDocument } from "@/lib/document-storage";

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

  if (/^https?:\/\//i.test(document.url)) {
    return NextResponse.redirect(document.url);
  }

  const storedFile = await readStoredDocument(document.url);
  if (!storedFile) {
    return NextResponse.json({ error: "Stored document file was not found" }, { status: 404 });
  }

  const disposition = new URL(req.url).searchParams.get("disposition") === "inline" ? "inline" : "attachment";
  const filename = path.basename(document.name);
  const mimeType = inferDocumentMimeType(document.name, document.type, document.url);

  return new NextResponse(storedFile.buffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(storedFile.size),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
