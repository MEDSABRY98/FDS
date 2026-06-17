import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
}

const sql = readFileSync(
    join(rootDir, "supabase/migrations/20260617180000_add_bilingual_catalog_names.sql"),
    "utf8"
);

const client = new pg.Client({ connectionString: databaseUrl });

try {
    await client.connect();
    await client.query(sql);

    const { rows } = await client.query(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name LIKE '%\\_NAME_EN' ESCAPE '\\'
        ORDER BY table_name
    `);

    console.log("Migration applied successfully.");
    rows.forEach((row) => console.log(`  - ${row.table_name}.${row.column_name}`));
} catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
} finally {
    await client.end();
}
