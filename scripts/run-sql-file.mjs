import { readFileSync } from "fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
    console.error("Usage: node scripts/run-sql-file.mjs <path.sql>");
    process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
    await client.query(sql);
    console.log(`OK: ${file}`);
} finally {
    await client.end();
}
