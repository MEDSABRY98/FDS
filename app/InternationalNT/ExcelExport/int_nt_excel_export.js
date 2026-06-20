import {
    buildHostCountryStats,
    buildContinentStats,
    buildOpponentStats,
    getTeamMatchPerspective,
} from "../TeamDetails/int_nt_team_details_utils";
import {
    buildCompetitionStats,
    buildCompetitionTotals,
} from "../Competitions/int_nt_competitions_utils";

export const EXPORT_EVENT = "int-nt-export-excel";

async function loadExcelTools() {
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    return { ExcelJS, saveAs };
}

function fileStamp() {
    return new Date().toISOString().slice(0, 10);
}

function applyStandardStyles(worksheet, { highlightLastRow = false } = {}) {
    const totalRows = worksheet.rowCount;
    worksheet.eachRow((row, rowNumber) => {
        row.height = 25;
        row.eachCell((cell) => {
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
            if (rowNumber === 1) {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF000000" } };
                cell.border = { bottom: { style: "medium", color: { argb: "FFC9A84C" } } };
            } else if (highlightLastRow && rowNumber === totalRows) {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF000000" } };
                cell.border = { top: { style: "medium", color: { argb: "FFC9A84C" } } };
            } else {
                cell.border = { bottom: { style: "thin", color: { argb: "FFEEEEEE" } } };
            }
        });
    });
}

