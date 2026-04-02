'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ListTodo, User, MoreHorizontal, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@prisma/client';
import { AddProjectModal } from '@/components/modals/AddProjectModal';
import { useRole, roleChecks } from '@/hooks/useCurrentUser';
import { useRefetchOnRoleChange } from '@/hooks/useRefetchOnRoleChange';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ProjectsPage() {
  const role = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data: Project[] = await res.json();
      data.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
      setProjects(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load projects');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useRefetchOnRoleChange(fetchProjects);

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`/api/projects/${projectToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete project');
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditProject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PLANNING': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'ON_HOLD': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return '-';
    return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateProgress = (project: any) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter((t: any) => t.status === 'COMPLETED').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Projects"
        description="Track progress, manage timelines, and deliver results."
        actionLabel={roleChecks.canEditProjects(role) ? "New Project" : undefined}
        onActionClick={() => setModalOpen(true)}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto h-12 w-12 text-slate-400 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <ListTodo className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first project to start tracking.</p>
          {roleChecks.canEditProjects(role) && (
            <Button onClick={() => setModalOpen(true)} className="mt-4" variant="outline">
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const progress = calculateProgress(project);
            return (
              <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="block group">
                <Card className="hover:shadow-xl transition-all duration-300 border-slate-200 h-full">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className={`${getStatusColor((project as any).status)} border px-3 py-1 rounded-full`}>
                        {formatStatus((project as any).status)}
                      </Badge>
                      {roleChecks.canEditProjects(role) && (
                        <div onClick={(e) => e.preventDefault()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 -mr-2">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(project); }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setProjectToDelete(project.id); setDeleteDialogOpen(true); }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight line-clamp-1">{project.name}</h3>
                    <p className="text-sm text-slate-500 mb-6 flex items-center gap-1">
                      {(project as any).client?.name || (project as any).clientUser?.name || 'No Client'}
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-600">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold border border-white shadow-sm" title={(project as any).manager?.name || 'Unassigned'}>
                            {(project as any).manager?.name?.charAt(0) || '?'}
                          </div>
                          <div className="text-xs text-slate-500">
                            <p className="font-medium text-slate-700">Manager</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                          <Clock className="h-3 w-3" />
                          {formatDate((project as any).endDate)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <AddProjectModal open={modalOpen} onOpenChange={handleModalClose} onSuccess={fetchProjects} editProject={editProject} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the project and all associated tasks and documents.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete Project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
