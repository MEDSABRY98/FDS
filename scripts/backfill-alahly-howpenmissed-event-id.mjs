/**
 * Backfill alahly_HOWPENMISSED.EVENT_ID from alahly_PLAYERDETAILS (TYPE=PENMISSED)
 * using MATCH_ID + MINUTE (+ TEAM when available).
 *
 * Usage:
 *   node scripts/backfill-alahly-howpenmissed-event-id.mjs           # dry-run report
 *   node scripts/backfill-alahly-howpenmissed-event-id.mjs --apply   # write updates
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://wsygeerxfdaavdtvogvy.supabase.co";
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk";

const supabase = createClient(supabaseUrl, supabaseKey);
const APPLY = process.argv.includes("--apply");

async function fetchAll(table, select = "*") {
    let all = [];
    let from = 0;
    const step = 1000;
    while (true) {
        const { data, error } = await supabase.from(table).select(select).range(from, from + step - 1);
        if (error) throw error;
        if (!data?.length) break;
        all = all.concat(data);
        if (data.length < step) break;
        from += step;
    }
    return all;
}

function normalizeMinuteKey(minute) {
    const raw = String(minute ?? "").trim();
    if (!raw || raw === "?") return "";
    if (raw.includes("+")) {
        const base = parseInt(raw.split("+")[0], 10);
        return Number.isNaN(base) ? raw : String(base);
    }
    const val = parseInt(raw, 10);
    return Number.isNaN(val) ? raw : String(val);
}

function minutesMatch(a, b) {
    const sa = String(a ?? "").trim();
    const sb = String(b ?? "").trim();
    if (!sa || !sb) return false;
    if (sa === sb) return true;
    return normalizeMinuteKey(sa) !== "" && normalizeMinuteKey(sa) === normalizeMinuteKey(sb);
}

function isBlankEventId(value) {
    const v = String(value ?? "").trim();
    return !v || v === "-" || v === "?";
}

function findPenMissedCandidates(howRow, penEvents) {
    const matchId = String(howRow.MATCH_ID || "").trim();
    const team = String(howRow.TEAM || "").trim();

    let candidates = penEvents.filter((p) => {
        if (String(p.MATCH_ID || "").trim() !== matchId) return false;
        if (String(p.TYPE || "").trim().toUpperCase() !== "PENMISSED") return false;
        return minutesMatch(p.MINUTE, howRow.MINUTE);
    });

    if (team) {
        const teamMatches = candidates.filter((p) => String(p.TEAM || "").trim() === team);
        if (teamMatches.length > 0) candidates = teamMatches;
    }

    return candidates;
}

async function main() {
    console.log(`Mode: ${APPLY ? "APPLY (will update DB)" : "DRY-RUN (report only)"}\n`);

    const [howRows, penEvents] = await Promise.all([
        fetchAll("alahly_HOWPENMISSED"),
        fetchAll("alahly_PLAYERDETAILS", "ROW_ID, MATCH_ID, EVENT_ID, \"PLAYER NAME\", TEAM, TYPE, MINUTE"),
    ]);

    const penMissed = penEvents.filter((p) => String(p.TYPE || "").trim().toUpperCase() === "PENMISSED");

    const needsLink = howRows.filter((row) => isBlankEventId(row.EVENT_ID));
    const alreadyLinked = howRows.length - needsLink.length;

    const toUpdate = [];
    const ambiguous = [];
    const noMatch = [];
    const alreadyCorrect = [];

    for (const howRow of needsLink) {
        const candidates = findPenMissedCandidates(howRow, penMissed);

        if (candidates.length === 0) {
            noMatch.push(howRow);
            continue;
        }

        if (candidates.length > 1) {
            ambiguous.push({ howRow, candidates });
            continue;
        }

        const pen = candidates[0];
        const eventId = String(pen.EVENT_ID || "").trim();
        if (!eventId) {
            noMatch.push({ ...howRow, reason: "PENMISSED row has no EVENT_ID" });
            continue;
        }

        toUpdate.push({
            rowId: howRow.ROW_ID,
            matchId: howRow.MATCH_ID,
            minute: howRow.MINUTE,
            howMissed: howRow["HOW MISSED?"],
            playerName: pen["PLAYER NAME"],
            team: pen.TEAM,
            eventId,
        });
    }

    for (const howRow of howRows.filter((row) => !isBlankEventId(row.EVENT_ID))) {
        const pen = penMissed.find(
            (p) =>
                String(p.MATCH_ID || "").trim() === String(howRow.MATCH_ID || "").trim() &&
                String(p.EVENT_ID || "").trim() === String(howRow.EVENT_ID || "").trim()
        );
        if (pen) alreadyCorrect.push(howRow);
    }

    console.log("=== SUMMARY ===");
    console.log(`HOWPENMISSED total:        ${howRows.length}`);
    console.log(`Already has EVENT_ID:      ${alreadyLinked}`);
    console.log(`Already valid link:        ${alreadyCorrect.length}`);
    console.log(`Ready to backfill:         ${toUpdate.length}`);
    console.log(`Ambiguous (manual review): ${ambiguous.length}`);
    console.log(`No match found:            ${noMatch.length}`);
    console.log("");

    if (toUpdate.length > 0) {
        console.log("=== SAMPLE UPDATES (first 15) ===");
        toUpdate.slice(0, 15).forEach((u, i) => {
            console.log(
                `${i + 1}. ROW_ID=${u.rowId} | MATCH=${u.matchId} | MIN=${u.minute} | ` +
                `PLAYER=${u.playerName} | EVENT_ID -> ${u.eventId} | HOW=${u.howMissed}`
            );
        });
        console.log("");
    }

    if (ambiguous.length > 0) {
        console.log("=== AMBIGUOUS (same match + minute) ===");
        ambiguous.slice(0, 10).forEach((item, i) => {
            const h = item.howRow;
            console.log(
                `${i + 1}. ROW_ID=${h.ROW_ID} MATCH=${h.MATCH_ID} MIN=${h.MINUTE} TEAM=${h.TEAM} HOW=${h["HOW MISSED?"]}`
            );
            item.candidates.forEach((c) => {
                console.log(
                    `   - candidate EVENT_ID=${c.EVENT_ID} PLAYER=${c["PLAYER NAME"]} TEAM=${c.TEAM} MIN=${c.MINUTE}`
                );
            });
        });
        console.log("");
    }

    if (noMatch.length > 0) {
        console.log("=== NO MATCH (first 15) ===");
        noMatch.slice(0, 15).forEach((row, i) => {
            console.log(
                `${i + 1}. ROW_ID=${row.ROW_ID} MATCH=${row.MATCH_ID} MIN=${row.MINUTE} TEAM=${row.TEAM} HOW=${row["HOW MISSED?"]}${row.reason ? ` | ${row.reason}` : ""}`
            );
        });
        console.log("");
    }

    if (!APPLY) {
        console.log("Dry-run only. Re-run with --apply to write EVENT_ID updates.");
        return;
    }

    let updated = 0;
    let failed = 0;

    for (const item of toUpdate) {
        const { error } = await supabase
            .from("alahly_HOWPENMISSED")
            .update({ EVENT_ID: item.eventId })
            .eq("ROW_ID", item.rowId);

        if (error) {
            failed += 1;
            console.error(`Failed ROW_ID=${item.rowId}:`, error.message);
        } else {
            updated += 1;
        }
    }

    console.log(`=== APPLY RESULT ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed:  ${failed}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
