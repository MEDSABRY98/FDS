CREATE TABLE IF NOT EXISTS "int_club_MATCHDETAILS" (
  "ROW_ID" text PRIMARY KEY,
  "MATCH_ID" text,
  "GAME" text,
  "KIND" text,
  "Edition" text,
  "ROUND" text,
  "H-A-N" text,
  "TEAM A" text,
  "TEAM A CONTINENT" text,
  "GF" integer,
  "GA" integer,
  "PEN" text,
  "TEAM B" text,
  "TEAM B CONTINENT" text,
  "NOTE" text
);

CREATE UNIQUE INDEX IF NOT EXISTS int_club_matchdetails_match_id_uidx
  ON "int_club_MATCHDETAILS" ("MATCH_ID")
  WHERE "MATCH_ID" IS NOT NULL AND btrim("MATCH_ID") <> '';

CREATE INDEX IF NOT EXISTS int_club_matchdetails_edition_idx ON "int_club_MATCHDETAILS" ("Edition");
CREATE INDEX IF NOT EXISTS int_club_matchdetails_game_idx ON "int_club_MATCHDETAILS" ("GAME");

CREATE OR REPLACE FUNCTION get_intclub_tables()
RETURNS TABLE (table_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name LIKE 'int\_club\_%' ESCAPE '\'
  ORDER BY t.table_name;
$$;

ALTER TABLE "int_club_MATCHDETAILS" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all"
  ON "int_club_MATCHDETAILS"
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert for all"
  ON "int_club_MATCHDETAILS"
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update for all"
  ON "int_club_MATCHDETAILS"
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for all"
  ON "int_club_MATCHDETAILS"
  FOR DELETE
  TO public
  USING (true);

