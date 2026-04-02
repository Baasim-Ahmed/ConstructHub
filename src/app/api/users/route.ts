import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

function sanitizeUser(user: any) {
  if (!user) return null;
  const { password: _pw, ...rest } = user as any;
  return rest;
}

export async function GET(req: Request) {
  // Require an authenticated user for listing users
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const { role, id } = (session as any).user;
  let where: any = {};

  if (role === 'ADMIN') {
    // ADMIN sees all users
    where = {};
  } else if (role === 'MANAGER') {
    where = { createdById: id };
  }

  console.log(`[Users API] Role: ${role}, Filter:`, where);
  const users = await prisma.user.findMany({
    where,
    include: { projects: true, tasks: true },
    orderBy: { createdAt: "desc" }
  });
  console.log(`[Users API] Returning ${users.length} users`);
  // Remove passwords from the response
  const safe = users.map((u) => sanitizeUser(u));
  return NextResponse.json(safe, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

export async function POST(req: Request) {
  // Admins and Managers can create new users
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  try {
    const data = await req.json();
    if (!data.email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    // Prevent duplicate emails
    const exists = await prisma.user.findFirst({ where: { email: data.email } });
    if (exists) return NextResponse.json({ error: 'User already exists with that email' }, { status: 409 });

    // If a password is provided, hash it before creating
    if (data.password) {
      data.password = await bcrypt.hash(String(data.password), 10);
    } else {
      // Set a default password for convenience in dev (recommend overriding in .env)
      data.password = await bcrypt.hash('password', 10);
    }

    // Assign creator
    const creatorId = (session as any).user.id;
    const user = await prisma.user.create({
      data: { ...data, createdById: creatorId }
    });
    return NextResponse.json(sanitizeUser(user));
  } catch (error) {
    console.error('Create user error', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
