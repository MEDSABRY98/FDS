import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name ILIKE 'db_%'
    ORDER BY table_name
`);
console.log(rows.map((r) => r.table_name).join("\n"));
await client.end();
