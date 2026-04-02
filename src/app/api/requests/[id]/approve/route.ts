import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull } from "@/lib/auth";

// PATCH /api/requests/[id]/approve - Manager approves a request
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

    // Only managers can approve requests
    if (role !== "MANAGER" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only managers can approve requests" },
        { status: 403 }
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

    // Execute the appropriate action based on request type
    let result;
    const body = await req.json().catch(() => ({})); // Robust json parsing
    const { comment } = body; // Extract comment if present

    const payload = request.payload as Record<string, any>;

    try {
      switch (request.type) {
        case "ADD_PROJECT": {
          let clientId = payload.clientId || null;
          let managerId = payload.managerId || null;

          if (clientId) {
            const clientExists = await prisma.client.findUnique({ where: { id: clientId } });
            if (!clientExists) clientId = null;
          }
          if (managerId) {
            const managerExists = await prisma.user.findUnique({ where: { id: managerId } });
            if (!managerExists) managerId = null;
          }

          result = await prisma.project.create({
            data: {
              name: payload.name,
              description: payload.description,
              location: payload.location,
              startDate: payload.startDate ? new Date(payload.startDate) : null,
              endDate: payload.endDate ? new Date(payload.endDate) : null,
              status: payload.status || "PLANNING",
              clientId: clientId,
              managerId: managerId,
            },
          });
          break;
        }

        case "EDIT_PROJECT": {
          let clientId = payload.clientId;
          let managerId = payload.managerId;

          if (clientId) {
            const clientExists = await prisma.client.findUnique({ where: { id: clientId } });
            if (!clientExists) clientId = null;
          }
          if (managerId) {
            const managerExists = await prisma.user.findUnique({ where: { id: managerId } });
            if (!managerExists) managerId = null;
          }

          result = await prisma.project.update({
            where: { id: payload.id },
            data: {
              name: payload.name,
              description: payload.description,
              location: payload.location,
              startDate: payload.startDate ? new Date(payload.startDate) : null,
              endDate: payload.endDate ? new Date(payload.endDate) : null,
              status: payload.status,
              clientId: clientId,
              managerId: managerId,
            },
          });
          break;
        }

        case "ADD_TASK": {
          let projectId = payload.projectId || null;
          let assignedToId = payload.assignedToId || null;

          if (projectId) {
            const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
            if (!projectExists) projectId = null;
          }
          if (assignedToId) {
            const userExists = await prisma.user.findUnique({ where: { id: assignedToId } });
            if (!userExists) assignedToId = null;
          }

          result = await prisma.task.create({
            data: {
              title: payload.title,
              description: payload.description,
              dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
              status: payload.status || "PENDING",
              projectId: projectId,
              assignedToId: assignedToId,
            },
          });
          break;
        }

        case "EDIT_TASK": {
          const updateData: any = {};
          if (payload.title) updateData.title = payload.title;
          if (payload.description) updateData.description = payload.description;
          if (payload.dueDate) updateData.dueDate = new Date(payload.dueDate);
          if (payload.status) updateData.status = payload.status;

          // Handle relationships only if explicitly provided
          if (payload.projectId !== undefined) {
            if (payload.projectId) {
              const p = await prisma.project.findUnique({ where: { id: payload.projectId } });
              updateData.projectId = p ? p.id : null;
            } else {
              updateData.projectId = null;
            }
          }

          if (payload.assignedToId !== undefined) {
            if (payload.assignedToId) {
              const u = await prisma.user.findUnique({ where: { id: payload.assignedToId } });
              updateData.assignedToId = u ? u.id : null;
            } else {
              updateData.assignedToId = null;
            }
          }

          result = await prisma.task.update({
            where: { id: payload.id },
            data: updateData,
          });
          break;
        }

        case "ADD_DOCUMENT": {
          let projectId = payload.projectId || null;
          if (projectId) {
            const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
            if (!projectExists) projectId = null;
          }

          result = await prisma.document.create({
            data: {
              name: payload.name,
              url: payload.url,
              projectId: projectId,
              uploadedById: payload.uploadedById || null,
            },
          });
          break;
        }

        case "EDIT_DOCUMENT": {
          let projectId = payload.projectId;
          let uploadedById = payload.uploadedById;

          if (projectId) {
            const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
            if (!projectExists) projectId = null;
          }
          if (uploadedById) {
            const userExists = await prisma.user.findUnique({ where: { id: uploadedById } });
            if (!userExists) uploadedById = null;
          }

          result = await prisma.document.update({
            where: { id: payload.id },
            data: {
              name: payload.name,
              url: payload.url,
              projectId: projectId,
              uploadedById: uploadedById,
            },
          });
          break;
        }

        case "CLIENT_CONTACT": {
          // No side effects needed for client contact, just approve/resolve it
          result = { message: "Message resolved" };
          break;
        }

        default:
          return NextResponse.json(
            { error: `Unknown request type: ${request.type}` },
            { status: 400 }
          );
      }
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return NextResponse.json(
        { error: "Failed to execute the requested operation" },
        { status: 400 }
      );
    }

    // Update the request status to APPROVED
    const approvedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: userId,
        comment: comment || null,
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
      message: "Request approved successfully",
      request: approvedRequest,
      result,
    });
  } catch (error) {
    console.error("PATCH /api/requests/[id]/approve error:", error);
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 }
    );
  }
}
