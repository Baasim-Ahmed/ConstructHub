from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any

import cv2
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from ultralytics import YOLO


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("constructhub.ai_service")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "FINAL_PT.pt"
FRAME_SAMPLE_INTERVAL = 5
REQUEST_TIMEOUT_SECONDS = 120

app = FastAPI(title="ConstructHub AI Safety Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if not MODEL_PATH.exists():
    raise RuntimeError(f"YOLO model file not found at {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))
logger.info("Model loaded successfully from %s", MODEL_PATH)


class VideoRequest(BaseModel):
    video_url: HttpUrl


def build_peak_counts() -> dict[str, int]:
    return {"hardhats": 0, "vests": 0, "workers": 0}


def normalize_label(label: str) -> str:
    return label.strip().lower().replace("-", " ").replace("_", " ")


def count_key_for_label(label: str) -> str | None:
    normalized = normalize_label(label)

    if normalized in {"hard hat", "hard hats", "hardhat", "hardhats", "helmet", "helmets"}:
        return "hardhats"
    if normalized in {"safety vest", "safety vests", "vest", "vests"}:
        return "vests"
    if normalized in {"worker", "workers", "person", "people"}:
        return "workers"
    return None


def calculate_safety_score(peak_counts: dict[str, int]) -> float:
    workers = peak_counts["workers"]
    if workers <= 0:
        return 0.0

    hardhat_compliance = min(peak_counts["hardhats"], workers) / workers
    vest_compliance = min(peak_counts["vests"], workers) / workers
    return round(((hardhat_compliance + vest_compliance) / 2) * 100, 2)


def download_video(video_url: str) -> Path:
    suffix = Path(video_url).suffix or ".mp4"

    with requests.get(video_url, stream=True, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    temp_file.write(chunk)

            return Path(temp_file.name)


def analyze_local_video(video_path: Path) -> dict[str, Any]:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open downloaded video file.")

    names = model.names
    peak_counts = build_peak_counts()
    frames_read = 0
    frames_analyzed = 0
    matched_detections = 0

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            frames_read += 1
            if frames_read % FRAME_SAMPLE_INTERVAL != 0:
                continue

            frames_analyzed += 1
            current_frame_counts = build_peak_counts()
            results = model.predict(frame, conf=0.35, verbose=False)

            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue

                for box in boxes:
                    cls_id = int(box.cls[0])
                    if isinstance(names, dict):
                        raw_label = str(names.get(cls_id, ""))
                    else:
                        raw_label = str(names[cls_id]) if 0 <= cls_id < len(names) else ""

                    key = count_key_for_label(raw_label)
                    if key is None:
                        continue

                    current_frame_counts[key] += 1
                    matched_detections += 1

            for key in peak_counts:
                peak_counts[key] = max(peak_counts[key], current_frame_counts[key])
    finally:
        cap.release()

    score = calculate_safety_score(peak_counts)
    diagnostics = {
        "frames_read": frames_read,
        "frames_analyzed": frames_analyzed,
        "matched_detections": matched_detections,
        "video_path": str(video_path),
        "frame_sample_interval": FRAME_SAMPLE_INTERVAL,
    }

    logger.info("Analysis complete: %s | diagnostics=%s", peak_counts, diagnostics)

    return {
        "success": True,
        "safety_score": score,
        "details": peak_counts,
        "diagnostics": diagnostics,
    }


@app.get("/")
def health_check() -> dict[str, Any]:
    return {
        "status": "online",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
    }


@app.post("/analyze")
async def analyze_video(request: VideoRequest) -> dict[str, Any]:
    temporary_video_path: Path | None = None

    try:
        logger.info("Downloading video for analysis from %s", request.video_url)
        temporary_video_path = download_video(str(request.video_url))
        return analyze_local_video(temporary_video_path)
    except HTTPException as error:
        logger.error("Analysis failed with HTTP exception: %s", error.detail)
        return {"success": False, "error": error.detail}
    except requests.RequestException as error:
        logger.exception("Video download failed")
        return {
            "success": False,
            "error": f"Failed to download the uploaded video for analysis: {error}",
        }
    except Exception as error:
        logger.exception("Unexpected analysis error")
        return {"success": False, "error": str(error)}
    finally:
        if temporary_video_path and temporary_video_path.exists():
            try:
                temporary_video_path.unlink()
            except OSError:
                logger.warning("Temporary video cleanup failed for %s", temporary_video_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
