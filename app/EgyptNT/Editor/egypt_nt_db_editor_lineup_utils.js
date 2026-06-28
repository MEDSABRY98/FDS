import { EMPTY_LINEUP } from "./egypt_nt_db_editor_constants";

export const normalizeTeamName = (value) => String(value || "").trim().toLowerCase();

export const getDefaultEgyptTeamLabel = (matchInfo = {}) => (
    String(matchInfo["Egypt TEAM"] || matchInfo["EGYPT TEAM"] || "EGYPT").trim() || "EGYPT"
);

export const getOpponentTeamLabel = (matchInfo = {}) => (
    String(matchInfo["OPPONENT TEAM"] || "").trim() || "OPPONENT"
);

export const EGYPT_TEAM_ALIASES = new Set([
    "egypt",
    "مصر",
    "منتخب مصر",
    "المنتخب المصري",
]);

export function isEgyptTeamAlias(teamValue) {
    return EGYPT_TEAM_ALIASES.has(normalizeTeamName(teamValue));
}

/** Classify lineup rows using stored TEAM values, not mid-typing form fields. */
export function inferLineupTeamsFromRows(rows = [], matchInfo = {}) {
    const formEgypt = getDefaultEgyptTeamLabel(matchInfo);
    const formOpp = String(matchInfo["OPPONENT TEAM"] || "").trim();

    const distinctTeams = [...new Set(
        rows.map((row) => String(row?.TEAM || "").trim()).filter(Boolean)
    )];

    if (distinctTeams.length === 0) {
        return { egyptTeam: formEgypt, oppTeam: formOpp };
    }

    let egyptTeam = distinctTeams.find((team) => normalizeTeamName(team) === normalizeTeamName(formEgypt))
        || distinctTeams.find(isEgyptTeamAlias)
        || formEgypt;

    let oppTeam = formOpp && distinctTeams.find((team) => normalizeTeamName(team) === normalizeTeamName(formOpp))
        ? formOpp
        : "";

    if (!oppTeam && distinctTeams.length === 2) {
        oppTeam = distinctTeams.find((team) => normalizeTeamName(team) !== normalizeTeamName(egyptTeam)) || formOpp;
    } else if (!oppTeam) {
        oppTeam = formOpp;
    }

    return { egyptTeam, oppTeam };
}

export function applyMatchTeamsToEgyptLineupRows(egyRows = [], oppRows = [], formData = {}) {
    const egyptTeam = getDefaultEgyptTeamLabel(formData);
    const opponentTeam = getOpponentTeamLabel(formData);

    const syncedEgy = egyRows.map((row) => {
        const needsSync = String(row.TEAM || "").trim() !== egyptTeam;
        return {
            ...row,
            TEAM: egyptTeam,
            _isDirty: Boolean(row._isDirty || row._isNew || needsSync),
        };
    });

    const syncedOpp = oppRows.map((row) => {
        const needsSync = String(row.TEAM || "").trim() !== opponentTeam;
        return {
            ...row,
            TEAM: opponentTeam,
            _isDirty: Boolean(row._isDirty || row._isNew || needsSync),
        };
    });

    return { syncedEgy, syncedOpp };
}

export const buildLineupTeamResolver = (matchInfo = {}, rows = []) => {
    const inferred = inferLineupTeamsFromRows(rows, matchInfo);
    const egyptTeamName = inferred.egyptTeam;
    const opponentTeamName = inferred.oppTeam;

    const egyptIdentifiers = new Set([
        "egypt",
        "مصر",
        "منتخب مصر",
        "المنتخب المصري",
        normalizeTeamName(egyptTeamName),
    ].filter(Boolean));

    const resolveLineupTeamSide = (teamValue) => {
        const name = String(teamValue || "").trim();
        if (!name) return null;

        const normalizedName = normalizeTeamName(name);
        if (opponentTeamName && normalizedName === normalizeTeamName(opponentTeamName)) return "opponent";
        if (normalizedName === "opponent" && opponentTeamName) return "opponent";
        if (egyptIdentifiers.has(normalizedName) || isEgyptTeamAlias(name)) return "egypt";
        if (opponentTeamName && normalizedName !== normalizeTeamName(opponentTeamName)) return "egypt";
        return null;
    };

    return {
        egyptTeamName,
        opponentTeamName,
        isEgyptLineupTeam: (teamValue) => resolveLineupTeamSide(teamValue) === "egypt",
        isOpponentLineupTeam: (teamValue) => resolveLineupTeamSide(teamValue) === "opponent",
        resolveLineupTeamSide,
    };
};

