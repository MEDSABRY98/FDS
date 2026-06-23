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

const ARAB_COUNTRIES = [
    'مصر', 'Egypt',
    'السعودية', 'السعوديه', 'Saudi Arabia',
    'الجزائر', 'Algeria',
    'المغرب', 'Morocco',
    'تونس', 'Tunisia',
    'ليبيا', 'Libya',
    'السودان', 'Sudan',
    'الصومال', 'Somalia',
    'موريتانيا', 'Mauritania',
    'جيبوتي', 'Djibouti',
    'جزر القمر', 'Comoros',
    'الإمارات', 'الامارات', 'UAE', 'United Arab Emirates',
    'الكويت', 'Kuwait',
    'قطر', 'Qatar',
    'البحرين', 'Bahrain',
    'عمان', 'سلطنة عمان', 'Oman',
    'اليمن', 'Yemen',
    'سوريا', 'سورية', 'Syria',
    'لبنان', 'Lebanon',
    'الأردن', 'الاردن', 'Jordan',
    'فلسطين', 'Palestine',
    'العراق', 'Iraq'
];

async function updateArabCountries() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        const query = `
            UPDATE "db_COUNTRIES" 
            SET "IS_ARAB" = true 
            WHERE "COUNTRY_NAME" = ANY($1::text[]) 
               OR "COUNTRY_NAME_EN" = ANY($1::text[]);
        `;
        
        const result = await client.query(query, [ARAB_COUNTRIES]);
        console.log(`Successfully updated ${result.rowCount} countries to IS_ARAB = true.`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

updateArabCountries();
