/**
 * Estimator utility functions for cost calculations
 */

export interface Material {
  id: string;
  name: string;
  unitCost: number;
  quantity: number;
}

export interface EstimatorState {
  sqft: number;
  laborCost: number;
  autoLabor: boolean; // Toggle for auto calculation
  laborRate: number; // Rate per sqft
  laborCount: number; // Number of workers
  profitMargin: number;
  baseRate: number; // cost per sqft
  projectDurationDays: number; // Duration in days for labor calc
  bedroomCount: number;
  livingRoomCount: number;
  kitchenCount: number;
  bathroomCount: number;
  floors: number;
  materials: Material[];
}

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
 */
export function calculateEstimate(state: EstimatorState): EstimationResult {
  const totalMaterialCost = calculateTotalMaterialCost(state.materials);
  const sqftCost = state.sqft * state.baseRate;
  const baseCost = sqftCost + state.laborCost + totalMaterialCost;

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
 */
export function validateEstimator(state: EstimatorState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (state.sqft <= 0) {
    errors.push('Square feet must be greater than 0');
  }

  if (state.laborCost < 0) {
    errors.push('Labor cost cannot be negative');
  }

  if (state.profitMargin < 0 || state.profitMargin > 100) {
    errors.push('Profit margin must be between 0 and 100');
  }

  if (state.baseRate < 0) {
    errors.push('Base rate cannot be negative');
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
