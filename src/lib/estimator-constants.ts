/**
 * Estimator Constants & Configuration
 * All measurements standardized to Square Yards (SqYd)
 */

// ─────────────────────────────────────
// Unit Conversion
// ─────────────────────────────────────
export const UNIT_CONVERSION = {
  SQ_FT_PER_SQ_YD: 9,
  SQ_YD_PER_SQ_FT: 1 / 9,
};

/**
 * Convert Square Feet to Square Yards
 * Formula: SqYd = SqFt / 9
 * @param sqFt - Area in square feet
 * @returns Area in square yards
 */
export function convertSqFtToSqYd(sqFt: number): number {
  if (sqFt < 0) return 0;
  return sqFt / UNIT_CONVERSION.SQ_FT_PER_SQ_YD;
}

/**
 * Convert Square Yards to Square Feet
 * Formula: SqFt = SqYd * 9
 * @param sqYd - Area in square yards
 * @returns Area in square feet
 */
export function convertSqYdToSqFt(sqYd: number): number {
  if (sqYd < 0) return 0;
  return sqYd * UNIT_CONVERSION.SQ_FT_PER_SQ_YD;
}

// ─────────────────────────────────────
// Market-Based Default Rates (Per SqYd)
// Based on Pakistani construction market standards
// ─────────────────────────────────────
export const DEFAULT_RATES = {
  // Grey Structure (Foundation + Walls + Roof)
  GREY_STRUCTURE_BUDGET: 3000,          // Budget rate per SqYd
  GREY_STRUCTURE_STANDARD: 4500,        // Standard rate per SqYd
  GREY_STRUCTURE_PREMIUM: 6000,         // Premium rate per SqYd

  // Finishing (Paint, Flooring, Walls)
  FINISHING_BUDGET: 1500,               // Budget finishing per SqYd
  FINISHING_STANDARD: 3000,             // Standard finishing per SqYd
  FINISHING_PREMIUM: 5000,              // Premium finishing per SqYd

  // Labor Costs (Per SqYd, for entire project)
  LABOR_COST_BUDGET: 500,               // Budget labor per SqYd
  LABOR_COST_STANDARD: 1000,            // Standard labor per SqYd
  LABOR_COST_PREMIUM: 1500,             // Premium labor per SqYd

  // Commercial & Specialized
  COMMERCIAL_GREY_STRUCTURE: 4500,      // Commercial grey structure per SqYd
  COMMERCIAL_FINISHING: 3500,           // Commercial finishing per SqYd
};

/**
 * Project Type Presets with realistic rates per SqYd
 */
export const PROJECT_TYPE_PRESETS = {
  GREY_STRUCTURE_BUDGET: {
    name: "Grey Structure (Budget)",
    ratePerSqYd: DEFAULT_RATES.GREY_STRUCTURE_BUDGET,
    profitMargin: 15,
    description: "Basic grey structure without finishing",
  },
  GREY_STRUCTURE_STANDARD: {
    name: "Grey Structure (Standard)",
    ratePerSqYd: DEFAULT_RATES.GREY_STRUCTURE_STANDARD,
    profitMargin: 18,
    description: "Standard grey structure quality",
  },
  GREY_STRUCTURE_PREMIUM: {
    name: "Grey Structure (Premium)",
    ratePerSqYd: DEFAULT_RATES.GREY_STRUCTURE_PREMIUM,
    profitMargin: 20,
    description: "High-quality grey structure",
  },
  FINISHING_BUDGET: {
    name: "Budget Finishing",
    ratePerSqYd: DEFAULT_RATES.FINISHING_BUDGET,
    profitMargin: 15,
    description: "Basic finishing work",
  },
  FINISHING_STANDARD: {
    name: "Standard Finishing",
    ratePerSqYd: DEFAULT_RATES.FINISHING_STANDARD,
    profitMargin: 20,
    description: "Standard finishing quality",
  },
  FINISHING_PREMIUM: {
    name: "Premium Finishing",
    ratePerSqYd: DEFAULT_RATES.FINISHING_PREMIUM,
    profitMargin: 25,
    description: "High-end finishing work",
  },
  COMMERCIAL_GREY_STRUCTURE: {
    name: "Commercial (Grey Structure)",
    ratePerSqYd: DEFAULT_RATES.COMMERCIAL_GREY_STRUCTURE,
    profitMargin: 22,
    description: "Commercial building grey structure",
  },
};

// ─────────────────────────────────────
// Validation Constants
// ─────────────────────────────────────
export const VALIDATION = {
  MIN_AREA_SQ_YD: 0.1,
  MAX_AREA_SQ_YD: 10000,
  MIN_RATE_PER_SQ_YD: 0,
  MAX_RATE_PER_SQ_YD: 100000,
  MIN_PROFIT_MARGIN: 0,
  MAX_PROFIT_MARGIN: 100,
  MIN_LABOR_COST: 0,
  MAX_LABOR_COST: 50000000,
  MIN_MATERIAL_QUANTITY: 0.01,
  MAX_MATERIAL_QUANTITY: 100000,
};

// ─────────────────────────────────────
// UI/Display Constants
// ─────────────────────────────────────
export const UNIT_LABELS = {
  AREA: "SqYd",
  AREA_FULL: "Square Yards",
  RATE: "per SqYd",
};

/**
 * Format area value for display
 * @param sqYd - Area in square yards
 * @returns Formatted string with unit
 */
export function formatArea(sqYd: number): string {
  return `${sqYd.toFixed(2)} ${UNIT_LABELS.AREA}`;
}

/**
 * Format rate value for display
 * @param rate - Rate per square yard
 * @returns Formatted string with unit
 */
export function formatRate(rate: number): string {
  return `Rs. ${rate.toFixed(0)} ${UNIT_LABELS.RATE}`;
}
