export type MaterialDataQuality = 'verified' | 'estimated' | 'unknown';

export type MaterialApiErrorCode =
    | 'BAD_JSON'
    | 'VALIDATION_ERROR'
    | 'INVALID_RESPONSE'
    | 'EMPTY_RESPONSE'
    | 'NETWORK_ERROR'
    | 'REQUEST_TIMEOUT'
    | 'RETRY_EXHAUSTED'
    | 'DATABASE_ERROR'
    | 'DATABASE_TIMEOUT'
    | 'UNKNOWN_ERROR';

export type MaterialSanitizationIssueCode =
    | 'missing_value'
    | 'outlier_clamped'
    | 'normalized_value'
    | 'deduplicated_list'
    | 'invalid_value';

export interface WeatherResistance {
    heat: number;
    cold: number;
    humidity: number;
    uv: number;
}

export interface EnvironmentalConditions {
    sun: number;
    wind: number;
    rain: number;
    fire: number;
    humidity: number;
    cold?: number;
    heat?: number;
    uv?: number;
}

export interface Supplier {
    id: string;
    name: string;
    location: string;
    rating: number;
    delivery_time_days: number;
    contact: string;
    website?: string;
    city_availability?: string[];
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
    water_resistance: number;
    eco_friendly_score: number;
    cost_per_unit: number;
    availability: number;
    maintenance_requirement: number;
    weather_resistance: WeatherResistance;
    installation_complexity: number;
    supplier_id: string;
    supplier_name?: string;
    supplier_rating?: number;
    source_url?: string;
    city_availability?: string[];
    unit?: string;
    standard_or_grade?: string;
    data_quality?: MaterialDataQuality;
    last_updated?: string;
}

export type CreateMaterialInput = Omit<Material, 'id'> & {
    id?: number;
};

export type CreateMaterialRequestBody = CreateMaterialInput | CreateMaterialInput[];

export interface MaterialSanitizationIssue {
    material_id?: number;
    field: string;
    code: MaterialSanitizationIssueCode;
    message: string;
    original_value?: unknown;
    normalized_value?: unknown;
}

export interface MaterialCatalogCacheMeta {
    state: 'hit' | 'miss';
    version: number;
    ttl_ms: number;
    fetched_at: string;
    record_count: number;
    sanitized_record_count: number;
}

export interface MaterialCatalogDiagnostics {
    issue_count: number;
    sanitized_record_count: number;
}

export interface MaterialsApiMeta {
    request_id: string;
    cache: MaterialCatalogCacheMeta;
    diagnostics: MaterialCatalogDiagnostics;
}

export interface MutationApiMeta {
    request_id: string;
    created_count: number;
    cache_invalidated: boolean;
}

export interface MaterialsApiResponse {
    materials: Material[];
    meta: MaterialsApiMeta;
}

export interface MaterialApiResponse {
    material: Material;
    meta: MutationApiMeta;
}

export interface MaterialBatchApiResponse {
    materials: Material[];
    meta: MutationApiMeta;
}

export interface MaterialApiErrorPayload {
    code: MaterialApiErrorCode;
    message: string;
    retryable: boolean;
    request_id?: string;
    details?: string[];
}

export interface MaterialApiErrorResponse {
    error: MaterialApiErrorPayload;
}

export interface MaterialApiClientConfig {
    base_url: string;
    timeout_ms: number;
    retry_attempts: number;
    retry_base_delay_ms: number;
}

export interface ProjectSpecs {
    application_type: string;
    material_types?: string[];
    project_city?: string;
    required_standard_or_grade?: string;
    min_strength_mpa?: number;
    min_durability_years?: number;
    fire_resistance_requirement?: number;
    water_resistance_requirement?: number;
    thermal_requirement?: 'low' | 'high' | null;
    eco_friendly_requirement?: number;
    budget_constraint?: number;
    price_sensitivity?: 'low' | 'medium' | 'high';
    environmental_conditions?: EnvironmentalConditions;
    installation_time_constraint?: 'low' | 'high' | null;
}

export interface ScoredMaterial extends Material {
    match_score: number;
    ml_confidence: number;
    reason?: string;
    reason_details?: string[];
    warnings?: string[];
    breakdown: {
        application: number;
        strength: number;
        durability: number;
        cost: number;
        eco: number;
        weather: number;
        budget?: number;
        performance?: number;
        environment?: number;
        availability?: number;
        supplier?: number;
        standards?: number;
        sustainability?: number;
        maintenance?: number;
        confidence?: number;
        [key: string]: number | undefined;
    };
}

export interface ComparisonData {
    materials: ScoredMaterial[];
    features: string[];
}