async function writeWorkbook({ sheetName, columns, rows, fileName, highlightLastRow = false }) {
    if (!rows?.length) return false;
    const { ExcelJS, saveAs } = await loadExcelTools();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: false }] });
    worksheet.columns = columns.map(({ header, key, width = 20 }) => ({ header, key, width }));
    worksheet.addRows(rows);
    applyStandardStyles(worksheet, { highlightLastRow });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${fileName}_${fileStamp()}.xlsx`);
    return true;
}

function buildAllTeamStats(matches) {
    const stats = {};
    (matches || []).forEach((m) => {
        const processTeam = (team, isA) => {
            if (!team) return;
            if (!stats[team]) stats[team] = { name: team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
            const s = stats[team];
            s.played++;
            const outcome = m.OUTCOME;
            if (isA) {
                if (outcome === "W") s.wins++;
                else if (outcome === "L") s.losses++;
                else if (outcome && String(outcome).startsWith("D")) s.draws++;
                s.gf += Number(m.TEAMASCORE) || 0;
                s.ga += Number(m.TEAMBSCORE) || 0;
            } else {
                if (outcome === "L") s.wins++;
                else if (outcome === "W") s.losses++;
                else if (outcome && String(outcome).startsWith("D")) s.draws++;
                s.gf += Number(m.TEAMBSCORE) || 0;
                s.ga += Number(m.TEAMASCORE) || 0;
            }
        };
        processTeam(m.TEAMA, true);
        processTeam(m.TEAMB, false);
    });
    return Object.values(stats)
        .map((c) => ({ ...c, gd: c.gf - c.ga, winRate: c.played > 0 ? `${Math.round((c.wins / c.played) * 100)}%` : "0%" }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name), "ar"));
}

function buildCompetitionRows(matches) {
    const stats = buildCompetitionStats(matches);
    const totals = buildCompetitionTotals(stats);
    const rows = stats.map((r) => ({
        GAME: r.game,
        SEASON: r.season,
        P: r.played,
        W: r.wins,
        D: r.draws,
        L: r.losses,
        GF: r.gf,
        GA: r.ga,
        GD: r.gd,
        "WIN %": `${r.winRate}%`,
    }));
    rows.push({
        GAME: `TOTAL (${stats.length})`,
        SEASON: "—",
        P: totals.played,
        W: totals.wins,
        D: totals.draws,
        L: totals.losses,
        GF: totals.gf,
        GA: totals.ga,
        GD: totals.gd,
        "WIN %": `${totals.winRate}%`,
    });
    return rows;
}

function buildContinentsList(matches) {
    const map = {};
    (matches || []).forEach((m) => {
        [m["TEAMA CONTINENT"], m["TEAMB CONTINENT"]].forEach((cont) => {
            const name = String(cont ?? "").trim();
            if (!name) return;
            if (!map[name]) map[name] = { CONTINENT: name, APPEARANCES: 0 };
            map[name].APPEARANCES++;
        });
    });
    return Object.values(map).sort((a, b) => b.APPEARANCES - a.APPEARANCES || a.CONTINENT.localeCompare(b.CONTINENT));
}

function buildContinentComparison(matches, continent) {
    const stats = {};
    (matches || []).forEach((m) => {
        const contA = String(m["TEAMA CONTINENT"] ?? "").trim();
        const contB = String(m["TEAMB CONTINENT"] ?? "").trim();
        const outcome = m.OUTCOME;
        const gf = Number(m.TEAMASCORE) || 0;
        const ga = Number(m.TEAMBSCORE) || 0;
        const add = (opponent, resultCode, gFor, gAg) => {
            if (!stats[opponent]) stats[opponent] = { opponent, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
            const row = stats[opponent];
            row.played++;
            row.gf += gFor;
            row.ga += gAg;
            const o = String(resultCode ?? "").toUpperCase();
            if (o === "W") row.wins++;
            else if (o === "L") row.losses++;
            else if (o.startsWith("D")) row.draws++;
        };
        if (contA === continent && contB) add(contB, outcome, gf, ga);
        else if (contB === continent && contA) {
            const flipped = outcome === "W" ? "L" : outcome === "L" ? "W" : outcome;
            add(contA, flipped, ga, gf);
        }
    });
    return Object.values(stats)
        .map((row) => ({
            "VS CONTINENT": row.opponent, P: row.played, W: row.wins, D: row.draws, L: row.losses,
            GF: row.gf, GA: row.ga, GD: row.gf - row.ga,
            "WIN %": row.played ? `${Math.round((row.wins / row.played) * 100)}%` : "0%",
        }))
        .sort((a, b) => b.P - a.P || b.W - a.W);
}

function groupedStatsToRows(items, labelKey) {
    const rows = items.map((item) => ({
        [labelKey]: item.name, P: item.played, W: item.wins, D: item.draws, L: item.losses,
        GF: item.gf, GA: item.ga, GD: item.gd, "WIN %": `${item.winRate}%`,
    }));
    const totals = items.reduce((t, item) => {
        t.played += item.played; t.wins += item.wins; t.draws += item.draws;
        t.losses += item.losses; t.gf += item.gf; t.ga += item.ga;
        return t;
    }, { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
    rows.push({
        [labelKey]: `TOTAL (${items.length})`, P: totals.played, W: totals.wins, D: totals.draws, L: totals.losses,
        GF: totals.gf, GA: totals.ga, GD: totals.gf - totals.ga,
        "WIN %": totals.played ? `${Math.round((totals.wins / totals.played) * 100)}%` : "0%",
    });
    return rows;
}

export async function exportIntNtMatchesToExcel(matches, fileName = "IntlNT_Matches") {
    const rows = (matches || []).map((m) => ({
        ROW_ID: m.ROW_ID || "", MATCH_ID: m.MATCH_ID || "", GAME: m.GAME || "", AGE: m.AGE || "",
        SEASON: m.SEASON || "", "HOST COUNTRY": m["HOST COUNTRY"] || "", DATE: m.DATE || "",
        CATEGORY: m.CATEGORY || "", ROUND: m.ROUND || "", TEAMA: m.TEAMA || "",
        "TEAMA CONTINENT": m["TEAMA CONTINENT"] || "", TEAMASCORE: m.TEAMASCORE ?? "",
        TEAMBSCORE: m.TEAMBSCORE ?? "", TEAMAPEN: m.TEAMAPEN || "", TEAMBPEN: m.TEAMBPEN || "",
        TEAMB: m.TEAMB || "", "TEAMB CONTINENT": m["TEAMB CONTINENT"] || "",
        "W-D-L": m["W-D-L"] || "", "CLEAN SHEET": m["CLEAN SHEET"] || "",
    }));
    const columns = Object.keys(rows[0] || {}).map((key) => ({ header: key, key }));
    return writeWorkbook({ sheetName: "Matches", columns, rows, fileName });
}

export async function exportIntNtDashboardToExcel(matches, fileName = "IntlNT_Dashboard") {
    let wins = 0, losses = 0, draws = 0, gfTotal = 0, gaTotal = 0;
    (matches || []).forEach((m) => {
        const outcome = m.OUTCOME;
        if (outcome === "W") wins++;
        else if (outcome === "L") losses++;
        else if (outcome && String(outcome).startsWith("D")) draws++;
        gfTotal += Number(m.TEAMASCORE) || 0;
        gaTotal += Number(m.TEAMBSCORE) || 0;
    });
    const rows = [
        { METRIC: "MATCHES", VALUE: matches?.length || 0 },
        { METRIC: "TEAM A WINS", VALUE: wins },
        { METRIC: "DRAWS", VALUE: draws },
        { METRIC: "TEAM A LOSSES", VALUE: losses },
        { METRIC: "GOALS FOR", VALUE: gfTotal },
        { METRIC: "GOALS AGST", VALUE: gaTotal },
    ];
    return writeWorkbook({
        sheetName: "Dashboard",
        columns: [{ header: "METRIC", key: "METRIC", width: 28 }, { header: "VALUE", key: "VALUE", width: 16 }],
        rows, fileName,
    });
}

export async function exportIntNtTeamsToExcel(matches, fileName = "IntlNT_Teams") {
    const teams = buildAllTeamStats(matches);
    return writeWorkbook({
        sheetName: "Teams",
        columns: [
            { header: "TEAM", key: "name", width: 32 }, { header: "P", key: "played", width: 10 },
            { header: "W", key: "wins", width: 10 }, { header: "D", key: "draws", width: 10 },
            { header: "L", key: "losses", width: 10 }, { header: "GF", key: "gf", width: 10 },
            { header: "GA", key: "ga", width: 10 }, { header: "GD", key: "gd", width: 10 },
            { header: "WIN %", key: "winRate", width: 12 },
        ],
        rows: teams, fileName,
    });
}

export async function exportIntNtCompetitionsToExcel(matches, fileName = "IntlNT_Competitions") {
    const rows = buildCompetitionRows(matches);
    return writeWorkbook({
        sheetName: "Competitions",
        columns: [
            { header: "GAME", key: "GAME", width: 18 },
            { header: "SEASON", key: "SEASON", width: 22 },
            { header: "P", key: "P", width: 8 },
            { header: "W", key: "W", width: 8 },
            { header: "D", key: "D", width: 8 },
            { header: "L", key: "L", width: 8 },
            { header: "GF", key: "GF", width: 8 },
            { header: "GA", key: "GA", width: 8 },
            { header: "GD", key: "GD", width: 8 },
            { header: "WIN %", key: "WIN %", width: 10 },
        ],
        rows,
        fileName,
        highlightLastRow: true,
    });
}

export async function exportIntNtContinentsListToExcel(matches, fileName = "IntlNT_Continents") {
    const rows = buildContinentsList(matches);
    return writeWorkbook({
        sheetName: "Continents",
        columns: [{ header: "CONTINENT", key: "CONTINENT", width: 24 }, { header: "APPEARANCES", key: "APPEARANCES", width: 16 }],
        rows, fileName,
    });
}

export async function exportIntNtContinentComparisonToExcel(matches, continent, fileName = "IntlNT_Continent_Comparison") {
    const rows = buildContinentComparison(matches, continent);
    if (!rows.length) return false;
    const columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    return writeWorkbook({ sheetName: continent.slice(0, 31), columns, rows, fileName: `${fileName}_${continent.replace(/[^\w-]+/g, "_")}` });
}

export async function exportIntNtTeamDetailMatchesToExcel(teamName, matches, fileName) {
    const rows = (matches || []).map((m) => {
        const p = getTeamMatchPerspective(m, teamName);
        return {
            DATE: m.DATE || "", SEASON: m.SEASON || "", GAME: m.GAME || "", CATEGORY: m.CATEGORY || "",
            ROUND: m.ROUND || "", OPPONENT: p.opponent,
            SCORE: `${p.gf} - ${p.ga}${p.pen ? ` (${p.pen})` : ""}`,
            "HOST COUNTRY": p.hostCountry, RESULT: p.winner || "",
        };
    });
    const columns = Object.keys(rows[0] || {}).map((key) => ({ header: key, key }));
    return writeWorkbook({ sheetName: "Matches", columns, rows, fileName: fileName || `IntlNT_${teamName}_Matches` });
}

export async function exportIntNtTeamDetailGroupedToExcel(teamName, matches, type, fileName) {
    const builders = {
        opponents: () => buildOpponentStats(matches, teamName),
        host_countries: () => buildHostCountryStats(matches, teamName),
        continents: () => buildContinentStats(matches, teamName),
    };
    const labels = { opponents: "OPPONENT", host_countries: "HOST COUNTRY", continents: "CONTINENT" };
    const items = builders[type]?.() || [];
    if (!items.length) return false;
    const rows = groupedStatsToRows(items, labels[type]);
    const columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    return writeWorkbook({ sheetName: labels[type], columns, rows, fileName: fileName || `IntlNT_${teamName}_${type}`, highlightLastRow: true });
}

export async function exportIntNtH2HToExcel(teamA, teamB, matches, fileName = "IntlNT_H2H") {
    const rows = (matches || [])
        .filter((m) => (m.TEAMA === teamA && m.TEAMB === teamB) || (m.TEAMB === teamA && m.TEAMA === teamB))
        .map((m) => ({
            DATE: m.DATE || "", SEASON: m.SEASON || "", GAME: m.GAME || "", CATEGORY: m.CATEGORY || "",
            ROUND: m.ROUND || "", TEAMA: m.TEAMA || "",
            SCORE: `${m.TEAMASCORE ?? ""} - ${m.TEAMBSCORE ?? ""}${m["PEN DISPLAY"] ? ` (${m["PEN DISPLAY"]})` : ""}`,
            TEAMB: m.TEAMB || "", "HOST COUNTRY": m["HOST COUNTRY"] || "", "W-D-L": m["W-D-L"] || "",
        }));
    if (!rows.length) return false;
    const columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    const safeName = `${fileName}_${teamA}_vs_${teamB}`.replace(/[^\w-]+/g, "_").slice(0, 120);
    return writeWorkbook({ sheetName: "H2H", columns, rows, fileName: safeName });
}

export async function exportIntNtByTab(activeTab, matches) {
    switch (activeTab) {
        case "dashboard": return exportIntNtDashboardToExcel(matches);
        case "matches": return exportIntNtMatchesToExcel(matches);
        case "teams": return exportIntNtTeamsToExcel(matches);
        case "competitions": return exportIntNtCompetitionsToExcel(matches);
        case "continents": return exportIntNtContinentsListToExcel(matches);
        default: return false;
    }
}
