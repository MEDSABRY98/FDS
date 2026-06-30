import pg from "pg";

const LINKED = [
    "egy_NT_LINEUPDETAILS",
    "egy_NT_PLAYERDETAILS",
    "egy_NT_GKSDETAILS",
    "egy_NT_PKS",
];

const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
await c.connect();

const master = await c.query('SELECT "MATCH_ID" FROM "egy_NT_MATCHDETAILS"');
const masterIds = new Set(master.rows.map((r) => String(r.MATCH_ID).trim()));
let ok = true;

for (const table of LINKED) {
    const { rows } = await c.query(`SELECT "MATCH_ID" FROM "${table}" WHERE "MATCH_ID" IS NOT NULL AND "MATCH_ID" <> ''`);
    const orphans = rows.filter((r) => !masterIds.has(String(r.MATCH_ID).trim()));
    if (orphans.length) {
        ok = false;
        console.log(`FAIL ${table}: ${orphans.length} orphan rows`);
    } else {
        console.log(`OK ${table} (${rows.length} rows)`);
    }
}

const total = await c.query('SELECT COUNT(*)::int AS n FROM "egy_NT_MATCHDETAILS"');
const fmt = await c.query(`SELECT COUNT(*)::int AS n FROM "egy_NT_MATCHDETAILS" WHERE "MATCH_ID" ~ 'T-[0-9]+$'`);
console.log(`OK master TEAM_ID+date suffix: ${fmt.rows[0].n}/${total.rows[0].n}`);

await c.end();
process.exit(ok ? 0 : 1);
