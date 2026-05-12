import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Briefcase, CheckSquare, Users, AlertCircle, Plus, DollarSign, Calendar,
    FolderDot,
    ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';
import { StatCard } from './shared/StatCard';
import { ActivityItem } from './shared/ActivityItem';
import { ConstructionEmptyState } from '@/components/ui/ConstructionEmptyState';
import { ClipboardList } from 'lucide-react';
import { AddProjectModal } from '@/components/modals/AddProjectModal';
import { AddTaskModal } from '@/components/modals/AddTaskModal';


interface TaskStats {
    PENDING: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    BLOCKED: number;
}

interface ProjectStats {
    PLANNING: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    COMPLETED: number;
    CANCELLED: number;
}

export function AdminDashboard({ greeting, userName }: { greeting: string, userName: string }) {
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        attentionProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
        usersCount: 0,
        totalBudget: 0
    });
    const [activities, setActivities] = useState([]);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, activityRes] = await Promise.all([
                fetch('/api/dashboard/stats', { cache: 'no-store' }),
                fetch('/api/activity', { cache: 'no-store' })
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            } else {
                console.error('Stats response not ok:', statsRes.status);
            }

            if (activityRes.ok) {
                const data = await activityRes.json();
                setActivities(data);
            } else {
                console.error('Activity response not ok:', activityRes.status);
            }

        } catch (error) {
            console.error('Failed to load dashboard data', error);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    // --- Derived Data ---
    const totalTasks = stats.activeTasks + stats.completedTasks;
    const taskCompletion = totalTasks > 0 ? Math.round((stats.completedTasks / totalTasks) * 100) : 0;
    const activeProjects = stats.activeProjects;

    // Placeholder chart data until we have historical API
    const chartData = [
        { name: 'Mon', tasks: 4, projects: 2 },
        { name: 'Tue', tasks: 3, projects: 5 },
        { name: 'Wed', tasks: 7, projects: 3 },
        { name: 'Thu', tasks: 5, projects: 6 },
        { name: 'Fri', tasks: 8, projects: 4 },
    ];

    const pieData = [
        { name: 'Completed', value: stats.completedTasks, color: '#10b981' },
        { name: 'In Progress/Pending', value: stats.activeTasks, color: '#3b82f6' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Admin</span>
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-full px-6" onClick={() => setProjectModalOpen(true)}>
                        <FolderDot className="h-4 w-4 mr-2" />
                        New Project
                    </Button>
                    <Button variant="outline" className="rounded-full px-6" onClick={() => setTaskModalOpen(true)}>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Add Task
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Projects"
                    value={stats.totalProjects}
                    subtext={`${stats.activeProjects} active now`}
                    trend="Live"
                    icon={Briefcase}
                    gradient="from-blue-500 to-blue-600"
                />
                <StatCard
                    title="Active Tasks"
                    value={stats.activeTasks}
                    subtext={`${stats.completedTasks} completed`}
                    trend="Live"
                    icon={CheckSquare}
                    gradient="from-indigo-500 to-indigo-600"
                />
                <StatCard
                    title="Team Members"
                    value={stats.usersCount}
                    subtext="registered users"
                    trend="Live"
                    icon={Users}
                    gradient="from-violet-500 to-violet-600"
                />

            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Charts Section (Left 2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Chart */}
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Weekly Activity</CardTitle>
                            <CardDescription>Task completion vs Project updates over the last 7 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                                        <Area type="monotone" dataKey="projects" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorProjects)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Task Distribution */}
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>Task Status</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center min-h-[250px]">
                                {totalTasks > 0 ? (
                                    <>
                                        <div className="h-[200px] w-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-4 flex-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Completion</span>
                                                <span className="font-bold text-slate-800">{taskCompletion}%</span>
                                            </div>
                                            <Progress value={taskCompletion} className="h-2" />
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                {pieData.map(d => (
                                                    <div key={d.name} className="flex items-center">
                                                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: d.color }} />
                                                        {d.name} ({d.value})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <ConstructionEmptyState
                                        title="No Tasks Found"
                                        description="Your job site is clear. Create a new task to get started."
                                        icon={ClipboardList}
                                        actionLabel="Assign Task"
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Project Health */}
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>Project Health</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">On Track</p>
                                            <p className="text-xs text-slate-500">Projects on schedule</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-lg text-slate-800">{activeProjects}</span>
                                </div>
                                <Link href="/dashboard/projects?status=ON_HOLD" className="block">
                                <div className="flex items-center justify-between rounded-xl p-2 -m-2 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">Needs Attention</p>
                                            <p className="text-xs text-slate-500">Delayed milestones</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-lg text-slate-800">{stats.attentionProjects}</span>
                                </div>
                                </Link>
                                <Link href="/dashboard/projects?view=health">
                                <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                                    View Detailed Report
                                </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Sidebar (Feeds) */}
                <div className="space-y-8">
                    <Card className="border-none shadow-md h-full">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Real-time updates from your team</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[600px] px-6">
                                <div className="space-y-1 pb-6">
                                    {activities.length > 0 ? (
                                        activities.map((activity: any) => (
                                            <Link
                                                href={activity.type === 'project' ? `/dashboard/projects` : `/dashboard/tasks`}
                                                key={activity.id}
                                                className="block hover:bg-slate-50 rounded-lg transition-colors"
                                            >
                                                <ActivityItem
                                                    title={activity.title}
                                                    time={new Date(activity.time).toLocaleDateString()}
                                                    type={activity.type}
                                                />
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-slate-500">
                                            No recent activity
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

            </div>
            <AddProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} onSuccess={() => void fetchData()} />
            <AddTaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} onSuccess={() => void fetchData()} />
        </div>
    );
}
