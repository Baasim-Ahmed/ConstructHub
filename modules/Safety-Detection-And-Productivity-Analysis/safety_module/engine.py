from __future__ import annotations

import os
from collections import defaultdict
from pathlib import Path
from time import time

import cv2
import mediapipe as mp

from .pose_metrics import build_summary, calculate_angle, normalize_detection_label
from .schemas import AnalysisRequest, AnalysisResult
from .settings import ModulePaths, build_module_paths
from .video_io import is_url, prepare_video_source


class AnalysisEngine:
    def __init__(
        self,
        *,
        project_root: str | Path | None = None,
        runtime_dir: str | Path | None = None,
        uploads_dir: str | Path | None = None,
        results_dir: str | Path | None = None,
        ultralytics_dir: str | Path | None = None,
        model_path: str | Path | None = None,
    ) -> None:
        self.paths: ModulePaths = build_module_paths(
            project_root=project_root,
            runtime_dir=runtime_dir,
            uploads_dir=uploads_dir,
            results_dir=results_dir,
            ultralytics_dir=ultralytics_dir,
            model_path=model_path,
        )
        self.paths.ensure_directories()
        os.environ.setdefault("YOLO_CONFIG_DIR", str(self.paths.ultralytics_dir))

        from ultralytics import YOLO

        self.model = YOLO(str(self.paths.model_path))
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils

    @property
    def model_names(self) -> dict[int, str]:
        return self.model.names

    def analyze(self, request: AnalysisRequest) -> AnalysisResult:
        source_path = prepare_video_source(request, self.paths.uploads_dir)

        cap = cv2.VideoCapture(str(source_path))
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video source: {source_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 10
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        output_name = f"result_{int(time())}.mp4"
        output_path = self.paths.results_dir / output_name
        writer = cv2.VideoWriter(
            str(output_path),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (width, height),
        )

        if not writer.isOpened():
            cap.release()
            raise RuntimeError(f"Could not create output video: {output_path}")

        labels: list[str] = []
        detection_confidences: list[float] = []
        left_arm_angles: list[float] = []
        right_arm_angles: list[float] = []
        left_shoulder_angles: list[float] = []
        right_shoulder_angles: list[float] = []
        counter = 0
        right_stage: str | None = None
        frame_count = 0
        detection_totals: dict[str, int] = defaultdict(int)
        peak_counts: dict[str, int] = defaultdict(int)

        with self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ) as pose:
            while True:
                ok, frame = cap.read()
                if not ok or frame is None:
                    break

                frame_count += 1
                detections = self.model.predict(frame, conf=0.3, verbose=False)[0]
                annotated = detections.plot()
                frame_label_counts: dict[str, int] = defaultdict(int)

                for box in detections.boxes:
                    cls_id = int(box.cls[0])
                    label = normalize_detection_label(self.model.names.get(cls_id, str(cls_id)))
                    labels.append(label)
                    detection_confidences.append(float(box.conf[0]))
                    frame_label_counts[label] += 1
                    detection_totals[label] += 1

                for label, count in frame_label_counts.items():
                    peak_counts[label] = max(peak_counts[label], count)

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pose_results = pose.process(rgb)
                if pose_results.pose_landmarks:
                    landmarks = pose_results.pose_landmarks.landmark

                    left_shoulder = [
                        landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y,
                    ]
                    left_elbow = [
                        landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                        landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].y,
                    ]
                    left_wrist = [
                        landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                        landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].y,
                    ]
                    left_hip = [
                        landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].x,
                        landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].y,
                    ]
                    right_shoulder = [
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y,
                    ]
                    right_elbow = [
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW.value].y,
                    ]
                    right_wrist = [
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].y,
                    ]
                    right_hip = [
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP.value].y,
                    ]

                    left_arm_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
                    right_arm_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
                    left_shoulder_angle = calculate_angle(left_elbow, left_shoulder, left_hip)
                    right_shoulder_angle = calculate_angle(right_elbow, right_shoulder, right_hip)

                    left_arm_angles.append(left_arm_angle)
                    right_arm_angles.append(right_arm_angle)
                    left_shoulder_angles.append(left_shoulder_angle)
                    right_shoulder_angles.append(right_shoulder_angle)

                    if right_arm_angle > 130:
                        right_stage = "forward"
                    elif right_arm_angle <= 130 and right_stage == "forward":
                        right_stage = "backward"
                        counter += 1

                    self.mp_drawing.draw_landmarks(
                        annotated,
                        pose_results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS,
                        self.mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
                        self.mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2),
                    )

                cv2.putText(
                    annotated,
                    f"Count: {counter}",
                    (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.5,
                    (255, 255, 255),
                    2,
                    cv2.LINE_AA,
                )
                writer.write(annotated)

        cap.release()
        writer.release()

        duration = frame_count / fps if fps else 0.0
        threshold = counter / duration if duration else 0.0
        compatibility_confidences = detection_confidences or list(right_arm_angles)
        average_counts = {
            label: round(total / frame_count, 4) if frame_count else 0.0
            for label, total in detection_totals.items()
        }

        return AnalysisResult(
            result_video_path=output_path,
            result_video_name=output_name,
            labels=labels,
            confidence_scores=compatibility_confidences,
            left_arm_angles=left_arm_angles,
            right_arm_angles=right_arm_angles,
            left_shoulder_angles=left_shoulder_angles,
            right_shoulder_angles=right_shoulder_angles,
            counter=counter,
            threshold=threshold,
            frame_count=frame_count,
            fps=float(fps),
            duration_seconds=duration,
            detection_totals=dict(detection_totals),
            peak_counts=dict(peak_counts),
            average_counts=average_counts,
            summary=build_summary(labels, threshold),
            job_id=request.job_id,
        )


def analyze_video(
    *,
    source: str | Path | None = None,
    video_url: str | None = None,
    video_path: str | None = None,
    job_id: str | None = None,
    engine: AnalysisEngine | None = None,
    project_root: str | Path | None = None,
    runtime_dir: str | Path | None = None,
    uploads_dir: str | Path | None = None,
    results_dir: str | Path | None = None,
    ultralytics_dir: str | Path | None = None,
    model_path: str | Path | None = None,
) -> AnalysisResult:
    if source is not None and not video_url and not video_path:
        source_text = str(source)
        if is_url(source_text):
            video_url = source_text
        else:
            video_path = source_text

    request = AnalysisRequest(video_url=video_url, video_path=video_path, job_id=job_id)
    request.validate()

    resolved_engine = engine or AnalysisEngine(
        project_root=project_root,
        runtime_dir=runtime_dir,
        uploads_dir=uploads_dir,
        results_dir=results_dir,
        ultralytics_dir=ultralytics_dir,
        model_path=model_path,
    )
    return resolved_engine.analyze(request)
