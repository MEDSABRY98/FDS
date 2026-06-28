-- Replace unknown placeholders (? / ؟) in alahly_MATCHDETAILS:
--   AHLY MANAGER, OPPONENT MANAGER -> M-0524
--   REFREE -> REF-0530
-- Only when the cell is exactly ? or ؟ (after trim).

-- ── PREVIEW ──────────────────────────────────────────────────────────────────
SELECT
  "MATCH_ID",
  "DATE",
  "OPPONENT TEAM",
  "AHLY MANAGER",
  "OPPONENT MANAGER",
  "REFREE"
FROM public."alahly_MATCHDETAILS"
WHERE trim("AHLY MANAGER") IN ('?', '؟')
   OR trim("OPPONENT MANAGER") IN ('?', '؟')
   OR trim("REFREE") IN ('?', '؟')
ORDER BY "DATE", "MATCH_ID";

SELECT
  count(*) FILTER (WHERE trim("AHLY MANAGER") IN ('?', '؟')) AS ahly_manager_rows,
  count(*) FILTER (WHERE trim("OPPONENT MANAGER") IN ('?', '؟')) AS opponent_manager_rows,
  count(*) FILTER (WHERE trim("REFREE") IN ('?', '؟')) AS referee_rows
FROM public."alahly_MATCHDETAILS";

-- ── UPDATE ───────────────────────────────────────────────────────────────────
BEGIN;

UPDATE public."alahly_MATCHDETAILS"
SET "AHLY MANAGER" = 'M-0524'
WHERE trim("AHLY MANAGER") IN ('?', '؟');

UPDATE public."alahly_MATCHDETAILS"
SET "OPPONENT MANAGER" = 'M-0524'
WHERE trim("OPPONENT MANAGER") IN ('?', '؟');

UPDATE public."alahly_MATCHDETAILS"
SET "REFREE" = 'REF-0530'
WHERE trim("REFREE") IN ('?', '؟');

COMMIT;

-- ── VERIFY (should return 0 rows) ────────────────────────────────────────────
SELECT "MATCH_ID", "AHLY MANAGER", "OPPONENT MANAGER", "REFREE"
FROM public."alahly_MATCHDETAILS"
WHERE trim("AHLY MANAGER") IN ('?', '؟')
   OR trim("OPPONENT MANAGER") IN ('?', '؟')
   OR trim("REFREE") IN ('?', '؟');
