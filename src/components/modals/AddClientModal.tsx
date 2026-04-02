'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Client } from '@prisma/client';
import { toast } from 'sonner';

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editClient?: Client | null;
}

export function AddClientModal({ open, onOpenChange, onSuccess, editClient }: AddClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editClient?.name || '',
    email: editClient?.email || '',
    phone: editClient?.phone || '',
    address: editClient?.address || '',
    companyName: (editClient as any)?.companyName || '',
  });

  // Update form data when editClient changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: editClient?.name || '',
        email: editClient?.email || '',
        phone: editClient?.phone || '',
        address: editClient?.address || '',
        companyName: (editClient as any)?.companyName || '',
      });
    }
  }, [editClient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editClient) {
        const res = await fetch(`/api/clients/${editClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, updatedAt: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error('Failed to update client');
        toast.success('Client updated successfully');
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to add client');
        toast.success('Client added successfully');
      }

      onSuccess();
      onOpenChange(false);
      setFormData({ name: '', email: '', phone: '', address: '', companyName: '' });
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {editClient ? 'Update client information' : 'Enter client details to create a new record'}
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
              placeholder="555-0100"
            />
          </div>
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={(formData as any).companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, State"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editClient ? 'Update' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
