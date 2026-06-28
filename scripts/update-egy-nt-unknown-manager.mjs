/**
 * Replace ? / ؟ with M-0524 in egy_NT_MATCHDETAILS manager columns.
 * Only updates cells that are exactly ? or ؟ after trim.
 *
 * Usage:
 *   node scripts/update-egy-nt-unknown-manager.mjs           # dry-run
 *   node scripts/update-egy-nt-unknown-manager.mjs --apply   # write updates
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");

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

const TARGET_ID = "M-0524";
const TABLE = "egy_NT_MATCHDETAILS";

const isQ = (v) => {
    const t = String(v ?? "").trim();
    return t === "?" || t === "؟";
};

async function fetchAll() {
    let all = [];
    let from = 0;
    const step = 1000;
    while (true) {
        const { data, error } = await supabase
            .from(TABLE)
            .select('MATCH_ID, "EGYPT MANAGER", "OPPONENT MANAGER"')
            .range(from, from + step - 1);
        if (error) throw error;
        if (!data?.length) break;
        all = all.concat(data);
        if (data.length < step) break;
        from += step;
    }
    return all;
}

const rows = await fetchAll();

const egyptUpdates = rows.filter((r) => isQ(r["EGYPT MANAGER"]));
const opponentUpdates = rows.filter((r) => isQ(r["OPPONENT MANAGER"]));

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
console.log(`EGYPT MANAGER updates: ${egyptUpdates.length}`);
console.log(`OPPONENT MANAGER updates: ${opponentUpdates.length}`);

if (!APPLY) {
    console.log("\nRe-run with --apply to write changes.");
    process.exit(0);
}

let egyDone = 0;
let oppDone = 0;
let errors = 0;

async function batchUpdate(column, matchIds) {
    const chunkSize = 100;
    for (let i = 0; i < matchIds.length; i += chunkSize) {
        const chunk = matchIds.slice(i, i + chunkSize);
        const { error } = await supabase
            .from(TABLE)
            .update({ [column]: TARGET_ID })
            .in("MATCH_ID", chunk);
        if (error) {
            console.error(`${column} batch error`, error.message);
            errors += chunk.length;
        } else {
            if (column === "EGYPT MANAGER") egyDone += chunk.length;
            else oppDone += chunk.length;
        }
    }
}

await batchUpdate("EGYPT MANAGER", egyptUpdates.map((r) => r.MATCH_ID));
await batchUpdate("OPPONENT MANAGER", opponentUpdates.map((r) => r.MATCH_ID));

console.log(`Done. EGYPT MANAGER: ${egyDone}, OPPONENT MANAGER: ${oppDone}, errors: ${errors}`);

const after = await fetchAll();
const remainingEgy = after.filter((r) => isQ(r["EGYPT MANAGER"])).length;
const remainingOpp = after.filter((r) => isQ(r["OPPONENT MANAGER"])).length;
console.log(`Remaining ?/؟ — EGYPT: ${remainingEgy}, OPPONENT: ${remainingOpp}`);
