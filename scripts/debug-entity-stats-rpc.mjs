import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(rootDir, ".env.local"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const fn of [
    "get_entity_timeline_and_tables",
    "get_dbmanagement_tables",
    "merge_countries",
]) {
    const { rows } = await client.query(`
        SELECT pg_get_functiondef(p.oid) AS def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = $1
        LIMIT 1
    `, [fn]);
    console.log("\n==========", fn, "==========\n");
    console.log(rows[0]?.def || "NOT FOUND");
}

await client.end();
