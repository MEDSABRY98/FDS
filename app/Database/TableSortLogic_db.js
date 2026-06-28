// Table column order + data sort logic (stored in db_Settings.SORTING)

export const LEGACY_SORT_MAP = {
    ROW_ID: [{ column: "ROW_ID", direction: "desc" }],
    DATE: [
        { column: "DATE", direction: "desc" },
        { column: "ROW_ID", direction: "desc" },
    ],
    EVENT_ID: [{ column: "EVENT_ID", direction: "desc" }],
    DATE_ASC_EVENT_ID: [
        { column: "DATE", direction: "asc" },
        { column: "MATCH_ID", direction: "desc" },
        { column: "EVENT_ID", direction: "desc" },
    ],
    DATE_DESC_EVENT_ID: [
        { column: "DATE", direction: "desc" },
        { column: "MATCH_ID", direction: "desc" },
        { column: "EVENT_ID", direction: "desc" },
    ],
    DATE_DESC_ROW_ID: [
        { column: "DATE", direction: "desc" },
        { column: "ROW_ID", direction: "desc" },
    ],
};

const SORT_COLUMN_FALLBACKS = {
    ROW_ID: ["ROW_ID", "MATCH_ID", "EVENT_ID", "FINAL_ID"],
    DATE: ["DATE"],
    EVENT_ID: ["EVENT_ID", "MATCH_ID"],
    MATCH_ID: ["MATCH_ID", "EVENT_ID"],
    FINAL_ID: ["FINAL_ID", "MATCH_ID"],
};

const ID_SORT_COLUMNS = new Set([
    "ROW_ID",
    "EVENT_ID",
    "MATCH_ID",
    "PLAYER_ID",
    "MANAGER_ID",
    "REFEREE_ID",
    "TEAM_ID",
    "STADIUM_ID",
    "COUNTRY_ID",
]);

function normalizeDirection(direction) {
    const value = String(direction || "off").toLowerCase();
    if (value === "asc" || value === "desc") return value;
    return "off";
}

function findDefaultSortColumn(columns = []) {
    const upperCols = columns.map((column) => String(column).toUpperCase());
    const rowIdIndex = upperCols.indexOf("ROW_ID");
    if (rowIdIndex !== -1) return columns[rowIdIndex];

    const eventIdIndex = upperCols.indexOf("EVENT_ID");
    if (eventIdIndex !== -1) return columns[eventIdIndex];

    const matchIdIndex = upperCols.indexOf("MATCH_ID");
    if (matchIdIndex !== -1) return columns[matchIdIndex];

    const entityId = columns.find((column) => {
        const upper = String(column).toUpperCase();
        return upper.endsWith("_ID") && upper !== "ROW_ID";
    });
    return entityId || columns[0] || null;
}

function buildDefaultTableSortRules(columns = []) {
    const defaultColumn = findDefaultSortColumn(columns);
    return columns.map((column) => ({
        column,
        direction: column === defaultColumn ? "desc" : "off",
    }));
}

function resolveSortColumn(requestedColumn, columns = []) {
    const key = String(requestedColumn || "").toUpperCase();
    const candidates = SORT_COLUMN_FALLBACKS[key] || [key];

    for (const candidate of candidates) {
        const match = findSchemaColumn(columns, candidate);
        if (match) return match;
    }

    return findDefaultSortColumn(columns);
}

function parseJsonSettingsPayload(raw) {
    if (raw == null) return null;
    if (typeof raw === "object") return raw;

    const trimmed = String(raw).trim();
    if (!trimmed || trimmed === "[object Object]") return null;

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return null;
        }
    }

    return null;
}

function parseDataSortPresetFromSetting(raw) {
    const stored = parseJsonSettingsPayload(raw);
    const preset = String(stored?.dataSortPreset || "").trim().toUpperCase();
    return LEGACY_SORT_MAP[preset] ? preset : null;
}

function extractSortRulesFromPayload(payload) {
    if (!payload) return null;
    if (Array.isArray(payload?.sortRules) && payload.sortRules.length > 0) {
        return payload.sortRules;
    }
    const rules = Array.isArray(payload) ? payload : payload?.rules;
    if (Array.isArray(rules) && rules.length > 0) return rules;
    return null;
}

function mergeSortRulesWithColumns(savedRules = [], columns = []) {
    const directionByColumn = new Map();
    const orderedColumns = [];

    savedRules.forEach((rule) => {
        const match = findSchemaColumn(columns, rule?.column);
        if (!match || orderedColumns.includes(match)) return;
        orderedColumns.push(match);
        directionByColumn.set(match, normalizeDirection(rule?.direction));
    });

    columns.forEach((column) => {
        if (!orderedColumns.includes(column)) {
            orderedColumns.push(column);
            directionByColumn.set(column, "off");
        }
    });

    return orderedColumns.map((column) => ({
        column,
        direction: directionByColumn.get(column) || "off",
    }));
}

export function parseTableSortSetting(raw, columns = []) {
    if (raw == null) return buildDefaultTableSortRules(columns);

    const rules = extractSortRulesFromPayload(parseJsonSettingsPayload(raw));
    if (rules) return mergeSortRulesWithColumns(rules, columns);

    const trimmed = String(raw).trim();
    const legacyRules = LEGACY_SORT_MAP[trimmed.toUpperCase()];
    if (legacyRules) return mergeSortRulesWithColumns(legacyRules, columns);

    return buildDefaultTableSortRules(columns);
}

function getActiveRulesSignature(raw, columns = []) {
    const rules = parseTableSortSetting(raw, columns);
    return getActiveTableSortRules(rules).map((rule) => ({
        column: String(rule.column).toUpperCase(),
        direction: normalizeDirection(rule.direction),
    }));
}

