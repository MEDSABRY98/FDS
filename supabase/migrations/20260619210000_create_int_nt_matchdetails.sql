CREATE TABLE IF NOT EXISTS "int_nt_MATCHDETAILS" (
  "ROW_ID" text PRIMARY KEY,
  "MATCH_ID" text,
  "GAME" text,
  "AGE" text,
  "SEASON" text,
  "HOST COUNTRY" text,
  "DATE" text,
  "CATEGORY" text,
  "ROUND" text,
  "TEAMA" text,
  "TEAMA CONTINENT" text,
  "TEAMASCORE" integer,
  "TEAMBSCORE" integer,
  "TEAMAPEN" text,
  "TEAMBPEN" text,
  "TEAMB" text,
  "TEAMB CONTINENT" text
);

CREATE UNIQUE INDEX IF NOT EXISTS int_nt_matchdetails_match_id_uidx
  ON "int_nt_MATCHDETAILS" ("MATCH_ID")
  WHERE "MATCH_ID" IS NOT NULL AND btrim("MATCH_ID") <> '';

CREATE INDEX IF NOT EXISTS int_nt_matchdetails_season_idx ON "int_nt_MATCHDETAILS" ("SEASON");
CREATE INDEX IF NOT EXISTS int_nt_matchdetails_game_idx ON "int_nt_MATCHDETAILS" ("GAME");
CREATE INDEX IF NOT EXISTS int_nt_matchdetails_date_idx ON "int_nt_MATCHDETAILS" ("DATE");

CREATE OR REPLACE FUNCTION get_intnt_tables()
RETURNS TABLE (table_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name LIKE 'int\_nt\_%' ESCAPE '\'
  ORDER BY t.table_name;
$$;

ALTER TABLE "int_nt_MATCHDETAILS" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all"
  ON "int_nt_MATCHDETAILS"
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert for all"
  ON "int_nt_MATCHDETAILS"
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update for all"
  ON "int_nt_MATCHDETAILS"
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for all"
  ON "int_nt_MATCHDETAILS"
  FOR DELETE
  TO public
  USING (true);
