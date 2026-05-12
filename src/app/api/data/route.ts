import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createMaterials, listMaterials } from "@/lib/material-ai/catalog";
import { MATERIAL_APPLICATIONS } from "@/lib/material-ai/constants";
import {
    CreateMaterialInput,
    CreateMaterialRequestBody,
    MaterialApiErrorCode,
    MaterialApiErrorResponse,
} from "@/lib/material-ai/types";

function errorResponse(
    requestId: string,
    status: number,
    code: MaterialApiErrorCode,
    message: string,
    retryable: boolean,
    details?: string[]
) {
    const payload: MaterialApiErrorResponse = {
        error: {
            code,
            message,
            retryable,
            request_id: requestId,
            details,
        },
    };

    return NextResponse.json(payload, { status });
}

function normalizeCreatePayload(body: CreateMaterialRequestBody): CreateMaterialInput[] {
    return Array.isArray(body) ? body : [body];
}

function validateMaterialPayload(material: Partial<CreateMaterialInput>, index: number): string[] {
    const issues: string[] = [];

    if (!material.name?.trim()) issues.push(`materials[${index}].name is required.`);
    if (!material.type?.trim()) issues.push(`materials[${index}].type is required.`);
    if (!material.supplier_id?.trim()) issues.push(`materials[${index}].supplier_id is required.`);
    if (!Array.isArray(material.applications) || material.applications.length === 0) {
        issues.push(`materials[${index}].applications must contain at least one value.`);
    } else {
        const unsupported = material.applications.filter((application) => !MATERIAL_APPLICATIONS.includes(application));
        if (unsupported.length > 0) {
            issues.push(`materials[${index}].applications contains unsupported values: ${unsupported.join(", ")}.`);
        }
    }
    if (!material.weather_resistance) {
        issues.push(`materials[${index}].weather_resistance is required.`);
    } else {
        for (const key of ["heatUv", "airflow", "rain", "fire", "humidity"] as const) {
            if (typeof material.weather_resistance[key] !== "number") {
                issues.push(`materials[${index}].weather_resistance.${key} must be a number.`);
            }
        }
    }

    return issues;
}

function mapUnhandledError(requestId: string, error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected Material AI API error occurred.";

    if (message.toLowerCase().includes("timed out")) {
        return errorResponse(
            requestId,
            504,
            "DATABASE_TIMEOUT",
            "The material catalog request timed out while waiting for the database.",
            true
        );
    }

    return errorResponse(
        requestId,
        503,
        "DATABASE_ERROR",
        "The Material AI database request failed.",
        true,
        [message]
    );
}

export async function GET(req: NextRequest) {
    const requestId = randomUUID();
    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "true";

    try {
        const result = await listMaterials({ forceRefresh });

        return NextResponse.json(
            {
                materials: result.materials,
                meta: {
                    request_id: requestId,
                    cache: result.cache,
                    diagnostics: result.diagnostics,
                },
            },
            {
                headers: {
                    "Cache-Control": "no-store, max-age=0",
                    "Pragma": "no-cache",
                    "Expires": "0",
                    "X-Material-AI-Request-Id": requestId,
                    "X-Material-AI-Cache": result.cache.state,
                },
            }
        );
    } catch (error) {
        console.error("[api/data][GET]", { requestId, error });
        return mapUnhandledError(requestId, error);
    }
}

export async function POST(req: Request) {
    const requestId = randomUUID();

    try {
        const body = await req.json() as CreateMaterialRequestBody;
        const materials = normalizeCreatePayload(body);

        if (materials.length === 0) {
            return errorResponse(
                requestId,
                400,
                "VALIDATION_ERROR",
                "At least one material payload is required.",
                false
            );
        }

        const validationIssues = materials.flatMap((material, index) => validateMaterialPayload(material, index));
        if (validationIssues.length > 0) {
            return errorResponse(
                requestId,
                400,
                "VALIDATION_ERROR",
                "One or more material payloads are invalid.",
                false,
                validationIssues
            );
        }

        const created = await createMaterials(materials);
        const meta = {
            request_id: requestId,
            created_count: created.length,
            cache_invalidated: true,
        };

        if (Array.isArray(body)) {
            return NextResponse.json({ materials: created, meta }, { status: 201 });
        }

        return NextResponse.json({ material: created[0], meta }, { status: 201 });
    } catch (error) {
        if (error instanceof SyntaxError) {
            return errorResponse(
                requestId,
                400,
                "BAD_JSON",
                "The Material AI API received malformed JSON.",
                false
            );
        }

        console.error("[api/data][POST]", { requestId, error });
        return mapUnhandledError(requestId, error);
    }
}
