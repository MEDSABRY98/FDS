/**
 * Replace ? / ؟ with REF-0530 in egy_NT_MATCHDETAILS.REFREE.
 * Only updates cells that are exactly ? or ؟ after trim.
 *
 * Usage:
 *   node scripts/update-egy-nt-unknown-referee.mjs           # dry-run
 *   node scripts/update-egy-nt-unknown-referee.mjs --apply   # write updates
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

const TARGET_ID = "REF-0530";
const TABLE = "egy_NT_MATCHDETAILS";
const COLUMN = "REFREE";

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
            .select(`MATCH_ID, ${COLUMN}`)
            .range(from, from + step - 1);
        if (error) throw error;
        if (!data?.length) break;
        all = all.concat(data);
        if (data.length < step) break;
        from += step;
    }
    return all;
}

const { data: catalog } = await supabase
    .from("db_REFEREES")
    .select("REFEREE_ID, REFEREE_NAME")
    .eq("REFEREE_ID", TARGET_ID)
    .maybeSingle();

console.log(`${TARGET_ID} catalog:`, catalog || "NOT FOUND");

const rows = await fetchAll();
const updates = rows.filter((r) => isQ(r[COLUMN]));

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
console.log(`${COLUMN} updates: ${updates.length}`);

if (!APPLY) {
    console.log("\nRe-run with --apply to write changes.");
    process.exit(0);
}

let done = 0;
let errors = 0;
const matchIds = updates.map((r) => r.MATCH_ID);
const chunkSize = 100;

for (let i = 0; i < matchIds.length; i += chunkSize) {
    const chunk = matchIds.slice(i, i + chunkSize);
    const { error } = await supabase
        .from(TABLE)
        .update({ [COLUMN]: TARGET_ID })
        .in("MATCH_ID", chunk);
    if (error) {
        console.error("batch error", error.message);
        errors += chunk.length;
    } else {
        done += chunk.length;
    }
}

console.log(`Done. ${COLUMN}: ${done}, errors: ${errors}`);

const after = await fetchAll();
const remaining = after.filter((r) => isQ(r[COLUMN])).length;
console.log(`Remaining ?/؟ in ${COLUMN}: ${remaining}`);
