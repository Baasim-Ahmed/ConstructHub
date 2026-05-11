'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Document, Project, User } from '@prisma/client';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Upload } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';

interface AddDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editDocument?: Document | null;
}

export function AddDocumentModal({ open, onOpenChange, onSuccess, editDocument }: AddDocumentModalProps) {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: editDocument?.name || '',
    url: (editDocument as any)?.url || '',
    projectId: (editDocument as any)?.projectId || '',
    uploadedById: (editDocument as any)?.uploadedById || user?.id || '',
    viewers: (editDocument as any)?.allowedViewers?.map((v: User) => v.id) || [],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/users'),
        ]);
        const projectsData = projectsRes.ok ? await projectsRes.json() : [];
        const usersData = usersRes.ok ? await usersRes.json() : [];
        setProjects(projectsData || []);
        setUsers(usersData || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load form options');
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editDocument) {
      setFormData({
        name: editDocument.name,
        url: (editDocument as any).url || '',
        projectId: (editDocument as any).projectId || '',
        uploadedById: (editDocument as any).uploadedById || user?.id || '',
        viewers: (editDocument as any).allowedViewers?.map((v: User) => v.id) || [],
      });
      setSelectedFile(null);
    }
  }, [editDocument, user?.id]);

  useEffect(() => {
    if (!editDocument && user?.id) {
      setFormData((current) => ({
        ...current,
        uploadedById: current.uploadedById || user.id,
      }));
    }
  }, [editDocument, user?.id]);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData({ ...formData, name: file.name });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!editDocument && !selectedFile) {
        throw new Error('Please choose a file to upload');
      }

      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('projectId', formData.projectId || '');
      formPayload.append('uploadedById', formData.uploadedById || user?.id || '');
      formData.viewers.forEach((viewerId: string) => formPayload.append('allowedViewers', viewerId));
      if (selectedFile) {
        formPayload.append('file', selectedFile);
      }

      if (editDocument) {
        const res = await fetch(`/api/documents/${editDocument.id}`, {
          method: 'PATCH',
          body: formPayload,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to update document');
        }
        toast.success('Document updated successfully');
      } else {
        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formPayload,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to upload document');
        }
        toast.success('Document uploaded successfully');
      }

      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      setFormData({ name: '', url: '', projectId: '', uploadedById: '', viewers: [] });
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
          <DialogTitle>{editDocument ? 'Edit Document' : 'Upload Document'}</DialogTitle>
          <DialogDescription>
            {editDocument ? 'Update document information' : 'Upload a new project document'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file">File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <span className="text-sm text-gray-600">
                {selectedFile?.name || formData.name || 'No file selected'}
              </span>
            </div>
          </div>
          <div>
            <Label htmlFor="project">Project</Label>
            <Select value={formData.projectId} onValueChange={(value: string) => setFormData({ ...formData, projectId: value })}>
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
            <Label htmlFor="uploaded_by">Uploaded By</Label>
            <Select value={formData.uploadedById} onValueChange={(value: string) => setFormData({ ...formData, uploadedById: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Who can view this document?</Label>
            <MultiSelect
              options={users.map(u => ({ label: u.name, value: u.id }))}
              selected={formData.viewers}
              onChange={(selected) => setFormData({ ...formData, viewers: selected })}
              placeholder="Select allowed viewers..."
            />
            <p className="text-[10px] text-muted-foreground mt-1">Leave empty to make visible to everyone with project access.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Uploading...' : editDocument ? 'Update' : 'Upload'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
