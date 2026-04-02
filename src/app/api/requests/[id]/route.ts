import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const request = await prisma.request.findUnique({
            where: { id },
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

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        return NextResponse.json(request);
    } catch (error) {
        console.error("GET /api/requests/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to fetch request" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSessionOrNull(req);
        const user = (session as any)?.user;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: userId } = user;

        const body = await req.json();
        const { payload } = body;

        const request = await prisma.request.findUnique({
            where: { id },
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // Only creator can update
        if (request.createdById !== userId) {
            return NextResponse.json(
                { error: "You can only update your own requests" },
                { status: 403 }
            );
        }

        // Only DENIED requests can be resubmitted (or PENDING if we wanted to allow edits, but requirement is for denied)
        if (request.status !== "DENIED") {
            return NextResponse.json(
                { error: "Only denied requests can be resubmitted" },
                { status: 400 }
            );
        }

        const updatedRequest = await prisma.request.update({
            where: { id },
            data: {
                payload,
                status: "PENDING",
                comment: null, // Clear the denial comment or keep it? Requirement says "returns back... so engineer can fix". Usually we clear it or move it to history. Let's clear it for now to show it's a fresh request.
                reviewedById: null,
            },
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("PUT /api/requests/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to update request" },
            { status: 500 }
        );
    }
}
