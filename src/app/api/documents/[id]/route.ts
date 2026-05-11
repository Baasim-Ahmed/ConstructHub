import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";
import { persistDocumentFile, removeStoredDocument } from "@/lib/document-storage";

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  // Managers, Admins, and Engineers can delete documents
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const existing = await prisma.document.findUnique({
      where: { id: params.id },
      select: { url: true },
    });
    await prisma.document.delete({ where: { id: params.id } });
    await removeStoredDocument(existing?.url);
    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: any) {
  const params = await context.params;
  // Managers, Admins, and Engineers can update documents
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const contentType = req.headers.get("content-type") || "";
    const existing = await prisma.document.findUnique({
      where: { id: params.id },
      select: { url: true, name: true, type: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    let body: Record<string, any>;
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const replacementFile = formData.get("file");
      let nextUrl = existing.url;
      let nextName = formData.get("name")?.toString() || existing.name;
      let nextType = existing.type;

      if (replacementFile instanceof File && replacementFile.size > 0) {
        const storedFile = await persistDocumentFile(replacementFile);
        await removeStoredDocument(existing.url);
        nextUrl = storedFile.relativePath;
        nextName = storedFile.name;
        nextType = storedFile.mimeType;
      }

      body = {
        name: nextName,
        url: nextUrl,
        type: nextType,
        projectId: formData.get("projectId")?.toString() || null,
        uploadedById: formData.get("uploadedById")?.toString() || null,
        allowedViewers: formData.getAll("allowedViewers").map((value) => String(value)),
      };
    } else {
      body = await req.json();
    }

    const { allowedViewers, ...rest } = body;

    const data = {
      ...rest,
      allowedViewers: allowedViewers
        ? { set: allowedViewers.map((vid: string) => ({ id: vid })) }
        : undefined
    };

    const updated = await prisma.document.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}
