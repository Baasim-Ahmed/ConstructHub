"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { notifyRoleChange } from "@/lib/roleEmitter";

export type DevRole = "ADMIN" | "MANAGER" | "ENGINEER" | "CLIENT";

interface DevRoleContextValue {
  role: DevRole;
  setRole: (r: DevRole) => void;
}

const DevRoleContext = createContext<DevRoleContextValue | undefined>(
  undefined
);

export function DevRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<DevRole>("CLIENT");
  const [hydrated, setHydrated] = useState(false);

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("devRole") as DevRole | null;
      if (
        stored &&
        ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"].includes(stored)
      ) {
        setRoleState(stored);
      }
    } catch { }
    setHydrated(true);
  }, []);

  const setRole = useCallback((r: DevRole) => {
    setRoleState(r);
    try {
      localStorage.setItem("devRole", r);
    } catch { }
    notifyRoleChange(r);
  }, []);

  if (!hydrated) return null;

  return (
    <DevRoleContext.Provider value={{ role, setRole }}>
      {children}
    </DevRoleContext.Provider>
  );
}

export function useDevRole() {
  const ctx = useContext(DevRoleContext);
  if (!ctx) {
    // Fallback: if provider isn't mounted yet (hydration ordering), provide a safe
    // default that reads from storage and notifies listeners. This prevents runtime
    // crashes when client components mount before the provider.

    // throw new Error("useDevRole must be used within DevRoleProvider");
    return {
      role: getDevRoleFromStorage(),
      setRole: (r: DevRole) => {
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("devRole", r);
            document.cookie = `devRole=${r}; path=/`;
          }
        } catch (e) { }
        try {
          notifyRoleChange(r);
        } catch (e) { }
      },
    } as DevRoleContextValue;
  }
  return ctx;
}

export function getDevRoleFromStorage(): DevRole {
  try {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("devRole") : null;
    if (
      stored &&
      ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"].includes(stored)
    ) {
      return stored as DevRole;
    }
  } catch (e) {
    /* ignore */
  }
  return "CLIENT";
}
