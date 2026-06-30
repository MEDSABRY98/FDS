import pg from "pg";

const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
await c.connect();

const stalePlayers = await c.query(`
    SELECT COUNT(*)::int AS n
    FROM "alahly_PLAYERDETAILS" p
    JOIN "alahly_MATCHDETAILS" m ON m."MATCH_ID" = p."MATCH_ID"
    WHERE p."EVENT_ID" LIKE m."MATCH_ID_TEMP" || '%'
`);
const staleGks = await c.query(`
    SELECT COUNT(*)::int AS n
    FROM "alahly_GKSDETAILS" g
    JOIN "alahly_MATCHDETAILS" m ON m."MATCH_ID" = g."MATCH_ID"
    WHERE g."EVENT_ID" LIKE '%' || m."MATCH_ID_TEMP" || '%'
`);
const orphans = await c.query(`
    SELECT COUNT(*)::int AS n
    FROM "alahly_PLAYERDETAILS" p
    WHERE NOT EXISTS (
        SELECT 1 FROM "alahly_MATCHDETAILS" m WHERE m."MATCH_ID" = p."MATCH_ID"
    )
`);

console.log("stale_player_event_ids:", stalePlayers.rows[0].n);
console.log("stale_gk_event_ids:", staleGks.rows[0].n);
console.log("orphan_player_rows:", orphans.rows[0].n);

await c.end();
