import { getMaterialAIClientConfig } from "./env";
import {
    CreateMaterialInput,
    Material,
    MaterialApiErrorCode,
    MaterialApiErrorResponse,
    MaterialApiResponse,
    MaterialBatchApiResponse,
    MaterialsApiResponse,
} from "./types";

export class MaterialApiClientError extends Error {
    constructor(
        message: string,
        public readonly code: MaterialApiErrorCode,
        public readonly status?: number,
        public readonly retryable = false,
        public readonly requestId?: string,
        public readonly details?: string[]
    ) {
        super(message);
        this.name = "MaterialApiClientError";
    }
}

function buildEndpoint(path: string): string {
    const { base_url } = getMaterialAIClientConfig();
    return `${base_url}${path}`;
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
}

function coerceErrorPayload(payload: unknown): MaterialApiErrorResponse["error"] | null {
    if (
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as MaterialApiErrorResponse).error?.message === "string" &&
        typeof (payload as MaterialApiErrorResponse).error?.code === "string"
    ) {
        return (payload as MaterialApiErrorResponse).error;
    }

    if (
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as { error?: string }).error === "string"
    ) {
        return {
            code: "UNKNOWN_ERROR",
            message: (payload as { error: string }).error,
            retryable: false,
        };
    }

    return null;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        throw new MaterialApiClientError(
            "The Material AI API returned invalid JSON.",
            "INVALID_RESPONSE",
            response.status,
            false
        );
    }
}

function assertMaterialsResponse(payload: unknown): MaterialsApiResponse {
    if (
        typeof payload === "object" &&
        payload !== null &&
        Array.isArray((payload as MaterialsApiResponse).materials) &&
        typeof (payload as MaterialsApiResponse).meta?.request_id === "string"
    ) {
        return payload as MaterialsApiResponse;
    }

    throw new MaterialApiClientError(
        "The Material AI catalog response was missing expected fields.",
        "INVALID_RESPONSE"
    );
}

function assertMaterialResponse(payload: unknown): MaterialApiResponse {
    if (
        typeof payload === "object" &&
        payload !== null &&
        typeof (payload as MaterialApiResponse).material?.name === "string" &&
        typeof (payload as MaterialApiResponse).meta?.request_id === "string"
    ) {
        return payload as MaterialApiResponse;
    }

    throw new MaterialApiClientError(
        "The Material AI create response was missing expected fields.",
        "INVALID_RESPONSE"
    );
}

function assertMaterialBatchResponse(payload: unknown): MaterialBatchApiResponse {
    if (
        typeof payload === "object" &&
        payload !== null &&
        Array.isArray((payload as MaterialBatchApiResponse).materials) &&
        typeof (payload as MaterialBatchApiResponse).meta?.request_id === "string"
    ) {
        return payload as MaterialBatchApiResponse;
    }

    throw new MaterialApiClientError(
        "The Material AI batch response was missing expected fields.",
        "INVALID_RESPONSE"
    );
}

async function requestMaterialApi(
    path: string,
    init: RequestInit,
    attempt = 0
): Promise<unknown> {
    const config = getMaterialAIClientConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout_ms);

    try {
        const response = await fetch(buildEndpoint(path), {
            ...init,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(init.headers ?? {}),
            },
        });

        const payload = await parseJsonResponse(response);

        if (!response.ok) {
            const errorPayload = coerceErrorPayload(payload);
            const code = errorPayload?.code ?? "UNKNOWN_ERROR";
            const retryable = errorPayload?.retryable ?? isRetryableStatus(response.status);

            if (retryable && attempt < config.retry_attempts) {
                await delay(config.retry_base_delay_ms * Math.pow(2, attempt));
                return requestMaterialApi(path, init, attempt + 1);
            }

            throw new MaterialApiClientError(
                errorPayload?.message ?? "The Material AI API request failed.",
                code,
                response.status,
                retryable,
                errorPayload?.request_id,
                errorPayload?.details
            );
        }

        if (payload === null) {
            throw new MaterialApiClientError(
                "The Material AI API returned an empty response.",
                "EMPTY_RESPONSE",
                response.status,
                false
            );
        }

        return payload;
    } catch (error) {
        if (error instanceof MaterialApiClientError) {
            throw error;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
            if (attempt < config.retry_attempts) {
                await delay(config.retry_base_delay_ms * Math.pow(2, attempt));
                return requestMaterialApi(path, init, attempt + 1);
            }

            throw new MaterialApiClientError(
                "The Material AI API request timed out.",
                "REQUEST_TIMEOUT",
                408,
                true
            );
        }

        if (attempt < config.retry_attempts) {
            await delay(config.retry_base_delay_ms * Math.pow(2, attempt));
            return requestMaterialApi(path, init, attempt + 1);
        }

        throw new MaterialApiClientError(
            error instanceof Error ? error.message : "The Material AI API request failed.",
            "NETWORK_ERROR",
            undefined,
            true
        );
    } finally {
        clearTimeout(timeout);
    }
}

let inFlightCatalogRequest: Promise<MaterialsApiResponse> | null = null;

export async function fetchMaterialCatalog(): Promise<Material[]> {
    if (!inFlightCatalogRequest) {
        inFlightCatalogRequest = requestMaterialApi("/api/data", {
            method: "GET",
            cache: "no-store",
        }).then(assertMaterialsResponse);
    }

    try {
        const payload = await inFlightCatalogRequest;
        return payload.materials;
    } finally {
        inFlightCatalogRequest = null;
    }
}

export async function createMaterialCatalogEntry(material: CreateMaterialInput): Promise<Material> {
    const payload = await requestMaterialApi("/api/data", {
        method: "POST",
        body: JSON.stringify(material),
    });

    return assertMaterialResponse(payload).material;
}

export async function createMaterialCatalogEntries(materials: CreateMaterialInput[]): Promise<Material[]> {
    const payload = await requestMaterialApi("/api/data", {
        method: "POST",
        body: JSON.stringify(materials),
    });

    return assertMaterialBatchResponse(payload).materials;
}
