import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

// GET all tasks
export async function GET(req: Request) {
  // Require authenticated user for listing tasks. Pass the Request so the
  // helper can extract the NextAuth JWT directly from cookies.
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    let query: any = { include: { project: true, assignedTo: true } };

    // If user is engineer, only show tasks assigned to them
    const { role, id } = (session as any).user;

    // Filter tasks based on role
    if (role === "ADMIN") {
      // ADMIN sees all tasks
      query.where = {};
    } else if (role === "ENGINEER") {
      query.where = { assignedToId: id };
    } else if (role === "MANAGER") {
      query.where = {
        OR: [
          { project: { managerId: id } }, // Tasks in projects they manage
          { assignedToId: id }            // Tasks assigned to them
        ]
      };
    } else if (role === "CLIENT") {
      // CLIENTS see tasks in projects they're assigned to
      query.where = {
        project: { clientUserId: id }
      };
    }

    console.log(`[Tasks API] Role: ${role}, Filter:`, query.where);
    const tasks = await prisma.task.findMany({
      ...query,
      orderBy: { createdAt: "desc" }
    });
    console.log(`[Tasks API] Returning ${tasks.length} tasks`);
    return NextResponse.json(tasks, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST new task
export async function POST(req: Request) {
  // Managers and Admins can create tasks
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER", "ADMIN"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const body = await req.json();
    const { title, description, projectId, assignedToId, status, dueDate } = body as any;

    if (!title) return NextResponse.json({ error: 'Missing task title' }, { status: 400 });

    const data: any = { title };
    if (description) data.description = description;

    // projectId may be null/undefined or an id string
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: String(projectId) } });
      if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 400 });
      data.projectId = project.id;
    }

    // assignedToId may be null or id string
    if (assignedToId) {
      const user = await prisma.user.findUnique({ where: { id: String(assignedToId) } });
      if (!user) return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
      data.assignedToId = user.id;
    }

    // status (ensure it's one of the TaskStatus enum values)
    if (status) {
      const allowed = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
      if (!allowed.includes(String(status))) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = status;
    }

    // dueDate: parse to Date if provided
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 });
      data.dueDate = d;
    }

    const task = await prisma.task.create({ data });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Create task error', error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
