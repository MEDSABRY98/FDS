import { supabase } from "../../Database";

const TABLE_NAME = "int_TROPHY_GENERAL";
const INSERT_CHUNK_SIZE = 100;

const EDITABLE_COLUMNS = [
    "TYPE",
    "AREA",
    "GAME",
    "COMPETITION",
    "SEASON",
    "W-MANAGER",
    "L-MANAGER",
    "PLACE",
    "CHAMPION",
    "RESULT",
    "RUNNER-UP",
    "NOTE",
];

function parseRowIdNumber(value) {
    const raw = String(value ?? "").trim();
    const trailing = raw.match(/(\d+)(?!.*\d)/);
    if (trailing) return parseInt(trailing[1], 10);
    const asNum = parseInt(raw, 10);
    return Number.isFinite(asNum) ? asNum : 0;
}

export function buildTrophyKey(type, game, competition, season, place, runnerUp) {
    return [type, game, competition, season, place, runnerUp]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join("|");
}

export function parseSeasonParts(season) {
    const raw = String(season ?? "").trim();
    if (!raw) return { text: "", number: 0, suffix: "", raw };

    const trailing = raw.match(/^(.*?)\s(\d{4}(?:[-/–—]\d{1,4})?)\s*$/);
    if (trailing) {
        const text = trailing[1].trim();
        const suffix = trailing[2];
        const number = parseInt(suffix.match(/\d+/)[0], 10);
        return { text, number: Number.isFinite(number) ? number : 0, suffix, raw };
    }

    const onlyYear = raw.match(/^(\d{4}(?:[-/–—]\d{1,4})?)$/);
    if (onlyYear) {
        const suffix = onlyYear[1];
        const number = parseInt(suffix.match(/\d+/)[0], 10);
        return { text: "", number: Number.isFinite(number) ? number : 0, suffix, raw };
    }

    return { text: raw, number: 0, suffix: "", raw };
}

/** Sort key: text prefix first, then trailing year (newest first). */
export function compareSeasonLabels(a, b) {
    const partA = parseSeasonParts(a);
    const partB = parseSeasonParts(b);

    const textCmp = partA.text.localeCompare(partB.text, "ar", { sensitivity: "base" });
    if (textCmp !== 0) return textCmp;

    if (partA.number !== partB.number) return partB.number - partA.number;

    if (partA.suffix !== partB.suffix) {
        return partB.suffix.localeCompare(partA.suffix, undefined, { numeric: true });
    }

    return partB.raw.localeCompare(partA.raw, "ar", { numeric: true });
}

export function compareTrophiesBySeason(a, b) {
    const cmp = compareSeasonLabels(a?.SEASON, b?.SEASON);
    if (cmp !== 0) return cmp;
    return String(a?.ROW_ID ?? "").localeCompare(String(b?.ROW_ID ?? ""), undefined, { numeric: true });
}

export function sortTrophiesBySeason(trophies) {
    return [...(trophies || [])].sort(compareTrophiesBySeason);
}

function normalizePayloadRow(row, rowId) {
    const payload = { ROW_ID: rowId };
    EDITABLE_COLUMNS.forEach((col) => {
        const val = row[col];
        payload[col] = val === "" || val === undefined || val === null ? null : String(val).trim();
    });
    return payload;
}

function cleanRow(row) {
    const cleaned = {};
    for (const key in row) {
        if (row[key] !== null && typeof row[key] === "string") {
            cleaned[key] = row[key].trim();
        } else {
            cleaned[key] = row[key];
        }
    }
    return cleaned;
}

function filterByType(trophies, typeFilter) {
    if (!typeFilter || typeFilter === "All") return trophies || [];
    return (trophies || []).filter((t) => String(t.TYPE ?? "").trim() === typeFilter);
}

