import { supabase } from "../../lib/supabase";

/**
 * Service to handle all Al Ahly Finals Database operations.
 * Exclusively uses the alahly_FINALS_* tables.
 */
export const AlAhlyFinalsService = {
    /**
     * Fetch all finals match details.
     */
    async getAllFinalsMatches() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_FINALS_MATCHDETAILS')
                    .select('*')
                    .order('DATE', { ascending: false })
                    .order('ROW_ID', { ascending: true })
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
            console.error("Error in AlAhlyFinalsService.getAllFinalsMatches:", error.message);
            return [];
        }
    },

    /**
     * Fetch all finals lineup details.
     */
    async getAllFinalsLineups() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_FINALS_LINEUPDETAILS')
                    .select('*')
                    .order('ROW_ID', { ascending: true })
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
            console.error("Error in AlAhlyFinalsService.getAllFinalsLineups:", error.message);
            return [];
        }
    },

    /**
     * Fetch all finals player details (event details).
     */
    async getAllFinalsPlayerDetails() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_FINALS_PLAYERDETAILS')
                    .select('*')
                    .order('ROW_ID', { ascending: true })
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
            console.error("Error in AlAhlyFinalsService.getAllFinalsPlayerDetails:", error.message);
            return [];
        }
    },

    /**
     * Get unique filter options for finals matches.
     */
    getUniqueFilters(matches) {
        const getUnique = (col, reverse = false) => {
            const uniqueValues = [...new Set(matches.map(m => m[col]).filter(Boolean))].sort();
            if (reverse) uniqueValues.reverse();
            return ["All", ...uniqueValues];
        };

        const years = [...new Set(matches.map(m => {
            if (!m.DATE) return null;
            const parts = m.DATE.split('/');
            if (parts.length === 3) return parts[2]; // Handle DD/MM/YYYY
            const date = new Date(m.DATE);
            return isNaN(date.getFullYear()) ? null : String(date.getFullYear());
        }).filter(Boolean))].sort().reverse();

        return {
            champion_systems: getUnique('CHAMPION SYSTEM'),
            years: ["All", ...years],
            champions: getUnique('CHAMPION'),
            seasons: getUnique('SEASON - NAME', true),
            ahly_managers: getUnique('AHLY MANAGER'),
            opponent_managers: getUnique('OPPONENT MANAGER'),
            referees: getUnique('REFREE'),
            rounds: getUnique('ROUND'),
            han: getUnique('H-A-N'),
            opponent_teams: getUnique('OPPONENT TEAM'),
            wdl_match: getUnique('W-D-L MATCH'),
            wdl_final: getUnique('W-D-L FINAL')
        };
    },



    /**
     * CRUD: Upsert Match Details record
     */
    async upsertMatchDetails(record) {
        try {
            const { data, error } = await supabase
                .from('alahly_FINALS_MATCHDETAILS')
                .upsert(record)
                .select();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error upserting match details:", error.message);
            throw error;
        }
    },

    /**
     * CRUD: Delete Match Details record
     */
    async deleteMatchDetails(rowId) {
        try {
            const { error } = await supabase
                .from('alahly_FINALS_MATCHDETAILS')
                .delete()
                .eq('ROW_ID', rowId);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting match details:", error.message);
            throw error;
        }
    },

    /**
     * CRUD: Bulk update Lineups for a specific match/date
     */
    async updateMatchLineups(finalId, date, lineupRows) {
        try {
            // First clear existing lineups for this specific match+date combo
            await supabase
                .from('alahly_FINALS_LINEUPDETAILS')
                .delete()
                .eq('FINAL_ID', finalId)
                .eq('DATE', date);

            if (lineupRows.length > 0) {
                const { error } = await supabase
                    .from('alahly_FINALS_LINEUPDETAILS')
                    .insert(lineupRows);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error("Error updating match lineups:", error.message);
            throw error;
        }
    },

    /**
     * CRUD: Bulk update Player Events for a specific match/date
     */
    async updateMatchEvents(finalId, date, eventRows) {
        try {
            // First clear existing events for this specific match+date combo
            await supabase
                .from('alahly_FINALS_PLAYERDETAILS')
                .delete()
                .eq('FINAL ID', finalId) // Note the space in column name
                .eq('DATE', date);

            if (eventRows.length > 0) {
                const { error } = await supabase
                    .from('alahly_FINALS_PLAYERDETAILS')
                    .insert(eventRows);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error("Error updating match events:", error.message);
            throw error;
        }
    }
};
