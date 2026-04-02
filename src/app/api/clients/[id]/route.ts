import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

export async function GET(req: Request, context: any) {
  const params = await context.params;
  // Require authenticated user
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const client = await prisma.client.findUnique({ where: { id: params.id }, include: { projects: true, contacts: true } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: Request, context: any) {
  const params = await context.params;
  // Only managers can update clients
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const data = await req.json();
  const updated = await prisma.client.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  // Only managers can delete clients
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });
  try {
    const clientId = params.id as string;

    // Find projects for this client
    const projects = await prisma.project.findMany({ where: { clientId }, select: { id: true } });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length) {
      // Delete tasks for those projects
      await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } });
      // Delete documents for those projects
      await prisma.document.deleteMany({ where: { projectId: { in: projectIds } } });
      // Delete the projects
      await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    }

    // Delete contacts
    await prisma.contact.deleteMany({ where: { clientId } });

    // Finally delete client
    await prisma.client.delete({ where: { id: clientId } });
    return NextResponse.json({ message: 'Client and related data deleted' });
  } catch (error) {
    console.error('Delete client error', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
