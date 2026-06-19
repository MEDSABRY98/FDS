/**
 * Fix ROUND values corrupted by Excel date formatting across match tables.
 * Usage: node scripts/fix-match-rounds.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { fixRoundValue, ROUND_MONTH_SQL } from "./lib/fix-round-value.mjs";

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

let totalUpdated = 0;

await client.query("BEGIN");

try {
    for (const table of TABLES) {
        const rows = await client.query(
            `SELECT "ROW_ID", "ROUND" FROM "${table}"
             WHERE "ROUND" ~* $1
             ORDER BY "ROW_ID"`,
            [ROUND_MONTH_SQL]
        );

        if (rows.rows.length === 0) {
            console.log(`${table}: nothing to fix`);
            continue;
        }

        console.log(`\n${table}: ${rows.rows.length} rows`);
        for (const r of rows.rows) {
            const newRound = fixRoundValue(r.ROUND);
            console.log(`  ${r.ROW_ID}: "${r.ROUND}" → "${newRound}"`);
            await client.query(
                `UPDATE "${table}" SET "ROUND" = $1 WHERE "ROW_ID" = $2`,
                [newRound, r.ROW_ID]
            );
            totalUpdated += 1;
        }
    }

    await client.query("COMMIT");
    console.log(`\nUpdated ${totalUpdated} rows total.`);
} catch (err) {
    await client.query("ROLLBACK");
    throw err;
} finally {
    await client.end();
}
