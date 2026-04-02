"use client";

import { useEffect, useState } from "react";

export type UserRole = "ADMIN" | "MANAGER" | "ENGINEER" | "CLIENT";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
}

export function useRole() {
  const { user } = useCurrentUser();
  return user?.role || "CLIENT";
}

// Helper functions for role checks
export const roleChecks = {
  isAdmin: (role: UserRole) => role === "ADMIN",
  isManager: (role: UserRole) => role === "MANAGER",
  isEngineer: (role: UserRole) => role === "ENGINEER",
  isClient: (role: UserRole) => role === "CLIENT",


  // Can access admin features (Users management)
  canAccessUsers: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),

  // Manager has full control across the app (except Users)
  canAccessAll: (role: UserRole) => role === "MANAGER",

  // Viewing permissions (Admins can view; Managers can view and edit)
  canAccessProjects: (role: UserRole) => ["ADMIN", "MANAGER", "ENGINEER"].includes(role),
  canAccessClients: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canAccessDocuments: (role: UserRole) => ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"].includes(role),
  canAccessTasks: (role: UserRole) => ["ADMIN", "MANAGER", "ENGINEER"].includes(role),

  // Edit/create/delete permissions
  canEditProjects: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canEditClients: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canEditTasks: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canEditDocuments: (role: UserRole) => ["ADMIN", "MANAGER", "ENGINEER"].includes(role),
};
