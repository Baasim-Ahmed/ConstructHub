ALTER TABLE "material_catalog"
    ADD COLUMN "environment_heat_uv" INTEGER,
    ADD COLUMN "environment_airflow" INTEGER,
    ADD COLUMN "environment_rain" INTEGER,
    ADD COLUMN "environment_fire" INTEGER,
    ADD COLUMN "environment_humidity" INTEGER;

UPDATE "material_catalog"
SET
    "environment_heat_uv" = GREATEST(0, LEAST(10, ROUND(("weather_heat" + "weather_uv") / 2.0)::INTEGER)),
    "environment_airflow" = GREATEST(0, LEAST(10, "weather_cold")),
    "environment_rain" = GREATEST(0, LEAST(10, GREATEST("weather_humidity", "water_resistance"))),
    "environment_fire" = GREATEST(0, LEAST(10, GREATEST(ROUND("fire_resistance_hours" * 2)::INTEGER, "weather_heat"))),
    "environment_humidity" = GREATEST(0, LEAST(10, "weather_humidity"));

ALTER TABLE "material_catalog"
    ALTER COLUMN "environment_heat_uv" SET NOT NULL,
    ALTER COLUMN "environment_airflow" SET NOT NULL,
    ALTER COLUMN "environment_rain" SET NOT NULL,
    ALTER COLUMN "environment_fire" SET NOT NULL,
    ALTER COLUMN "environment_humidity" SET NOT NULL;

ALTER TABLE "material_catalog"
    DROP CONSTRAINT IF EXISTS "material_catalog_weather_heat_check",
    DROP CONSTRAINT IF EXISTS "material_catalog_weather_cold_check",
    DROP CONSTRAINT IF EXISTS "material_catalog_weather_humidity_check",
    DROP CONSTRAINT IF EXISTS "material_catalog_weather_uv_check";

ALTER TABLE "material_catalog"
    DROP COLUMN "weather_heat",
    DROP COLUMN "weather_cold",
    DROP COLUMN "weather_humidity",
    DROP COLUMN "weather_uv";

ALTER TABLE "material_catalog"
    ADD CONSTRAINT "material_catalog_environment_heat_uv_check" CHECK ("environment_heat_uv" BETWEEN 0 AND 10),
    ADD CONSTRAINT "material_catalog_environment_airflow_check" CHECK ("environment_airflow" BETWEEN 0 AND 10),
    ADD CONSTRAINT "material_catalog_environment_rain_check" CHECK ("environment_rain" BETWEEN 0 AND 10),
    ADD CONSTRAINT "material_catalog_environment_fire_check" CHECK ("environment_fire" BETWEEN 0 AND 10),
    ADD CONSTRAINT "material_catalog_environment_humidity_check" CHECK ("environment_humidity" BETWEEN 0 AND 10);
