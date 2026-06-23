import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');

let connectionString = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('DATABASE_URL=')) {
        connectionString = line.split('=')[1].trim();
    }
});

async function addIsArabColumn() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to DB as admin...');
        
        // Add IS_ARAB column
        await client.query(`
            ALTER TABLE "db_COUNTRIES" 
            ADD COLUMN IF NOT EXISTS "IS_ARAB" BOOLEAN DEFAULT false;
        `);
        console.log('Added IS_ARAB column to db_COUNTRIES.');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

addIsArabColumn();
