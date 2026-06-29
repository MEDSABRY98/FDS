import fs from "fs";
import pg from "pg";

const raw = fs.readFileSync(".env.local", "utf8");
const url = raw.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL=")).slice(13).trim();
const client = new pg.Client({ connectionString: url });
await client.connect();
const r = await client.query(`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('alahly_PLAYERDETAILS', 'egy_NT_PLAYERDETAILS')
    AND column_name ILIKE '%how%miss%'
  ORDER BY 1, 2
`);
console.log(r.rows);
await client.end();
