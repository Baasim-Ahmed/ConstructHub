import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull, requireRole } from "@/lib/auth";

export async function GET(req: Request) {
    const session: any = await getServerSessionOrNull(req as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, id } = session.user;
    console.log('Dashboard stats request from user:', { role, id });

    try {
        let projectFilter: any = {};
        let taskFilter: any = {};

        if (role === 'ADMIN') {
            // ADMIN sees all projects and tasks
            projectFilter = {};
            taskFilter = {};
        } else if (role === 'MANAGER') {
            projectFilter = { managerId: id };
            taskFilter = {
                OR: [
                    { project: { managerId: id } },
                    { assignedToId: id }
                ]
            };
        } else if (role === 'ENGINEER') {
            taskFilter = { assignedToId: id };
            projectFilter = { tasks: { some: { assignedToId: id } } }; // Only projects they have tasks in
        } else if (role === 'CLIENT') {
            // Filter by the new clientUserId field we added
            projectFilter = { clientUserId: id };
            taskFilter = { project: { clientUserId: id } };
        }

        const [
            totalProjects,
            activeProjects,
            totalTasks,
            completedTasks,
            blockedTasks,
            completedProjects,
            usersCount,
            newDocuments
        ] = await Promise.all([
            prisma.project.count({ where: projectFilter }),
            prisma.project.count({ where: { ...projectFilter, status: { in: ["PLANNING", "IN_PROGRESS"] } } }),
            prisma.task.count({ where: taskFilter }),
            prisma.task.count({ where: { ...taskFilter, status: "COMPLETED" } }),
            prisma.task.count({ where: { ...taskFilter, status: "BLOCKED" } }),
            prisma.project.count({ where: { ...projectFilter, status: "COMPLETED" } }),
            prisma.user.count(),
            prisma.document.count({
                where: {
                    uploadedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    OR: [
                        { project: projectFilter },
                        { uploadedById: id },
                        { allowedViewers: { some: { id } } }
                    ]
                }
            })
        ]);

        // Calculate budget and spent
        // Budget tracking removed as per requirement
        const totalBudget = 0;
        const totalSpent = 0;

        const result = {
            totalProjects,
            activeProjects,
            activeTasks: totalTasks - completedTasks,
            totalTasks,
            completedTasks,
            blockedTasks,
            completedProjects,
            usersCount,
            newDocuments,
            totalBudget,
            totalSpent
        };

        console.log('Dashboard stats result:', result);
        return NextResponse.json(result, {
            headers: {
                "Cache-Control": "no-store, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });

    } catch (error) {
        console.error("Dashboard stats error", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
