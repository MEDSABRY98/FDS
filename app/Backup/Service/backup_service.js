import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "../../Database";
import { resolveTableColumnOrder, FetchColumnOrder } from "../../lib/Settings_db";
import { buildStyledWorkbookBuffer } from "../Export/backup_excel";

const TABLE_RPCS = [
    "get_dbmanagement_tables",
    "get_egyptnt_tables",
    "get_egyptclub_tables",
    "get_alahly_tables",
    "get_intclub_tables",
    "get_intnt_tables",
    "get_inttrophy_tables",
];

const EXCLUDED_TABLES = new Set(["DB_SETTINGS"]);

export async function discoverAllTables() {
    const results = await Promise.all(TABLE_RPCS.map((rpc) => supabase.rpc(rpc)));

    const names = new Set();
    for (const res of results) {
        if (res.error) {
            throw new Error(`Failed to discover tables: ${res.error.message}`);
        }
        if (res.data) {
            for (const t of res.data) {
                const name = t.table_name;
                if (!EXCLUDED_TABLES.has(name.toUpperCase())) {
                    names.add(name);
                }
            }
        }
    }

    return [...names].sort((a, b) => a.localeCompare(b));
}

export async function fetchAllRowsForTable(tableName) {
    let allData = [];
    let from = 0;
    const step = 1000;
    let finished = false;

    while (!finished) {
        const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += step;
            if (data.length < step) finished = true;
        } else {
            finished = true;
        }
    }

    return allData;
}

async function resolveColumnsForExport(tableName, rows) {
    if (rows.length > 0) {
        const keys = Object.keys(rows[0]);
        return resolveTableColumnOrder(tableName, keys);
    }

    const saved = await FetchColumnOrder(tableName);
    return saved?.length ? saved : [];
}

function buildExportRows(rows, columns) {
    return rows.map((row) => {
        const newRow = {};
        columns.forEach((col) => {
            newRow[col] = row[col];
        });
        return newRow;
    });
}

function formatBackupZipName() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `FDS_Backup_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.zip`;
}

/**
 * Fetches every table, builds styled Excel files, and downloads a single ZIP.
 * @param {(progress: { current: number, total: number, tableName: string }) => void} onProgress
 */
export async function runFullBackup(onProgress) {
    const tables = await discoverAllTables();
    const zip = new JSZip();
    const total = tables.length;

    for (let i = 0; i < tables.length; i++) {
        const tableName = tables[i];
        onProgress?.({ current: i + 1, total, tableName });

        const rows = await fetchAllRowsForTable(tableName);
        const columns = await resolveColumnsForExport(tableName, rows);
        const exportRows = buildExportRows(rows, columns);
        const buffer = await buildStyledWorkbookBuffer(exportRows, columns);
        zip.file(`${tableName}.xlsx`, buffer);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, formatBackupZipName());

    return { tableCount: total };
}
