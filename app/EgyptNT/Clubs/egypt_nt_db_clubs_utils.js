function normalizeTeamLabel(value) {
    return String(value || "").trim().toLowerCase();
}

const CLUB_COUNTRY_SEPARATOR = " - ";
const UNKNOWN_COUNTRY = "Unknown";

export const GROUPING_MODES = {
    CLUB: "club",
    COUNTRY: "country"
};

/** Parse "الأهلي - مصر" => { full, name, country } */
export function parseClubLabel(clubRaw) {
    const full = String(clubRaw || "").trim();
    if (!full) {
        return { full: "", name: "", country: UNKNOWN_COUNTRY };
    }

    const sepIndex = full.lastIndexOf(CLUB_COUNTRY_SEPARATOR);
    if (sepIndex === -1) {
        return { full, name: full, country: UNKNOWN_COUNTRY };
    }

    const name = full.slice(0, sepIndex).trim();
    const country = full.slice(sepIndex + CLUB_COUNTRY_SEPARATOR.length).trim() || UNKNOWN_COUNTRY;
    return { full, name: name || full, country };
}

export function getGroupKey(clubRaw, groupingMode = GROUPING_MODES.CLUB) {
    const parsed = parseClubLabel(clubRaw);
    if (!parsed.full) return "";
    return groupingMode === GROUPING_MODES.COUNTRY ? parsed.country : parsed.full;
}

export function clubsMatchGroup(clubRaw, selectedKey, groupingMode = GROUPING_MODES.CLUB) {
    const key = String(selectedKey || "").trim();
    if (!key) return false;
    return getGroupKey(clubRaw, groupingMode) === key;
}

export function getGroupColumnLabel(groupingMode = GROUPING_MODES.CLUB) {
    return groupingMode === GROUPING_MODES.COUNTRY ? "COUNTRY" : "CLUB NAME";
}

export function getGroupDetailTitle(groupingMode = GROUPING_MODES.CLUB) {
    return groupingMode === GROUPING_MODES.COUNTRY ? "COUNTRY" : "CLUB";
}

export function isEgyptScorerEvent(row, matchContext = {}) {
    const team = String(row?.TEAM || "").trim();
    if (!team) return false;

    const opponentTeam = String(matchContext.opponent || "").trim();
    const egyptTeamName = String(matchContext.egyptTeam || "منتخب مصر").trim();
    const normalizedTeam = normalizeTeamLabel(team);

    if (normalizedTeam === "opponent" && opponentTeam) return false;
    if (opponentTeam && normalizedTeam === normalizeTeamLabel(opponentTeam)) return false;

    const egyptIdentifiers = new Set(
        ["مصر", "egypt", "منتخب مصر", "المنتخب المصري", egyptTeamName]
            .filter(Boolean)
            .map(normalizeTeamLabel)
    );

    return egyptIdentifiers.has(normalizedTeam);
}

export function buildMatchContextMap(matches) {
    const map = {};
    (matches || []).forEach(match => {
        const matchId = String(match.MATCH_ID || "").trim();
        if (!matchId) return;

        map[matchId] = {
            matchId,
            date: String(match.DATE || "").trim(),
            opponent: String(match["OPPONENT TEAM"] || "").trim(),
            egyptTeam: String(match["Egypt TEAM"] || match["EGYPT TEAM"] || "منتخب مصر").trim(),
            champion: String(match.CHAMPION || "Unknown").trim(),
            season: String(match.SEASON || "").trim(),
            age: String(match.AGE || "Unknown").trim(),
        };
    });
    return map;
}

function isOwnGoal(type, subType) {
    const goalType = String(type || "").trim().toUpperCase();
    const goalSubType = String(subType || "").trim().toUpperCase();
    return goalType === "OG" || goalSubType === "OG";
}

function isCountablePlayerGoal(type, subType) {
    if (isOwnGoal(type, subType)) return false;

    const goalType = String(type || "").trim();
    const goalSubType = String(subType || "").trim();
    return goalType === "GOAL" || goalType === "هدف" || goalSubType === "PENGOAL" || goalSubType === "هدف جزاء";
}

function isAssist(type) {
    const goalType = String(type || "").trim();
    return goalType === "ASSIST" || goalType === "اسيست" || goalType === "صنع";
}

function isPenGoal(subType) {
    const sub = String(subType || "").trim();
    return sub === "PENGOAL" || sub === "هدف جزاء";
}

