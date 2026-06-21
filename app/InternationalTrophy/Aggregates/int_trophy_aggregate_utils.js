import COLUMN_ORDER from "./game_column_order.json";

const GAME_COLUMN_ORDER = COLUMN_ORDER.games || [];
const COMPETITION_COLUMN_ORDER = COLUMN_ORDER.competitions || {};

function norm(value) {
    return String(value ?? "").trim();
}

function sortGames(games) {
    const orderMap = {};
    GAME_COLUMN_ORDER.forEach((name, idx) => {
        orderMap[norm(name).toLowerCase()] = idx;
    });

    return [...games].sort((a, b) => {
        const ia = orderMap[norm(a).toLowerCase()];
        const ib = orderMap[norm(b).toLowerCase()];
        const rankA = ia !== undefined ? ia : 9999;
        const rankB = ib !== undefined ? ib : 9999;
        if (rankA !== rankB) return rankA - rankB;
        return norm(a).localeCompare(norm(b), "ar");
    });
}

function sortCompetitions(competitions, gameName, typeFilter = "All") {
    const game = norm(gameName);
    const orderLists = [];

    if (typeFilter === "All" || typeFilter === "Club") {
        const clubList = COMPETITION_COLUMN_ORDER.Club?.[game];
        if (clubList?.length) orderLists.push(clubList);
    }
    if (typeFilter === "All" || typeFilter === "NT") {
        const ntList = COMPETITION_COLUMN_ORDER.NT?.[game];
        if (ntList?.length) orderLists.push(ntList);
    }

    const orderMap = new Map();
    orderLists.forEach((list) => {
        list.forEach((name, idx) => {
            const key = norm(name).toLowerCase();
            if (!orderMap.has(key)) orderMap.set(key, orderMap.size);
        });
    });

    return [...competitions].sort((a, b) => {
        const ia = orderMap.get(norm(a).toLowerCase());
        const ib = orderMap.get(norm(b).toLowerCase());
        const rankA = ia !== undefined ? ia : 9999;
        const rankB = ib !== undefined ? ib : 9999;
        if (rankA !== rankB) return rankA - rankB;
        return norm(a).localeCompare(norm(b), "ar");
    });
}

function filterByType(trophies, typeFilter) {
    if (!typeFilter || typeFilter === "All") return trophies || [];
    return (trophies || []).filter((t) => norm(t.TYPE) === typeFilter);
}

function bump(map, team, column) {
    if (!team || !column) return;
    const key = `${team}|${column}`;
    map.set(key, (map.get(key) || 0) + 1);
}

function buildTeamColumnMatrix(scoped, outcomeFilter, getColumnKey, sortColumns) {
    const counts = new Map();
    const columnSet = new Set();

    scoped.forEach((row) => {
        const column = getColumnKey(row);
        if (!column) return;

        const champion = norm(row.CHAMPION);
        const runnerUp = norm(row["RUNNER-UP"]);

        if (outcomeFilter === "all" || outcomeFilter === "wins") {
            if (champion) {
                bump(counts, champion, column);
                columnSet.add(column);
            }
        }
        if (outcomeFilter === "all" || outcomeFilter === "losses") {
            if (runnerUp) {
                bump(counts, runnerUp, column);
                columnSet.add(column);
            }
        }
    });

    const columns = sortColumns([...columnSet]);
    const teamSet = new Set();
    counts.forEach((_v, key) => {
        const team = key.split("|")[0];
        if (team) teamSet.add(team);
    });

    const totalsByColumn = {};
    columns.forEach((col) => { totalsByColumn[col] = 0; });

    const rows = [...teamSet].map((team) => {
        const cells = {};
        let total = 0;
        columns.forEach((col) => {
            const count = counts.get(`${team}|${col}`) || 0;
            if (count > 0) cells[col] = count;
            total += count;
            totalsByColumn[col] += count;
        });
        return { team, cells, total };
    });

    rows.sort(
        (a, b) => b.total - a.total || a.team.localeCompare(b.team, "ar")
    );

    const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

    return { columns, rows, totalsByColumn, grandTotal };
}

export function getAvailableGames(trophies, typeFilter = "All") {
    const scoped = filterByType(trophies, typeFilter);
    const gameSet = new Set();
    scoped.forEach((row) => {
        const game = norm(row.GAME);
        if (game) gameSet.add(game);
    });
    return sortGames([...gameSet]);
}

export function buildTeamGameMatrix(trophies, typeFilter = "All", outcomeFilter = "all") {
    const scoped = filterByType(trophies, typeFilter);
    const matrix = buildTeamColumnMatrix(
        scoped,
        outcomeFilter,
        (row) => norm(row.GAME),
        sortGames
    );
    return {
        games: matrix.columns,
        rows: matrix.rows,
        totalsByGame: matrix.totalsByColumn,
        grandTotal: matrix.grandTotal,
    };
}

export function buildTeamCompetitionMatrix(trophies, gameName, typeFilter = "All", outcomeFilter = "all") {
    const game = norm(gameName);
    if (!game) {
        return { competitions: [], rows: [], totalsByCompetition: {}, grandTotal: 0 };
    }

    const scoped = filterByType(trophies, typeFilter).filter((row) => norm(row.GAME) === game);
    const sortFn = (cols) => sortCompetitions(cols, game, typeFilter);
    const matrix = buildTeamColumnMatrix(
        scoped,
        outcomeFilter,
        (row) => norm(row.COMPETITION),
        sortFn
    );
    return {
        competitions: matrix.columns,
        rows: matrix.rows,
        totalsByCompetition: matrix.totalsByColumn,
        grandTotal: matrix.grandTotal,
    };
}

export function matrixToExportRows(matrix, columnsKey, columns) {
    const rows = matrix.rows.map((row) => {
        const out = { TEAM: row.team };
        columns.forEach((col) => {
            out[col] = row.cells[col] || 0;
        });
        out.TOTAL = row.total;
        return out;
    });
    const totalsRow = { TEAM: "TOTAL" };
    columns.forEach((col) => {
        totalsRow[col] = matrix[columnsKey][col] || 0;
    });
    totalsRow.TOTAL = matrix.grandTotal;
    rows.push(totalsRow);
    return rows;
}
