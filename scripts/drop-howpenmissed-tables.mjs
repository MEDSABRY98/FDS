/**
 * Rename HOWPENMISSED tables to backup after merge into PLAYERDETAILS.
 *
 * Usage: node scripts/drop-howpenmissed-tables.mjs
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

const RENAMES = [
    ["alahly_HOWPENMISSED", "alahly_HOWPENMISSED_backup"],
    ["egy_NT_HOWPENMISSED", "egy_NT_HOWPENMISSED_backup"],
];

async function main() {
    const client = new Client({ connectionString: loadDatabaseUrl() });
    await client.connect();

    try {
        for (const [from, to] of RENAMES) {
            const exists = await client.query(
                `SELECT to_regclass($1) AS reg`,
                [`public."${from}"`]
            );
            if (!exists.rows[0]?.reg) {
                console.log(`Skip ${from}: table not found`);
                continue;
            }

            const backupExists = await client.query(
                `SELECT to_regclass($1) AS reg`,
                [`public."${to}"`]
            );
            if (backupExists.rows[0]?.reg) {
                console.log(`Skip ${from}: backup ${to} already exists`);
                continue;
            }

            await client.query(`ALTER TABLE public."${from}" RENAME TO "${to}"`);
            console.log(`Renamed ${from} -> ${to}`);
        }
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
