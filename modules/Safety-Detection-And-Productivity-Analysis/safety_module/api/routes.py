from __future__ import annotations

from flask import Flask, jsonify, request, send_from_directory, url_for

from ..engine import AnalysisEngine
from ..schemas import AnalysisRequest


def register_routes(app: Flask, engine: AnalysisEngine) -> None:
    @app.get("/")
    def home():
        return jsonify(
            {
                "status": "ok",
                "model": engine.paths.model_path.name,
                "classes": engine.model_names,
            }
        )

    @app.get("/version")
    def version():
        return jsonify({"package": "safety_module", "version": "0.1.0"})

    @app.post("/upload")
    def upload():
        payload = request.get_json(silent=True) or {}
        try:
            analysis_request = AnalysisRequest.from_payload(payload)
            result = engine.analyze(analysis_request)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

        result_video_url = url_for("result_file", filename=result.result_video_name, _external=True)
        return jsonify(result.to_dict(result_video_url=result_video_url, include_legacy_fields=True))

    @app.get("/results/<path:filename>")
    def result_file(filename: str):
        return send_from_directory(engine.paths.results_dir, filename)
