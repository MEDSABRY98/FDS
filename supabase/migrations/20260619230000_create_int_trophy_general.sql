CREATE TABLE IF NOT EXISTS "int_TROPHY_GENERAL" (
  "ROW_ID" text PRIMARY KEY,
  "TYPE" text NOT NULL,
  "AREA" text,
  "GAME" text,
  "COMPETITION" text,
  "SEASON" text,
  "W-MANAGER" text,
  "L-MANAGER" text,
  "PLACE" text,
  "CHAMPION" text,
  "RESULT" text,
  "RUNNER-UP" text,
  "NOTE" text
);

CREATE UNIQUE INDEX IF NOT EXISTS int_trophy_general_business_key_uidx
  ON "int_TROPHY_GENERAL" ("TYPE", "GAME", "COMPETITION", "SEASON", "PLACE", "RUNNER-UP")
  WHERE "TYPE" IS NOT NULL AND btrim("TYPE") <> ''
    AND "GAME" IS NOT NULL AND btrim("GAME") <> ''
    AND "COMPETITION" IS NOT NULL AND btrim("COMPETITION") <> ''
    AND "SEASON" IS NOT NULL AND btrim("SEASON") <> '';

CREATE INDEX IF NOT EXISTS int_trophy_general_type_idx ON "int_TROPHY_GENERAL" ("TYPE");
CREATE INDEX IF NOT EXISTS int_trophy_general_season_idx ON "int_TROPHY_GENERAL" ("SEASON");
CREATE INDEX IF NOT EXISTS int_trophy_general_game_idx ON "int_TROPHY_GENERAL" ("GAME");
CREATE INDEX IF NOT EXISTS int_trophy_general_champion_idx ON "int_TROPHY_GENERAL" ("CHAMPION");

CREATE OR REPLACE FUNCTION get_inttrophy_tables()
RETURNS TABLE (table_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name LIKE 'int\_%TROPHY%' ESCAPE '\'
  ORDER BY t.table_name;
$$;

ALTER TABLE "int_TROPHY_GENERAL" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all"
  ON "int_TROPHY_GENERAL"
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert for all"
  ON "int_TROPHY_GENERAL"
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update for all"
  ON "int_TROPHY_GENERAL"
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for all"
  ON "int_TROPHY_GENERAL"
  FOR DELETE
  TO public
  USING (true);
