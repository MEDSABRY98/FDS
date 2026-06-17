import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");
const reportPath = path.join(__dirname, "migrate-finals-to-alahly-report.json");

const F_MATCH = "alahly_FINALS_MATCHDETAILS";
const F_LINEUP = "alahly_FINALS_LINEUPDETAILS";
const F_PLAYER = "alahly_FINALS_PLAYERDETAILS";
const A_MATCH = "alahly_MATCHDETAILS";
const A_LINEUP = "alahly_LINEUPDETAILS";
const A_PLAYER = "alahly_PLAYERDETAILS";
const TEAMS = "db_TEAMS";

const MATCH_INSERT_COLS = [
    "ROW_ID", "MATCH_ID", "DATE", "CHAMPION", "SEASON - NAME", "SEASON - NUMBER",
    "AHLY MANAGER", "OPPONENT MANAGER", "REFREE", "ROUND", "H-A-N", "STAD",
    "AHLY TEAM", "GF", "GA", "ET", "PEN", "OPPONENT TEAM", "NOTE", "CHAMPION SYSTEM",
    "FINAL_ID", "W-D-L FINAL",
];

const LINEUP_INSERT_COLS = [
    "ROW_ID", "MATCH_ID", "MATCH MINUTE", "TEAM", "PLAYER NAME", "STATU",
    "PLAYER NAME OUT", "OUT MINUTE", "TOTAL MINUTE", "FINAL_ID",
];

const PLAYER_INSERT_COLS = [
    "ROW_ID", "MATCH_ID", "EVENT_ID", "PARENT_EVENT_ID", "PLAYER NAME", "TEAM",
    "TYPE", "TYPE_SUB", "MINUTE", "FINAL_ID",
];

function loadDatabaseUrl() {
    const env = fs.readFileSync(path.join(rootDir, ".env.local"), "utf8");
    const match = env.match(/^DATABASE_URL=(.+)$/m);
    if (!match) throw new Error("DATABASE_URL not found in .env.local");
    return match[1].trim();
}

function trimVal(v) {
    return v == null ? "" : String(v).trim();
}

function parseTrailingIdNumber(rowId) {
    const m = String(rowId || "").match(/(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
}

function parseEOrder(eventId) {
    const m = String(eventId || "").match(/^E(\d+)_/i);
    return m ? parseInt(m[1], 10) : null;
}

function parseESuffix(eventId) {
    const m = String(eventId || "").match(/^E\d+_(.+)$/i);
    return m ? m[1] : null;
}

function isFinalRound(round) {
    const r = trimVal(round).toLowerCase();
    return r.includes("final") || r.includes("نهائي");
}

function normFinalsDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    const s = trimVal(value);
    if (!s) return null;
    const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
    }
    return null;
}

function legKey(finalId, normDate) {
    return `${trimVal(finalId).toUpperCase()}|${normDate || ""}`;
}

function eventKey(matchId, eventId) {
    return `${trimVal(matchId)}|${trimVal(eventId)}`;
}

function scoreKey(gf, ga) {
    return `${trimVal(gf)}|${trimVal(ga)}`;
}

function allocateRowId(counter) {
    counter.n += 1;
    return `R-${String(counter.n).padStart(4, "0")}`;
}

function buildOldToNewEventMap(matchId, rows) {
    const oldToNew = new Map();
    for (const row of rows) {
        const oldId = trimVal(row.EVENT_ID);
        const order = parseEOrder(oldId);
        if (!oldId || order == null) continue;
        oldToNew.set(oldId, `${matchId}-${order}`);
    }
    return oldToNew;
}

