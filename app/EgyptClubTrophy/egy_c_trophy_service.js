import { supabase } from "../lib/supabase";

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
                    .from('egy_CLUB_TROPHY')
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
    }
};
