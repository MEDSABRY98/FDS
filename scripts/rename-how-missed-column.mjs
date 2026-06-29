import fs from "fs";
import pg from "pg";

const raw = fs.readFileSync(".env.local", "utf8");
const url = raw.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL=")).slice(13).trim();
const client = new pg.Client({ connectionString: url });

await client.connect();
try {
    for (const table of ["alahly_PLAYERDETAILS", "egy_NT_PLAYERDETAILS"]) {
        const check = await client.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'HOW MISSED?'`,
            [table]
        );
        if (check.rows.length > 0) {
            await client.query(`ALTER TABLE public."${table}" RENAME COLUMN "HOW MISSED?" TO "HOW MISSED"`);
            console.log(`Renamed ${table}: HOW MISSED? -> HOW MISSED`);
        } else {
            console.log(`Skip ${table}: HOW MISSED? not found (maybe already renamed)`);
        }
    }
} finally {
    await client.end();
}