function mapEventId(row, matchId, oldToNew) {
    const oldId = trimVal(row.EVENT_ID);
    if (!oldId) return { eventId: null, parentEventId: trimVal(row.PARENT_EVENT_ID) || null };
    if (oldToNew.has(oldId)) {
        const newId = oldToNew.get(oldId);
        const oldParent = trimVal(row.PARENT_EVENT_ID);
        const newParent = oldParent ? (oldToNew.get(oldParent) || null) : null;
        return { eventId: newId, parentEventId: newParent };
    }
    if (/^E\d+_/i.test(oldId)) {
        const order = parseEOrder(oldId);
        if (order != null) return { eventId: `${matchId}-${order}`, parentEventId: null };
    }
    return { eventId: oldId, parentEventId: trimVal(row.PARENT_EVENT_ID) || null };
}

async function loadTeams(client) {
    const { rows } = await client.query(`SELECT "TEAM_ID", "TEAM_NAME" FROM "${TEAMS}"`);
    const idToName = new Map();
    for (const row of rows) {
        idToName.set(trimVal(row.TEAM_ID), trimVal(row.TEAM_NAME));
    }
    return idToName;
}

function opponentBaseName(opponent, teams) {
    const raw = trimVal(opponent);
    if (!raw) return "";
    if (/^T-\d+/i.test(raw)) {
        return teams.get(raw) || "";
    }
    return raw;
}

function computeNextMatchNum(matches) {
    let max = 0;
    for (const row of matches) {
        max = Math.max(max, parseTrailingIdNumber(row.MATCH_ID));
    }
    return max + 1;
}

function computeRowCounter(rows) {
    let max = 0;
    for (const row of rows) {
        max = Math.max(max, parseTrailingIdNumber(row.ROW_ID));
    }
    return { n: max };
}

function buildAlahlyIndexes(alahlyMatches) {
    const byMatchId = new Map();
    const fallback = new Map();

    for (const row of alahlyMatches) {
        const mid = trimVal(row.MATCH_ID);
        if (mid) byMatchId.set(mid, row);

        const nd = trimVal(row.DATE_NORM) || normFinalsDate(row.DATE);
        if (!nd) continue;
        const key = `${nd}|${trimVal(row["OPPONENT TEAM"])}|${scoreKey(row.GF, row.GA)}`;
        if (!fallback.has(key)) fallback.set(key, []);
        fallback.get(key).push(row);
    }

    return { byMatchId, fallback };
}

function resolveBackfillMatch(finalRow, indexes) {
    const directMid = trimVal(finalRow.MATCH_ID);
    if (directMid && indexes.byMatchId.has(directMid)) {
        return { match: indexes.byMatchId.get(directMid), method: "match_id", ambiguous: [] };
    }

    const nd = normFinalsDate(finalRow.DATE);
    if (!nd) return { match: null, method: null, ambiguous: [] };

    const key = `${nd}|${trimVal(finalRow["OPPONENT TEAM"])}|${scoreKey(finalRow.GF, finalRow.GA)}`;
    const candidates = (indexes.fallback.get(key) || []).filter((row) => isFinalRound(row.ROUND));

    if (candidates.length === 1) {
        return { match: candidates[0], method: "fallback", ambiguous: [] };
    }
    if (candidates.length > 1) {
        return { match: null, method: "fallback", ambiguous: candidates.map((c) => c.MATCH_ID) };
    }
    return { match: null, method: null, ambiguous: [] };
}

function pickFinalId(row) {
    return trimVal(row.FINAL_ID || row["FINAL ID"]);
}

function sortFinalsMatches(rows) {
    return [...rows].sort((a, b) => {
        const fa = trimVal(a.FINAL_ID);
        const fb = trimVal(b.FINAL_ID);
        if (fa !== fb) return fa.localeCompare(fb);
        const da = normFinalsDate(a.DATE) || "";
        const db = normFinalsDate(b.DATE) || "";
        return da.localeCompare(db);
    });
}

