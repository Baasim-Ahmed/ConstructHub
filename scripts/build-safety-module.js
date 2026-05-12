const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = process.cwd();
const moduleRoot = path.join(
  repoRoot,
  "modules",
  "Safety-Detection-And-Productivity-Analysis"
);
const moduleBuildRoot = path.join(moduleRoot, "build");
const publicBuildRoot = path.join(
  repoRoot,
  "public",
  "safety-detection",
  "app"
);
const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}.`);
  }
}

function ensureModuleDependencies() {
  const nodeModulesPath = path.join(moduleRoot, "node_modules");
  if (fs.existsSync(nodeModulesPath)) {
    console.log("[safety-build] Reusing existing module dependencies.");
    return;
  }

  console.log("[safety-build] Installing Safety Detection frontend dependencies...");
  run(npmExecutable, ["install", "--legacy-peer-deps", "--no-fund", "--no-audit"], moduleRoot);
}

function buildModule() {
  console.log("[safety-build] Building Safety Detection frontend...");
  run(npmExecutable, ["run", "build"], moduleRoot);
}

function copyBuildOutput() {
  const indexHtmlPath = path.join(moduleBuildRoot, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`Safety Detection build output is missing: ${indexHtmlPath}`);
  }

  fs.rmSync(publicBuildRoot, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(publicBuildRoot), { recursive: true });
  fs.cpSync(moduleBuildRoot, publicBuildRoot, { recursive: true });
  console.log(`[safety-build] Copied build output to ${publicBuildRoot}`);
}

function main() {
  console.log("[safety-build] Preparing Safety Detection deployment bundle...");
  ensureModuleDependencies();
  buildModule();
  copyBuildOutput();
}

main();
