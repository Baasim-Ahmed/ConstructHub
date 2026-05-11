import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";
import { toDocumentRecord } from "@/lib/documents";

async function resolveProjectClientLinks(clientId?: string | null, clientUserId?: string | null) {
  let finalClientId = clientId || null;
  let finalClientUserId = clientUserId || null;

  if (finalClientId) {
    const client = await prisma.client.findUnique({ where: { id: finalClientId } });
    if (!client) {
      finalClientId = null;
    } else if (client.email) {
      const clientUser = await prisma.user.findFirst({
        where: { email: client.email, role: "CLIENT" },
        select: { id: true },
      });
      finalClientUserId = clientUser?.id ?? null;
    }
  }

  if (!finalClientId && finalClientUserId) {
    const clientUser = await prisma.user.findUnique({
      where: { id: finalClientUserId },
      select: { email: true },
    });
    if (clientUser?.email) {
      const client = await prisma.client.findFirst({
        where: { email: clientUser.email },
        select: { id: true },
      });
      finalClientId = client?.id ?? null;
    }
  }

  return { finalClientId, finalClientUserId };
}

export async function GET(req: Request, context: any) {
  const params = await context.params;
  // Require authenticated user
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true, clientUser: true, tasks: true, manager: true, documents: { include: { uploadedBy: true, project: true } } },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const baseUrl = new URL(req.url).origin;
  return NextResponse.json({
    ...project,
    documents: project.documents.map((document) => toDocumentRecord(baseUrl, document)),
  });
}

export async function PUT(req: Request, context: any) {
  const params = await context.params;
  // Managers and admins can update projects
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER", "ADMIN"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const body = await req.json();

  // Create a clean update object to avoid passing invalid fields
  const data: any = {};

  if (body.name) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.status) data.status = body.status;
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.managerId !== undefined) data.managerId = body.managerId || null;

  // Handle budget and spent safely
  // If provided as string/number, parse it. If empty string, set to 0.
  if (body.budget !== undefined) {
    data.budget = body.budget === "" ? 0 : parseFloat(body.budget);
  }
  if (body.spent !== undefined) {
    data.spent = body.spent === "" ? 0 : parseFloat(body.spent);
  }

  if (body.clientId !== undefined || body.clientUserId !== undefined) {
    const resolvedClient = await resolveProjectClientLinks(body.clientId || null, body.clientUserId || null);
    data.clientId = resolvedClient.finalClientId;
    data.clientUserId = resolvedClient.finalClientUserId;
  }

  const updated = await prisma.project.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  // Admins and managers can delete projects
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER", "ADMIN"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });
  try {
    const projectId = params.id as string;
    await prisma.$transaction([
      prisma.task.deleteMany({ where: { projectId } }),
      prisma.document.deleteMany({ where: { projectId } }),
      prisma.note.deleteMany({ where: { projectId } }),
      prisma.project.delete({ where: { id: projectId } }),
    ]);
    return NextResponse.json({ message: 'Project and related data deleted' });
  } catch (error) {
    console.error('Delete project error', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
