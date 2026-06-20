/**
 * Import int_nt_MATCHDETAILS from CSV.
 * Expected columns (16):
 * ROW_ID, GAME, AGE, SEASON, HOST COUNTRY, DATE, CATEGORY, ROUND,
 * TEAMA, CONTINENT, TEAMASCORE, TEAMBSCORE, TEAMAPEN, TEAMBPEN, TEAMB, CONTINENT
 * Usage: node scripts/import-int-nt-csv.mjs "path/to/file.csv"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { fixRoundValue } from "./lib/fix-round-value.mjs";
import { normalizeCategoryValue } from "./lib/normalize-category.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const csvPath = process.argv[2];

function loadDatabaseUrl() {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        if (trimmed.slice(0, eq).trim() === "DATABASE_URL") {
            return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        }
    }
    throw new Error("DATABASE_URL missing in .env.local");
}

function buildMatchId(season, date, teamA, teamB, rowId) {
    const base = [season, date, teamA, teamB].map((v) => String(v ?? "").trim()).filter(Boolean).join("");
    return base || rowId;
}

function parseIntOrNull(val) {
    if (val === "" || val == null) return null;
    const n = parseInt(String(val).trim(), 10);
    return Number.isNaN(n) ? null : n;
}

function parseCsvLine(line) {
    const parts = line.split(",");
    if (parts.length < 16) return null;
    const [
        rowId, game, age, season, hostCountry, date, category, round,
        teamA, contA, scoreA, scoreB, penA, penB, teamB, contB,
    ] = parts;
    return {
        rowId: rowId?.trim(),
        game: game?.trim() || null,
        age: age?.trim() || null,
        season: season?.trim() || null,
        hostCountry: hostCountry?.trim() || null,
        date: date?.trim() || null,
        category: category?.trim() || null,
        round: round?.trim() || null,
        teamA: teamA?.trim() || null,
        contA: contA?.trim() || null,
        scoreA: parseIntOrNull(scoreA),
        scoreB: parseIntOrNull(scoreB),
        penA: penA?.trim() || null,
        penB: penB?.trim() || null,
        teamB: teamB?.trim() || null,
        contB: contB?.trim() || null,
    };
}

function parseCsvFile(filePath) {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    const header = lines[0]?.split(",").map((h) => h.trim());
    console.log("CSV headers:", header?.join(" | "));

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const parsed = parseCsvLine(lines[i]);
        if (!parsed?.rowId) continue;
        rows.push(parsed);
    }
    return rows;
}

async function main() {
    if (!csvPath) {
        throw new Error("Usage: node scripts/import-int-nt-csv.mjs \"path/to/file.csv\"");
    }
    if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV not found: ${csvPath}`);
    }

    const parsed = parseCsvFile(csvPath);
    console.log(`Parsed ${parsed.length} rows from ${csvPath}`);

    const seenMatchIds = new Set();
    const records = parsed.map((r) => {
        let matchId = buildMatchId(r.season, r.date, r.teamA, r.teamB, r.rowId);
        if (seenMatchIds.has(matchId)) {
            matchId = `${matchId}${r.rowId}`;
        }
        seenMatchIds.add(matchId);

        return {
            ROW_ID: r.rowId,
            MATCH_ID: matchId,
            GAME: r.game,
            AGE: r.age,
            SEASON: r.season,
            "HOST COUNTRY": r.hostCountry,
            DATE: r.date,
            CATEGORY: normalizeCategoryValue(r.category),
            ROUND: fixRoundValue(r.round),
            TEAMA: r.teamA,
            "TEAMA CONTINENT": r.contA,
            TEAMASCORE: r.scoreA,
            TEAMBSCORE: r.scoreB,
            TEAMAPEN: r.penA,
            TEAMBPEN: r.penB,
            TEAMB: r.teamB,
            "TEAMB CONTINENT": r.contB,
        };
    });

    const client = new pg.Client({
        connectionString: loadDatabaseUrl(),
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    await client.query('DELETE FROM "int_nt_MATCHDETAILS"');
    console.log("Cleared existing rows.");

    const chunkSize = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const values = [];
        const placeholders = chunk.map((row, idx) => {
            const base = idx * 17;
            values.push(
                row.ROW_ID,
                row.MATCH_ID,
                row.GAME,
                row.AGE,
                row.SEASON,
                row["HOST COUNTRY"],
                row.DATE,
                row.CATEGORY,
                row.ROUND,
                row.TEAMA,
                row["TEAMA CONTINENT"],
                row.TEAMASCORE,
                row.TEAMBSCORE,
                row.TEAMAPEN,
                row.TEAMBPEN,
                row.TEAMB,
                row["TEAMB CONTINENT"]
            );
            const o = base + 1;
            return `($${o},$${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8},$${o + 9},$${o + 10},$${o + 11},$${o + 12},$${o + 13},$${o + 14},$${o + 15},$${o + 16})`;
        });

        await client.query(
            `INSERT INTO "int_nt_MATCHDETAILS"
            ("ROW_ID","MATCH_ID","GAME","AGE","SEASON","HOST COUNTRY","DATE","CATEGORY","ROUND","TEAMA","TEAMA CONTINENT","TEAMASCORE","TEAMBSCORE","TEAMAPEN","TEAMBPEN","TEAMB","TEAMB CONTINENT")
            VALUES ${placeholders.join(",")}`,
            values
        );
        inserted += chunk.length;
        console.log(`Inserted ${inserted}/${records.length}...`);
    }

    const verify = await client.query('SELECT COUNT(*)::int AS n FROM "int_nt_MATCHDETAILS"');
    console.log(`Done. ${verify.rows[0].n} rows in int_nt_MATCHDETAILS.`);
    await client.end();
}

main().catch((err) => {
    console.error("Import failed:", err.message);
    process.exit(1);
});
