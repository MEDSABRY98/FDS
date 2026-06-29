/**
 * Merge alahly_HOWPENMISSED / egy_NT_HOWPENMISSED into PLAYERDETAILS."HOW MISSED?"
 * on matching PENMISSED rows (MATCH_ID + EVENT_ID).
 *
 * Usage: node scripts/migrate-howpen-to-playerdetails.mjs
 * Requires DATABASE_URL in .env.local
 */
import fs from "fs";
import path from "path";
import pg from "pg";

const { Client } = pg;

function loadDatabaseUrl() {
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) {
        throw new Error(".env.local not found");
    }
    const raw = fs.readFileSync(envPath, "utf8");
    const line = raw.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
    if (!line) throw new Error("DATABASE_URL missing in .env.local");
    return line.slice("DATABASE_URL=".length).trim();
}

const TEAMS = [
    {
        label: "Al Ahly",
        playerTable: "alahly_PLAYERDETAILS",
        howTable: "alahly_HOWPENMISSED",
    },
    {
        label: "Egypt NT",
        playerTable: "egy_NT_PLAYERDETAILS",
        howTable: "egy_NT_HOWPENMISSED",
    },
];

async function ensureColumn(client, table) {
    await client.query(
        `ALTER TABLE public."${table}" ADD COLUMN IF NOT EXISTS "HOW MISSED?" text;`
    );
}

async function migrateTeam(client, { label, playerTable, howTable }) {
    await ensureColumn(client, playerTable);

    const updateSql = `
        UPDATE public."${playerTable}" AS p
        SET "HOW MISSED?" = h."HOW MISSED?"
        FROM public."${howTable}" AS h
        WHERE TRIM(p."MATCH_ID") = TRIM(h."MATCH_ID")
          AND TRIM(p."EVENT_ID") = TRIM(h."EVENT_ID")
          AND UPPER(TRIM(p."TYPE")) = 'PENMISSED'
          AND TRIM(COALESCE(h."HOW MISSED?", '')) <> '';
    `;
    const updateResult = await client.query(updateSql);

    const penWithoutHow = await client.query(
        `
        SELECT DISTINCT TRIM(p."MATCH_ID") AS match_id
        FROM public."${playerTable}" AS p
        WHERE UPPER(TRIM(p."TYPE")) = 'PENMISSED'
          AND (p."HOW MISSED?" IS NULL OR TRIM(p."HOW MISSED?") = '')
        ORDER BY match_id;
        `
    );

    const stats = await client.query(
        `
        SELECT
          (SELECT COUNT(*)::int FROM public."${howTable}") AS how_rows,
          (SELECT COUNT(*)::int FROM public."${playerTable}" WHERE UPPER(TRIM("TYPE")) = 'PENMISSED') AS pen_missed,
          (SELECT COUNT(*)::int FROM public."${playerTable}" WHERE UPPER(TRIM("TYPE")) = 'PENMISSED' AND TRIM(COALESCE("HOW MISSED?", '')) <> '') AS pen_with_how;
        `
    );

    return {
        label,
        updatedByEventId: updateResult.rowCount,
        stats: stats.rows[0],
        penMissedWithoutHowMatchIds: penWithoutHow.rows.map((r) => r.match_id),
    };
}

async function main() {
    const client = new Client({ connectionString: loadDatabaseUrl() });
    await client.connect();

    try {
        const results = [];
        for (const team of TEAMS) {
            results.push(await migrateTeam(client, team));
        }

        console.log(JSON.stringify({ ok: true, results }, null, 2));
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
