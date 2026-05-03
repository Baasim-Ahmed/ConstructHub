export type DetectedItem = {
  label: string;
  count: number;
  maxConfidence: number;
};

export type SafetyAnalysis = {
  videoPath: string;
  videoFilename: string;
  sourceFilename: string;
  labels: string[];
  detectedItems: DetectedItem[];
  confidenceScores: number[];
  LeftArmArr: number[];
  LeftShoulderArr: [number, number][];
  RightShoulderArr: [number, number][];
  counter: number;
  threshold: number;
  durationSeconds: number;
  dominantLegsState: string;
  performance: string;
  frameCount: number;
  fps: number;
  rightStage: string;
  leftStage: string;
};
