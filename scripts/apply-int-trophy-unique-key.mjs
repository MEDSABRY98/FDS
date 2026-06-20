/**
 * Updates int_TROPHY_GENERAL unique index to include PLACE + RUNNER-UP.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

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

async function main() {
    const client = new pg.Client({
        connectionString: loadDatabaseUrl(),
        ssl: { rejectUnauthorized: false },
    });
    const sql = fs.readFileSync(
        path.join(root, "supabase", "migrations", "20260619240000_update_int_trophy_unique_key.sql"),
        "utf8"
    );
    await client.connect();
    await client.query(sql);
    await client.end();
    console.log("Done. Unique key is now TYPE+GAME+COMPETITION+SEASON+PLACE+RUNNER-UP.");
}

main().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
