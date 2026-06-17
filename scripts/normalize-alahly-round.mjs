import fs from "fs";
import pg from "pg";

const APPLY = process.argv.includes("--apply");

function getDbUrl() {
    const env = fs.readFileSync(".env.local", "utf8");
    const match = env.match(/^DATABASE_URL=(.+)$/m);
    if (!match) throw new Error("DATABASE_URL not found in .env.local");
    return match[1].trim();
}

/** Leave unchanged */
function shouldSkip(round) {
    const r = String(round ?? "").trim();
    if (!r || r === "?") return true;
    if (/UNFINISHED/i.test(r)) return true;
    return false;
}

/**
 * Normalize ROUND per user rules:
 * - FINAL → النهائي, FINAL - R → النهائي - معاد
 * - SF → 4, SF - R → 4 - معاد | QF → 8, QF - R → 8 - معاد
 * - 3/4 stays 3/4
 * - Any trailing " - R" → " - معاد"
 */
export function normalizeRound(round) {
    if (shouldSkip(round)) return String(round ?? "").trim() || round;

    let r = String(round).trim();

    const exact = {
        "FINAL - R": "النهائي - معاد",
        "FINAL": "النهائي",
        "SF - R": "4 - معاد",
        "SF": "4",
        "QF - R": "8 - معاد",
        "QF": "8",
        "GS": "دور المجموعات",
        "نصف النهائي - معاد": "4 - معاد",
        "نصف النهائي": "4",
        "ربع النهائي - معاد": "8 - معاد",
        "ربع النهائي": "8",
        "المركز 3-4": "3/4",
    };

    if (exact[r]) return exact[r];

    // General replay suffix: " - R" → " - معاد" (e.g. 8 - R → 8 - معاد, R1 - R → R1 - معاد)
    if (/\s-\s*R$/i.test(r)) {
        r = r.replace(/\s-\s*R$/i, " - معاد");
    }

    return r;
}

async function main() {
    const client = new pg.Client({ connectionString: getDbUrl() });
    await client.connect();

    const { rows } = await client.query(`
        SELECT "ROUND" AS round, COUNT(*)::int AS cnt
        FROM "alahly_MATCHDETAILS"
        GROUP BY "ROUND"
        ORDER BY cnt DESC
    `);

    const changes = [];
    for (const { round, cnt } of rows) {
        const to = normalizeRound(round);
        const from = round === null ? null : String(round);
        if (from !== to) {
            changes.push({ from, to, cnt });
        }
    }

    const report = {
        mode: APPLY ? "apply" : "dry-run",
        generatedAt: new Date().toISOString(),
        totalChanges: changes.reduce((s, c) => s + c.cnt, 0),
        mappings: changes.sort((a, b) => b.cnt - a.cnt),
    };

    fs.writeFileSync("scripts/normalize-alahly-round-report.json", JSON.stringify(report, null, 2));

    console.log(`Mode: ${report.mode}`);
    console.log(`Rows to update: ${report.totalChanges}`);
    console.log("\nMappings:");
    for (const m of report.mappings) {
        console.log(`  ${m.cnt}x  "${m.from}"  →  "${m.to}"`);
    }

    if (APPLY && changes.length > 0) {
        await client.query("BEGIN");
        try {
            for (const { from, to } of changes) {
                if (from === null) {
                    await client.query(
                        `UPDATE "alahly_MATCHDETAILS" SET "ROUND" = $1 WHERE "ROUND" IS NULL`,
                        [to]
                    );
                } else {
                    await client.query(
                        `UPDATE "alahly_MATCHDETAILS" SET "ROUND" = $1 WHERE "ROUND" = $2`,
                        [to, from]
                    );
                }
            }
            await client.query("COMMIT");
            console.log("\nApplied successfully.");
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        }
    } else if (!APPLY) {
        console.log("\nDry-run only. Re-run with --apply to update.");
    }

    await client.end();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
