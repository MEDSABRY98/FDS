-- International Club / NT: clear MATCH_ID if column still exists (optional).
-- Safe to run only when MATCH_ID column is present; skip if already dropped.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'int_club_MATCHDETAILS' AND column_name = 'MATCH_ID'
    ) THEN
        UPDATE "int_club_MATCHDETAILS" SET "MATCH_ID" = NULL WHERE "MATCH_ID" IS NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'int_nt_MATCHDETAILS' AND column_name = 'MATCH_ID'
    ) THEN
        UPDATE "int_nt_MATCHDETAILS" SET "MATCH_ID" = NULL WHERE "MATCH_ID" IS NOT NULL;
    END IF;
END $$;
