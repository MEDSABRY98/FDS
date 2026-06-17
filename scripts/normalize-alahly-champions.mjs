import fs from "fs";
import pg from "pg";

const APPLY = process.argv.includes("--apply");

function getDbUrl() {
    const env = fs.readFileSync(".env.local", "utf8");
    const match = env.match(/^DATABASE_URL=(.+)$/m);
    if (!match) throw new Error("DATABASE_URL not found in .env.local");
    return match[1].trim();
}

/** CHAMPION column renames */
const CHAMPION_MAP = {
    League: "الدوري المصري",
    "Cairo League": "دوري منطقة القاهرة",
    "Super Cup": "السوبر المصري",
    "Egypt Cup": "كأس مصر",
    "Sultan Cup": "كأس السلطان",
    "كأس السلط": "كأس السلطان",
};

/** CHAMPION SYSTEM renames */
const CHAMPION_SYSTEM_MAP = {
    EGY: "مصري",
};

/** SEASON - NAME text prefix (longest first) */
const SEASON_PREFIX_MAP = [
    ["Cairo League ", "دوري منطقة القاهرة "],
    ["Egypt Cup ", "كأس مصر "],
    ["Super Cup ", "السوبر المصري "],
    ["Sultan Cup ", "كأس السلطان "],
    ["كأس السلط ", "كأس السلطان "],
    ["League ", "الدوري المصري "],
];

export function normalizeChampion(value) {
    if (value == null) return value;
    const v = String(value).trim();
    return CHAMPION_MAP[v] ?? v;
}

export function normalizeChampionSystem(value) {
    if (value == null) return value;
    const v = String(value).trim();
    return CHAMPION_SYSTEM_MAP[v] ?? v;
}

export function normalizeSeasonName(value) {
    if (value == null) return value;
    let s = String(value).trim();
    if (!s) return s;
    for (const [from, to] of SEASON_PREFIX_MAP) {
        if (s.startsWith(from)) {
            s = to + s.slice(from.length);
            break;
        }
    }
    return s;
}

async function main() {
    const client = new pg.Client({ connectionString: getDbUrl() });
    await client.connect();

    const { rows } = await client.query(`SELECT * FROM "alahly_MATCHDETAILS"`);

    const championChanges = new Map();
    const systemChanges = new Map();
    const seasonChanges = new Map();
    const rowUpdates = [];

    for (const row of rows) {
        const newChampion = normalizeChampion(row.CHAMPION);
        const newSystem = normalizeChampionSystem(row["CHAMPION SYSTEM"]);
        const newSeason = normalizeSeasonName(row["SEASON - NAME"]);

        const fromCh = row.CHAMPION == null ? null : String(row.CHAMPION);
        const fromSys = row["CHAMPION SYSTEM"] == null ? null : String(row["CHAMPION SYSTEM"]);
        const fromSeason = row["SEASON - NAME"] == null ? null : String(row["SEASON - NAME"]);

        const changed =
            fromCh !== newChampion ||
            fromSys !== newSystem ||
            fromSeason !== newSeason;

        if (fromCh !== newChampion) {
            const key = `${fromCh} → ${newChampion}`;
            championChanges.set(key, (championChanges.get(key) || 0) + 1);
        }
        if (fromSys !== newSystem) {
            const key = `${fromSys} → ${newSystem}`;
            systemChanges.set(key, (systemChanges.get(key) || 0) + 1);
        }
        if (fromSeason !== newSeason) {
            const key = `${fromSeason} → ${newSeason}`;
            seasonChanges.set(key, (seasonChanges.get(key) || 0) + 1);
        }

        if (changed) {
            rowUpdates.push({
                matchId: row.MATCH_ID,
                champion: newChampion,
                system: newSystem,
                season: newSeason,
            });
        }
    }

    const report = {
        mode: APPLY ? "apply" : "dry-run",
        generatedAt: new Date().toISOString(),
        rowsToUpdate: rowUpdates.length,
        championMappings: [...championChanges.entries()]
            .map(([k, cnt]) => ({ mapping: k, cnt }))
            .sort((a, b) => b.cnt - a.cnt),
        championSystemMappings: [...systemChanges.entries()]
            .map(([k, cnt]) => ({ mapping: k, cnt }))
            .sort((a, b) => b.cnt - a.cnt),
        seasonMappings: [...seasonChanges.entries()]
            .map(([k, cnt]) => ({ mapping: k, cnt }))
            .sort((a, b) => b.cnt - a.cnt),
    };

    fs.writeFileSync("scripts/normalize-alahly-champions-report.json", JSON.stringify(report, null, 2));

    console.log(`Mode: ${report.mode}`);
    console.log(`Rows to update: ${report.rowsToUpdate}`);

    console.log("\n--- CHAMPION ---");
    for (const m of report.championMappings) console.log(`  ${m.cnt}x  ${m.mapping}`);

    console.log("\n--- CHAMPION SYSTEM ---");
    for (const m of report.championSystemMappings) console.log(`  ${m.cnt}x  ${m.mapping}`);

    console.log("\n--- SEASON - NAME (sample) ---");
    for (const m of report.seasonMappings.slice(0, 25)) console.log(`  ${m.cnt}x  ${m.mapping}`);
    if (report.seasonMappings.length > 25) {
        console.log(`  ... +${report.seasonMappings.length - 25} more in report JSON`);
    }

    if (APPLY && rowUpdates.length > 0) {
        await client.query("BEGIN");
        try {
            for (const u of rowUpdates) {
                await client.query(
                    `UPDATE "alahly_MATCHDETAILS"
                     SET "CHAMPION" = $1, "CHAMPION SYSTEM" = $2, "SEASON - NAME" = $3
                     WHERE "MATCH_ID" = $4`,
                    [u.champion, u.system, u.season, u.matchId]
                );
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
