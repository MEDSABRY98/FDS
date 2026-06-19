/**
 * Inspect ROUND values in int_club_MATCHDETAILS
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const env = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const all = await client.query(`SELECT DISTINCT "ROUND" FROM "int_club_MATCHDETAILS" WHERE "ROUND" IS NOT NULL ORDER BY 1`);
console.log("All distinct ROUND values:");
all.rows.forEach((r) => console.log(`  "${r.ROUND}"`));

const monthLike = await client.query(
    `SELECT "ROW_ID", "ROUND" FROM "int_club_MATCHDETAILS"
     WHERE "ROUND" ~* '^[0-9]{1,2}-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$'
     ORDER BY "ROW_ID"`
);
console.log(`\nMonth-like ROUND rows: ${monthLike.rows.length}`);
monthLike.rows.forEach((r) => console.log(`  ${r.ROW_ID}: ${r.ROUND}`));

await client.end();