function getEventTypeLabel(type, subType, isGoal, isAssistEvent) {
    const goalType = String(type || "").trim();
    const goalSubType = String(subType || "").trim();

    if (isAssistEvent) {
        return goalType === "صنع" ? "صنع" : goalType === "اسيست" ? "Assist" : "Assist";
    }

    if (isGoal) {
        if (isPenGoal(goalSubType)) return "Penalty Goal";
        if (goalType === "هدف") return "هدف";
        return "Goal";
    }

    return goalType || "—";
}

function parseEventMinute(minute) {
    const raw = String(minute || "").trim();
    if (!raw || raw === "—") return Number.MAX_SAFE_INTEGER;
    const base = parseInt(raw.split("+")[0], 10);
    return Number.isNaN(base) ? Number.MAX_SAFE_INTEGER : base;
}

function compareEvents(a, b) {
    const minuteDiff = parseEventMinute(a.minute) - parseEventMinute(b.minute);
    if (minuteDiff !== 0) return minuteDiff;
    if (a.kind === b.kind) return a.player.localeCompare(b.player);
    return a.kind === "goal" ? -1 : 1;
}

function compareDates(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
}

export function parseSeasonParts(season) {
    const raw = String(season || "").trim();
    if (!raw) return { text: "", number: 0, raw };

    const numberMatch = raw.match(/\d+/);
    const number = numberMatch ? parseInt(numberMatch[0], 10) : 0;
    const text = raw
        .replace(/\d+/g, " ")
        .replace(/[/\-–—|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    return { text, number, raw };
}

export function compareSeasonStatsRows(a, b) {
    const partA = parseSeasonParts(a.name);
    const partB = parseSeasonParts(b.name);

    const textCmp = partA.text.localeCompare(partB.text, undefined, { sensitivity: "base" });
    if (textCmp !== 0) return textCmp;

    if (partA.number !== partB.number) return partB.number - partA.number;

    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.ga !== a.ga) return b.ga - a.ga;

    return a.name.localeCompare(b.name, undefined, { numeric: true });
}

function processScoringEvents(playerDetails, matchContextMap, groupingMode = GROUPING_MODES.CLUB) {
    const clubs = {};
    const playerClubs = {};

    (playerDetails || []).forEach(row => {
        const matchId = String(row.MATCH_ID || "").trim();
        const ctx = matchContextMap[matchId];
        if (!ctx) return;

        if (!isEgyptScorerEvent(row, ctx)) return;

        const clubRaw = String(row.CLUB || "").trim();
        if (!clubRaw) return;

        const groupKey = getGroupKey(clubRaw, groupingMode);
        if (!groupKey) return;

        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName || playerName.toLowerCase() === "unknown") return;

        const type = String(row.TYPE || "").trim();
        const subType = String(row.TYPE_SUB || "").trim();
        const isGoal = isCountablePlayerGoal(type, subType);
        const isAssistEvent = isAssist(type);

        if (!isGoal && !isAssistEvent) return;

        if (!clubs[groupKey]) {
            clubs[groupKey] = {
                club: groupKey,
                scorers: new Set(),
                contributors: new Set(),
                goals: 0,
                assists: 0,
                penGoals: 0,
                firstDate: null,
                lastDate: null,
                championships: new Set()
            };
        }

        const clubEntry = clubs[groupKey];
        clubEntry.contributors.add(playerName);
        if (isGoal) clubEntry.scorers.add(playerName);
        if (isGoal) clubEntry.goals += 1;
        if (isAssistEvent) clubEntry.assists += 1;
        if (isGoal && isPenGoal(subType)) clubEntry.penGoals += 1;
        if (ctx.champion) clubEntry.championships.add(ctx.champion);

        if (ctx.date) {
            if (!clubEntry.firstDate || compareDates(ctx.date, clubEntry.firstDate) < 0) {
                clubEntry.firstDate = ctx.date;
            }
            if (!clubEntry.lastDate || compareDates(ctx.date, clubEntry.lastDate) > 0) {
                clubEntry.lastDate = ctx.date;
            }
        }

        const playerClubKey = `${playerName}|${groupKey}`;
        if (!playerClubs[playerClubKey]) {
            playerClubs[playerClubKey] = {
                player: playerName,
                club: groupKey,
                goals: 0,
                assists: 0,
                penGoals: 0
            };
        }

        const playerEntry = playerClubs[playerClubKey];
        if (isGoal) playerEntry.goals += 1;
        if (isAssistEvent) playerEntry.assists += 1;
        if (isGoal && isPenGoal(subType)) playerEntry.penGoals += 1;
    });

    return { clubs, playerClubs };
}

