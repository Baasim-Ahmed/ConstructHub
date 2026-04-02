import { NextResponse } from "next/server";
import { getServerSessionOrNull } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSessionOrNull(req as any);
    const s = session as any;
    if (!s || !s.user) return NextResponse.json(null);
    // Return the session user (do not expose password)
    const { id, name, email, role } = s.user as any;
    return NextResponse.json({ id, name, email, role });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
