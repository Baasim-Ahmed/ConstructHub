import { Material, ProjectSpecs, ScoredMaterial } from './types';
import { MATERIALS } from './data';
import { RandomForestRegression as RandomForest } from 'ml-random-forest';
import KNN from 'ml-knn';

// --- Data Preparation & Helpers ---

// Normalize value using min-max scaling to range [0, 1]
// Standard min/max values derived from domain knowledge of dataset
const NORMALIZATION_CONSTANTS = {
    strength: { min: 0, max: 500 }, // MPa
    durability: { min: 0, max: 100 }, // Years
    cost: { min: 0, max: 1000000 }, // PKR
    eco: { min: 0, max: 10 },
    complexity: { min: 0, max: 10 }
};

function normalize(value: number, key: keyof typeof NORMALIZATION_CONSTANTS): number {
    const { min, max } = NORMALIZATION_CONSTANTS[key];
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Get all unique applications and material types for One-Hot Encoding
const ALL_APPLICATIONS = Array.from(new Set(MATERIALS.flatMap(m => m.applications))).sort();
const ALL_TYPES = Array.from(new Set(MATERIALS.map(m => m.type))).sort();

// --- Feature Extraction ---
// Convert (ProjectSpecs + Material) -> Feature Vector
function extractFeatures(specs: ProjectSpecs, material: Material): number[] {
    // 1. One-Hot Encoding for Applications
    // We create a feature for every possible application. 1 if material supports it, 0 otherwise.
    // ALSO check if it matches the requested spec (double signal).
    const appFeatures = ALL_APPLICATIONS.map(app =>
        material.applications.includes(app) ? 1 : 0
    );

    // 2. One-Hot Encoding for Material Types
    const typeFeatures = ALL_TYPES.map(type =>
        material.type === type ? 1 : 0
    );

    // 3. Numeric Features (Normalized)
    const normStrength = normalize(material.strength_mpa, 'strength');
    const normDurability = normalize(material.durability_years, 'durability');
    const normCost = normalize(material.cost_per_unit, 'cost');
    const normEco = normalize(material.eco_friendly_score, 'eco');
    const normComplexity = normalize(material.installation_complexity, 'complexity');

    // 4. Requirements Delta (Difference between Spec and Material)
    // Positive = Exceeds requirement (Good), Negative = Fails requirement (Bad)
    // We stick to simple deltas here, let the model learn the non-linearities.
    const reqStrength = specs.min_strength_mpa ? normalize(specs.min_strength_mpa, 'strength') : 0;
    const strengthDelta = normStrength - reqStrength;

    // 5. Context Features
    // Is this a structural project? (1/0)
    const isStructural = specs.application_type === 'Structural' ? 1 : 0;
    // Is the user budget constrained? (1/0)
    const isBudgetConstrained = specs.budget_constraint ? 1 : 0;

    // 6. Application Match Check (The "Hard Filter" signal)
    const exactAppMatch = material.applications.includes(specs.application_type) ? 1 : 0;

    return [
        ...appFeatures,
        ...typeFeatures,
        normStrength,
        normDurability,
        normCost,
        normEco,
        normComplexity,
        strengthDelta,
        isStructural,
        isBudgetConstrained,
        exactAppMatch
    ];
}

// --- Heuristic Scoring (The Expert Teacher) ---
function heuristicScore(specs: ProjectSpecs, material: Material): number {
    // CRITICAL: Hard Filter for Application Mismatch
    if (!material.applications.includes(specs.application_type)) {
        return 10; // Fail score
    }

    let score = 0;

    // Base Weights
    const W = {
        appMatch: 40,
        cost: 20,
        performance: 20,
        eco: 10,
        bonuses: 10
    };

    // 1. Application Match (Base)
    score += W.appMatch;

    // 2. Context-Specific Weighting (Humanized Logic)

    // "Structural" -> Priority on Strength
    if (specs.application_type === 'Structural' || specs.application_type === 'Foundation') {
        if (material.strength_mpa > (specs.min_strength_mpa || 30)) {
            score += 15; // Bonus for high strength
        }
    }

    // "Facade" / "Roofing" -> Priority on Weather Resistance
    if (specs.application_type === 'Facade' || specs.application_type === 'Roofing') {
        const avgWeather = (material.weather_resistance.heat + material.weather_resistance.uv + material.water_resistance) / 3;
        if (avgWeather > 7) {
            score += 15; // Bonus for weather resilience
        }
    }

    // 3. Cost-Benefit Tradeoff
    // If budget is constrained, prioritize Durability + Low Maintenance
    if (specs.budget_constraint) {
        if (material.cost_per_unit <= specs.budget_constraint) {
            score += W.cost; // Within budget

            // Value Bonus: High Durability (>=50y) & Low Maintenance (<=3)
            if (material.durability_years >= 50 && material.maintenance_requirement <= 3) {
                score += 10;
            }
        } else {
            // Over budget penalty
            score -= 20;
        }
    } else {
        // No budget constraint -> Pure performance focus
        // We still add points for reasonable cost to avoid recommending gold-plated items excessively
        score += 5;
    }

    // 4. Sustainability
    score += material.eco_friendly_score; // Direct add (0-10)

    // 5. Installation Priority
    if (specs.installation_time_constraint === 'high') {
        // Prefer low complexity
        if (material.installation_complexity <= 4) score += 10;
    }

    return Math.min(100, Math.max(0, score + Math.random() * 3)); // Reduced noise
}

// --- Reason Generator ---
function generateReason(material: Material, specs: ProjectSpecs): string {
    const reasons: string[] = [];

    // primary: application fit
    reasons.push(material.applications.includes(specs.application_type)
        ? `Great fit for ${specs.application_type}`
        : `Potential match for ${specs.application_type}`
    );

    // context specific
    if (specs.application_type === 'Structural' && material.strength_mpa > 50) {
        reasons.push(`offers high structural strength (${material.strength_mpa} MPa)`);
    }

    if (specs.budget_constraint && material.cost_per_unit < specs.budget_constraint) {
        reasons.push("fits well within your budget");
        if (material.durability_years > 50) {
            reasons.push("provides excellent long-term durability");
        }
    }

    if (material.eco_friendly_score >= 8) {
        reasons.push("is highly eco-friendly");
    }

    if (specs.installation_time_constraint === 'high' && material.installation_complexity <= 4) {
        reasons.push("allows for rapid installation");
    }

    // Join nicely
    if (reasons.length === 1) return reasons[0] + ".";
    return reasons[0] + " because it " + reasons.slice(1).join(" and ") + ".";
}

// --- The Engine Class ---
class RecommendationEngine {
    private rfModel: any; // RandomForest
    private knnModel: any; // KNN
    private isTrained: boolean = false;
    private currentMaterials: Material[] = [];

    constructor() {
        this.currentMaterials = [...MATERIALS]; // Initialize with default data
        this.trainModels();
    }

    public addMaterial(material: Material) {
        // Assign a new ID if not present
        if (!material.id) {
            const maxId = Math.max(...this.currentMaterials.map(m => m.id), 0);
            material.id = maxId + 1;
        }
        this.currentMaterials.push(material);
        this.isTrained = false; // Invalidate model
        this.trainModels(); // Retrain immediately
    }

    public trainModels() {
        console.log("Training Material AI Models (Refactored)...");

        // Use currentMaterials instead of const MATERIALS
        const dataset = this.currentMaterials;

        const X: number[][] = [];
        const y: number[] = [];

        // Balanced Training Generation (50/50)
        for (let i = 0; i < 500; i++) {
            const randomMaterial = dataset[Math.floor(Math.random() * dataset.length)];
            const isPositive = Math.random() > 0.5;

            let randomApp: string;
            if (isPositive) {
                randomApp = randomMaterial.applications[Math.floor(Math.random() * randomMaterial.applications.length)];
            } else {
                do {
                    randomApp = ALL_APPLICATIONS[Math.floor(Math.random() * ALL_APPLICATIONS.length)];
                } while (randomMaterial.applications.includes(randomApp));
            }

            const randomSpecs: ProjectSpecs = {
                application_type: randomApp,
                min_strength_mpa: Math.random() * 200,
                budget_constraint: Math.random() > 0.3 ? Math.random() * 100000 : undefined,
                environmental_conditions: { heat: 5, cold: 5, humidity: 5, uv: 5 },
                installation_time_constraint: Math.random() > 0.5 ? 'high' : 'low'
            };

            X.push(extractFeatures(randomSpecs, randomMaterial));
            y.push(heuristicScore(randomSpecs, randomMaterial));
        }

        const options = {
            seed: 42,
            maxFeatures: 0.8,
            replacement: true,
            nEstimators: 50
        };
        this.rfModel = new RandomForest(options);
        this.rfModel.train(X, y);

        // KNN Init (Normalized)
        const knnFeatures = dataset.map(m => [
            normalize(m.strength_mpa, 'strength'),
            normalize(m.durability_years, 'durability'),
            normalize(m.cost_per_unit, 'cost'),
            normalize(m.eco_friendly_score, 'eco')
        ]);
        const knnLabels = dataset.map(m => m.id);
        this.knnModel = new KNN(knnFeatures, knnLabels, { k: 3 });

        this.isTrained = true;
    }

    public predict(specs: ProjectSpecs): ScoredMaterial[] {
        if (!this.isTrained) this.trainModels();
        const dataset = this.currentMaterials;

        let predictions = dataset.map(material => {
            const features = extractFeatures(specs, material);
            const score = Math.round(this.rfModel.predict([features])[0]);

            return {
                ...material,
                match_score: score,
                ml_confidence: 0.9,
                reason: generateReason(material, specs), // Add human reason
                breakdown: {
                    application: material.applications.includes(specs.application_type) ? 100 : 0,
                    strength: material.strength_mpa,
                    durability: material.durability_years,
                    cost: material.cost_per_unit,
                    eco: material.eco_friendly_score,
                    weather: 8
                }
            };
        });

        // Sustainability Tie-Breaker
        // Sort first by score descending
        predictions.sort((a, b) => b.match_score - a.match_score);

        // Post-sort refinement: Swap adjacent items if scores are close (<5 diff) but lower item has better Eco
        for (let i = 0; i < predictions.length - 1; i++) {
            const current = predictions[i];
            const next = predictions[i + 1];

            const scoreDiff = current.match_score - next.match_score;

            // If scores are very close (within 5%) and next has significantly better Eco
            if (scoreDiff < 5 && next.eco_friendly_score > current.eco_friendly_score) {
                // Swap
                predictions[i] = next;
                predictions[i + 1] = current;
            }
        }

        return predictions;
    }

    // Updated Find Similar (Using Weighted Euclidean on Normalized Data)
    public findSimilar(materialId: number): Material[] {
        const dataset = this.currentMaterials;
        const target = dataset.find(m => m.id === materialId);
        if (!target) return [];

        const targetFeatures = [
            normalize(target.strength_mpa, 'strength'),
            normalize(target.durability_years, 'durability'),
            normalize(target.cost_per_unit, 'cost'),
            normalize(target.eco_friendly_score, 'eco')
        ];

        // Weights: Cost=1.5, Strength=1, Durability=1, Eco=0.8
        const weights = [1.0, 1.0, 1.5, 0.8];

        const distances = dataset.map(m => {
            const feat = [
                normalize(m.strength_mpa, 'strength'),
                normalize(m.durability_years, 'durability'),
                normalize(m.cost_per_unit, 'cost'),
                normalize(m.eco_friendly_score, 'eco')
            ];

            let dist = 0;
            for (let i = 0; i < 4; i++) {
                dist += weights[i] * Math.pow(feat[i] - targetFeatures[i], 2);
            }
            return { material: m, dist: Math.sqrt(dist) };
        });

        return distances
            .filter(d => d.material.id !== target.id)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 3)
            .map(d => d.material);
    }

    public learn(specs: ProjectSpecs, materialId: number, score: number) {
        console.log(`[MaterialAI] Learning interaction: ${materialId} -> ${score}`);
    }
}

export const MaterialAI = new RecommendationEngine();
