/**
 * Import int_TROPHY_GENERAL from Excel (.xlsx).
 * Usage: node scripts/import-int-trophy-xlsx.mjs "path/to/file.xlsx"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import XLSX from "xlsx";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const xlsxPath = process.argv[2];
const TABLE = "int_TROPHY_GENERAL";

const COLUMNS = [
    "TYPE", "AREA", "GAME", "COMPETITION", "SEASON",
    "W-MANAGER", "L-MANAGER", "PLACE", "CHAMPION", "RESULT", "RUNNER-UP", "NOTE",
];

/** Legacy Excel headers → canonical column names */
const HEADER_ALIASES = {
    TYBE: "TYPE",
    TYPE: "TYPE",
    "W-MANGER": "W-MANAGER",
    "W-MANAGER": "W-MANAGER",
    "L-MANGER": "L-MANAGER",
    "L-MANAGER": "L-MANAGER",
    RUSELT: "RESULT",
    RESULT: "RESULT",
    "RUNNER-UP": "RUNNER-UP",
    AREA: "AREA",
    GAME: "GAME",
    COMPETITION: "COMPETITION",
    SEASON: "SEASON",
    PLACE: "PLACE",
    CHAMPION: "CHAMPION",
    NOTE: "NOTE",
};

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

function trimOrNull(val) {
    if (val == null || val === "") return null;
    const s = String(val).trim();
    if (!s || s === "-") return null;
    return s;
}

function normalizeType(val) {
    const s = String(val ?? "").trim();
    if (!s) return null;
    const upper = s.toUpperCase();
    if (upper === "CLUB") return "Club";
    if (upper === "NT") return "NT";
    return s;
}

function mapRawRow(raw) {
    const mapped = {};
    for (const [key, val] of Object.entries(raw)) {
        const header = normalizeHeader(key);
        const canonical = HEADER_ALIASES[header] || header;
        mapped[canonical] = val;
    }

    const record = {};
    COLUMNS.forEach((col) => {
        record[col] = trimOrNull(mapped[col]);
    });
    record.TYPE = normalizeType(mapped.TYPE);
    return record;
}

function parseRowIdNumber(value) {
    const raw = String(value ?? "").trim();
    const trailing = raw.match(/(\d+)(?!.*\d)/);
    if (trailing) return parseInt(trailing[1], 10);
    const asNum = parseInt(raw, 10);
    return Number.isFinite(asNum) ? asNum : 0;
}

function buildKey(type, game, competition, season, place, runnerUp) {
    return [type, game, competition, season, place, runnerUp]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join("|");
}

function normalizeHeader(h) {
    return String(h ?? "").trim().toUpperCase();
}

async function getMaxRowId(client) {
    const { rows } = await client.query(`SELECT "ROW_ID" FROM "${TABLE}"`);
    let maxNum = 0;
    rows.forEach((row) => {
        maxNum = Math.max(maxNum, parseRowIdNumber(row.ROW_ID));
    });
    return maxNum;
}

async function getExistingKeys(client) {
    const { rows } = await client.query(`SELECT "TYPE", "GAME", "COMPETITION", "SEASON", "PLACE", "RUNNER-UP" FROM "${TABLE}"`);
    const keys = new Set();
    rows.forEach((row) => {
        const key = buildKey(row.TYPE, row.GAME, row.COMPETITION, row.SEASON, row.PLACE, row["RUNNER-UP"]);
        if (key) keys.add(key);
    });
    return keys;
}

async function main() {
    if (!xlsxPath) {
        console.error("Usage: node scripts/import-int-trophy-xlsx.mjs \"path/to/file.xlsx\"");
        process.exit(1);
    }
    if (!fs.existsSync(xlsxPath)) {
        throw new Error(`File not found: ${xlsxPath}`);
    }

    const workbook = XLSX.readFile(xlsxPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const client = new pg.Client({
        connectionString: loadDatabaseUrl(),
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    let nextId = (await getMaxRowId(client)) + 1;
    const existingKeys = await getExistingKeys(client);
    const toInsert = [];
    const errors = [];

    rawRows.forEach((raw, index) => {
        const rowNum = index + 2;
        const record = mapRawRow(raw);

        const { TYPE, GAME, COMPETITION, SEASON, CHAMPION, PLACE, "RUNNER-UP": runnerUp } = record;
        if (!TYPE && !GAME && !COMPETITION && !SEASON && !CHAMPION) return;

        if (!TYPE || !GAME || !COMPETITION || !SEASON || !CHAMPION) {
            errors.push(`Row ${rowNum}: TYPE, GAME, COMPETITION, SEASON, CHAMPION are required.`);
            return;
        }
        if (TYPE !== "Club" && TYPE !== "NT") {
            errors.push(`Row ${rowNum}: TYPE must be Club or NT.`);
            return;
        }

        const key = buildKey(TYPE, GAME, COMPETITION, SEASON, PLACE, runnerUp);
        if (existingKeys.has(key)) {
            errors.push(`Row ${rowNum}: Duplicate ${key}`);
            return;
        }
        existingKeys.add(key);

        record.ROW_ID = `R-${String(nextId++).padStart(4, "0")}`;
        toInsert.push(record);
    });

    if (errors.length) {
        console.error("Validation errors:");
        errors.forEach((e) => console.error("  -", e));
        await client.end();
        process.exit(1);
    }

    if (!toInsert.length) {
        console.log("No rows to import.");
        await client.end();
        return;
    }

    for (const row of toInsert) {
        const cols = ["ROW_ID", ...COLUMNS];
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        const colList = cols.map((c) => `"${c}"`).join(", ");
        const values = cols.map((c) => row[c] ?? null);
        await client.query(`INSERT INTO "${TABLE}" (${colList}) VALUES (${placeholders})`, values);
    }

    await client.end();
    console.log(`Imported ${toInsert.length} row(s) into ${TABLE}.`);
}

main().catch((err) => {
    console.error("Import failed:", err.message);
    process.exit(1);
});
