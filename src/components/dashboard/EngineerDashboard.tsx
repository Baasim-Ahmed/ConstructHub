import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, CheckSquare, Clock, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from './shared/StatCard';
import { ActivityItem } from './shared/ActivityItem';

export function EngineerDashboard({ greeting, userName }: { greeting: string, userName: string }) {
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [stats, setStats] = useState({
        assignedTasks: 0,
        upcomingDeadlines: 0,
        myProjects: 0,
        pendingReports: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, tasksRes] = await Promise.all([
                    fetch('/api/projects', { cache: 'no-store' }),
                    fetch('/api/tasks', { cache: 'no-store' })
                ]);

                let projectsData = [];
                if (projectsRes.ok) {
                    projectsData = await projectsRes.json();
                    setProjects(projectsData);
                }

                if (tasksRes.ok) {
                    const tasksData = await tasksRes.json();
                    setTasks(Array.isArray(tasksData) ? tasksData : []);
                }

                // Calculate derived stats
                const tasksList = Array.isArray(tasks) ? tasks : [];
                const upcomingCount = tasksList.filter((t: any) => {
                    if (!t.dueDate) return false;
                    const due = new Date(t.dueDate);
                    const now = new Date();
                    const diffTime = due.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 2; // Due in next 2 days
                }).length;

                setStats({
                    assignedTasks: tasksList.length,
                    upcomingDeadlines: upcomingCount,
                    myProjects: projectsData.length,
                    pendingReports: 0
                });

            } catch (error) {
                console.error("Failed to fetch engineer dashboard data", error);
            }
        };
        fetchData();
    }, []);

    // Re-run stats calculation when tasks state updates if needed, 
    // but simpler to do it in the fetch for now or use useMemo.
    // Let's rely on the initial fetch for simplicity as tasks are set there.

    // Actually, state updates form fetch won't be available immediately in the same render cycle
    // We should move the calculation to a useEffect or formatting function, 
    // OR just use derived state during render.

    const upcomingTasks = tasks.filter((t: any) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        const now = new Date();
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7; // Show tasks due in next week for "Priorities"
    }).slice(0, 3); // Top 3

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">{userName}</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Focus on your assigned tasks and project specs.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/tasks">
                        <Button className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-600/20 rounded-full px-6">
                            <CheckSquare className="h-4 w-4 mr-2" />
                            My Tasks
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Assigned Tasks"
                    value={tasks.length.toString()}
                    subtext="in progress"
                    trend="="
                    icon={CheckSquare}
                    gradient="from-cyan-500 to-cyan-600"
                />
                <StatCard
                    title="Upcoming Deadlines"
                    value={tasks.filter((t: any) => {
                        if (!t.dueDate) return false;
                        const due = new Date(t.dueDate);
                        const now = new Date();
                        const diff = due.getTime() - now.getTime();
                        return diff > 0 && diff < 48 * 60 * 60 * 1000;
                    }).length.toString()}
                    subtext="next 48h"
                    trend="!"
                    icon={Clock}
                    gradient="from-amber-500 to-amber-600"
                />
                <StatCard
                    title="My Projects"
                    value={projects.length.toString()}
                    subtext="active involvement"
                    trend="="
                    icon={Briefcase}
                    gradient="from-blue-500 to-blue-600"
                />
                <StatCard
                    title="Site Reports"
                    value={stats.pendingReports.toString()}
                    subtext="pending review"
                    trend="-"
                    icon={AlertCircle}
                    gradient="from-purple-500 to-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>My Priorities</CardTitle>
                            <CardDescription>High-priority tasks assigned to you (Due Soon)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingTasks.length > 0 ? (
                                    upcomingTasks.map((task: any) => (
                                        <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-200 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-cyan-600 shadow-sm font-bold">
                                                    P
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{task.title}</p>
                                                    <p className="text-xs text-slate-500 flex items-center mt-1">
                                                        <Calendar className="h-3 w-3 mr-1" /> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link href={`/dashboard/tasks`}>
                                                <Button size="sm" variant="outline" className="text-cyan-600 border-cyan-200 hover:bg-cyan-50">
                                                    Update Status
                                                </Button>
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-500">
                                        All caught up! No urgent tasks.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="border-none shadow-md h-full">
                        <CardHeader>
                            <CardTitle>Project Feed</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[500px] px-6">
                                <div className="space-y-1 pb-6">
                                    {projects.length > 0 ? (
                                        projects.map((project: any) => (
                                            <div key={project.id} className="mb-4">
                                                <ActivityItem
                                                    title={`Assigned to ${project.name}`}
                                                    time={new Date(project.updatedAt).toLocaleDateString()}
                                                    type="project"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-slate-500 py-4">No active projects found</div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
