import { supabase } from "../../Database";

const TABLE_NAME = "int_nt_MATCHDETAILS";
const INSERT_CHUNK_SIZE = 100;
const COMPUTED_MATCH_COLUMNS = ["W-D-L", "CLEAN SHEET", "OUTCOME", "PEN DISPLAY"];

const EDITABLE_COLUMNS = [
    "GAME",
    "AGE",
    "SEASON",
    "HOST COUNTRY",
    "DATE",
    "CATEGORY",
    "ROUND",
    "TEAMA",
    "TEAMA CONTINENT",
    "TEAMASCORE",
    "TEAMBSCORE",
    "TEAMAPEN",
    "TEAMBPEN",
    "TEAMB",
    "TEAMB CONTINENT",
];

function parseRowIdNumber(value) {
    const raw = String(value ?? "").trim();
    const trailing = raw.match(/(\d+)(?!.*\d)/);
    if (trailing) return parseInt(trailing[1], 10);
    const asNum = parseInt(raw, 10);
    return Number.isFinite(asNum) ? asNum : 0;
}

export function buildIntNtMatchId(season, date, teamA, teamB) {
    return [season, date, teamA, teamB]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join("");
}

export function formatPenDisplay(match) {
    const a = match?.TEAMAPEN;
    const b = match?.TEAMBPEN;
    if (a != null && String(a).trim() !== "" && b != null && String(b).trim() !== "") {
        return `${String(a).trim()}-${String(b).trim()}`;
    }
    return "";
}

export function omitIntComputedFromPayload(payload) {
    const next = { ...payload };
    COMPUTED_MATCH_COLUMNS.forEach((col) => delete next[col]);
    return next;
}

function stripStoredComputedFields(match) {
    const next = { ...match };
    COMPUTED_MATCH_COLUMNS.forEach((col) => delete next[col]);
    return next;
}

function parsePenPair(penA, penB) {
    const a = penA != null && String(penA).trim() !== "" ? parseInt(String(penA).trim(), 10) : null;
    const b = penB != null && String(penB).trim() !== "" ? parseInt(String(penB).trim(), 10) : null;
    if (a === null || b === null || Number.isNaN(a) || Number.isNaN(b)) return null;
    return { a, b };
}

function computeCleanSheet(gf, ga) {
    if (gf === 0 && ga === 0) return "BOTH";
    if (ga === 0) return "F";
    if (gf === 0) return "A";
    return "-";
}

function resolveOutcomeFromScores(gf, ga, penPair) {
    if (gf > ga) return "W";
    if (gf < ga) return "L";
    if (penPair) {
        if (penPair.a > penPair.b) return "W";
        if (penPair.b > penPair.a) return "L";
    }
    return gf === 0 ? "D." : "D";
}

function resolveWinnerLabel(outcome, teamA, teamB) {
    if (outcome === "W") return teamA || "—";
    if (outcome === "L") return teamB || "—";
    if (outcome && String(outcome).startsWith("D")) return "Draw";
    return null;
}

function enrichMatchComputedFields(match) {
    const base = stripStoredComputedFields(match);
    const gf = base.TEAMASCORE !== null && base.TEAMASCORE !== undefined ? parseInt(base.TEAMASCORE, 10) : null;
    const ga = base.TEAMBSCORE !== null && base.TEAMBSCORE !== undefined ? parseInt(base.TEAMBSCORE, 10) : null;

    let outcome = null;
    let cleanSheet = null;
    let winner = null;

    if (gf !== null && ga !== null && !Number.isNaN(gf) && !Number.isNaN(ga)) {
        const penPair = gf === ga ? parsePenPair(base.TEAMAPEN, base.TEAMBPEN) : null;
        outcome = resolveOutcomeFromScores(gf, ga, penPair);
        cleanSheet = computeCleanSheet(gf, ga);
        winner = resolveWinnerLabel(outcome, base.TEAMA, base.TEAMB);
    }

    return {
        ...base,
        OUTCOME: outcome,
        "W-D-L": winner,
        "CLEAN SHEET": cleanSheet,
        "PEN DISPLAY": formatPenDisplay(base),
    };
}

/** W/L/D from a given team's perspective (Team A = W when that team is TEAMA). */
export function getIntNtTeamOutcome(match, teamName) {
    const outcome = match?.OUTCOME;
    if (!outcome || !teamName) return outcome ?? null;
    const isTeamA = match.TEAMA === teamName;
    if (isTeamA) return outcome;
    if (outcome === "W") return "L";
    if (outcome === "L") return "W";
    return outcome;
}

export function normalizeCategoryValue(category) {
    if (category == null || category === "") return category;
    const trimmed = String(category).trim();
    if (trimmed === "?" || trimmed === "؟") return "?";
    return trimmed;
}

function normalizePayloadRow(row, rowId, matchId) {
    const payload = { ROW_ID: rowId, MATCH_ID: matchId };
    EDITABLE_COLUMNS.forEach((col) => {
        const val = row[col];
        if (val === "" || val === undefined || val === null) {
            payload[col] = null;
        } else if (col === "TEAMASCORE" || col === "TEAMBSCORE") {
            const num = parseInt(val, 10);
            payload[col] = Number.isNaN(num) ? null : num;
        } else if (col === "CATEGORY") {
            payload[col] = normalizeCategoryValue(val);
        } else {
            payload[col] = String(val).trim();
        }
    });
    return omitIntComputedFromPayload(payload);
}

