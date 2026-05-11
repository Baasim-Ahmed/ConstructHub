from __future__ import annotations

from pathlib import Path
from time import time
from urllib.parse import urlparse

import requests

from .schemas import AnalysisRequest


def is_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def infer_video_suffix(source: str) -> str:
    suffix = Path(urlparse(source).path).suffix
    return suffix or ".mp4"


def fetch_remote_video(url: str, destination_dir: Path) -> Path:
    destination_dir.mkdir(parents=True, exist_ok=True)
    suffix = infer_video_suffix(url)
    destination = destination_dir / f"source_{int(time())}{suffix}"

    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        with destination.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    handle.write(chunk)

    return destination


def resolve_local_video_path(video_path: str) -> Path:
    candidate = Path(video_path).expanduser().resolve()
    if not candidate.exists():
        raise FileNotFoundError(f"Video file not found: {candidate}")
    return candidate


def prepare_video_source(request: AnalysisRequest, uploads_dir: Path) -> Path:
    if request.video_url:
        return fetch_remote_video(request.video_url, uploads_dir)
    if request.video_path:
        return resolve_local_video_path(request.video_path)
    raise ValueError("No video source provided.")
