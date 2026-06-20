/**
 * Import int_club_MATCHDETAILS from CSV (444.csv format).
 * Usage: node scripts/import-int-club-csv.mjs "path/to/file.csv"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const csvPath = process.argv[2] || "c:\\Users\\MEDSA\\OneDrive\\Desktop\\444.csv";

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

function parseCsvLine(line) {
    const parts = line.split(",");
    if (parts.length < 14) return null;
    const [rowId, game, kind, edition, round, han, teamA, contA, gf, ga, pen, teamB, contB, note] = parts;
    return {
        rowId: rowId?.trim(),
        game: game?.trim() || null,
        kind: kind?.trim() || "WC",
        edition: edition?.trim() || null,
        round: round?.trim() || null,
        han: han?.trim() || null,
        teamA: teamA?.trim() || null,
        contA: contA?.trim() || null,
        gf: gf?.trim() === "" ? null : parseInt(gf, 10),
        ga: ga?.trim() === "" ? null : parseInt(ga, 10),
        pen: pen?.trim() || null,
        teamB: teamB?.trim() || null,
        contB: contB?.trim() || null,
        note: note?.trim() || null,
    };
}

import { fixRoundValue } from "./lib/fix-round-value.mjs";

function buildMatchId(edition, teamA, teamB, han, rowId) {
    let base = [edition, teamA, teamB].map((v) => String(v ?? "").trim()).filter(Boolean).join("");
    if (han) base += han;
    return base || rowId;
}

function parseCsvFile(filePath) {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const parsed = parseCsvLine(lines[i]);
        if (!parsed?.rowId) continue;
        rows.push(parsed);
    }
    return rows;
}

async function main() {
    if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV not found: ${csvPath}`);
    }

    const parsed = parseCsvFile(csvPath);
    console.log(`Parsed ${parsed.length} rows from ${csvPath}`);

    const seenMatchIds = new Set();
    const records = parsed.map((r) => {
        let matchId = buildMatchId(r.edition, r.teamA, r.teamB, r.han, r.rowId);
        if (seenMatchIds.has(matchId)) {
            matchId = `${matchId}${r.rowId}`;
        }
        seenMatchIds.add(matchId);

        return {
            ROW_ID: r.rowId,
            MATCH_ID: matchId,
            GAME: r.game,
            KIND: r.kind,
            Edition: r.edition,
            ROUND: fixRoundValue(r.round),
            "H-A-N": r.han,
            "TEAM A": r.teamA,
            "TEAM A CONTINENT": r.contA,
            GF: Number.isNaN(r.gf) ? null : r.gf,
            GA: Number.isNaN(r.ga) ? null : r.ga,
            PEN: r.pen,
            "TEAM B": r.teamB,
            "TEAM B CONTINENT": r.contB,
            NOTE: r.note,
        };
    });

    const client = new pg.Client({
        connectionString: loadDatabaseUrl(),
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    await client.query('DELETE FROM "int_club_MATCHDETAILS"');
    console.log("Cleared existing rows.");

    const chunkSize = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const values = [];
        const placeholders = chunk.map((row, idx) => {
            const base = idx * 15;
            values.push(
                row.ROW_ID,
                row.MATCH_ID,
                row.GAME,
                row.KIND,
                row.Edition,
                row.ROUND,
                row["H-A-N"],
                row["TEAM A"],
                row["TEAM A CONTINENT"],
                row.GF,
                row.GA,
                row.PEN,
                row["TEAM B"],
                row["TEAM B CONTINENT"],
                row.NOTE
            );
            const o = base + 1;
            return `($${o},$${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8},$${o + 9},$${o + 10},$${o + 11},$${o + 12},$${o + 13},$${o + 14})`;
        });

        await client.query(
            `INSERT INTO "int_club_MATCHDETAILS"
            ("ROW_ID","MATCH_ID","GAME","KIND","Edition","ROUND","H-A-N","TEAM A","TEAM A CONTINENT","GF","GA","PEN","TEAM B","TEAM B CONTINENT","NOTE")
            VALUES ${placeholders.join(",")}`,
            values
        );
        inserted += chunk.length;
        console.log(`Inserted ${inserted}/${records.length}...`);
    }

    const verify = await client.query('SELECT COUNT(*)::int AS n FROM "int_club_MATCHDETAILS"');
    console.log(`Done. ${verify.rows[0].n} rows in int_club_MATCHDETAILS.`);
    await client.end();
}

main().catch((err) => {
    console.error("Import failed:", err.message);
    process.exit(1);
});
