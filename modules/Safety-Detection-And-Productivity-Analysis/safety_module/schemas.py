from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(slots=True)
class AnalysisRequest:
    video_url: str | None = None
    video_path: str | None = None
    job_id: str | None = None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AnalysisRequest":
        video_url = payload.get("video_url") or payload.get("imageUrl")
        video_path = payload.get("video_path") or payload.get("source_path")
        job_id = payload.get("job_id")

        request = cls(
            video_url=video_url.strip() if isinstance(video_url, str) else None,
            video_path=video_path.strip() if isinstance(video_path, str) else None,
            job_id=job_id.strip() if isinstance(job_id, str) else None,
        )
        request.validate()
        return request

    def validate(self) -> None:
        if not self.video_url and not self.video_path:
            raise ValueError("Either 'video_url' or 'video_path' is required.")


@dataclass(slots=True)
class AnalysisSummary:
    productivity_band: str
    safety_items_detected: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "productivity_band": self.productivity_band,
            "safety_items_detected": list(self.safety_items_detected),
        }


@dataclass(slots=True)
class AnalysisResult:
    result_video_path: Path
    result_video_name: str
    labels: list[str]
    confidence_scores: list[float]
    left_arm_angles: list[float]
    right_arm_angles: list[float]
    left_shoulder_angles: list[float]
    right_shoulder_angles: list[float]
    counter: int
    threshold: float
    frame_count: int
    fps: float
    duration_seconds: float
    detection_totals: dict[str, int]
    peak_counts: dict[str, int]
    average_counts: dict[str, float]
    summary: AnalysisSummary
    job_id: str | None = None

    def to_dict(
        self,
        *,
        result_video_url: str | None = None,
        include_legacy_fields: bool = True,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "job_id": self.job_id,
            "result_video_path": str(self.result_video_path),
            "result_video_name": self.result_video_name,
            "result_video_url": result_video_url,
            "labels": list(self.labels),
            "confidence_scores": list(self.confidence_scores),
            "left_arm_angles": list(self.left_arm_angles),
            "right_arm_angles": list(self.right_arm_angles),
            "left_shoulder_angles": list(self.left_shoulder_angles),
            "right_shoulder_angles": list(self.right_shoulder_angles),
            "counter": self.counter,
            "threshold": self.threshold,
            "frame_count": self.frame_count,
            "fps": self.fps,
            "duration_seconds": self.duration_seconds,
            "detection_totals": dict(self.detection_totals),
            "peak_counts": dict(self.peak_counts),
            "average_counts": dict(self.average_counts),
            "summary": self.summary.to_dict(),
        }

        if include_legacy_fields:
            payload.update(
                {
                    "videoPath": result_video_url or str(self.result_video_path),
                    "confidenceScores": list(self.confidence_scores),
                    "LeftArmArr": list(self.left_arm_angles),
                    "RightArmArr": list(self.right_arm_angles),
                    "LeftShoulderArr": list(self.left_shoulder_angles),
                    "RightShoulderArr": list(self.right_shoulder_angles),
                }
            )

        return payload
