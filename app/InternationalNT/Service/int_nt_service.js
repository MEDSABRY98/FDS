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

/** Composite key for duplicate detection (ROW_ID is the sole stored identifier). */
export function buildIntNtMatchFingerprint(row) {
    const season = String(row?.SEASON ?? "").trim().toLowerCase();
    const date = String(row?.DATE ?? "").trim();
    const teamA = String(row?.TEAMA ?? "").trim().toLowerCase();
    const teamB = String(row?.TEAMB ?? "").trim().toLowerCase();
    if (!season || !date || !teamA || !teamB) return "";
    return `${season}|${date}|${teamA}|${teamB}`;
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

function normalizePayloadRow(row, rowId) {
    const payload = { ROW_ID: rowId };
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

    async getExistingMatchFingerprints() {
        try {
            const fingerprints = new Set();
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select("SEASON, DATE, TEAMA, TEAMB")
                    .range(from, from + step - 1);

                if (error) throw error;
                if (data?.length) {
                    data.forEach((row) => {
                        const fp = buildIntNtMatchFingerprint(row);
                        if (fp) fingerprints.add(fp);
                    });
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }

            return fingerprints;
        } catch (error) {
            console.error("Error in IntNtService.getExistingMatchFingerprints:", error.message);
            return new Set();
        }
    },

    validateBulkRows(rows, existingFingerprints = new Set()) {
        const errors = [];
        const seen = new Set();

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

            const fingerprint = buildIntNtMatchFingerprint(row);
            if (!fingerprint) {
                errors.push(`Row ${rowNum}: Could not validate match identity.`);
                return;
            }

            if (seen.has(fingerprint)) {
                errors.push(`Row ${rowNum}: Duplicate match in this batch (same season, date, and teams).`);
                return;
            }
            seen.add(fingerprint);

            if (existingFingerprints.has(fingerprint)) {
                errors.push(`Row ${rowNum}: A match with the same season, date, and teams already exists.`);
            }
        });

        return errors;
    },

    async insertMatchesBulk(rows) {
        if (!rows?.length) return { inserted: 0 };

        const rowIds = await this.allocateIntNtRowIds(rows.length);
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
            wdl: (() => {
                const outcomes = new Set(matches.map(m => {
                    const out = String(m.OUTCOME || "");
                    if (out === "W") return "W";
                    if (out === "L") return "L";
                    if (out.startsWith("D")) return "D";
                    return null;
                }).filter(Boolean));
                const opts = [];
                if (outcomes.has("W")) opts.push("W");
                if (outcomes.has("D")) opts.push("D");
                if (outcomes.has("L")) opts.push("L");
                return ["All", ...opts];
            })(),
            clean_sheets: getUnique("CLEAN SHEET"),
        };
    },
};
