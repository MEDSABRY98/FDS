/**
 * Finish EVENT_ID remapping after Egypt NT MATCH_ID migration (bulk SQL).
 */
import pg from "pg";

const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

await c.connect();
console.log("=== FINISH Egypt NT EVENT_ID (bulk) ===");
await c.query("SET statement_timeout = 0");
await c.query("BEGIN");

try {
    const players = await c.query(`
        UPDATE "egy_NT_PLAYERDETAILS" p
        SET
            "EVENT_ID" = REPLACE(p."EVENT_ID", m."MATCH_ID_TEMP", m."MATCH_ID"),
            "PARENT_EVENT_ID" = REPLACE(p."PARENT_EVENT_ID", m."MATCH_ID_TEMP", m."MATCH_ID")
        FROM "egy_NT_MATCHDETAILS" m
        WHERE p."MATCH_ID" = m."MATCH_ID"
          AND m."MATCH_ID_TEMP" IS NOT NULL AND m."MATCH_ID_TEMP" <> ''
          AND (
                p."EVENT_ID" LIKE m."MATCH_ID_TEMP" || '%'
             OR p."PARENT_EVENT_ID" LIKE m."MATCH_ID_TEMP" || '%'
          )
    `);
    console.log(`Players updated: ${players.rowCount}`);

    const gks = await c.query(`
        UPDATE "egy_NT_GKSDETAILS" g
        SET "EVENT_ID" = REPLACE(g."EVENT_ID", m."MATCH_ID_TEMP", m."MATCH_ID")
        FROM "egy_NT_MATCHDETAILS" m
        WHERE g."MATCH_ID" = m."MATCH_ID"
          AND m."MATCH_ID_TEMP" IS NOT NULL AND m."MATCH_ID_TEMP" <> ''
          AND g."EVENT_ID" LIKE '%' || m."MATCH_ID_TEMP" || '%'
    `);
    console.log(`GKs updated: ${gks.rowCount}`);

    await c.query("COMMIT");
    console.log("COMMIT OK");
} catch (err) {
    await c.query("ROLLBACK");
    throw err;
} finally {
    await c.end();
}
