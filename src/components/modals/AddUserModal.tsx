'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useCurrentUser';

interface EditUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editUser?: EditUser | null;
}

export function AddUserModal({ open, onOpenChange, onSuccess, editUser }: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CLIENT',
    password: '',
  });

  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name || '',
        email: editUser.email || '',
        phone: editUser.phone || '',
        role: editUser.role || 'CLIENT',
        password: '',
      });
    } else {
      setFormData({ name: '', email: '', phone: '', role: 'CLIENT', password: '' });
    }
  }, [editUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editUser) {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
        };
        if (formData.password) payload.password = formData.password;

        const res = await fetch(`/api/users/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update user');
        toast.success('User updated successfully');
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          password: formData.password || undefined,
        };
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to create user');
        toast.success('User added successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const currentUserRole = useRole();

  const getAvailableRoles = () => {
    if (currentUserRole === 'ADMIN') {
      return ['ADMIN', 'MANAGER', 'ENGINEER', 'CLIENT'];
    }
    // Managers can only create Engineers, Clients, and Users
    return ['ENGINEER', 'CLIENT'];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {editUser ? 'Update user information' : 'Enter user details to create a new user'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0300-1234567"
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAvailableRoles().map(role => (
                  <SelectItem key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="password">Password {editUser ? '(leave blank to keep current)' : '*'}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editUser ? '••••••••' : 'Set a password'}
              required={!editUser}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editUser ? 'Update' : 'Add User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
