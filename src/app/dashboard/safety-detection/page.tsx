import Link from "next/link";

export default function SafetyDetectionPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Safety Detection
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">
            Integrated safety analysis module
          </h2>
          <p className="max-w-3xl text-sm text-slate-600">
            This tab loads the copied Safety Detection module with its original UI,
            charts, theme, Cloudinary flow, and local backend integration intact.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            href="/safety-detection/app/"
            rel="noreferrer"
            target="_blank"
          >
            Open module in full screen
          </Link>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 font-medium text-emerald-700">
            Backend target: http://127.0.0.1:5000/upload
          </span>
        </div>
      </div>

      <div className="min-h-[70vh] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <iframe
          allow="camera; microphone"
          className="h-full min-h-[70vh] w-full border-0"
          src="/safety-detection/app/"
          title="Safety Detection Module"
        />
      </div>
    </div>
  );
}
