'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Project, Client, User } from '@prisma/client';
import { toast } from 'sonner';
import { submitRequest } from '@/lib/requests';

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editProject?: Project | null;
}

export function AddProjectModal({ open, onOpenChange, onSuccess, editProject }: AddProjectModalProps) {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: editProject?.name || '',
    description: editProject?.description || '',
    clientId: (editProject as any)?.clientId || '',
    managerId: (editProject as any)?.managerId || '',
    status: (editProject as any)?.status || 'PLANNING',
    startDate: (editProject as any)?.startDate || '',
    endDate: (editProject as any)?.endDate || '',
    budget: (editProject as any)?.budget || '',
    spent: (editProject as any)?.spent || '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, usersRes] = await Promise.all([
          fetch('/api/clients', { cache: 'no-store' }),
          fetch('/api/users', { cache: 'no-store' }),
        ]);
        const clientsData = clientsRes.ok ? await clientsRes.json() : [];
        const usersData = usersRes.ok ? await usersRes.json() : [];
        setClients(clientsData || []);
        setManagers((usersData || []).filter((candidate: User) => candidate.role === 'MANAGER'));
      } catch (error) {
        console.error(error);
        toast.error('Failed to load project form options');
      }
    }

    if (open) {
      void fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (user?.role === 'MANAGER' && !editProject) {
      setFormData(prev => ({ ...prev, managerId: user.id }));
    }
  }, [user, editProject]);

  useEffect(() => {
    if (editProject) {
      setFormData({
        name: editProject.name,
        description: editProject.description || '',
        clientId: (editProject as any).clientId || '',
        managerId: (editProject as any).managerId || '',
        status: (editProject as any).status,
        startDate: (editProject as any).startDate || '',
        endDate: (editProject as any).endDate || '',
        budget: (editProject as any).budget || '',
        spent: '', // Reset or ignore spent for edits as requested to hide it
      });
    }
  }, [editProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        clientId: (formData as any).clientId || null,
        managerId: (formData as any).managerId || null,
        startDate: (formData as any).startDate || null,
        endDate: (formData as any).endDate || null,
      };

      if (editProject) {
        if (user?.role === 'MANAGER') {
          await submitRequest('EDIT_PROJECT', { id: editProject.id, ...dataToSubmit });
          toast.success('Project edit request submitted for admin approval');
        } else {
          const res = await fetch(`/api/projects/${editProject.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSubmit),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to update project');
          }
          toast.success('Project updated successfully');
        }
      } else {
        if (user?.role === 'MANAGER') {
          await submitRequest('ADD_PROJECT', dataToSubmit);
          toast.success('Project creation request submitted for admin approval');
        } else {
          const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSubmit),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to add project');
          }
          toast.success('Project added successfully');
        }
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        clientId: '',
        managerId: '',
        status: 'PLANNING',
        startDate: '',
        endDate: '',
        budget: '',
        spent: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          <DialogDescription>
            {editProject ? 'Update project information' : 'Enter project details to create a new record'}
          </DialogDescription>
          <p className="text-sm text-slate-500 mt-2">
            Only <strong>Project Name</strong> is required. All other fields are optional.
          </p>
          {user?.role === 'MANAGER' && !editProject && (
            <p className="text-sm text-amber-600 mt-2">
              <strong>Note:</strong> As a manager, this project will be submitted for admin approval before being added to the system.
            </p>
          )}
          {user?.role === 'MANAGER' && editProject && (
            <p className="text-sm text-amber-600 mt-2">
              <strong>Note:</strong> As a manager, project edits will be submitted for admin approval.
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Office Building Construction"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project details..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select value={(formData as any).clientId || undefined} onValueChange={(value) => setFormData({ ...formData, clientId: value === 'none' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client assigned</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}{client.companyName ? ` (${client.companyName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Client records created in the Clients module appear here automatically.
              </p>
            </div>
            {user?.role !== 'MANAGER' && (
              <div>
                <Label htmlFor="manager">Project Manager</Label>
                <Select value={(formData as any).managerId || undefined} onValueChange={(value) => setFormData({ ...formData, managerId: value === 'none' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No manager assigned</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={(formData as any).status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="budget">Total Budget (PKR)</Label>
              <Input
                id="budget"
                type="number"
                value={(formData as any).budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="5000000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={(formData as any).startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={(formData as any).endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editProject ? 'Update' : 'Add Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
