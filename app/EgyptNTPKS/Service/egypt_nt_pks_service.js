import { supabase } from "../../Database";

const PKS_SHOOTOUT_FIELDS = [
    "MATCH_ID",
    "PKS System",
    "PKS W-L",
    "G-EGYPT",
    "G-OPPONENT",
];

const MATCH_DETAILS_SELECT_FOR_PKS =
    'MATCH_ID, DATE, CHAMPION_SYSTEM, CHAMPION, SEASON, ROUND, "Egypt TEAM", "OPPONENT TEAM", "EGYPT MANAGER", "OPPONENT MANAGER", "H-A-N", PLACE, PEN';

function normalizePenScoreFromMatchPen(penValue) {
    const raw = String(penValue ?? "").trim();
    if (!raw) return "";
    const match = raw.match(/(\d+)\s*[-:–]\s*(\d+)/);
    if (!match) return "";
    return `${parseInt(match[1], 10)}-${parseInt(match[2], 10)}`;
}

function pickPksShootoutFields(data = {}) {
    const picked = {};
    PKS_SHOOTOUT_FIELDS.forEach((key) => {
        if (data[key] !== undefined) picked[key] = data[key];
    });
    return picked;
}

function mapMatchDetailsToPksFields(match) {
    if (!match) return {};
    return {
        DATE: match.DATE || "",
        "CHAMPION System": match.CHAMPION_SYSTEM || "",
        CHAMPION: match.CHAMPION || "",
        SEASON: match.SEASON || "",
        ROUND: match.ROUND || "",
        "Egypt TEAM": match["Egypt TEAM"] || "",
        "OPPONENT TEAM": match["OPPONENT TEAM"] || "",
        "EGYPT MANAGER": match["EGYPT MANAGER"] || "---",
        "OPPONENT MANAGER": match["OPPONENT MANAGER"] || "---",
        "H-A-N": match["H-A-N"] || "---",
        PLACE: match.PLACE || "---",
    };
}

function assignDisplayIds(pksRows = [], matchMap = new Map()) {
    const uniqueMatchIdMap = new Map();

    pksRows.forEach((pk) => {
        const matchId = String(pk.MATCH_ID || "").trim();
        if (!matchId || uniqueMatchIdMap.has(matchId)) return;
        const matchInfo = matchMap.get(matchId.toUpperCase());
        uniqueMatchIdMap.set(matchId, matchInfo?.DATE || null);
    });

    const sortedUniqueMatches = Array.from(uniqueMatchIdMap.entries()).sort((a, b) => {
        const dateA = a[1];
        const dateB = b[1];
        if (dateA && dateB) return new Date(dateB) - new Date(dateA);
        return b[0].localeCompare(a[0]);
    });

    const matchToDisplayId = new Map();
    sortedUniqueMatches.forEach(([matchId], idx) => {
        matchToDisplayId.set(matchId, `PK-${sortedUniqueMatches.length - idx}`);
    });

    return matchToDisplayId;
}

export function auditEgyptNtPksMatchLinks(pks = []) {
    const groups = new Map();

    pks.forEach((row) => {
        const matchId = String(row.MATCH_ID || "").trim();
        if (!matchId) return;
        if (!groups.has(matchId)) groups.set(matchId, []);
        groups.get(matchId).push(row);
    });

    const allMatchIds = new Set(
        pks.map((row) => String(row.MATCH_ID || "").trim()).filter(Boolean)
    );
    const rowsWithMatchId = pks.filter((row) => String(row.MATCH_ID || "").trim());
    const unlinkedRows = pks.length - rowsWithMatchId.length;

    return {
        totalShootouts: groups.size,
        linked: groups.size,
        unlinked: unlinkedRows > 0 ? 1 : 0,
        unlinkedMatchIds: [...allMatchIds].filter((id) => !groups.has(id)),
        orphanKickRows: pks.filter((row) => !String(row.MATCH_ID || "").trim()).length,
    };
}

/**
 * Service to handle Egypt National Team PKS (Penalty Shootouts) Database operations.
 * Table: egy_NT_PKS — shootout metadata comes from egy_NT_MATCHDETAILS via MATCH_ID.
 */
