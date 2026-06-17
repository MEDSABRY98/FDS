import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const apply = process.argv.includes("--apply");

const TABLES = [
    "alahly_FINALS_MATCHDETAILS",
    "alahly_FINALS_LINEUPDETAILS",
    "alahly_FINALS_PLAYERDETAILS",
];

function loadDatabaseUrl() {
    const env = fs.readFileSync(path.join(rootDir, ".env.local"), "utf8");
    const match = env.match(/^DATABASE_URL=(.+)$/m);
    if (!match) throw new Error("DATABASE_URL not found in .env.local");
    return match[1].trim();
}

async function tableExists(client, table) {
    const { rows } = await client.query(
        `SELECT to_regclass($1) AS reg`,
        [`public."${table}"`]
    );
    return Boolean(rows[0]?.reg);
}

async function main() {
    const client = new pg.Client({
        connectionString: loadDatabaseUrl(),
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    console.log(apply ? "Mode: apply (DROP TABLE)" : "Mode: dry-run");

    for (const table of TABLES) {
        const exists = await tableExists(client, table);
        if (!exists) {
            console.log(`SKIP (missing): ${table}`);
            continue;
        }
        const sql = `DROP TABLE IF EXISTS "${table}" CASCADE;`;
        console.log(sql);
        if (apply) {
            await client.query(sql);
            console.log(`Dropped: ${table}`);
        }
    }

    await client.end();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
