/**
 * Fix pre-existing typo orphan: Qater40528 -> FirstT-042640528
 */
import pg from "pg";

const OLD_ID = "Qater40528";
const NEW_ID = "FirstT-042640528";

const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
await c.connect();
await c.query("BEGIN");

try {
    const players = await c.query(`
        UPDATE "egy_NT_PLAYERDETAILS"
        SET
            "MATCH_ID" = $2,
            "EVENT_ID" = REPLACE("EVENT_ID", $1, $2),
            "PARENT_EVENT_ID" = REPLACE("PARENT_EVENT_ID", $1, $2)
        WHERE "MATCH_ID" = $1
    `, [OLD_ID, NEW_ID]);
    console.log(`Fixed player rows: ${players.rowCount}`);
    await c.query("COMMIT");
} catch (err) {
    await c.query("ROLLBACK");
    throw err;
} finally {
    await c.end();
}
