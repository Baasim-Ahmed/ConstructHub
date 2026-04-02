"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {


  return (
    <header className="flex justify-between items-center px-6 py-3 bg-white border-b shadow-sm sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border border-slate-200 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-md" />
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-red-600 hover:bg-red-50"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
