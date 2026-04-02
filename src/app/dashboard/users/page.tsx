'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Mail, Shield, User as UserIcon, MoreHorizontal, Search } from 'lucide-react';
import type { User } from '@prisma/client';
import { AddUserModal } from '@/components/modals/AddUserModal';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: User[] = await res.json();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    if (roleFilter !== 'All') {
      result = result.filter(u => formatRole(u.role) === roleFilter);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(lowerQuery) ||
        u.email.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredUsers(result);
  }, [roleFilter, searchQuery, users]);

  const handleEdit = (user: User) => {
    setEditUser(user);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users/${userToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditUser(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ENGINEER': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CLIENT': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatRole = (role: string) => {
    if (!role) return '';
    const upper = role.toUpperCase();
    switch (upper) {
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Manager';
      case 'ENGINEER': return 'Engineer';
      case 'CLIENT': return 'Client';
      case 'USER': return 'User';
      default: return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Users"
        description="Manage team members, roles, and permissions."
        actionLabel="Add User"
        onActionClick={() => setModalOpen(true)}
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-56">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Engineer">Engineer</SelectItem>
              <SelectItem value="Client">Client</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto h-12 w-12 text-slate-400 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <UserIcon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <div className="h-20 bg-gradient-to-r from-slate-100 to-slate-200 relative">
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-white/50 backdrop-blur-sm rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => { setUserToDelete(user.id); setDeleteDialogOpen(true); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="px-5 pb-5 mt-[-3rem]">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-sm mb-3">
                    <AvatarFallback className="bg-slate-800 text-white text-xl font-bold">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>

                  <div className="space-y-1 mb-4">
                    <h3 className="font-bold text-lg text-slate-900 truncate" title={user.name}>{user.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 truncate" title={user.email}>
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Permission Level</span>
                      <Badge className={`mt-1 w-fit ${getRoleBadgeColor(user.role)}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {formatRole(user.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddUserModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onSuccess={fetchUsers}
        editUser={editUser}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
      <UsersPageContent />
    </ProtectedRoute>
  );
}
