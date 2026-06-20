/**
 * Drops W-D-L and CLEAN SHEET from int_club_MATCHDETAILS and int_nt_MATCHDETAILS.
 * Usage: node scripts/apply-drop-int-computed-columns.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

function loadDatabaseUrl() {
    if (!fs.existsSync(envPath)) {
        throw new Error(".env.local not found — set DATABASE_URL for Supabase Postgres.");
    }
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

async function main() {
    const sql = fs.readFileSync(
        path.join(root, "supabase", "migrations", "20260619220000_drop_int_computed_columns.sql"),
        "utf8"
    );
    const client = new pg.Client({ connectionString: loadDatabaseUrl(), ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("Dropping computed columns from International match tables...\n");
    await client.query(sql);

    for (const t of ["int_club_MATCHDETAILS", "int_nt_MATCHDETAILS"]) {
        const r = await client.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema='public' AND table_name=$1
             AND column_name IN ('W-D-L', 'CLEAN SHEET')`,
            [t]
        );
        console.log(`${t}: ${r.rows.length ? r.rows.map((x) => x.column_name).join(", ") : "OK (no W-D-L / CLEAN SHEET)"}`);
    }

    await client.end();
    console.log("\nDone.");
}

main().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
