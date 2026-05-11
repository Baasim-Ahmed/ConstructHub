const STORAGE_KEY = "resData";

const LABEL_ALIASES = {
  hardhat: "hard hat",
  "hard hat": "hard hat",
  helmet: "hard hat",
  vest: "safety vest",
  "safety vest": "safety vest",
  glove: "gloves",
  gloves: "gloves",
  mask: "mask",
  worker: "worker",
  carrying: "carrying",
  hammering: "hammering",
};

const PIE_COLORS = {
  "hard hat": "hsl(104, 70%, 50%)",
  "safety vest": "hsl(162, 70%, 50%)",
  gloves: "hsl(42, 95%, 55%)",
  mask: "hsl(204, 70%, 50%)",
  worker: "hsl(278, 70%, 50%)",
  carrying: "hsl(18, 85%, 56%)",
  hammering: "hsl(334, 72%, 55%)",
  "needs attention": "hsl(8, 80%, 56%)",
  "remaining target": "hsl(214, 20%, 45%)",
  slow: "hsl(18, 85%, 56%)",
  good: "hsl(162, 70%, 50%)",
  high: "hsl(104, 70%, 50%)",
};

function toNumericArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "number" && Number.isFinite(item));
}

function toNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeLabel(label) {
  if (typeof label !== "string") {
    return null;
  }

  return LABEL_ALIASES[label.trim().toLowerCase()] ?? label.trim().toLowerCase();
}

function getPayloadCandidate(parsed) {
  if (parsed && typeof parsed === "object" && parsed.data && typeof parsed.data === "object") {
    return parsed.data;
  }

  if (parsed && typeof parsed === "object") {
    return parsed;
  }

  return null;
}

export function readStoredAnalysis() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const payload = getPayloadCandidate(parsed);

    if (!payload) {
      return null;
    }

    const hasExactMetrics =
      payload.frame_count !== undefined ||
      payload.duration_seconds !== undefined ||
      payload.peak_counts !== undefined;
    if (!hasExactMetrics) {
      return null;
    }

    const threshold = toNumber(payload.threshold);
    const productivityBand =
      payload?.summary?.productivity_band ||
      (threshold < 0.2 ? "slow" : threshold < 0.8 ? "good" : "high");

    return {
      labels: Array.isArray(payload.labels) ? payload.labels : [],
      confidenceScores: toNumericArray(payload.confidence_scores || payload.confidenceScores),
      leftArmAngles: toNumericArray(payload.left_arm_angles || payload.LeftArmArr),
      rightArmAngles: toNumericArray(payload.right_arm_angles || payload.RightArmArr),
      leftShoulderAngles: toNumericArray(
        payload.left_shoulder_angles || payload.LeftShoulderArr
      ),
      rightShoulderAngles: toNumericArray(
        payload.right_shoulder_angles || payload.RightShoulderArr
      ),
      counter: toNumber(payload.counter),
      threshold,
      frameCount: toNumber(payload.frame_count),
      fps: toNumber(payload.fps),
      durationSeconds: toNumber(payload.duration_seconds),
      detectionTotals:
        payload.detection_totals && typeof payload.detection_totals === "object"
          ? payload.detection_totals
          : {},
      peakCounts:
        payload.peak_counts && typeof payload.peak_counts === "object"
          ? payload.peak_counts
          : {},
      averageCounts:
        payload.average_counts && typeof payload.average_counts === "object"
          ? payload.average_counts
          : {},
      resultVideoUrl: payload.result_video_url || payload.videoPath || null,
      productivityBand,
      safetyItemsDetected: Array.isArray(payload?.summary?.safety_items_detected)
        ? payload.summary.safety_items_detected
        : [],
    };
  } catch {
    return null;
  }
}

export function getLabelCounts(labels = []) {
  return labels.reduce((counts, label) => {
    const normalized = normalizeLabel(label);
    if (!normalized) {
      return counts;
    }

    counts[normalized] = (counts[normalized] || 0) + 1;
    return counts;
  }, {});
}

