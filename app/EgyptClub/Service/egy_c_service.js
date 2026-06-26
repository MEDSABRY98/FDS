import { supabase, resolveCatalogFieldsInForm } from "../../Database";

const TABLE_NAME = "egy_CLUB_MATCHDETAILS";
const INSERT_CHUNK_SIZE = 100;

export function parseMatchDate(dateInput) {
    const raw = String(dateInput ?? "").trim();
    if (!raw) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [y, m, d] = raw.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Excel serial: days since 1899-12-30 (UTC midnight). */
export function dateToExcelSerial(dateInput) {
    const date = parseMatchDate(dateInput);
    if (!date) return "";

    const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const excelEpoch = Date.UTC(1899, 11, 30);
    return String(Math.round((utc - excelEpoch) / 86400000));
}

export function buildEgyptClubMatchId(opponentTeam, date) {
    const opponent = String(opponentTeam ?? "").trim();
    const serial = dateToExcelSerial(date);
    if (!opponent || !serial) return "";
    return `${opponent}${serial}`;
}

export function deriveYearFromDate(dateInput) {
    const date = parseMatchDate(dateInput);
    return date ? String(date.getFullYear()) : "";
}

function normalizePayloadRow(row) {
    const payload = { ...row };
    delete payload._key;

    Object.keys(payload).forEach((key) => {
        if (payload[key] === "") payload[key] = null;
    });

    payload.MATCH_ID = buildEgyptClubMatchId(payload["OPPONENT TEAM"], payload.DATE);
    if (!payload.YEAR && payload.DATE) {
        payload.YEAR = deriveYearFromDate(payload.DATE);
    }

    return payload;
}

function enrichMatchComputedFields(match) {
    const gf = match.GF !== null && match.GF !== undefined ? parseInt(match.GF, 10) : null;
    const ga = match.GA !== null && match.GA !== undefined ? parseInt(match.GA, 10) : null;

    let wdl = null;
    let cleanSheet = null;

    if (gf !== null && ga !== null && !isNaN(gf) && !isNaN(ga)) {
        if (gf > ga) {
            wdl = "W";
        } else if (gf < ga) {
            wdl = "L";
        } else {
            wdl = gf === 0 ? "D." : "D";
        }

        if (gf === 0 && ga === 0) {
            cleanSheet = "BOTH";
        } else if (ga === 0) {
            cleanSheet = "F";
        } else if (gf === 0) {
            cleanSheet = "A";
        } else {
            cleanSheet = "-";
        }
    }

    return {
        ...match,
        "W-D-L": wdl,
        "CLEAN SHEET": cleanSheet
    };
}

/**
 * Service to handle all Egypt Clubs Database operations.
 */
export const EgyptClubService = {
    async getAllMatches() {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select('*')
                    .order('DATE', { ascending: false })
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

            return allData.map(enrichMatchComputedFields);
        } catch (error) {
            console.error("Error in EgyptClubService.getAllMatches:", error.message);
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
            console.error("Error in EgyptClubService.getExistingMatchIds:", error.message);
            return new Set();
        }
    },

    validateBulkRows(rows, existingIds = new Set()) {
        const errors = [];
        const seenIds = new Set();

        rows.forEach((row, index) => {
            const rowNum = index + 1;
            const egyptTeam = String(row["EGYPT TEAM"] ?? "").trim();
            const opponent = String(row["OPPONENT TEAM"] ?? "").trim();
            const date = String(row.DATE ?? "").trim();

            if (!egyptTeam || !opponent || !date) {
                errors.push(`Row ${rowNum}: EGYPT TEAM, OPPONENT TEAM, and DATE are required.`);
                return;
            }

            const matchId = buildEgyptClubMatchId(opponent, date);
            if (!matchId) {
                errors.push(`Row ${rowNum}: Could not build MATCH_ID from opponent and date.`);
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
        if (!rows?.length) {
            return { inserted: 0 };
        }

        const resolvedRows = [];
        for (const row of rows) {
            const payload = normalizePayloadRow(row);
            const resolved = await resolveCatalogFieldsInForm(TABLE_NAME, payload);
            resolvedRows.push(resolved);
        }

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
        const getUnique = (col, reverse = false) => {
            const uniqueValues = [...new Set(matches.map(m => m[col]).filter(Boolean))].sort();
            if (reverse) uniqueValues.reverse();
            return ["All", ...uniqueValues];
        };

        const years = [...new Set(matches.map(m => m.YEAR || (m.DATE ? new Date(m.DATE).getFullYear().toString() : null)).filter(Boolean))].sort().reverse();

        return {
            match_ids: getUnique('MATCH_ID'),
            champion_systems: getUnique('CHAMPION SYSTEM'),
            years: ["All", ...years],
            champions: getUnique('CHAMPION'),
            seasons: getUnique('SEASON', true),
            rounds: getUnique('ROUND'),
            places: getUnique('PLACE'),
            han: getUnique('H-A-N'),
            egy_teams: getUnique('EGYPT TEAM'),
            gf: getUnique('GF'),
            ga: getUnique('GA'),
            et: getUnique('ET'),
            pen: getUnique('PEN'),
            opponent_teams: getUnique('OPPONENT TEAM'),
            wdl: getUnique('W-D-L'),
            clean_sheets: getUnique('CLEAN SHEET'),
            wl_q_fs: getUnique('W-L Q & F'),
            notes: getUnique('NOTE')
        };
    }
};

export function getMatchCountryToken(opponentTeam) {
    if (!opponentTeam) return null;
    const parts = String(opponentTeam).split(" - ");
    const token = parts[parts.length - 1].trim().toLowerCase();
    return token || null;
}

export function resolveCountryRow(countryName, countriesList = []) {
    if (!countryName) return null;
    const target = String(countryName).trim().toLowerCase();
    return (
        countriesList.find(
            (c) =>
                c.COUNTRY_NAME?.toLowerCase() === target ||
                c.COUNTRY_NAME_EN?.toLowerCase() === target
        ) || null
    );
}

export function matchOpponentCountry(opponentTeam, selectedCountry, countriesList = []) {
    const token = getMatchCountryToken(opponentTeam);
    if (!token || !selectedCountry) return false;

    const row = resolveCountryRow(selectedCountry, countriesList);
    if (row) {
        return (
            token === row.COUNTRY_NAME?.toLowerCase() ||
            token === row.COUNTRY_NAME_EN?.toLowerCase()
        );
    }

    return token === String(selectedCountry).trim().toLowerCase();
}

export function getCountryOptionsFromMatches(matches, countriesList = []) {
    const tokens = new Set();
    (matches || []).forEach((m) => {
        const token = getMatchCountryToken(m["OPPONENT TEAM"]);
        if (token) tokens.add(token);
    });

    const options = [];
    const seen = new Set();

    (countriesList || []).forEach((c) => {
        const ar = c.COUNTRY_NAME?.toLowerCase();
        const en = c.COUNTRY_NAME_EN?.toLowerCase();
        if ((ar && tokens.has(ar)) || (en && tokens.has(en))) {
            const label = c.COUNTRY_NAME;
            if (label && !seen.has(label)) {
                seen.add(label);
                options.push({ value: label, label });
            }
        }
    });

    tokens.forEach((token) => {
        const inCatalog = (countriesList || []).some(
            (c) =>
                c.COUNTRY_NAME?.toLowerCase() === token ||
                c.COUNTRY_NAME_EN?.toLowerCase() === token
        );
        if (!inCatalog && !seen.has(token)) {
            seen.add(token);
            options.push({ value: token, label: token });
        }
    });

    return options.sort((a, b) => a.label.localeCompare(b.label, "ar"));
}
