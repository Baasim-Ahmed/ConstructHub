import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MODULE_BUILD_ROOT = path.join(
  process.cwd(),
  "modules",
  "Safety-Detection-And-Productivity-Analysis",
  "build"
);
const PUBLIC_BUILD_ROOT = path.join(
  process.cwd(),
  "public",
  "safety-detection",
  "app"
);

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveSafePath(root: string, assetSegments: string[] | undefined) {
  const relativeAssetPath = assetSegments?.length ? assetSegments.join("/") : "index.html";
  const resolvedPath = path.resolve(root, relativeAssetPath);
  const relativeToBuild = path.relative(root, resolvedPath);

  if (relativeToBuild.startsWith("..") || path.isAbsolute(relativeToBuild)) {
    return null;
  }

  return resolvedPath;
}

async function fileExists(filePath: string) {
  try {
    const fileStats = await stat(filePath);
    return fileStats.isFile();
  } catch {
    return false;
  }
}

async function serveFile(filePath: string) {
  const body = await readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();

  return new NextResponse(body, {
    headers: {
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=31536000, immutable",
      "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ asset?: string[] }> }
) {
  const { asset } = await context.params;
  const candidateRoots = [PUBLIC_BUILD_ROOT, MODULE_BUILD_ROOT];

  for (const root of candidateRoots) {
    const candidatePath = resolveSafePath(root, asset);
    if (!candidatePath) {
      return NextResponse.json({ error: "Invalid asset path." }, { status: 400 });
    }

    if (await fileExists(candidatePath)) {
      return serveFile(candidatePath);
    }

    const indexPath = path.join(root, "index.html");
    if (await fileExists(indexPath)) {
      return serveFile(indexPath);
    }
  }

  return NextResponse.json(
    {
      error: "Safety Detection frontend build is missing.",
      detail: "The deployment did not generate the Safety Detection static bundle for this route.",
    },
    { status: 503 }
  );
}