export const EgyptNTPKSService = {

    async getAllPKs() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from("egy_NT_PKS")
                    .select("*")
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

            return allData;
        } catch (error) {
            console.error("Error in EgyptNTPKSService.getAllPKs:", error.message);
            return [];
        }
    },

    async enrichPksWithMatchDetails(pks) {
        const rows = pks || [];
        const matchIds = [
            ...new Set(rows.map((pk) => String(pk.MATCH_ID || "").trim()).filter(Boolean)),
        ];

        const matchMap = new Map();

        if (matchIds.length) {
            const chunkSize = 100;
            for (let i = 0; i < matchIds.length; i += chunkSize) {
                const chunk = matchIds.slice(i, i + chunkSize);
                const { data, error } = await supabase
                    .from("egy_NT_MATCHDETAILS")
                    .select(MATCH_DETAILS_SELECT_FOR_PKS)
                    .in("MATCH_ID", chunk);

                if (error) throw error;

                (data || []).forEach((m) => {
                    const id = String(m.MATCH_ID || "").trim().toUpperCase();
                    if (id) matchMap.set(id, m);
                });
            }
        }

        const matchToDisplayId = assignDisplayIds(rows, matchMap);

        return rows.map((pk) => {
            const matchId = String(pk.MATCH_ID || "").trim();
            const matchInfo = matchMap.get(matchId.toUpperCase());
            const fromMatch = mapMatchDetailsToPksFields(matchInfo);
            const displayId = matchToDisplayId.get(matchId) || "PK-N/A";

            return {
                ...pk,
                PKS_ID: matchId || pk.MATCH_ID,
                DISPLAY_ID: displayId,
                ...fromMatch,
                "EGYPT MANAGER": fromMatch["EGYPT MANAGER"] || pk["EGYPT MANAGER"] || "---",
                "OPPONENT MANAGER": fromMatch["OPPONENT MANAGER"] || pk["OPPONENT MANAGER"] || "---",
            };
        });
    },

    /** @deprecated Use enrichPksWithMatchDetails */
    async enrichPksWithManagers(pks) {
        return this.enrichPksWithMatchDetails(pks);
    },

    async getPenaltyMatchesForPicker() {
        let allData = [];
        let from = 0;
        const step = 1000;
        let finished = false;

        while (!finished) {
            const { data, error } = await supabase
                .from("egy_NT_MATCHDETAILS")
                .select(MATCH_DETAILS_SELECT_FOR_PKS)
                .not("PEN", "is", null)
                .neq("PEN", "")
                .order("DATE", { ascending: false })
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

    async getMatchByMatchId(matchId) {
        const id = String(matchId || "").trim();
        if (!id) return null;

        const { data, error } = await supabase
            .from("egy_NT_MATCHDETAILS")
            .select(MATCH_DETAILS_SELECT_FOR_PKS)
            .eq("MATCH_ID", id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async updatePKSRecord(rowId, updates) {
        try {
            const { error } = await supabase
                .from("egy_NT_PKS")
                .update(updates)
                .eq("ROW_ID", rowId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating Egypt NT PK record:", error.message);
            throw error;
        }
    },

    async createPKSRecord(newRecord) {
        try {
            const { data, error } = await supabase
                .from("egy_NT_PKS")
                .insert([newRecord])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error("Error creating Egypt NT PK record:", error.message);
            throw error;
        }
    },

    async deletePKSRecord(rowId) {
        try {
            const { error } = await supabase
                .from("egy_NT_PKS")
                .delete()
                .eq("ROW_ID", rowId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting Egypt NT PK record:", error.message);
            throw error;
        }
    },

    _parsePksRowIdNum(rowId) {
        const raw = String(rowId ?? "").trim();
        const trailingNumber = raw.match(/(\d+)(?!.*\d)/);
        const num = trailingNumber
            ? parseInt(trailingNumber[1], 10)
            : parseInt(raw, 10);
        return Number.isFinite(num) ? num : 0;
    },

    async allocatePksRowIds(count = 1) {
        const total = Math.max(1, Number(count) || 1);
        let maxNum = 0;

        const { count: rowCount, error: countError } = await supabase
            .from("egy_NT_PKS")
            .select("*", { count: "exact", head: true });

        if (countError) throw countError;

        if (rowCount && rowCount > 0) {
            const from = Math.max(0, rowCount - 1000);
            const { data, error } = await supabase
                .from("egy_NT_PKS")
                .select("ROW_ID")
                .order("ROW_ID", { ascending: true })
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

    async savePKSShootout({ commonData, kickRows, existingKicks = [] }) {
        const shootoutData = pickPksShootoutFields(commonData);

        const keptOriginalIds = new Set(
            kickRows.map((row) => row.ORIGINAL_ROW_ID).filter(Boolean)
        );

        const toDelete = (existingKicks || [])
            .filter((kick) => !keptOriginalIds.has(kick.ROW_ID))
            .map((kick) => kick.ROW_ID);

        if (toDelete.length > 0) {
            const { error } = await supabase
                .from("egy_NT_PKS")
                .delete()
                .in("ROW_ID", toDelete);

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
            const payload = { ...shootoutData, ...kickFields };

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
                .from("egy_NT_PKS")
                .insert(insertRecords);

            if (error) throw error;
        }

        return true;
    },

    async getPKsByMatchId(matchId) {
        if (!matchId) return [];
        try {
            const { data, error } = await supabase
                .from("egy_NT_PKS")
                .select("*")
                .eq("MATCH_ID", String(matchId).trim())
                .order("ROW_ID", { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching Egypt NT PKs by MATCH_ID:", error.message);
            throw error;
        }
    },
};
