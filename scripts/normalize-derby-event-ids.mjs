import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const apply = process.argv.includes("--apply");
const reportPath = path.join(__dirname, "normalize-derby-event-ids-report.json");

const DERBY_OPPONENT = "T-0346";
const PLAYER_TABLE = "alahly_PLAYERDETAILS";
const GK_TABLE = "alahly_GKSDETAILS";
const PEN_TABLE = "alahly_HOWPENMISSED";
const MATCH_TABLE = "alahly_MATCHDETAILS";

function loadDatabaseUrl() {
    const env = fs.readFileSync(path.join(rootDir, ".env.local"), "utf8");
    const match = env.match(/^DATABASE_URL=(.+)$/m);
    if (!match) throw new Error("DATABASE_URL not found in .env.local");
    return match[1].trim();
}

function parseEOrder(eventId) {
    const m = String(eventId || "").match(/^E(\d+)_/);
    return m ? parseInt(m[1], 10) : null;
}

function buildOldToNew(matchId, events) {
    const oldToNew = new Map();
    for (const row of events) {
        const oldId = String(row.EVENT_ID || "").trim();
        const order = parseEOrder(oldId);
        if (!oldId || order == null) continue;
        oldToNew.set(oldId, `${matchId}-${order}`);
    }
    return oldToNew;
}

async function fetchNonStandardMatches(client) {
    const { rows } = await client.query(`
        WITH derby AS (
            SELECT m."MATCH_ID"
            FROM "${MATCH_TABLE}" m
            WHERE m."OPPONENT TEAM" = $1
        ),
        per_match AS (
            SELECT p."MATCH_ID",
                COUNT(*) FILTER (
                    WHERE p."EVENT_ID" ~ '^E[0-9]+_[0-9]+$'
                      AND p."EVENT_ID" !~ ('^' || p."MATCH_ID" || '-[0-9]+$')
                )::int AS non_standard
            FROM "${PLAYER_TABLE}" p
            JOIN derby d ON d."MATCH_ID" = p."MATCH_ID"
            GROUP BY p."MATCH_ID"
            HAVING COUNT(*) FILTER (
                WHERE p."EVENT_ID" ~ '^E[0-9]+_[0-9]+$'
                  AND p."EVENT_ID" !~ ('^' || p."MATCH_ID" || '-[0-9]+$')
            ) > 0
        )
        SELECT "MATCH_ID" FROM per_match ORDER BY "MATCH_ID"
    `, [DERBY_OPPONENT]);
    return rows.map((r) => r.MATCH_ID);
}

async function fetchMatchEvents(client, matchId) {
    const { rows } = await client.query(`
        SELECT "ROW_ID", "MATCH_ID", "EVENT_ID", "PARENT_EVENT_ID", "TYPE", "MINUTE"
        FROM "${PLAYER_TABLE}"
        WHERE "MATCH_ID" = $1
          AND "EVENT_ID" ~ '^E[0-9]+_[0-9]+$'
          AND "EVENT_ID" !~ ('^' || "MATCH_ID" || '-[0-9]+$')
        ORDER BY (substring("EVENT_ID" from '^E([0-9]+)_')::int), "ROW_ID"
    `, [matchId]);
    return rows;
}

async function fetchLinkedRows(client, table, matchId) {
    const { rows } = await client.query(`
        SELECT "ROW_ID", "EVENT_ID"
        FROM "${table}"
        WHERE "MATCH_ID" = $1
          AND "EVENT_ID" IS NOT NULL
          AND trim("EVENT_ID") <> ''
    `, [matchId]);
    return rows;
}

