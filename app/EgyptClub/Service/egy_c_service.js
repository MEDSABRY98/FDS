import { supabase } from "../../lib/supabase";

/**
 * Service to handle all Egypt Clubs Database operations.
 */
export const EgyptClubService = {
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
                    .from('egy_CLUB_MATCHDETAILS')
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

            // Map and calculate W-D-L and CLEAN SHEET dynamically
            return allData.map(match => {
                const gf = match.GF !== null && match.GF !== undefined ? parseInt(match.GF, 10) : null;
                const ga = match.GA !== null && match.GA !== undefined ? parseInt(match.GA, 10) : null;

                let wdl = null;
                let cleanSheet = null;

                if (gf !== null && ga !== null && !isNaN(gf) && !isNaN(ga)) {
                    // Compute W-D-L (W = Egypt Team wins, L = Egypt Team loses, D = Draw)
                    if (gf > ga) {
                        wdl = "W";
                    } else if (gf < ga) {
                        wdl = "L";
                    } else {
                        wdl = gf === 0 ? "D." : "D";
                    }

                    // Compute CLEAN SHEET
                    if (gf === 0 && ga === 0) {
                        cleanSheet = "BOTH";
                    } else if (ga === 0) {
                        cleanSheet = "F"; // Egypt team clean sheet
                    } else if (gf === 0) {
                        cleanSheet = "A"; // Opponent clean sheet
                    } else {
                        cleanSheet = "-";
                    }
                }

                return {
                    ...match,
                    "W-D-L": wdl,
                    "CLEAN SHEET": cleanSheet
                };
            });
        } catch (error) {
            console.error("Error in EgyptClubService.getAllMatches:", error.message);
            return [];
        }
    },

    /**
     * Extract unique filter options from the match list.
     */
    getUniqueFilters(matches) {
        const getUnique = (col, reverse = false) => {
            const uniqueValues = [...new Set(matches.map(m => m[col]).filter(Boolean))].sort();
            if (reverse) uniqueValues.reverse();
            return ["All", ...uniqueValues];
        };

        // Extract unique years from DATE field or from YEAR field
        const years = [...new Set(matches.map(m => m.YEAR || (m.DATE ? new Date(m.DATE).getFullYear().toString() : null)).filter(Boolean))].sort().reverse();

        return {
            match_ids: getUnique('MATCH_ID'),
            champion_systems: getUnique('CHAMPION SYSTEM'),
            years: ["All", ...years],
            champions: getUnique('CHAMPION'),
            seasons: getUnique('SEASON', true),
            rounds: getUnique('ROUND'),
            places: getUnique('PLACE'),
            han: getUnique('H-A-N'),
            egy_teams: getUnique('EGYPT TEAM'),
            gf: getUnique('GF'),
            ga: getUnique('GA'),
            et: getUnique('ET'),
            pen: getUnique('PEN'),
            opponent_teams: getUnique('OPPONENT TEAM'),
            wdl: getUnique('W-D-L'),
            clean_sheets: getUnique('CLEAN SHEET'),
            wl_q_fs: getUnique('W-L Q & F'),
            notes: getUnique('NOTE')
        };
    }
};
