export function normalizeMatchId(matchId) {
    return String(matchId || "").trim();
}

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

export function buildOpponentDateMatchId(opponentTeam, date) {
    const opponent = String(opponentTeam ?? "").trim();
    const serial = dateToExcelSerial(date);
    if (!opponent || !serial) return "";
    return `${opponent}${serial}`;
}

/** Al Ahly canonical MATCH_ID: TEAM_ID + Excel date serial (e.g. T-034644197). */
export function buildTeamIdDateMatchId(teamId, date) {
    const id = String(teamId ?? "").trim();
    const serial = dateToExcelSerial(date);
    if (!id || !serial) return "";
    return `${id}${serial}`;
}

export function buildAlAhlyMatchId(teamId, date) {
    return buildTeamIdDateMatchId(teamId, date);
}

export function normalizeCatalogLookupKey(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

/** Build lookup map from db_TEAMS rows for migration scripts. */
export function buildTeamIdLookupMap(teams = []) {
    const map = new Map();
    const register = (key, teamId) => {
        const normalized = normalizeCatalogLookupKey(key);
        if (!normalized || !teamId) return;
        if (!map.has(normalized)) map.set(normalized, teamId);
    };

    teams.forEach((row) => {
        const teamId = String(row?.TEAM_ID || "").trim();
        if (!teamId) return;
        register(teamId, teamId);
        register(row.TEAM_NAME, teamId);
        register(row.TEAM_NAME_EN, teamId);
    });

    return map;
}

/** Resolve OPPONENT TEAM raw value to TEAM_ID using catalog lookup (no throw). */
export function resolveTeamIdFromLookup(opponentTeam, lookup) {
    const raw = String(opponentTeam ?? "").trim();
    if (!raw || !lookup) return "";

    const tryKeys = [raw];
    if (raw.includes(" - ")) {
        tryKeys.push(raw.split(" - ")[0].trim());
    }

    for (const key of tryKeys) {
        const teamId = lookup.get(normalizeCatalogLookupKey(key));
        if (teamId) return teamId;
    }

    if (/^T-/i.test(raw)) return raw;
    return "";
}

export function suggestAlAhlyMatchId({ opponentTeam, date, teamId, teamLookup }) {
    const resolvedTeamId = String(teamId || "").trim()
        || resolveTeamIdFromLookup(opponentTeam, teamLookup)
        || (/^T-/i.test(String(opponentTeam || "").trim()) ? String(opponentTeam).trim() : "");
    return buildTeamIdDateMatchId(resolvedTeamId, date);
}

export function collectMatchIds(rows) {
    return new Set(
        (rows || [])
            .map((row) => normalizeMatchId(row.MATCH_ID))
            .filter(Boolean)
    );
}

export function isMatchIdTaken(matchId, existingIds, { excludeMatchId } = {}) {
    const normalized = normalizeMatchId(matchId);
    if (!normalized) return false;

    const exclude = normalizeMatchId(excludeMatchId);
    const upper = normalized.toUpperCase();

    if (exclude && upper === exclude.toUpperCase()) return false;

    if (existingIds instanceof Set) {
        for (const id of existingIds) {
            if (String(id).toUpperCase() === upper) return true;
        }
        return false;
    }

    return (existingIds || []).some((id) => String(id).toUpperCase() === upper);
}

export function suggestNextMatchIdForOpponent(opponentPrefix, existingIds) {
    const prefix = String(opponentPrefix || "").trim();
    if (!prefix) return "";

    const upperPrefix = prefix.toUpperCase();
    let maxNum = 0;

    const ids = existingIds instanceof Set ? [...existingIds] : (existingIds || []);
    ids.forEach((id) => {
        const upper = String(id).toUpperCase();
        if (!upper.startsWith(upperPrefix)) return;
        const suffix = upper.slice(upperPrefix.length);
        const num = parseInt(suffix, 10);
        if (!Number.isNaN(num) && num > maxNum) maxNum = num;
    });

    let candidate = maxNum + 1;
    while (isMatchIdTaken(`${prefix}${candidate}`, existingIds)) {
        candidate += 1;
    }

    return `${prefix}${candidate}`;
}

const EGYPT_NT_FIRST_TEAM_PATTERN = /FIRST|الاول|الأول|SENIOR|A TEAM|MAIN TEAM|منتخب مصر الاول|منتخب مصر الأول/i;

export function getEgyptNtMatchIdAgePrefix({ age = "", egyptTeam = "" } = {}) {
    const ageValue = String(age || "").trim();
    const teamValue = String(egyptTeam || "").trim();
    const combined = `${ageValue} ${teamValue}`.toUpperCase();

    const directAge = ageValue.match(/^U\d+/i);
    if (directAge) return directAge[0].toUpperCase();

    if (/^FIRST$/i.test(ageValue)) return "First";

    const uFromCombined =
        combined.match(/\bU\s*(\d{1,2})\b/) ||
        combined.match(/\bUNDER\s*(\d{1,2})\b/) ||
        combined.match(/تحت\s*(\d{1,2})/);
    if (uFromCombined) return `U${uFromCombined[1]}`;

    if (EGYPT_NT_FIRST_TEAM_PATTERN.test(combined)) return "First";

    if (!ageValue && /^(منتخب مصر|Egypt|EGYPT|مصر)$/i.test(teamValue)) return "First";

    if (ageValue) return ageValue.replace(/[^\w]/g, "");

    return "";
}

export function buildEgyptNtMatchIdFromTeamId({ age, egyptTeam, opponentTeamId, date } = {}) {
    const teamId = String(opponentTeamId ?? "").trim();
    const serial = buildTeamIdDateMatchId(teamId, date);
    if (!teamId || !serial) return "";

    const agePrefix = getEgyptNtMatchIdAgePrefix({ age, egyptTeam });
    return `${agePrefix}${serial}`;
}

export function suggestEgyptNtMatchId({ age, egyptTeam, opponent, date, teamLookup } = {}) {
    const teamId = resolveTeamIdFromLookup(opponent, teamLookup)
        || (/^T-/i.test(String(opponent || "").trim()) ? String(opponent).trim() : "");
    return buildEgyptNtMatchIdFromTeamId({ age, egyptTeam, opponentTeamId: teamId, date });
}

export function buildEgyptNtMatchIdStem({ age, egyptTeam, opponent, date, teamLookup } = {}) {
    if (teamLookup) {
        return suggestEgyptNtMatchId({ age, egyptTeam, opponent, date, teamLookup });
    }
    const teamId = /^T-/i.test(String(opponent ?? "").trim()) ? String(opponent).trim() : "";
    if (teamId) {
        return buildEgyptNtMatchIdFromTeamId({ age, egyptTeam, opponentTeamId: teamId, date });
    }
    return "";
}

export function buildEgyptNtMatchId({ age, egyptTeam, opponent, date, teamLookup } = {}) {
    if (teamLookup) {
        return suggestEgyptNtMatchId({ age, egyptTeam, opponent, date, teamLookup });
    }
    return buildEgyptNtMatchIdStem({ age, egyptTeam, opponent, date });
}

/** @deprecated Use buildEgyptNtMatchId — kept for existing imports. */
export function suggestNextEgyptNtMatchId({ age, egyptTeam, opponent, date }) {
    return buildEgyptNtMatchId({ age, egyptTeam, opponent, date });
}

export async function fetchMatchIdExists(supabase, tableName, matchId) {
    const normalized = normalizeMatchId(matchId);
    if (!normalized) return false;

    const { data, error } = await supabase
        .from(tableName)
        .select("MATCH_ID")
        .eq("MATCH_ID", normalized)
        .maybeSingle();

    if (error) throw error;
    return Boolean(data);
}
