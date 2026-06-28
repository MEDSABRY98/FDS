-- Replace unknown manager placeholders (? / ؟) with catalog ID M-0524
-- in egy_NT_MATCHDETAILS — only when the cell is exactly ? or ؟ (after trim).
--
-- Run in Supabase SQL Editor:
--   1) Run the PREVIEW block first and confirm the rows.
--   2) Run the UPDATE block.

-- ── PREVIEW ──────────────────────────────────────────────────────────────────
SELECT
  "MATCH_ID",
  "DATE",
  "OPPONENT TEAM",
  "EGYPT MANAGER",
  "OPPONENT MANAGER",
  CASE
    WHEN trim("EGYPT MANAGER") IN ('?', '؟') THEN 'EGYPT MANAGER'
    ELSE NULL
  END AS will_update_egypt,
  CASE
    WHEN trim("OPPONENT MANAGER") IN ('?', '؟') THEN 'OPPONENT MANAGER'
    ELSE NULL
  END AS will_update_opponent
FROM public."egy_NT_MATCHDETAILS"
WHERE trim("EGYPT MANAGER") IN ('?', '؟')
   OR trim("OPPONENT MANAGER") IN ('?', '؟')
ORDER BY "DATE", "MATCH_ID";

-- Count summary
SELECT
  count(*) FILTER (WHERE trim("EGYPT MANAGER") IN ('?', '؟')) AS egypt_manager_rows,
  count(*) FILTER (WHERE trim("OPPONENT MANAGER") IN ('?', '؟')) AS opponent_manager_rows
FROM public."egy_NT_MATCHDETAILS";

-- Optional: confirm M-0524 exists in the managers catalog
SELECT "MANAGER_ID", "MANAGER_NAME", "MANAGER_NAME_EN"
FROM public."db_MANAGERS"
WHERE "MANAGER_ID" = 'M-0524';

-- ── UPDATE ───────────────────────────────────────────────────────────────────
BEGIN;

UPDATE public."egy_NT_MATCHDETAILS"
SET "EGYPT MANAGER" = 'M-0524'
WHERE trim("EGYPT MANAGER") IN ('?', '؟');

UPDATE public."egy_NT_MATCHDETAILS"
SET "OPPONENT MANAGER" = 'M-0524'
WHERE trim("OPPONENT MANAGER") IN ('?', '؟');

COMMIT;

-- ── VERIFY (should return 0 rows) ────────────────────────────────────────────
SELECT "MATCH_ID", "EGYPT MANAGER", "OPPONENT MANAGER"
FROM public."egy_NT_MATCHDETAILS"
WHERE trim("EGYPT MANAGER") IN ('?', '؟')
   OR trim("OPPONENT MANAGER") IN ('?', '؟');
