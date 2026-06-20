import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const all = await client.query(`
  SELECT "CATEGORY", COUNT(*)::int AS n
  FROM "int_nt_MATCHDETAILS"
  GROUP BY "CATEGORY"
  ORDER BY n DESC
  LIMIT 50
`);

console.log("Top CATEGORY values (including null/empty):");
all.rows.forEach((x) => {
    const v = x.CATEGORY;
    const display = v == null ? "(null)" : v === "" ? "(empty string)" : JSON.stringify(v);
    console.log(display, "->", x.n);
});

const weird = await client.query(`
  SELECT "ROW_ID", "CATEGORY", length("CATEGORY") AS len, encode("CATEGORY"::bytea, 'hex') AS hex
  FROM "int_nt_MATCHDETAILS"
  WHERE "CATEGORY" ~ '[?؟]'
     OR btrim(coalesce("CATEGORY", '')) = '?'
     OR "CATEGORY" ~ '^\\s+\\?\\s*$'
  LIMIT 20
`);
console.log("\nRows with ? variants:");
weird.rows.forEach((x) => console.log(x.ROW_ID, JSON.stringify(x.CATEGORY), "len:", x.len, "hex:", x.hex));

await client.end();
