function normalizeTeamLabel(value) {
    return String(value || "").trim().toLowerCase();
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

function processScoringEvents(playerDetails, matchContextMap) {
    const clubs = {};
    const playerClubs = {};

    (playerDetails || []).forEach(row => {
        const matchId = String(row.MATCH_ID || "").trim();
        const ctx = matchContextMap[matchId];
        if (!ctx) return;

        if (!isEgyptScorerEvent(row, ctx)) return;

        const club = String(row.CLUB || "").trim();
        if (!club) return;

        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName || playerName.toLowerCase() === "unknown") return;

        const type = String(row.TYPE || "").trim();
        const subType = String(row.TYPE_SUB || "").trim();
        const isGoal = isCountablePlayerGoal(type, subType);
        const isAssistEvent = isAssist(type);

        if (!isGoal && !isAssistEvent) return;

        if (!clubs[club]) {
            clubs[club] = {
                club,
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

        const clubEntry = clubs[club];
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

        const playerClubKey = `${playerName}|${club}`;
        if (!playerClubs[playerClubKey]) {
            playerClubs[playerClubKey] = {
                player: playerName,
                club,
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

export function buildScoringClubStats(playerDetails, filteredMatches) {
    const matchContextMap = buildMatchContextMap(filteredMatches);
    const { clubs } = processScoringEvents(playerDetails, matchContextMap);

    return Object.values(clubs)
        .map(entry => ({
            club: entry.club,
            scorersCount: entry.scorers.size,
            contributorsCount: entry.contributors.size,
            goals: entry.goals,
            assists: entry.assists,
            penGoals: entry.penGoals,
            ga: entry.goals + entry.assists,
            firstDate: entry.firstDate,
            lastDate: entry.lastDate,
            championshipCount: entry.championships.size
        }))
        .sort((a, b) =>
            b.goals - a.goals ||
            b.assists - a.assists ||
            a.club.localeCompare(b.club)
        );
}

export function buildPlayerClubStats(playerDetails, filteredMatches) {
    const matchContextMap = buildMatchContextMap(filteredMatches);
    const { playerClubs } = processScoringEvents(playerDetails, matchContextMap);

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

export function buildScoringClubDetailStats(clubName, playerDetails, filteredMatches) {
    const matchContextMap = buildMatchContextMap(filteredMatches);
    const normalizedClub = String(clubName || "").trim();

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

        const club = String(row.CLUB || "").trim();
        if (!club || club !== normalizedClub) return;

        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName || playerName.toLowerCase() === "unknown") return;

        const type = String(row.TYPE || "").trim();
        const subType = String(row.TYPE_SUB || "").trim();
        const isGoal = isCountablePlayerGoal(type, subType);
        const isAssistEvent = isAssist(type);

        if (!isGoal && !isAssistEvent) return;

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
        club: normalizedClub,
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
