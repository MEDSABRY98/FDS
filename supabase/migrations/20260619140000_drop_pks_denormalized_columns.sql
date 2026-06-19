-- Remove denormalized match metadata from alahly_PKS.
-- Match context (DATE, CHAMPION, teams, etc.) is resolved at runtime
-- via MATCH_ID -> alahly_MATCHDETAILS.
--
-- Run only after all PKS shootouts have a valid MATCH_ID.

ALTER TABLE "alahly_PKS" DROP COLUMN IF EXISTS "DATE";
ALTER TABLE "alahly_PKS" DROP COLUMN IF EXISTS "CHAMPION SYSTEM";
ALTER TABLE "alahly_PKS" DROP COLUMN IF EXISTS "CHAMPION";
ALTER TABLE "alahly_PKS" DROP COLUMN IF EXISTS "SEASON";
ALTER TABLE "alahly_PKS" DROP COLUMN IF EXISTS "ROUND";
ALTER TABLE "alahly_PKS" DROP COLUMN IF EXISTS "AHLY TEAM";
ALTER TABLE "alahly_PKS" DROP COLUMN IF EXISTS "OPPONENT TEAM";
