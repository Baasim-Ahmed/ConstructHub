"use client";

import { useEffect, useState } from "react";

export type UserRole = "ADMIN" | "MANAGER" | "ENGINEER" | "CLIENT";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

let cachedUser: CurrentUser | null | undefined;
let currentUserRequest: Promise<CurrentUser | null> | null = null;

async function fetchCurrentUser() {
  if (!currentUserRequest) {
    currentUserRequest = fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        return await res.json() as CurrentUser | null;
      })
      .then((user) => {
        cachedUser = user;
        return user;
      })
      .finally(() => {
        currentUserRequest = null;
      });
  }

  return currentUserRequest;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser ?? null);
  const [loading, setLoading] = useState(cachedUser === undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedUser !== undefined) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await fetchCurrentUser();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
        cachedUser = null;
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
