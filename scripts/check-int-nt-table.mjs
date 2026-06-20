/**
 * Verify int_nt_MATCHDETAILS table and sample data.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const count = await client.query('SELECT COUNT(*)::int AS n FROM "int_nt_MATCHDETAILS"');
console.log("Row count:", count.rows[0].n);

const cols = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='int_nt_MATCHDETAILS'
     ORDER BY ordinal_position`
);
console.log("Columns:", cols.rows.map((r) => r.column_name).join(", "));

const sample = await client.query('SELECT "ROW_ID", "TEAMA", "TEAMB", "SEASON", "DATE" FROM "int_nt_MATCHDETAILS" LIMIT 3');
console.log("Sample:", sample.rows);

await client.end();
