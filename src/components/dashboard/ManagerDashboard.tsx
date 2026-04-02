import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Briefcase, CheckSquare, Users, AlertCircle, Plus, Calendar, Target, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { StatCard } from './shared/StatCard';
import { ActivityItem } from './shared/ActivityItem';

export function ManagerDashboard({ greeting, userName }: { greeting: string, userName: string }) {
    const [stats, setStats] = useState({
        activeProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
        totalBudget: 0,
        totalSpent: 0,
        completedProjects: 0,
        totalProjects: 0
    });
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        // Fetch stats
        fetch('/api/dashboard/stats', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Stats fetch error:", err));

        // Fetch activity
        fetch('/api/activity', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => setActivities(Array.isArray(data) ? data : []))
            .catch(err => console.error("Activity fetch error:", err));
    }, []);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{userName}</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Here's what your team is working on today.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/projects/new">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 rounded-full px-6">
                            <Plus className="h-4 w-4 mr-2" />
                            New Project
                        </Button>
                    </Link>
                    <Link href="/dashboard/tasks/new">
                        <Button variant="outline" className="rounded-full px-6">
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Task
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Projects"
                    value={stats?.activeProjects?.toString() || "0"}
                    subtext="in progress"
                    trend="Now"
                    icon={Briefcase}
                    gradient="from-emerald-500 to-emerald-600"
                />
                <StatCard
                    title="Total Tasks"
                    value={stats?.totalTasks?.toString() || "0"}
                    subtext="assigned to team"
                    trend="Total"
                    icon={CheckSquare}
                    gradient="from-teal-500 to-teal-600"
                />
                <StatCard
                    title="Completion"
                    value={`${(stats?.totalTasks || 0) > 0 ? Math.round(((stats?.completedTasks || 0) / (stats?.totalTasks || 1)) * 100) : 0}%`}
                    subtext="task rate"
                    trend="KPI"
                    icon={Users}
                    gradient="from-cyan-500 to-cyan-600"
                />
                <StatCard
                    title="Blockers"
                    value={stats?.blockedTasks?.toString() || "0"}
                    subtext="req. attention"
                    trend={(stats?.blockedTasks || 0) > 0 ? "!" : "0"}
                    icon={AlertCircle}
                    gradient="from-rose-500 to-rose-600"
                />
            </div>

            {/* Goals & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Team Deliverables</CardTitle>
                            <CardDescription>Task completion velocity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[
                                        { name: 'Mon', completed: 5, pending: 10 },
                                        { name: 'Tue', completed: 8, pending: 8 },
                                        { name: 'Wed', completed: 12, pending: 6 },
                                        { name: 'Thu', completed: 15, pending: 5 },
                                        { name: 'Fri', completed: 18, pending: 3 },
                                    ]}>
                                        <defs>
                                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                        <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-slate-900 text-white">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-white">Quarterly Goals</CardTitle>
                                <Target className="h-5 w-5 text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Project Delivery</span>
                                    <span className="text-blue-400">
                                        {stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%
                                    </span>
                                </div>
                                <Progress
                                    value={stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0}
                                    className="h-2 bg-slate-800 [&>div]:bg-blue-500"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="border-none shadow-md h-full">
                        <CardHeader>
                            <CardTitle>Team Updates</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[500px] px-6">
                                <div className="space-y-1 pb-6">
                                    {activities.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400">No recent activity</div>
                                    ) : (
                                        activities.map((activity, i) => (
                                            <ActivityItem
                                                key={i}
                                                title={activity.title}
                                                time={new Date(activity.time).toLocaleDateString()}
                                                type={activity.type}
                                            />
                                        ))
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
