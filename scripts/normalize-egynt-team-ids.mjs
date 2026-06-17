import fs from "fs";
import pg from "pg";

const APPLY = process.argv.includes("--apply");
const url = fs.readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.+)$/m)[1].trim();
const c = new pg.Client({ connectionString: url });
await c.connect();

/** Egypt TEAM: مصر id → Egypt id */
const EGYPT_TEAM_MAP = {
    "T-0250": "T-0125",
};

/** OPPONENT TEAM id swaps (Arabic-named national team id → English id) */
const OPPONENT_MAP = {
    "T-0030": "T-0531", // Morocco
    "T-0480": "T-0439", // Libya
    "T-0527": "T-0606", // Angola
    "T-0637": "T-0491", // South Africa
    "T-0353": "T-0681", // Mozambique
    "T-0547": "T-0148", // Russia
    "T-0651": "T-0303", // Argentina
    "T-0579": "T-0459", // Thailand
    "T-0588": "T-0610", // Spain
    "T-0014": "T-0281", // Italy
    "T-0664": "T-0062", // Kuwait
    "T-0678": "T-0119", // Namibia
    "T-0311": "T-0240", // Zimbabwe
    "T-0216": "T-0060", // Zambia
    "T-0057": "T-0108", // Uruguay
    "T-0524": "T-0680", // Mauritania
    "T-0538": "T-0364", // Somalia
    "T-0032": "T-0155", // Brazil
    "T-0081": "T-0422", // China
    "T-0334": "T-0584", // Ghana
    "T-0004": "T-0214", // Uzbekistan
    "T-0654": "T-0237", // Guinea
    "T-0367": "T-0601", // Netherlands
    "T-0126": "T-0412", // Congo (user: use T-0412)
    "T-0202": "T-0283", // eSwatini
};

async function countUpdates(table, column, map) {
    const changes = [];
    for (const [from, to] of Object.entries(map)) {
        const { rows } = await c.query(
            `SELECT COUNT(*)::int AS cnt FROM "${table}" WHERE "${column}" = $1`,
            [from]
        );
        if (rows[0].cnt > 0) changes.push({ table, column, from, to, cnt: rows[0].cnt });
    }
    return changes;
}

const allChanges = [
    ...(await countUpdates("egy_NT_MATCHDETAILS", "Egypt TEAM", EGYPT_TEAM_MAP)),
    ...(await countUpdates("egy_NT_MATCHDETAILS", "OPPONENT TEAM", OPPONENT_MAP)),
];

console.log(`Mode: ${APPLY ? "apply" : "dry-run"}`);
console.log(`Total row updates: ${allChanges.reduce((s, x) => s + x.cnt, 0)}\n`);
for (const ch of allChanges) {
    console.log(`${ch.cnt}x ${ch.table}.${ch.column}: ${ch.from} → ${ch.to}`);
}

if (APPLY && allChanges.length) {
    await c.query("BEGIN");
    try {
        for (const { table, column, from, to } of allChanges) {
            await c.query(`UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" = $2`, [to, from]);
        }
        await c.query("COMMIT");
        console.log("\nApplied.");
    } catch (e) {
        await c.query("ROLLBACK");
        throw e;
    }
}

await c.end();
