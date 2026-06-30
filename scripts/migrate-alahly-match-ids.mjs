/**
 * Migrate Al Ahly MATCH_ID to TEAM_ID + Excel date.
 *
 * Prerequisites:
 *   1. Run scripts/alter-alahly-match-id-temp.sql in Supabase
 *   2. Run scripts/audit-alahly-match-ids.mjs (no collisions/unresolved)
 *
 * Usage:
 *   node scripts/migrate-alahly-match-ids.mjs --dry-run
 *   node scripts/migrate-alahly-match-ids.mjs --apply
 *   node scripts/migrate-alahly-match-ids.mjs --validate
 */
import { createClient } from "@supabase/supabase-js";
import {
    ALAHLY_LINKED_TABLES,
    ALAHLY_MATCH_TABLES,
    buildMatchMigrationPlan,
    buildTeamIdLookupMap,
    fetchAllRows,
    remapEventIdPrefix,
    remapGkEventIdField,
} from "./lib/alahly-match-id-migration.mjs";

const mode = process.argv.find((a) => a.startsWith("--"))?.replace(/^--/, "") || "dry-run";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wsygeerxfdaavdtvogvy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || "sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk";

if (mode === "apply" && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Warning: SUPABASE_SERVICE_ROLE_KEY not set — apply may fail on RLS.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadPlan() {
    const teams = await fetchAllRows(supabase, "db_TEAMS", "TEAM_ID, TEAM_NAME, TEAM_NAME_EN");
    const teamLookup = buildTeamIdLookupMap(teams);
    const matches = await fetchAllRows(
        supabase,
        "alahly_MATCHDETAILS",
        'ROW_ID, MATCH_ID, "OPPONENT TEAM", DATE'
    );
    return buildMatchMigrationPlan(matches, teamLookup);
}

function assertPlanSafe(plan) {
    if (plan.stats.unresolved > 0) {
        throw new Error(`Abort: ${plan.stats.unresolved} matches with unresolved OPPONENT TEAM`);
    }
    if (plan.stats.collisions > 0) {
        throw new Error(`Abort: ${plan.stats.collisions} TEAM_ID+DATE collision groups`);
    }

    const proposedSet = new Set();
    for (const row of plan.rows) {
        if (!row.proposedMatchId) continue;
        if (proposedSet.has(row.proposedMatchId)) {
            throw new Error(`Abort: duplicate proposed MATCH_ID ${row.proposedMatchId}`);
        }
        proposedSet.add(row.proposedMatchId);
    }
}

async function updateRowByPk(table, rowId, payload) {
    const { error } = await supabase.from(table).update(payload).eq("ROW_ID", rowId);
    if (error) throw new Error(`${table} ROW_ID=${rowId}: ${error.message}`);
}

async function runDryRun(plan) {
    console.log("=== DRY RUN ===");
    console.log(JSON.stringify(plan.stats, null, 2));
    const changes = plan.rows.filter((r) => r.needsChange);
    console.log(`\nSample changes (${Math.min(20, changes.length)} of ${changes.length}):`);
    changes.slice(0, 20).forEach((r) => {
        console.log(`  ${r.currentMatchId} -> ${r.proposedMatchId} | ${r.opponentRaw} | ${r.teamId}`);
    });
}

async function fillMatchIdTemp(table) {
    const rows = await fetchAllRows(supabase, table, "ROW_ID, MATCH_ID, MATCH_ID_TEMP");
    let updated = 0;
    for (const row of rows) {
        const current = String(row.MATCH_ID || "").trim();
        const temp = String(row.MATCH_ID_TEMP || "").trim();
        if (!current || temp === current) continue;
        if (mode === "apply") {
            await updateRowByPk(table, row.ROW_ID, { MATCH_ID_TEMP: current });
        }
        updated += 1;
    }
    return updated;
}

async function applyMaster(plan) {
    let updated = 0;
    for (const row of plan.rows) {
        if (!row.needsChange || !row.rowId) continue;
        if (mode === "apply") {
            await updateRowByPk("alahly_MATCHDETAILS", row.rowId, {
                MATCH_ID_TEMP: row.currentMatchId,
                MATCH_ID: row.proposedMatchId,
            });
        }
        updated += 1;
    }
    return updated;
}

async function applyLinkedTables(lookupMap) {
    let total = 0;
    for (const table of ALAHLY_LINKED_TABLES) {
        const rows = await fetchAllRows(supabase, table, "ROW_ID, MATCH_ID, MATCH_ID_TEMP");
        for (const row of rows) {
            const temp = String(row.MATCH_ID_TEMP || row.MATCH_ID || "").trim();
            const newId = lookupMap.get(temp);
            if (!newId || newId === row.MATCH_ID) continue;
            if (mode === "apply") {
                const payload = { MATCH_ID: newId };
                if (!row.MATCH_ID_TEMP) payload.MATCH_ID_TEMP = temp;
                await updateRowByPk(table, row.ROW_ID, payload);
            }
            total += 1;
        }
    }
    return total;
}

async function remapEventIds(plan) {
    const changed = plan.rows.filter((r) => r.needsChange);
    if (!changed.length) return { playerUpdates: 0, gkUpdates: 0 };

    const allPlayers = await fetchAllRows(
        supabase,
        "alahly_PLAYERDETAILS",
        'ROW_ID, EVENT_ID, "PARENT_EVENT_ID", "HOW MISSED", MATCH_ID'
    );
    const allGks = await fetchAllRows(supabase, "alahly_GKSDETAILS", "ROW_ID, EVENT_ID, MATCH_ID");

    let playerUpdates = 0;
    let gkUpdates = 0;

    for (const match of changed) {
        const { currentMatchId: oldId, proposedMatchId: newId } = match;
        const matchPlayers = allPlayers.filter((p) => String(p.MATCH_ID).trim() === newId);

        const eventMap = new Map();
        for (const p of matchPlayers) {
            const oldEvent = String(p.EVENT_ID || "").trim();
            const newEvent = remapEventIdPrefix(oldEvent, oldId, newId);
            if (oldEvent) eventMap.set(oldEvent, newEvent);
        }

        for (const p of matchPlayers) {
            const payload = {};
            const oldEvent = String(p.EVENT_ID || "").trim();
            const newEvent = remapEventIdPrefix(oldEvent, oldId, newId);
            if (newEvent && newEvent !== oldEvent) payload.EVENT_ID = newEvent;

            const oldParent = String(p.PARENT_EVENT_ID || "").trim();
            const newParent = eventMap.get(oldParent)
                || remapEventIdPrefix(oldParent, oldId, newId);
            if (oldParent && newParent && newParent !== oldParent) {
                payload.PARENT_EVENT_ID = newParent;
            }

            const howMissed = String(p["HOW MISSED"] || "").trim();
            const newHow = eventMap.get(howMissed)
                || remapEventIdPrefix(howMissed, oldId, newId);
            if (howMissed && newHow && newHow !== howMissed) {
                payload["HOW MISSED"] = newHow;
            }

            if (Object.keys(payload).length === 0) continue;
            if (mode === "apply") await updateRowByPk("alahly_PLAYERDETAILS", p.ROW_ID, payload);
            playerUpdates += 1;
        }

        const matchGks = allGks.filter((g) => String(g.MATCH_ID).trim() === newId);
        for (const g of matchGks) {
            const oldVal = String(g.EVENT_ID || "").trim();
            const newVal = remapGkEventIdField(oldVal, oldId, newId);
            if (!newVal || newVal === oldVal) continue;
            if (mode === "apply") await updateRowByPk("alahly_GKSDETAILS", g.ROW_ID, { EVENT_ID: newVal });
            gkUpdates += 1;
        }
    }

    return { playerUpdates, gkUpdates };
}

async function runValidate(plan) {
    const matches = await fetchAllRows(supabase, "alahly_MATCHDETAILS", "ROW_ID, MATCH_ID, MATCH_ID_TEMP");
    const masterIds = new Set(matches.map((m) => String(m.MATCH_ID).trim()).filter(Boolean));
    let ok = true;

    for (const table of ALAHLY_LINKED_TABLES) {
        const rows = await fetchAllRows(supabase, table, "ROW_ID, MATCH_ID");
        const orphans = rows.filter((r) => {
            const mid = String(r.MATCH_ID || "").trim();
            return mid && !masterIds.has(mid);
        });
        if (orphans.length) {
            ok = false;
            console.log(`FAIL ${table}: ${orphans.length} orphan MATCH_ID rows`);
        } else {
            console.log(`OK ${table}`);
        }
    }

    const badProposed = plan.rows.filter((r) => r.proposedMatchId && r.currentMatchId !== r.proposedMatchId);
    const notMigrated = matches.filter((m) => {
        const row = plan.rows.find((p) => p.rowId === m.ROW_ID);
        return row?.proposedMatchId && String(m.MATCH_ID).trim() !== row.proposedMatchId;
    });
    if (notMigrated.length) {
        ok = false;
        console.log(`FAIL master: ${notMigrated.length} rows still not on proposed MATCH_ID`);
    } else {
        console.log(`OK master (${badProposed.length} were targeted for change)`);
    }

    process.exit(ok ? 0 : 1);
}

const plan = await loadPlan();
assertPlanSafe(plan);

if (mode === "validate") {
    console.log("=== VALIDATE ===");
    await runValidate(plan);
}

if (mode === "dry-run") {
    await runDryRun(plan);
    console.log("\nLinked table updates (estimated): run --apply to execute");
}

if (mode === "apply") {
    console.log("=== APPLY ===");
    for (const table of ALAHLY_MATCH_TABLES) {
        const n = await fillMatchIdTemp(table);
        console.log(`MATCH_ID_TEMP filled: ${table} (${n} rows)`);
    }
    const masterN = await applyMaster(plan);
    console.log(`Master MATCH_ID updated: ${masterN}`);
    const linkedN = await applyLinkedTables(plan.lookupMap);
    console.log(`Linked MATCH_ID updated: ${linkedN}`);
    const { playerUpdates, gkUpdates } = await remapEventIds(plan);
    console.log(`EVENT_ID remapped: players=${playerUpdates}, gks=${gkUpdates}`);
    console.log("\nRun: node scripts/migrate-alahly-match-ids.mjs --validate");
}
