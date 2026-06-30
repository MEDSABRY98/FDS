import pg from "pg";

const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
await c.connect();
const sample = await c.query(
    'SELECT "MATCH_ID", "MATCH_ID_TEMP" FROM "alahly_MATCHDETAILS" ORDER BY "ROW_ID" LIMIT 5'
);
console.log("sample:", sample.rows);
const newFmt = await c.query(
    `SELECT COUNT(*)::int AS n FROM "alahly_MATCHDETAILS" WHERE "MATCH_ID" ~ '^T-[0-9]+$'`
);
const oldTemp = await c.query(
    `SELECT COUNT(*)::int AS n FROM "alahly_MATCHDETAILS" WHERE "MATCH_ID_TEMP" IS NOT NULL AND "MATCH_ID_TEMP" <> ''`
);
console.log("new_format_count:", newFmt.rows[0].n);
console.log("has_temp_count:", oldTemp.rows[0].n);
await c.end();
