/**
 * Replace TEAM catalog id T-0277 → T-0125 in egy_NT_GKSDETAILS.
 *
 * Usage:
 *   node scripts/update-egy-nt-gk-team-id.mjs           # dry-run
 *   node scripts/update-egy-nt-gk-team-id.mjs --apply   # write updates
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const FROM_ID = "T-0277";
const TO_ID = "T-0125";
const TABLE = "egy_NT_GKSDETAILS";

const envText = readFileSync(".env.local", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    env[line.slice(0, i)] = line.slice(i + 1).replace(/^["']|["']$/g, "");
}

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchMatchingRows() {
    let all = [];
    let from = 0;
    const step = 1000;
    while (true) {
        const { data, error } = await supabase
            .from(TABLE)
            .select("ROW_ID, MATCH_ID, TEAM, \"PLAYER NAME\"")
            .eq("TEAM", FROM_ID)
            .range(from, from + step - 1);
        if (error) throw error;
        if (!data?.length) break;
        all = all.concat(data);
        if (data.length < step) break;
        from += step;
    }
    return all;
}

const rows = await fetchMatchingRows();

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
console.log(`Table: ${TABLE}`);
console.log(`TEAM ${FROM_ID} → ${TO_ID}`);
console.log(`Rows to update: ${rows.length}`);

if (rows.length > 0 && rows.length <= 20) {
    for (const row of rows) {
        console.log(`  ROW_ID=${row.ROW_ID} MATCH_ID=${row.MATCH_ID} GK=${row["PLAYER NAME"]}`);
    }
} else if (rows.length > 20) {
    for (const row of rows.slice(0, 5)) {
        console.log(`  ROW_ID=${row.ROW_ID} MATCH_ID=${row.MATCH_ID} GK=${row["PLAYER NAME"]}`);
    }
    console.log(`  ... and ${rows.length - 5} more`);
}

if (!APPLY) {
    console.log("\nRe-run with --apply to write changes.");
    process.exit(0);
}

if (rows.length === 0) {
    console.log("Nothing to update.");
    process.exit(0);
}

const { error } = await supabase
    .from(TABLE)
    .update({ TEAM: TO_ID })
    .eq("TEAM", FROM_ID);

if (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
}

const verify = await fetchMatchingRows();
console.log(`Done. Remaining rows with TEAM=${FROM_ID}: ${verify.length}`);
