"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Mail, Phone, Building, MoreHorizontal } from "lucide-react";
import type { Client } from "@prisma/client";
import { AddClientModal } from "@/components/modals/AddClientModal";
import { useRole, roleChecks } from '@/hooks/useCurrentUser';
import { useRefetchOnRoleChange } from '@/hooks/useRefetchOnRoleChange';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
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

function ClientsPageContent() {
  const role = useRole();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Client[] = await res.json();
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClients(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clients');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useRefetchOnRoleChange(fetchClients);

  const handleEdit = (client: Client) => {
    setEditClient(client);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      const res = await fetch(`/api/clients/${clientToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete client');
    }
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditClient(null);
  };

  const textFilter = searchParams.get('q')?.trim().toLowerCase();
  const filteredClients = clients.filter((client: any) => {
    if (!textFilter) return true;
    const haystack = `${client.name} ${client.companyName || ''} ${client.email || ''} ${client.phone || ''}`.toLowerCase();
    return haystack.includes(textFilter);
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Clients"
        description="Manage your client partnerships and contact details."
        actionLabel={roleChecks.canEditClients(role) ? "Add Client" : undefined}
        onActionClick={() => setModalOpen(true)}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto h-12 w-12 text-slate-400 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <Building className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No clients yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first client.</p>
          {roleChecks.canEditClients(role) && (
            <Button onClick={() => setModalOpen(true)} className="mt-4" variant="outline">
              Add Client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{client.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Building className="h-3 w-3" />
                        {(client as any).companyName || 'Individual'}
                      </p>
                    </div>
                  </div>
                  {roleChecks.canEditClients(role) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => { setClientToDelete(client.id); setDeleteDialogOpen(true); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{client.phone || 'No phone'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddClientModal open={modalOpen} onOpenChange={handleModalClose} onSuccess={fetchClients} editClient={editClient} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this client? This will warn if they have active projects.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete Client</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "ENGINEER", "CLIENT"]}>
      <ClientsPageContent />
    </ProtectedRoute>
  );
}
