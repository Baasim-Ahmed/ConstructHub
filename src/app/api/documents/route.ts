import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";
import { persistDocumentFile } from "@/lib/document-storage";

export async function GET(req: Request) {
  // Require authenticated user for listing documents
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const { role, id } = (session as any).user;
  let baseAccess: any = {};

  // Define base access rules (User sees doc if no specific viewers set)
  if (role === 'MANAGER') {
    baseAccess = { project: { managerId: id } };
  } else if (role === 'ENGINEER') {
    baseAccess = { project: { tasks: { some: { assignedToId: id } } } };
  } else if (role === 'CLIENT') {
    // Note: session.user.clientId might not exist on User type directly depending on auth setup, 
    // usually clients are Users linked to Client profile OR have clientUserId.
    // Simplifying for now to avoid complex queries if not strictly needed, 
    // assuming Clients see their projects. 
    // A safe fallback for Client role is:
    baseAccess = {
      OR: [
        { project: { clientUserId: id } },
        { project: { client: { email: (session as any).user.email } } } // fallback
      ]
    };
  }

  // Admin sees all, so we only filter for non-admins
  let where: any = {};
  if (role !== 'ADMIN') {
    where = {
      OR: [
        { uploadedById: id },
        { allowedViewers: { some: { id } } },
        {
          AND: [
            { allowedViewers: { none: {} } }, // Only if NO specific viewers...
            baseAccess                        // ...apply standard rules
          ]
        }
      ]
    };
  }

  const docs = await prisma.document.findMany({
    where,
    include: { uploadedBy: true, project: true, allowedViewers: true },
    orderBy: { uploadedAt: "desc" }
  });
  return NextResponse.json(docs, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

export async function POST(req: Request) {
  // Managers, Admins, and Engineers can create documents
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, any>;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "A document file is required" }, { status: 400 });
      }

      const storedFile = await persistDocumentFile(file);
      const rawViewers = formData.getAll("allowedViewers").map((value) => String(value));
      payload = {
        name: formData.get("name")?.toString() || storedFile.name,
        url: storedFile.relativePath,
        type: storedFile.mimeType,
        projectId: formData.get("projectId")?.toString() || null,
        uploadedById: formData.get("uploadedById")?.toString() || (session as any).user.id,
        allowedViewers: rawViewers,
      };
    } else {
      payload = await req.json();
    }

    const { allowedViewers, ...rest } = payload;
    const data: Prisma.DocumentCreateInput = {
      name: String(rest.name || ""),
      url: String(rest.url || ""),
      type: rest.type ? String(rest.type) : undefined,
      project: rest.projectId ? { connect: { id: String(rest.projectId) } } : undefined,
      uploadedBy: (rest.uploadedById || (session as any).user.id)
        ? { connect: { id: String(rest.uploadedById || (session as any).user.id) } }
        : undefined,
      allowedViewers: allowedViewers && allowedViewers.length > 0
        ? { connect: allowedViewers.map((vid: string) => ({ id: vid })) }
        : undefined
    };

    const doc = await prisma.document.create({ data });
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Create document error", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
