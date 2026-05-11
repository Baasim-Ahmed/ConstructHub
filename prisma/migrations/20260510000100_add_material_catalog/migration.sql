CREATE TABLE "material_catalog" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "applications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "strength_mpa" DOUBLE PRECISION NOT NULL,
    "durability_years" INTEGER NOT NULL,
    "thermal_conductivity" DOUBLE PRECISION NOT NULL,
    "fire_resistance_hours" DOUBLE PRECISION NOT NULL,
    "water_resistance" INTEGER NOT NULL,
    "eco_friendly_score" INTEGER NOT NULL,
    "cost_per_unit" DOUBLE PRECISION NOT NULL,
    "availability" INTEGER NOT NULL,
    "maintenance_requirement" INTEGER NOT NULL,
    "weather_heat" INTEGER NOT NULL,
    "weather_cold" INTEGER NOT NULL,
    "weather_humidity" INTEGER NOT NULL,
    "weather_uv" INTEGER NOT NULL,
    "installation_complexity" INTEGER NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_name" TEXT,
    "supplier_rating" DOUBLE PRECISION,
    "source_url" TEXT,
    "city_availability" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "unit" TEXT,
    "standard_or_grade" TEXT,
    "data_quality" TEXT,
    "last_updated" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_catalog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "material_catalog_data_quality_check" CHECK (
        "data_quality" IS NULL OR "data_quality" IN ('verified', 'estimated', 'unknown')
    ),
    CONSTRAINT "material_catalog_water_resistance_check" CHECK ("water_resistance" BETWEEN 0 AND 10),
    CONSTRAINT "material_catalog_eco_friendly_score_check" CHECK ("eco_friendly_score" BETWEEN 0 AND 10),
    CONSTRAINT "material_catalog_availability_check" CHECK ("availability" BETWEEN 0 AND 10),
    CONSTRAINT "material_catalog_maintenance_requirement_check" CHECK ("maintenance_requirement" BETWEEN 0 AND 10),
    CONSTRAINT "material_catalog_installation_complexity_check" CHECK ("installation_complexity" BETWEEN 0 AND 10),
    CONSTRAINT "material_catalog_weather_heat_check" CHECK ("weather_heat" BETWEEN 0 AND 10),
    CONSTRAINT "material_catalog_weather_cold_check" CHECK ("weather_cold" BETWEEN 0 AND 10),
    CONSTRAINT "material_catalog_weather_humidity_check" CHECK ("weather_humidity" BETWEEN 0 AND 10),
    CONSTRAINT "material_catalog_weather_uv_check" CHECK ("weather_uv" BETWEEN 0 AND 10)
);

CREATE INDEX "material_catalog_type_idx" ON "material_catalog"("type");
CREATE INDEX "material_catalog_supplier_id_idx" ON "material_catalog"("supplier_id");
