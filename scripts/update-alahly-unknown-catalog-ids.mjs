/**
 * Replace ? / ؟ placeholders in alahly_MATCHDETAILS:
 *   AHLY MANAGER, OPPONENT MANAGER -> M-0524
 *   REFREE -> REF-0530
 * Only updates cells that are exactly ? or ؟ after trim.
 *
 * Usage:
 *   node scripts/update-alahly-unknown-catalog-ids.mjs           # dry-run
 *   node scripts/update-alahly-unknown-catalog-ids.mjs --apply   # write updates
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

const TABLE = "alahly_MATCHDETAILS";
const MANAGER_ID = "M-0524";
const REFEREE_ID = "REF-0530";

const COLUMNS = [
    { column: "AHLY MANAGER", target: MANAGER_ID },
    { column: "OPPONENT MANAGER", target: MANAGER_ID },
    { column: "REFREE", target: REFEREE_ID },
];

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
            .select('MATCH_ID, "AHLY MANAGER", "OPPONENT MANAGER", REFREE')
            .range(from, from + step - 1);
        if (error) throw error;
        if (!data?.length) break;
        all = all.concat(data);
        if (data.length < step) break;
        from += step;
    }
    return all;
}

const [{ data: mgr }, { data: ref }] = await Promise.all([
    supabase.from("db_MANAGERS").select("MANAGER_ID, MANAGER_NAME").eq("MANAGER_ID", MANAGER_ID).maybeSingle(),
    supabase.from("db_REFEREES").select("REFEREE_ID, REFEREE_NAME").eq("REFEREE_ID", REFEREE_ID).maybeSingle(),
]);

console.log(`${MANAGER_ID} catalog:`, mgr || "NOT FOUND");
console.log(`${REFEREE_ID} catalog:`, ref || "NOT FOUND");

const rows = await fetchAll();
const plans = COLUMNS.map(({ column, target }) => ({
    column,
    target,
    matchIds: rows.filter((r) => isQ(r[column])).map((r) => r.MATCH_ID),
}));

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
for (const plan of plans) {
    console.log(`${plan.column} -> ${plan.target}: ${plan.matchIds.length} rows`);
}

if (!APPLY) {
    console.log("\nRe-run with --apply to write changes.");
    process.exit(0);
}

let errors = 0;
const results = {};

async function batchUpdate(column, target, matchIds) {
    results[column] = 0;
    const chunkSize = 100;
    for (let i = 0; i < matchIds.length; i += chunkSize) {
        const chunk = matchIds.slice(i, i + chunkSize);
        const { error } = await supabase
            .from(TABLE)
            .update({ [column]: target })
            .in("MATCH_ID", chunk);
        if (error) {
            console.error(`${column} batch error`, error.message);
            errors += chunk.length;
        } else {
            results[column] += chunk.length;
        }
    }
}

for (const plan of plans) {
    await batchUpdate(plan.column, plan.target, plan.matchIds);
}

console.log("Done:", results, "errors:", errors);

const after = await fetchAll();
for (const { column } of COLUMNS) {
    const remaining = after.filter((r) => isQ(r[column])).length;
    console.log(`Remaining ?/؟ in ${column}: ${remaining}`);
}
