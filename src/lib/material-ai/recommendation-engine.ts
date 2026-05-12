import { Material, ProjectSpecs, ScoredMaterial } from './types';
import { RandomForestRegression as RandomForest } from 'ml-random-forest';
import { DEFAULT_ENVIRONMENTAL_STRESS_PROFILE, type MaterialApplication } from './constants';

const NORMALIZATION_CONSTANTS = {
    strength: { min: 0, max: 500 },
    durability: { min: 0, max: 100 },
    cost: { min: 0, max: 1000000 },
    eco: { min: 0, max: 10 },
    complexity: { min: 0, max: 10 }
};

const DEFAULT_ENVIRONMENT = DEFAULT_ENVIRONMENTAL_STRESS_PROFILE;

const DEFAULT_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
const MAX_PREDICTION_CACHE_SIZE = 24;
const ENABLE_CLIENT_MODEL_TRAINING = false;

const SUPPLIER_META: Record<string, Partial<Material>> = {
    SUP019: { supplier_name: 'Lucky Cement Limited', source_url: 'https://www.lucky-cement.com/products3/', standard_or_grade: 'SRC Cement', unit: 'PKR per m3 concrete estimate', data_quality: 'estimated', supplier_rating: 4.4 },
    SUP020: { supplier_name: 'D.G. Khan Cement Company Limited', source_url: 'https://dgcement.com/products.html', standard_or_grade: 'SRC Cement', unit: 'PKR per m3 concrete estimate', data_quality: 'estimated', supplier_rating: 4.3 },
    SUP021: { supplier_name: 'Fauji Cement Company Limited', source_url: 'https://fccl.com.pk/eng/products/', standard_or_grade: 'Low Heat Cement', unit: 'PKR per m3 concrete estimate', data_quality: 'estimated', supplier_rating: 4.2 },
    SUP022: { supplier_name: 'Kohat Cement Company Limited', source_url: 'https://www.kohatcement.com/portland_cement.aspx', standard_or_grade: 'OPC Cement', unit: 'PKR per m3 concrete estimate', data_quality: 'estimated', supplier_rating: 4.0 },
    SUP023: { supplier_name: 'Bestway Cement Limited', source_url: 'https://www.bestway.com.pk/', standard_or_grade: 'SRC Cement', unit: 'PKR per m3 concrete estimate', data_quality: 'estimated', supplier_rating: 4.3 },
    SUP024: { supplier_name: 'Maple Leaf Cement Factory Limited', source_url: 'https://www.mapleleafcement.com/', standard_or_grade: 'White Cement', unit: 'PKR per bag/finish estimate', data_quality: 'estimated', supplier_rating: 4.2 },
    SUP025: { supplier_name: 'Amreli Steels Limited', source_url: 'https://amrelisteels.com/products/', standard_or_grade: 'G-500W Rebar', unit: 'PKR per ton', data_quality: 'estimated', supplier_rating: 4.5 },
    SUP026: { supplier_name: 'Ittehad Steel', source_url: 'https://ittehad.com.pk/products/', standard_or_grade: 'Grade 60 Rebar', unit: 'PKR per ton', data_quality: 'estimated', supplier_rating: 4.1 },
    SUP027: { supplier_name: 'Agha Steel Industries', source_url: 'https://aghasteel.com/products-and-quality-controls/astm-a615/', standard_or_grade: 'ASTM A615 Grade 60', unit: 'PKR per ton', data_quality: 'estimated', supplier_rating: 4.2 },
    SUP028: { supplier_name: 'Aisha Steel Mills Limited', source_url: 'https://www.aishasteel.com/', standard_or_grade: 'Galvanized Sheet', unit: 'PKR per ton', data_quality: 'estimated', supplier_rating: 4.0 },
    SUP029: { supplier_name: 'Mughal Iron & Steel Industries Limited', source_url: 'https://mughalsteel.com.pk/', standard_or_grade: 'Grade 60 Rebar', unit: 'PKR per ton', data_quality: 'estimated', supplier_rating: 4.2 },
    SUP030: { supplier_name: 'Shabbir Tiles and Ceramics Limited / STILE', source_url: 'https://www.stile.com.pk/about-us/', standard_or_grade: 'Porcelain/Vitrified Tile', unit: 'PKR per sqm', data_quality: 'estimated', supplier_rating: 4.1 },
    SUP031: { supplier_name: 'Master Tiles and Ceramic Industries Limited', source_url: 'http://www.mastertiles.com/', standard_or_grade: 'Ceramic Tile', unit: 'PKR per sqm', data_quality: 'estimated', supplier_rating: 4.0 },
    SUP032: { supplier_name: 'Ghani Value Glass Limited', source_url: 'https://ghanivalueglass.com/', standard_or_grade: 'Tempered/Double Glazed Glass', unit: 'PKR per sqm', data_quality: 'estimated', supplier_rating: 4.1 },
    SUP033: { supplier_name: 'Tariq Glass Industries Limited', source_url: 'https://www.tariqglass.com/page/about-us', standard_or_grade: 'Float Glass', unit: 'PKR per sqm', data_quality: 'estimated', supplier_rating: 4.0 },
    SUP034: { supplier_name: 'Berger Paints Pakistan Limited', source_url: 'https://shop.berger.com.pk/collections/exterior', standard_or_grade: 'Exterior Weather Coating', unit: 'PKR per pack', data_quality: 'estimated', supplier_rating: 4.2 }
};

