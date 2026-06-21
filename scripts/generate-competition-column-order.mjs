/**
 * Regenerate competition lists in game_column_order.json from DB (games order preserved).
 * Usage: node scripts/generate-competition-column-order.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const orderPath = path.join(root, "app/InternationalTrophy/Aggregates/game_column_order.json");
const env = fs.readFileSync(envPath, "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

const existing = JSON.parse(fs.readFileSync(orderPath, "utf8"));
const gameOrder = existing.games || ["الكورة", "السلة", "الطائرة", "اليد"];

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows } = await client.query(`
    SELECT DISTINCT "TYPE", "GAME", "COMPETITION"
    FROM "int_TROPHY_GENERAL"
    WHERE "TYPE" IS NOT NULL AND TRIM("TYPE") <> ''
      AND "GAME" IS NOT NULL AND TRIM("GAME") <> ''
      AND "COMPETITION" IS NOT NULL AND TRIM("COMPETITION") <> ''
    ORDER BY "TYPE", "GAME", "COMPETITION"
`);

const competitions = { Club: {}, NT: {} };

for (const row of rows) {
    const type = String(row.TYPE).trim();
    const game = String(row.GAME).trim();
    const competition = String(row.COMPETITION).trim();
    if (!competitions[type]) competitions[type] = {};
    if (!competitions[type][game]) competitions[type][game] = [];
    if (!competitions[type][game].includes(competition)) competitions[type][game].push(competition);
}

for (const type of Object.keys(competitions)) {
    const sortedGames = Object.keys(competitions[type]).sort((a, b) => {
        const ia = gameOrder.indexOf(a);
        const ib = gameOrder.indexOf(b);
        const rankA = ia >= 0 ? ia : 9999;
        const rankB = ib >= 0 ? ib : 9999;
        if (rankA !== rankB) return rankA - rankB;
        return a.localeCompare(b, "ar");
    });
    const ordered = {};
    for (const game of sortedGames) {
        ordered[game] = competitions[type][game].sort((a, b) => a.localeCompare(b, "ar"));
    }
    competitions[type] = ordered;
}

const out = {
    games: gameOrder,
    competitions,
};

fs.writeFileSync(orderPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
console.log("Updated", orderPath);
for (const type of ["Club", "NT"]) {
    if (!competitions[type]) continue;
    console.log(`\n${type}:`);
    for (const [game, comps] of Object.entries(competitions[type])) {
        console.log(`  ${game} (${comps.length})`);
    }
}

await client.end();
