"use client";

import { ReactNode } from "react";
import { UserRole, useRole } from "@/hooks/useCurrentUser";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
  // Using client-side dev role selection from DevRoleContext
  const role = useRole();

  // Check if the current role is authorized
  const isAuthorized = role && allowedRoles.includes(role);

  if (!isAuthorized) {
    // If not authorized, show the Access Denied fallback
    return (
      fallback || (
        <div className="p-8 text-center">
          <div className="text-red-600 font-semibold mb-2">Access Denied</div>
          <p className="text-gray-600">You do not have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Your role: {role || 'Unauthenticated'} | Required: {allowedRoles.join(', ')}</p>
        </div>
      )
    );
  }

  // Role is authorized, render children
  return <>{children}</>;
}
