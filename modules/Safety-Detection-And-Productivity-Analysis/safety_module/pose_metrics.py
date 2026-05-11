from __future__ import annotations

import math

import numpy as np

from .schemas import AnalysisSummary


SAFETY_LABEL_ALIASES = {
    "hardhat": "hard hat",
    "hard hat": "hard hat",
    "helmet": "hard hat",
    "mask": "mask",
    "glove": "gloves",
    "gloves": "gloves",
    "safety vest": "safety vest",
    "vest": "safety vest",
}


def normalize_detection_label(label: str) -> str:
    normalized = label.strip().lower()
    return SAFETY_LABEL_ALIASES.get(normalized, normalized)


def calculate_angle(a: list[float], b: list[float], c: list[float]) -> float:
    point_a = np.array(a)
    point_b = np.array(b)
    point_c = np.array(c)

    radians = np.arctan2(point_c[1] - point_b[1], point_c[0] - point_b[0]) - np.arctan2(
        point_a[1] - point_b[1], point_a[0] - point_b[0]
    )
    angle = abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360.0 - angle
    return float(angle)


def productivity_band(threshold: float) -> str:
    if threshold < 0.2:
        return "slow"
    if threshold < 0.8:
        return "good"
    return "high"


def summarize_safety_labels(labels: list[str]) -> list[str]:
    detected: list[str] = []
    seen = set()

    for label in labels:
        normalized = SAFETY_LABEL_ALIASES.get(label.strip().lower())
        if normalized and normalized not in seen:
            seen.add(normalized)
            detected.append(normalized)

    return detected


def build_summary(labels: list[str], threshold: float) -> AnalysisSummary:
    return AnalysisSummary(
        productivity_band=productivity_band(threshold),
        safety_items_detected=summarize_safety_labels(labels),
    )