function resolveMatchIdForChild(row, ctx) {
    const direct = trimVal(row.MATCH_ID);
    if (direct) return { matchId: direct, method: "direct" };

    const finalId = pickFinalId(row);
    const nd = normFinalsDate(row.DATE);
    if (finalId && nd) {
        const fromLeg = ctx.legMap.get(legKey(finalId, nd));
        if (fromLeg) return { matchId: fromLeg, method: "leg_map" };
    }

    if (finalId && ctx.firstLegMatchId.has(finalId)) {
        return { matchId: ctx.firstLegMatchId.get(finalId), method: "first_leg" };
    }

    const suffix = parseESuffix(row.EVENT_ID);
    if (finalId && suffix) {
        const ids = ctx.matchIdsByFinalId.get(finalId) || [];
        for (const mid of ids) {
            if (trimVal(mid).endsWith(suffix)) {
                return { matchId: mid, method: "e_suffix" };
            }
        }
    }

    return { matchId: null, method: null };
}

function buildInsertMatchRow(finalRow, rowId, matchId) {
    const out = {
        ROW_ID: rowId,
        MATCH_ID: matchId,
        DATE: normFinalsDate(finalRow.DATE),
        CHAMPION: finalRow.CHAMPION ?? null,
        "SEASON - NAME": finalRow["SEASON - NAME"] ?? null,
        "SEASON - NUMBER": finalRow["SEASON - NUMBER"] ?? null,
        "AHLY MANAGER": finalRow["AHLY MANAGER"] ?? null,
        "OPPONENT MANAGER": finalRow["OPPONENT MANAGER"] ?? null,
        REFREE: finalRow.REFREE ?? null,
        ROUND: "النهائي",
        "H-A-N": finalRow["H-A-N"] ?? null,
        STAD: null,
        "AHLY TEAM": finalRow["AHLY TEAM"] ?? null,
        GF: finalRow.GF ?? null,
        GA: finalRow.GA ?? null,
        ET: finalRow.ET ?? null,
        PEN: finalRow.PEN ?? null,
        "OPPONENT TEAM": finalRow["OPPONENT TEAM"] ?? null,
        NOTE: null,
        "CHAMPION SYSTEM": finalRow["CHAMPION SYSTEM"] ?? null,
        FINAL_ID: trimVal(finalRow.FINAL_ID) || null,
        "W-D-L FINAL": finalRow["W-D-L FINAL"] ?? null,
    };
    return out;
}

async function insertRow(client, table, columns, row) {
    const cols = columns.map((c) => `"${c}"`).join(", ");
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const values = columns.map((c) => row[c] ?? null);
    await client.query(`INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`, values);
}

