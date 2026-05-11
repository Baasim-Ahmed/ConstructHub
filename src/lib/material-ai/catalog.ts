import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getMaterialAIServerConfig } from "./env";
import { sanitizeMaterial, sanitizeMaterials } from "./preprocessing";
import {
    CreateMaterialInput,
    Material,
    MaterialCatalogCacheMeta,
    MaterialCatalogDiagnostics,
} from "./types";

type MaterialCatalogRow = {
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
    weather_heat: number;
    weather_cold: number;
    weather_humidity: number;
    weather_uv: number;
    installation_complexity: number;
    supplier_id: string;
    supplier_name: string | null;
    supplier_rating: number | null;
    source_url: string | null;
    city_availability: string[] | null;
    unit: string | null;
    standard_or_grade: string | null;
    data_quality: string | null;
    last_updated: string | null;
};

type CatalogCacheEntry = {
    materials: Material[];
    diagnostics: MaterialCatalogDiagnostics;
    expires_at: number;
    version: number;
    fetched_at: string;
};

type CatalogReadResult = {
    materials: Material[];
    cache: MaterialCatalogCacheMeta;
    diagnostics: MaterialCatalogDiagnostics;
};

type CatalogCacheState = {
    entry: CatalogCacheEntry | null;
    in_flight: Promise<CatalogReadResult> | null;
    version: number;
};

declare global {
    var __materialCatalogCache__: CatalogCacheState | undefined;
}

const MATERIAL_SELECT = Prisma.sql`
    SELECT
        "id",
        "name",
        "type",
        "applications",
        "strength_mpa",
        "durability_years",
        "thermal_conductivity",
        "fire_resistance_hours",
        "water_resistance",
        "eco_friendly_score",
        "cost_per_unit",
        "availability",
        "maintenance_requirement",
        "weather_heat",
        "weather_cold",
        "weather_humidity",
        "weather_uv",
        "installation_complexity",
        "supplier_id",
        "supplier_name",
        "supplier_rating",
        "source_url",
        "city_availability",
        "unit",
        "standard_or_grade",
        "data_quality",
        "last_updated"
    FROM "material_catalog"
`;

const materialCatalogCache = globalThis.__materialCatalogCache__ ?? {
    entry: null,
    in_flight: null,
    version: 0,
};

