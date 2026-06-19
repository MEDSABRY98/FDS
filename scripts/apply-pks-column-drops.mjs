/**
 * Applies PKS denormalized column drops to Supabase Postgres.
 * Reads DATABASE_URL from .env.local
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
        const key = trimmed.slice(0, eq).trim();
        if (key === "DATABASE_URL") {
            return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        }
    }
    throw new Error("DATABASE_URL missing in .env.local");
}

const migrationFiles = [
    "20260619140000_drop_pks_denormalized_columns.sql",
    "20260619150000_drop_egy_nt_pks_denormalized_columns.sql",
    "20260619160000_drop_alahly_pks_match_result.sql",
];

async function main() {
    const databaseUrl = loadDatabaseUrl();
    const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

    await client.connect();
    console.log("Connected. Applying PKS column drops...\n");

    for (const file of migrationFiles) {
        const sql = fs.readFileSync(path.join(root, "supabase", "migrations", file), "utf8");
        console.log(`--- ${file} ---`);
        await client.query(sql);
        console.log("OK\n");
    }

    await client.end();
    console.log("Done. Denormalized PKS columns removed from alahly_PKS and egy_NT_PKS.");
}

main().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
