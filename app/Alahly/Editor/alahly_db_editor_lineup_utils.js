import { applyLineupLogic } from "../../Database";
import { EMPTY_LINEUP } from "./alahly_db_editor_constants";

export const resolveAhlyTeam = (formData = {}) => String(formData["AHLY TEAM"] || "").trim() || "الأهلي";
export const resolveOpponentTeam = (formData = {}) => String(formData["OPPONENT TEAM"] || "").trim();

export function isDefaultAhlyTeamName(name) {
    const team = String(name || "").trim();
    return team === "الأهلي" || team === "الأهلى";
}

export function formDataHasCustomAhlyTeam(ahlyTeam) {
    return ahlyTeam && !isDefaultAhlyTeamName(ahlyTeam);
}

/** Use TEAM values already stored in lineup rows — not the live form field mid-typing. */
export function inferLineupTeamsFromRows(allRows, formData = {}) {
    const formAhly = resolveAhlyTeam(formData);
    const formOpp = resolveOpponentTeam(formData);

    const distinctTeams = [...new Set(
        allRows.map((row) => String(row?.TEAM || "").trim()).filter(Boolean)
    )];

    if (distinctTeams.length === 0) {
        return { ahlyTeam: formAhly, oppTeam: formOpp };
    }

    let ahlyTeam = formAhly;
    if (distinctTeams.includes(formAhly)) {
        ahlyTeam = formAhly;
    } else {
        ahlyTeam =
            distinctTeams.find(isDefaultAhlyTeamName) ||
            distinctTeams.find((team) => !formOpp || team !== formOpp) ||
            distinctTeams[0] ||
            formAhly;
    }

    let oppTeam = formOpp;
    if (formOpp && distinctTeams.includes(formOpp)) {
        oppTeam = formOpp;
    } else if (distinctTeams.length === 2) {
        oppTeam = distinctTeams.find((team) => team !== ahlyTeam) || formOpp;
    } else if (formOpp) {
        oppTeam = distinctTeams.find((team) => team === formOpp) || formOpp;
    }

    return { ahlyTeam, oppTeam };
}

/** On save, write AHLY TEAM / OPPONENT TEAM from match details into lineup TEAM column. */
export function applyMatchTeamsToLineupRows(allRows, formData = {}) {
    const formAhly = resolveAhlyTeam(formData);
    const formOpp = resolveOpponentTeam(formData);
    const { ahlyTeam: rowAhly, oppTeam: rowOpp } = inferLineupTeamsFromRows(allRows, formData);

    return allRows.map((row) => {
        if (isLineupForAhly(row, rowAhly, rowOpp)) {
            const needsSync = String(row.TEAM || "").trim() !== formAhly;
            return {
                ...row,
                TEAM: formAhly,
                _isDirty: Boolean(row._isDirty || row._isNew || needsSync),
            };
        }
        if (formOpp && isLineupForOpponent(row, rowOpp, rowAhly)) {
            const needsSync = String(row.TEAM || "").trim() !== formOpp;
            return {
                ...row,
                TEAM: formOpp,
                _isDirty: Boolean(row._isDirty || row._isNew || needsSync),
            };
        }
        return row;
    });
}

export function isLineupForAhly(row, ahlyTeam, oppTeam = "") {
    const team = String(row?.TEAM || "").trim();
    if (!team) return true;

    const opponent = String(oppTeam || "").trim();
    if (opponent && team === opponent) return false;
    if (team === ahlyTeam) return true;
    if (isDefaultAhlyTeamName(team) && (isDefaultAhlyTeamName(ahlyTeam) || !formDataHasCustomAhlyTeam(ahlyTeam))) {
        return true;
    }
    return false;
}

export function isLineupForOpponent(row, opponentTeam, ahlyTeam) {
    const team = String(row?.TEAM || "").trim();
    if (!opponentTeam || !team) return false;
    if (team === opponentTeam) return true;
    if (isLineupForAhly(row, ahlyTeam, opponentTeam)) return false;
    return false;
}

export function createInitialTeamLineup(matchId, teamName, count = 16) {
    const baseKey = Date.now();
    return Array.from({ length: count }, (_, i) => ({
        ...EMPTY_LINEUP,
        "MATCH MINUTE": "90",
        TEAM: teamName,
        STATU: i < 11 ? "اساسي" : "احتياطي",
        "TOTAL MINUTE": i < 11 ? "90" : "",
        MATCH_ID: matchId || "",
        _isNew: true,
        _key: `lineup-${baseKey}-${teamName}-${i}`,
    }));
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

export function normalizeSavedMatchLineup(allRows, matchId, matchInfo = {}) {
    const formAhly = resolveAhlyTeam(matchInfo);
    const formOpp = resolveOpponentTeam(matchInfo);
    const { ahlyTeam: rowAhly, oppTeam: rowOpp } = inferLineupTeamsFromRows(allRows, matchInfo);

    const ahlySaved = allRows.filter((row) => isLineupForAhly(row, rowAhly, rowOpp));
    const oppSaved = formOpp
        ? allRows.filter((row) => isLineupForOpponent(row, rowOpp, rowAhly))
        : [];

    const ahlyNorm = normalizeSavedTeamLineup(ahlySaved, matchId, formAhly);
    const oppNorm = formOpp ? normalizeSavedTeamLineup(oppSaved, matchId, formOpp) : [];

    const combined = [...ahlyNorm, ...oppNorm];
    return applyLineupLogic(combined, combined);
}

export function mergeTeamLineupUpdate(allRows, teamFilter, teamAction, applyLogic) {
    const others = allRows.filter((r) => !teamFilter(r));
    const teamPrev = allRows.filter(teamFilter);
    const teamNext = typeof teamAction === "function" ? teamAction(teamPrev) : teamAction;
    const combinedNext = [...others, ...teamNext];
    return applyLogic(allRows, combinedNext);
}
