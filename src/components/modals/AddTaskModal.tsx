'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, Project, User } from '@prisma/client';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useCurrentUser';
import { submitRequest } from '@/lib/requests';

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editTask?: Task | null;
}

export function AddTaskModal({ open, onOpenChange, onSuccess, editTask }: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: editTask?.title || '',
    description: editTask?.description || '',
    projectId: (editTask as any)?.projectId || '',
    assignedToId: (editTask as any)?.assignedToId || '',
    status: (editTask as any)?.status || 'PENDING',
    dueDate: (editTask as any)?.dueDate || '',
  });

  useEffect(() => {
    async function fetchData() {
      const [projectsRes, usersRes] = await Promise.all([
        fetch('/api/projects').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
      ]);
      setProjects(projectsRes || []);
      setUsers(usersRes || []);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description || '',
        projectId: (editTask as any).projectId || '',
        assignedToId: (editTask as any).assignedToId || '',
        status: (editTask as any).status,
        dueDate: (editTask as any).dueDate || '',
      });
    }
  }, [editTask]);

  const role = useRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        projectId: (formData as any).projectId || null,
        assignedToId: (formData as any).assignedToId || null,
        dueDate: (formData as any).dueDate || null,
      };

      if (editTask) {
        if (role === 'ENGINEER') {
          await submitRequest('EDIT_TASK', { id: editTask.id, ...dataToSubmit });
          toast.success('Edit task request submitted');
        } else {
          const res = await fetch(`/api/tasks/${editTask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...dataToSubmit, updatedAt: new Date().toISOString() }),
          });
          if (!res.ok) throw new Error('Failed to update task');
          toast.success('Task updated successfully');
        }
      } else {
        if (role === 'ENGINEER') {
          await submitRequest('ADD_TASK', dataToSubmit);
        } else {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSubmit),
          });
          if (!res.ok) throw new Error('Failed to add task');
          toast.success('Task added successfully');
        }
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        projectId: '',
        assignedToId: '',
        status: 'PENDING',
        dueDate: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{editTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {editTask ? 'Update task information' : 'Enter task details to create a new record'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {role !== 'ENGINEER' && (
            <>
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Install electrical wiring"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task details..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select value={(formData as any).projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Select value={(formData as any).assignedToId} onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                        {users.filter(u => u.role === 'ENGINEER').map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                        {users.filter(u => u.role === 'ENGINEER').length === 0 && (
                          <SelectItem value="" disabled>
                            No engineers available
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {role === 'ENGINEER' && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mb-4">
              <h4 className="font-semibold text-slate-800">{formData.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{formData.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={(formData as any).status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={(formData as any).dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editTask ? 'Update' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
