-- Run in Supabase SQL Editor to create the cancelled matches table.
-- Table appears automatically in get_egyptnt_tables (egy_NT_* prefix).

CREATE TABLE IF NOT EXISTS public."egy_NT_MATCHDETAILS_CANCELLED" (
  "ROW_ID" TEXT PRIMARY KEY,
  "DATE" TEXT,
  "SEASON" TEXT,
  "ROUND" TEXT,
  "PLACE" TEXT,
  "Egypt TEAM" TEXT,
  "GF" TEXT,
  "GA" TEXT,
  "OPPONENT TEAM" TEXT,
  "NOTE" TEXT
);

ALTER TABLE public."egy_NT_MATCHDETAILS_CANCELLED" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on egy_NT_MATCHDETAILS_CANCELLED"
  ON public."egy_NT_MATCHDETAILS_CANCELLED";
DROP POLICY IF EXISTS "Allow authenticated insert on egy_NT_MATCHDETAILS_CANCELLED"
  ON public."egy_NT_MATCHDETAILS_CANCELLED";
DROP POLICY IF EXISTS "Allow authenticated update on egy_NT_MATCHDETAILS_CANCELLED"
  ON public."egy_NT_MATCHDETAILS_CANCELLED";
DROP POLICY IF EXISTS "Allow authenticated delete on egy_NT_MATCHDETAILS_CANCELLED"
  ON public."egy_NT_MATCHDETAILS_CANCELLED";

CREATE POLICY "Allow public read on egy_NT_MATCHDETAILS_CANCELLED"
  ON public."egy_NT_MATCHDETAILS_CANCELLED"
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on egy_NT_MATCHDETAILS_CANCELLED"
  ON public."egy_NT_MATCHDETAILS_CANCELLED"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on egy_NT_MATCHDETAILS_CANCELLED"
  ON public."egy_NT_MATCHDETAILS_CANCELLED"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on egy_NT_MATCHDETAILS_CANCELLED"
  ON public."egy_NT_MATCHDETAILS_CANCELLED"
  FOR DELETE
  USING (true);

-- If table already exists without NOTE:
-- ALTER TABLE public."egy_NT_MATCHDETAILS_CANCELLED" ADD COLUMN IF NOT EXISTS "NOTE" TEXT;
