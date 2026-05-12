import {
    CreateMaterialInput,
    Material,
    MaterialCatalogDiagnostics,
    MaterialDataQuality,
    MaterialSanitizationIssue,
} from "./types";
import {
    coerceMaterialApplication,
    DEFAULT_APPLICATION,
    DEFAULT_ENVIRONMENTAL_STRESS_PROFILE,
    type EnvironmentalStressProfile,
    type MaterialApplication,
} from "./constants";

const DEFAULT_LAST_UPDATED = "2026-05-10";
const DEFAULT_APPLICATIONS: MaterialApplication[] = [DEFAULT_APPLICATION];
const DEFAULT_CITY_AVAILABILITY = ["Karachi"];

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function finiteOrDefault(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeString(value: unknown, fallback: string): string {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]): { value: string[]; deduped: boolean } {
    if (!Array.isArray(value)) {
        return { value: fallback, deduped: false };
    }

    const cleaned = value
        .map((item) => typeof item === "string" ? item.trim() : "")
        .filter(Boolean);
    const deduped = Array.from(new Set(cleaned));

    return {
        value: deduped.length > 0 ? deduped : fallback,
        deduped: cleaned.length !== deduped.length,
    };
}

function normalizeApplications(value: unknown): { value: MaterialApplication[]; deduped: boolean } {
    if (!Array.isArray(value)) {
        return { value: DEFAULT_APPLICATIONS, deduped: false };
    }

    const cleaned = value
        .map((item) => typeof item === "string" ? coerceMaterialApplication(item) : null)
        .filter((item): item is MaterialApplication => item !== null);
    const deduped = Array.from(new Set(cleaned));

    return {
        value: deduped.length > 0 ? deduped : DEFAULT_APPLICATIONS,
        deduped: cleaned.length !== deduped.length || cleaned.length !== value.length,
    };
}

function normalizeDataQuality(value: unknown): MaterialDataQuality {
    return value === "verified" || value === "estimated" || value === "unknown"
        ? value
        : "unknown";
}

function pushIssue(
    issues: MaterialSanitizationIssue[],
    materialId: number | undefined,
    field: string,
    code: MaterialSanitizationIssue["code"],
    message: string,
    originalValue?: unknown,
    normalizedValue?: unknown
) {
    issues.push({
        material_id: materialId,
        field,
        code,
        message,
        original_value: originalValue,
        normalized_value: normalizedValue,
    });
}

function sanitizeClampedNumber(
    issues: MaterialSanitizationIssue[],
    materialId: number | undefined,
    field: string,
    value: unknown,
    fallback: number,
    min: number,
    max: number
): number {
    const finite = finiteOrDefault(value, fallback);
    const normalized = clamp(finite, min, max);

    if (value === undefined || value === null || value === "") {
        pushIssue(issues, materialId, field, "missing_value", `${field} was missing and defaulted.`, value, normalized);
    } else if (normalized !== finite) {
        pushIssue(issues, materialId, field, "outlier_clamped", `${field} was clamped into an allowed range.`, value, normalized);
    }

    return normalized;
}

