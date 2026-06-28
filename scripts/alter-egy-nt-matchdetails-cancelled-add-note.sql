-- Run in Supabase SQL Editor if the table already exists without NOTE.

ALTER TABLE public."egy_NT_MATCHDETAILS_CANCELLED"
  ADD COLUMN IF NOT EXISTS "NOTE" TEXT;
