import { supabase } from "../../Database";

const TABLE_NAME = "int_club_MATCHDETAILS";
const INSERT_CHUNK_SIZE = 100;
const COMPUTED_MATCH_COLUMNS = ["W-D-L", "CLEAN SHEET", "OUTCOME"];

const EDITABLE_COLUMNS = [
    "GAME",
    "KIND",
    "Edition",
    "ROUND",
    "H-A-N",
    "TEAM A",
    "TEAM A CONTINENT",
    "GF",
    "GA",
    "PEN",
    "TEAM B",
    "TEAM B CONTINENT",
    "NOTE",
];

function parseRowIdNumber(value) {
    const raw = String(value ?? "").trim();
    const trailing = raw.match(/(\d+)(?!.*\d)/);
    if (trailing) return parseInt(trailing[1], 10);
    const asNum = parseInt(raw, 10);
    return Number.isFinite(asNum) ? asNum : 0;
}

export function buildIntlMatchId(edition, teamA, teamB) {
    return [edition, teamA, teamB]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join("");
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

function parseClubPenString(pen) {
    const raw = String(pen ?? "").trim();
    if (!raw) return null;
    const m = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (!m) return null;
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
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
    const gf = base.GF !== null && base.GF !== undefined ? parseInt(base.GF, 10) : null;
    const ga = base.GA !== null && base.GA !== undefined ? parseInt(base.GA, 10) : null;

    let outcome = null;
    let cleanSheet = null;
    let winner = null;

    if (gf !== null && ga !== null && !Number.isNaN(gf) && !Number.isNaN(ga)) {
        const penPair = gf === ga ? parseClubPenString(base.PEN) : null;
        outcome = resolveOutcomeFromScores(gf, ga, penPair);
        cleanSheet = computeCleanSheet(gf, ga);
        winner = resolveWinnerLabel(outcome, base["TEAM A"], base["TEAM B"]);
    }

    return { ...base, OUTCOME: outcome, "W-D-L": winner, "CLEAN SHEET": cleanSheet };
}

/** W/L/D from a given club's perspective (Team A = W when that club is TEAM A). */
export function getIntlClubTeamOutcome(match, clubName) {
    const outcome = match?.OUTCOME;
    if (!outcome || !clubName) return outcome ?? null;
    const isTeamA = match["TEAM A"] === clubName;
    if (isTeamA) return outcome;
    if (outcome === "W") return "L";
    if (outcome === "L") return "W";
    return outcome;
}

function normalizePayloadRow(row, rowId, matchId) {
    const payload = { ROW_ID: rowId, MATCH_ID: matchId };
    EDITABLE_COLUMNS.forEach((col) => {
        const val = row[col];
        if (val === "" || val === undefined || val === null) {
            payload[col] = null;
        } else if (col === "GF" || col === "GA") {
            const num = parseInt(val, 10);
            payload[col] = Number.isNaN(num) ? null : num;
        } else {
            payload[col] = String(val).trim();
        }
    });
    return omitIntComputedFromPayload(payload);
}

export const IntlClubService = {
    TABLE_NAME,

    async allocateIntlRowIds(count = 1) {
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
                    .order("Edition", { ascending: false })
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
                    const ed = String(b.Edition ?? "").localeCompare(String(a.Edition ?? ""), undefined, { numeric: true });
                    if (ed !== 0) return ed;
                    return parseRowIdNumber(a.ROW_ID) - parseRowIdNumber(b.ROW_ID);
                });
        } catch (error) {
            console.error("Error in IntlClubService.getAllMatches:", error.message);
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
            console.error("Error in IntlClubService.getExistingMatchIds:", error.message);
            return new Set();
        }
    },

    validateBulkRows(rows, existingIds = new Set()) {
        const errors = [];
        const seenIds = new Set();

        rows.forEach((row, index) => {
            const rowNum = index + 1;
            const edition = String(row.Edition ?? "").trim();
            const teamA = String(row["TEAM A"] ?? "").trim();
            const teamB = String(row["TEAM B"] ?? "").trim();

            if (!edition || !teamA || !teamB) {
                errors.push(`Row ${rowNum}: Edition, TEAM A, and TEAM B are required.`);
                return;
            }

            const matchId = buildIntlMatchId(edition, teamA, teamB);
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

        const rowIds = await this.allocateIntlRowIds(rows.length);
        const resolvedRows = rows.map((row, index) => {
            const matchId = buildIntlMatchId(row.Edition, row["TEAM A"], row["TEAM B"]);
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
            kinds: getUnique("KIND"),
            editions: getUnique("Edition", true),
            rounds: getUnique("ROUND"),
            han: getUnique("H-A-N"),
            teams: getUniqueFromCols(["TEAM A", "TEAM B"], true),
            continents: getUniqueFromCols(["TEAM A CONTINENT", "TEAM B CONTINENT"]),
            wdl: getUnique("W-D-L"),
            clean_sheets: getUnique("CLEAN SHEET"),
            notes: getUnique("NOTE"),
        };
    },
};