export const IntTrophyService = {
    TABLE_NAME,

    async allocateTrophyRowIds(count = 1) {
        const total = Math.max(1, Number(count) || 1);
        let maxNum = 0;
        let from = 0;

        while (true) {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select("ROW_ID")
                .range(from, from + 999);

            if (error) throw error;
            if (!data?.length) break;

            data.forEach((row) => {
                maxNum = Math.max(maxNum, parseRowIdNumber(row?.ROW_ID));
            });

            if (data.length < 1000) break;
            from += 1000;
        }

        return Array.from({ length: total }, (_, index) =>
            `R-${String(maxNum + 1 + index).padStart(4, "0")}`
        );
    },

    async getAllTrophies() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select("*")
                    .order("ROW_ID", { ascending: true })
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data?.length) {
                    allData = [...allData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }

            return allData.map(cleanRow);
        } catch (error) {
            console.error("Error in IntTrophyService.getAllTrophies:", error.message);
            return [];
        }
    },

    getLeaderboard(trophies, typeFilter = "All") {
        const counts = {};
        filterByType(trophies, typeFilter).forEach((t) => {
            const champion = t.CHAMPION ? String(t.CHAMPION).trim() : null;
            if (!champion) return;
            if (!counts[champion]) {
                counts[champion] = { champion, count: 0, trophies: [] };
            }
            counts[champion].count++;
            counts[champion].trophies.push(t);
        });
        return Object.values(counts).sort(
            (a, b) => b.count - a.count || String(a.champion).localeCompare(String(b.champion), "ar")
        );
    },

    getSeasons(trophies, typeFilter = "All") {
        const uniqueSeasons = [
            ...new Set(
                filterByType(trophies, typeFilter)
                    .map((t) => (t.SEASON ? String(t.SEASON).trim() : ""))
                    .filter(Boolean)
            ),
        ];
        return uniqueSeasons.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
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
                    .select('TYPE, GAME, COMPETITION, SEASON, PLACE, "RUNNER-UP"')
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data?.length) {
                    data.forEach((row) => {
                        const key = buildTrophyKey(
                            row.TYPE, row.GAME, row.COMPETITION, row.SEASON, row.PLACE, row["RUNNER-UP"]
                        );
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
            console.error("Error in IntTrophyService.getExistingTrophyKeys:", error.message);
            return new Set();
        }
    },

    validateBulkRows(rows, existingKeys = new Set()) {
        const errors = [];
        const seenKeys = new Set();

        rows.forEach((row, index) => {
            const rowNum = index + 1;
            const type = String(row.TYPE ?? "").trim();
            const game = String(row.GAME ?? "").trim();
            const competition = String(row.COMPETITION ?? "").trim();
            const season = String(row.SEASON ?? "").trim();
            const champion = String(row.CHAMPION ?? "").trim();

            const place = String(row.PLACE ?? "").trim();
            const runnerUp = String(row["RUNNER-UP"] ?? "").trim();

            if (!type || !game || !competition || !season || !champion) {
                errors.push(`Row ${rowNum}: TYPE, GAME, COMPETITION, SEASON, and CHAMPION are required.`);
                return;
            }

            if (type !== "Club" && type !== "NT") {
                errors.push(`Row ${rowNum}: TYPE must be Club or NT.`);
                return;
            }

            const key = buildTrophyKey(type, game, competition, season, place, runnerUp);
            if (seenKeys.has(key)) {
                errors.push(`Row ${rowNum}: Duplicate TYPE+GAME+COMPETITION+SEASON+PLACE+RUNNER-UP in this batch.`);
                return;
            }
            seenKeys.add(key);

            if (existingKeys.has(key)) {
                errors.push(`Row ${rowNum}: Trophy "${type} | ${game} | ${competition} | ${season} | ${place || "—"} | ${runnerUp || "—"}" already exists.`);
            }
        });

        return errors;
    },

    async insertTrophiesBulk(rows) {
        if (!rows?.length) return { inserted: 0 };

        const rowIds = await this.allocateTrophyRowIds(rows.length);
        const resolvedRows = rows.map((row, index) => normalizePayloadRow(row, rowIds[index]));

        let inserted = 0;
        for (let i = 0; i < resolvedRows.length; i += INSERT_CHUNK_SIZE) {
            const chunk = resolvedRows.slice(i, i + INSERT_CHUNK_SIZE);
            const { error } = await supabase.from(TABLE_NAME).insert(chunk);
            if (error) throw error;
            inserted += chunk.length;
        }

        return { inserted };
    },

    getUniqueFilters(trophies) {
        const getUnique = (col, reverse = false) => {
            const uniqueValues = [...new Set((trophies || []).map((t) => t[col]).filter((v) => v !== null && v !== undefined && v !== ""))]
                .map(String)
                .sort((a, b) => (reverse ? b.localeCompare(a, undefined, { numeric: true }) : a.localeCompare(b, undefined, { numeric: true })));
            return ["All", ...uniqueValues];
        };

        const getUniqueFromCols = (cols, localeSort = false) => {
            const set = new Set();
            (trophies || []).forEach((t) => {
                cols.forEach((col) => {
                    const v = t[col];
                    if (v !== null && v !== undefined && v !== "") set.add(String(v));
                });
            });
            const uniqueValues = [...set].sort((a, b) =>
                localeSort ? a.localeCompare(b, "ar") : a.localeCompare(b, undefined, { numeric: true })
            );
            return ["All", ...uniqueValues];
        };

        return {
            types: getUnique("TYPE"),
            areas: getUnique("AREA"),
            games: getUnique("GAME"),
            competitions: getUnique("COMPETITION"),
            seasons: getUnique("SEASON", true),
            teams: getUniqueFromCols(["CHAMPION", "RUNNER-UP"], true),
            places: getUnique("PLACE"),
            w_managers: getUnique("W-MANAGER"),
            l_managers: getUnique("L-MANAGER"),
        };
    },
};
