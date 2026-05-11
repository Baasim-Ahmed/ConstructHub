from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_DIR.parent


@dataclass(slots=True)
class ModulePaths:
    project_root: Path
    runtime_dir: Path
    uploads_dir: Path
    results_dir: Path
    ultralytics_dir: Path
    model_path: Path

    def ensure_directories(self) -> None:
        for directory in (self.runtime_dir, self.uploads_dir, self.results_dir, self.ultralytics_dir):
            directory.mkdir(parents=True, exist_ok=True)


def _default_runtime_dir(project_root: Path) -> Path:
    backend_dir = project_root / "backend"
    if backend_dir.exists():
        return backend_dir
    return project_root / ".safety_module"


def _resolve_model_path(project_root: Path, model_path: str | Path | None) -> Path:
    if model_path is not None:
        candidate = Path(model_path).expanduser().resolve()
        if not candidate.exists():
            raise FileNotFoundError(f"Model file not found: {candidate}")
        return candidate

    env_model_path = os.getenv("SAFETY_MODULE_MODEL_PATH")
    candidates = []
    if env_model_path:
        candidates.append(Path(env_model_path).expanduser())
    candidates.extend(
        [
            project_root / "models" / "FINAL_PT.pt",
            project_root / "FINAL_PT.pt",
        ]
    )

    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.exists():
            return resolved

    raise FileNotFoundError(
        "Could not find FINAL_PT.pt. Set SAFETY_MODULE_MODEL_PATH or place the model "
        "at <project>/models/FINAL_PT.pt or <project>/FINAL_PT.pt."
    )


def build_module_paths(
    *,
    project_root: str | Path | None = None,
    runtime_dir: str | Path | None = None,
    uploads_dir: str | Path | None = None,
    results_dir: str | Path | None = None,
    ultralytics_dir: str | Path | None = None,
    model_path: str | Path | None = None,
) -> ModulePaths:
    resolved_project_root = (
        Path(project_root).expanduser().resolve() if project_root is not None else PROJECT_ROOT
    )

    resolved_runtime_dir = (
        Path(runtime_dir).expanduser().resolve()
        if runtime_dir is not None
        else Path(os.getenv("SAFETY_MODULE_RUNTIME_DIR", _default_runtime_dir(resolved_project_root)))
    )
    resolved_uploads_dir = (
        Path(uploads_dir).expanduser().resolve()
        if uploads_dir is not None
        else Path(os.getenv("SAFETY_MODULE_UPLOADS_DIR", resolved_runtime_dir / "uploads"))
    )
    resolved_results_dir = (
        Path(results_dir).expanduser().resolve()
        if results_dir is not None
        else Path(os.getenv("SAFETY_MODULE_RESULTS_DIR", resolved_runtime_dir / "results"))
    )
    resolved_ultralytics_dir = (
        Path(ultralytics_dir).expanduser().resolve()
        if ultralytics_dir is not None
        else Path(os.getenv("SAFETY_MODULE_YOLO_CONFIG_DIR", resolved_runtime_dir / ".ultralytics"))
    )

    return ModulePaths(
        project_root=resolved_project_root,
        runtime_dir=resolved_runtime_dir,
        uploads_dir=resolved_uploads_dir,
        results_dir=resolved_results_dir,
        ultralytics_dir=resolved_ultralytics_dir,
        model_path=_resolve_model_path(resolved_project_root, model_path),
    )
