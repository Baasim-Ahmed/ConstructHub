import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

const SEARCH_LIMIT = 5;

export async function GET(req: Request) {
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ projects: [], tasks: [], clients: [] });
  }

  const { role, id, email } = (session as any).user;
  const searchValue = query;

  let projectWhere: any = {
    OR: [
      { name: { contains: searchValue, mode: "insensitive" } },
      { description: { contains: searchValue, mode: "insensitive" } },
    ],
  };
  let taskWhere: any = {
    OR: [
      { title: { contains: searchValue, mode: "insensitive" } },
      { description: { contains: searchValue, mode: "insensitive" } },
    ],
  };
  let clientWhere: any = {
    OR: [
      { name: { contains: searchValue, mode: "insensitive" } },
      { companyName: { contains: searchValue, mode: "insensitive" } },
      { email: { contains: searchValue, mode: "insensitive" } },
    ],
  };

  if (role === "MANAGER") {
    projectWhere = { AND: [projectWhere, { managerId: id }] };
    taskWhere = {
      AND: [
        taskWhere,
        {
          OR: [
            { project: { managerId: id } },
            { assignedToId: id },
          ],
        },
      ],
    };
    clientWhere = { AND: [clientWhere, { createdById: id }] };
  } else if (role === "ENGINEER") {
    projectWhere = { AND: [projectWhere, { tasks: { some: { assignedToId: id } } }] };
    taskWhere = { AND: [taskWhere, { assignedToId: id }] };
    clientWhere = { id: "__no-client-access__" };
  } else if (role === "CLIENT") {
    projectWhere = {
      AND: [
        projectWhere,
        {
          OR: [
            { clientUserId: id },
            { client: { email } },
          ],
        },
      ],
    };
    taskWhere = {
      AND: [
        taskWhere,
        {
          project: {
            OR: [
              { clientUserId: id },
              { client: { email } },
            ],
          },
        },
      ],
    };
    clientWhere = { AND: [clientWhere, { email }] };
  }

  const [projects, tasks, clients] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.task.findMany({
      where: taskWhere,
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, project: { select: { name: true } } },
    }),
    prisma.client.findMany({
      where: clientWhere,
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, companyName: true, email: true },
    }),
  ]);

  return NextResponse.json({ projects, tasks, clients }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