export function buildScoringClubStats(
    playerDetails,
    filteredMatches,
    groupingMode = GROUPING_MODES.CLUB,
    squadData = [],
    { lineupDetails = [], gkDetails = [] } = {}
) {
    const matchContextMap = buildMatchContextMap(filteredMatches);
    const { clubs } = processScoringEvents(playerDetails, matchContextMap, groupingMode);

    const matchData = {
        matches: filteredMatches,
        lineupDetails,
        playerDetails,
        gkDetails
    };

    const perfByClub = {};
    buildClubOnlyPerformance(squadData, matchData, groupingMode).forEach(row => {
        perfByClub[row.club] = row.ntStats;
    });

    const seasonCountByClub = {};
    (squadData || []).forEach(item => {
        const clubRaw = String(item.CLUB || "").trim();
        if (!clubRaw) return;

        const groupKey = getGroupKey(clubRaw, groupingMode);
        if (!groupKey) return;

        if (!seasonCountByClub[groupKey]) seasonCountByClub[groupKey] = new Set();

        const season = String(item.SEASON || "").trim();
        if (season) seasonCountByClub[groupKey].add(season);
    });

    return Object.values(clubs)
        .map(entry => {
            const perf = perfByClub[entry.club];
            return {
                club: entry.club,
                scorersCount: entry.scorers.size,
                contributorsCount: entry.contributors.size,
                goals: entry.goals,
                assists: entry.assists,
                penGoals: entry.penGoals,
                ga: entry.goals + entry.assists,
                championshipCount: entry.championships.size,
                seasonCount: seasonCountByClub[entry.club]?.size || 0,
                matchCount: perf?.mp || 0,
                minutes: perf?.mins || 0
            };
        })
        .sort((a, b) =>
            b.goals - a.goals ||
            b.assists - a.assists ||
            a.club.localeCompare(b.club)
        );
}

export function buildPlayerClubStats(playerDetails, filteredMatches, groupingMode = GROUPING_MODES.CLUB) {
    const matchContextMap = buildMatchContextMap(filteredMatches);
    const { playerClubs } = processScoringEvents(playerDetails, matchContextMap, groupingMode);

    return Object.values(playerClubs)
        .map(entry => ({
            ...entry,
            ga: entry.goals + entry.assists
        }))
        .sort((a, b) =>
            b.goals - a.goals ||
            b.assists - a.assists ||
            a.club.localeCompare(b.club) ||
            a.player.localeCompare(b.player)
        );
}

function buildSquadPlayerSeasonClubLookup(squadData) {
    const lookup = {};
    (squadData || []).forEach(item => {
        const playerName = String(item.PLAYERNAME || "").trim();
        const club = String(item.CLUB || "").trim();
        const season = String(item.SEASON || "").trim();
        if (!playerName || !club || !season) return;
        const key = `${playerName}|${season}`;
        if (!lookup[key]) lookup[key] = new Set();
        lookup[key].add(club);
    });
    return lookup;
}

function isPlayerInSquadGroupForSeason(squadLookup, playerName, season, groupKey, groupingMode = GROUPING_MODES.CLUB) {
    const key = `${String(playerName || "").trim()}|${String(season || "").trim()}`;
    const clubs = squadLookup[key];
    if (!clubs) return false;

    if (groupingMode === GROUPING_MODES.COUNTRY) {
        for (const club of clubs) {
            if (getGroupKey(club, GROUPING_MODES.COUNTRY) === groupKey) return true;
        }
        return false;
    }

    return clubs.has(groupKey);
}

/** Goals: event CLUB when set, else squad club. Assists: event CLUB or squad club. */
function isScoringEventAttributedToGroup(row, playerName, ctx, groupKey, squadLookup, isGoal, isAssistEvent, groupingMode = GROUPING_MODES.CLUB) {
    const eventClub = String(row.CLUB || "").trim();
    const season = ctx.season || "Unknown";
    const inSquad = isPlayerInSquadGroupForSeason(squadLookup, playerName, season, groupKey, groupingMode);

    if (groupingMode === GROUPING_MODES.COUNTRY) {
        const eventGroup = eventClub ? getGroupKey(eventClub, GROUPING_MODES.COUNTRY) : "";
        if (isGoal) {
            if (eventClub) return eventGroup === groupKey;
            return inSquad;
        }
        if (isAssistEvent) {
            if (eventGroup === groupKey) return true;
            return inSquad;
        }
        return false;
    }

    if (isGoal) {
        if (eventClub) return eventClub === groupKey;
        return inSquad;
    }
    if (isAssistEvent) {
        if (eventClub === groupKey) return true;
        return inSquad;
    }
    return false;
}