type ScoreAnalysis = {
    score: number;
    confidence: number;
    reasonDetails: string[];
    warnings: string[];
    breakdown: ScoredMaterial['breakdown'];
};

type FeedbackStats = {
    useful: number;
    notUseful: number;
    selected: number;
};

type ResolvedEnvironment = typeof DEFAULT_ENVIRONMENT;

function normalize(value: number, key: keyof typeof NORMALIZATION_CONSTANTS): number {
    const { min, max } = NORMALIZATION_CONSTANTS[key];
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function clampScore(value: number): number {
    return Math.round(Math.max(0, Math.min(100, value)));
}

function clampEnvironmentValue(value: number | undefined, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(10, Math.max(1, value as number));
}

function getEnvironment(specs: ProjectSpecs): ResolvedEnvironment {
    const env = specs.environmental_conditions;
    const legacyHeat = (env as { heat?: number } | undefined)?.heat;
    const legacyUv = (env as { uv?: number } | undefined)?.uv;
    const legacySun = (env as { sun?: number } | undefined)?.sun;
    const legacyWind = (env as { wind?: number; cold?: number } | undefined)?.wind
        ?? (env as { wind?: number; cold?: number } | undefined)?.cold;
    const heatUvFallback = typeof legacySun === 'number'
        ? legacySun
        : [legacyHeat, legacyUv].filter((value): value is number => typeof value === 'number').reduce(
            (sum, value, _, values) => sum + value / values.length,
            0
        ) || DEFAULT_ENVIRONMENT.heatUv;

    return {
        heatUv: clampEnvironmentValue(env?.heatUv, heatUvFallback),
        airflow: clampEnvironmentValue(env?.airflow, legacyWind ?? DEFAULT_ENVIRONMENT.airflow),
        rain: clampEnvironmentValue(env?.rain, DEFAULT_ENVIRONMENT.rain),
        fire: clampEnvironmentValue(env?.fire, legacyHeat ?? DEFAULT_ENVIRONMENT.fire),
        humidity: clampEnvironmentValue(env?.humidity, DEFAULT_ENVIRONMENT.humidity)
    };
}

function createSpecsCacheKey(specs: ProjectSpecs): string {
    return JSON.stringify({
        ...specs,
        material_types: specs.material_types ? [...specs.material_types].sort() : undefined,
        environmental_conditions: getEnvironment(specs)
    });
}

function fitAgainstStress(resistance: number, stress: number): number {
    return Math.max(0, Math.min(1, 1 - Math.max(0, stress - resistance) / 7));
}

function fireResistanceScore(hours: number): number {
    return Math.min(10, Math.max(1, hours * 2));
}

function fireRequirementFromStress(stress: number): number {
    return Math.max(1, stress / 2);
}

function average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function weightedAverage(values: Array<{ value: number; weight: number }>): number {
    const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
    return values.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function includesText(value: string | undefined, needle: string | undefined): boolean {
    if (!value || !needle) return false;
    return value.toLowerCase().includes(needle.toLowerCase());
}

function enrichMaterial(material: Material): Material {
    const meta = SUPPLIER_META[material.supplier_id] ?? {};

    return {
        ...meta,
        ...material,
        supplier_name: material.supplier_name ?? meta.supplier_name ?? material.supplier_id,
        supplier_rating: material.supplier_rating ?? meta.supplier_rating ?? 3.5,
        source_url: material.source_url ?? meta.source_url,
        city_availability: material.city_availability ?? meta.city_availability ?? DEFAULT_CITIES,
        unit: material.unit ?? meta.unit ?? inferUnit(material),
        standard_or_grade: material.standard_or_grade ?? meta.standard_or_grade ?? inferStandard(material),
        data_quality: material.data_quality ?? meta.data_quality ?? 'estimated',
        last_updated: material.last_updated ?? '2026-05-10'
    };
}

function inferUnit(material: Material): string {
    if (material.type === 'Steel') return 'PKR per ton';
    if (material.type === 'Glass' || material.type === 'Ceramic' || material.type === 'Coating') return 'PKR per sqm/pack estimate';
    if (material.type === 'Concrete') return 'PKR per m3 estimate';
    return 'PKR per unit estimate';
}

function inferStandard(material: Material): string {
    const text = material.name.toLowerCase();
    if (text.includes('grade 60')) return 'Grade 60';
    if (text.includes('g-500')) return 'G-500W';
    if (text.includes('src') || text.includes('sulphate')) return 'SRC';
    if (text.includes('opc')) return 'OPC';
    if (text.includes('porcelain')) return 'Porcelain';
    if (text.includes('tempered')) return 'Tempered';
    return 'General construction grade';
}

function scoreBudget(specs: ProjectSpecs, material: Material): number {
    if (!specs.budget_constraint || specs.budget_constraint <= 0) return 75;
    const ratio = material.cost_per_unit / specs.budget_constraint;
    if (ratio <= 1) return 100;
    if (ratio <= 1.15) return 70;
    if (ratio <= 1.35) return 45;
    return Math.max(0, 35 - (ratio - 1.35) * 25);
}

function scoreApplicationFit(specs: ProjectSpecs, material: Material): number {
    if (specs.material_types?.length) {
        const matchesType = specs.material_types.some(type => type.toLowerCase() === material.type.toLowerCase());
        if (!matchesType) return 5;
    }

    if (!material.applications.includes(specs.application_type)) return 10;

    const env = getEnvironment(specs);
    const wetExposure = Math.max(env.humidity, env.rain);

    if (specs.application_type === 'Roofing' && wetExposure >= 8) {
        if (material.type === 'Bitumen' || material.type === 'Coating') return 100;
        if (material.type === 'Steel' && material.water_resistance >= 7) return 88;
        if (material.water_resistance >= 9) return 82;
        return 70;
    }

    if (specs.application_type === 'Facade' && (wetExposure >= 8 || env.heatUv >= 8)) {
        const envelopeFit = average([
            fitAgainstStress(material.weather_resistance.heatUv, env.heatUv),
            fitAgainstStress(material.weather_resistance.humidity, env.humidity),
            fitAgainstStress(material.weather_resistance.rain, env.rain)
        ]);
        return clampScore(75 + envelopeFit * 25);
    }

    return 100;
}

function scorePerformance(specs: ProjectSpecs, material: Material): number {
    const checks: number[] = [];
    const env = getEnvironment(specs);
    const wetExposure = Math.max(env.humidity, env.rain);
    const fireRequirement = fireRequirementFromStress(env.fire);

    if (specs.min_strength_mpa) checks.push(Math.min(100, (material.strength_mpa / specs.min_strength_mpa) * 100));
    if (specs.fire_resistance_requirement) checks.push(Math.min(100, (material.fire_resistance_hours / specs.fire_resistance_requirement) * 100));
    if (!specs.fire_resistance_requirement && env.fire >= 7) {
        checks.push(Math.min(100, (material.fire_resistance_hours / fireRequirement) * 100));
    }
    if (specs.water_resistance_requirement) checks.push(Math.min(100, (material.water_resistance / specs.water_resistance_requirement) * 100));
    if (!specs.water_resistance_requirement && wetExposure >= 8 && ['Foundation', 'Roofing', 'Facade', 'Wall'].includes(specs.application_type)) {
        checks.push(material.water_resistance * 10);
    }
    if (env.heatUv >= 8 && ['Roofing', 'Facade', 'Wall'].includes(specs.application_type)) {
        checks.push(material.weather_resistance.heatUv * 10);
    }
    if (specs.thermal_requirement === 'low') checks.push(material.thermal_conductivity <= 1 ? 100 : Math.max(30, 100 - material.thermal_conductivity * 20));
    if (specs.thermal_requirement === 'high') checks.push(material.thermal_conductivity >= 1 ? 90 : 55);
    if (specs.installation_time_constraint === 'low') checks.push((11 - material.installation_complexity) * 10);
    if (checks.length === 0) return material.strength_mpa >= 50 ? 80 : 65;
    return clampScore(average(checks));
}

function scoreEnvironment(specs: ProjectSpecs, material: Material): number {
    const env = getEnvironment(specs);
    const heatUvFit = fitAgainstStress(material.weather_resistance.heatUv, env.heatUv);
    const humidityFit = fitAgainstStress(material.weather_resistance.humidity, env.humidity);
    const rainFit = fitAgainstStress(material.weather_resistance.rain, env.rain);
    const airflowFit = fitAgainstStress(material.weather_resistance.airflow, env.airflow);
    const fireFit = average([
        fitAgainstStress(material.weather_resistance.fire, env.fire),
        fitAgainstStress(fireResistanceScore(material.fire_resistance_hours), env.fire)
    ]);
    const wetExposure = Math.max(env.humidity, env.rain);

    const baseScore = weightedAverage([
        { value: heatUvFit, weight: env.heatUv >= 8 ? 1.6 : 1.0 },
        { value: humidityFit, weight: wetExposure >= 8 ? 1.7 : 1.0 },
        { value: rainFit, weight: wetExposure >= 8 ? 2.1 : 1.1 },
        { value: fireFit, weight: env.fire >= 8 ? 1.8 : 1.0 },
        { value: airflowFit, weight: env.airflow >= 8 ? 1.3 : 0.8 }
    ]) * 100;

    const highStressPenalty = [
        { fit: heatUvFit, stress: env.heatUv },
        { fit: humidityFit, stress: env.humidity },
        { fit: rainFit, stress: env.rain },
        { fit: fireFit, stress: env.fire },
        { fit: airflowFit, stress: env.airflow }
    ].reduce((penalty, item) => {
        if (item.stress < 8 || item.fit >= 0.7) return penalty;
        return penalty + (0.7 - item.fit) * 28;
    }, 0);

    return clampScore(baseScore - highStressPenalty);
}

function scoreDurability(specs: ProjectSpecs, material: Material): number {
    const durabilityTarget = specs.min_durability_years ?? 50;
    const durabilityFit = Math.min(100, (material.durability_years / durabilityTarget) * 100);
    const maintenanceFit = (11 - material.maintenance_requirement) * 10;
    return clampScore(durabilityFit * 0.7 + maintenanceFit * 0.3);
}

function scoreAvailability(specs: ProjectSpecs, material: Material): number {
    const cityFit = specs.project_city
        ? material.city_availability?.some(city => city.toLowerCase() === specs.project_city?.toLowerCase()) ? 100 : 55
        : 80;
    return clampScore(material.availability * 7 + cityFit * 0.3);
}

function scoreStandards(specs: ProjectSpecs, material: Material): number {
    if (!specs.required_standard_or_grade) return 75;
    const standard = specs.required_standard_or_grade;
    if (includesText(material.standard_or_grade, standard) || includesText(material.name, standard)) return 100;
    return 35;
}

function scoreSustainability(specs: ProjectSpecs, material: Material): number {
    const base = material.eco_friendly_score * 10;
    if (!specs.eco_friendly_requirement) return base;
    return material.eco_friendly_score >= specs.eco_friendly_requirement
        ? Math.max(base, 90)
        : Math.max(15, base - (specs.eco_friendly_requirement - material.eco_friendly_score) * 12);
}

function scoreContextualAdjustment(specs: ProjectSpecs, material: Material, environmentScore: number): number {
    const env = getEnvironment(specs);
    const wetExposure = Math.max(env.humidity, env.rain);

    if (specs.application_type === 'Roofing' && wetExposure >= 8) {
        if (material.type === 'Bitumen') return 8;
        if (material.type === 'Coating') return 5;
        if (material.type === 'Concrete') return -5;
        if (environmentScore < 75) return -4;
    }

    if (Math.max(env.heatUv, env.humidity, env.rain, env.fire, env.airflow) >= 8 && environmentScore < 65) {
        return -6;
    }

    return 0;
}

function scoreConfidence(specs: ProjectSpecs, material: Material): number {
    const fields = [
        material.supplier_name,
        material.source_url,
        material.unit,
        material.standard_or_grade,
        material.last_updated,
        material.city_availability?.length ? 'cities' : '',
        material.cost_per_unit > 0 ? 'cost' : '',
        material.applications.length ? 'applications' : ''
    ];
    const completeness = fields.filter(Boolean).length / fields.length;
    const qualityScore = material.data_quality === 'verified' ? 1 : material.data_quality === 'estimated' ? 0.78 : 0.45;
    const sourceScore = material.source_url ? 1 : 0.55;
    const requirementScore = [
        specs.application_type,
        specs.budget_constraint,
        specs.project_city,
        specs.min_strength_mpa,
        specs.min_durability_years,
        specs.required_standard_or_grade,
        specs.environmental_conditions
    ].filter(Boolean).length / 7;

    return clampScore((completeness * 0.35 + qualityScore * 0.3 + sourceScore * 0.2 + requirementScore * 0.15) * 100);
}

function buildReasons(specs: ProjectSpecs, material: Material, breakdown: ScoredMaterial['breakdown']): { reasons: string[]; warnings: string[] } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    const env = getEnvironment(specs);

    if (breakdown.application >= 100) reasons.push(`matches ${specs.application_type} use`);
    if (breakdown.budget && breakdown.budget >= 90) reasons.push('fits well within the selected budget');
    if (breakdown.performance && breakdown.performance >= 85) reasons.push(`meets key performance needs (${material.strength_mpa} MPa strength)`);
    if (breakdown.environment && breakdown.environment >= 85) reasons.push('is suitable for the selected environmental stress profile');
    if (breakdown.durability >= 80) reasons.push(`offers strong durability with ${material.durability_years} year estimated life`);
    if (breakdown.availability && breakdown.availability >= 80) reasons.push('has strong market availability');
    if (breakdown.standards && breakdown.standards >= 95 && specs.required_standard_or_grade) reasons.push(`matches ${specs.required_standard_or_grade} requirement`);
    if (material.maintenance_requirement <= 3) reasons.push('has low maintenance demand');
    if (material.data_quality === 'estimated') reasons.push('uses estimated market data suitable for early-stage planning');

    if (breakdown.budget && breakdown.budget < 50) warnings.push('over budget for the selected limit');
    if (fitAgainstStress(material.weather_resistance.humidity, env.humidity) < 0.7) warnings.push('low humidity resistance for this site condition');
    if (fitAgainstStress(material.weather_resistance.rain, env.rain) < 0.7) warnings.push('low rain resistance for this site condition');
    if (env.fire >= 7 && fitAgainstStress(fireResistanceScore(material.fire_resistance_hours), env.fire) < 0.7) warnings.push('low fire resistance for this site condition');
    if (material.fire_resistance_hours < (specs.fire_resistance_requirement ?? 0)) warnings.push('below requested fire resistance');
    if (!material.source_url) warnings.push('supplier source data is incomplete');
    if (breakdown.standards && breakdown.standards < 50 && specs.required_standard_or_grade) warnings.push('does not clearly match the requested standard or grade');

    return { reasons, warnings };
}

function getWeights(specs: ProjectSpecs) {
    const env = getEnvironment(specs);
    const highEnvironmentStress = Math.max(env.heatUv, env.humidity, env.rain, env.fire, env.airflow) >= 8;
    const costWeight = specs.price_sensitivity === 'high' ? 0.23 : specs.price_sensitivity === 'low' ? 0.1 : 0.16;
    const performanceWeight = specs.price_sensitivity === 'high' ? 0.17 : 0.22;

    return {
        application: 0.16,
        budget: highEnvironmentStress ? costWeight * 0.85 : costWeight,
        performance: highEnvironmentStress ? Math.max(0.19, performanceWeight) : performanceWeight,
        environment: highEnvironmentStress ? 0.29 : 0.18,
        durability: 0.12,
        availability: highEnvironmentStress ? 0.07 : 0.09,
        supplier: highEnvironmentStress ? 0.04 : 0.06,
        standards: 0.05,
        sustainability: 0.05
    };
}

function analyzeMaterial(specs: ProjectSpecs, material: Material): ScoreAnalysis {
    const application = scoreApplicationFit(specs, material);
    const budget = scoreBudget(specs, material);
    const performance = scorePerformance(specs, material);
    const environment = scoreEnvironment(specs, material);
    const durability = scoreDurability(specs, material);
    const availability = scoreAvailability(specs, material);
    const supplier = clampScore((material.supplier_rating ?? 3.5) * 20);
    const standards = scoreStandards(specs, material);
    const sustainability = scoreSustainability(specs, material);
    const maintenance = clampScore((11 - material.maintenance_requirement) * 10);
    const contextualAdjustment = scoreContextualAdjustment(specs, material, environment);
    const weights = getWeights(specs);

    const weightedScore =
        application * weights.application +
        budget * weights.budget +
        performance * weights.performance +
        environment * weights.environment +
        durability * weights.durability +
        availability * weights.availability +
        supplier * weights.supplier +
        standards * weights.standards +
        sustainability * weights.sustainability;
    const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);

    const breakdown: ScoredMaterial['breakdown'] = {
        application,
        strength: material.strength_mpa,
        durability,
        cost: budget,
        eco: material.eco_friendly_score,
        weather: environment,
        budget,
        performance,
        environment,
        availability,
        supplier,
        standards,
        sustainability,
        maintenance,
        confidence: scoreConfidence(specs, material)
    };

    const { reasons, warnings } = buildReasons(specs, material, breakdown);
    const adjustedScore = weightedScore / totalWeight + contextualAdjustment;

    return {
        score: application < 50 ? Math.min(35, adjustedScore) : clampScore(adjustedScore),
        confidence: breakdown.confidence ?? 70,
        reasonDetails: reasons,
        warnings,
        breakdown
    };
}

