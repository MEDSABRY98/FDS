/**
 * Inspect ROUND values across match tables.
 * Usage: node scripts/inspect-match-rounds.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { ROUND_MONTH_SQL } from "./lib/fix-round-value.mjs";

const TABLES = [
    "alahly_MATCHDETAILS",
    "egy_NT_MATCHDETAILS",
    "egy_CLUB_MATCHDETAILS",
    "int_club_MATCHDETAILS",
];

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const table of TABLES) {
    console.log(`\n=== ${table} ===`);
    const monthLike = await client.query(
        `SELECT "ROW_ID", "ROUND" FROM "${table}"
         WHERE "ROUND" ~* $1
         ORDER BY "ROW_ID"`,
        [ROUND_MONTH_SQL]
    );
    console.log(`Month-like ROUND rows: ${monthLike.rows.length}`);
    monthLike.rows.slice(0, 15).forEach((r) => console.log(`  ${r.ROW_ID}: ${r.ROUND}`));
    if (monthLike.rows.length > 15) console.log(`  ... and ${monthLike.rows.length - 15} more`);
}

await client.end();