export function buildScoringClubDetailStats(groupKey, playerDetails, filteredMatches, squadData = [], groupingMode = GROUPING_MODES.CLUB) {
    const matchContextMap = buildMatchContextMap(filteredMatches);
    const normalizedKey = String(groupKey || "").trim();
    const squadLookup = buildSquadPlayerSeasonClubLookup(squadData);

    const playerMap = {};
    const matchMap = {};
    const championMap = {};
    const opponentMap = {};
    const seasonMap = {};

    let goals = 0;
    let assists = 0;
    let penGoals = 0;
    const scorers = new Set();
    let firstDate = null;
    let lastDate = null;

    (playerDetails || []).forEach(row => {
        const matchId = String(row.MATCH_ID || "").trim();
        const ctx = matchContextMap[matchId];
        if (!ctx) return;

        if (!isEgyptScorerEvent(row, ctx)) return;

        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName || playerName.toLowerCase() === "unknown") return;

        const type = String(row.TYPE || "").trim();
        const subType = String(row.TYPE_SUB || "").trim();
        const isGoal = isCountablePlayerGoal(type, subType);
        const isAssistEvent = isAssist(type);

        if (!isGoal && !isAssistEvent) return;

        if (!isScoringEventAttributedToGroup(row, playerName, ctx, normalizedKey, squadLookup, isGoal, isAssistEvent, groupingMode)) {
            return;
        }

        if (isGoal) {
            goals += 1;
            scorers.add(playerName);
        }
        if (isAssistEvent) assists += 1;
        if (isGoal && isPenGoal(subType)) penGoals += 1;

        if (ctx.date) {
            if (!firstDate || compareDates(ctx.date, firstDate) < 0) firstDate = ctx.date;
            if (!lastDate || compareDates(ctx.date, lastDate) > 0) lastDate = ctx.date;
        }

        if (!playerMap[playerName]) {
            playerMap[playerName] = { name: playerName, goals: 0, assists: 0, penGoals: 0 };
        }
        if (isGoal) playerMap[playerName].goals += 1;
        if (isAssistEvent) playerMap[playerName].assists += 1;
        if (isGoal && isPenGoal(subType)) playerMap[playerName].penGoals += 1;

        if (!matchMap[matchId]) {
            matchMap[matchId] = {
                matchId,
                date: ctx.date,
                opponent: ctx.opponent,
                champion: ctx.champion,
                season: ctx.season,
                goals: 0,
                assists: 0,
                events: []
            };
        }

        const matchEntry = matchMap[matchId];
        if (isGoal) matchEntry.goals += 1;
        if (isAssistEvent) matchEntry.assists += 1;
        matchEntry.events.push({
            player: playerName,
            kind: isGoal ? "goal" : "assist",
            minute: String(row.MINUTE || "").trim() || "—",
            typeLabel: getEventTypeLabel(type, subType, isGoal, isAssistEvent),
            rawType: type,
            subType: subType || "—"
        });

        const champKey = ctx.champion || "Unknown";
        if (!championMap[champKey]) {
            championMap[champKey] = {
                name: champKey,
                goals: 0,
                assists: 0,
                players: new Set()
            };
        }
        const champEntry = championMap[champKey];
        if (isGoal) champEntry.goals += 1;
        if (isAssistEvent) champEntry.assists += 1;
        champEntry.players.add(playerName);

        const seasonKey = ctx.season || "Unknown";
        if (!seasonMap[seasonKey]) {
            seasonMap[seasonKey] = {
                name: seasonKey,
                matchIds: new Set(),
                goals: 0,
                assists: 0,
                penGoals: 0,
                players: new Set(),
                champions: new Set()
            };
        }
        const seasonEntry = seasonMap[seasonKey];
        seasonEntry.matchIds.add(matchId);
        if (isGoal) seasonEntry.goals += 1;
        if (isAssistEvent) seasonEntry.assists += 1;
        if (isGoal && isPenGoal(subType)) seasonEntry.penGoals += 1;
        seasonEntry.players.add(playerName);
        if (ctx.champion) seasonEntry.champions.add(ctx.champion);

        const opponentKey = ctx.opponent || "Unknown";
        if (!opponentMap[opponentKey]) {
            opponentMap[opponentKey] = {
                name: opponentKey,
                matchIds: new Set(),
                goals: 0,
                assists: 0,
                penGoals: 0,
                players: new Set()
            };
        }
        const opponentEntry = opponentMap[opponentKey];
        opponentEntry.matchIds.add(matchId);
        if (isGoal) opponentEntry.goals += 1;
        if (isAssistEvent) opponentEntry.assists += 1;
        if (isGoal && isPenGoal(subType)) opponentEntry.penGoals += 1;
        opponentEntry.players.add(playerName);
    });

    const players = Object.values(playerMap)
        .map(p => ({ ...p, ga: p.goals + p.assists }))
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name));

    const matches = Object.values(matchMap)
        .map(match => ({
            ...match,
            events: [...(match.events || [])].sort(compareEvents)
        }))
        .sort((a, b) => compareDates(b.date, a.date) || a.opponent.localeCompare(b.opponent));

    const championships = Object.values(championMap)
        .map(c => ({
            name: c.name,
            goals: c.goals,
            assists: c.assists,
            ga: c.goals + c.assists,
            playerCount: c.players.size
        }))
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name));

    const vsTeams = Object.values(opponentMap)
        .map(entry => ({
            name: entry.name,
            matches: entry.matchIds.size,
            goals: entry.goals,
            assists: entry.assists,
            penGoals: entry.penGoals,
            ga: entry.goals + entry.assists,
            playerCount: entry.players.size
        }))
        .sort((a, b) =>
            b.goals - a.goals ||
            b.assists - a.assists ||
            b.matches - a.matches ||
            a.name.localeCompare(b.name)
        );

    const seasons = Object.values(seasonMap)
        .map(entry => ({
            name: entry.name,
            matches: entry.matchIds.size,
            goals: entry.goals,
            assists: entry.assists,
            penGoals: entry.penGoals,
            ga: entry.goals + entry.assists,
            playerCount: entry.players.size,
            championCount: entry.champions.size
        }))
        .sort(compareSeasonStatsRows);

    const topScorer = players.length > 0
        ? players.reduce((best, p) => (p.goals > best.goals ? p : best), players[0])
        : null;

    return {
        club: normalizedKey,
        groupingMode,
        goals,
        assists,
        penGoals,
        ga: goals + assists,
        scorersCount: scorers.size,
        contributorsCount: players.length,
        firstDate,
        lastDate,
        championshipCount: championships.length,
        matchCount: matches.length,
        players,
        matches,
        championships,
        vsTeams,
        seasons,
        highlights: {
            topScorer,
            firstDate,
            lastDate
        }
    };
}

