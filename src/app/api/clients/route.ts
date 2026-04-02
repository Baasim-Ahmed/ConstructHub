import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

// GET all clients
export async function GET(req: Request) {
  // Require authenticated user for listing clients
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const { role, id } = (session as any).user;
    let where: any = {};
    
    if (role === 'ADMIN') {
      // ADMIN sees all clients
      where = {};
    } else if (role === 'MANAGER') {
      where = { createdById: id };
    }
    
    console.log(`[Clients API] Role: ${role}, Filter:`, where);
    const clients = await prisma.client.findMany({
      where,
      include: { projects: true, contacts: true },
      orderBy: { createdAt: "desc" }
    });
    console.log(`[Clients API] Returning ${clients.length} clients`);
    return NextResponse.json(clients, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST new client
export async function POST(req: Request) {
  // Only managers can create clients
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["MANAGER", "ADMIN"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const { role, id } = (session as any).user;
    const data = await req.json();
    const newClient = await prisma.client.create({
      data: {
        ...data,
        createdById: id, // Assign ownership
      }
    });
    return NextResponse.json(newClient);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
