import pg from "pg";

const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
await c.connect();

const master = await c.query('SELECT "MATCH_ID" FROM "egy_NT_MATCHDETAILS"');
const masterIds = new Set(master.rows.map((r) => String(r.MATCH_ID).trim()));

const { rows } = await c.query(`
    SELECT "ROW_ID", "MATCH_ID", "MATCH_ID_TEMP", "EVENT_ID", "PLAYER NAME"
    FROM "egy_NT_PLAYERDETAILS"
    WHERE "MATCH_ID" IS NOT NULL AND "MATCH_ID" <> ''
`);

const orphans = rows.filter((r) => !masterIds.has(String(r.MATCH_ID).trim()));
console.log(JSON.stringify(orphans, null, 2));

if (orphans.length) {
    const oldId = String(orphans[0].MATCH_ID).trim();
    const { rows: candidates } = await c.query(`
        SELECT "ROW_ID", "MATCH_ID", "MATCH_ID_TEMP", "OPPONENT TEAM", "DATE"
        FROM "egy_NT_MATCHDETAILS"
        WHERE "MATCH_ID_TEMP" ILIKE $1 OR "OPPONENT TEAM" ILIKE '%qatar%' OR "OPPONENT TEAM" ILIKE '%قطر%'
        LIMIT 10
    `, [`%40528%`]);
    console.log("\nCandidate master matches:");
    console.log(JSON.stringify(candidates, null, 2));
}
await c.end();