// Squad callup stats helpers
const isEgyptTeam = (team) => {
    if (!team) return false;
    const value = String(team).trim();
    return value === "مصر" || value === "Egypt" || value === "منتخب مصر" || value === "المنتخب المصري";
};

export function isGkPosition(position) {
    const value = String(position || "").trim().toLowerCase();
    return value.includes("gk") || value.includes("goalkeeper") || value.includes("حارس") || value.includes("حراس");
}

function emptySeasonStats() {
    return { mp: 0, mins: 0, goals: 0, assists: 0, ga: 0, cs: 0, gkCaps: 0 };
}

function getSeasonStatsKey(playerName, season) {
    return `${String(playerName || "").trim()}|${String(season || "").trim()}`;
}

let cachedSeasonStatsMap = null;
let lastCacheKey = null;

function buildCacheKey(matches, lineupDetails, playerDetails, gkDetails) {
    return `${(matches || []).length}|${(lineupDetails || []).length}|${(playerDetails || []).length}|${(gkDetails || []).length}`;
}

export function buildPlayerSeasonStatsMap(matches, lineupDetails, playerDetails, gkDetails) {
    const cacheKey = buildCacheKey(matches, lineupDetails, playerDetails, gkDetails);
    if (cachedSeasonStatsMap && cacheKey === lastCacheKey) {
        return cachedSeasonStatsMap;
    }

    const statsMap = {};
    const matchContextMap = {};
    const gkCountByMatchTeam = {};

    (gkDetails || []).forEach(row => {
        const matchId = String(row.MATCH_ID || "");
        const team = String(row.TEAM || "").trim();
        if (!matchId || !team) return;

        const teamKey = `${matchId}|${team}`;
        gkCountByMatchTeam[teamKey] = (gkCountByMatchTeam[teamKey] || 0) + 1;
    });

    (matches || []).forEach(match => {
        const matchId = String(match.MATCH_ID || "");
        if (!matchId) return;

        matchContextMap[matchId] = {
            season: String(match.SEASON || match["SEASON - NAME"] || "Unknown").trim(),
            gf: parseInt(match.GF || 0, 10) || 0,
            ga: parseInt(match.GA || 0, 10) || 0
        };
    });

    const getOrCreate = (playerName, season) => {
        const key = getSeasonStatsKey(playerName, season);
        if (!statsMap[key]) statsMap[key] = emptySeasonStats();
        return statsMap[key];
    };

    (lineupDetails || []).forEach(row => {
        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName) return;

        const ctx = matchContextMap[String(row.MATCH_ID || "")];
        if (!ctx || !ctx.season || ctx.season === "Unknown") return;

        const stats = getOrCreate(playerName, ctx.season);
        stats.mp += 1;
        stats.mins += parseInt(row["TOTAL MINUTE"] || 0, 10) || 0;
    });

    (playerDetails || []).forEach(row => {
        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName) return;

        const ctx = matchContextMap[String(row.MATCH_ID || "")];
        if (!ctx || !ctx.season || ctx.season === "Unknown") return;

        const stats = getOrCreate(playerName, ctx.season);
        const type = String(row.TYPE || "").trim();
        const subType = String(row.TYPE_SUB || "").trim();
        const isAssistEvent = type === "ASSIST" || type === "اسيست" || type === "صنع";

        if (isCountablePlayerGoal(type, subType)) stats.goals += 1;
        if (isAssistEvent) stats.assists += 1;
    });

    (gkDetails || []).forEach(row => {
        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName) return;

        const matchId = String(row.MATCH_ID || "");
        const ctx = matchContextMap[matchId];
        if (!ctx || !ctx.season || ctx.season === "Unknown") return;

        const stats = getOrCreate(playerName, ctx.season);
        const team = String(row.TEAM || "").trim();
        const goalsConceded = parseInt(row["GOALS CONCEDED"] || 0, 10) || 0;
        const isStarter = String(row.STATU || "").trim() === "اساسي";
        const stayedAllMatch = !row["OUT MINUTE"] || String(row["OUT MINUTE"]).trim() === "";

        stats.gkCaps += 1;
        stats.ga += goalsConceded;

        const teamGkCount = gkCountByMatchTeam[`${matchId}|${team}`] || 0;
        const isSoleTeamGk = teamGkCount === 1;

        if (isStarter && stayedAllMatch && isSoleTeamGk && goalsConceded === 0) {
            if (isEgyptTeam(team) && ctx.ga === 0) stats.cs += 1;
            else if (!isEgyptTeam(team) && ctx.gf === 0) stats.cs += 1;
        }
    });

    lastCacheKey = cacheKey;
    cachedSeasonStatsMap = statsMap;
    return statsMap;
}

