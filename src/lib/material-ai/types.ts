export interface WeatherResistance {
    heat: number;
    cold: number;
    humidity: number;
    uv: number;
}

export interface Supplier {
    id: string;
    name: string;
    location: string;
    rating: number; // 1-5
    delivery_time_days: number;
    contact: string;
}

export interface Material {
    id: number;
    name: string;
    type: string;
    applications: string[];
    strength_mpa: number;
    durability_years: number;
    thermal_conductivity: number;
    fire_resistance_hours: number;
    water_resistance: number; // 1-10
    eco_friendly_score: number; // 1-10
    cost_per_unit: number; // USD
    availability: number; // 1-10
    maintenance_requirement: number; // 1-10
    weather_resistance: WeatherResistance;
    installation_complexity: number; // 1-10
    supplier_id: string;
}

export interface ProjectSpecs {
    application_type: string;
    material_types?: string[];
    min_strength_mpa?: number;
    min_durability_years?: number;
    fire_resistance_requirement?: number;
    water_resistance_requirement?: number;
    thermal_requirement?: 'low' | 'high' | null;
    eco_friendly_requirement?: number;
    budget_constraint?: number;
    environmental_conditions?: {
        heat: number;
        cold: number;
        humidity: number;
        uv: number;
    };
    installation_time_constraint?: 'low' | 'high' | null;
}

export interface ScoredMaterial extends Material {
    match_score: number; // The normalized total score (0-100)
    ml_confidence: number; // Confidence of the ML model
    reason?: string; // Human-readable reason for recommendation
    breakdown: {
        application: number;
        strength: number;
        durability: number;
        cost: number;
        eco: number;
        weather: number;
        [key: string]: number;
    };
}

export interface ComparisonData {
    materials: ScoredMaterial[];
    features: string[];
}
