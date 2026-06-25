import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wsygeerxfdaavdtvogvy.supabase.co';
const supabaseAnonKey = 'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    const { data: squad, error } = await supabase
        .from('egy_NT_SQUAD')
        .select('*')
        .eq('PLAYERNAME', 'P-1316');
    
    if (error) {
        console.error(error);
    } else {
        console.log("Mokhtar El-Tetsh Squad entries:", squad);
    }
}

main().catch(err => console.error(err));
