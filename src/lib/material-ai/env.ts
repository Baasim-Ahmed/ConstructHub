import { MaterialApiClientConfig } from "./types";

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_QUERY_TIMEOUT_MS = 8 * 1000;
const DEFAULT_CLIENT_TIMEOUT_MS = 10 * 1000;
const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 350;

function parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getMaterialAIServerConfig() {
    return {
        cache_ttl_ms: parsePositiveInt(process.env.MATERIAL_AI_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS),
        query_timeout_ms: parsePositiveInt(process.env.MATERIAL_AI_DB_TIMEOUT_MS, DEFAULT_QUERY_TIMEOUT_MS),
    };
}

export function getMaterialAIClientConfig(): MaterialApiClientConfig {
    return {
        base_url: (process.env.NEXT_PUBLIC_MATERIAL_AI_API_BASE_URL ?? "").replace(/\/$/, ""),
        timeout_ms: parsePositiveInt(process.env.NEXT_PUBLIC_MATERIAL_AI_API_TIMEOUT_MS, DEFAULT_CLIENT_TIMEOUT_MS),
        retry_attempts: parsePositiveInt(process.env.NEXT_PUBLIC_MATERIAL_AI_API_RETRY_ATTEMPTS, DEFAULT_RETRY_ATTEMPTS),
        retry_base_delay_ms: parsePositiveInt(process.env.NEXT_PUBLIC_MATERIAL_AI_API_RETRY_BASE_DELAY_MS, DEFAULT_RETRY_BASE_DELAY_MS),
    };
}
