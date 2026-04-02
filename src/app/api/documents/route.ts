import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

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

  const body = await req.json();
  const { allowedViewers, ...rest } = body;

  const data = {
    ...rest,
    allowedViewers: allowedViewers && allowedViewers.length > 0
      ? { connect: allowedViewers.map((vid: string) => ({ id: vid })) }
      : undefined
  };

  const doc = await prisma.document.create({ data });
  return NextResponse.json(doc);
}