export const IntNtService = {
    TABLE_NAME,

    async allocateIntNtRowIds(count = 1) {
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

    async getAllMatches() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select("*")
                    .order("SEASON", { ascending: false })
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

            return allData
                .map(enrichMatchComputedFields)
                .sort((a, b) => {
                    const s = String(b.SEASON ?? "").localeCompare(String(a.SEASON ?? ""), undefined, { numeric: true });
                    if (s !== 0) return s;
                    return parseRowIdNumber(a.ROW_ID) - parseRowIdNumber(b.ROW_ID);
                });
        } catch (error) {
            console.error("Error in IntNtService.getAllMatches:", error.message);
            return [];
        }
    },

    async getExistingMatchIds() {
        try {
            const ids = new Set();
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select("MATCH_ID")
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data?.length) {
                    data.forEach((row) => {
                        const id = String(row.MATCH_ID ?? "").trim();
                        if (id) ids.add(id);
                    });
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }

            return ids;
        } catch (error) {
            console.error("Error in IntNtService.getExistingMatchIds:", error.message);
            return new Set();
        }
    },

    validateBulkRows(rows, existingIds = new Set()) {
        const errors = [];
        const seenIds = new Set();

        rows.forEach((row, index) => {
            const rowNum = index + 1;
            const season = String(row.SEASON ?? "").trim();
            const date = String(row.DATE ?? "").trim();
            const teamA = String(row.TEAMA ?? "").trim();
            const teamB = String(row.TEAMB ?? "").trim();

            if (!season || !date || !teamA || !teamB) {
                errors.push(`Row ${rowNum}: SEASON, DATE, TEAMA, and TEAMB are required.`);
                return;
            }

            const matchId = buildIntNtMatchId(season, date, teamA, teamB);
            if (!matchId) {
                errors.push(`Row ${rowNum}: Could not build MATCH_ID.`);
                return;
            }

            if (seenIds.has(matchId)) {
                errors.push(`Row ${rowNum}: Duplicate MATCH_ID "${matchId}" in this batch.`);
                return;
            }
            seenIds.add(matchId);

            if (existingIds.has(matchId)) {
                errors.push(`Row ${rowNum}: MATCH_ID "${matchId}" already exists in the database.`);
            }
        });

        return errors;
    },

    async insertMatchesBulk(rows) {
        if (!rows?.length) return { inserted: 0 };

        const rowIds = await this.allocateIntNtRowIds(rows.length);
        const existingIds = await this.getExistingMatchIds();
        const batchIds = new Set();

        const resolvedRows = rows.map((row, index) => {
            let matchId = buildIntNtMatchId(row.SEASON, row.DATE, row.TEAMA, row.TEAMB);
            if (batchIds.has(matchId) || existingIds.has(matchId)) {
                matchId = `${matchId}${rowIds[index]}`;
            }
            batchIds.add(matchId);
            return normalizePayloadRow(row, rowIds[index], matchId);
        });

        let inserted = 0;
        for (let i = 0; i < resolvedRows.length; i += INSERT_CHUNK_SIZE) {
            const chunk = resolvedRows.slice(i, i + INSERT_CHUNK_SIZE);
            const { error } = await supabase.from(TABLE_NAME).insert(chunk);
            if (error) throw error;
            inserted += chunk.length;
        }

        return { inserted };
    },

    getUniqueFilters(matches) {
        const getUnique = (col, reverse = false, localeSort = false) => {
            const uniqueValues = [...new Set(matches.map((m) => m[col]).filter((v) => v !== null && v !== undefined && v !== ""))]
                .map(String)
                .sort((a, b) => {
                    if (localeSort) return a.localeCompare(b, "ar");
                    return reverse ? b.localeCompare(a, undefined, { numeric: true }) : a.localeCompare(b, undefined, { numeric: true });
                });
            return ["All", ...uniqueValues];
        };

        const getUniqueFromCols = (cols, localeSort = false) => {
            const set = new Set();
            (matches || []).forEach((m) => {
                cols.forEach((col) => {
                    const v = m[col];
                    if (v !== null && v !== undefined && v !== "") set.add(String(v));
                });
            });
            const uniqueValues = [...set].sort((a, b) =>
                localeSort ? a.localeCompare(b, "ar") : a.localeCompare(b, undefined, { numeric: true })
            );
            return ["All", ...uniqueValues];
        };

        return {
            games: getUnique("GAME"),
            ages: getUnique("AGE"),
            seasons: getUnique("SEASON", true),
            host_countries: getUnique("HOST COUNTRY", false, true),
            dates: getUnique("DATE", true),
            categories: getUnique("CATEGORY"),
            rounds: getUnique("ROUND"),
            teams: getUniqueFromCols(["TEAMA", "TEAMB"], true),
            continents: getUniqueFromCols(["TEAMA CONTINENT", "TEAMB CONTINENT"]),
            wdl: getUnique("W-D-L"),
            clean_sheets: getUnique("CLEAN SHEET"),
        };
    },
};
