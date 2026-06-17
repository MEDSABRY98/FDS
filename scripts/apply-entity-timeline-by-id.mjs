import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(rootDir, ".env.local"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();

if (!url) {
    console.error("DATABASE_URL not found in .env.local");
    process.exit(1);
}

const sqlPath = path.join(rootDir, "supabase", "migrations", "20260619120000_entity_timeline_by_id.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(sql);

const sample = await client.rpc?.("get_entity_timeline_and_tables", {
    p_table: "db_PLAYERS",
    p_entity_id: "P-0001",
});

// pg client doesn't have rpc - use query instead
const { rows } = await client.query(
    `SELECT public.get_entity_timeline_and_tables('db_PLAYERS', NULL, 'P-0490') AS result`
);
console.log("Applied entity timeline by ID migration.");
console.log("Sample:", JSON.stringify(rows[0]?.result)?.slice(0, 200) || "no sample");

await client.end();
