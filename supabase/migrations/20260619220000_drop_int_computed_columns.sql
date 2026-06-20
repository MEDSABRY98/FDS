-- W-D-L and CLEAN SHEET are computed in the app from scores (Team A perspective).
-- Drop if they were added manually or from an old import.

ALTER TABLE "int_club_MATCHDETAILS" DROP COLUMN IF EXISTS "W-D-L";
ALTER TABLE "int_club_MATCHDETAILS" DROP COLUMN IF EXISTS "CLEAN SHEET";

ALTER TABLE "int_nt_MATCHDETAILS" DROP COLUMN IF EXISTS "W-D-L";
ALTER TABLE "int_nt_MATCHDETAILS" DROP COLUMN IF EXISTS "CLEAN SHEET";