async function applyMatchNormalization(client, matchId, events, oldToNew, dryRun) {
    const playerUpdates = [];
    const gkUpdates = [];
    const penUpdates = [];

    for (const row of events) {
        const oldId = String(row.EVENT_ID || "").trim();
        const newId = oldToNew.get(oldId);
        if (!newId) continue;

        const oldParent = String(row.PARENT_EVENT_ID || "").trim();
        const newParent = oldParent ? (oldToNew.get(oldParent) || null) : null;

        playerUpdates.push({
            rowId: row.ROW_ID,
            oldEventId: oldId,
            newEventId: newId,
            oldParentEventId: oldParent || null,
            newParentEventId: newParent,
        });
    }

    const gkRows = await fetchLinkedRows(client, GK_TABLE, matchId);
    for (const row of gkRows) {
        const oldId = String(row.EVENT_ID || "").trim();
        const mapped = oldToNew.get(oldId);
        if (mapped) {
            gkUpdates.push({ rowId: row.ROW_ID, oldEventId: oldId, newEventId: mapped });
        }
    }

    const penRows = await fetchLinkedRows(client, PEN_TABLE, matchId);
    for (const row of penRows) {
        const oldId = String(row.EVENT_ID || "").trim();
        const mapped = oldToNew.get(oldId);
        if (mapped) {
            penUpdates.push({ rowId: row.ROW_ID, oldEventId: oldId, newEventId: mapped });
        }
    }

    if (dryRun) {
        return { playerUpdates, gkUpdates, penUpdates };
    }

    await client.query("BEGIN");
    try {
        for (const update of playerUpdates) {
            await client.query(
                `UPDATE "${PLAYER_TABLE}" SET "EVENT_ID" = $1 WHERE "ROW_ID" = $2`,
                [`__TEMP__${update.rowId}`, update.rowId]
            );
        }

        for (const update of playerUpdates) {
            await client.query(
                `UPDATE "${PLAYER_TABLE}" SET "EVENT_ID" = $1, "PARENT_EVENT_ID" = $2 WHERE "ROW_ID" = $3`,
                [update.newEventId, update.newParentEventId, update.rowId]
            );
        }

        for (const update of gkUpdates) {
            await client.query(
                `UPDATE "${GK_TABLE}" SET "EVENT_ID" = $1 WHERE "ROW_ID" = $2`,
                [update.newEventId, update.rowId]
            );
        }

        for (const update of penUpdates) {
            await client.query(
                `UPDATE "${PEN_TABLE}" SET "EVENT_ID" = $1 WHERE "ROW_ID" = $2`,
                [update.newEventId, update.rowId]
            );
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }

    return { playerUpdates, gkUpdates, penUpdates };
}

async function verify(client) {
    const nonStandard = await client.query(`
        SELECT COUNT(*)::int AS cnt
        FROM "${PLAYER_TABLE}" p
        JOIN "${MATCH_TABLE}" m ON m."MATCH_ID" = p."MATCH_ID"
        WHERE m."OPPONENT TEAM" = $1
          AND p."EVENT_ID" !~ ('^' || p."MATCH_ID" || '-[0-9]+$')
    `, [DERBY_OPPONENT]);

    const brokenParents = await client.query(`
        SELECT COUNT(*)::int AS cnt
        FROM "${PLAYER_TABLE}" p
        JOIN "${MATCH_TABLE}" m ON m."MATCH_ID" = p."MATCH_ID"
        WHERE m."OPPONENT TEAM" = $1
          AND p."PARENT_EVENT_ID" IS NOT NULL
          AND trim(p."PARENT_EVENT_ID") <> ''
          AND NOT EXISTS (
              SELECT 1 FROM "${PLAYER_TABLE}" c
              WHERE c."MATCH_ID" = p."MATCH_ID"
                AND c."EVENT_ID" = p."PARENT_EVENT_ID"
          )
    `, [DERBY_OPPONENT]);

    return {
        nonStandardEventIds: nonStandard.rows[0].cnt,
        brokenParentLinks: brokenParents.rows[0].cnt,
    };
}

async function main() {
    const client = new pg.Client({
        connectionString: loadDatabaseUrl(),
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    const matchIds = await fetchNonStandardMatches(client);
    const report = {
        mode: apply ? "apply" : "dry-run",
        generatedAt: new Date().toISOString(),
        derbyOpponent: DERBY_OPPONENT,
        matchesAffected: matchIds.length,
        playerRowsAffected: 0,
        gkRowsAffected: 0,
        penRowsAffected: 0,
        skippedEvents: [],
        sampleMappings: [],
        sampleParentRemaps: [],
        matchSummaries: [],
        errors: [],
    };

    console.log(`${apply ? "APPLY" : "DRY-RUN"}: ${matchIds.length} derby matches with non-standard EVENT_ID`);

    for (const matchId of matchIds) {
        try {
            const events = await fetchMatchEvents(client, matchId);
            const oldToNew = buildOldToNew(matchId, events);

            const skipped = events.filter((row) => {
                const oldId = String(row.EVENT_ID || "").trim();
                return parseEOrder(oldId) == null;
            });
            if (skipped.length) {
                report.skippedEvents.push(...skipped.map((r) => ({
                    matchId,
                    rowId: r.ROW_ID,
                    eventId: r.EVENT_ID,
                })));
            }

            const eligible = events.filter((row) => oldToNew.has(String(row.EVENT_ID || "").trim()));
            const { playerUpdates, gkUpdates, penUpdates } = await applyMatchNormalization(
                client,
                matchId,
                eligible,
                oldToNew,
                !apply
            );

            report.playerRowsAffected += playerUpdates.length;
            report.gkRowsAffected += gkUpdates.length;
            report.penRowsAffected += penUpdates.length;

            if (report.sampleMappings.length < 20 && playerUpdates.length) {
                for (const u of playerUpdates.slice(0, 3)) {
                    report.sampleMappings.push({
                        matchId,
                        old: u.oldEventId,
                        new: u.newEventId,
                    });
                }
            }

            for (const u of playerUpdates) {
                if (u.oldParentEventId && report.sampleParentRemaps.length < 15) {
                    report.sampleParentRemaps.push({
                        matchId,
                        oldParent: u.oldParentEventId,
                        newParent: u.newParentEventId,
                        eventId: u.newEventId,
                    });
                }
            }

            report.matchSummaries.push({
                matchId,
                playerRows: playerUpdates.length,
                gkRows: gkUpdates.length,
                penRows: penUpdates.length,
            });
        } catch (error) {
            report.errors.push({ matchId, message: error.message });
            console.error(`Error on ${matchId}:`, error.message);
        }
    }

    if (apply) {
        report.verification = await verify(client);
        console.log("Verification:", report.verification);
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

    console.log(`Player rows: ${report.playerRowsAffected}`);
    console.log(`GK rows: ${report.gkRowsAffected}`);
    console.log(`PEN rows: ${report.penRowsAffected}`);
    console.log(`Skipped events: ${report.skippedEvents.length}`);
    console.log(`Errors: ${report.errors.length}`);
    console.log(`Report: ${reportPath}`);

    await client.end();

    if (report.errors.length) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
