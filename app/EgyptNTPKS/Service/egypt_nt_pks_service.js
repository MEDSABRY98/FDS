import { supabase } from "../../lib/supabase";

/**
 * Service to handle Egypt National Team PKS (Penalty Shootouts) Database operations.
 * Table: egy_NT_PKS
 * Columns: ROW_ID, MATCH_ID, PKS System, CHAMPION System, Egypt TEAM,
 *          Egypt PLAYER, Egypt STATUS, EGYPT HOW MISS, OPPONENT GK,
 *          G-EGYPT, G-OPPONENT, PKS W-L, OPPONENT TEAM,
 *          OPPONENT PLAYER, OPPONENT STATUS, OPPONENT HOW MISS, EGYPT GK
 */
export const EgyptNTPKSService = {

    /**
     * Fetch ALL PKS data and enrich with match info (CHAMPION, SEASON, ROUND, DATE, Managers).
     */
    async getAllPKs() {
        try {
            // Fetch PKS data
            let pksData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from('egy_NT_PKS')
                    .select('*')
                    .order('ROW_ID', { ascending: true })
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    pksData = [...pksData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }

            // Fetch match details for enrichment (paginated to retrieve all rows)
            let matchData = [];
            let mFrom = 0;
            const mStep = 1000;
            let mFinished = false;

            while (!mFinished) {
                const { data, error } = await supabase
                    .from('egy_NT_MATCHDETAILS')
                    .select('MATCH_ID, CHAMPION, SEASON, ROUND, DATE, "EGYPT MANAGER", "OPPONENT MANAGER", "H-A-N", PLACE')
                    .order('ROW_ID', { ascending: true })
                    .range(mFrom, mFrom + mStep - 1);

                if (error) {
                    console.warn("Could not fetch match details for enrichment:", error.message);
                    mFinished = true;
                } else if (data && data.length > 0) {
                    matchData = [...matchData, ...data];
                    mFrom += mStep;
                    if (data.length < mStep) mFinished = true;
                } else {
                    mFinished = true;
                }
            }

            // Build match lookup map
            const matchMap = new Map();
            if (matchData) {
                matchData.forEach(m => {
                    const mId = String(m.MATCH_ID || "").trim();
                    if (mId) matchMap.set(mId, m);
                });
            }

            // Get unique shootouts sorted by date to assign stable display IDs
            const uniqueMatchIdMap = new Map();
            pksData.forEach(pk => {
                const matchId = String(pk.MATCH_ID || "").trim();
                if (!uniqueMatchIdMap.has(matchId)) {
                    const matchInfo = matchMap.get(matchId);
                    const dateVal = pk.DATE || matchInfo?.DATE || null;
                    uniqueMatchIdMap.set(matchId, dateVal);
                }
            });

            // Sort unique match IDs by date (descending)
            const sortedUniqueMatches = Array.from(uniqueMatchIdMap.entries())
                .sort((a, b) => {
                    const dateA = a[1];
                    const dateB = b[1];
                    if (dateA && dateB) return new Date(dateB) - new Date(dateA);
                    return b[0].localeCompare(a[0]);
                });

            // Map MATCH_ID to display PK-ID (oldest is PK-1, newest is PK-N)
            const matchToDisplayId = new Map();
            sortedUniqueMatches.forEach(([matchId], idx) => {
                matchToDisplayId.set(matchId, `PK-${sortedUniqueMatches.length - idx}`);
            });

            // Enrich PKS data with match info
            const enriched = pksData.map(pk => {
                const matchId = String(pk.MATCH_ID || "").trim();
                const matchInfo = matchMap.get(matchId);
                const displayId = matchToDisplayId.get(matchId) || "PK-N/A";

                return {
                    ...pk,
                    PKS_ID: pk.MATCH_ID, // Use MATCH_ID as the unique shootout identifier
                    DISPLAY_ID: displayId,
                    CHAMPION: matchInfo?.CHAMPION || "---",
                    SEASON: matchInfo?.SEASON || "---",
                    ROUND: matchInfo?.ROUND || "---",
                    DATE: pk.DATE || matchInfo?.DATE || null,
                    "EGYPT MANAGER": matchInfo?.["EGYPT MANAGER"] || "---",
                    "OPPONENT MANAGER": matchInfo?.["OPPONENT MANAGER"] || "---",
                    "H-A-N": matchInfo?.["H-A-N"] || "---",
                    PLACE: matchInfo?.PLACE || "---",
                };
            });

            return enriched;
        } catch (error) {
            console.error("Error in EgyptNTPKSService.getAllPKs:", error.message);
            return [];
        }
    },

    /**
     * Update a single PK record in egy_NT_PKS.
     */
    async updatePKSRecord(rowId, updates) {
        try {
            const { error } = await supabase
                .from('egy_NT_PKS')
                .update(updates)
                .eq('ROW_ID', rowId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating Egypt NT PK record:", error.message);
            throw error;
        }
    },

    /**
     * Create a new PK record in egy_NT_PKS.
     */
    async createPKSRecord(newRecord) {
        try {
            const { data, error } = await supabase
                .from('egy_NT_PKS')
                .insert([newRecord])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error("Error creating Egypt NT PK record:", error.message);
            throw error;
        }
    },

    /**
     * Delete a single PK record from egy_NT_PKS.
     */
    async deletePKSRecord(rowId) {
        try {
            const { error } = await supabase
                .from('egy_NT_PKS')
                .delete()
                .eq('ROW_ID', rowId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting Egypt NT PK record:", error.message);
            throw error;
        }
    },

    /**
     * Parse numeric suffix from egy_NT_PKS ROW_ID (e.g. R-0042 -> 42).
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
     * Allocate the next sequential ROW_ID values for egy_NT_PKS.
     */
    async allocatePksRowIds(count = 1) {
        const total = Math.max(1, Number(count) || 1);
        let maxNum = 0;

        const { count: rowCount, error: countError } = await supabase
            .from('egy_NT_PKS')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        if (rowCount && rowCount > 0) {
            const from = Math.max(0, rowCount - 1000);
            const { data, error } = await supabase
                .from('egy_NT_PKS')
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
     * Enrich PKS kick rows with manager names from egy_NT_MATCHDETAILS (targeted fetch).
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
                .from('egy_NT_MATCHDETAILS')
                .select('MATCH_ID, CHAMPION, SEASON, ROUND, DATE, "EGYPT MANAGER", "OPPONENT MANAGER", "H-A-N", PLACE')
                .in('MATCH_ID', chunk);

            if (error) throw error;

            (data || []).forEach((m) => {
                const id = String(m.MATCH_ID || "").trim();
                if (id) matchMap.set(id, m);
            });
        }

        const uniqueMatchIdMap = new Map();
        (pks || []).forEach(pk => {
            const matchId = String(pk.MATCH_ID || "").trim();
            if (!uniqueMatchIdMap.has(matchId)) {
                const matchInfo = matchMap.get(matchId);
                const dateVal = pk.DATE || matchInfo?.DATE || null;
                uniqueMatchIdMap.set(matchId, dateVal);
            }
        });

        const sortedUniqueMatches = Array.from(uniqueMatchIdMap.entries())
            .sort((a, b) => {
                const dateA = a[1];
                const dateB = b[1];
                if (dateA && dateB) return new Date(dateB) - new Date(dateA);
                return b[0].localeCompare(a[0]);
            });

        const matchToDisplayId = new Map();
        sortedUniqueMatches.forEach(([matchId], idx) => {
            matchToDisplayId.set(matchId, `PK-${sortedUniqueMatches.length - idx}`);
        });

        return (pks || []).map((pk) => {
            const matchId = String(pk.MATCH_ID || "").trim();
            const matchInfo = matchMap.get(matchId);
            const displayId = matchToDisplayId.get(matchId) || "PK-N/A";

            return {
                ...pk,
                PKS_ID: pk.MATCH_ID,
                DISPLAY_ID: displayId,
                CHAMPION: matchInfo?.CHAMPION || pk.CHAMPION || "---",
                SEASON: matchInfo?.SEASON || pk.SEASON || "---",
                ROUND: matchInfo?.ROUND || pk.ROUND || "---",
                DATE: pk.DATE || matchInfo?.DATE || null,
                "EGYPT MANAGER": matchInfo?.["EGYPT MANAGER"] || pk["EGYPT MANAGER"] || "---",
                "OPPONENT MANAGER": matchInfo?.["OPPONENT MANAGER"] || pk["OPPONENT MANAGER"] || "---",
                "H-A-N": matchInfo?.["H-A-N"] || pk["H-A-N"] || "---",
                PLACE: matchInfo?.PLACE || pk.PLACE || "---",
            };
        });
    },

    /**
     * Strip enriched-only fields before writing to egy_NT_PKS.
     */
    _sanitizePksCommonData(commonData = {}) {
        const enrichedOnly = new Set([
            "PKS_ID", "DISPLAY_ID", "CHAMPION", "SEASON", "ROUND", "DATE",
            "EGYPT MANAGER", "OPPONENT MANAGER", "H-A-N", "PLACE",
        ]);
        const sanitized = {};
        Object.entries(commonData).forEach(([key, value]) => {
            if (!enrichedOnly.has(key)) {
                sanitized[key] = value;
            }
        });
        return sanitized;
    },

    /**
     * Batch save an entire PKS shootout (deletes, updates, inserts).
     */
    async savePKSShootout({ commonData, kickRows, existingKicks = [] }) {
        const sanitizedCommon = this._sanitizePksCommonData(commonData);

        const keptOriginalIds = new Set(
            kickRows.map((row) => row.ORIGINAL_ROW_ID).filter(Boolean)
        );

        const toDelete = (existingKicks || [])
            .filter((kick) => !keptOriginalIds.has(kick.ROW_ID))
            .map((kick) => kick.ROW_ID);

        if (toDelete.length > 0) {
            const { error } = await supabase
                .from('egy_NT_PKS')
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
            const payload = { ...sanitizedCommon, ...kickFields };

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
                .from('egy_NT_PKS')
                .insert(insertRecords);

            if (error) throw error;
        }

        return true;
    },

    /**
     * Fetch all kick rows for a single shootout by MATCH_ID.
     */
    async getPKsByMatchId(matchId) {
        if (!matchId) return [];
        try {
            const { data, error } = await supabase
                .from('egy_NT_PKS')
                .select('*')
                .eq('MATCH_ID', String(matchId).trim())
                .order('ROW_ID', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching Egypt NT PKs by MATCH_ID:", error.message);
            throw error;
        }
    },

};
