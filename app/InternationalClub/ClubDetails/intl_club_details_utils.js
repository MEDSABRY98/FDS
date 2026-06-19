export function extractCountryFromTeamName(teamName) {
    const name = String(teamName ?? "").trim();
    if (!name) return "Unknown";
    const sep = " - ";
    const idx = name.lastIndexOf(sep);
    if (idx === -1) return "Unknown";
    const country = name.slice(idx + sep.length).trim();
    return country || "Unknown";
}

export function getClubMatches(matches, clubName) {
    return (matches || []).filter((m) => m["TEAM A"] === clubName || m["TEAM B"] === clubName);
}

export function getClubMatchPerspective(match, clubName) {
    const isTeamA = match["TEAM A"] === clubName;
    const dbWdl = match["W-D-L"];
    const dbGf = Number(match.GF) || 0;
    const dbGa = Number(match.GA) || 0;

    if (isTeamA) {
        return {
            opponent: match["TEAM B"] || "—",
            opponentContinent: String(match["TEAM B CONTINENT"] ?? "").trim() || "Unknown",
            gf: dbGf,
            ga: dbGa,
            wdl: dbWdl,
            han: match["H-A-N"] || "—",
        };
    }

    let wdl = dbWdl;
    if (dbWdl === "W") wdl = "L";
    else if (dbWdl === "L") wdl = "W";

    return {
        opponent: match["TEAM A"] || "—",
        opponentContinent: String(match["TEAM A CONTINENT"] ?? "").trim() || "Unknown",
        gf: dbGa,
        ga: dbGf,
        wdl,
        han: match["H-A-N"] || "—",
    };
}

function accumulateGroupedRow(map, key, perspective) {
    if (!key || key === "—") return;

    if (!map[key]) {
        map[key] = { name: key, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
    }

    const row = map[key];
    row.played++;
    row.gf += perspective.gf;
    row.ga += perspective.ga;
    if (perspective.wdl === "W") row.wins++;
    else if (perspective.wdl === "L") row.losses++;
    else if (perspective.wdl && String(perspective.wdl).startsWith("D")) row.draws++;
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

export function buildGroupedStats(matches, clubName, getGroupKey) {
    const map = {};

    getClubMatches(matches, clubName).forEach((m) => {
        const perspective = getClubMatchPerspective(m, clubName);
        const key = getGroupKey(perspective, m);
        accumulateGroupedRow(map, key, perspective);
    });

    return finalizeGroupedStats(map);
}

export function buildClubProfile(matches, clubName) {
    const clubMatches = getClubMatches(matches, clubName);
    const stats = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };

    clubMatches.forEach((m) => {
        const p = getClubMatchPerspective(m, clubName);
        stats.played++;
        stats.gf += p.gf;
        stats.ga += p.ga;
        if (p.wdl === "W") stats.wins++;
        else if (p.wdl === "L") stats.losses++;
        else if (p.wdl && String(p.wdl).startsWith("D")) stats.draws++;
    });

    return {
        name: clubName,
        ...stats,
        gd: stats.gf - stats.ga,
        winRate: stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0,
        matches: clubMatches,
    };
}

export function buildOpponentStats(matches, clubName) {
    return buildGroupedStats(matches, clubName, (p) => p.opponent);
}

export function buildCountryStats(matches, clubName) {
    return buildGroupedStats(matches, clubName, (p) => extractCountryFromTeamName(p.opponent));
}

export function buildContinentStats(matches, clubName) {
    return buildGroupedStats(matches, clubName, (p) => p.opponentContinent);
}
