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
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: editProject?.name || '',
    description: editProject?.description || '',
    clientId: (editProject as any)?.clientId || '',
    clientUserId: (editProject as any)?.clientUserId || '',
    managerId: (editProject as any)?.managerId || '',
    status: (editProject as any)?.status || 'PLANNING',
    startDate: (editProject as any)?.startDate || '',
    endDate: (editProject as any)?.endDate || '',
    budget: (editProject as any)?.budget || '',
    spent: (editProject as any)?.spent || '',
  });

  useEffect(() => {
    async function fetchData() {
      const [clientsRes, usersRes] = await Promise.all([
        fetch('/api/clients').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
      ]);
      setClients(clientsRes || []);
      setUsers(usersRes || []);
    }
    fetchData();
  }, []);

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
        clientUserId: (editProject as any).clientUserId || '',
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
        clientUserId: (formData as any).clientUserId || null,
        managerId: (formData as any).managerId || null,
        startDate: (formData as any).startDate || null,
        endDate: (formData as any).endDate || null,
      };

      if (editProject) {
        const res = await fetch(`/api/projects/${editProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dataToSubmit, updatedAt: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error('Failed to update project');
        toast.success('Project updated successfully');
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSubmit),
        });
        if (!res.ok) throw new Error('Failed to add project');
        toast.success('Project added successfully');
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        clientId: '',
        clientUserId: '',
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
              <Label htmlFor="client">Client (User Account)</Label>
              <Select value={(formData as any).clientUserId} onValueChange={(value) => setFormData({ ...formData, clientUserId: value, clientId: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Select Client User</SelectItem>
                  {users.filter(u => u.role === 'CLIENT').map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Select a registered Client User.
              </p>
            </div>
            {user?.role !== 'MANAGER' && (
              <div>
                <Label htmlFor="manager">Project Manager</Label>
                <Select value={(formData as any).managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === 'MANAGER').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
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
