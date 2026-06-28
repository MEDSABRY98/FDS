/**
 * Convert goalkeeper names in HOW MISSED? (saved penalties) to PLAYER_ID from db_PLAYERS.
 * Miss reasons (برا المرمى, القائم, العارضة, ؟) are left unchanged.
 *
 * Usage:
 *   node scripts/backfill-howpenmissed-gk-player-id.mjs
 *   node scripts/backfill-howpenmissed-gk-player-id.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://wsygeerxfdaavdtvogvy.supabase.co";
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk";

const supabase = createClient(supabaseUrl, supabaseKey);
const APPLY = process.argv.includes("--apply");

const MISS_REASONS = new Set(["برا المرمى", "القائم", "العارضة", "؟"]);
const TABLES = ["alahly_HOWPENMISSED", "egy_NT_HOWPENMISSED"];

function normalizeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function isPlayerId(value) {
    return /^P-\d+/i.test(String(value || "").trim());
}

async function resolveGkPlayerId(rawName) {
    const raw = String(rawName || "").trim().replace(/\s+/g, " ");
    if (!raw) return null;

    for (const nameCol of ["PLAYER_NAME", "PLAYER_NAME_EN"]) {
        const { data, error } = await supabase
            .from("db_PLAYERS")
            .select(`PLAYER_ID, ${nameCol}`)
            .ilike(nameCol, raw)
            .limit(10);

        if (error) continue;

        const exact = (data || []).find((row) => normalizeName(row[nameCol]) === normalizeName(raw));
        if (exact?.PLAYER_ID) return exact.PLAYER_ID;
        if (data?.length === 1 && data[0]?.PLAYER_ID) return data[0].PLAYER_ID;
    }

    return null;
}

async function fetchAll(table) {
    let all = [];
    let from = 0;
    const step = 1000;
    while (true) {
        const { data, error } = await supabase.from(table).select("*").range(from, from + step - 1);
        if (error) throw error;
        if (!data?.length) break;
        all = all.concat(data);
        if (data.length < step) break;
        from += step;
    }
    return all;
}

function classifyRow(row) {
    const raw = String(row["HOW MISSED?"] || "").trim();
    if (!raw) return "empty";
    if (MISS_REASONS.has(raw)) return "miss_reason";
    if (isPlayerId(raw)) return "already_id";
    return "gk_name";
}

async function main() {
    console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

    let totalReady = 0;
    let totalMissing = 0;
    let totalSkipped = 0;

    for (const table of TABLES) {
        const rows = await fetchAll(table);
        const toUpdate = [];
        const missing = [];

        for (const row of rows) {
            const kind = classifyRow(row);
            if (kind === "empty" || kind === "miss_reason" || kind === "already_id") {
                totalSkipped += 1;
                continue;
            }

            const playerId = await resolveGkPlayerId(row["HOW MISSED?"]);
            if (!playerId) {
                missing.push(row);
                continue;
            }

            toUpdate.push({
                rowId: row.ROW_ID,
                from: row["HOW MISSED?"],
                to: playerId,
                matchId: row.MATCH_ID,
            });
        }

        totalReady += toUpdate.length;
        totalMissing += missing.length;

        console.log(`=== ${table} ===`);
        console.log(`Rows: ${rows.length}`);
        console.log(`Ready to convert: ${toUpdate.length}`);
        console.log(`Unmatched GK names: ${missing.length}`);

        if (toUpdate.length > 0) {
            console.log("Sample updates:");
            toUpdate.slice(0, 10).forEach((item, i) => {
                console.log(`  ${i + 1}. ROW_ID=${item.rowId} | ${item.from} -> ${item.to} | MATCH=${item.matchId}`);
            });
        }

        if (missing.length > 0) {
            console.log("Unmatched samples:");
            missing.slice(0, 10).forEach((row, i) => {
                console.log(`  ${i + 1}. ROW_ID=${row.ROW_ID} | HOW=${row["HOW MISSED?"]} | MATCH=${row.MATCH_ID}`);
            });
        }
        console.log("");

        if (APPLY && toUpdate.length > 0) {
            let updated = 0;
            let failed = 0;
            for (const item of toUpdate) {
                const { error } = await supabase
                    .from(table)
                    .update({ "HOW MISSED?": item.to })
                    .eq("ROW_ID", item.rowId);
                if (error) {
                    failed += 1;
                    console.error(`Failed ROW_ID=${item.rowId}:`, error.message);
                } else {
                    updated += 1;
                }
            }
            console.log(`Applied ${table}: updated=${updated}, failed=${failed}\n`);
        }
    }

    console.log("=== TOTAL ===");
    console.log(`Ready: ${totalReady}`);
    console.log(`Unmatched: ${totalMissing}`);
    console.log(`Skipped: ${totalSkipped}`);

    if (!APPLY) {
        console.log("\nDry-run only. Re-run with --apply to write updates.");
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
