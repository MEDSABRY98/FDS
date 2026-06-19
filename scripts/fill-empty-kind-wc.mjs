import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const env = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const before = await client.query(
    `SELECT COUNT(*)::int AS n FROM "int_club_MATCHDETAILS" WHERE "KIND" IS NULL OR btrim("KIND") = ''`
);
const updated = await client.query(
    `UPDATE "int_club_MATCHDETAILS" SET "KIND" = 'WC' WHERE "KIND" IS NULL OR btrim("KIND") = ''`
);

console.log(`Empty KIND before: ${before.rows[0].n}`);
console.log(`Updated to WC: ${updated.rowCount}`);

await client.end();
