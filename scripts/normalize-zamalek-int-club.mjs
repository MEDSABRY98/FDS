/**
 * Normalize Zamalek team name variants in int_club_MATCHDETAILS → "Zamalek - Egypt"
 * Usage: node scripts/normalize-zamalek-int-club.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const CANONICAL = "Zamalek - Egypt";
const VARIANTS = [
    "Zamalek - EGY",
    "Zamalek SC - EGY",
];

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

function buildMatchId(edition, teamA, teamB, han) {
    let base = [edition, teamA, teamB].map((v) => String(v ?? "").trim()).filter(Boolean).join("");
    if (han) base += han;
    return base;
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const before = await client.query(
    `SELECT "ROW_ID", "MATCH_ID", "Edition", "H-A-N", "TEAM A", "TEAM B"
     FROM "int_club_MATCHDETAILS"
     WHERE "TEAM A" = ANY($1::text[]) OR "TEAM B" = ANY($1::text[])
        OR "TEAM A" = $2 OR "TEAM B" = $2
     ORDER BY "ROW_ID"`,
    [VARIANTS, CANONICAL]
);

const toUpdate = before.rows.filter(
    (r) => VARIANTS.includes(r["TEAM A"]) || VARIANTS.includes(r["TEAM B"])
);

console.log(`Rows to update: ${toUpdate.length}`);
toUpdate.forEach((r) => {
    console.log(`  ${r.ROW_ID}: A="${r["TEAM A"]}" B="${r["TEAM B"]}"`);
});

if (toUpdate.length === 0) {
    console.log("Nothing to update.");
    await client.end();
    process.exit(0);
}

await client.query("BEGIN");

try {
    const teamAUpdate = await client.query(
        `UPDATE "int_club_MATCHDETAILS"
         SET "TEAM A" = $1
         WHERE "TEAM A" = ANY($2::text[])`,
        [CANONICAL, VARIANTS]
    );
    const teamBUpdate = await client.query(
        `UPDATE "int_club_MATCHDETAILS"
         SET "TEAM B" = $1
         WHERE "TEAM B" = ANY($2::text[])`,
        [CANONICAL, VARIANTS]
    );
    console.log(`Updated TEAM A: ${teamAUpdate.rowCount}, TEAM B: ${teamBUpdate.rowCount}`);

    const rowIds = toUpdate.map((r) => r.ROW_ID);
    const affected = await client.query(
        `SELECT "ROW_ID", "Edition", "H-A-N", "TEAM A", "TEAM B", "MATCH_ID"
         FROM "int_club_MATCHDETAILS"
         WHERE "ROW_ID" = ANY($1::text[])`,
        [rowIds]
    );

    const usedMatchIds = new Set(
        (
            await client.query(
                `SELECT "MATCH_ID" FROM "int_club_MATCHDETAILS"
                 WHERE NOT ("ROW_ID" = ANY($1::text[])) AND "MATCH_ID" IS NOT NULL`,
                [rowIds]
            )
        ).rows.map((r) => r.MATCH_ID)
    );

    const batchIds = new Set();
    let matchIdUpdates = 0;

    for (const row of affected.rows) {
        let newMatchId = buildMatchId(row.Edition, row["TEAM A"], row["TEAM B"], row["H-A-N"]);
        if (!newMatchId) newMatchId = row.ROW_ID;

        if (usedMatchIds.has(newMatchId) || batchIds.has(newMatchId)) {
            newMatchId = `${newMatchId}${row.ROW_ID}`;
        }

        batchIds.add(newMatchId);
        usedMatchIds.add(newMatchId);

        if (newMatchId !== row.MATCH_ID) {
            await client.query(
                `UPDATE "int_club_MATCHDETAILS" SET "MATCH_ID" = $1 WHERE "ROW_ID" = $2`,
                [newMatchId, row.ROW_ID]
            );
            matchIdUpdates++;
        }
    }

    console.log(`MATCH_ID updates: ${matchIdUpdates}`);

    const remaining = await client.query(
        `SELECT COUNT(*)::int AS n FROM "int_club_MATCHDETAILS"
         WHERE "TEAM A" = ANY($1::text[]) OR "TEAM B" = ANY($1::text[])`,
        [VARIANTS]
    );
    if (remaining.rows[0].n > 0) {
        throw new Error(`Still ${remaining.rows[0].n} rows with old variants`);
    }

    const canonicalCount = await client.query(
        `SELECT COUNT(*)::int AS n FROM "int_club_MATCHDETAILS"
         WHERE "TEAM A" = $1 OR "TEAM B" = $1`,
        [CANONICAL]
    );
    console.log(`Total "${CANONICAL}" rows now: ${canonicalCount.rows[0].n}`);

    await client.query("COMMIT");
    console.log(`Done. All variants normalized to "${CANONICAL}".`);
} catch (err) {
    await client.query("ROLLBACK");
    throw err;
} finally {
    await client.end();
}