function generateReason(material: Material, specs: ProjectSpecs, analysis: ScoreAnalysis): string {
    const topReasons = analysis.reasonDetails.slice(0, 4);
    if (topReasons.length === 0) return `Potential match for ${specs.application_type}.`;
    return `Recommended for ${specs.application_type} because it ${topReasons.join(', ')}.`;
}

function extractFeatures(
    specs: ProjectSpecs,
    material: Material,
    applications: MaterialApplication[],
    materialTypes: string[],
    analysis?: ScoreAnalysis
): number[] {
    const resolvedAnalysis = analysis ?? analyzeMaterial(specs, material);
    const appFeatures = applications.map(app => material.applications.includes(app) ? 1 : 0);
    const typeFeatures = materialTypes.map(type => material.type === type ? 1 : 0);
    const env = getEnvironment(specs);
    const reqStrength = specs.min_strength_mpa ? normalize(specs.min_strength_mpa, 'strength') : 0;

    return [
        ...appFeatures,
        ...typeFeatures,
        normalize(material.strength_mpa, 'strength'),
        normalize(material.durability_years, 'durability'),
        normalize(material.cost_per_unit, 'cost'),
        normalize(material.eco_friendly_score, 'eco'),
        normalize(material.installation_complexity, 'complexity'),
        normalize(material.strength_mpa, 'strength') - reqStrength,
        specs.application_type === 'Structural' ? 1 : 0,
        specs.budget_constraint ? 1 : 0,
        material.applications.includes(specs.application_type) ? 1 : 0,
        env.heatUv / 10,
        env.humidity / 10,
        env.rain / 10,
        env.fire / 10,
        env.airflow / 10,
        (resolvedAnalysis.breakdown.budget ?? 0) / 100,
        (resolvedAnalysis.breakdown.performance ?? 0) / 100,
        (resolvedAnalysis.breakdown.environment ?? 0) / 100,
        (resolvedAnalysis.breakdown.availability ?? 0) / 100,
        (resolvedAnalysis.breakdown.standards ?? 0) / 100,
        (resolvedAnalysis.breakdown.confidence ?? 0) / 100
    ];
}

