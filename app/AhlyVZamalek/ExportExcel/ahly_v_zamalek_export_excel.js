import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const AhlyVZamalekExcelExport = {
    /**
     * Exports an array of JSON objects to an Excel file with custom styling.
     * @param {Array<Object>} data - The array of objects to export.
     * @param {string} fileName - The desired name of the downloaded file.
     */
    async exportToExcel(data, fileName = "AhlyVZamalek_Data") {
        if (!data || data.length === 0) {
            console.warn("No data provided for export.");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data', {
            views: [{ showGridLines: false }] // Remove grid lines
        });

        // Generate columns dynamically from the first object
        const keys = Object.keys(data[0]);
        worksheet.columns = keys.map(key => ({
            header: key,
            key: key,
            width: 20 // Approx 150 pixels in Excel width units
        }));

        // Add rows
        worksheet.addRows(data);

        // Apply styles to all rows (including header)
        worksheet.eachRow((row, rowNumber) => {
            row.height = 25; // 30 pixels approx in Excel height units. Note: exceljs height 1 = 1.33px, so 25 height = ~33px
            
            row.eachCell((cell) => {
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                
                // Add header styling
                if (rowNumber === 1) {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF000000' } // Black background for header
                    };
                    cell.border = {
                        bottom: { style: 'medium', color: { argb: 'FFC9A84C' } } // Gold border
                    };
                } else {
                    // Optional: subtle border for data cells to look clean without gridlines
                    cell.border = {
                        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } }
                    };
                }
            });
        });

        // Generate buffer and save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${fileName}.xlsx`);
    }
};
