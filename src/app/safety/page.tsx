"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Loader2, Sparkles, UploadCloud } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

import {
  SafetyDashboard,
  type CloudinaryUploadSuccessResult,
  type SafetyAiResults,
} from "@/components/safety/SafetyDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


const AI_ANALYZE_ENDPOINT = "http://localhost:8000/analyze";
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "djmt6sc3a";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "dpnd8j6i";

type AnalyzeApiPayload = {
  success?: boolean;
  detail?: string;
  error?: string;
  safety_score?: number;
  details?: {
    hardhats?: number;
    vests?: number;
    workers?: number;
  };
  summary?: {
    Hardhat?: number;
    "Safety Vest"?: number;
    Worker?: number;
  };
};

function getSecureUrl(result: CloudinaryUploadSuccessResult): string | null {
  if (typeof result.info === "object" && result.info?.secure_url) {
    return result.info.secure_url;
  }

  return null;
}

function normalizeAiResults(payload: AnalyzeApiPayload): SafetyAiResults {
  return {
    success: payload.success ?? true,
    safety_score: payload.safety_score ?? 0,
    details: {
      hardhats: payload.details?.hardhats ?? payload.summary?.Hardhat ?? 0,
      vests: payload.details?.vests ?? payload.summary?.["Safety Vest"] ?? 0,
      workers: payload.details?.workers ?? payload.summary?.Worker ?? 0,
    },
    error: payload.error ?? payload.detail ?? null,
  };
}

export default function SafetyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<SafetyAiResults | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  async function handleUploadSuccess(result: CloudinaryUploadSuccessResult) {
    const secureUrl = getSecureUrl(result);

    if (!secureUrl) {
      setError("Cloudinary upload completed, but no secure video URL was returned.");
      return;
    }

    setUploadedVideoUrl(secureUrl);
    setIsLoading(true);
    setError(null);
    setAiResults(null);

    try {
      const response = await fetch(AI_ANALYZE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: secureUrl }),
      });

      let payload: AnalyzeApiPayload | null = null;

      try {
        payload = (await response.json()) as AnalyzeApiPayload;
      } catch {
        const fallbackText = await response.text();
        throw new Error(fallbackText || "The AI service returned an unreadable response.");
      }

      const normalizedResults = normalizeAiResults(payload);
      setAiResults(normalizedResults);

      if (!response.ok || normalizedResults.success === false) {
        setError(normalizedResults.error || "The AI service could not process the uploaded video.");
        return;
      }

      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect the Safety page to the FastAPI backend."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <Card className="border-none bg-white shadow-md">
              <CardHeader className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    <Sparkles className="h-3.5 w-3.5 stroke-[1.8]" />
                    Safety AI Pipeline
                  </div>
                  <CardTitle className="text-3xl tracking-tight text-slate-900">
                    Upload to Cloudinary, analyze with FastAPI
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-slate-500">
                    The Safety route now sends Cloudinary video URLs straight into the FastAPI detector at `http://localhost:8000/analyze`, then streams the returned metrics into the dashboard below.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                    Cloud: {CLOUDINARY_CLOUD_NAME}
                  </Badge>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    Endpoint: {AI_ANALYZE_ENDPOINT}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 border-t border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Step 1</p>
                  <p className="text-lg font-semibold text-slate-900">Launch the Cloudinary upload widget</p>
                  <p className="text-sm text-slate-500">
                    After a successful upload, the page immediately posts `{`{"video_url": "secure_url"}`}` to FastAPI.
                  </p>
                </div>

                <CldUploadWidget
                  cloudName={CLOUDINARY_CLOUD_NAME}
                  onSuccess={(result) => {
                    void handleUploadSuccess(result as CloudinaryUploadSuccessResult);
                  }}
                  options={{
                    maxFiles: 1,
                    multiple: false,
                    resourceType: "video",
                    clientAllowedFormats: ["mp4", "mov", "avi", "mkv"],
                    sources: ["local", "camera", "google_drive"],
                  }}
                  uploadPreset={CLOUDINARY_UPLOAD_PRESET}
                >
                  {({ open }) => (
                    <Button
                      className="rounded-full bg-blue-600 px-6 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                      disabled={isLoading}
                      onClick={() => open()}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin stroke-[1.8]" />
                          Processing AI...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4 stroke-[1.8]" />
                          Upload Safety Video
                        </>
                      )}
                    </Button>
                  )}
                </CldUploadWidget>
              </CardContent>
            </Card>

            <SafetyDashboard
              aiResults={aiResults}
              error={error}
              isLoading={isLoading}
              uploadedVideoUrl={uploadedVideoUrl}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