export const splitLineupRowsByTeam = (rows = [], matchInfo = {}) => {
    const { resolveLineupTeamSide } = buildLineupTeamResolver(matchInfo, rows);
    const egy = [];
    const opp = [];

    rows.forEach((row) => {
        const side = resolveLineupTeamSide(row?.TEAM);
        if (side === "egypt") {
            egy.push(row);
        } else if (side === "opponent") {
            opp.push(row);
        } else {
            opp.push(row);
        }
    });

    return { egy, opp };
};

export function findRowIndexInList(list, row, fallbackIndex) {
    if (row?._key != null) {
        const byKey = list.findIndex((r) => r._key === row._key);
        if (byKey >= 0) return byKey;
    }
    if (row?.ROW_ID) {
        const byRowId = list.findIndex((r) => r.ROW_ID === row.ROW_ID);
        if (byRowId >= 0) return byRowId;
    }
    return fallbackIndex;
}

export function isLineupPlayerRowFilled(row) {
    return String(row?.["PLAYER NAME"] || "").trim() !== "";
}

export function createEmptyStarterSlot(matchId, teamName, index, matchMinute = "90", baseKey = Date.now()) {
    return {
        ...EMPTY_LINEUP,
        "MATCH MINUTE": matchMinute,
        TEAM: teamName,
        STATU: "اساسي",
        "TOTAL MINUTE": matchMinute,
        MATCH_ID: matchId || "",
        _isNew: true,
        _key: `lineup-slot-${baseKey}-${teamName}-s-${index}`,
    };
}

export function normalizeSavedTeamLineup(teamRows, matchId, teamName) {
    const baseKey = Date.now();
    const matchMinute = String(teamRows.find((r) => r["MATCH MINUTE"])?.["MATCH MINUTE"] || "90").trim() || "90";

    const sorted = [...teamRows].sort((a, b) => {
        const rowIdA = String(a?.ROW_ID || "");
        const rowIdB = String(b?.ROW_ID || "");
        if (!rowIdA && !rowIdB) return 0;
        if (!rowIdA) return 1;
        if (!rowIdB) return -1;
        return rowIdA.localeCompare(rowIdB, undefined, { numeric: true });
    });

    const starters = sorted.filter((r) => String(r.STATU || "").trim() === "اساسي");
    const bench = sorted.filter((r) => String(r.STATU || "").trim() === "احتياطي");
    const other = sorted.filter((r) => {
        const status = String(r.STATU || "").trim();
        return status !== "اساسي" && status !== "احتياطي";
    });

    other.forEach((row) => {
        if (!isLineupPlayerRowFilled(row)) return;
        if (starters.length < 11) {
            starters.push({ ...row, STATU: "اساسي" });
        } else {
            bench.push({ ...row, STATU: "احتياطي" });
        }
    });

    while (starters.length > 11) {
        const extra = starters.pop();
        if (isLineupPlayerRowFilled(extra)) {
            bench.unshift({ ...extra, STATU: "احتياطي" });
        }
    }

    while (starters.length < 11) {
        starters.push(createEmptyStarterSlot(matchId, teamName, starters.length, matchMinute, baseKey));
    }

    const filledBench = bench.filter(isLineupPlayerRowFilled);

    return [...starters, ...filledBench].map((row, index) => ({
        ...row,
        TEAM: teamName,
        MATCH_ID: matchId || row.MATCH_ID || "",
        _key: row._key ?? `lineup-loaded-${baseKey}-${teamName}-${index}`,
    }));
}