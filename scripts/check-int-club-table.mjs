import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const get = (key) => {
    const m = env.match(new RegExp(`^${key}=(.+)$`, "m"));
    return m?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
};

const databaseUrl = get("DATABASE_URL");
const supabaseUrl = get("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const pgClient = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await pgClient.connect();

const count = await pgClient.query('SELECT COUNT(*)::int AS n FROM "int_club_MATCHDETAILS"');
console.log("postgres row_count:", count.rows[0].n);

const rls = await pgClient.query(
    `SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relname = 'int_club_MATCHDETAILS' AND n.nspname = 'public'`
);
console.log("rls:", rls.rows[0]);

const grants = await pgClient.query(
    `SELECT grantee, privilege_type FROM information_schema.role_table_grants
     WHERE table_schema='public' AND table_name='int_club_MATCHDETAILS'`
);
console.log("grants:", grants.rows);

const egyRls = await pgClient.query(
    `SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relname = 'egy_CLUB_MATCHDETAILS' AND n.nspname = 'public'`
);
console.log("egy_CLUB_MATCHDETAILS rls:", egyRls.rows[0]);

const egyGrants = await pgClient.query(
    `SELECT grantee, privilege_type FROM information_schema.role_table_grants
     WHERE table_schema='public' AND table_name='egy_CLUB_MATCHDETAILS' LIMIT 10`
);
console.log("egy_CLUB grants sample:", egyGrants.rows);

const policies = await pgClient.query(
    `SELECT tablename, policyname, roles, cmd, qual FROM pg_policies
     WHERE tablename IN ('int_club_MATCHDETAILS', 'egy_CLUB_MATCHDETAILS')
     ORDER BY tablename, policyname`
);
console.log("policies:", policies.rows);

await pgClient.end();

const supabase = createClient(supabaseUrl, anonKey);
const { data, error } = await supabase.from("int_club_MATCHDETAILS").select("*").limit(3);
console.log("anon select error:", error?.message ?? null);
console.log("anon select rows:", data?.length ?? 0);
