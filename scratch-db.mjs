import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseKey = line.split('=')[1].trim();
    }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSystems() {
    const { data } = await supabase.from('egy_NT_MATCHDETAILS').select('CHAMPION_SYSTEM, SYSTEM_KIND').limit(50);
    const unique = new Set(data.map(d => `${d.CHAMPION_SYSTEM} | ${d.SYSTEM_KIND}`));
    console.log(Array.from(unique));
}
checkSystems();
