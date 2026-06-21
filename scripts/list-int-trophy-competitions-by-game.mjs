import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="))?.slice(13).trim().replace(/^["']|["']$/g, "");

if (!url) {
    console.error("DATABASE_URL missing in .env.local");
    process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows } = await client.query(`
    SELECT DISTINCT "GAME", "COMPETITION"
    FROM "int_TROPHY_GENERAL"
    WHERE "GAME" IS NOT NULL AND TRIM("GAME") <> ''
      AND "COMPETITION" IS NOT NULL AND TRIM("COMPETITION") <> ''
    ORDER BY "GAME", "COMPETITION"
`);

const byGame = {};
for (const row of rows) {
    const game = String(row.GAME).trim();
    const competition = String(row.COMPETITION).trim();
    if (!byGame[game]) byGame[game] = [];
    byGame[game].push(competition);
}

const gameOrder = ["الكورة", "السلة", "الطائرة", "اليد"];
const games = Object.keys(byGame).sort((a, b) => {
    const ia = gameOrder.indexOf(a);
    const ib = gameOrder.indexOf(b);
    const rankA = ia >= 0 ? ia : 9999;
    const rankB = ib >= 0 ? ib : 9999;
    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b, "ar");
});

for (const game of games) {
    console.log(`\n=== ${game} (${byGame[game].length}) ===`);
    byGame[game].forEach((comp, i) => console.log(`${i + 1}. ${comp}`));
}

await client.end();
