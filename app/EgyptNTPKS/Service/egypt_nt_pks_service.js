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


};
