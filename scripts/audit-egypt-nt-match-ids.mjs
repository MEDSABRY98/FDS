/**
 * Audit Egypt NT MATCH_ID migration (AgePrefix + TEAM_ID + Excel date).
 * Usage: node scripts/audit-egypt-nt-match-ids.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import {
    EGYPT_NT_LINKED_TABLES,
    buildEgyptNtMatchMigrationPlan,
    buildTeamIdLookupMap,
    fetchAllRows,
} from "./lib/egypt-nt-match-id-migration.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wsygeerxfdaavdtvogvy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || "sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk";

const supabase = createClient(supabaseUrl, supabaseKey);

const teams = await fetchAllRows(supabase, "db_TEAMS", "TEAM_ID, TEAM_NAME, TEAM_NAME_EN");
const teamLookup = buildTeamIdLookupMap(teams);

const matches = await fetchAllRows(
    supabase,
    "egy_NT_MATCHDETAILS",
    'ROW_ID, MATCH_ID, AGE, "Egypt TEAM", "OPPONENT TEAM", DATE, CHAMPION'
);

const plan = buildEgyptNtMatchMigrationPlan(matches, teamLookup);

const masterIds = new Set(matches.map((m) => String(m.MATCH_ID || "").trim()).filter(Boolean));

const orphansByTable = {};
for (const table of EGYPT_NT_LINKED_TABLES) {
    const rows = await fetchAllRows(supabase, table, "ROW_ID, MATCH_ID");
    orphansByTable[table] = rows.filter((r) => {
        const mid = String(r.MATCH_ID || "").trim();
        return mid && !masterIds.has(mid);
    });
}

const report = {
    generatedAt: new Date().toISOString(),
    stats: plan.stats,
    unresolved: plan.unresolved,
    duplicateGroups: plan.duplicateGroups,
    sampleChanges: plan.rows.filter((r) => r.needsChange).slice(0, 30),
    orphansByTable,
};

console.log("=== Egypt NT MATCH_ID Audit ===");
console.log(JSON.stringify(plan.stats, null, 2));

if (plan.unresolved.length) {
    console.log(`\nUnresolved opponents: ${plan.unresolved.length}`);
    plan.unresolved.slice(0, 15).forEach((r) => {
        console.log(`  ROW_ID=${r.rowId} | ${r.opponentRaw} | current=${r.currentMatchId}`);
    });
}

if (plan.duplicateGroups.length) {
    console.log(`\nCollisions (same Age+TEAM_ID+DATE): ${plan.duplicateGroups.length}`);
    plan.duplicateGroups.slice(0, 10).forEach(({ proposedMatchId, group }) => {
        console.log(`  ${proposedMatchId} -> ${group.length} matches`);
        group.forEach((g) => console.log(`    - ${g.currentMatchId} | ${g.opponentRaw}`));
    });
}

Object.entries(orphansByTable).forEach(([table, rows]) => {
    if (rows.length) console.log(`\nOrphans in ${table}: ${rows.length}`);
});

const outPath = "scripts/audit-egypt-nt-match-ids-report.json";
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
console.log(`\nFull report: ${outPath}`);

if (plan.stats.collisions > 0 || plan.stats.unresolved > 0) {
    console.log("\nFix collisions/unresolved before running apply migration");
    process.exit(1);
}
