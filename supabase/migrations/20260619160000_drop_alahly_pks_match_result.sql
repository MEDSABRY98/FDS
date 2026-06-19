-- Remove MATCH RESULT from alahly_PKS (match score comes from alahly_MATCHDETAILS via MATCH_ID).

ALTER TABLE "alahly_PKS" DROP COLUMN IF EXISTS "MATCH RESULT";
