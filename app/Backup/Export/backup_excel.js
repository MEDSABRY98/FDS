import ExcelJS from "exceljs";

function applyWorksheetStyles(worksheet) {
    worksheet.eachRow((row, rowNumber) => {
        row.height = 25;

        row.eachCell((cell) => {
            cell.alignment = {
                vertical: "middle",
                horizontal: "center",
                wrapText: true,
            };

            if (rowNumber === 1) {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF000000" },
                };
                cell.border = {
                    bottom: { style: "medium", color: { argb: "FFC9A84C" } },
                };
            } else {
                cell.border = {
                    bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
                };
            }
        });
    });
}

/**
 * Builds a styled Excel workbook buffer (black header, gold border, no grid lines).
 * @param {Array<Object>} rows - Export rows keyed by column name.
 * @param {Array<string>} columns - Ordered column names.
 * @returns {Promise<ArrayBuffer>}
 */
export async function buildStyledWorkbookBuffer(rows, columns) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data", {
        views: [{ showGridLines: false }],
    });

    const keys = columns?.length
        ? columns
        : rows?.length > 0
            ? Object.keys(rows[0])
            : [];

    if (keys.length === 0) {
        return workbook.xlsx.writeBuffer();
    }

    worksheet.columns = keys.map((key) => ({
        header: key,
        key,
        width: 20,
    }));

    if (rows?.length > 0) {
        worksheet.addRows(rows);
    } else {
        keys.forEach((key, idx) => {
            worksheet.getRow(1).getCell(idx + 1).value = key;
        });
    }

    applyWorksheetStyles(worksheet);

    return workbook.xlsx.writeBuffer();
}
