import { supabase } from "../../Database";

const DERBY_OPPONENT = "Ø§Ù„Ø²Ù…Ø§Ù„Ùƒ - Ù…ØµØ±";
const DERBY_OPPONENT_ID = "T-0346";
const AHLY_TEAM_ID = "T-0169";

export function isAhlyDerbyTeam(teamValue) {
    if (teamValue == null || teamValue === "") return false;

    const value = String(teamValue).trim();
    const upper = value.toUpperCase();

    if (upper === "T-0346" || upper === "T-0321" || upper === "ZAMALEK") return false;
    if (upper === "T-0169" || upper === "T-0622" || upper === "AHLY") return true;
    if (value.includes("Ø²Ù…Ø§Ù„")) return false;
    if (value.includes("Ø£Ù‡Ù„")) return true;

    return false;
}

export function isZamalekDerbyTeam(teamValue) {
    if (teamValue == null || teamValue === "") return false;

    const value = String(teamValue).trim();
    const upper = value.toUpperCase();

    if (upper === "T-0169" || upper === "T-0622" || upper === "AHLY") return false;
    if (upper === "T-0346" || upper === "T-0321" || upper === "ZAMALEK") return true;
    if (value.includes("Ø²Ù…Ø§Ù„")) return true;
    if (value.includes("Ø£Ù‡Ù„")) return false;

    return false;
}

export function derbyTeamDisplayName(teamValue) {
    return isAhlyDerbyTeam(teamValue) ? "Ø§Ù„Ø£Ù‡Ù„ÙŠ" : isZamalekDerbyTeam(teamValue) ? "Ø§Ù„Ø²Ù…Ø§Ù„Ùƒ" : String(teamValue || "");
}

function extractYear(dateStr) {
    if (!dateStr) return null;
    const parts = String(dateStr).split("/");
    if (parts.length === 3) return parts[2];
    const date = new Date(dateStr);
    return isNaN(date.getFullYear()) ? null : String(date.getFullYear());
}

function enrichDerbyMatch(match) {
    const gf = match.GF !== null && match.GF !== undefined ? parseInt(match.GF, 10) : null;
    const ga = match.GA !== null && match.GA !== undefined ? parseInt(match.GA, 10) : null;

    let wdl = match["W-D-L"];
    let cleanSheet = match["CLEAN SHEET"];

    if (gf !== null && ga !== null && !isNaN(gf) && !isNaN(ga)) {
        if (gf > ga) wdl = "W";
        else if (gf < ga) wdl = "L";
        else wdl = gf === 0 ? "D." : "D";

        if (gf === 0 && ga === 0) cleanSheet = "BOTH";
        else if (ga === 0) cleanSheet = "F";
        else if (gf === 0) cleanSheet = "A";
        else cleanSheet = "-";
    }

    return {
        ...match,
        "W-D-L": wdl,
        "CLEAN SHEET": cleanSheet,
        REFEREE: match.REFREE ?? match.REFEREE,
        "ZAMALEK MANAGER": match["OPPONENT MANAGER"] ?? match["ZAMALEK MANAGER"],
        YEAR: extractYear(match.DATE),
        AHLY: "Ø§Ù„Ø£Ù‡Ù„ÙŠ",
        ZAMALEK: "Ø§Ù„Ø²Ù…Ø§Ù„Ùƒ",
    };
}

async function getDerbyMatchIds() {
    const ids = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data, error } = await supabase
            .from("alahly_MATCHDETAILS")
            .select("MATCH_ID")
            .eq("OPPONENT TEAM", DERBY_OPPONENT_ID)
            .range(from, from + step - 1);

        if (error) throw error;
        if (!data?.length) break;

        ids.push(...data.map((row) => row.MATCH_ID));
        from += data.length;
        if (data.length < step) break;
    }

    return ids.map(String);
}

async function fetchRowsForMatchIds(tableName, matchIds) {
    if (!matchIds.length) return [];

    const allData = [];
    const batchSize = 100;

    for (let i = 0; i < matchIds.length; i += batchSize) {
        const batchIds = matchIds.slice(i, i + batchSize);
        let from = 0;
        const step = 1000;

        while (true) {
            const { data, error } = await supabase
                .from(tableName)
                .select("*")
                .in("MATCH_ID", batchIds)
                .order("ROW_ID", { ascending: true })
                .range(from, from + step - 1);

            if (error) throw error;
            if (!data?.length) break;

            allData.push(...data);
            from += data.length;
            if (data.length < step) break;
        }
    }

    return allData;
}

/**
 * Service to handle all Ahly vs Zamalek Database operations.
 * Reads derby subset from unified alahly_* tables.
 */
