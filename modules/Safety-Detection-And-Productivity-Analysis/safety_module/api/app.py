from __future__ import annotations

from pathlib import Path

from flask import Flask
from flask_cors import CORS

from ..engine import AnalysisEngine
from .routes import register_routes


def create_app(
    *,
    engine: AnalysisEngine | None = None,
    project_root: str | Path | None = None,
    runtime_dir: str | Path | None = None,
    uploads_dir: str | Path | None = None,
    results_dir: str | Path | None = None,
    ultralytics_dir: str | Path | None = None,
    model_path: str | Path | None = None,
    allowed_origins: str = "*",
) -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": allowed_origins}})

    resolved_engine = engine or AnalysisEngine(
        project_root=project_root,
        runtime_dir=runtime_dir,
        uploads_dir=uploads_dir,
        results_dir=results_dir,
        ultralytics_dir=ultralytics_dir,
        model_path=model_path,
    )
    register_routes(app, resolved_engine)
    return app
