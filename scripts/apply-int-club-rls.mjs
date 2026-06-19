/**
 * Adds RLS policies on int_club_MATCHDETAILS (required for anon/authenticated reads).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

function loadDatabaseUrl() {
    const env = fs.readFileSync(envPath, "utf8");
    for (const line of env.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        if (trimmed.slice(0, eq).trim() === "DATABASE_URL") {
            return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        }
    }
    throw new Error("DATABASE_URL missing in .env.local");
}

const sql = `
DO $$ BEGIN
  CREATE POLICY "Allow select for all" ON "int_club_MATCHDETAILS" FOR SELECT TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow insert for all" ON "int_club_MATCHDETAILS" FOR INSERT TO public WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow update for all" ON "int_club_MATCHDETAILS" FOR UPDATE TO public USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow delete for all" ON "int_club_MATCHDETAILS" FOR DELETE TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

const client = new pg.Client({ connectionString: loadDatabaseUrl(), ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("Applying int_club RLS policies...");
await client.query(sql);
await client.end();
console.log("Done.");
