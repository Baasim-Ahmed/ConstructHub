/**
 * Estimator utility functions for cost calculations
 * All measurements are in Square Yards (SqYd)
 * All rates are per Square Yard (per SqYd)
 */

export interface Material {
  id: string;
  name: string;
  unitCost: number;
  quantity: number;
}

/**
 * EstimatorState - All area measurements in Square Yards (SqYd)
 * All rates are per Square Yard (per SqYd)
 */
export interface EstimatorState {
  areaInSqYd: number;               // Total area in Square Yards
  laborCost: number;                // Total labor cost in PKR
  autoLabor: boolean;               // Toggle for auto calculation
  laborRatePerSqYd: number;         // Labor rate per SqYd
  laborCount: number;               // Number of workers
  profitMargin: number;             // Profit margin percentage (0-100)
  ratePerSqYd: number;              // Construction rate per SqYd
  projectDurationDays: number;      // Duration in days for labor calc
  bedroomCount: number;
  livingRoomCount: number;
  kitchenCount: number;
  bathroomCount: number;
  floors: number;
  materials: Material[];
}

/**
 * EstimationResult - All costs in PKR
 */
export interface EstimationResult {
  totalMaterialCost: number;
  baseCost: number;
  profitAmount: number;
  finalCost: number;
  minRange: number;
  maxRange: number;
}

/**
 * Format number to PKR currency format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate total material cost
 */
export function calculateTotalMaterialCost(materials: Material[]): number {
  return materials.reduce((sum, material) => {
    return sum + (material.unitCost * material.quantity);
  }, 0);
}

/**
 * Calculate project estimation
 * Formula: Total Cost = (Area × Rate per SqYd) + Labor + Materials + Profit
 * All calculations in SqYd units
 */
export function calculateEstimate(state: EstimatorState): EstimationResult {
  const totalMaterialCost = calculateTotalMaterialCost(state.materials);
  
  // Base cost calculation: Area (in SqYd) × Rate (per SqYd)
  const structureCost = state.areaInSqYd * state.ratePerSqYd;
  const baseCost = structureCost + state.laborCost + totalMaterialCost;

  const profitAmount = (state.profitMargin / 100) * baseCost;
  const finalCost = baseCost + profitAmount;

  // Calculate range ±10%
  const rangePercentage = 0.1;
  const minRange = finalCost * (1 - rangePercentage);
  const maxRange = finalCost * (1 + rangePercentage);

  return {
    totalMaterialCost,
    baseCost,
    profitAmount,
    finalCost,
    minRange,
    maxRange,
  };
}

/**
 * Validate estimator state
 * Ensures all inputs are valid for SqYd-based calculations
 */
export function validateEstimator(state: EstimatorState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Area validation (in SqYd)
  if (state.areaInSqYd <= 0) {
    errors.push('Area must be greater than 0 SqYd');
  }

  if (state.laborCost < 0) {
    errors.push('Labor cost cannot be negative');
  }

  if (state.profitMargin < 0 || state.profitMargin > 100) {
    errors.push('Profit margin must be between 0 and 100');
  }

  // Rate validation (per SqYd)
  if (state.ratePerSqYd < 0) {
    errors.push('Rate per SqYd cannot be negative');
  }

  if (state.materials.length === 0) {
    errors.push('At least one material must be added');
  }

  for (const material of state.materials) {
    if (!material.name.trim()) {
      errors.push('Material name cannot be empty');
      break;
    }
    if (material.unitCost < 0) {
      errors.push(`${material.name}: Unit cost cannot be negative`);
      break;
    }
    if (material.quantity <= 0) {
      errors.push(`${material.name}: Quantity must be greater than 0`);
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique ID for materials
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
