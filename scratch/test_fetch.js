const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wsygeerxfdaavdtvogvy.supabase.co';
const supabaseAnonKey = 'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    try {
        const { data: matchData, error: matchError } = await supabase
            .from('egy_NT_MATCHDETAILS')
            .select('MATCH_ID, CHAMPION, SEASON, ROUND, DATE, EGYPT MANAGER, OPPONENT MANAGER, H-A-N, STAD, PLACE')
            .limit(5);

        if (matchError) {
            console.error("Error without quotes:", matchError.message);
        } else {
            console.log("Success without quotes:", matchData ? matchData[0] : null);
        }
    } catch (e) {
        console.error("Catch without quotes:", e.message);
    }

    try {
        const { data: matchDataQ, error: matchErrorQ } = await supabase
            .from('egy_NT_MATCHDETAILS')
            .select('MATCH_ID, CHAMPION, SEASON, ROUND, DATE, "EGYPT MANAGER", "OPPONENT MANAGER", "H-A-N", STAD, PLACE')
            .limit(5);

        if (matchErrorQ) {
            console.error("Error with quotes:", matchErrorQ.message);
        } else {
            console.log("Success with quotes:", matchDataQ ? matchDataQ[0] : null);
        }
    } catch (e) {
        console.error("Catch with quotes:", e.message);
    }
}

run();
