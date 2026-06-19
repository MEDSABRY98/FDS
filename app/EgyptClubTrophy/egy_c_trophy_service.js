import { supabase } from "../Database";

const TABLE_NAME = "egy_CLUB_TROPHY";
const INSERT_CHUNK_SIZE = 100;

const EDITABLE_COLUMNS = [
    "CHAMPION",
    "COMPETITION",
    "SEASON",
    "PLACE",
    "RESULT",
    "PEN",
    "RUNNER-UP",
    "NOTE",
];

export function buildTrophyKey(season, competition) {
    const s = String(season ?? "").trim();
    const c = String(competition ?? "").trim();
    if (!s || !c) return "";
    return `${s}|${c}`;
}

function normalizePayloadRow(row) {
    const payload = {};
    EDITABLE_COLUMNS.forEach((col) => {
        const val = row[col];
        payload[col] = val === "" || val === undefined || val === null ? null : String(val).trim();
    });
    return payload;
}

/**
 * Service to handle all Egypt Clubs Trophies database operations.
 */
export const EgyptClubTrophyService = {
    /**
     * Fetch all trophies from the database.
     */
    async getAllTrophies() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
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

            // Clean data by trimming all string fields
            return allData.map(row => {
                const cleaned = {};
                for (const key in row) {
                    if (row[key] !== null && typeof row[key] === 'string') {
                        cleaned[key] = row[key].trim();
                    } else {
                        cleaned[key] = row[key];
                    }
                }
                return cleaned;
            });
        } catch (error) {
            console.error("Error in EgyptClubTrophyService.getAllTrophies:", error.message);
            return [];
        }
    },

    /**
     * Group trophies by champion and compute leaderboards.
     */
    getLeaderboard(trophies) {
        const counts = {};
        trophies.forEach(t => {
            const champion = t.CHAMPION ? String(t.CHAMPION).trim() : null;
            if (!champion) return;

            if (!counts[champion]) {
                counts[champion] = {
                    champion,
                    count: 0,
                    trophies: []
                };
            }
            counts[champion].count++;
            counts[champion].trophies.push(t);
        });

        // Sort descending by trophy count
        return Object.values(counts).sort((a, b) => b.count - a.count);
    },

    /**
     * Get unique seasons in descending order.
     */
    getSeasons(trophies) {
        const uniqueSeasons = [...new Set(trophies.map(t => t.SEASON ? String(t.SEASON).trim() : "").filter(Boolean))];
        return uniqueSeasons.sort((a, b) => b.localeCompare(a));
    },

    async getExistingTrophyKeys() {
        try {
            const keys = new Set();
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select("SEASON, COMPETITION")
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data?.length) {
                    data.forEach((row) => {
                        const key = buildTrophyKey(row.SEASON, row.COMPETITION);
                        if (key) keys.add(key);
                    });
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }

            return keys;
        } catch (error) {
            console.error("Error in EgyptClubTrophyService.getExistingTrophyKeys:", error.message);
            return new Set();
        }
    },

    validateBulkRows(rows, existingKeys = new Set()) {
        const errors = [];
        const seenKeys = new Set();

        rows.forEach((row, index) => {
            const rowNum = index + 1;
            const champion = String(row.CHAMPION ?? "").trim();
            const competition = String(row.COMPETITION ?? "").trim();
            const season = String(row.SEASON ?? "").trim();

            if (!champion || !competition || !season) {
                errors.push(`Row ${rowNum}: CHAMPION, COMPETITION, and SEASON are required.`);
                return;
            }

            const key = buildTrophyKey(season, competition);
            if (seenKeys.has(key)) {
                errors.push(`Row ${rowNum}: Duplicate SEASON+COMPETITION "${season} / ${competition}" in this batch.`);
                return;
            }
            seenKeys.add(key);

            if (existingKeys.has(key)) {
                errors.push(`Row ${rowNum}: Trophy for "${season} / ${competition}" already exists in the database.`);
            }
        });

        return errors;
    },

    async insertTrophiesBulk(rows) {
        if (!rows?.length) {
            return { inserted: 0 };
        }

        const resolvedRows = rows.map(normalizePayloadRow);

        let inserted = 0;
        for (let i = 0; i < resolvedRows.length; i += INSERT_CHUNK_SIZE) {
            const chunk = resolvedRows.slice(i, i + INSERT_CHUNK_SIZE);
            const { error } = await supabase.from(TABLE_NAME).insert(chunk);
            if (error) throw error;
            inserted += chunk.length;
        }

        return { inserted };
    },
};
