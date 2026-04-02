import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSessionOrNull } from "@/lib/auth";

export async function GET(req: Request) {
    const session: any = await getServerSessionOrNull(req as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, id } = session.user;

    try {
        let projectFilter: any = {};
        let taskFilter: any = {};

        if (role === 'ADMIN') {
            // ADMIN sees all activity
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
            projectFilter = { tasks: { some: { assignedToId: id } } };
        } else if (role === 'CLIENT') {
            projectFilter = { clientUserId: id };
            taskFilter = { project: { clientUserId: id } };
        }

        // Fetch recent projects
        const recentProjects = await prisma.project.findMany({
            take: 5,
            where: projectFilter,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, createdAt: true },
        });

        // Fetch recent tasks
        const recentTasks = await prisma.task.findMany({
            take: 5,
            where: taskFilter,
            orderBy: { createdAt: "desc" },
            include: {
                project: { select: { name: true } }
            },
        });

        // Combine and sort
        const activities = [
            ...recentProjects.map(p => ({
                id: p.id,
                title: `New Project Created: ${p.name}`,
                time: p.createdAt,
                type: 'project'
            })),
            ...recentTasks.map(t => ({
                id: t.id,
                title: `Task Added: ${t.title} (${t.project?.name || 'No Project'})`,
                time: t.createdAt,
                type: 'task'
            }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 10);

        return NextResponse.json(activities, {
            headers: {
                "Cache-Control": "no-store, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });

    } catch (error) {
        console.error("Activity fetch error", error);
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
    }
}
