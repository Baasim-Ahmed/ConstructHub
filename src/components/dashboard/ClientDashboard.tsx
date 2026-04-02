import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Briefcase, FileText, Mail, DollarSign, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { StatCard } from "./shared/StatCard";

import { useEffect, useState } from "react";
import { ContactManagerModal } from "@/components/modals/ContactManagerModal";
import { ClientRequests } from "./client/ClientRequests";

export function ClientDashboard({ greeting, userName }: { greeting: string, userName: string }) {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [stats, setStats] = useState({
    progress: 0,
    totalTasks: 0,
    completedTasks: 0,
    projectCount: 0,
    totalBudget: 0,
    totalSpent: 0,
    newDocs: 0
  });
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Stats
    fetch('/api/dashboard/stats', { cache: 'no-store' })
      .then(res => {
        console.log('Stats fetch response:', res.status);
        if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Stats data received:', data);
        setStats({
          progress: data.progress || 0,
          totalTasks: data.totalTasks || 0,
          completedTasks: data.completedTasks || 0,
          projectCount: data.activeProjects || 0,
          totalBudget: data.totalBudget || 0,
          totalSpent: data.totalSpent || 0,
          newDocs: data.newDocuments || 0
        });
      })
      .catch(err => {
        console.error("Stats fetch error:", err);
      });

    // Fetch Projects
    fetch('/api/projects', { cache: 'no-store' })
      .then(res => {
        console.log('Projects fetch response:', res.status);
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Projects data received:', data.length, 'projects');
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(err => console.error("Projects fetch error", err));

  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {greeting},{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
              {userName}
            </span>
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of your project progress and financials.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setContactModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20 rounded-full px-6"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Manager
          </Button>
        </div>
      </div>

      <ContactManagerModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall Progress"
          value={`${stats.progress}%`}
          subtext="based on tasks"
          trend={stats.progress > 0 ? "Active" : "-"}
          icon={Briefcase}
          gradient="from-amber-500 to-amber-600"
        />

        <StatCard
          title="New Docs"
          value={stats.newDocs.toString()}
          subtext="uploaded this week"
          trend="Live"
          icon={FileText}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Projects"
          value={stats.projectCount.toString()}
          subtext="underway"
          trend="="
          icon={Calendar}
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Project Status: {projects.length > 0 ? projects[0].name : "No Active Project"}</CardTitle>
              <CardDescription>
                {projects.length > 0 ? (projects[0].description || "Ongoing construction project") : "Contact your manager to get started."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {projects.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>Overall Completion</span>
                      <span className="text-cyan-600">{stats.progress}%</span>
                    </div>
                    <Progress
                      value={stats.progress}
                      className="h-3 bg-slate-100 [&>div]:bg-cyan-500"
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-slate-700">Recent Updates</h4>
                      <span className="text-xs text-slate-500">Last 7 days</span>
                    </div>
                    <div className="space-y-2">
                      {/* We can show recent tasks here later, for now just a summary text */}
                      <p className="text-sm text-slate-600">
                        You have {stats.totalTasks - stats.completedTasks} active tasks.

                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <Briefcase className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p>No project found linked to your account.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>Updates from your manager</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientRequests />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 
                  TODO: Implement /api/documents endpoint to fetch real documents.
                  For now we show a link to the documents page.
                */}
              <div className="text-center py-6">
                <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">View your project documents</p>
              </div>
              <Link href="/dashboard/documents">
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-blue-600 hover:bg-blue-50"
                >
                  View All Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
