import { supabase } from "../../Database";
import { computePlayerGoalImpact } from "../PlayerDetails/egypt_nt_db_player_details_goal_impact";
import { computePlayerAssistImpact } from "../PlayerDetails/egypt_nt_db_player_details_assist_impact";

/**
 * Service to handle all Egypt National Team Database operations.
 */
export const EgyptNTService = {
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
                    .from('egy_NT_MATCHDETAILS')
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

                let wdl = match["W-D-L"] || null;
                let cleanSheet = match["CLEAN SHEET"] || null;

                if (gf !== null && ga !== null && !isNaN(gf) && !isNaN(ga)) {
                    // Compute W-D-L
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
                        cleanSheet = "F";
                    } else if (gf === 0) {
                        cleanSheet = "A";
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
            console.error("Error in EgyptNTService.getAllMatches:", error.message);
            return [];
        }
    },
    /**
     * Fetch ALL player details from egy_NT_PLAYERDETAILS.
     */
    async getAllPlayerDetails() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('egy_NT_PLAYERDETAILS')
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
            console.error("Error fetching PlayerDetails:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL lineup details from egy_NT_LINEUPDETAILS.
     */
    async getAllLineupDetails() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('egy_NT_LINEUPDETAILS')
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
            console.error("Error fetching LineupDetails:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL GK details from egy_NT_GKSDETAILS.
     */
    async getAllGKDetails() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('egy_NT_GKSDETAILS')
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
            console.error("Error fetching GKDetails:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL penalty miss details from egy_NT_HOWPENMISSED.
     */
    async getAllHowPenMissed() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('egy_NT_HOWPENMISSED')
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
            console.error("Error fetching HowPenMissed:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL squad entries from egy_NT_SQUAD.
     */
    async getAllSquad() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('egy_NT_SQUAD')
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
            console.error("Error fetching Squad:", error.message);
            return [];
        }
    },

    /**
     * Merge multiple player names into one throughout the database.
     */
    async mergePlayers(targetName, namesToMerge) {
        try {
            console.log(`Merging ${namesToMerge.length} names into "${targetName}"...`);

            const sources = namesToMerge.filter(n => n !== targetName);
            if (sources.length === 0) return true;

            const results = await Promise.all([
                // Lineup Changes
                supabase.from('egy_NT_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                // Event Changes
                supabase.from('egy_NT_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                // GK Changes
                supabase.from('egy_NT_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                // Squad Changes
                supabase.from('egy_NT_SQUAD').update({ "PLAYERNAME": targetName }).in('PLAYERNAME', sources)
            ]);

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
            ages: getUnique('AGE'),
            champion_systems: getUnique('CHAMPION_SYSTEM'),
            dates: getUnique('DATE', true),
            years: ["All", ...years],
            champions: getUnique('CHAMPION'),
            seasons: getUnique('SEASON', true),
            egy_managers: getUnique('EGYPT MANAGER'),
            opponent_managers: getUnique('OPPONENT MANAGER'),
            referees: getUnique('REFREE'),
            rounds: getUnique('ROUND'),
            places: getUnique('PLACE'),
            han: getUnique('H-A-N'),
            egy_teams: getUnique('Egypt TEAM'),
            gf: getUnique('GF'),
            ga: getUnique('GA'),
            et: getUnique('ET'),
            pen: getUnique('PEN'),
            opponent_teams: getUnique('OPPONENT TEAM'),
            wdl: getUnique('W-D-L'),
            clean_sheets: getUnique('CLEAN SHEET'),
            notes: getUnique('NOTE')
        };
    },



    /**
     * Update CLUB on friendly goal rows (batch by ROW_ID).
     */
    async applyClubBackfill(updates = []) {
        const valid = (updates || []).filter(
            (item) => String(item?.rowId || "").trim() && String(item?.club ?? "").trim()
        );
        if (!valid.length) return { updated: 0 };

        let updated = 0;
        const chunkSize = 50;

        for (let i = 0; i < valid.length; i += chunkSize) {
            const chunk = valid.slice(i, i + chunkSize);
            const results = await Promise.all(
                chunk.map(({ rowId, club }) =>
                    supabase
                        .from("egy_NT_PLAYERDETAILS")
                        .update({ CLUB: String(club).trim() })
                        .eq("ROW_ID", rowId)
                )
            );

            const failed = results.find((r) => r.error);
            if (failed?.error) throw failed.error;
            updated += chunk.length;
        }

        return { updated };
    },

};
