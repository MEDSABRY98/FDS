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
    throw new Error("DATABASE_URL missing");
}

const client = new pg.Client({ connectionString: loadDatabaseUrl(), ssl: { rejectUnauthorized: false } });
await client.connect();

const tables = ["int_club_MATCHDETAILS", "int_nt_MATCHDETAILS", "egy_CLUB_MATCHDETAILS", "egy_NT_MATCHDETAILS", "alahly_MATCHDETAILS"];
for (const t of tables) {
    const r = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
        [t]
    );
    if (r.rows.length) {
        console.log(`${t}:\n  ${r.rows.map((x) => x.column_name).join(", ")}\n`);
    }
}

await client.end();