export function getMetricCounts(analysis) {
  if (analysis?.peakCounts && Object.keys(analysis.peakCounts).length) {
    return analysis.peakCounts;
  }

  if (analysis?.detectionTotals && Object.keys(analysis.detectionTotals).length) {
    return analysis.detectionTotals;
  }

  return getLabelCounts(analysis?.labels || []);
}

export function buildDetectionPieData(analysis) {
  const counts = getMetricCounts(analysis);
  const orderedKeys = [
    "hard hat",
    "safety vest",
    "gloves",
    "mask",
    "worker",
    "carrying",
    "hammering",
  ];

  return orderedKeys
    .filter((key) => counts[key] > 0)
    .map((key) => ({
      id: key,
      label: key,
      value: counts[key],
      color: PIE_COLORS[key],
    }));
}

export function buildSafetyStatCards(labels = []) {
  const counts = getMetricCounts(
    Array.isArray(labels) ? { labels } : labels
  );
  const items = [
    { key: "hard hat", title: "Hard Hat" },
    { key: "safety vest", title: "Safety Vest" },
    { key: "worker", title: "Workers" },
    { key: "hammering", title: "Hammering" },
  ];

  const totalTracked =
    items.reduce((sum, item) => sum + (counts[item.key] || 0), 0) || 1;

  return items
    .filter((item) => counts[item.key] > 0)
    .map((item) => ({
      id: item.title,
      value: counts[item.key],
      progress: Math.min(counts[item.key] / totalTracked, 1),
    }));
}

export function buildLineSeries(values = [], id = "Movement", color = "hsl(162, 70%, 50%)") {
  if (!values.length) {
    return [];
  }

  return [
    {
      id,
      color,
      data: values.map((value, index) => ({
        x: `${index + 1}`,
        y: value,
      })),
    },
  ];
}

export function buildProductivityPieData(productivityBand) {
  const score =
    typeof productivityBand === "object"
      ? Math.max(productivityBand.threshold || 0, 0)
      : 0;
  const targetRate = 0.8;

  return [
    {
      id: `actual rate (${score.toFixed(2)} cycles/s)`,
      label: "actual rate",
      value: score || 0.01,
      color: PIE_COLORS[(productivityBand && productivityBand.productivityBand) || "good"] || PIE_COLORS.good,
    },
    {
      id: `benchmark rate (${targetRate.toFixed(2)} cycles/s)`,
      label: "benchmark rate",
      value: targetRate,
      color: PIE_COLORS["remaining target"],
    },
  ];
}

export function buildCountPieData(counter, productivityBand, durationSeconds = 0) {
  const targetRate = 0.8;
  const targetCount = Math.max(Math.round(durationSeconds * targetRate), counter || 0);
  const remaining = Math.max(targetCount - counter, 0);

  return [
    {
      id: `completed cycles (${counter})`,
      label: "completed cycles",
      value: Math.max(counter, 0.01),
      color: PIE_COLORS[productivityBand] || PIE_COLORS.good,
    },
    {
      id: `remaining target (${remaining})`,
      label: "remaining target",
      value: Math.max(remaining, 0.01),
      color: PIE_COLORS["remaining target"],
    },
  ];
}

export function getProductivityCopy(productivityBand) {
  const threshold =
    typeof productivityBand === "object" ? productivityBand.threshold || 0 : 0;
  const band =
    typeof productivityBand === "object"
      ? productivityBand.productivityBand
      : productivityBand;

  if (band === "slow") {
    return {
      performance: "slow",
      time: "delayed",
      progress: Math.min(threshold / 0.8, 1),
    };
  }

  if (band === "good") {
    return {
      performance: "good",
      time: "on schedule",
      progress: Math.min(threshold / 0.8, 1),
    };
  }

  return {
    performance: "high",
    time: "ahead of schedule",
    progress: Math.min(Math.max(threshold / 0.8, 0), 1),
  };
}
