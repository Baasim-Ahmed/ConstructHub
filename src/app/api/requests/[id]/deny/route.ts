import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull } from "@/lib/auth";

// PATCH /api/requests/[id]/deny - Manager denies a request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsObj = await params;
    const requestId = typeof paramsObj?.id === "string" ? paramsObj.id : String(paramsObj?.id ?? "");
    if (!requestId) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }
    const session = await getServerSessionOrNull(req);
    const user = (session as any)?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = user;

    // Only managers can deny requests
    if (role !== "MANAGER" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only managers can deny requests" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { comment } = body;

    // Comment is mandatory for denial
    if (!comment || comment.trim() === "") {
      return NextResponse.json(
        { error: "Comment is required when denying a request" },
        { status: 400 }
      );
    }
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request is not in PENDING status" },
        { status: 400 }
      );
    }

    // Update the request status to DENIED
    const deniedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "DENIED",
        reviewedById: userId,
        comment: comment,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Request denied successfully",
      request: deniedRequest,
    });
  } catch (error) {
    console.error("PATCH /api/requests/[id]/deny error:", error);
    return NextResponse.json(
      { error: "Failed to deny request" },
      { status: 500 }
    );
  }
}