export const AhlyVZamalekService = {
    async getAllMatches() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from("alahly_MATCHDETAILS")
                    .select("*")
                    .eq("OPPONENT TEAM", DERBY_OPPONENT_ID)
                    .order("DATE", { ascending: false })
                    .order("ROW_ID", { ascending: true })
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

            return allData.map(enrichDerbyMatch);
        } catch (error) {
            console.error("Error in AhlyVZamalekService.getAllMatches:", error.message);
            return [];
        }
    },

    async getAllLineups() {
        try {
            const matchIds = await getDerbyMatchIds();
            return fetchRowsForMatchIds("alahly_LINEUPDETAILS", matchIds);
        } catch (error) {
            console.error("Error in AhlyVZamalekService.getAllLineups:", error.message);
            return [];
        }
    },

    async getAllPlayerDetails() {
        try {
            const matchIds = await getDerbyMatchIds();
            return fetchRowsForMatchIds("alahly_PLAYERDETAILS", matchIds);
        } catch (error) {
            console.error("Error in AhlyVZamalekService.getAllPlayerDetails:", error.message);
            return [];
        }
    },

    getUniqueFilters(matches) {
        const getUnique = (col, reverse = false) => {
            const uniqueValues = [...new Set(matches.map((m) => m[col]).filter(Boolean))].sort();
            if (reverse) uniqueValues.reverse();
            return ["All", ...uniqueValues];
        };

        const years = [...new Set(matches.map((m) => m.YEAR || extractYear(m.DATE)).filter(Boolean))]
            .sort()
            .reverse();

        return {
            champion_systems: getUnique("CHAMPION SYSTEM"),
            years: ["All", ...years],
            champions: getUnique("CHAMPION"),
            seasons: getUnique("SEASON - NAME", true),
            ahly_managers: getUnique("AHLY MANAGER"),
            zamalek_managers: getUnique("ZAMALEK MANAGER"),
            referees: getUnique("REFEREE"),
            rounds: getUnique("ROUND"),
            han: getUnique("H-A-N"),
            stads: getUnique("STAD"),
            wdl: getUnique("W-D-L"),
            clean_sheets: getUnique("CLEAN SHEET"),
        };
    },

    async getPlayerGoalImpact(playerName) {
        try {
            const matches = await this.getAllMatches();
            const events = await this.getAllPlayerDetails();
            const searchName = String(playerName || "").trim();

            const isAhlyTeam = (t) => isAhlyDerbyTeam(t);

            let winImpact = 0;
            let drawImpact = 0;
            const impactMatches = [];

            matches.forEach((match) => {
                const mid = String(match.MATCH_ID);
                const gf = parseInt(match.GF) || 0;
                const ga = parseInt(match.GA) || 0;
                const res = match["W-D-L"];

                const matchEvents = events.filter((e) => String(e.MATCH_ID) === mid);
                const playerRecord = matchEvents.find((e) => String(e["PLAYER NAME"] || "").trim() === searchName);
                if (!playerRecord) return;

                const isAhlySideInThisMatch = isAhlyTeam(playerRecord.TEAM);
                const playerTeamWon = isAhlySideInThisMatch ? res === "W" : res === "L";
                const isDraw = res === "D" || res === "D.";
                const playerSideG = isAhlySideInThisMatch ? gf : ga;
                const opponentSideG = isAhlySideInThisMatch ? ga : gf;

                const sideGoals = matchEvents
                    .filter(
                        (e) =>
                            isAhlyTeam(e.TEAM) === isAhlySideInThisMatch &&
                            (["GOAL", "Ù‡Ø¯Ù"].includes(String(e.TYPE || "").toUpperCase()) ||
                                String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")
                    )
                    .sort(
                        (a, b) =>
                            (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0) ||
                            parseInt(a.EVENT_ID || 0) - parseInt(b.EVENT_ID || 0)
                    );

                if (sideGoals.length === 0) return;

                if (playerTeamWon) {
                    if (playerSideG - opponentSideG === 1) {
                        const lg = sideGoals[sideGoals.length - 1];
                        if (String(lg["PLAYER NAME"] || "").trim() === searchName) {
                            winImpact++;
                            impactMatches.push({ match, type: "WINNER (Deciding Goal)", playerMins: [lg.MINUTE] });
                        }
                    } else if (playerSideG > 1 && opponentSideG < playerSideG) {
                        const scorers = [...new Set(sideGoals.map((g) => String(g["PLAYER NAME"] || "").trim()))];
                        if (scorers.length === 1 && scorers[0] === searchName) {
                            winImpact++;
                            impactMatches.push({
                                match,
                                type: "WINNER (Sole Scorer)",
                                playerMins: sideGoals.map((g) => g.MINUTE),
                            });
                        }
                    }
                } else if (isDraw && playerSideG > 0) {
                    const lg = sideGoals[sideGoals.length - 1];
                    if (String(lg["PLAYER NAME"] || "").trim() === searchName) {
                        drawImpact++;
                        impactMatches.push({ match, type: "DRAW (Equalizer)", playerMins: [lg.MINUTE] });
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

            const isAhlyTeam = (t) => isAhlyDerbyTeam(t);

            let winImpact = 0;
            let drawImpact = 0;
            const impactMatches = [];

            matches.forEach((match) => {
                const mid = String(match.MATCH_ID);
                const gf = parseInt(match.GF) || 0;
                const ga = parseInt(match.GA) || 0;
                const res = match["W-D-L"];

                const matchEvents = events.filter((e) => String(e.MATCH_ID) === mid);
                const playerRecord = matchEvents.find((e) => String(e["PLAYER NAME"] || "").trim() === searchName);
                if (!playerRecord) return;

                const isAhlySideInThisMatch = isAhlyTeam(playerRecord.TEAM);
                const playerTeamWon = isAhlySideInThisMatch ? res === "W" : res === "L";
                const isDraw = res === "D" || res === "D.";
                const playerSideG = isAhlySideInThisMatch ? gf : ga;
                const opponentSideG = isAhlySideInThisMatch ? ga : gf;

                if (playerTeamWon) {
                    if (playerSideG - opponentSideG === 1) {
                        const sideGoals = matchEvents
                            .filter(
                                (e) =>
                                    isAhlyTeam(e.TEAM) === isAhlySideInThisMatch &&
                                    (["GOAL", "Ù‡Ø¯Ù"].includes(String(e.TYPE || "").toUpperCase()) ||
                                        String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")
                            )
                            .sort(
                                (a, b) =>
                                    (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0) ||
                                    parseInt(a.EVENT_ID || 0) - parseInt(b.EVENT_ID || 0)
                            );

                        if (sideGoals.length === 0) return;
                        const lg = sideGoals[sideGoals.length - 1];
                        const gId = String(lg.EVENT_ID);

                        const assistRow = matchEvents.find(
                            (e) =>
                                ["ASSIST", "Ø§Ø³ÙŠØ³Øª", "ØµÙ†Ø¹"].includes(String(e.TYPE || "").toUpperCase()) &&
                                (String(e.PARENT_EVENT_ID) === gId ||
                                    (parseInt(e.MINUTE) === parseInt(lg.MINUTE) && parseInt(e.MINUTE) > 0)) &&
                                String(e["PLAYER NAME"] || "").trim() === searchName &&
                                String(e["PLAYER NAME"] || "").trim() !== String(lg["PLAYER NAME"] || "").trim()
                        );

                        if (assistRow) {
                            winImpact++;
                            impactMatches.push({
                                match,
                                type: "WINNER (Deciding Assist)",
                                playerMins: [assistRow.MINUTE],
                            });
                        }
                    }
                } else if (isDraw && playerSideG > 0) {
                    const sideGoals = matchEvents
                        .filter(
                            (e) =>
                                isAhlySideInThisMatch === isAhlyTeam(e.TEAM) &&
                                (["GOAL", "Ù‡Ø¯Ù"].includes(String(e.TYPE || "").toUpperCase()) ||
                                    String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")
                        )
                        .sort(
                            (a, b) =>
                                (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0) ||
                                parseInt(a.EVENT_ID || 0) - parseInt(b.EVENT_ID || 0)
                        );

                    if (sideGoals.length === 0) return;
                    const lg = sideGoals[sideGoals.length - 1];
                    const gId = String(lg.EVENT_ID);

                    const assistRow = matchEvents.find(
                        (e) =>
                            ["ASSIST", "Ø§Ø³ÙŠØ³Øª", "ØµÙ†Ø¹"].includes(String(e.TYPE || "").toUpperCase()) &&
                            (String(e.PARENT_EVENT_ID) === gId ||
                                (parseInt(e.MINUTE) === parseInt(lg.MINUTE) && parseInt(e.MINUTE) > 0)) &&
                            String(e["PLAYER NAME"] || "").trim() === searchName &&
                            String(e["PLAYER NAME"] || "").trim() !== String(lg["PLAYER NAME"] || "").trim()
                    );

                    if (assistRow) {
                        drawImpact++;
                        impactMatches.push({
                            match,
                            type: "DRAW (Equalizer Assist)",
                            playerMins: [assistRow.MINUTE],
                        });
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
