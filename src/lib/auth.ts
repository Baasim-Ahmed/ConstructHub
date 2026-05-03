import { getServerSession } from "next-auth/next";
import type { JWT } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export type UserRole = "ADMIN" | "MANAGER" | "ENGINEER" | "CLIENT";

type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: UserRole;
};

type SessionLike = {
  user?: SessionUser;
} | null;

/**
 * Get a lightweight "session-like" object from the incoming request when
 * called from Route Handlers. This uses the NextAuth JWT token when a
 * Request is available which is more reliable in route handlers.
 */
export async function getServerSessionOrNull(req?: NextRequest | undefined) {
  try {
    if (req) {
      // Try to read the NextAuth JWT from the request (works in route handlers)
      const token = (await getToken({
        req: req as unknown as Request,
        secret: process.env.NEXTAUTH_SECRET,
      })) as (JWT & { role?: UserRole }) | null;
      if (!token) return null;
      // Build a minimal session-like object expected by requireRole
      return {
        user: {
          id: token.sub,
          email: token.email,
          name: token.name,
          // role is included via the credentials provider callbacks
          role: token.role,
        },
      };
    }

    // Fallback for environments where getServerSession works
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions);
    return session || null;
  } catch {
    return null;
  }
}

export function requireRole(session: SessionLike, allowedRoles: UserRole[]) {
  if (!session || !session.user) return { ok: false, code: 401, message: "Unauthenticated" };
  const role = session.user.role;
  if (!role) return { ok: false, code: 403, message: "Role not found" };
  if (!allowedRoles.includes(role)) return { ok: false, code: 403, message: "Forbidden" };
  return { ok: true };
}
