import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

export async function GET(req: Request, context: any) {
  // `context.params` can be a Promise in some Next.js runtimes — await it to ensure
  // we have the actual params object before accessing .id
  const params = await context.params;
  // Require authentication for fetching a single task
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: { project: true, assignedTo: true },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: Request, context: any) {
  const params = await context.params;
  // Managers and Engineers can update tasks (e.g. status)
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER", "ENGINEER", "ADMIN"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });
  try {
    const body = await req.json();
    const { title, description, projectId, assignedToId, status, dueDate } = body as any;
    const data: any = {};
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (projectId !== undefined) {
      if (projectId === null) data.projectId = null;
      else {
        const project = await prisma.project.findUnique({ where: { id: String(projectId) } });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 400 });
        data.projectId = project.id;
      }
    }
    if (assignedToId !== undefined) {
      if (assignedToId === null) data.assignedToId = null;
      else {
        const user = await prisma.user.findUnique({ where: { id: String(assignedToId) } });
        if (!user) return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
        data.assignedToId = user.id;
      }
    }
    if (status !== undefined) {
      const allowed = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
      if (!allowed.includes(String(status))) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = status;

      // Project Activation Logic
      if (status === 'IN_PROGRESS') {
        // Fetch current task to get project ID if not in body
        const currentTask = await prisma.task.findUnique({ where: { id: params.id }, select: { projectId: true } });
        const targetProjectId = projectId || currentTask?.projectId;

        if (targetProjectId) {
          const project = await prisma.project.findUnique({ where: { id: String(targetProjectId) } });
          if (project && project.status === 'PLANNING') {
            await prisma.project.update({
              where: { id: project.id },
              data: { status: 'IN_PROGRESS' }
            });
          }
        }
      }
    }
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') data.dueDate = null;
      else {
        const d = new Date(dueDate);
        if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 });
        data.dueDate = d;
      }
    }

    const updated = await prisma.task.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update task error', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  // Managers and Admins can delete tasks
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER", "ADMIN"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const deleted = await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Task deleted', task: deleted });
  } catch (error: any) {
    console.error('Delete task error:', error?.message || error);
    const errorMsg = error?.message || 'Failed to delete task';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
