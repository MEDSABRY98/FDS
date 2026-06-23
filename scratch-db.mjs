import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('egy_NT_PLAYERDETAILS')
        .select('TYPE, TYPE_SUB, PLAYER_NAME, TEAM')
        .eq('MATCH_ID', 'Uganda26630');
    console.log(JSON.stringify(data, null, 2));
}

check();
