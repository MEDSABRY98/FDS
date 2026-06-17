import fs from "fs";
import pg from "pg";

const APPLY = process.argv.includes("--apply");
const LEAGUE = "الدوري المصري";

function getDbUrl() {
    const env = fs.readFileSync(".env.local", "utf8");
    const match = env.match(/^DATABASE_URL=(.+)$/m);
    if (!match) throw new Error("DATABASE_URL not found in .env.local");
    return match[1].trim();
}

/** Prefix R before leading round number; skip if R already present */
export function addRPrefix(round) {
    const r = String(round ?? "").trim();
    if (!r) return r;
    if (r === "?" || /UNFINISHED/i.test(r)) return r;

    // Already R before digit at start: R4, R15
    if (/^R\d/.test(r)) return r;

    // CAF-style already has R: 1R11, 2R22
    if (/^\d+R\d/i.test(r)) return r;

    // Pure number → R{num}
    if (/^\d+$/.test(r)) return `R${r}`;

    // Leading number + suffix: 8 - معاد → R8 - معاد
    const m = r.match(/^(\d+)(\s.*)?$/);
    if (m) return `R${m[1]}${m[2] || ""}`;

    return r;
}

async function main() {
    const client = new pg.Client({ connectionString: getDbUrl() });
    await client.connect();

    const { rows } = await client.query(
        `SELECT "ROUND" AS round, COUNT(*)::int AS cnt
         FROM "alahly_MATCHDETAILS"
         WHERE "CHAMPION" = $1
         GROUP BY "ROUND"
         ORDER BY cnt DESC`,
        [LEAGUE]
    );

    const changes = [];
    for (const { round, cnt } of rows) {
        const from = round === null ? null : String(round);
        const to = addRPrefix(from);
        if (from !== to) changes.push({ from, to, cnt });
    }

    const report = {
        mode: APPLY ? "apply" : "dry-run",
        league: LEAGUE,
        generatedAt: new Date().toISOString(),
        totalChanges: changes.reduce((s, c) => s + c.cnt, 0),
        mappings: changes.sort((a, b) => b.cnt - a.cnt),
    };

    fs.writeFileSync("scripts/prefix-league-round-r-report.json", JSON.stringify(report, null, 2));

    console.log(`League: ${LEAGUE}`);
    console.log(`Mode: ${report.mode}`);
    console.log(`Rows to update: ${report.totalChanges}`);
    for (const m of report.mappings) {
        console.log(`  ${m.cnt}x  "${m.from}"  →  "${m.to}"`);
    }

    if (APPLY && changes.length > 0) {
        await client.query("BEGIN");
        try {
            for (const { from, to } of changes) {
                if (from === null) {
                    await client.query(
                        `UPDATE "alahly_MATCHDETAILS" SET "ROUND" = $1 WHERE "CHAMPION" = $2 AND "ROUND" IS NULL`,
                        [to, LEAGUE]
                    );
                } else {
                    await client.query(
                        `UPDATE "alahly_MATCHDETAILS" SET "ROUND" = $1 WHERE "CHAMPION" = $2 AND "ROUND" = $3`,
                        [to, LEAGUE, from]
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
