/**
 * Import int_nt_MATCHDETAILS from Excel (.xlsx).
 * Usage: node scripts/import-int-nt-xlsx.mjs "path/to/file.xlsx"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import XLSX from "xlsx";
import { fixRoundValue } from "./lib/fix-round-value.mjs";
import { normalizeCategoryValue } from "./lib/normalize-category.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const xlsxPath = process.argv[2];

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

function excelSerialToDateString(value) {
    if (value == null || value === "") return null;
    if (typeof value === "string") return value.trim() || null;
    const serial = Number(value);
    if (!Number.isFinite(serial)) return String(value).trim() || null;
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    const d = date.getUTCDate();
    const m = date.getUTCMonth() + 1;
    const y = date.getUTCFullYear();
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function parseIntOrNull(val) {
    if (val === "" || val == null) return null;
    const n = parseInt(String(val).trim(), 10);
    return Number.isNaN(n) ? null : n;
}

function trimOrNull(val) {
    if (val == null || val === "") return null;
    const s = String(val).trim();
    return s || null;
}

function buildMatchId(season, date, teamA, teamB, rowId) {
    const base = [season, date, teamA, teamB].map((v) => String(v ?? "").trim()).filter(Boolean).join("");
    return base || rowId;
}

function getContinentB(row) {
    return row["CONTINENT.1"] ?? row["TEAMB CONTINENT"] ?? row.CONTINENT_B ?? null;
}

function parseXlsxFile(filePath) {
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
    console.log(`Sheet: ${sheetName}, rows: ${rows.length}`);
    if (rows.length > 0) console.log("Columns:", Object.keys(rows[0]).join(" | "));
    return rows;
}

async function main() {
    if (!xlsxPath) {
        throw new Error('Usage: node scripts/import-int-nt-xlsx.mjs "path/to/file.xlsx"');
    }
    if (!fs.existsSync(xlsxPath)) {
        throw new Error(`File not found: ${xlsxPath}`);
    }

    const parsed = parseXlsxFile(xlsxPath);
    console.log(`Parsed ${parsed.length} rows from ${xlsxPath}`);

    const seenMatchIds = new Set();
    const records = parsed.map((r, index) => {
        const rowId = trimOrNull(r.ROW_ID) || `R-${String(index + 1).padStart(4, "0")}`;
        const dateStr = excelSerialToDateString(r.DATE);
        const season = trimOrNull(r.SEASON);
        const teamA = trimOrNull(r.TEAMA);
        const teamB = trimOrNull(r.TEAMB);

        let matchId = buildMatchId(season, dateStr, teamA, teamB, rowId);
        if (seenMatchIds.has(matchId)) {
            matchId = `${matchId}${rowId}`;
        }
        seenMatchIds.add(matchId);

        return {
            ROW_ID: rowId,
            MATCH_ID: matchId,
            GAME: trimOrNull(r.GAME),
            AGE: trimOrNull(r.AGE),
            SEASON: season,
            "HOST COUNTRY": trimOrNull(r["HOST COUNTRY"]),
            DATE: dateStr,
            CATEGORY: normalizeCategoryValue(trimOrNull(r.CATEGORY)),
            ROUND: fixRoundValue(trimOrNull(r.ROUND)),
            TEAMA: teamA,
            "TEAMA CONTINENT": trimOrNull(r.CONTINENT),
            TEAMASCORE: parseIntOrNull(r.TEAMASCORE),
            TEAMBSCORE: parseIntOrNull(r.TEAMBSCORE),
            TEAMAPEN: trimOrNull(r.TEAMAPEN),
            TEAMBPEN: trimOrNull(r.TEAMPEN),
            TEAMB: teamB,
            "TEAMB CONTINENT": trimOrNull(getContinentB(r)),
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
        if (inserted % 500 === 0 || inserted === records.length) {
            console.log(`Inserted ${inserted}/${records.length}...`);
        }
    }

    const verify = await client.query('SELECT COUNT(*)::int AS n FROM "int_nt_MATCHDETAILS"');
    console.log(`Done. ${verify.rows[0].n} rows in int_nt_MATCHDETAILS.`);
    await client.end();
}

main().catch((err) => {
    console.error("Import failed:", err.message);
    process.exit(1);
});
