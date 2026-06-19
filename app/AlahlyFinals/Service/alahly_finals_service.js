import { supabase } from "../../Database";

const MATCH_TABLE = "alahly_MATCHDETAILS";
const LINEUP_TABLE = "alahly_LINEUPDETAILS";
const PLAYER_TABLE = "alahly_PLAYERDETAILS";

const FINAL_ROUND = "النهائي";
const FINALS_ROUND_OR = `ROUND.ilike.%${FINAL_ROUND}%,ROUND.ilike.%final%`;
const MATCH_ID_CHUNK = 100;

async function fetchPaginated(buildQuery) {
    let allData = [];
    let from = 0;
    const step = 1000;
    let finished = false;

    while (!finished) {
        const { data, error } = await buildQuery().range(from, from + step - 1);
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
}

async function fetchByMatchIds(table, matchIds, orderCol = "ROW_ID") {
    const ids = [...new Set(matchIds.map((id) => String(id || "").trim()).filter(Boolean))];
    if (ids.length === 0) return [];

    let allData = [];
    for (let i = 0; i < ids.length; i += MATCH_ID_CHUNK) {
        const chunk = ids.slice(i, i + MATCH_ID_CHUNK);
        const { data, error } = await supabase
            .from(table)
            .select("*")
            .in("MATCH_ID", chunk)
            .order(orderCol, { ascending: true });
        if (error) throw error;
        if (data?.length) allData = [...allData, ...data];
    }
    return allData;
}

/**
 * Service for Al Ahly finals data stored in unified alahly_* tables.
 */
export const AlAhlyFinalsService = {
    async getAllFinalsMatches() {
        try {
            return await fetchPaginated(() =>
                supabase
                    .from(MATCH_TABLE)
                    .select("*")
                    .or(FINALS_ROUND_OR)
                    .order("DATE", { ascending: false })
                    .order("ROW_ID", { ascending: true })
            );
        } catch (error) {
            console.error("Error in AlAhlyFinalsService.getAllFinalsMatches:", error.message);
            return [];
        }
    },

    async getAllFinalsLineups() {
        try {
            const matches = await this.getAllFinalsMatches();
            const matchIds = matches.map((m) => m.MATCH_ID).filter(Boolean);
            return await fetchByMatchIds(LINEUP_TABLE, matchIds);
        } catch (error) {
            console.error("Error in AlAhlyFinalsService.getAllFinalsLineups:", error.message);
            return [];
        }
    },

    async getAllFinalsPlayerDetails() {
        try {
            const matches = await this.getAllFinalsMatches();
            const matchIds = matches.map((m) => m.MATCH_ID).filter(Boolean);
            return await fetchByMatchIds(PLAYER_TABLE, matchIds);
        } catch (error) {
            console.error("Error in AlAhlyFinalsService.getAllFinalsPlayerDetails:", error.message);
            return [];
        }
    },

    getUniqueFilters(matches) {
        const getUnique = (col, reverse = false) => {
            const uniqueValues = [...new Set(matches.map((m) => m[col]).filter(Boolean))].sort();
            if (reverse) uniqueValues.reverse();
            return ["All", ...uniqueValues];
        };

        const years = [...new Set(matches.map((m) => {
            if (!m.DATE) return null;
            const parts = m.DATE.split("/");
            if (parts.length === 3) return parts[2];
            const date = new Date(m.DATE);
            return isNaN(date.getFullYear()) ? null : String(date.getFullYear());
        }).filter(Boolean))].sort().reverse();

        return {
            champion_systems: getUnique("CHAMPION SYSTEM"),
            years: ["All", ...years],
            champions: getUnique("CHAMPION"),
            seasons: getUnique("SEASON - NAME", true),
            ahly_managers: getUnique("AHLY MANAGER"),
            opponent_managers: getUnique("OPPONENT MANAGER"),
            referees: getUnique("REFREE"),
            rounds: getUnique("ROUND"),
            han: getUnique("H-A-N"),
            opponent_teams: getUnique("OPPONENT TEAM"),
            wdl_final: getUnique("W-D-L FINAL"),
        };
    },

    async upsertMatchDetails(record) {
        try {
            const payload = {
                ...record,
                ROUND: record.ROUND || FINAL_ROUND,
            };
            const { data, error } = await supabase
                .from(MATCH_TABLE)
                .upsert(payload)
                .select();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error upserting match details:", error.message);
            throw error;
        }
    },

    async deleteMatchDetails(rowId) {
        try {
            const { error } = await supabase
                .from(MATCH_TABLE)
                .delete()
                .eq("ROW_ID", rowId);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting match details:", error.message);
            throw error;
        }
    },

    async updateMatchLineups(matchId, finalId, lineupRows) {
        try {
            await supabase.from(LINEUP_TABLE).delete().eq("MATCH_ID", matchId);

            if (lineupRows.length > 0) {
                const rows = lineupRows.map((row) => ({
                    ...row,
                    MATCH_ID: matchId,
                    FINAL_ID: finalId,
                }));
                const { error } = await supabase.from(LINEUP_TABLE).insert(rows);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error("Error updating match lineups:", error.message);
            throw error;
        }
    },

    async updateMatchEvents(matchId, finalId, eventRows) {
        try {
            await supabase.from(PLAYER_TABLE).delete().eq("MATCH_ID", matchId);

            if (eventRows.length > 0) {
                const rows = eventRows.map((row) => ({
                    ...row,
                    MATCH_ID: matchId,
                    FINAL_ID: finalId,
                }));
                const { error } = await supabase.from(PLAYER_TABLE).insert(rows);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error("Error updating match events:", error.message);
            throw error;
        }
    },
};
