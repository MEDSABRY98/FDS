import { supabase } from "../lib/supabase";

/**
 * Service to handle all Al Ahly Database operations.
 */
export const AlAhlyService = {
    /**
     * Fetch all match details from the database.
     */
    async getAllMatches() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_MATCHDETAILS')
                    .select('*')
                    .order('DATE', { ascending: false })
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }
            return allData;
        } catch (error) {
            console.error("Error in AlAhlyService.getAllMatches:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL player details from alahly_PLAYERDETAILS using pagination to bypass limit.
     */
    async getAllPlayerDetails() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_PLAYERDETAILS')
                    .select('*')
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }
            return allData;
        } catch (error) {
            console.error("Error fetching PlayerDetails:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL lineup details from alahly_LINEUPDETAILS (Matches played/minutes).
     */
    async getAllLineupDetails() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_LINEUPDETAILS')
                    .select('*')
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }
            return allData;
        } catch (error) {
            console.error("Error fetching LineupDetails:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL GK details from alahly_GKDETAILS.
     */
    async getAllGKDetails() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_GKSDETAILS')
                    .select('*')
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }
            return allData;
        } catch (error) {
            console.error("Error fetching GKDetails:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL penalty miss details from alahly_HOWPENMISSED.
     */
    async getAllHowPenMissed() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_HOWPENMISSED')
                    .select('*')
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }
            return allData;
        } catch (error) {
            console.error("Error fetching HowPenMissed:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL entries from the unique player database.
     */
    async getPlayerDatabase() {
        try {
            const { data, error } = await supabase
                .from('alahly_PLAYERDATABASE')
                .select('*')
                .order('PLAYER NAME', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching PlayerDatabase:", error.message);
            return [];
        }
    },

    /**
     * Rebuild/Sync the player database by scanning lineups and events.
     * This creates a unique list of players with their associated teams and positions.
     */
    async syncPlayerDatabase() {
        try {
            console.log("Syncing Player Database...");
            const lineups = await this.getAllLineupDetails();
            const details = await this.getAllPlayerDetails();

            const playersMap = new Map();

            const processPlayer = (name, team, position = "") => {
                if (!name || name.toLowerCase() === "unknown") return;
                const pName = String(name).trim();
                const pTeam = String(team).trim();
                const pPos = String(position).trim();

                const key = `${pName}|${pTeam}`;

                if (!playersMap.has(key)) {
                    playersMap.set(key, {
                        "PLAYER NAME": pName,
                        TEAM: pTeam,
                        POSITION: pPos,
                        NATIONALLY: "" // Initialize registry-specific field
                    });
                } else if (pPos && !playersMap.get(key).POSITION) {
                    playersMap.get(key).POSITION = pPos;
                }
            };

            // 1. Scan Lineups (Contains Position)
            lineups.forEach(l => processPlayer(l["PLAYER NAME"], l.TEAM, l.POSITION));

            // 2. Scan Player Details (Events)
            details.forEach(p => processPlayer(p["PLAYER NAME"], p.TEAM));

            const uniquePlayers = Array.from(playersMap.values());
            if (uniquePlayers.length === 0) return 0;

            // 3. Upsert into Supabase (Requires unique constraint on PLAYER NAME & TEAM in DB)
            const { error } = await supabase
                .from('alahly_PLAYERDATABASE')
                .upsert(uniquePlayers, { onConflict: '"PLAYER NAME", TEAM' });

            if (error) throw error;
            console.log(`Successfully synced ${uniquePlayers.length} players.`);
            return uniquePlayers.length;
        } catch (error) {
            console.error("Sync Failed:", error.message);
            throw error;
        }
    },

    /**
     * Merge multiple player names into one throughout the database.
     * This updates all occurrences in match events, lineups, and goalkeeper records.
     */
    async mergePlayers(targetName, namesToMerge) {
        try {
            console.log(`Merging ${namesToMerge.length} names into "${targetName}"...`);

            // 1. Filter out the targetName from the source list to avoid unnecessary updates
            const sources = namesToMerge.filter(n => n !== targetName);
            if (sources.length === 0) return true;

            // 2. Perform updates across all related tables
            // Using Promise.all to run them concurrently
            const results = await Promise.all([
                // Lineup Changes
                supabase.from('alahly_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                // Event Changes
                supabase.from('alahly_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                // GK Changes
                supabase.from('alahly_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                // Registry Changes: This is trickier due to Unique Constraint (Name, Team)
                // We'll delete the sources first, as the target presumably already represents the player
                supabase.from('alahly_PLAYERDATABASE').delete().in('PLAYER NAME', sources)
            ]);

            // Check for errors in any result
            const errors = results.filter(r => r.error).map(r => r.error.message);
            if (errors.length > 0) {
                console.error("Merge partial fail:", errors);
                throw new Error("One or more tables failed to update: " + errors.join(", "));
            }

            console.log("Merge completed successfully.");
            return true;
        } catch (error) {
            console.error("Merge error:", error.message);
            throw error;
        }
    },

    /**
     * Extract unique filter options from the match list for ALL columns.
     */
    getUniqueFilters(matches) {
        const getUnique = (col, reverse = false) => {
            const uniqueValues = [...new Set(matches.map(m => m[col]).filter(Boolean))].sort();
            if (reverse) uniqueValues.reverse();
            return ["All", ...uniqueValues];
        };

        // Extract Unique Years from DATE
        const years = [...new Set(matches.map(m => m.DATE ? new Date(m.DATE).getFullYear() : null).filter(Boolean))].sort().reverse();

        return {
            match_ids: getUnique('MATCH_ID'),
            champion_systems: getUnique('CHAMPION SYSTEM'),
            dates: getUnique('DATE', true),
            years: ["All", ...years], // Add Years filter
            champions: getUnique('CHAMPION'),
            seasons: getUnique('SEASON - NAME', true),
            sys: getUnique('SEASON - NUMBER'),
            ahly_managers: getUnique('AHLY MANAGER'),
            opponent_managers: getUnique('OPPONENT MANAGER'),
            referees: getUnique('REFREE'),
            rounds: getUnique('ROUND'),
            han: getUnique('H-A-N'),
            stadiums: getUnique('STAD'),
            ahly_teams: getUnique('AHLY TEAM'),
            gf: getUnique('GF'),
            ga: getUnique('GA'),
            et: getUnique('ET'),
            pen: getUnique('PEN'),
            opponent_teams: getUnique('OPPONENT TEAM'),
            wdl: getUnique('W-D-L'),
            clean_sheets: getUnique('CLEAN SHEET'),
            notes: getUnique('NOTE')
        };
    }
};
