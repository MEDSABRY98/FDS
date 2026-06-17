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

            let updatePromises = [];
            let deletePromise = null;

            if (table === "db_PLAYERS") {
                updatePromises = [
                    // Al Ahly Tables
                    supabase.from('alahly_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_LINEUPDETAILS').update({ "PLAYER NAME OUT": targetName }).in('PLAYER NAME OUT', sources),
                    supabase.from('alahly_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_PKS').update({ "AHLY PLAYER": targetName }).in('AHLY PLAYER', sources),
                    supabase.from('alahly_PKS').update({ "OPPONENT PLAYER": targetName }).in('OPPONENT PLAYER', sources),
                    supabase.from('alahly_PKS').update({ "AHLY GK": targetName }).in('AHLY GK', sources),
                    supabase.from('alahly_PKS').update({ "OPPONENT GK": targetName }).in('OPPONENT GK', sources),

                    // Al Ahly Finals

                    // Egypt NT Tables
                    supabase.from('egy_NT_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_LINEUPDETAILS').update({ "PLAYER NAME OUT": targetName }).in('PLAYER NAME OUT', sources),
                    supabase.from('egy_NT_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_SQUAD').update({ "PLAYERNAME": targetName }).in('PLAYERNAME', sources),
                    supabase.from('egy_NT_PKS').update({ "Egypt PLAYER": targetName }).in('Egypt PLAYER', sources),
                    supabase.from('egy_NT_PKS').update({ "OPPONENT PLAYER": targetName }).in('OPPONENT PLAYER', sources),
                    supabase.from('egy_NT_PKS').update({ "EGYPT GK": targetName }).in('EGYPT GK', sources),
                    supabase.from('egy_NT_PKS').update({ "OPPONENT GK": targetName }).in('OPPONENT GK', sources)
                ];
                deletePromise = supabase.from('db_PLAYERS').delete().in('PLAYER_NAME', sources);
            }
            else if (table === "db_MANAGERS") {
                updatePromises = [
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "AHLY MANAGER": targetName }).in('AHLY MANAGER', sources),
                    supabase.from('alahly_MATCHDETAILS').update({ "OPPONENT MANAGER": targetName }).in('OPPONENT MANAGER', sources),

                    // Al Ahly Finals Match Details

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "EGYPT MANAGER": targetName }).in('EGYPT MANAGER', sources),
                    supabase.from('egy_NT_MATCHDETAILS').update({ "OPPONENT MANAGER": targetName }).in('OPPONENT MANAGER', sources)
                ];
                deletePromise = supabase.from('db_MANAGERS').delete().in('MANAGER_NAME', sources);
            }
            else if (table === "db_STADIUMS") {
                updatePromises = [
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "STAD": targetName }).in('STAD', sources),

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "PLACE": targetName }).in('PLACE', sources),

                    // Egypt Club Match Details
                    supabase.from('egy_CLUB_MATCHDETAILS').update({ "PLACE": targetName }).in('PLACE', sources)
                ];
                deletePromise = supabase.from('db_STADIUMS').delete().in('STADIUM_NAME', sources);
            }
            else if (table === "db_REFEREES") {
                updatePromises = [
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "REFREE": targetName }).in('REFREE', sources),

                    // Al Ahly Finals Match Details

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "REFREE": targetName }).in('REFREE', sources)
                ];
                deletePromise = supabase.from('db_REFEREES').delete().in('REFEREE_NAME', sources);
            }
            else if (table === "db_TEAMS") {
                updatePromises = [
                    // Al Ahly Finals

                    // Al Ahly
                    supabase.from('alahly_GKSDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('alahly_HOWPENMISSED').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('alahly_LINEUPDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('alahly_MATCHDETAILS').update({ "AHLY TEAM": targetName }).in('AHLY TEAM', sources),
                    supabase.from('alahly_MATCHDETAILS').update({ "OPPONENT TEAM": targetName }).in('OPPONENT TEAM', sources),
                    supabase.from('alahly_PKS').update({ "AHLY TEAM": targetName }).in('AHLY TEAM', sources),
                    supabase.from('alahly_PKS').update({ "OPPONENT TEAM": targetName }).in('OPPONENT TEAM', sources),
                    supabase.from('alahly_PLAYERDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),

                    // Egypt Club
                    supabase.from('egy_CLUB_MATCHDETAILS').update({ "EGYPT TEAM": targetName }).in('EGYPT TEAM', sources),
                    supabase.from('egy_CLUB_MATCHDETAILS').update({ "OPPONENT TEAM": targetName }).in('OPPONENT TEAM', sources),

                    // Egypt NT
                    supabase.from('egy_NT_GKSDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('egy_NT_HOWPENMISSED').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('egy_NT_LINEUPDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('egy_NT_MATCHDETAILS').update({ "Egypt TEAM": targetName }).in('Egypt TEAM', sources),
                    supabase.from('egy_NT_MATCHDETAILS').update({ "OPPONENT TEAM": targetName }).in('OPPONENT TEAM', sources),
                    supabase.from('egy_NT_PKS').update({ "Egypt TEAM": targetName }).in('Egypt TEAM', sources),
                    supabase.from('egy_NT_PKS').update({ "OPPONENT TEAM": targetName }).in('OPPONENT TEAM', sources),
                    supabase.from('egy_NT_PLAYERDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('egy_NT_SQUAD').update({ "CLUB": targetName }).in('CLUB', sources)
                ];
                deletePromise = supabase.from('db_TEAMS').delete().in('TEAM_NAME', sources);
            }
            else if (table === "db_COUNTRIES") {
                updatePromises = [
                    supabase.rpc('merge_countries', { 
                        target_country: targetName, 
                        source_countries: sources 
                    })
                ];
            }

            // 1. Run updates on referencing tables first to ensure ID mapping succeeds before deletion
            if (updatePromises && updatePromises.length > 0) {
                const updateResults = await Promise.all(updatePromises);
                const updateErrors = updateResults.filter(r => r && r.error).map(r => r.error.message);
                if (updateErrors.length > 0) {
                    console.error("Merge partial fail (Updates):", updateErrors);
                    throw new Error("One or more tables failed to update during merge: " + updateErrors.join(", "));
                }
            }

            // 2. Once all updates are successful, run the delete query to clear old catalog records
            if (deletePromise) {
                const deleteResult = await deletePromise;
                if (deleteResult && deleteResult.error) {
                    console.error("Merge partial fail (Delete):", deleteResult.error.message);
                    throw new Error("Updates succeeded but failed to delete source records: " + deleteResult.error.message);
                }
            }

            console.log("Merge operation completed successfully.");
            return true;
        } catch (error) {
            console.error("Merge error:", error.message);
            throw error;
        }
    }
};
