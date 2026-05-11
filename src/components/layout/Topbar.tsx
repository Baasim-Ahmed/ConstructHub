"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Loader2, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResults = {
  projects: Array<{ id: string; name: string; status: string }>;
  tasks: Array<{ id: string; title: string; status: string; project?: { name: string } | null }>;
  clients: Array<{ id: string; name: string; companyName: string | null; email: string | null }>;
};

export function Topbar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ projects: [], tasks: [], clients: [] });

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ projects: [], tasks: [], clients: [] });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to search");
        const data = await res.json();
        setResults({
          projects: data.projects ?? [],
          tasks: data.tasks ?? [],
          clients: data.clients ?? [],
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults({ projects: [], tasks: [], clients: [] });
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    setQuery("");
    setResults({ projects: [], tasks: [], clients: [] });
  }, [pathname]);

  const hasResults = useMemo(
    () => results.projects.length > 0 || results.tasks.length > 0 || results.clients.length > 0,
    [results]
  );

  return (
    <header className="flex justify-between items-center px-6 py-3 bg-white border-b shadow-sm sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-80 rounded-full border-slate-200 pl-10 pr-10 text-sm focus-visible:ring-blue-500/20"
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
          {query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              {hasResults ? (
                <div className="space-y-3">
                  {results.projects.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Projects</p>
                      {results.projects.map((project) => (
                        <Link
                          key={project.id}
                          href={`/dashboard/projects/${project.id}`}
                          className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs text-slate-400">{project.status.replace(/_/g, " ")}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.tasks.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tasks</p>
                      {results.tasks.map((task) => (
                        <Link
                          key={task.id}
                          href={`/dashboard/tasks?q=${encodeURIComponent(query.trim())}`}
                          className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-slate-400">{task.project?.name ?? "No project"} · {task.status.replace(/_/g, " ")}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.clients.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Clients</p>
                      {results.clients.map((client) => (
                        <Link
                          key={client.id}
                          href={`/dashboard/clients?q=${encodeURIComponent(query.trim())}`}
                          className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-slate-400">{client.companyName ?? client.email ?? "Client record"}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-4 text-sm text-slate-500">No projects, tasks, or clients matched your search.</div>
              )}
            </div>
          )}
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