function resolvePlayerSeasonStats(playerName, season, position, seasonStatsMap) {
    const raw = seasonStatsMap[getSeasonStatsKey(playerName, season)] || emptySeasonStats();
    const isGk = isGkPosition(position) || raw.gkCaps > 0;

    return {
        isGk,
        mp: isGk ? raw.gkCaps : raw.mp,
        mins: raw.mins,
        goals: raw.goals,
        assists: raw.assists,
        ga: isGk ? raw.ga : null,
        cs: isGk ? raw.cs : null
    };
}

export function buildClubPlayerPerformance(squadData, matchData = {}, groupingMode = GROUPING_MODES.CLUB) {
    const seasonStatsMap = buildPlayerSeasonStatsMap(
        matchData.matches,
        matchData.lineupDetails,
        matchData.playerDetails,
        matchData.gkDetails
    );

    const entries = {};

    (squadData || []).forEach(item => {
        const name = String(item.PLAYERNAME || "").trim();
        const clubRaw = String(item.CLUB || "").trim();
        const season = String(item.SEASON || "").trim();
        const position = String(item.POSITION || "").trim();
        if (!name || !clubRaw) return;

        const groupKey = getGroupKey(clubRaw, groupingMode);
        if (!groupKey) return;

        const key = `${name}|${groupKey}`;
        if (!entries[key]) {
            entries[key] = { name, club: groupKey, seasons: {}, positions: new Set() };
        }

        if (season) {
            if (!entries[key].seasons[season]) entries[key].seasons[season] = new Set();
            if (position) entries[key].seasons[season].add(position);
        }
        if (position) entries[key].positions.add(position);
    });

    return Object.values(entries)
        .map(entry => {
            let mp = 0;
            let mins = 0;
            let goals = 0;
            let assists = 0;
            let ga = 0;
            let cs = 0;
            let isGk = false;

            Object.entries(entry.seasons).forEach(([season, positionsSet]) => {
                const positions = [...positionsSet];
                const seasonPosition = positions.length === 1
                    ? positions[0]
                    : positions.length > 1
                        ? positions.join(" / ")
                        : "";
                const resolved = resolvePlayerSeasonStats(entry.name, season, seasonPosition, seasonStatsMap);

                isGk = isGk || resolved.isGk;
                mp += resolved.mp;
                mins += resolved.mins;
                goals += resolved.goals;
                assists += resolved.assists;

                if (resolved.isGk) {
                    ga += resolved.ga || 0;
                    cs += resolved.cs || 0;
                }
            });

            const allPositions = [...entry.positions];
            const position = allPositions.length === 1
                ? allPositions[0]
                : allPositions.length > 1
                    ? allPositions.join(" / ")
                    : "—";

            return {
                name: entry.name,
                club: entry.club,
                position,
                ntStats: {
                    mp,
                    mins,
                    goals,
                    assists,
                    ga: isGk ? ga : null,
                    cs: isGk ? cs : null,
                    isGk
                }
            };
        })
        .sort((a, b) =>
            b.ntStats.mp - a.ntStats.mp ||
            b.ntStats.goals - a.ntStats.goals ||
            a.club.localeCompare(b.club) ||
            a.name.localeCompare(b.name)
        );
}

