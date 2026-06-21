import { compareSeasonLabels, sortTrophiesBySeason } from "../Service/int_trophy_service";

function norm(value) {
    return String(value ?? "").trim();
}

function filterByType(trophies, typeFilter) {
    if (!typeFilter || typeFilter === "All") return trophies || [];
    return (trophies || []).filter((t) => norm(t.TYPE) === typeFilter);
}

function isTeamChampion(row, teamName) {
    return norm(row.CHAMPION) === teamName;
}

function isTeamRunnerUp(row, teamName) {
    return norm(row["RUNNER-UP"]) === teamName;
}

function isTeamInFinal(row, teamName) {
    return isTeamChampion(row, teamName) || isTeamRunnerUp(row, teamName);
}

function emptyBucket(extra = {}) {
    return { finals: 0, wins: 0, losses: 0, ...extra };
}

function addWin(bucket) {
    bucket.wins += 1;
    bucket.finals += 1;
}

function addLoss(bucket) {
    bucket.losses += 1;
    bucket.finals += 1;
}

export function getTeamWinRecords(trophies, teamName, typeFilter = "All") {
    return sortTrophiesBySeason(
        filterByType(trophies, typeFilter).filter((row) => isTeamChampion(row, teamName))
    );
}

export function getTeamFinalAppearances(trophies, teamName, typeFilter = "All", outcomeFilter = "all") {
    const rows = filterByType(trophies, typeFilter).filter((row) => isTeamInFinal(row, teamName));
    if (!outcomeFilter || outcomeFilter === "all") return rows;
    if (outcomeFilter === "wins") return rows.filter((row) => isTeamChampion(row, teamName));
    if (outcomeFilter === "losses") return rows.filter((row) => isTeamRunnerUp(row, teamName));
    return rows;
}

export const FINAL_OUTCOME_OPTIONS = [
    { id: "all", label: "ALL" },
    { id: "wins", label: "WINS" },
    { id: "losses", label: "LOSSES" },
];

export function buildTeamSummary(trophies, teamName, typeFilter = "All") {
    const wins = getTeamWinRecords(trophies, teamName, typeFilter);
    const appearances = getTeamFinalAppearances(trophies, teamName, typeFilter);
    const losses = appearances.filter((row) => isTeamRunnerUp(row, teamName)).length;

    return {
        wins: wins.length,
        losses,
        finals: wins.length + losses,
    };
}

function buildGroupedBreakdown(trophies, teamName, typeFilter, keyFn, labelFn, sortFn) {
    const map = new Map();

    getTeamFinalAppearances(trophies, teamName, typeFilter).forEach((row) => {
        const key = keyFn(row);
        if (!key) return;

        if (!map.has(key)) {
            map.set(key, emptyBucket(labelFn(row, key)));
        }
        const bucket = map.get(key);

        if (isTeamChampion(row, teamName)) addWin(bucket);
        else if (isTeamRunnerUp(row, teamName)) addLoss(bucket);
    });

    const rows = [...map.values()];
    rows.sort(sortFn);

    const totals = rows.reduce(
        (acc, row) => ({
            finals: acc.finals + row.finals,
            wins: acc.wins + row.wins,
            losses: acc.losses + row.losses,
        }),
        { finals: 0, wins: 0, losses: 0 }
    );

    return { rows, totals };
}

export function buildBreakdownByGame(trophies, teamName, typeFilter = "All") {
    return buildGroupedBreakdown(
        trophies,
        teamName,
        typeFilter,
        (row) => norm(row.GAME),
        (row) => ({ game: norm(row.GAME) }),
        (a, b) => b.wins - a.wins || b.finals - a.finals || a.game.localeCompare(b.game, "ar")
    );
}

export function buildBreakdownByPlace(trophies, teamName, typeFilter = "All") {
    return buildGroupedBreakdown(
        trophies,
        teamName,
        typeFilter,
        (row) => norm(row.PLACE),
        (row) => ({ place: norm(row.PLACE) }),
        (a, b) =>
            b.finals - a.finals
            || b.wins - a.wins
            || a.place.localeCompare(b.place, "ar")
    );
}

export function buildBreakdownByCompetition(trophies, teamName, typeFilter = "All") {
    return buildGroupedBreakdown(
        trophies,
        teamName,
        typeFilter,
        (row) => `${norm(row.GAME)}|${norm(row.COMPETITION)}`,
        (row) => ({ game: norm(row.GAME), competition: norm(row.COMPETITION) }),
        (a, b) =>
            a.game.localeCompare(b.game, "ar")
            || a.competition.localeCompare(b.competition, "ar")
            || b.finals - a.finals
    );
}

export function buildBreakdownBySeason(trophies, teamName, typeFilter = "All") {
    return buildGroupedBreakdown(
        trophies,
        teamName,
        typeFilter,
        (row) => `${norm(row.GAME)}|${norm(row.COMPETITION)}|${norm(row.SEASON)}`,
        (row) => ({
            game: norm(row.GAME),
            competition: norm(row.COMPETITION),
            season: norm(row.SEASON),
        }),
        (a, b) =>
            a.game.localeCompare(b.game, "ar")
            || a.competition.localeCompare(b.competition, "ar")
            || compareSeasonLabels(a.season, b.season)
            || b.finals - a.finals
    );
}

function getFinalOpponent(row, teamName) {
    if (isTeamChampion(row, teamName)) return norm(row["RUNNER-UP"]);
    if (isTeamRunnerUp(row, teamName)) return norm(row.CHAMPION);
    return "";
}

export function buildBreakdownByOpponent(trophies, teamName, typeFilter = "All") {
    const map = new Map();

    getTeamFinalAppearances(trophies, teamName, typeFilter).forEach((row) => {
        const opponent = getFinalOpponent(row, teamName);
        if (!opponent) return;

        if (!map.has(opponent)) {
            map.set(opponent, emptyBucket({ opponent }));
        }
        const bucket = map.get(opponent);

        if (isTeamChampion(row, teamName)) addWin(bucket);
        else if (isTeamRunnerUp(row, teamName)) addLoss(bucket);
    });

    const rows = [...map.values()];
    rows.sort(
        (a, b) =>
            b.finals - a.finals
            || b.wins - a.wins
            || a.opponent.localeCompare(b.opponent, "ar")
    );

    const totals = rows.reduce(
        (acc, row) => ({
            finals: acc.finals + row.finals,
            wins: acc.wins + row.wins,
            losses: acc.losses + row.losses,
        }),
        { finals: 0, wins: 0, losses: 0 }
    );

    return { rows, totals };
}