export function detectDataSortPresetKey(raw, columns = []) {
    const storedPreset = parseDataSortPresetFromSetting(raw);
    if (storedPreset) return storedPreset;

    const trimmed = String(raw ?? "").trim();
    if (LEGACY_SORT_MAP[trimmed.toUpperCase()]) {
        return trimmed.toUpperCase();
    }

    const current = getActiveRulesSignature(raw, columns);
    for (const [key, legacyRules] of Object.entries(LEGACY_SORT_MAP)) {
        const preset = legacyRules.map((rule) => ({
            column: String(rule.column).toUpperCase(),
            direction: normalizeDirection(rule.direction),
        }));
        if (JSON.stringify(current) === JSON.stringify(preset)) {
            return key;
        }
    }

    return "ROW_ID";
}

export function getPresetSortRules(presetKey, columns = []) {
    const legacyRules = LEGACY_SORT_MAP[presetKey] || LEGACY_SORT_MAP.ROW_ID;
    const resolvedRules = [];
    const usedColumns = new Set();

    legacyRules.forEach((rule) => {
        const column = resolveSortColumn(rule.column, columns);
        if (!column || usedColumns.has(column)) return;
        usedColumns.add(column);
        resolvedRules.push({ column, direction: rule.direction });
    });

    if (resolvedRules.length === 0) {
        const fallbackColumn = findDefaultSortColumn(columns);
        if (fallbackColumn) {
            resolvedRules.push({ column: fallbackColumn, direction: "desc" });
        }
    }

    return mergeSortRulesWithColumns(resolvedRules, columns);
}

export function getActiveTableSortRules(rules = []) {
    return (rules || []).filter((rule) => normalizeDirection(rule.direction) !== "off");
}

function findSchemaColumn(schemaColumns = [], name) {
    const target = String(name || "").trim().toUpperCase();
    if (!target) return null;
    return schemaColumns.find((column) => String(column).toUpperCase() === target) || null;
}

function mergeColumnOrderWithSchema(savedOrder = [], schemaColumns = []) {
    const ordered = [];
    const seen = new Set();

    savedOrder.forEach((column) => {
        const match = findSchemaColumn(schemaColumns, column);
        if (!match || seen.has(match)) return;
        seen.add(match);
        ordered.push(match);
    });

    schemaColumns.forEach((column) => {
        if (!seen.has(column)) {
            ordered.push(column);
        }
    });

    return ordered;
}

export function parseColumnOrderFromSetting(raw, schemaColumns = []) {
    const payload = parseJsonSettingsPayload(raw);
    if (Array.isArray(payload?.columnOrder) && payload.columnOrder.length > 0) {
        if (!schemaColumns?.length) {
            return payload.columnOrder.map((column) => String(column).toUpperCase());
        }
        return mergeColumnOrderWithSchema(payload.columnOrder, schemaColumns);
    }
    return null;
}

export function serializeTableSettings({ columnOrder = [], sortRules = [], dataSortPreset = null } = {}) {
    const payload = {
        columnOrder: (columnOrder || []).map((column) => String(column).toUpperCase()),
        sortRules: (sortRules || []).map((rule) => ({
            column: rule.column,
            direction: normalizeDirection(rule.direction),
        })),
    };

    const preset = String(dataSortPreset || "").trim().toUpperCase();
    if (LEGACY_SORT_MAP[preset]) {
        payload.dataSortPreset = preset;
    }

    return JSON.stringify(payload);
}

function parseTrailingIdNumber(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    const trailingNumber = raw.match(/(\d+)(?!.*\d)/);
    if (trailingNumber) return parseInt(trailingNumber[1], 10);
    const asNum = parseInt(raw, 10);
    return Number.isFinite(asNum) ? asNum : 0;
}

function parseDateSortValue(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return 0;

    const timestamp = Date.parse(raw);
    if (Number.isFinite(timestamp)) return timestamp;

    const parts = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10) - 1;
        let year = parseInt(parts[3], 10);
        if (year < 100) year += 2000;
        const parsed = new Date(year, month, day).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function compareCellValues(aValue, bValue, columnName) {
    const upperColumn = String(columnName || "").toUpperCase();

    if (upperColumn === "DATE") {
        return parseDateSortValue(aValue) - parseDateSortValue(bValue);
    }

    if (ID_SORT_COLUMNS.has(upperColumn) || upperColumn.endsWith("_ID")) {
        const diff = parseTrailingIdNumber(aValue) - parseTrailingIdNumber(bValue);
        if (diff !== 0) return diff;
    }

    const aRaw = String(aValue ?? "").trim();
    const bRaw = String(bValue ?? "").trim();
    const aNum = Number(aRaw);
    const bNum = Number(bRaw);
    if (aRaw !== "" && bRaw !== "" && Number.isFinite(aNum) && Number.isFinite(bNum)) {
        return aNum - bNum;
    }

    return aRaw.localeCompare(bRaw, undefined, { numeric: true, sensitivity: "base" });
}

export function sortRowsByTableSortRules(rows, columns = [], rules = []) {
    if (!Array.isArray(rows) || rows.length === 0) return rows;

    const activeRules = getActiveTableSortRules(rules);
    if (activeRules.length === 0) return rows;

    return [...rows].sort((rowA, rowB) => {
        for (const rule of activeRules) {
            const column = findSchemaColumn(columns, rule.column);
            if (!column) continue;

            const diff = compareCellValues(rowA?.[column], rowB?.[column], column);
            if (diff !== 0) {
                return normalizeDirection(rule.direction) === "asc" ? diff : -diff;
            }
        }
        return 0;
    });
}