export function sanitizeMaterial(material: Partial<Material> | CreateMaterialInput): {
    material: Material;
    issues: MaterialSanitizationIssue[];
} {
    const issues: MaterialSanitizationIssue[] = [];
    const materialId = typeof material.id === "number" ? material.id : undefined;

    const normalizedName = normalizeString(material.name, "Unnamed Material");
    if (normalizedName !== material.name) {
        pushIssue(issues, materialId, "name", "normalized_value", "Material name was normalized.", material.name, normalizedName);
    }

    const normalizedType = normalizeString(material.type, "Other");
    if (normalizedType !== material.type) {
        pushIssue(issues, materialId, "type", "normalized_value", "Material type was normalized.", material.type, normalizedType);
    }

    const applications = normalizeApplications(material.applications);
    if (!Array.isArray(material.applications)) {
        pushIssue(issues, materialId, "applications", "missing_value", "Applications were missing and defaulted.", material.applications, applications.value);
    } else if (applications.deduped) {
        pushIssue(issues, materialId, "applications", "deduplicated_list", "Unsupported or duplicate applications were normalized.", material.applications, applications.value);
    }

    const cities = normalizeStringArray(material.city_availability, DEFAULT_CITY_AVAILABILITY);
    if (Array.isArray(material.city_availability) && cities.deduped) {
        pushIssue(issues, materialId, "city_availability", "deduplicated_list", "Duplicate cities were removed.", material.city_availability, cities.value);
    }

    const dataQuality = normalizeDataQuality(material.data_quality);
    if (material.data_quality && material.data_quality !== dataQuality) {
        pushIssue(issues, materialId, "data_quality", "invalid_value", "Unsupported data quality value was normalized.", material.data_quality, dataQuality);
    }

    const supplierName = material.supplier_name ? normalizeString(material.supplier_name, "Unknown Supplier") : undefined;
    const supplierId = normalizeString(material.supplier_id, "UNKNOWN");
    const sourceUrl = material.source_url ? normalizeString(material.source_url, "") || undefined : undefined;
    const standardOrGrade = material.standard_or_grade ? normalizeString(material.standard_or_grade, "") || undefined : undefined;
    const unit = material.unit ? normalizeString(material.unit, "") || undefined : undefined;
    const lastUpdated = material.last_updated ? normalizeString(material.last_updated, DEFAULT_LAST_UPDATED) : DEFAULT_LAST_UPDATED;
    const rawWeatherResistance = (material.weather_resistance ?? {}) as Record<string, unknown>;
    const legacyHeat = finiteOrDefault(rawWeatherResistance.heat, DEFAULT_ENVIRONMENTAL_STRESS_PROFILE.heatUv);
    const legacyUv = finiteOrDefault(rawWeatherResistance.uv, DEFAULT_ENVIRONMENTAL_STRESS_PROFILE.heatUv);
    const derivedHeatUv = rawWeatherResistance.heatUv ?? rawWeatherResistance.heat_uv ?? rawWeatherResistance.sun ?? ((legacyHeat + legacyUv) / 2);
    const derivedAirflow = rawWeatherResistance.airflow ?? rawWeatherResistance.wind ?? rawWeatherResistance.cold;
    const derivedRain = rawWeatherResistance.rain ?? Math.max(finiteOrDefault(material.water_resistance, 5), finiteOrDefault(rawWeatherResistance.humidity, 5));
    const derivedFire = rawWeatherResistance.fire ?? Math.max(legacyHeat, finiteOrDefault(material.fire_resistance_hours, 2) * 2);
    const derivedHumidity = rawWeatherResistance.humidity;

    const normalizedWeatherResistance: EnvironmentalStressProfile = {
        heatUv: sanitizeClampedNumber(issues, materialId, "weather_resistance.heatUv", derivedHeatUv, DEFAULT_ENVIRONMENTAL_STRESS_PROFILE.heatUv, 0, 10),
        airflow: sanitizeClampedNumber(issues, materialId, "weather_resistance.airflow", derivedAirflow, DEFAULT_ENVIRONMENTAL_STRESS_PROFILE.airflow, 0, 10),
        rain: sanitizeClampedNumber(issues, materialId, "weather_resistance.rain", derivedRain, DEFAULT_ENVIRONMENTAL_STRESS_PROFILE.rain, 0, 10),
        fire: sanitizeClampedNumber(issues, materialId, "weather_resistance.fire", derivedFire, DEFAULT_ENVIRONMENTAL_STRESS_PROFILE.fire, 0, 10),
        humidity: sanitizeClampedNumber(issues, materialId, "weather_resistance.humidity", derivedHumidity, DEFAULT_ENVIRONMENTAL_STRESS_PROFILE.humidity, 0, 10),
    };

    const sanitized: Material = {
        id: typeof material.id === "number" ? material.id : 0,
        name: normalizedName,
        type: normalizedType,
        applications: applications.value,
        strength_mpa: sanitizeClampedNumber(issues, materialId, "strength_mpa", material.strength_mpa, 0, 0, 1200),
        durability_years: sanitizeClampedNumber(issues, materialId, "durability_years", material.durability_years, 1, 1, 250),
        thermal_conductivity: sanitizeClampedNumber(issues, materialId, "thermal_conductivity", material.thermal_conductivity, 0.5, 0, 500),
        fire_resistance_hours: sanitizeClampedNumber(issues, materialId, "fire_resistance_hours", material.fire_resistance_hours, 1, 0, 24),
        water_resistance: sanitizeClampedNumber(issues, materialId, "water_resistance", material.water_resistance, 5, 0, 10),
        eco_friendly_score: sanitizeClampedNumber(issues, materialId, "eco_friendly_score", material.eco_friendly_score, 5, 0, 10),
        cost_per_unit: sanitizeClampedNumber(issues, materialId, "cost_per_unit", material.cost_per_unit, 0, 0, 1_000_000_000),
        availability: sanitizeClampedNumber(issues, materialId, "availability", material.availability, 5, 0, 10),
        maintenance_requirement: sanitizeClampedNumber(issues, materialId, "maintenance_requirement", material.maintenance_requirement, 5, 0, 10),
        weather_resistance: normalizedWeatherResistance,
        installation_complexity: sanitizeClampedNumber(issues, materialId, "installation_complexity", material.installation_complexity, 5, 0, 10),
        supplier_id: supplierId,
        supplier_name: supplierName,
        supplier_rating: material.supplier_rating === undefined
            ? undefined
            : sanitizeClampedNumber(issues, materialId, "supplier_rating", material.supplier_rating, 3.5, 0, 5),
        source_url: sourceUrl,
        city_availability: cities.value,
        unit,
        standard_or_grade: standardOrGrade,
        data_quality: dataQuality,
        last_updated: lastUpdated,
    };

    return { material: sanitized, issues };
}

export function sanitizeMaterials(materials: Array<Partial<Material> | CreateMaterialInput>): {
    materials: Material[];
    issues: MaterialSanitizationIssue[];
    diagnostics: MaterialCatalogDiagnostics;
} {
    const issues: MaterialSanitizationIssue[] = [];
    let sanitizedRecordCount = 0;

    const sanitizedMaterials = materials.map((material) => {
        const result = sanitizeMaterial(material);
        if (result.issues.length > 0) sanitizedRecordCount += 1;
        issues.push(...result.issues);
        return result.material;
    });

    return {
        materials: sanitizedMaterials,
        issues,
        diagnostics: {
            issue_count: issues.length,
            sanitized_record_count: sanitizedRecordCount,
        },
    };
}