export class RecommendationEngine {
    private rfModel!: InstanceType<typeof RandomForest>;
    private isTrained = false;
    private currentMaterials: Material[] = [];
    private allApplications: MaterialApplication[] = [];
    private allTypes: string[] = [];
    private similarityIndex = new Map<number, number[]>();
    private predictionCache = new Map<string, ScoredMaterial[]>();
    private feedback = new Map<number, FeedbackStats>();

    constructor(materials: Material[]) {
        this.currentMaterials = materials.map(enrichMaterial);
        this.refreshFeatureCatalog();
    }

    public addMaterial(material: Material) {
        const enriched = enrichMaterial(material);
        if (!enriched.id) {
            const maxId = Math.max(...this.currentMaterials.map(m => m.id), 0);
            enriched.id = maxId + 1;
        }

        this.currentMaterials.push(enriched);
        this.refreshFeatureCatalog();
        this.predictionCache.clear();
        this.isTrained = false;
    }

    public trainModels() {
        if (this.currentMaterials.length === 0) {
            this.isTrained = false;
            return;
        }

        console.log("Training Material AI Models (Optimized Hybrid Scoring)...");
        const X: number[][] = [];
        const y: number[] = [];

        for (const material of this.currentMaterials) {
            for (const specs of this.buildTrainingSpecs(material)) {
                const analysis = analyzeMaterial(specs, material);
                X.push(extractFeatures(specs, material, this.allApplications, this.allTypes, analysis));
                y.push(analysis.score);
            }
        }

        try {
            this.rfModel = new RandomForest({
                seed: 42,
                maxFeatures: 0.75,
                replacement: true,
                nEstimators: 36
            });
            this.rfModel.train(X, y);
            this.isTrained = true;
        } catch (error) {
            console.error("[MaterialAI] Model training failed, falling back to heuristic scoring.", error);
            this.isTrained = false;
        }
    }

