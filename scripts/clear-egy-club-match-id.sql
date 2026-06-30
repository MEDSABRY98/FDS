-- Egypt Clubs: stop using MATCH_ID (identity is ROW_ID only).
-- Safe to run; MATCH_ID column can remain in the table unused.
UPDATE "egy_CLUB_MATCHDETAILS"
SET "MATCH_ID" = NULL
WHERE "MATCH_ID" IS NOT NULL;
