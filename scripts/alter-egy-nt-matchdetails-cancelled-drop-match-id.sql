-- Run in Supabase SQL Editor if the table already has MATCH_ID.

ALTER TABLE public."egy_NT_MATCHDETAILS_CANCELLED"
  DROP COLUMN IF EXISTS "MATCH_ID";
