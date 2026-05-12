export const MATERIAL_APPLICATIONS = [
    "Foundation",
    "Structural",
    "Flooring",
    "Wall",
    "Roofing",
    "Facade",
    "Interior Finishing",
    "Insulation",
] as const;

export type MaterialApplication = (typeof MATERIAL_APPLICATIONS)[number];

export const ENVIRONMENTAL_STRESS_FIELDS = [
    { id: "heatUv", label: "Heat / UV Exposure" },
    { id: "airflow", label: "Airflow / Drafts" },
    { id: "rain", label: "Rain / Precipitation" },
    { id: "fire", label: "Extreme Temperature / Fire Risk" },
    { id: "humidity", label: "Humidity / Moisture Levels" },
] as const;

export type EnvironmentalStressField = (typeof ENVIRONMENTAL_STRESS_FIELDS)[number]["id"];

export type EnvironmentalStressProfile = Record<EnvironmentalStressField, number>;

export const DEFAULT_APPLICATION: MaterialApplication = "Structural";

export const DEFAULT_ENVIRONMENTAL_STRESS_PROFILE: EnvironmentalStressProfile = {
    heatUv: 5,
    airflow: 5,
    rain: 5,
    fire: 5,
    humidity: 5,
};

const LEGACY_APPLICATION_ALIASES: Record<string, MaterialApplication> = {
    windows: "Facade",
    doors: "Interior Finishing",
    stairs: "Flooring",
    boundary: "Wall",
    ceiling: "Interior Finishing",
};

export function coerceMaterialApplication(value: string): MaterialApplication | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const exact = MATERIAL_APPLICATIONS.find((application) => application === trimmed);
    if (exact) return exact;

    return LEGACY_APPLICATION_ALIASES[trimmed.toLowerCase()] ?? null;
}
