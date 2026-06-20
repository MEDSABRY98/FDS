/**
 * Normalize CATEGORY question-mark variants in int_nt_MATCHDETAILS → "?"
 * Usage: node scripts/normalize-int-nt-category.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

import { normalizeCategoryValue } from "./lib/normalize-category.mjs";

export { normalizeCategoryValue };

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const before = await client.query(`
  SELECT "CATEGORY", COUNT(*)::int AS n
  FROM "int_nt_MATCHDETAILS"
  WHERE "CATEGORY" IN ('?', '؟') OR btrim("CATEGORY") IN ('?', '؟')
  GROUP BY "CATEGORY"
`);
console.log("Before:", before.rows);

const result = await client.query(`
  UPDATE "int_nt_MATCHDETAILS"
  SET "CATEGORY" = '?'
  WHERE "CATEGORY" = '؟' OR btrim("CATEGORY") = '؟'
  RETURNING "ROW_ID"
`);
console.log(`Updated ${result.rowCount} rows (Arabic ؟ → ?).`);

const after = await client.query(`
  SELECT "CATEGORY", COUNT(*)::int AS n
  FROM "int_nt_MATCHDETAILS"
  WHERE "CATEGORY" IN ('?', '؟')
  GROUP BY "CATEGORY"
`);
console.log("After:", after.rows);

await client.end();
