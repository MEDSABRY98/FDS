import { supabase } from "../lib/supabase";

export const DBManagementService = {
    /**
     * Merge multiple entity names (Players, Managers, or Stadiums) into one.
     * This updates all references across all tables and cleans up the duplicates.
     */
    async mergeEntities(table, targetName, namesToMerge) {
        try {
            console.log(`Merging ${namesToMerge.length} names in "${table}" into "${targetName}"...`);

            const sources = namesToMerge.filter(n => n !== targetName);
            if (sources.length === 0) return true;

            let results = [];

            if (table === "db_PLAYERS") {
                results = await Promise.all([
                    // Al Ahly Tables
                    supabase.from('alahly_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_LINEUPDETAILS').update({ "PLAYER NAME OUT": targetName }).in('PLAYER NAME OUT', sources),
                    supabase.from('alahly_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_PKS').update({ "AHLY PLAYER": targetName }).in('AHLY PLAYER', sources),
                    supabase.from('alahly_PKS').update({ "OPPONENT PLAYER": targetName }).in('OPPONENT PLAYER', sources),

                    // Al Ahly Finals
                    supabase.from('alahly_FINALS_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_FINALS_LINEUPDETAILS').update({ "PLAYER NAME OUT": targetName }).in('PLAYER NAME OUT', sources),
                    supabase.from('alahly_FINALS_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),

                    // Al Ahly vs Zamalek
                    supabase.from('alahly_vs_zamalek_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_vs_zamalek_LINEUPDETAILS').update({ "PLAYER NAME OUT": targetName }).in('PLAYER NAME OUT', sources),
                    supabase.from('alahly_vs_zamalek_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),

                    // Egypt NT Tables
                    supabase.from('egy_NT_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_LINEUPDETAILS').update({ "PLAYER NAME OUT": targetName }).in('PLAYER NAME OUT', sources),
                    supabase.from('egy_NT_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_SQUAD').update({ "PLAYERNAME": targetName }).in('PLAYERNAME', sources),
                    supabase.from('egy_NT_PKS').update({ "Egypt PLAYER": targetName }).in('Egypt PLAYER', sources),
                    supabase.from('egy_NT_PKS').update({ "OPPONENT PLAYER": targetName }).in('OPPONENT PLAYER', sources),

                    // Delete duplicates from the db_PLAYERS catalog table itself
                    supabase.from('db_PLAYERS').delete().in('PLAYER_NAME', sources)
                ]);
            }
            else if (table === "db_MANAGERS") {
                results = await Promise.all([
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "AHLY MANAGER": targetName }).in('AHLY MANAGER', sources),
                    supabase.from('alahly_MATCHDETAILS').update({ "OPPONENT MANAGER": targetName }).in('OPPONENT MANAGER', sources),

                    // Al Ahly Finals Match Details
                    supabase.from('alahly_FINALS_MATCHDETAILS').update({ "AHLY MANAGER": targetName }).in('AHLY MANAGER', sources),
                    supabase.from('alahly_FINALS_MATCHDETAILS').update({ "OPPONENT MANAGER": targetName }).in('OPPONENT MANAGER', sources),

                    // Al Ahly vs Zamalek Match Details
                    supabase.from('alahly_vs_zamalek_MATCHDETAILS').update({ "AHLY MANAGER": targetName }).in('AHLY MANAGER', sources),
                    supabase.from('alahly_vs_zamalek_MATCHDETAILS').update({ "ZAMALEK MANAGER": targetName }).in('ZAMALEK MANAGER', sources),

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "EGYPT MANAGER": targetName }).in('EGYPT MANAGER', sources),
                    supabase.from('egy_NT_MATCHDETAILS').update({ "OPPONENT MANAGER": targetName }).in('OPPONENT MANAGER', sources),

                    // Delete duplicates from the db_MANAGERS catalog table
                    supabase.from('db_MANAGERS').delete().in('MANAGER_NAME', sources)
                ]);
            }
            else if (table === "db_STADIUMS") {
                results = await Promise.all([
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "STAD": targetName }).in('STAD', sources),

                    // Al Ahly vs Zamalek Match Details
                    supabase.from('alahly_vs_zamalek_MATCHDETAILS').update({ "STAD": targetName }).in('STAD', sources),

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "PLACE": targetName }).in('PLACE', sources),

                    // Delete duplicates from the db_STADIUMS catalog table
                    supabase.from('db_STADIUMS').delete().in('STADIUM_NAME', sources)
                ]);
            }
            else if (table === "db_REFEREES") {
                results = await Promise.all([
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "REFREE": targetName }).in('REFREE', sources),

                    // Al Ahly Finals Match Details
                    supabase.from('alahly_FINALS_MATCHDETAILS').update({ "REFREE": targetName }).in('REFREE', sources),

                    // Al Ahly vs Zamalek Match Details
                    supabase.from('alahly_vs_zamalek_MATCHDETAILS').update({ "REFEREE": targetName }).in('REFEREE', sources),

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "REFREE": targetName }).in('REFREE', sources),

                    // Delete duplicates from the db_REFEREES catalog table
                    supabase.from('db_REFEREES').delete().in('REFEREE_NAME', sources)
                ]);
            }

            const errors = results.filter(r => r.error).map(r => r.error.message);
            if (errors.length > 0) {
                console.error("Merge partial fail:", errors);
                throw new Error("One or more tables failed to update during merge: " + errors.join(", "));
            }

            console.log("Merge operation completed successfully.");
            return true;
        } catch (error) {
            console.error("Merge error:", error.message);
            throw error;
        }
    }
};
