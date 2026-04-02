"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitRequest } from "@/lib/requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getDevRoleFromStorage } from "@/context/DevRoleContext";

type RequestType = "ADD_PROJECT" | "ADD_TASK" | "ADD_DOCUMENT";

interface Project {
  id: string;
  name: string;
}

function SubmitRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [requestType, setRequestType] = useState<RequestType>("ADD_TASK");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    console.log("user role", getDevRoleFromStorage());
    const fetchProjects = async () => {
      try {
        const role = getDevRoleFromStorage();
        const res = await fetch("/api/projects", {
          headers: {
            "x-dev-role": role,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };

    if (requestType === "ADD_TASK" || requestType === "ADD_DOCUMENT") {
      fetchProjects();
    }
  }, [requestType]);

  // Fetch request details if requestId is present (Resubmission Mode)
  useEffect(() => {
    if (requestId) {
      const fetchRequest = async () => {
        try {
          const res = await fetch(`/api/requests/${requestId}`);
          if (res.ok) {
            const data = await res.json();
            setRequestType(data.type as RequestType);
            setFormData(data.payload);
            toast.info("Request data loaded for resubmission");
          } else {
            toast.error("Failed to load request data");
          }
        } catch (error) {
          console.error("Failed to fetch request", error);
          toast.error("Failed to load request data");
        }
      };
      fetchRequest();
    }
  }, [requestId]);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (requestId) {
        // Resubmit logic (PUT)
        const role = getDevRoleFromStorage();
        const userId = `dev-${role.toLowerCase()}`;

        const res = await fetch(`/api/requests/${requestId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-dev-role": role,
            "x-user-id": userId,
          },
          body: JSON.stringify({ payload: formData }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to resubmit request");
        }
        toast.success("Request resubmitted successfully");
      } else {
        // Create new request logic (POST)
        await submitRequest(requestType, formData);
        toast.success("Request submitted successfully");
      }

      setFormData({});
      router.push("/dashboard/requests"); // Redirect to requests page to see the updated status
    } catch (error: any) {
      console.error("Failed to submit request:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Submit a Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="request-type">Request Type</Label>
            <Select
              value={requestType}
              onValueChange={(value) => {
                setRequestType(value as RequestType);
                setFormData({}); // Reset form data on type change
              }}
            >
              <SelectTrigger id="request-type">
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADD_TASK">Add Task</SelectItem>
                <SelectItem value="ADD_PROJECT">Add Project</SelectItem>
                <SelectItem value="ADD_DOCUMENT">Add Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {requestType === "ADD_PROJECT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate || ""}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate || ""}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {requestType === "ADD_TASK" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title || ""}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate || ""}
                    onChange={(e) =>
                      handleInputChange("dueDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select
                    value={formData.projectId || ""}
                    onValueChange={(value) =>
                      handleInputChange("projectId", value)
                    }
                  >
                    <SelectTrigger id="projectId">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {requestType === "ADD_DOCUMENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input
                    id="doc-name"
                    required
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Document URL</Label>
                  <Input
                    id="url"
                    required
                    type="url"
                    value={formData.url || ""}
                    onChange={(e) => handleInputChange("url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select
                    value={formData.projectId || ""}
                    onValueChange={(value) =>
                      handleInputChange("projectId", value)
                    }
                  >
                    <SelectTrigger id="projectId">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubmitRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitRequestContent />
    </Suspense>
  );
}