export function buildClubOnlyPerformance(squadData, matchData = {}, groupingMode = GROUPING_MODES.CLUB) {
    const playerRows = buildClubPlayerPerformance(squadData, matchData, groupingMode);
    const clubs = {};

    playerRows.forEach(row => {
        if (!clubs[row.club]) {
            clubs[row.club] = {
                club: row.club,
                playerCount: 0,
                ntStats: { mp: 0, mins: 0, goals: 0, assists: 0, ga: 0, cs: 0, hasGk: false }
            };
        }

        const entry = clubs[row.club];
        entry.playerCount += 1;
        entry.ntStats.mp += row.ntStats.mp;
        entry.ntStats.mins += row.ntStats.mins;
        entry.ntStats.goals += row.ntStats.goals;
        entry.ntStats.assists += row.ntStats.assists;

        if (row.ntStats.isGk) {
            entry.ntStats.hasGk = true;
            entry.ntStats.ga += row.ntStats.ga || 0;
            entry.ntStats.cs += row.ntStats.cs || 0;
        }
    });

    return Object.values(clubs)
        .map(entry => ({
            club: entry.club,
            playerCount: entry.playerCount,
            ntStats: {
                mp: entry.ntStats.mp,
                mins: entry.ntStats.mins,
                goals: entry.ntStats.goals,
                assists: entry.ntStats.assists,
                ga: entry.ntStats.hasGk ? entry.ntStats.ga : null,
                cs: entry.ntStats.hasGk ? entry.ntStats.cs : null,
                isGk: entry.ntStats.hasGk
            }
        }))
        .sort((a, b) =>
            b.ntStats.mp - a.ntStats.mp ||
            b.ntStats.goals - a.ntStats.goals ||
            a.club.localeCompare(b.club)
        );
}

