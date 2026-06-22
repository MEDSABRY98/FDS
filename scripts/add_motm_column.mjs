import { Client } from 'pg';
import fs from 'fs';

// Read .env.local
const envPath = './.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse DATABASE_URL
let databaseUrl = '';
const lines = envContent.split('\n');
for (const line of lines) {
    if (line.trim().startsWith('DATABASE_URL=')) {
        databaseUrl = line.split('DATABASE_URL=')[1].trim();
        break;
    }
}

if (!databaseUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

console.log('Connecting to database...');
const client = new Client({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected successfully. Adding column "MOTM" to "egy_NT_MATCHDETAILS" and "alahly_MATCHDETAILS"...');
        
        // Execute the SQL queries to add columns
        await client.query('ALTER TABLE "egy_NT_MATCHDETAILS" ADD COLUMN IF NOT EXISTS "MOTM" text;');
        console.log('Column "MOTM" added/checked for "egy_NT_MATCHDETAILS".');

        await client.query('ALTER TABLE "alahly_MATCHDETAILS" ADD COLUMN IF NOT EXISTS "MOTM" text;');
        console.log('Column "MOTM" added/checked for "alahly_MATCHDETAILS".');
        
        console.log('Database migration completed successfully.');
    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        await client.end();
    }
}

run();
