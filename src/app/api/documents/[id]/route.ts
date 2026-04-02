import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  // Managers, Admins, and Engineers can delete documents
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    await prisma.document.delete({ where: { id: params.id } });
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
    const body = await req.json();
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
