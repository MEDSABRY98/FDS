-- Remove denormalized match metadata from egy_NT_PKS.
-- Match context is resolved at runtime via MATCH_ID -> egy_NT_MATCHDETAILS.

ALTER TABLE "egy_NT_PKS" DROP COLUMN IF EXISTS "CHAMPION System";
ALTER TABLE "egy_NT_PKS" DROP COLUMN IF EXISTS "Egypt TEAM";
ALTER TABLE "egy_NT_PKS" DROP COLUMN IF EXISTS "OPPONENT TEAM";