    public predict(specs: ProjectSpecs): ScoredMaterial[] {
        if (this.currentMaterials.length === 0) return [];
        if (ENABLE_CLIENT_MODEL_TRAINING && !this.isTrained) this.trainModels();

        const cacheKey = createSpecsCacheKey(specs);
        const cached = this.predictionCache.get(cacheKey);
        if (cached) return cached;

        const predictions = this.currentMaterials.map(material => {
            const expert = analyzeMaterial(specs, material);
            const modelScore = ENABLE_CLIENT_MODEL_TRAINING && this.isTrained
                ? Math.round(this.rfModel.predict([extractFeatures(specs, material, this.allApplications, this.allTypes, expert)])[0])
                : expert.score;
            const feedbackBoost = this.getFeedbackBoost(material.id);
            const score = clampScore(
                ENABLE_CLIENT_MODEL_TRAINING && this.isTrained
                    ? expert.score * 0.78 + modelScore * 0.22 + feedbackBoost
                    : expert.score + feedbackBoost
            );

            return {
                ...material,
                match_score: score,
                ml_confidence: expert.confidence,
                reason: generateReason(material, specs, expert),
                reason_details: expert.reasonDetails,
                warnings: expert.warnings,
                breakdown: expert.breakdown
            };
        }).sort((a, b) => {
            if (b.match_score !== a.match_score) return b.match_score - a.match_score;
            if (b.ml_confidence !== a.ml_confidence) return b.ml_confidence - a.ml_confidence;
            return (b.breakdown.availability ?? 0) - (a.breakdown.availability ?? 0);
        });

        this.rememberPrediction(cacheKey, predictions);
        return predictions;
    }

