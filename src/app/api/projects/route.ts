import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

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

// GET all projects
export async function GET(req: Request) {
  // Require authentication for listing projects
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const { role, id } = (session as any).user;
    let where: any = {};
    
    if (role === 'ADMIN') {
      // ADMIN sees all projects
      where = {};
    } else if (role === 'MANAGER') {
      where = { managerId: id };
    } else if (role === 'ENGINEER') {
      where = {
        tasks: {
          some: {
            assignedToId: id
          }
        }
      };
    } else if (role === 'CLIENT') {
      where = {
        OR: [
          { clientUserId: id },
          { client: { email: (session as any).user.email } },
        ],
      };
    }

    console.log(`[Projects API] Role: ${role}, Filter:`, where);
    const projects = await prisma.project.findMany({
      where,
      include: { client: true, clientUser: true, tasks: true, manager: true },
      orderBy: { createdAt: "desc" }
    });
    console.log(`[Projects API] Returning ${projects.length} projects`);
    return NextResponse.json(projects, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST new project
export async function POST(req: Request) {
  // Only admins can create projects directly.
  // Managers must submit ADD_PROJECT requests for admin approval.
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const body = await req.json();
    const {
      name,
      description,
      clientId,
      clientUserId,
      clientEmail,
      managerId,
      managerEmail,
      status,
      startDate,
      endDate,
    } = body as any;

    if (!name) return NextResponse.json({ error: 'Missing project name' }, { status: 400 });

    let finalClientUserId = clientUserId as string | undefined;
    let finalClientId = clientId as string | undefined;

    // Attempt to resolve Client User if email provided
    if (!finalClientUserId && !finalClientId && clientEmail) {
      const user = await prisma.user.findFirst({ where: { email: clientEmail, role: 'CLIENT' } });
      if (user) {
        finalClientUserId = user.id;
      } else {
        // Fallback to searching Client model
        const client = await prisma.client.findFirst({ where: { email: clientEmail } });
        if (client) finalClientId = client.id;
      }
    }

    const resolvedClient = await resolveProjectClientLinks(finalClientId, finalClientUserId);
    finalClientId = resolvedClient.finalClientId ?? undefined;
    finalClientUserId = resolvedClient.finalClientUserId ?? undefined;

    // Resolve manager...
    let finalManagerId = managerId as string | undefined;
    if (!finalManagerId && managerEmail) {
      const manager = await prisma.user.findFirst({ where: { email: managerEmail } });
      if (!manager) return NextResponse.json({ error: 'Manager not found for provided email' }, { status: 400 });
      finalManagerId = manager.id;
    }

    // Parse dates...
    const parsedStart = startDate ? new Date(startDate) : undefined;
    const parsedEnd = endDate ? new Date(endDate) : undefined;

    const data: any = {
      name,
      description: description ?? undefined,
      clientId: finalClientId ?? undefined,
      clientUserId: finalClientUserId ?? undefined,
      managerId: finalManagerId ?? undefined,
      status: status ?? undefined,
      startDate: parsedStart,
      endDate: parsedEnd,
      budget: body.budget ? parseFloat(body.budget) : 0,
      spent: body.spent ? parseFloat(body.spent) : 0,
    };

    const project = await prisma.project.create({ data });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Create project error', error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
