-- Replace unknown referee placeholders (? / ؟) with catalog ID REF-0530
-- in egy_NT_MATCHDETAILS.REFREE — only when the cell is exactly ? or ؟ (after trim).
--
-- Run in Supabase SQL Editor:
--   1) Run the PREVIEW block first and confirm the rows.
--   2) Run the UPDATE block.

-- ── PREVIEW ──────────────────────────────────────────────────────────────────
SELECT
  "MATCH_ID",
  "DATE",
  "OPPONENT TEAM",
  "REFREE"
FROM public."egy_NT_MATCHDETAILS"
WHERE trim("REFREE") IN ('?', '؟')
ORDER BY "DATE", "MATCH_ID";

SELECT count(*) AS referee_placeholder_rows
FROM public."egy_NT_MATCHDETAILS"
WHERE trim("REFREE") IN ('?', '؟');

SELECT "REFEREE_ID", "REFEREE_NAME", "REFEREE_NAME_EN"
FROM public."db_REFEREES"
WHERE "REFEREE_ID" = 'REF-0530';

-- ── UPDATE ───────────────────────────────────────────────────────────────────
BEGIN;

UPDATE public."egy_NT_MATCHDETAILS"
SET "REFREE" = 'REF-0530'
WHERE trim("REFREE") IN ('?', '؟');

COMMIT;

-- ── VERIFY (should return 0 rows) ────────────────────────────────────────────
SELECT "MATCH_ID", "REFREE"
FROM public."egy_NT_MATCHDETAILS"
WHERE trim("REFREE") IN ('?', '؟');
