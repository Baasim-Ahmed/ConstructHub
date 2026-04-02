'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { Calendar, Clock, CheckSquare, Users, FileText, ArrowLeft, Cuboid, BrainCircuit } from 'lucide-react';
import { useRole, roleChecks } from '@/hooks/useCurrentUser';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const role = useRole();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${id}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        toast.error("Project not found");
                        router.push('/dashboard/projects');
                        return;
                    }
                    throw new Error('Failed to fetch project');
                }
                const data = await res.json();
                setProject(data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load project details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProject();
        }
    }, [id, router]);

    if (loading) {
        return <div className="p-8 text-center">Loading project details...</div>;
    }

    if (!project) return null;

    const calculateProgress = () => {
        if (!project.tasks || project.tasks.length === 0) return 0;
        const completed = project.tasks.filter((t: any) => t.status === 'COMPLETED').length;
        return Math.round((completed / project.tasks.length) * 100);
    };

    const progress = calculateProgress();

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Projects</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
                        <Badge variant="outline" className="text-sm px-3 py-1 uppercase">{project.status?.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-slate-500 flex items-center gap-2">
                        {project.client?.name ? `Client: ${project.client.name}` : 'No Client'}
                        <span className="text-slate-300">•</span>
                        <Calendar className="h-4 w-4" />
                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </p>
                </div>
                {roleChecks.canEditProjects(role) && (
                    <Button variant="outline" onClick={() => router.push(`/dashboard/projects?action=edit&id=${id}`)}>
                        Edit Project
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6">
                        <div className="text-slate-500 text-sm font-medium mb-1">Total Progress</div>
                        <div className="text-3xl font-bold text-blue-700 mb-2">{progress}%</div>
                        <Progress value={progress} className="h-2 bg-blue-100" />
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-6">
                        <div className="text-slate-500 text-sm font-medium mb-1">Budget Used</div>
                        <div className="text-3xl font-bold text-emerald-700 mb-2">
                            {((project.spent / (project.budget || 1)) * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-emerald-600">
                            {project.spent} / {project.budget}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-violet-50/50">
                    <CardContent className="p-6">
                        <div className="text-slate-500 text-sm font-medium mb-1">Total Tasks</div>
                        <div className="text-3xl font-bold text-violet-700 mb-2">{project.tasks?.length || 0}</div>
                        <div className="flex gap-2 text-xs">
                            <span className="text-emerald-600">{project.tasks?.filter((t: any) => t.status === 'COMPLETED').length} Done</span>
                            <span className="text-amber-600">{project.tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length} Active</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-slate-50/50">
                    <CardContent className="p-6">
                        <div className="text-slate-500 text-sm font-medium mb-1">Team Size</div>
                        <div className="text-3xl font-bold text-slate-700 mb-2">{1 + (project.manager ? 1 : 0)}</div>
                        <div className="flex -space-x-2">
                            {project.manager && (
                                <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold" title="Manager">
                                    {project.manager.name.charAt(0)}
                                </div>
                            )}
                            <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-400">
                                +1
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-slate-100 p-1 mb-6">
                    <TabsTrigger value="overview" className="px-6">Overview</TabsTrigger>
                    <TabsTrigger value="tasks" className="px-6">Tasks</TabsTrigger>
                    <TabsTrigger value="team" className="px-6">Team</TabsTrigger>
                    <TabsTrigger value="documents" className="px-6">Documents</TabsTrigger>
                    <TabsTrigger value="3d" className="px-6 text-slate-500 italic">3D Model</TabsTrigger>
                    <TabsTrigger value="ai" className="px-6 text-slate-500 italic">AI Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed">
                                {project.description || "No description provided."}
                            </p>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900 mb-1">Location</h4>
                                    <p className="text-slate-500">{project.location || "Not specified"}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900 mb-1">Timeline</h4>
                                    <p className="text-slate-500">
                                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tasks">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Tasks ({project.tasks?.length})</CardTitle>
                                {roleChecks.canEditTasks(role) && (
                                    <Button size="sm" onClick={() => router.push(`/dashboard/tasks?projectId=${id}`)}>Manage Tasks</Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {project.tasks?.length === 0 ? (
                                    <p className="text-slate-500 text-center py-8">No tasks created yet.</p>
                                ) : (
                                    project.tasks?.map((task: any) => (
                                        <div key={task.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                                <span className="font-medium text-slate-700">{task.title}</span>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">{task.status}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                            {project.manager?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{project.manager?.name}</p>
                                            <p className="text-sm text-slate-500">{project.manager?.email}</p>
                                        </div>
                                    </div>
                                    <Badge>Manager</Badge>
                                </div>
                                {/* Placeholder for engineers iteration if available in future relations */}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Documents</CardTitle>
                                <Button size="sm" variant="outline">Upload New</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {project.documents?.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>No documents uploaded yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {project.documents?.map((doc: any) => (
                                        <div key={doc.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                <span className="font-medium truncate">{doc.name}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">Added {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="3d">
                    <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <Cuboid className="h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700">3D Model View</h3>
                        <p className="text-slate-500 mt-2">This feature is coming soon in FYP2.</p>
                        <Button disabled className="mt-6">Launch Viewer</Button>
                    </div>
                </TabsContent>

                <TabsContent value="ai">
                    <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <BrainCircuit className="h-16 w-16 text-purple-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700">AI Insights</h3>
                        <p className="text-slate-500 mt-2">Smart project analysis coming in FYP2.</p>
                        <Button disabled className="mt-6 bg-purple-600">Run Analysis</Button>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
