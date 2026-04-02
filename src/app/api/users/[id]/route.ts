import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { getServerSessionOrNull, requireRole } from '@/lib/auth';

function sanitizeUser(user: any) {
  if (!user) return null;
  const { password: _pw, ...rest } = user as any;
  return rest;
}

export async function GET(req: Request, context: any) {
  const params = await context.params;
  // Admins and Managers view user details
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const user = await prisma.user.findUnique({ where: { id: params.id }, include: { projects: true, tasks: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(sanitizeUser(user));
}

export async function PUT(req: Request, context: any) {
  const params = await context.params;
  // Admins and Managers can update users
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });

  const data = await req.json();
  if (data.password) {
    data.password = await bcrypt.hash(String(data.password), 10);
  }
  const updated = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json(sanitizeUser(updated));
}

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  // Admins and Managers can delete users
  const session = await getServerSessionOrNull(req as any);
  const check = requireRole(session, ["ADMIN", "MANAGER"]);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.code });
  try {
    const userId = params.id as string;
    // Nullify references to this user
    await prisma.project.updateMany({ where: { managerId: userId }, data: { managerId: null } });
    await prisma.task.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } });
    await prisma.document.updateMany({ where: { uploadedById: userId }, data: { uploadedById: null } });

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: 'User deleted and references cleared' });
  } catch (error) {
    console.error('Delete user error', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
