import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const tables = [
    ["db_PLAYERS", "PLAYER_NAME_EN"],
    ["db_MANAGERS", "MANAGER_NAME_EN"],
    ["db_REFEREES", "REFEREE_NAME_EN"],
    ["db_TEAMS", "TEAM_NAME_EN"],
    ["db_STADIUMS", "STADIUM_NAME_EN"],
];

for (const [table, col] of tables) {
    const { rows } = await client.query(
        `SELECT COUNT(*)::int AS total, COUNT("${col}") FILTER (WHERE "${col}" IS NOT NULL AND TRIM("${col}") <> '')::int AS filled FROM "${table}"`
    );
    console.log(`${table}: ${rows[0].filled}/${rows[0].total} rows have ${col}`);
}

await client.end();
