import {
    buildCountryStats,
    buildContinentStats,
    buildOpponentStats,
    getClubMatchPerspective,
} from "../ClubDetails/intl_club_details_utils";
import {
    buildCompetitionStats,
    buildCompetitionTotals,
} from "../Competitions/intl_competitions_utils";

export const EXPORT_EVENT = "intl-club-export-excel";

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

function buildAllClubStats(matches) {
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
                s.gf += Number(m.GF) || 0;
                s.ga += Number(m.GA) || 0;
            } else {
                if (outcome === "L") s.wins++;
                else if (outcome === "W") s.losses++;
                else if (outcome && String(outcome).startsWith("D")) s.draws++;
                s.gf += Number(m.GA) || 0;
                s.ga += Number(m.GF) || 0;
            }
        };
        processTeam(m["TEAM A"], true);
        processTeam(m["TEAM B"], false);
    });

    return Object.values(stats)
        .map((c) => ({
            ...c,
            gd: c.gf - c.ga,
            winRate: c.played > 0 ? `${Math.round((c.wins / c.played) * 100)}%` : "0%",
        }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name), "ar"));
}

function buildCompetitionRows(matches) {
    const stats = buildCompetitionStats(matches);
    const totals = buildCompetitionTotals(stats);
    const rows = stats.map((r) => ({
        GAME: r.game,
        Edition: r.edition,
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
        Edition: "—",
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
        [m["TEAM A CONTINENT"], m["TEAM B CONTINENT"]].forEach((cont) => {
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
        const contA = String(m["TEAM A CONTINENT"] ?? "").trim();
        const contB = String(m["TEAM B CONTINENT"] ?? "").trim();
        const outcome = m.OUTCOME;
        const gf = Number(m.GF) || 0;
        const ga = Number(m.GA) || 0;

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
            "VS CONTINENT": row.opponent,
            P: row.played,
            W: row.wins,
            D: row.draws,
            L: row.losses,
            GF: row.gf,
            GA: row.ga,
            GD: row.gf - row.ga,
            "WIN %": row.played ? `${Math.round((row.wins / row.played) * 100)}%` : "0%",
        }))
        .sort((a, b) => b.P - a.P || b.W - a.W);
}

function groupedStatsToRows(items, labelKey) {
    const rows = items.map((item) => ({
        [labelKey]: item.name,
        P: item.played,
        W: item.wins,
        D: item.draws,
        L: item.losses,
        GF: item.gf,
        GA: item.ga,
        GD: item.gd,
        "WIN %": `${item.winRate}%`,
    }));

    const totals = items.reduce(
        (t, item) => {
            t.played += item.played;
            t.wins += item.wins;
            t.draws += item.draws;
            t.losses += item.losses;
            t.gf += item.gf;
            t.ga += item.ga;
            return t;
        },
        { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }
    );

    rows.push({
        [labelKey]: `TOTAL (${items.length})`,
        P: totals.played,
        W: totals.wins,
        D: totals.draws,
        L: totals.losses,
        GF: totals.gf,
        GA: totals.ga,
        GD: totals.gf - totals.ga,
        "WIN %": totals.played ? `${Math.round((totals.wins / totals.played) * 100)}%` : "0%",
    });

    return rows;
}

export async function exportIntlMatchesToExcel(matches, fileName = "IntlClubs_Matches") {
    const rows = (matches || []).map((m) => ({
        ROW_ID: m.ROW_ID || "",
        MATCH_ID: m.MATCH_ID || "",
        GAME: m.GAME || "",
        KIND: m.KIND || "",
        Edition: m.Edition || "",
        ROUND: m.ROUND || "",
        "H-A-N": m["H-A-N"] || "",
        "TEAM A": m["TEAM A"] || "",
        "TEAM A CONTINENT": m["TEAM A CONTINENT"] || "",
        GF: m.GF ?? "",
        GA: m.GA ?? "",
        PEN: m.PEN || "",
        "TEAM B": m["TEAM B"] || "",
        "TEAM B CONTINENT": m["TEAM B CONTINENT"] || "",
        "W-D-L": m["W-D-L"] || "",
        "CLEAN SHEET": m["CLEAN SHEET"] || "",
        NOTE: m.NOTE || "",
    }));

    const columns = Object.keys(rows[0] || {}).map((key) => ({ header: key, key }));
    return writeWorkbook({ sheetName: "Matches", columns, rows, fileName });
}

export async function exportIntlDashboardToExcel(matches, fileName = "IntlClubs_Dashboard") {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let gfTotal = 0;
    let gaTotal = 0;

    (matches || []).forEach((m) => {
        const outcome = m.OUTCOME;
        if (outcome === "W") wins++;
        else if (outcome === "L") losses++;
        else if (outcome && String(outcome).startsWith("D")) draws++;
        gfTotal += Number(m.GF) || 0;
        gaTotal += Number(m.GA) || 0;
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
        columns: [
            { header: "METRIC", key: "METRIC", width: 28 },
            { header: "VALUE", key: "VALUE", width: 16 },
        ],
        rows,
        fileName,
    });
}

export async function exportIntlClubsToExcel(matches, fileName = "IntlClubs_Clubs") {
    const clubs = buildAllClubStats(matches);
    return writeWorkbook({
        sheetName: "Clubs",
        columns: [
            { header: "CLUB", key: "name", width: 32 },
            { header: "P", key: "played", width: 10 },
            { header: "W", key: "wins", width: 10 },
            { header: "D", key: "draws", width: 10 },
            { header: "L", key: "losses", width: 10 },
            { header: "GF", key: "gf", width: 10 },
            { header: "GA", key: "ga", width: 10 },
            { header: "GD", key: "gd", width: 10 },
            { header: "WIN %", key: "winRate", width: 12 },
        ],
        rows: clubs,
        fileName,
    });
}

export async function exportIntlCompetitionsToExcel(matches, fileName = "IntlClubs_Competitions") {
    const rows = buildCompetitionRows(matches);
    return writeWorkbook({
        sheetName: "Competitions",
        columns: [
            { header: "GAME", key: "GAME", width: 18 },
            { header: "Edition", key: "Edition", width: 22 },
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

export async function exportIntlContinentsListToExcel(matches, fileName = "IntlClubs_Continents") {
    const rows = buildContinentsList(matches);
    return writeWorkbook({
        sheetName: "Continents",
        columns: [
            { header: "CONTINENT", key: "CONTINENT", width: 24 },
            { header: "APPEARANCES", key: "APPEARANCES", width: 16 },
        ],
        rows,
        fileName,
    });
}

export async function exportIntlContinentComparisonToExcel(matches, continent, fileName = "IntlClubs_Continent_Comparison") {
    const rows = buildContinentComparison(matches, continent);
    if (!rows.length) return false;
    const columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    return writeWorkbook({
        sheetName: continent.slice(0, 31),
        columns,
        rows,
        fileName: `${fileName}_${continent.replace(/[^\w-]+/g, "_")}`,
    });
}

export async function exportIntlClubDetailMatchesToExcel(clubName, matches, fileName) {
    const rows = (matches || []).map((m) => {
        const p = getClubMatchPerspective(m, clubName);
        return {
            Edition: m.Edition || "",
            GAME: m.GAME || "",
            KIND: m.KIND || "",
            ROUND: m.ROUND || "",
            OPPONENT: p.opponent,
            SCORE: `${p.gf} - ${p.ga}${m.PEN ? ` (${m.PEN})` : ""}`,
            "H-A-N": p.han,
            RESULT: p.winner || "",
        };
    });

    const columns = Object.keys(rows[0] || {}).map((key) => ({ header: key, key }));
    return writeWorkbook({ sheetName: "Matches", columns, rows, fileName: fileName || `IntlClubs_${clubName}_Matches` });
}

export async function exportIntlClubDetailGroupedToExcel(clubName, matches, type, fileName) {
    const builders = {
        opponents: () => buildOpponentStats(matches, clubName),
        countries: () => buildCountryStats(matches, clubName),
        continents: () => buildContinentStats(matches, clubName),
    };
    const labels = { opponents: "OPPONENT", countries: "COUNTRY", continents: "CONTINENT" };
    const items = builders[type]?.() || [];
    if (!items.length) return false;
    const rows = groupedStatsToRows(items, labels[type]);
    const columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));

    return writeWorkbook({
        sheetName: labels[type],
        columns,
        rows,
        fileName: fileName || `IntlClubs_${clubName}_${type}`,
        highlightLastRow: true,
    });
}

export async function exportIntlH2HToExcel(teamA, teamB, matches, fileName = "IntlClubs_H2H") {
    const rows = (matches || [])
        .filter((m) => {
            const a = m["TEAM A"];
            const b = m["TEAM B"];
            return (a === teamA && b === teamB) || (a === teamB && b === teamA);
        })
        .map((m) => ({
            Edition: m.Edition || "",
            GAME: m.GAME || "",
            KIND: m.KIND || "",
            ROUND: m.ROUND || "",
            "TEAM A": m["TEAM A"] || "",
            SCORE: `${m.GF ?? ""} - ${m.GA ?? ""}${m.PEN ? ` (${m.PEN})` : ""}`,
            "TEAM B": m["TEAM B"] || "",
            "H-A-N": m["H-A-N"] || "",
            "W-D-L": m["W-D-L"] || "",
        }));

    if (!rows.length) return false;
    const columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    const safeName = `${fileName}_${teamA}_vs_${teamB}`.replace(/[^\w-]+/g, "_").slice(0, 120);
    return writeWorkbook({ sheetName: "H2H", columns, rows, fileName: safeName });
}

export async function exportIntlByTab(activeTab, matches) {
    switch (activeTab) {
        case "dashboard":
            return exportIntlDashboardToExcel(matches);
        case "matches":
            return exportIntlMatchesToExcel(matches);
        case "clubs":
            return exportIntlClubsToExcel(matches);
        case "competitions":
            return exportIntlCompetitionsToExcel(matches);
        case "continents":
            return exportIntlContinentsListToExcel(matches);
        default:
            return false;
    }
}