export function buildClubStats(groupKey, squadData, matchData = {}, groupingMode = GROUPING_MODES.CLUB) {
    const rows = (squadData || []).filter(
        item => clubsMatchGroup(item.CLUB, groupKey, groupingMode)
    );

    const seasonStatsMap = buildPlayerSeasonStatsMap(
        matchData.matches,
        matchData.lineupDetails,
        matchData.playerDetails,
        matchData.gkDetails
    );

    const playerMap = {};
    const seasonGroupsRaw = {};
    const championMap = {};
    const seasonMap = {};

    rows.forEach(item => {
        const name = String(item.PLAYERNAME || "").trim();
        const position = String(item.POSITION || "").trim();
        const season = String(item.SEASON || "").trim();
        const champion = String(item.CHAMPION || "Unknown").trim();

        if (name) {
            if (!playerMap[name]) {
                playerMap[name] = {
                    name,
                    callups: 0,
                    positions: new Set(),
                    champions: {},
                    seasonsByChamp: {}
                };
            }
            playerMap[name].callups += 1;
            if (position) playerMap[name].positions.add(position);
            playerMap[name].champions[champion] = (playerMap[name].champions[champion] || 0) + 1;
            if (season) {
                if (!playerMap[name].seasonsByChamp[champion]) {
                    playerMap[name].seasonsByChamp[champion] = new Set();
                }
                playerMap[name].seasonsByChamp[champion].add(season);
            }
        }

        if (season) {
            if (!seasonGroupsRaw[season]) {
                seasonGroupsRaw[season] = {
                    callups: 0,
                    players: [],
                    playerKeys: new Set(),
                    champions: new Set()
                };
            }
            seasonGroupsRaw[season].callups += 1;
            seasonGroupsRaw[season].champions.add(champion);
            const rowKey = `${name}|${position}|${champion}`;
            if (name && !seasonGroupsRaw[season].playerKeys.has(rowKey)) {
                seasonGroupsRaw[season].playerKeys.add(rowKey);
                seasonGroupsRaw[season].players.push({
                    name,
                    position: position || "—",
                    champion,
                    ntStats: resolvePlayerSeasonStats(name, season, position, seasonStatsMap)
                });
            }
        }

        if (!championMap[champion]) {
            championMap[champion] = { name: champion, callups: 0, players: new Set(), seasons: new Set() };
        }
        championMap[champion].callups += 1;
        if (name) championMap[champion].players.add(name);
        if (season) championMap[champion].seasons.add(season);

        if (season) {
            if (!seasonMap[season]) {
                seasonMap[season] = { name: season, callups: 0, players: new Set(), champions: new Set() };
            }
            seasonMap[season].callups += 1;
            if (name) seasonMap[season].players.add(name);
            seasonMap[season].champions.add(champion);
        }
    });

    const players = Object.values(playerMap)
        .map(p => {
            const seasonsByChamp = {};
            for (const champ in p.seasonsByChamp) {
                seasonsByChamp[champ] = [...p.seasonsByChamp[champ]].sort((a, b) =>
                    b.localeCompare(a, undefined, { numeric: true })
                );
            }
            const positions = [...p.positions];
            return {
                name: p.name,
                callups: p.callups,
                position: positions.length === 1
                    ? positions[0]
                    : positions.length > 1
                        ? positions.join(" / ")
                        : "—",
                champions: p.champions,
                seasonsByChamp
            };
        })
        .sort((a, b) => b.callups - a.callups || a.name.localeCompare(b.name));

    const champions = Object.values(championMap)
        .map(c => ({
            name: c.name,
            callups: c.callups,
            playerCount: c.players.size,
            seasonCount: c.seasons.size
        }))
        .sort((a, b) => b.callups - a.callups || a.name.localeCompare(b.name));

    const seasons = Object.values(seasonMap)
        .map(s => ({
            name: s.name,
            callups: s.callups,
            playerCount: s.players.size,
            championCount: s.champions.size
        }))
        .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));

    const seasonGroups = Object.entries(seasonGroupsRaw)
        .map(([season, group]) => ({
            season,
            callups: group.callups,
            players: group.players.sort((a, b) => a.name.localeCompare(b.name)),
            champions: [...group.champions].sort()
        }))
        .sort((a, b) => b.season.localeCompare(a.season, undefined, { numeric: true }));

    const sortedSeasonNames = seasons.map(s => s.name).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );

    return {
        totalCallups: rows.length,
        uniquePlayers: players.length,
        uniqueSeasons: seasons.length,
        uniqueChampions: champions.length,
        players,
        seasonGroups,
        champions,
        seasons,
        highlights: {
            topPlayer: players[0] || null,
            topChampion: champions[0] || null,
            firstSeason: sortedSeasonNames[0] || "—",
            lastSeason: sortedSeasonNames[sortedSeasonNames.length - 1] || "—"
        }
    };
}