if (!globalThis.__materialCatalogCache__) {
    globalThis.__materialCatalogCache__ = materialCatalogCache;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

function toMaterial(record: MaterialCatalogRow): Material {
    return {
        id: record.id,
        name: record.name,
        type: record.type,
        applications: record.applications,
        strength_mpa: Number(record.strength_mpa),
        durability_years: record.durability_years,
        thermal_conductivity: Number(record.thermal_conductivity),
        fire_resistance_hours: Number(record.fire_resistance_hours),
        water_resistance: record.water_resistance,
        eco_friendly_score: record.eco_friendly_score,
        cost_per_unit: Number(record.cost_per_unit),
        availability: record.availability,
        maintenance_requirement: record.maintenance_requirement,
        weather_resistance: {
            heat: record.weather_heat,
            cold: record.weather_cold,
            humidity: record.weather_humidity,
            uv: record.weather_uv,
        },
        installation_complexity: record.installation_complexity,
        supplier_id: record.supplier_id,
        supplier_name: record.supplier_name ?? undefined,
        supplier_rating: record.supplier_rating ?? undefined,
        source_url: record.source_url ?? undefined,
        city_availability: record.city_availability ?? undefined,
        unit: record.unit ?? undefined,
        standard_or_grade: record.standard_or_grade ?? undefined,
        data_quality: record.data_quality === "verified" || record.data_quality === "estimated" || record.data_quality === "unknown"
            ? record.data_quality
            : undefined,
        last_updated: record.last_updated ?? undefined,
    };
}

function createCacheMeta(entry: CatalogCacheEntry, state: "hit" | "miss"): MaterialCatalogCacheMeta {
    return {
        state,
        version: entry.version,
        ttl_ms: Math.max(0, entry.expires_at - Date.now()),
        fetched_at: entry.fetched_at,
        record_count: entry.materials.length,
        sanitized_record_count: entry.diagnostics.sanitized_record_count,
    };
}

async function readMaterialsFromDatabase(): Promise<CatalogCacheEntry> {
    const { cache_ttl_ms, query_timeout_ms } = getMaterialAIServerConfig();

    const rows = await withTimeout(
        prisma.$queryRaw<MaterialCatalogRow[]>(Prisma.sql`${MATERIAL_SELECT} ORDER BY "id" ASC`),
        query_timeout_ms,
        "Material catalog query timed out."
    );

    const sanitized = sanitizeMaterials(rows.map(toMaterial));
    const fetchedAt = new Date().toISOString();

    return {
        materials: sanitized.materials,
        diagnostics: sanitized.diagnostics,
        expires_at: Date.now() + cache_ttl_ms,
        version: materialCatalogCache.version + 1,
        fetched_at: fetchedAt,
    };
}

function buildInsertQuery(material: Material) {
    if (material.id > 0) {
        return Prisma.sql`
            INSERT INTO "material_catalog" (
                "id",
                "name",
                "type",
                "applications",
                "strength_mpa",
                "durability_years",
                "thermal_conductivity",
                "fire_resistance_hours",
                "water_resistance",
                "eco_friendly_score",
                "cost_per_unit",
                "availability",
                "maintenance_requirement",
                "weather_heat",
                "weather_cold",
                "weather_humidity",
                "weather_uv",
                "installation_complexity",
                "supplier_id",
                "supplier_name",
                "supplier_rating",
                "source_url",
                "city_availability",
                "unit",
                "standard_or_grade",
                "data_quality",
                "last_updated"
            ) VALUES (
                ${material.id},
                ${material.name},
                ${material.type},
                ${material.applications},
                ${material.strength_mpa},
                ${material.durability_years},
                ${material.thermal_conductivity},
                ${material.fire_resistance_hours},
                ${material.water_resistance},
                ${material.eco_friendly_score},
                ${material.cost_per_unit},
                ${material.availability},
                ${material.maintenance_requirement},
                ${material.weather_resistance.heat},
                ${material.weather_resistance.cold},
                ${material.weather_resistance.humidity},
                ${material.weather_resistance.uv},
                ${material.installation_complexity},
                ${material.supplier_id},
                ${material.supplier_name ?? null},
                ${material.supplier_rating ?? null},
                ${material.source_url ?? null},
                ${material.city_availability ?? []},
                ${material.unit ?? null},
                ${material.standard_or_grade ?? null},
                ${material.data_quality ?? null},
                ${material.last_updated ?? null}
            )
            RETURNING *
        `;
    }

    return Prisma.sql`
        INSERT INTO "material_catalog" (
            "name",
            "type",
            "applications",
            "strength_mpa",
            "durability_years",
            "thermal_conductivity",
            "fire_resistance_hours",
            "water_resistance",
            "eco_friendly_score",
            "cost_per_unit",
            "availability",
            "maintenance_requirement",
            "weather_heat",
            "weather_cold",
            "weather_humidity",
            "weather_uv",
            "installation_complexity",
            "supplier_id",
            "supplier_name",
            "supplier_rating",
            "source_url",
            "city_availability",
            "unit",
            "standard_or_grade",
            "data_quality",
            "last_updated"
        ) VALUES (
            ${material.name},
            ${material.type},
            ${material.applications},
            ${material.strength_mpa},
            ${material.durability_years},
            ${material.thermal_conductivity},
            ${material.fire_resistance_hours},
            ${material.water_resistance},
            ${material.eco_friendly_score},
            ${material.cost_per_unit},
            ${material.availability},
            ${material.maintenance_requirement},
            ${material.weather_resistance.heat},
            ${material.weather_resistance.cold},
            ${material.weather_resistance.humidity},
            ${material.weather_resistance.uv},
            ${material.installation_complexity},
            ${material.supplier_id},
            ${material.supplier_name ?? null},
            ${material.supplier_rating ?? null},
            ${material.source_url ?? null},
            ${material.city_availability ?? []},
            ${material.unit ?? null},
            ${material.standard_or_grade ?? null},
            ${material.data_quality ?? null},
            ${material.last_updated ?? null}
        )
        RETURNING *
    `;
}

function invalidateCatalogCache() {
    materialCatalogCache.entry = null;
    materialCatalogCache.in_flight = null;
}

export async function listMaterials(options?: { forceRefresh?: boolean }): Promise<CatalogReadResult> {
    const forceRefresh = options?.forceRefresh ?? false;
    const currentEntry = materialCatalogCache.entry;

    if (!forceRefresh && currentEntry && currentEntry.expires_at > Date.now()) {
        return {
            materials: currentEntry.materials,
            cache: createCacheMeta(currentEntry, "hit"),
            diagnostics: currentEntry.diagnostics,
        };
    }

    if (!forceRefresh && materialCatalogCache.in_flight) {
        return materialCatalogCache.in_flight;
    }

    materialCatalogCache.in_flight = (async () => {
        const nextEntry = await readMaterialsFromDatabase();
        materialCatalogCache.version = nextEntry.version;
        materialCatalogCache.entry = nextEntry;

        return {
            materials: nextEntry.materials,
            cache: createCacheMeta(nextEntry, "miss"),
            diagnostics: nextEntry.diagnostics,
        };
    })();

    try {
        return await materialCatalogCache.in_flight;
    } finally {
        materialCatalogCache.in_flight = null;
    }
}

export async function createMaterials(materials: CreateMaterialInput[]): Promise<Material[]> {
    if (materials.length === 0) return [];

    const sanitizedMaterials = materials.map((material) => sanitizeMaterial(material).material);
    const { query_timeout_ms } = getMaterialAIServerConfig();

    const created = await withTimeout(
        prisma.$transaction(async (tx) => {
            const result: Material[] = [];

            for (const material of sanitizedMaterials) {
                const rows = await tx.$queryRaw<MaterialCatalogRow[]>(buildInsertQuery(material));
                result.push(sanitizeMaterial(toMaterial(rows[0])).material);
            }

            return result;
        }),
        query_timeout_ms,
        "Material creation query timed out."
    );

    invalidateCatalogCache();
    return created;
}

export async function createMaterial(material: CreateMaterialInput): Promise<Material> {
    const materials = await createMaterials([material]);
    return materials[0];
}
