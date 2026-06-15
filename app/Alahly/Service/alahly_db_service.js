import { supabase } from "../../lib/supabase";

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

                let wdl = match["W-D-L"];
                let cleanSheet = match["CLEAN SHEET"];

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
            console.error("Error in AlAhlyService.getAllMatches:", error.message);
            return [];
        }
    },

    /**
     * Fetch ALL media tracker details from alahly_MEDIATRACKER.
     */
    async getAllMediaTracker() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_MEDIATRACKER')
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
            console.error("Error fetching MediaTracker:", error.message);
            return [];
        }
    },

    /**
     * Update a single media tracker record.
     */
    async updateMediaRecord(rowId, updates) {
        try {
            const { error } = await supabase
                .from('alahly_MEDIATRACKER')
                .update(updates)
                .eq('ROW_ID', rowId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating MediaTracker record:", error.message);
            throw error;
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
     * Update a single PK record in alahly_PKS.
     */
    async updatePKSRecord(rowId, updates) {
        try {
            const { error } = await supabase
                .from('alahly_PKS')
                .update(updates)
                .eq('ROW_ID', rowId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating PK record:", error.message);
            throw error;
        }
    },

    /**
     * Create a new PK record in alahly_PKS.
     */
    async createPKSRecord(newRecord) {
        try {
            const { data, error } = await supabase
                .from('alahly_PKS')
                .insert([newRecord])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error("Error creating PK record:", error.message);
            throw error;
        }
    },

    /**
     * Delete a single PK record from alahly_PKS.
     */
    async deletePKSRecord(rowId) {
        try {
            const { error } = await supabase
                .from('alahly_PKS')
                .delete()
                .eq('ROW_ID', rowId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting PK record:", error.message);
            throw error;
        }
    },

    /**
     * Fetch ALL penalty kick details from alahly_PKS.
     */
    async getAllPKs() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_PKS')
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
            console.error("Error fetching PKs:", error.message);
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
                supabase.from('alahly_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources)
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
            sy: getUnique('SEASON - NUMBER'),
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
    },

    /**
     * Compute the impact of player goals on match results.
     * Logic:
     * - Win (diff 1): Last goal scorer gets 1 impact point.
     * - Win (diff >1): Only if ONE player scored ALL goals, that player gets 1 impact point.
     * - Draw: Last goal scorer for Al Ahly gets 1 impact point.
     */
    async getPlayerGoalImpact(playerName) {
        try {
            const matches = await this.getAllMatches();
            const events = await this.getAllPlayerDetails();
            const searchName = String(playerName || "").trim();

            const isAhlyTeam = (t) => {
                if (!t) return false;
                const s = String(t).trim();
                return s === "الأهلي" || s === "ال الأهلي" || s === "Al Ahly" || s === "Al-Ahly" || s === "الأهلى";
            };

            let winImpact = 0;
            let drawImpact = 0;
            const impactMatches = [];

            matches.forEach(match => {
                const mid = String(match.MATCH_ID);
                const gf = parseInt(match.GF) || 0;
                const ga = parseInt(match.GA) || 0;
                const res = match["W-D-L"];

                // Find player's side in this match
                const matchEvents = events.filter(e => String(e.MATCH_ID) === mid);
                const playerRecord = matchEvents.find(e => String(e["PLAYER NAME"] || "").trim() === searchName);
                if (!playerRecord) return;

                const isAhlySideInThisMatch = isAhlyTeam(playerRecord.TEAM);
                const playerTeamWon = isAhlySideInThisMatch ? (res === 'W') : (res === 'L');
                const isDraw = (res === 'D');
                const playerSideG = isAhlySideInThisMatch ? gf : ga;
                const opponentSideG = isAhlySideInThisMatch ? ga : gf;

                // Goals for THE SAME SIDE as the player in this match
                const sideGoals = matchEvents.filter(e =>
                    isAhlyTeam(e.TEAM) === isAhlySideInThisMatch &&
                    (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")
                ).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0) || parseInt(a.EVENT_ID || 0) - parseInt(b.EVENT_ID || 0));

                if (sideGoals.length === 0) return;

                if (playerTeamWon) {
                    if (playerSideG - opponentSideG === 1) {
                        const lg = sideGoals[sideGoals.length - 1];
                        if (String(lg["PLAYER NAME"] || "").trim() === searchName) {
                            winImpact++;
                            impactMatches.push({ match, type: 'WINNER (Deciding Goal)', playerMins: [lg.MINUTE] });
                        }
                    } else if (playerSideG > 1 && opponentSideG < playerSideG) {
                        const scorers = [...new Set(sideGoals.map(g => String(g["PLAYER NAME"] || "").trim()))];
                        if (scorers.length === 1 && scorers[0] === searchName) {
                            winImpact++;
                            impactMatches.push({ match, type: 'WINNER (Sole Scorer)', playerMins: sideGoals.map(g => g.MINUTE) });
                        }
                    }
                } else if (isDraw && playerSideG > 0) {
                    const lg = sideGoals[sideGoals.length - 1];
                    if (String(lg["PLAYER NAME"] || "").trim() === searchName) {
                        drawImpact++;
                        impactMatches.push({ match, type: 'DRAW (Equalizer)', playerMins: [lg.MINUTE] });
                    }
                }
            });

            return { winImpact, drawImpact, impactMatches };
        } catch (error) {
            console.error("Error goal impact:", error);
            return { winImpact: 0, drawImpact: 0, impactMatches: [] };
        }
    },

    async getPlayerAssistImpact(playerName) {
        try {
            const matches = await this.getAllMatches();
            const events = await this.getAllPlayerDetails();
            const searchName = String(playerName || "").trim();

            const isAhlyTeam = (t) => {
                if (!t) return false;
                const s = String(t).trim();
                return s === "الأهلي" || s === "ال الأهلي" || s === "Al Ahly" || s === "Al-Ahly" || s === "الأهلى";
            };

            let winImpact = 0;
            let drawImpact = 0;
            const impactMatches = [];

            matches.forEach(match => {
                const mid = String(match.MATCH_ID);
                const gf = parseInt(match.GF) || 0;
                const ga = parseInt(match.GA) || 0;
                const res = match["W-D-L"];

                const matchEvents = events.filter(e => String(e.MATCH_ID) === mid);
                const playerRecord = matchEvents.find(e => String(e["PLAYER NAME"] || "").trim() === searchName);
                if (!playerRecord) return;

                const isAhlySideInThisMatch = isAhlyTeam(playerRecord.TEAM);
                const playerTeamWon = isAhlySideInThisMatch ? (res === 'W') : (res === 'L');
                const isDraw = (res === 'D');
                const playerSideG = isAhlySideInThisMatch ? gf : ga;
                const opponentSideG = isAhlySideInThisMatch ? ga : gf;

                if (playerTeamWon) {
                    if (playerSideG - opponentSideG === 1) {
                        const sideGoals = matchEvents.filter(e =>
                            isAhlyTeam(e.TEAM) === isAhlySideInThisMatch &&
                            (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")
                        ).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0) || parseInt(a.EVENT_ID || 0) - parseInt(b.EVENT_ID || 0));

                        if (sideGoals.length === 0) return;
                        const lg = sideGoals[sideGoals.length - 1];
                        const gId = String(lg.EVENT_ID);

                        const assistRow = matchEvents.find(e =>
                            ["ASSIST", "اسيست", "صنع"].includes(String(e.TYPE || "").toUpperCase()) &&
                            (String(e.PARENT_EVENT_ID) === gId || (parseInt(e.MINUTE) === parseInt(lg.MINUTE) && parseInt(e.MINUTE) > 0)) &&
                            String(e["PLAYER NAME"] || "").trim() === searchName &&
                            String(e["PLAYER NAME"] || "").trim() !== String(lg["PLAYER NAME"] || "").trim()
                        );

                        if (assistRow) {
                            winImpact++;
                            impactMatches.push({ match, type: 'WINNER (Deciding Assist)', playerMins: [assistRow.MINUTE] });
                        }
                    }
                } else if (isDraw && playerSideG > 0) {
                    const sideGoals = matchEvents.filter(e =>
                        isAhlySideInThisMatch === isAhlyTeam(e.TEAM) &&
                        (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")
                    ).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0) || parseInt(a.EVENT_ID || 0) - parseInt(b.EVENT_ID || 0));

                    if (sideGoals.length === 0) return;
                    const lg = sideGoals[sideGoals.length - 1];
                    const gId = String(lg.EVENT_ID);

                    const assistRow = matchEvents.find(e =>
                        ["ASSIST", "اسيست", "صنع"].includes(String(e.TYPE || "").toUpperCase()) &&
                        (String(e.PARENT_EVENT_ID) === gId || (parseInt(e.MINUTE) === parseInt(lg.MINUTE) && parseInt(e.MINUTE) > 0)) &&
                        String(e["PLAYER NAME"] || "").trim() === searchName &&
                        String(e["PLAYER NAME"] || "").trim() !== String(lg["PLAYER NAME"] || "").trim()
                    );

                    if (assistRow) {
                        drawImpact++;
                        impactMatches.push({ match, type: 'DRAW (Equalizer Assist)', playerMins: [assistRow.MINUTE] });
                    }
                }
            });

            return { winImpact, drawImpact, impactMatches };
        } catch (error) {
            console.error("Error assist impact:", error);
            return { winImpact: 0, drawImpact: 0, impactMatches: [] };
        }
    },
};
