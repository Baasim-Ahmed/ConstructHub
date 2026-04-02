"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Menu, X } from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  requiredRoles?: string[];
}

const allLinks: NavLink[] = [
  { name: "Dashboard", href: "/dashboard" },
  {
    name: "Clients",
    href: "/dashboard/clients",
    requiredRoles: ["ADMIN", "MANAGER"],
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
    requiredRoles: ["ADMIN", "MANAGER", "ENGINEER"],
  },
  {
    name: "Tasks",
    href: "/dashboard/tasks",
    requiredRoles: ["ADMIN", "MANAGER", "ENGINEER"],
  },
  {
    name: "Requests",
    href: "/dashboard/requests",
    requiredRoles: ["MANAGER", "ADMIN"],
  },
  {
    name: "My Requests",
    href: "/dashboard/requests",
    requiredRoles: ["ENGINEER"],
  },
  {
    name: "Submit Request",
    href: "/dashboard/submit-request",
    requiredRoles: ["ENGINEER"],
  },
  {
    name: "Estimator",
    href: "/dashboard/estimator",
    requiredRoles: ["MANAGER", "ENGINEER"],
  },
  { name: "Documents", href: "/dashboard/documents" },
  {
    name: "Material AI",
    href: "/dashboard/material-ai",
    requiredRoles: ["ADMIN", "MANAGER", "ENGINEER", "CLIENT"],
  },
  { name: "Users", href: "/dashboard/users", requiredRoles: ["ADMIN", "MANAGER"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile]);

  if (loading) {
    return (
      <aside className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border">
        <div className="p-4 text-2xl font-bold text-sidebar-primary">ConstructHub</div>
        <div className="p-4 text-sm text-sidebar-foreground">Loading...</div>
      </aside>
    );
  }

  const userRole = user?.role || "CLIENT";

  const filteredLinks = allLinks.filter((link) => {
    if (!link.requiredRoles) return true;
    return link.requiredRoles.includes(userRole);
  });

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-6 left-2 z-40 p-2 rounded-md bg-white mt-6 shadow-md border"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-sidebar text-sidebar-foreground shadow-lg border-r border-sidebar-border transition-transform duration-300",
          isMobile
            ? open
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0 static"
        )}
      >
        <div className="p-4 flex justify-between items-center border-b border-sidebar-border">
          <div>
            <div className="text-2xl font-bold text-sidebar-primary">ConstructHub</div>
            <div className="text-xs text-sidebar-foreground/70">
              Role:{" "}
              <span className="font-semibold text-sidebar-foreground">{userRole}</span>
            </div>
          </div>

          {isMobile && (
            <button onClick={() => setOpen(false)} className="text-sidebar-foreground hover:bg-sidebar-accent p-1 rounded-md">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="mt-4 space-y-1 px-2">
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === link.href ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
