import { getIntNtTeamOutcome } from "../Service/int_nt_service";

export function getTeamMatches(matches, teamName) {
    return (matches || []).filter((m) => m.TEAMA === teamName || m.TEAMB === teamName);
}

export function getTeamMatchPerspective(match, teamName) {
    const isTeamA = match.TEAMA === teamName;
    const dbGf = Number(match.TEAMASCORE) || 0;
    const dbGa = Number(match.TEAMBSCORE) || 0;
    const outcome = getIntNtTeamOutcome(match, teamName);

    if (isTeamA) {
        return {
            opponent: match.TEAMB || "—",
            opponentContinent: String(match["TEAMB CONTINENT"] ?? "").trim() || "Unknown",
            hostCountry: String(match["HOST COUNTRY"] ?? "").trim() || "Unknown",
            gf: dbGf,
            ga: dbGa,
            outcome,
            winner: match["W-D-L"] || "—",
            pen: match["PEN DISPLAY"] || "",
        };
    }

    return {
        opponent: match.TEAMA || "—",
        opponentContinent: String(match["TEAMA CONTINENT"] ?? "").trim() || "Unknown",
        hostCountry: String(match["HOST COUNTRY"] ?? "").trim() || "Unknown",
        gf: dbGa,
        ga: dbGf,
        outcome,
        winner: match["W-D-L"] || "—",
        pen: match["PEN DISPLAY"] || "",
    };
}

function accumulateGroupedRow(map, key, perspective) {
    if (!key || key === "—" || key === "Unknown") return;
    if (!map[key]) map[key] = { name: key, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
    const row = map[key];
    row.played++;
    row.gf += perspective.gf;
    row.ga += perspective.ga;
    const outcome = perspective.outcome;
    if (outcome === "W") row.wins++;
    else if (outcome === "L") row.losses++;
    else if (outcome && String(outcome).startsWith("D")) row.draws++;
}

function finalizeGroupedStats(map) {
    return Object.values(map)
        .map((row) => ({
            ...row,
            gd: row.gf - row.ga,
            winRate: row.played > 0 ? Math.round((row.wins / row.played) * 100) : 0,
        }))
        .sort((a, b) => b.played - a.played || b.wins - a.wins || String(a.name).localeCompare(String(b.name), "ar"));
}

export function buildGroupedStats(matches, teamName, getGroupKey) {
    const map = {};
    getTeamMatches(matches, teamName).forEach((m) => {
        const perspective = getTeamMatchPerspective(m, teamName);
        accumulateGroupedRow(map, getGroupKey(perspective, m), perspective);
    });
    return finalizeGroupedStats(map);
}

export function buildTeamProfile(matches, teamName) {
    const teamMatches = getTeamMatches(matches, teamName);
    const stats = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };

    teamMatches.forEach((m) => {
        const p = getTeamMatchPerspective(m, teamName);
        stats.played++;
        stats.gf += p.gf;
        stats.ga += p.ga;
        if (p.outcome === "W") stats.wins++;
        else if (p.outcome === "L") stats.losses++;
        else if (p.outcome && String(p.outcome).startsWith("D")) stats.draws++;
    });

    return {
        name: teamName,
        ...stats,
        gd: stats.gf - stats.ga,
        winRate: stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0,
        matches: teamMatches,
    };
}

export function buildOpponentStats(matches, teamName) {
    return buildGroupedStats(matches, teamName, (p) => p.opponent);
}

export function buildHostCountryStats(matches, teamName) {
    return buildGroupedStats(matches, teamName, (p) => p.hostCountry);
}

export function buildContinentStats(matches, teamName) {
    return buildGroupedStats(matches, teamName, (p) => p.opponentContinent);
}
