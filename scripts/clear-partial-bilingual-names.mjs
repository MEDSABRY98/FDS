import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
}

await client.connect();

const tables = [
    ["db_PLAYERS", "PLAYER_NAME_EN"],
    ["db_MANAGERS", "MANAGER_NAME_EN"],
    ["db_REFEREES", "REFEREE_NAME_EN"],
    ["db_TEAMS", "TEAM_NAME_EN"],
    ["db_STADIUMS", "STADIUM_NAME_EN"],
];

for (const [table, col] of tables) {
    const before = await client.query(
        `SELECT COUNT(*)::int AS n FROM "${table}" WHERE "${col}" IS NOT NULL AND TRIM("${col}") <> ''`
    );
    await client.query(
        `UPDATE "${table}" SET "${col}" = NULL WHERE "${col}" IS NOT NULL AND TRIM("${col}") <> ''`
    );
    const after = await client.query(
        `SELECT COUNT(*)::int AS n FROM "${table}" WHERE "${col}" IS NOT NULL AND TRIM("${col}") <> ''`
    );
    console.log(`${table}.${col}: ${before.rows[0].n} cleared -> ${after.rows[0].n} remaining`);
}

await client.end();
console.log("Done. Arabic name columns were not changed.");
