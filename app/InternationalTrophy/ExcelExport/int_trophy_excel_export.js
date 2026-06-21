import * as XLSX from "xlsx";
import { IntTrophyService, sortTrophiesBySeason } from "../Service/int_trophy_service";
import {
    buildTeamCompetitionMatrix,
    buildTeamGameMatrix,
    matrixToExportRows,
} from "../Aggregates/int_trophy_aggregate_utils";

export const EXPORT_EVENT = "int-trophy-export-excel";

const COLS = ["TYPE", "AREA", "GAME", "COMPETITION", "SEASON", "W-MANAGER", "L-MANAGER", "PLACE", "CHAMPION", "RESULT", "RUNNER-UP", "NOTE"];

function rowToExport(t, extra = {}) {
    const base = {};
    COLS.forEach((col) => { base[col] = t[col] ?? "---"; });
    return { ...base, ...extra };
}

function writeWorkbook(sheetName, rows, fileName) {
    if (!rows?.length) return false;
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    XLSX.writeFile(workbook, fileName);
    return true;
}

export function exportIntTrophyByTab(activeTab, trophies, options = {}) {
    const { typeFilter = "All", outcomeFilter = "all" } = options;
    const filtered = typeFilter === "All" ? (trophies || []) : (trophies || []).filter((t) => String(t.TYPE ?? "").trim() === typeFilter);
    const stamp = new Date().toISOString().slice(0, 10);

    if (activeTab === "leaderboard") {
        const leaderboard = IntTrophyService.getLeaderboard(trophies, typeFilter);
        const rows = leaderboard.map((item, idx) => ({
            Rank: idx + 1,
            Champion: item.champion,
            Trophies: item.count,
        }));
        return writeWorkbook("Leaderboard", rows, `INTL_Trophy_Leaderboard_${stamp}.xlsx`);
    }

    if (activeTab === "records") {
        const rows = sortTrophiesBySeason(filtered).map((t) => rowToExport(t));
        return writeWorkbook("Records", rows, `INTL_Trophy_Records_${stamp}.xlsx`);
    }

    if (activeTab === "aggregates") {
        const { viewMode = "by_game", selectedGame = "" } = options;
        const suffix = outcomeFilter === "all" ? "AllFinals" : outcomeFilter === "wins" ? "Wins" : "Losses";

        if (viewMode === "by_competition") {
            const matrix = buildTeamCompetitionMatrix(trophies, selectedGame, typeFilter, outcomeFilter);
            if (!matrix.rows.length || !matrix.competitions.length) return false;
            const rows = matrixToExportRows(matrix, "totalsByCompetition", matrix.competitions);
            const safeGame = String(selectedGame).replace(/[^\w-]+/g, "_") || "Game";
            return writeWorkbook("ByCompetition", rows, `INTL_Trophy_Aggregates_${safeGame}_${typeFilter}_${suffix}_${stamp}.xlsx`);
        }

        const matrix = buildTeamGameMatrix(trophies, typeFilter, outcomeFilter);
        if (!matrix.rows.length || !matrix.games.length) return false;
        const rows = matrixToExportRows(matrix, "totalsByGame", matrix.games);
        return writeWorkbook("ByGame", rows, `INTL_Trophy_Aggregates_${typeFilter}_${suffix}_${stamp}.xlsx`);
    }

    return false;
}
