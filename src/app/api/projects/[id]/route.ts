import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

export async function GET(req: Request, context: any) {
  const params = await context.params;
  // Require authenticated user
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true, tasks: true, manager: true, documents: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(project);
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
  if (body.startDate) data.startDate = body.startDate;
  if (body.endDate) data.endDate = body.endDate;
  if (body.clientId) data.clientId = body.clientId;
  if (body.clientUserId) data.clientUserId = body.clientUserId;
  if (body.managerId) data.managerId = body.managerId;

  // Handle budget and spent safely
  // If provided as string/number, parse it. If empty string, set to 0.
  if (body.budget !== undefined) {
    data.budget = body.budget === "" ? 0 : parseFloat(body.budget);
  }
  if (body.spent !== undefined) {
    data.spent = body.spent === "" ? 0 : parseFloat(body.spent);
  }

  const updated = await prisma.project.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  // Only managers can delete projects
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });
  try {
    const projectId = params.id as string;
    // Delete tasks under the project
    await prisma.task.deleteMany({ where: { projectId } });
    // Delete documents under the project
    await prisma.document.deleteMany({ where: { projectId } });
    // Delete the project
    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ message: 'Project and related data deleted' });
  } catch (error) {
    console.error('Delete project error', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