    public findSimilar(materialId: number): Material[] {
        const target = this.currentMaterials.find(m => m.id === materialId);
        if (!target) return [];

        const targetFeatures = this.similarityIndex.get(target.id) ?? this.buildSimilarityVector(target);
        const weights = [1.0, 1.0, 1.5, 0.8, 0.7, 0.6];

        return this.currentMaterials
            .filter(material => material.id !== target.id)
            .map(material => {
                const features = this.similarityIndex.get(material.id) ?? this.buildSimilarityVector(material);
                const distance = features.reduce(
                    (total, value, index) => total + weights[index] * Math.pow(value - targetFeatures[index], 2),
                    0
                );
                return { material, distance: Math.sqrt(distance) };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map(item => item.material);
    }

    public learn(_specs: ProjectSpecs, materialId: number, score: number) {
        const current = this.feedback.get(materialId) ?? { useful: 0, notUseful: 0, selected: 0 };
        if (score >= 90) current.selected += 1;
        else if (score > 0) current.useful += 1;
        else current.notUseful += 1;
        this.feedback.set(materialId, current);
        console.log(`[MaterialAI] Feedback stored: ${materialId} -> ${score}`);
    }

    private getFeedbackBoost(materialId: number): number {
        const stats = this.feedback.get(materialId);
        if (!stats) return 0;
        return Math.max(-6, Math.min(8, stats.useful * 1.5 + stats.selected * 3 - stats.notUseful * 2));
    }

    private refreshFeatureCatalog() {
        this.allApplications = Array.from(new Set(this.currentMaterials.flatMap(material => material.applications))).sort();
        this.allTypes = Array.from(new Set(this.currentMaterials.map(material => material.type))).sort();
        this.similarityIndex = new Map(this.currentMaterials.map(material => [material.id, this.buildSimilarityVector(material)]));
    }

    private buildSimilarityVector(material: Material): number[] {
        return [
            normalize(material.strength_mpa, 'strength'),
            normalize(material.durability_years, 'durability'),
            normalize(material.cost_per_unit, 'cost'),
            normalize(material.eco_friendly_score, 'eco'),
            (material.availability ?? 5) / 10,
            (material.supplier_rating ?? 3.5) / 5
        ];
    }

    private buildTrainingSpecs(material: Material): ProjectSpecs[] {
        const primaryApplication = material.applications[0] ?? 'Structural';
        const secondaryApplication = material.applications[1] ?? primaryApplication;
        const projectCity = material.city_availability?.[0] ?? DEFAULT_CITIES[0];

        return [
            {
                application_type: primaryApplication,
                material_types: [material.type],
                project_city: projectCity,
                min_strength_mpa: Math.max(1, material.strength_mpa * 0.7),
                min_durability_years: Math.max(10, Math.min(100, material.durability_years - 5)),
                budget_constraint: Math.max(100, material.cost_per_unit * 1.15),
                price_sensitivity: 'medium',
                environmental_conditions: {
                    heatUv: 5,
                    airflow: 5,
                    humidity: 5,
                    rain: 5,
                    fire: 5,
                },
                installation_time_constraint: 'low'
            },
            {
                application_type: secondaryApplication,
                material_types: [material.type],
                project_city: projectCity,
                min_strength_mpa: Math.max(1, material.strength_mpa * 0.55),
                water_resistance_requirement: Math.max(4, material.water_resistance - 1),
                eco_friendly_requirement: Math.max(3, material.eco_friendly_score - 1),
                budget_constraint: Math.max(100, material.cost_per_unit),
                price_sensitivity: 'high',
                environmental_conditions: {
                    heatUv: 7,
                    airflow: 6,
                    humidity: 8,
                    rain: 8,
                    fire: 6,
                },
                installation_time_constraint: 'high'
            },
            {
                application_type: primaryApplication,
                material_types: [material.type],
                project_city: projectCity,
                required_standard_or_grade: material.standard_or_grade,
                min_durability_years: Math.max(10, Math.min(120, material.durability_years)),
                fire_resistance_requirement: Math.max(1, Math.min(6, material.fire_resistance_hours)),
                thermal_requirement: material.thermal_conductivity <= 1 ? 'low' : 'high',
                price_sensitivity: 'low',
                environmental_conditions: {
                    heatUv: 8,
                    airflow: 7,
                    humidity: 6,
                    rain: 6,
                    fire: 8,
                },
                installation_time_constraint: 'low'
            }
        ];
    }

    private rememberPrediction(cacheKey: string, predictions: ScoredMaterial[]) {
        if (this.predictionCache.size >= MAX_PREDICTION_CACHE_SIZE) {
            const oldestKey = this.predictionCache.keys().next().value;
            if (oldestKey) this.predictionCache.delete(oldestKey);
        }

        this.predictionCache.set(cacheKey, predictions);
    }
}
