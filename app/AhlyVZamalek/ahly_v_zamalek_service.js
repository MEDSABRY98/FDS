import { supabase } from "../lib/supabase";

/**
 * Service to handle all Ahly vs Zamalek Database operations.
 * Exclusively uses the alahly_vs_zamalek_* tables.
 */
export const AhlyVZamalekService = {
    /**
     * Fetch all match details.
     */
    async getAllMatches() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_vs_zamalek_MATCHDETAILS')
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
            console.error("Error in AhlyVZamalekService.getAllMatches:", error.message);
            return [];
        }
    },

    /**
     * Fetch all lineup details.
     */
    async getAllLineups() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_vs_zamalek_LINEUPDETAILS')
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
            console.error("Error in AhlyVZamalekService.getAllLineups:", error.message);
            return [];
        }
    },

    /**
     * Fetch all player details (event details).
     */
    async getAllPlayerDetails() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('alahly_vs_zamalek_PLAYERDETAILS')
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
            console.error("Error in AhlyVZamalekService.getAllPlayerDetails:", error.message);
            return [];
        }
    },

    /**
     * Get unique filter options.
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
            zamalek_managers: getUnique('ZAMALEK MANAGER'),
            referees: getUnique('REFEREE'),
            rounds: getUnique('ROUND'),
            han: getUnique('H-A-N'),
            stads: getUnique('STAD'),
            wdl: getUnique('W-D-L'),
            f_wdl: getUnique('F/W-D-L'),
            q_wdl: getUnique('Q/W-D-L'),
            clean_sheets: getUnique('CLEAN SHEET')
        };
    },

    /**
     * CRUD: Upsert Match Details record
     */
    async upsertMatchDetails(record) {
        try {
            const { data, error } = await supabase
                .from('alahly_vs_zamalek_MATCHDETAILS')
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
                .from('alahly_vs_zamalek_MATCHDETAILS')
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
     * CRUD: Bulk update Lineups for a specific match
     */
    async updateMatchLineups(matchId, lineupRows) {
        try {
            // First clear existing lineups for this specific match combo
            await supabase
                .from('alahly_vs_zamalek_LINEUPDETAILS')
                .delete()
                .eq('MATCH_ID', matchId);

            if (lineupRows.length > 0) {
                const { error } = await supabase
                    .from('alahly_vs_zamalek_LINEUPDETAILS')
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
     * CRUD: Bulk update Player Events for a specific match
     */
    async updateMatchEvents(matchId, eventRows) {
        try {
            // First clear existing events for this specific match combo
            await supabase
                .from('alahly_vs_zamalek_PLAYERDETAILS')
                .delete()
                .eq('MATCH_ID', matchId);

            if (eventRows.length > 0) {
                const { error } = await supabase
                    .from('alahly_vs_zamalek_PLAYERDETAILS')
                    .insert(eventRows);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error("Error updating match events:", error.message);
            throw error;
        }
    },
    /**
     * Compute the impact of player goals on match results in Ahly vs Zamalek.
     */
    async getPlayerGoalImpact(playerName) {
        try {
            const matches = await this.getAllMatches();
            const events = await this.getAllPlayerDetails();
            const searchName = String(playerName || "").trim();

            const isAhlyTeam = (t) => {
                if (!t) return false;
                const s = String(t).trim().toUpperCase();
                return s === "AHLY" || s === "الأهلي" || s === "الأهلى";
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

    /**
     * Compute the impact of player assists on match results in Ahly vs Zamalek.
     */
    async getPlayerAssistImpact(playerName) {
        try {
            const matches = await this.getAllMatches();
            const events = await this.getAllPlayerDetails();
            const searchName = String(playerName || "").trim();

            const isAhlyTeam = (t) => {
                if (!t) return false;
                const s = String(t).trim().toUpperCase();
                return s === "AHLY" || s === "الأهلي" || s === "الأهلى";
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

    /**
     * Export data to Excel file using XLSX library.
     */
    async exportToExcel(data, fileName = "Ahly_vs_Zamalek_Data") {
        try {
            const XLSX = await import("xlsx");
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } catch (error) {
            console.error("Export Error:", error.message);
        }
    }
};
