-- Migrate column order from db_COLUMN_ORDERS into db_Settings.SORTING (unified JSON), then drop legacy table.
-- Safe to re-run: skips if db_COLUMN_ORDERS does not exist.

DO $$
BEGIN
    IF to_regclass('public."db_COLUMN_ORDERS"') IS NULL THEN
        RAISE NOTICE 'db_COLUMN_ORDERS already dropped.';
        RETURN;
    END IF;

    INSERT INTO "db_Settings" ("ROW_ID", "TABLE_NAME", "SORTING")
    SELECT
        'R-' || LPAD(
            (
                COALESCE(
                    (
                        SELECT MAX(
                            CASE
                                WHEN "ROW_ID" ~ '(\d+)$'
                                    THEN (regexp_match("ROW_ID", '(\d+)$'))[1]::int
                                ELSE 0
                            END
                        )
                        FROM "db_Settings"
                    ),
                    0
                ) + row_number() OVER (ORDER BY co."TABLE_NAME")
            )::text,
            4,
            '0'
        ),
        co."TABLE_NAME",
        json_build_object(
            'columnOrder',
            (
                SELECT json_agg(upper(value))
                FROM unnest(co."COLUMN_ORDER") AS value
            ),
            'sortRules',
            COALESCE(
                CASE
                    WHEN ds."SORTING" IS NOT NULL AND left(trim(ds."SORTING"), 1) = '[' THEN ds."SORTING"::jsonb
                    WHEN ds."SORTING" IS NOT NULL AND left(trim(ds."SORTING"), 1) = '{' THEN ds."SORTING"::jsonb -> 'sortRules'
                    ELSE '[]'::jsonb
                END,
                '[]'::jsonb
            )
        )::text
    FROM "db_COLUMN_ORDERS" co
    LEFT JOIN "db_Settings" ds ON ds."TABLE_NAME" = co."TABLE_NAME"
    WHERE NOT EXISTS (
        SELECT 1 FROM "db_Settings" existing WHERE existing."TABLE_NAME" = co."TABLE_NAME"
    );

    UPDATE "db_Settings" ds
    SET "SORTING" = json_build_object(
        'columnOrder',
        (
            SELECT json_agg(upper(value))
            FROM unnest(co."COLUMN_ORDER") AS value
        ),
        'sortRules',
        COALESCE(
            CASE
                WHEN ds."SORTING" IS NOT NULL AND left(trim(ds."SORTING"), 1) = '[' THEN ds."SORTING"::jsonb
                WHEN ds."SORTING" IS NOT NULL AND left(trim(ds."SORTING"), 1) = '{' THEN ds."SORTING"::jsonb -> 'sortRules'
                ELSE '[]'::jsonb
            END,
            '[]'::jsonb
        )
    )::text
    FROM "db_COLUMN_ORDERS" co
    WHERE ds."TABLE_NAME" = co."TABLE_NAME";

    DROP TABLE "db_COLUMN_ORDERS" CASCADE;
END $$;
