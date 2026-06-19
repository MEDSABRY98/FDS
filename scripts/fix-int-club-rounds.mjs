/**
 * Fix ROUND values corrupted by Excel date formatting (e.g. 05-Jun → 5/6, 09-Dec → 9/12).
 * Usage: node scripts/fix-int-club-rounds.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

import { fixRoundValue, ROUND_MONTH_SQL } from "./lib/fix-round-value.mjs";

export { fixRoundValue };

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const rows = await client.query(
    `SELECT "ROW_ID", "ROUND" FROM "int_club_MATCHDETAILS"
     WHERE "ROUND" ~* $1
     ORDER BY "ROW_ID"`,
    [ROUND_MONTH_SQL]
);

console.log(`Rows to fix: ${rows.rows.length}`);

const updates = rows.rows.map((r) => ({
    rowId: r.ROW_ID,
    oldRound: r.ROUND,
    newRound: fixRoundValue(r.ROUND),
}));

updates.forEach((u) => console.log(`  ${u.rowId}: "${u.oldRound}" → "${u.newRound}"`));

if (updates.length === 0) {
    console.log("Nothing to update.");
    await client.end();
    process.exit(0);
}

await client.query("BEGIN");

try {
    for (const u of updates) {
        await client.query(
            `UPDATE "int_club_MATCHDETAILS" SET "ROUND" = $1 WHERE "ROW_ID" = $2`,
            [u.newRound, u.rowId]
        );
    }
    await client.query("COMMIT");
    console.log(`\nUpdated ${updates.length} rows.`);
} catch (err) {
    await client.query("ROLLBACK");
    throw err;
} finally {
    await client.end();
}
