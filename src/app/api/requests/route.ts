import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull } from "@/lib/auth";

// GET /api/requests - Manager only, get all pending requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSessionOrNull(req);
    const user = (session as any)?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = user;

    // ADMIN sees all PENDING requests
    if (role === "ADMIN") {
      const requests = await prisma.request.findMany({
        where: { status: "PENDING" },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          reviewedBy: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(requests);
    }

    // MANAGER sees all PENDING requests for TASK, DOCUMENT, and PROJECT
    if (role === "MANAGER") {
      const requests = await prisma.request.findMany({
        where: {
          status: "PENDING",
          OR: [
            { type: { in: ["ADD_TASK", "EDIT_TASK", "ADD_DOCUMENT", "EDIT_DOCUMENT"] } },
            { type: { in: ["ADD_PROJECT", "EDIT_PROJECT"] } },
          ],
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          reviewedBy: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(requests);
    }

    // Engineers and Clients see their own requests (PENDING or DENIED)
    if (role === "ENGINEER" || role === "CLIENT") {
      const requests = await prisma.request.findMany({
        where: {
          createdById: userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return NextResponse.json(requests);
    }

    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 403 }
    );
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// POST /api/requests - Engineer/Client submits a request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSessionOrNull(req);
    const user = (session as any)?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = user;

    const body = await req.json();
    const { type, payload } = body;

    // Validate required fields
    if (!type || !payload) {
      return NextResponse.json(
        { error: "Missing required fields: type, payload" },
        { status: 400 }
      );
    }

    // Validate request type and user role permissions
    const allowedTypesForManager = ["ADD_PROJECT", "EDIT_PROJECT"];
    const isManagerRequestingAllowedType = role === "MANAGER" && allowedTypesForManager.includes(type);

    // Engineers, Clients, and Managers (for project requests) can create requests
    if (role !== "ENGINEER" && role !== "CLIENT" && !isManagerRequestingAllowedType) {
      return NextResponse.json(
        { error: "Only engineers, clients, and managers (for project requests) can submit requests" },
        { status: 403 }
      );
    }

    // Create the request
    const request = await prisma.request.create({
      data: {
        type,
        payload,
        status: "PENDING",
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
