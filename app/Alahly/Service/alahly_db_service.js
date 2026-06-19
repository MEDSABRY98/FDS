import { supabase } from "../../lib/supabase";

function normalizePksLinkText(value) {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePenScoreFromPksRow(row = {}) {
    const ahly = parseInt(row["G-AHLY"], 10);
    const opp = parseInt(row["G-OPPONENT"], 10);
    if (!Number.isFinite(ahly) || !Number.isFinite(opp)) return "";
    return `${ahly}-${opp}`;
}

function normalizePenScoreFromMatchPen(penValue) {
    const raw = String(penValue ?? "").trim();
    if (!raw) return "";
    const match = raw.match(/(\d+)\s*[-:–]\s*(\d+)/);
    if (!match) return "";
    return `${parseInt(match[1], 10)}-${parseInt(match[2], 10)}`;
}

function getPksShootoutGroupKey(pk = {}) {
    const pksId = String(pk.PKS_ID || "").trim();
    if (pksId) return pksId;

    const opponent = normalizePksLinkText(pk["OPPONENT TEAM"]);
    const pen = normalizePenScoreFromPksRow(pk);
    return `orphan:${opponent}|${pen}`;
}

function buildPksMatchLookup(matches = []) {
    const lookup = new Map();

    matches.forEach((match) => {
        const pen = normalizePenScoreFromMatchPen(match.PEN);
        const opponent = normalizePksLinkText(match["OPPONENT TEAM"]);
        if (!pen || !opponent) return;

        const key = `${opponent}|${pen}`;
        if (!lookup.has(key)) lookup.set(key, []);
        lookup.get(key).push(match);
    });

    return lookup;
}

function resolveMatchForPksShootout(shootoutRows = [], lookup = new Map()) {
    const first = shootoutRows[0];
    if (!first) return null;

    const opponent = normalizePksLinkText(first["OPPONENT TEAM"]);
    const pen = normalizePenScoreFromPksRow(first);
    if (!opponent || !pen) return null;

    const candidates = lookup.get(`${opponent}|${pen}`) || [];
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    const champion = normalizePksLinkText(first.CHAMPION);
    const season = normalizePksLinkText(first.SEASON);

    let filtered = candidates;
    if (champion) {
        filtered = filtered.filter(
            (match) => normalizePksLinkText(match.CHAMPION) === champion
        );
    }

    if (season && filtered.length > 1) {
        filtered = filtered.filter((match) => {
            const seasonName = normalizePksLinkText(match["SEASON - NAME"] || match.SEASON || "");
            const seasonNumber = String(match["SEASON - NUMBER"] || "").trim().toLowerCase();
            return seasonName === season || seasonNumber === season;
        });
    }

    return filtered.length === 1 ? filtered[0] : null;
}

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
     * Parse numeric suffix from alahly_PKS ROW_ID (e.g. R-0042 -> 42).
     */
    _parsePksRowIdNum(rowId) {
        const raw = String(rowId ?? "").trim();
        const trailingNumber = raw.match(/(\d+)(?!.*\d)/);
        const num = trailingNumber
            ? parseInt(trailingNumber[1], 10)
            : parseInt(raw, 10);
        return Number.isFinite(num) ? num : 0;
    },

    /**
     * Allocate the next sequential ROW_ID values for alahly_PKS.
     */
    async allocatePksRowIds(count = 1) {
        const total = Math.max(1, Number(count) || 1);
        let maxNum = 0;

        const { count: rowCount, error: countError } = await supabase
            .from('alahly_PKS')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        if (rowCount && rowCount > 0) {
            const from = Math.max(0, rowCount - 1000);
            const { data, error } = await supabase
                .from('alahly_PKS')
                .select('ROW_ID')
                .order('ROW_ID', { ascending: true })
                .range(from, from + 999);

            if (error) throw error;

            (data || []).forEach((row) => {
                maxNum = Math.max(maxNum, this._parsePksRowIdNum(row?.ROW_ID));
            });
        }

        return Array.from({ length: total }, (_, index) =>
            `R-${String(maxNum + 1 + index).padStart(4, "0")}`
        );
    },

    /**
     * Fetch main matches that have a penalty-shootout score (PEN column).
     */
    async _fetchPenaltyMatchesForPksLinking() {
        let allData = [];
        let from = 0;
        const step = 1000;
        let finished = false;

        while (!finished) {
            const { data, error } = await supabase
                .from('alahly_MATCHDETAILS')
                .select('MATCH_ID, DATE, "OPPONENT TEAM", PEN, CHAMPION, "SEASON - NAME", "SEASON - NUMBER"')
                .not('PEN', 'is', null)
                .neq('PEN', '')
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

        return allData.filter((match) => normalizePenScoreFromMatchPen(match.PEN));
    },

    /**
     * Fill missing MATCH_ID / DATE on alahly_PKS rows by linking to alahly_MATCHDETAILS
     * via OPPONENT TEAM + penalty score (G-AHLY/G-OPPONENT vs PEN).
     */
    async enrichPksFromMatchDetails(pks, options = { persist: true }) {
        const rows = pks || [];
        const needsLink = rows.some(
            (row) => !String(row.MATCH_ID || "").trim() || !String(row.DATE || "").trim()
        );

        if (!needsLink) return rows;

        const matches = await this._fetchPenaltyMatchesForPksLinking();
        const lookup = buildPksMatchLookup(matches);

        const groups = new Map();
        rows.forEach((pk) => {
            const groupKey = getPksShootoutGroupKey(pk);
            if (!groups.has(groupKey)) groups.set(groupKey, []);
            groups.get(groupKey).push(pk);
        });

        const resolvedByGroup = new Map();
        groups.forEach((groupRows, groupKey) => {
            resolvedByGroup.set(groupKey, resolveMatchForPksShootout(groupRows, lookup));
        });

        const updates = [];

        const enriched = rows.map((pk) => {
            const groupKey = getPksShootoutGroupKey(pk);
            const match = resolvedByGroup.get(groupKey);
            if (!match) return pk;

            const missingMatchId = !String(pk.MATCH_ID || "").trim();
            const missingDate = !String(pk.DATE || "").trim();
            if (!missingMatchId && !missingDate) return pk;

            const patched = { ...pk };
            if (missingMatchId && match.MATCH_ID) {
                patched.MATCH_ID = match.MATCH_ID;
            }
            if (missingDate && match.DATE) {
                patched.DATE = match.DATE;
            }

            if (options.persist && pk.ROW_ID) {
                const updatePayload = {};
                if (missingMatchId && match.MATCH_ID) {
                    updatePayload.MATCH_ID = match.MATCH_ID;
                }
                if (missingDate && match.DATE) {
                    updatePayload.DATE = match.DATE;
                }
                if (Object.keys(updatePayload).length > 0) {
                    updates.push({ rowId: pk.ROW_ID, updatePayload });
                }
            }

            return patched;
        });

        if (options.persist && updates.length > 0) {
            await Promise.all(
                updates.map(({ rowId, updatePayload }) =>
                    this.updatePKSRecord(rowId, updatePayload)
                )
            );
        }

        return enriched;
    },

    /**
     * Enrich PKS kick rows with manager names from MATCHDETAILS (targeted fetch).
     */
    async enrichPksWithManagers(pks) {
        const matchIds = [...new Set(
            (pks || []).map(pk => String(pk.MATCH_ID || "").trim()).filter(Boolean)
        )];

        if (!matchIds.length) return pks || [];

        const matchMap = new Map();
        const chunkSize = 100;

        for (let i = 0; i < matchIds.length; i += chunkSize) {
            const chunk = matchIds.slice(i, i + chunkSize);
            const { data, error } = await supabase
                .from('alahly_MATCHDETAILS')
                .select('MATCH_ID, "AHLY MANAGER", "OPPONENT MANAGER"')
                .in('MATCH_ID', chunk);

            if (error) throw error;

            (data || []).forEach((m) => {
                const id = String(m.MATCH_ID || "").trim().toUpperCase();
                if (id) matchMap.set(id, m);
            });
        }

        return (pks || []).map((pk) => {
            const pkMatchId = String(pk.MATCH_ID || "").trim().toUpperCase();
            const matchInfo = matchMap.get(pkMatchId);

            return {
                ...pk,
                "AHLY MANAGER": matchInfo?.["AHLY MANAGER"] || pk["AHLY MANAGER"] || "---",
                "OPPONENT MANAGER": matchInfo?.["OPPONENT MANAGER"] || pk["OPPONENT MANAGER"] || "---",
            };
        });
    },

    /**
     * Batch save an entire PKS shootout (deletes, updates, inserts).
     */
    async savePKSShootout({ commonData, kickRows, existingKicks = [] }) {
        const keptOriginalIds = new Set(
            kickRows.map((row) => row.ORIGINAL_ROW_ID).filter(Boolean)
        );

        const toDelete = (existingKicks || [])
            .filter((kick) => !keptOriginalIds.has(kick.ROW_ID))
            .map((kick) => kick.ROW_ID);

        if (toDelete.length > 0) {
            const { error } = await supabase
                .from('alahly_PKS')
                .delete()
                .in('ROW_ID', toDelete);

            if (error) throw error;
        }

        const newRows = kickRows.filter((row) => !row.ORIGINAL_ROW_ID);
        const allocatedIds = newRows.length > 0
            ? await this.allocatePksRowIds(newRows.length)
            : [];

        const updatePromises = [];
        const insertRecords = [];
        let nextNewIdIndex = 0;

        for (const row of kickRows) {
            const { ORIGINAL_ROW_ID, _localId, ...kickFields } = row;
            const payload = { ...commonData, ...kickFields };

            if (ORIGINAL_ROW_ID) {
                updatePromises.push(this.updatePKSRecord(ORIGINAL_ROW_ID, payload));
            } else {
                insertRecords.push({
                    ...payload,
                    ROW_ID: allocatedIds[nextNewIdIndex++],
                });
            }
        }

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }

        if (insertRecords.length > 0) {
            const { error } = await supabase
                .from('alahly_PKS')
                .insert(insertRecords);

            if (error) throw error;
        }

        return true;
    },

    /**
     * Fetch all kick rows for a single shootout PKS_ID.
     */
    async getPKsByPksId(pksId) {
        if (!pksId) return [];
        try {
            const { data, error } = await supabase
                .from('alahly_PKS')
                .select('*')
                .eq('PKS_ID', String(pksId).trim())
                .order('ROW_ID', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching PKs by PKS_ID:", error.message);
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
