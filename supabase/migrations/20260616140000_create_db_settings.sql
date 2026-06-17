CREATE TABLE IF NOT EXISTS "db_Settings" (
    "ROW_ID" TEXT PRIMARY KEY,
    "TABLE_NAME" TEXT NOT NULL UNIQUE,
    "SORTING" TEXT NOT NULL DEFAULT 'ROW_ID'
);

CREATE INDEX IF NOT EXISTS "db_Settings_TABLE_NAME_idx" ON "db_Settings" ("TABLE_NAME");

ALTER TABLE "db_Settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on db_Settings"
    ON "db_Settings"
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on db_Settings"
    ON "db_Settings"
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on db_Settings"
    ON "db_Settings"
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete on db_Settings"
    ON "db_Settings"
    FOR DELETE
    USING (true);
