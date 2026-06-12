/**
 * Utility function to export filtered Egypt Club matches to an Excel file using exceljs and file-saver.
 * 
 * @param {Array} filteredMatches - The array of match objects to export.
 * @param {string} filename - The base name of the file to save.
 */
export async function exportMatchesToExcel(filteredMatches, filename = "EgyptClubs_Matches") {
    try {
        const ExcelJS = (await import('exceljs')).default;
        const { saveAs } = (await import('file-saver'));

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Matches', {
            views: [{ showGridLines: false }]
        });

        // Columns setup
        const keys = ["DATE", "EGYPT TEAM", "GF", "GA", "OPPONENT TEAM", "CHAMPION", "SEASON", "ROUND", "H-A-N", "PLACE", "W-D-L", "CLEAN SHEET", "W-L Q & F", "NOTE"];
        worksheet.columns = keys.map(key => ({
            header: key,
            key: key,
            width: 20
        }));

        // Add rows
        const rows = filteredMatches.map(m => ({
            DATE: m.DATE || "",
            "EGYPT TEAM": m["EGYPT TEAM"] || "",
            GF: m.GF,
            GA: m.GA,
            "OPPONENT TEAM": m["OPPONENT TEAM"] || "",
            CHAMPION: m.CHAMPION || "",
            SEASON: m.SEASON || "",
            ROUND: m.ROUND || "",
            "H-A-N": m["H-A-N"] || "",
            PLACE: m.PLACE || "",
            "W-D-L": m["W-D-L"] || "",
            "CLEAN SHEET": m["CLEAN SHEET"] || "",
            "W-L Q & F": m["W-L Q & F"] || "",
            NOTE: m.NOTE || ""
        }));

        worksheet.addRows(rows);

        // Styling
        worksheet.eachRow((row, rowNumber) => {
            row.height = 25;
            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                if (rowNumber === 1) {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF000000' }
                    };
                    cell.border = { bottom: { style: 'medium', color: { argb: 'FFC9A84C' } } };
                } else {
                    cell.border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
        console.error("Export error:", err);
    }
}

/**
 * Utility function to export aggregate summary stats tables (Clubs, Opponents, Seasons, etc.)
 * 
 * @param {Array} data - Array of summary data items.
 * @param {string} fileName - Base filename to save.
 * @param {string} firstColumnKey - The data key representing the first column name (e.g., 'name', 'season', 'year').
 * @param {string} firstColumnHeader - The header label of the first column (e.g., 'EGYPT CLUB', 'OPPONENT', 'SEASON').
 */
export async function exportSummaryToExcel(data, fileName, firstColumnKey, firstColumnHeader) {
    try {
        const ExcelJS = (await import('exceljs')).default;
        const { saveAs } = (await import('file-saver'));

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Summary', {
            views: [{ showGridLines: false }]
        });

        // Columns setup
        const columns = [
            { header: firstColumnHeader, key: firstColumnKey, width: 25 },
            { header: 'PLAYED', key: 'played', width: 12 },
            { header: 'WON', key: 'wins', width: 12 },
            { header: 'WIN%', key: 'winRate', width: 12 },
            { header: 'DRAW', key: 'draws', width: 12 },
            { header: 'LOSE', key: 'losses', width: 12 },
            { header: 'GF', key: 'gf', width: 12 },
            { header: 'GA', key: 'ga', width: 12 },
            { header: 'CSF', key: 'csf', width: 12 },
            { header: 'CSA', key: 'csa', width: 12 }
        ];
        worksheet.columns = columns;

        // Add rows
        const rows = data.map(item => {
            const played = item.played || 0;
            const wins = item.wins !== undefined ? item.wins : (item.won || 0);
            const draws = item.draws !== undefined ? item.draws : (item.draw || 0);
            const losses = item.losses !== undefined ? item.losses : (item.lose || 0);
            const gf = item.gf || 0;
            const ga = item.ga || 0;
            const csf = item.csf !== undefined ? item.csf : 0;
            const csa = item.csa !== undefined ? item.csa : 0;
            const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

            return {
                [firstColumnKey]: item[firstColumnKey] || item.name || item.year || item.season || "",
                played,
                wins,
                winRate: `${winRate}%`,
                draws,
                losses,
                gf,
                ga,
                csf,
                csa
            };
        });

        // Add Grand Total
        const totals = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
        rows.forEach(r => {
            totals.played += r.played;
            totals.wins += r.wins;
            totals.draws += r.draws;
            totals.losses += r.losses;
            totals.gf += r.gf;
            totals.ga += r.ga;
            totals.csf += r.csf;
            totals.csa += r.csa;
        });
        const totalWinRate = totals.played > 0 ? Math.round((totals.wins / totals.played) * 100) : 0;

        worksheet.addRows(rows);

        worksheet.addRow({
            [firstColumnKey]: 'GRAND TOTAL',
            played: totals.played,
            wins: totals.wins,
            winRate: `${totalWinRate}%`,
            draws: totals.draws,
            losses: totals.losses,
            gf: totals.gf,
            ga: totals.ga,
            csf: totals.csf,
            csa: totals.csa
        });

        // Styling
        const totalRowsCount = worksheet.rowCount;
        worksheet.eachRow((row, rowNumber) => {
            row.height = 25;
            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                if (rowNumber === 1) {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF000000' }
                    };
                    cell.border = { bottom: { style: 'medium', color: { argb: 'FFC9A84C' } } };
                } else if (rowNumber === totalRowsCount) {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF000000' }
                    };
                    cell.border = { top: { style: 'medium', color: { argb: 'FFC9A84C' } } };
                } else {
                    cell.border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
        console.error("Export error:", err);
    }
}
