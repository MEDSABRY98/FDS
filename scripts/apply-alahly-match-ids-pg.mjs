/**
 * Apply Al Ahly MATCH_ID migration via direct Postgres (DATABASE_URL).
 * Fast bulk SQL — no per-row updates.
 */
import { readFileSync } from "fs";
import pg from "pg";
import {
    buildMatchMigrationPlan,
    buildTeamIdLookupMap,
} from "./lib/alahly-match-id-migration.mjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL is required in .env.local");
    process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const LINKED_TABLES = [
    "alahly_LINEUPDETAILS",
    "alahly_PLAYERDETAILS",
    "alahly_GKSDETAILS",
    "alahly_PKS",
    "alahly_MEDIATRACKER",
];

const ALL_TABLES = ["alahly_MATCHDETAILS", ...LINKED_TABLES];

async function fetchAll(table, columns) {
    const { rows } = await client.query(`SELECT ${columns} FROM "${table}"`);
    return rows;
}

async function runSqlFile(path) {
    await client.query(readFileSync(path, "utf8"));
    console.log(`SQL OK: ${path}`);
}

async function main() {
    await client.connect();
    console.log("=== APPLY (Postgres bulk) ===");

    await client.query("SET statement_timeout = 0");
    await runSqlFile("scripts/alter-alahly-match-id-temp.sql");

    const teams = await fetchAll("db_TEAMS", '"TEAM_ID", "TEAM_NAME", "TEAM_NAME_EN"');
    const plan = buildMatchMigrationPlan(
        await fetchAll("alahly_MATCHDETAILS", '"ROW_ID", "MATCH_ID", "OPPONENT TEAM", "DATE"'),
        buildTeamIdLookupMap(teams)
    );

    if (plan.stats.unresolved > 0) throw new Error(`Unresolved: ${plan.stats.unresolved}`);
    if (plan.stats.collisions > 0) throw new Error(`Collisions: ${plan.stats.collisions}`);

    const toChange = plan.rows.filter((r) => r.needsChange && r.rowId && r.proposedMatchId);
    console.log(JSON.stringify(plan.stats, null, 2));
    if (!toChange.length) {
        console.log("Nothing to migrate.");
        await client.end();
        return;
    }

    await client.query("BEGIN");

    try {
        await client.query(`
            CREATE TEMP TABLE match_id_mig (
                row_id text PRIMARY KEY,
                old_id text NOT NULL,
                new_id text NOT NULL
            ) ON COMMIT DROP
        `);

        const chunkSize = 500;
        for (let i = 0; i < toChange.length; i += chunkSize) {
            const chunk = toChange.slice(i, i + chunkSize);
            const values = [];
            const params = [];
            let p = 1;
            chunk.forEach((row) => {
                values.push(`($${p++}, $${p++}, $${p++})`);
                params.push(row.rowId, row.currentMatchId, row.proposedMatchId);
            });
            await client.query(
                `INSERT INTO match_id_mig (row_id, old_id, new_id) VALUES ${values.join(", ")}`,
                params
            );
        }
        console.log(`Migration map rows: ${toChange.length}`);

        for (const table of ALL_TABLES) {
            const res = await client.query(`
                UPDATE "${table}" t
                SET "MATCH_ID_TEMP" = t."MATCH_ID"
                WHERE t."MATCH_ID" IS NOT NULL AND t."MATCH_ID" <> ''
            `);
            console.log(`MATCH_ID_TEMP: ${table} (${res.rowCount})`);
        }

        const interim = await client.query(`
            UPDATE "alahly_MATCHDETAILS" m
            SET "MATCH_ID" = '__MIG__' || m."ROW_ID"
            FROM match_id_mig mig
            WHERE m."ROW_ID" = mig.row_id
        `);
        console.log(`Master interim: ${interim.rowCount}`);

        const master = await client.query(`
            UPDATE "alahly_MATCHDETAILS" m
            SET "MATCH_ID" = mig.new_id, "MATCH_ID_TEMP" = mig.old_id
            FROM match_id_mig mig
            WHERE m."ROW_ID" = mig.row_id
        `);
        console.log(`Master final: ${master.rowCount}`);

        for (const table of LINKED_TABLES) {
            const res = await client.query(`
                UPDATE "${table}" child
                SET "MATCH_ID" = mig.new_id
                FROM match_id_mig mig
                WHERE child."MATCH_ID" = mig.old_id
            `);
            console.log(`Linked ${table}: ${res.rowCount}`);
        }

        const players = await client.query(`
            UPDATE "alahly_PLAYERDETAILS" p
            SET
                "EVENT_ID" = REPLACE(p."EVENT_ID", mig.old_id, mig.new_id),
                "PARENT_EVENT_ID" = REPLACE(p."PARENT_EVENT_ID", mig.old_id, mig.new_id),
                "HOW MISSED" = REPLACE(p."HOW MISSED", mig.old_id, mig.new_id)
            FROM match_id_mig mig
            WHERE p."MATCH_ID" = mig.new_id
              AND (
                    p."EVENT_ID" LIKE mig.old_id || '%'
                 OR p."PARENT_EVENT_ID" LIKE mig.old_id || '%'
                 OR p."HOW MISSED" LIKE mig.old_id || '%'
              )
        `);
        console.log(`EVENT_ID players: ${players.rowCount}`);

        const gks = await client.query(`
            UPDATE "alahly_GKSDETAILS" g
            SET "EVENT_ID" = REPLACE(g."EVENT_ID", mig.old_id, mig.new_id)
            FROM match_id_mig mig
            WHERE g."MATCH_ID" = mig.new_id
              AND g."EVENT_ID" LIKE '%' || mig.old_id || '%'
        `);
        console.log(`EVENT_ID gks: ${gks.rowCount}`);

        await client.query("COMMIT");
        console.log("COMMIT OK");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error("FAILED:", err.message || err);
    process.exit(1);
});