async function main() {
    const client = new pg.Client({
        connectionString: loadDatabaseUrl(),
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    const teams = await loadTeams(client);

    const [
        finalsMatchesRes,
        finalsLineupRes,
        finalsPlayerRes,
        alahlyMatchesRes,
        alahlyLineupRes,
        alahlyPlayerRes,
    ] = [
        await client.query(`SELECT * FROM "${F_MATCH}" ORDER BY "FINAL_ID", "DATE"`),
        await client.query(`SELECT * FROM "${F_LINEUP}" ORDER BY "ROW_ID"`),
        await client.query(`SELECT * FROM "${F_PLAYER}" ORDER BY "ROW_ID"`),
        await client.query(`SELECT *, to_char("DATE", 'YYYY-MM-DD') AS "DATE_NORM" FROM "${A_MATCH}"`),
        await client.query(`SELECT "ROW_ID", "MATCH_ID" FROM "${A_LINEUP}"`),
        await client.query(`SELECT "ROW_ID", "MATCH_ID", "EVENT_ID", "PARENT_EVENT_ID" FROM "${A_PLAYER}"`),
    ];

    const finalsMatches = finalsMatchesRes.rows;
    const finalsLineup = finalsLineupRes.rows;
    const finalsPlayer = finalsPlayerRes.rows;
    const alahlyMatches = alahlyMatchesRes.rows;

    const alahlyIndexes = buildAlahlyIndexes(alahlyMatches);
    const existingEventKeys = new Set(
        alahlyPlayerRes.rows.map((r) => eventKey(r.MATCH_ID, r.EVENT_ID))
    );

    const rowCounter = computeRowCounter([
        ...alahlyMatches,
        ...alahlyLineupRes.rows,
        ...alahlyPlayerRes.rows,
    ]);
    let nextMatchNum = computeNextMatchNum(alahlyMatches);

    const report = {
        mode: apply ? "apply" : "dry-run",
        force,
        generatedAt: new Date().toISOString(),
        backfill: [],
        insert: [],
        skipped: [],
        unresolved: [],
        unknownIds: [],
        ambiguous: [],
        summary: {
            finalsMatchRows: finalsMatches.length,
            backfillCount: 0,
            insertMatchCount: 0,
            lineupInserted: 0,
            lineupTaggedOnly: 0,
            playerInserted: 0,
            playerTaggedOnly: 0,
            skippedCount: 0,
        },
        errors: [],
    };

    const ctx = {
        legMap: new Map(),
        firstLegMatchId: new Map(),
        matchIdsByFinalId: new Map(),
        insertFinalIds: new Set(),
        resolvedByFinalsRowId: new Map(),
    };

    const sortedFinalsMatches = sortFinalsMatches(finalsMatches);

    console.log(`${apply ? "APPLY" : "DRY-RUN"}: processing ${sortedFinalsMatches.length} finals match rows`);

    if (apply) await client.query("BEGIN");

    try {
        for (const finalRow of sortedFinalsMatches) {
            const finalsRowId = trimVal(finalRow.ROW_ID);
            const finalId = trimVal(finalRow.FINAL_ID);
            const nd = normFinalsDate(finalRow.DATE);

            const { match, method, ambiguous } = resolveBackfillMatch(finalRow, alahlyIndexes);

            if (ambiguous.length) {
                report.ambiguous.push({
                    finalsRowId,
                    finalId,
                    date: finalRow.DATE,
                    candidateMatchIds: ambiguous,
                });
                report.skipped.push({
                    finalsRowId,
                    finalId,
                    reason: "ambiguous_backfill",
                });
                report.summary.skippedCount += 1;
                continue;
            }

            if (match) {
                const alahlyMid = trimVal(match.MATCH_ID);
                const existingFinalId = trimVal(match.FINAL_ID);

                if (existingFinalId && existingFinalId !== finalId && !force) {
                    report.skipped.push({
                        finalsRowId,
                        finalId,
                        alahlyMatchId: alahlyMid,
                        reason: "existing_final_id",
                        existingFinalId,
                    });
                    report.summary.skippedCount += 1;
                    continue;
                }

                if (nd) ctx.legMap.set(legKey(finalId, nd), alahlyMid);
                if (!ctx.firstLegMatchId.has(finalId)) ctx.firstLegMatchId.set(finalId, alahlyMid);
                if (!ctx.matchIdsByFinalId.has(finalId)) ctx.matchIdsByFinalId.set(finalId, []);
                if (!ctx.matchIdsByFinalId.get(finalId).includes(alahlyMid)) {
                    ctx.matchIdsByFinalId.get(finalId).push(alahlyMid);
                }
                ctx.resolvedByFinalsRowId.set(finalsRowId, { path: "backfill", matchId: alahlyMid, method });

                const entry = {
                    finalsRowId,
                    finalId,
                    alahlyMatchId: alahlyMid,
                    method,
                    wdlFinal: finalRow["W-D-L FINAL"] ?? null,
                };
                report.backfill.push(entry);
                report.summary.backfillCount += 1;

                if (apply) {
                    await client.query(
                        `UPDATE "${A_MATCH}" SET "FINAL_ID" = $1, "W-D-L FINAL" = $2 WHERE "MATCH_ID" = $3`,
                        [finalId || null, finalRow["W-D-L FINAL"] ?? null, alahlyMid]
                    );
                    await client.query(
                        `UPDATE "${A_LINEUP}" SET "FINAL_ID" = $1 WHERE "MATCH_ID" = $2`,
                        [finalId || null, alahlyMid]
                    );
                    await client.query(
                        `UPDATE "${A_PLAYER}" SET "FINAL_ID" = $1 WHERE "MATCH_ID" = $2`,
                        [finalId || null, alahlyMid]
                    );
                }
                continue;
            }

            // Insert path
            ctx.insertFinalIds.add(finalId);

            let matchId = trimVal(finalRow.MATCH_ID);
            if (!matchId) {
                const base = opponentBaseName(finalRow["OPPONENT TEAM"], teams);
                if (!base) {
                    report.unknownIds.push({
                        finalsRowId,
                        finalId,
                        opponent: finalRow["OPPONENT TEAM"],
                        reason: "missing_team_name_for_match_id",
                    });
                    report.unresolved.push({ finalsRowId, finalId, reason: "match_id_generation_failed" });
                    report.summary.skippedCount += 1;
                    continue;
                }
                matchId = `${base}${nextMatchNum}`;
                nextMatchNum += 1;
                while (alahlyIndexes.byMatchId.has(matchId)) {
                    matchId = `${base}${nextMatchNum}`;
                    nextMatchNum += 1;
                }
            }

            const newRowId = allocateRowId(rowCounter);
            const insertRowData = buildInsertMatchRow(finalRow, newRowId, matchId);

            if (nd) ctx.legMap.set(legKey(finalId, nd), matchId);
            if (!ctx.firstLegMatchId.has(finalId)) ctx.firstLegMatchId.set(finalId, matchId);
            if (!ctx.matchIdsByFinalId.has(finalId)) ctx.matchIdsByFinalId.set(finalId, []);
            if (!ctx.matchIdsByFinalId.get(finalId).includes(matchId)) {
                ctx.matchIdsByFinalId.get(finalId).push(matchId);
            }
            ctx.resolvedByFinalsRowId.set(finalsRowId, { path: "insert", matchId, rowId: newRowId });

            alahlyIndexes.byMatchId.set(matchId, { ...insertRowData, MATCH_ID: matchId });

            report.insert.push({
                finalsRowId,
                finalId,
                matchId,
                rowId: newRowId,
                date: insertRowData.DATE,
            });
            report.summary.insertMatchCount += 1;

            if (apply) {
                await insertRow(client, A_MATCH, MATCH_INSERT_COLS, insertRowData);
            }
        }

        // Lineup rows for insert-path finals only
        for (const row of finalsLineup) {
            const finalId = pickFinalId(row);
            if (!ctx.insertFinalIds.has(finalId)) continue;

            const { matchId, method } = resolveMatchIdForChild(row, ctx);
            if (!matchId) {
                report.unresolved.push({
                    table: "lineup",
                    finalsRowId: row.ROW_ID,
                    finalId,
                    date: row.DATE,
                    reason: "unresolved_match_id",
                });
                continue;
            }

            const newRowId = allocateRowId(rowCounter);
            const lineupData = {
                ROW_ID: newRowId,
                MATCH_ID: matchId,
                "MATCH MINUTE": row["MATCH MINUTE"] ?? null,
                TEAM: row.TEAM ?? null,
                "PLAYER NAME": row["PLAYER NAME"] ?? null,
                STATU: row.STATU ?? null,
                "PLAYER NAME OUT": row["PLAYER NAME OUT"] ?? null,
                "OUT MINUTE": row["OUT MINUTE"] ?? null,
                "TOTAL MINUTE": row["TOTAL MINUTE"] ?? null,
                FINAL_ID: finalId || null,
            };

            report.summary.lineupInserted += 1;
            if (apply) {
                await insertRow(client, A_LINEUP, LINEUP_INSERT_COLS, lineupData);
            } else {
                void method;
            }
        }

        const insertPlayers = finalsPlayer.filter((row) => ctx.insertFinalIds.has(pickFinalId(row)));
        const playersByMatch = new Map();
        for (const row of insertPlayers) {
            const finalId = pickFinalId(row);
            const { matchId } = resolveMatchIdForChild(row, ctx);
            if (!matchId) {
                report.unresolved.push({
                    table: "player",
                    finalsRowId: row.ROW_ID,
                    finalId,
                    date: row.DATE,
                    eventId: row.EVENT_ID,
                    reason: "unresolved_match_id",
                });
                continue;
            }
            if (!playersByMatch.has(matchId)) playersByMatch.set(matchId, []);
            playersByMatch.get(matchId).push(row);
        }

        for (const [matchId, rowsForMatch] of playersByMatch.entries()) {
            const oldToNew = buildOldToNewEventMap(matchId, rowsForMatch);
            for (const row of rowsForMatch) {
            const finalId = pickFinalId(row);
            const mapped = mapEventId(row, matchId, oldToNew);
            let eventId = mapped.eventId;
            let parentEventId = mapped.parentEventId;

            if (!eventId) {
                report.unresolved.push({
                    table: "player",
                    finalsRowId: row.ROW_ID,
                    finalId,
                    reason: "missing_event_id",
                });
                continue;
            }

            const ek = eventKey(matchId, eventId);
            if (existingEventKeys.has(ek)) {
                report.summary.playerTaggedOnly += 1;
                if (apply) {
                    await client.query(
                        `UPDATE "${A_PLAYER}" SET "FINAL_ID" = $1 WHERE "MATCH_ID" = $2 AND "EVENT_ID" = $3`,
                        [finalId || null, matchId, eventId]
                    );
                } else {
                    report.skipped.push({
                        table: "player",
                        finalsRowId: row.ROW_ID,
                        finalId,
                        matchId,
                        eventId,
                        reason: "duplicate_event_tag_only",
                    });
                }
                continue;
            }

            const newRowId = allocateRowId(rowCounter);
            const tempEventId = `__TEMP__${newRowId}`;
            const playerData = {
                ROW_ID: newRowId,
                MATCH_ID: matchId,
                EVENT_ID: tempEventId,
                PARENT_EVENT_ID: null,
                "PLAYER NAME": row["PLAYER NAME"] ?? null,
                TEAM: row.TEAM ?? null,
                TYPE: row.TYPE ?? null,
                TYPE_SUB: row.TYPE_SUB ?? null,
                MINUTE: row.MINUTE ?? null,
                FINAL_ID: finalId || null,
            };

            report.summary.playerInserted += 1;
            existingEventKeys.add(ek);

            if (apply) {
                await insertRow(client, A_PLAYER, PLAYER_INSERT_COLS, playerData);
                await client.query(
                    `UPDATE "${A_PLAYER}" SET "EVENT_ID" = $1, "PARENT_EVENT_ID" = $2 WHERE "ROW_ID" = $3`,
                    [eventId, parentEventId, newRowId]
                );
            }
            }
        }

        if (apply) await client.query("COMMIT");
    } catch (error) {
        if (apply) await client.query("ROLLBACK");
        report.errors.push({ message: error.message, stack: error.stack });
        throw error;
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

    console.log("Backfill:", report.summary.backfillCount);
    console.log("Insert matches:", report.summary.insertMatchCount);
    console.log("Lineup inserted:", report.summary.lineupInserted);
    console.log("Player inserted:", report.summary.playerInserted);
    console.log("Player tagged only:", report.summary.playerTaggedOnly);
    console.log("Skipped:", report.summary.skippedCount);
    console.log("Unresolved:", report.unresolved.length);
    console.log("Ambiguous:", report.ambiguous.length);
    console.log("Unknown IDs:", report.unknownIds.length);
    console.log(`Report: ${reportPath}`);

    await client.end();

    if (report.errors.length) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
