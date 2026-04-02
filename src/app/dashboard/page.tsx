'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { EngineerDashboard } from '@/components/dashboard/EngineerDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user, loading } = useCurrentUser();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-500 animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || 'USER';

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard greeting={greeting} userName={user?.name || 'Admin'} />;
    case 'MANAGER':
      return <ManagerDashboard greeting={greeting} userName={user?.name || 'Manager'} />;
    case 'ENGINEER':
      return <EngineerDashboard greeting={greeting} userName={user?.name || 'Engineer'} />;
    case 'CLIENT':
      return <ClientDashboard greeting={greeting} userName={user?.name || 'Client'} />;
    default:
      // Fallback to client dashboard instead of generic user dashboard
      return <ClientDashboard greeting={greeting} userName={user?.name || 'Client'} />;
  }
}
