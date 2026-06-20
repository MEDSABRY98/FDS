/**
 * Creates int_nt_MATCHDETAILS table + get_intnt_tables RPC on Supabase Postgres.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
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
    const databaseUrl = loadDatabaseUrl();
    const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    const sql = fs.readFileSync(
        path.join(root, "supabase", "migrations", "20260619210000_create_int_nt_matchdetails.sql"),
        "utf8"
    );

    await client.connect();
    console.log("Connected. Creating int_nt_MATCHDETAILS...\n");
    await client.query(sql);
    await client.end();
    console.log("Done. Table int_nt_MATCHDETAILS and get_intnt_tables() are ready.");
}

main().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
