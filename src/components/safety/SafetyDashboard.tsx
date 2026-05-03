"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, HardHat, ShieldAlert, ShieldCheck, Shirt } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";


export type SafetyAiResults = {
  success: boolean;
  safety_score: number;
  details: {
    hardhats: number;
    vests: number;
    workers: number;
  };
  error?: string | null;
};

export type CloudinaryUploadSuccessResult = {
  event?: string;
  info?: {
    secure_url?: string;
  } | string;
};

type SafetyDashboardProps = {
  aiResults: SafetyAiResults | null;
  isLoading: boolean;
  error: string | null;
  uploadedVideoUrl?: string | null;
};

function getSafetyTone(score: number) {
  if (score >= 85) {
    return {
      badgeClassName: "border-chart-2/25 bg-chart-2/12 text-chart-2",
      label: "Site is trending safe",
      progressClassName: "[&>div]:bg-chart-2",
    };
  }

  if (score >= 60) {
    return {
      badgeClassName: "border-primary/20 bg-primary/10 text-primary",
      label: "Needs supervisor review",
      progressClassName: "[&>div]:bg-primary",
    };
  }

  return {
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
    label: "Immediate action recommended",
    progressClassName: "[&>div]:bg-destructive",
  };
}

export function SafetyDashboard({
  aiResults,
  isLoading,
  error,
  uploadedVideoUrl,
}: SafetyDashboardProps) {
  const lastToastMessageRef = useRef<string | null>(null);
  const resultError = aiResults?.success === false ? aiResults.error ?? null : null;
  const hasSuccessfulResults = aiResults?.success === true;
  const hardhats = hasSuccessfulResults ? aiResults.details.hardhats : 0;
  const vests = hasSuccessfulResults ? aiResults.details.vests : 0;
  const workers = hasSuccessfulResults ? aiResults.details.workers : 0;
  const violations = Math.max(workers - Math.min(hardhats, vests), 0);
  const safetyScore = hasSuccessfulResults ? aiResults.safety_score : 0;
  const tone = getSafetyTone(safetyScore);

  useEffect(() => {
    if (resultError && lastToastMessageRef.current !== resultError) {
      toast.error(resultError);
      lastToastMessageRef.current = resultError;
      return;
    }

    if (!resultError) {
      lastToastMessageRef.current = null;
    }
  }, [resultError]);
  const summaryCards = [
    {
      title: "Hardhats",
      value: hardhats,
      subtitle: "Detected compliant helmets",
      icon: HardHat,
      badgeClassName: "border-chart-2/25 bg-chart-2/12 text-chart-2",
      iconWrapClassName: "bg-chart-2/12 text-chart-2 ring-1 ring-chart-2/15",
    },
    {
      title: "Vests",
      value: vests,
      subtitle: "Detected safety vests",
      icon: Shirt,
      badgeClassName: "border-primary/20 bg-primary/10 text-primary",
      iconWrapClassName: "bg-primary/10 text-primary ring-1 ring-primary/15",
    },
    {
      title: "Violations",
      value: violations,
      subtitle: "Workers missing required PPE",
      icon: ShieldAlert,
      badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
      iconWrapClassName: "bg-destructive/10 text-destructive ring-1 ring-destructive/15",
    },
    {
      title: "Workers",
      value: workers,
      subtitle: "Detected workers on-site",
      icon: ShieldCheck,
      badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
      iconWrapClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {error ? (
        <Card className="border border-rose-200 bg-white shadow-sm">
          <CardContent className="flex items-start gap-3 pt-6">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-4 w-4 shrink-0 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">AI processing failed</p>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden rounded-xl border-none bg-white shadow-sm">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-3xl tracking-tight text-slate-900">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600 ring-1 ring-blue-100">
                <ShieldCheck className="h-6 w-6 stroke-[1.8]" />
              </div>
              Safety Score
            </CardTitle>
            <CardDescription className="text-slate-500">
              A fast compliance snapshot from your FastAPI detection summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoading ? (
              <div className="space-y-5">
                <Skeleton className="h-16 w-40 bg-slate-100" />
                <Skeleton className="h-3 w-full bg-slate-100" />
                <Skeleton className="h-24 w-full bg-slate-100" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-6xl font-black tracking-tight text-slate-900">
                      {hasSuccessfulResults ? `${safetyScore.toFixed(2)}%` : "--"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {hasSuccessfulResults
                        ? "Calculated from hardhat compliance across analyzed frames."
                        : "Upload a video to calculate a score."}
                    </p>
                  </div>
                  <Badge
                    className={
                      hasSuccessfulResults
                        ? tone.badgeClassName
                        : "border-slate-200 bg-slate-100 text-slate-700"
                    }
                  >
                    {hasSuccessfulResults ? tone.label : "Awaiting analysis"}
                  </Badge>
                </div>

                <Progress className={`h-3 bg-slate-100 ${tone.progressClassName}`} value={safetyScore} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-500">Video Source</p>
                    <p className="mt-3 truncate text-sm text-slate-900">
                      {uploadedVideoUrl ?? "No Cloudinary video uploaded yet"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-500">Workers Detected</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">
                      {hasSuccessfulResults ? `${workers}` : "0"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Peak worker count returned by the FastAPI analysis.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Uploaded Video</CardTitle>
            <CardDescription className="text-slate-500">
              Cloudinary secure URL preview for the clip sent to FastAPI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedVideoUrl ? (
              <video
                className="aspect-video w-full rounded-xl border border-slate-200 bg-slate-100 object-cover shadow-sm"
                controls
                src={uploadedVideoUrl}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
                Upload a safety video to preview it here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-none bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Detection Summary</CardTitle>
          <CardDescription className="text-slate-500">
            The dashboard highlights the key counts returned by FastAPI: Hardhats, Vests, and Workers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-6 shadow-sm"
                >
                  <Skeleton className="mb-4 h-10 w-10 rounded-xl bg-slate-100" />
                  <Skeleton className="mb-2 h-4 w-24 bg-slate-100" />
                  <Skeleton className="mb-3 h-10 w-16 bg-slate-100" />
                  <Skeleton className="h-3 w-full bg-slate-100" />
                </div>
              ))
            : summaryCards.map((item) => (
                <Card
                  key={item.title}
                  className="rounded-xl border-none bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`rounded-xl p-3 ${item.iconWrapClassName}`}>
                        <item.icon className="h-5 w-5 stroke-[1.8]" />
                      </div>
                      <Badge className={item.badgeClassName}>{item.title}</Badge>
                    </div>
                    <p className="mt-5 text-4xl font-bold tracking-tight text-slate-900">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
                  </CardContent>
                </Card>
              ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-xl border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Compliance Breakdown</CardTitle>
            <CardDescription className="text-slate-500">
              Compare worker counts against PPE detections to spot compliance gaps quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full bg-slate-100" />
                <Skeleton className="h-16 w-full bg-slate-100" />
              </>
            ) : (
              <>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
                <div>
                    <p className="font-medium text-slate-900">Hardhats Count</p>
                    <p className="text-sm text-slate-500">Peak hardhat detections from the response.</p>
                  </div>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-600">{hardhats}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-900">Vests Count</p>
                    <p className="text-sm text-slate-500">Peak safety vest detections from the response.</p>
                  </div>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-600">{vests}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-900">Workers Count</p>
                    <p className="text-sm text-slate-500">Peak worker detections from the response.</p>
                  </div>
                  <Badge className="border-slate-200 bg-slate-100 text-slate-700">{workers}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Processing Status</CardTitle>
            <CardDescription className="text-slate-500">
              Current state of the Safety page to FastAPI analysis loop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-5 text-slate-900 shadow-sm">
                <div className="h-10 w-10 rounded-full border border-blue-200 bg-white p-2">
                  <div className="h-full w-full animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
                <div>
                  <p className="font-semibold">Processing AI...</p>
                  <p className="text-sm text-slate-500">
                    FastAPI is analyzing the uploaded Cloudinary video now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">State</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {hasSuccessfulResults ? "Analysis complete" : "Ready for upload"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {hasSuccessfulResults
                    ? "The latest results are shown above and are based on the Cloudinary secure URL returned by the widget."
                    : "Launch the upload widget from the page header to start the pipeline."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
