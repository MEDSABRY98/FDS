"use client";

import { useEffect, useMemo, useState } from "react";
import { GripVertical, Save, RotateCcw, Languages, Columns3, ArrowDownUp, ChevronLeft, ChevronRight } from "lucide-react";
import DropDownList_db from "./DropDownList_db";
import Loading_db from "./Loading_db";
import NoData_db from "./NoData_db";
import {
    FetchNameDisplayLang,
    SaveNameDisplayLang,
    FetchTableSortSetting,
    SaveTableSettings,
    NAME_DISPLAY_LANG_OPTIONS,
    supabase,
} from "./supabase";
import "./Settings_db.css";

function notifyTableSettingsSaved(tableName) {
    if (typeof window === "undefined" || !tableName) return;
    window.dispatchEvent(
        new CustomEvent("fdbase-table-settings-saved", { detail: { tableName } })
    );
}

// --- Table column order + data sort logic (stored in db_Settings.SORTING) ---

const DATA_SORT_PRESET_OPTIONS = [
    { value: "ROW_ID", label: "ROW_ID" },
    { value: "DATE", label: "Date (newest first)" },
    { value: "EVENT_ID", label: "EVENT_ID" },
    {
        value: "DATE_ASC_EVENT_ID",
        label: "Date oldest → newest, then MATCH_ID, then EVENT_ID",
    },
    {
        value: "DATE_DESC_EVENT_ID",
        label: "Date newest → oldest, then MATCH_ID, then EVENT_ID",
    },
    {
        value: "DATE_DESC_ROW_ID",
        label: "Date newest → oldest, then ROW_ID",
    },
];

const SETTINGS_TABS = {
    DISPLAY: "display",
    COLUMNS: "columns",
    DATA_SORT: "data-sort",
};

const LEGACY_SORT_MAP = {
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

function detectDataSortPresetKey(raw, columns = []) {
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

function getPresetSortRules(presetKey, columns = []) {
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

async function getExistingSettingsBundle(tableName) {
    const dbCols = await fetchTableColumnNames(tableName);
    const raw = await FetchTableSortSetting(tableName);
    const orderedColumns = await resolveTableColumnOrder(tableName, dbCols, raw);
    const sortRules = parseTableSortSetting(raw, orderedColumns);
    const dataSortPreset = detectDataSortPresetKey(raw, orderedColumns);
    return { dbCols, orderedColumns, raw, sortRules, dataSortPreset };
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

export async function FetchColumnOrder(tableName) {
    if (!tableName) return null;
    try {
        const raw = await FetchTableSortSetting(tableName);
        return parseColumnOrderFromSetting(raw);
    } catch (err) {
        console.error("Failed to fetch column order:", err);
        return null;
    }
}

export function applyDefaultColumnOrder(columns) {
    const sortedCols = [...columns];
    const rowIdIdx = sortedCols.findIndex((c) => c.toUpperCase() === "ROW_ID");
    if (rowIdIdx > -1) {
        const rowIdKey = sortedCols[rowIdIdx];
        sortedCols.splice(rowIdIdx, 1);
        sortedCols.unshift(rowIdKey);
    }
    return sortedCols;
}

export async function resolveTableColumnOrder(tableName, columns, rawSetting = undefined) {
    const raw = rawSetting !== undefined ? rawSetting : await FetchTableSortSetting(tableName);
    const savedOrder = parseColumnOrderFromSetting(raw, columns);
    if (savedOrder?.length) {
        return savedOrder;
    }
    return applyDefaultColumnOrder(columns);
}

export function SortByColumnOrder(Items, ColumnOrder, GetColumnName) {
    if (!ColumnOrder?.length || !Items?.length) return Items;

    const NormalizedOrder = ColumnOrder.map((Col) => Col.toUpperCase());
    const Indexed = Items.map((Item, Index) => ({ Item, DefaultIndex: Index }));

    Indexed.sort((A, B) => {
        const ColA = GetColumnName(A.Item);
        const ColB = GetColumnName(B.Item);
        const NormA = ColA ? String(ColA).toUpperCase() : null;
        const NormB = ColB ? String(ColB).toUpperCase() : null;

        if (!NormA && !NormB) return A.DefaultIndex - B.DefaultIndex;
        if (!NormA) return 1;
        if (!NormB) return -1;

        const IdxA = NormalizedOrder.indexOf(NormA);
        const IdxB = NormalizedOrder.indexOf(NormB);

        if (IdxA === -1 && IdxB === -1) return A.DefaultIndex - B.DefaultIndex;
        if (IdxA === -1) return 1;
        if (IdxB === -1) return -1;
        if (IdxA !== IdxB) return IdxA - IdxB;
        return A.DefaultIndex - B.DefaultIndex;
    });

    return Indexed.map(({ Item }) => Item);
}

export function SortColumnNames(Columns, ColumnOrder) {
    return SortByColumnOrder(Columns, ColumnOrder, (Col) => Col);
}

export function SortFilterFields(Fields, ColumnOrder) {
    return SortByColumnOrder(Fields, ColumnOrder, (Field) => Field.dbColumn);
}

export function UseColumnOrder(TableName) {
    const [ColumnOrder, SetColumnOrder] = useState(null);

    useEffect(() => {
        let Cancelled = false;
        FetchColumnOrder(TableName).then((Order) => {
            if (!Cancelled) SetColumnOrder(Order);
        });
        return () => { Cancelled = true; };
    }, [TableName]);

    return ColumnOrder;
}

async function fetchAllManagementTables() {
    const [alahlyRes, dbManagementRes, egyptclubRes, egyptntRes] = await Promise.all([
        supabase.rpc("get_alahly_tables"),
        supabase.rpc("get_dbmanagement_tables"),
        supabase.rpc("get_egyptclub_tables"),
        supabase.rpc("get_egyptnt_tables"),
    ]);

    let all = [];
    if (alahlyRes.data) {
        all = [...all, ...alahlyRes.data.map((t) => ({
            name: t.table_name,
            label: `AL AHLY: ${t.table_name.replace("alahly_", "").replace(/_/g, " ").toUpperCase()}`,
        }))];
    }
    if (dbManagementRes.data) {
        all = [...all, ...dbManagementRes.data
            .filter((t) => {
                const name = t.table_name.toUpperCase();
                return name !== "DB_SETTINGS";
            })
            .map((t) => ({
                name: t.table_name,
                label: `GLOBAL: ${t.table_name.replace("db_", "").replace(/_/g, " ").toUpperCase()}`,
            }))];
    }
    if (egyptclubRes.data) {
        all = [...all, ...egyptclubRes.data.map((t) => ({
            name: t.table_name,
            label: `EGYPT CLUB: ${t.table_name.replace("egy_CLUB_", "").replace(/_/g, " ").toUpperCase()}`,
        }))];
    }
    if (egyptntRes.data) {
        all = [...all, ...egyptntRes.data.map((t) => ({
            name: t.table_name,
            label: `EGYPT NT: ${t.table_name.replace("egy_NT_", "").replace(/_/g, " ").toUpperCase()}`,
        }))];
    }

    return all.sort((a, b) => a.label.localeCompare(b.label));
}

async function fetchTableColumnNames(tableName) {
    const { data: schemaCols, error: schemaError } = await supabase
        .rpc("get_table_columns", { target_table: tableName });
    if (schemaError) throw schemaError;
    return (schemaCols || []).map((row) => row.column_name);
}

async function loadOrderedColumnsForTable(tableName) {
    const dbCols = await fetchTableColumnNames(tableName);
    return resolveTableColumnOrder(tableName, dbCols);
}

function formatTableLabel(tableName) {
    return tableName
        .replace("alahly_", "")
        .replace("db_", "")
        .replace("egy_CLUB_", "")
        .replace("egy_NT_", "")
        .replace(/_/g, " ")
        .toUpperCase();
}

function useSettingsTableSelection(tablesList) {
    const [selectedTable, setSelectedTable] = useState("");

    useEffect(() => {
        if (tablesList.length > 0 && !selectedTable) {
            setSelectedTable(tablesList[0].name);
        }
    }, [tablesList, selectedTable]);

    const tableOptions = useMemo(
        () => tablesList.map((table) => ({ value: table.name, label: table.label })),
        [tablesList]
    );

    return { selectedTable, setSelectedTable, tableOptions };
}

function SettingsTableToolbar({
    tableOptions,
    selectedTable,
    onTableChange,
    onSave,
    onReset,
    saving,
    loading,
    saveDisabled,
}) {
    const currentIndex = useMemo(() => {
        const index = tableOptions.findIndex((option) => option.value === selectedTable);
        return index >= 0 ? index : 0;
    }, [tableOptions, selectedTable]);

    const canGoPrev = tableOptions.length > 1 && currentIndex > 0;
    const canGoNext = tableOptions.length > 1 && currentIndex < tableOptions.length - 1;
    const isDisabled = loading || saving || tableOptions.length === 0;

    const goToAdjacentTable = (delta) => {
        const nextOption = tableOptions[currentIndex + delta];
        if (nextOption) onTableChange(nextOption.value);
    };

    return (
        <div className="settings-columns-toolbar">
            <div className={`settings-toolbar-field ${isDisabled ? "is-disabled" : ""}`}>
                <label>Target table</label>
                <div className="settings-table-picker">
                    <DropDownList_db
                        className="settings-table-dropdown"
                        options={tableOptions}
                        value={selectedTable}
                        onChange={onTableChange}
                        placeholder="Select table..."
                        searchable={true}
                    />
                    <div className="settings-table-nav-group">
                        {tableOptions.length > 0 && (
                            <span className="settings-table-nav-count" aria-live="polite">
                                {currentIndex + 1} / {tableOptions.length}
                            </span>
                        )}
                        <button
                            type="button"
                            className="settings-table-nav-btn"
                            onClick={() => goToAdjacentTable(-1)}
                            disabled={isDisabled || !canGoPrev}
                            title="Previous table"
                            aria-label="Previous table"
                        >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>
                        <button
                            type="button"
                            className="settings-table-nav-btn"
                            onClick={() => goToAdjacentTable(1)}
                            disabled={isDisabled || !canGoNext}
                            title="Next table"
                            aria-label="Next table"
                        >
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-toolbar-actions">
                <button
                    className="settings-action-btn settings-action-btn--save"
                    onClick={onSave}
                    disabled={loading || saving || saveDisabled}
                    title="Save settings"
                    type="button"
                >
                    {saving ? <span className="btn-spinner" /> : <Save size={15} strokeWidth={2.5} />}
                    <span>Save</span>
                </button>
                <button
                    className="settings-action-btn settings-action-btn--reset"
                    onClick={onReset}
                    disabled={loading || saving || saveDisabled}
                    title="Reset to defaults"
                    type="button"
                >
                    <RotateCcw size={15} strokeWidth={2.5} />
                    <span>Reset</span>
                </button>
            </div>
        </div>
    );
}

function SettingsColumnOrderSection({ addNotification, tablesList }) {
    const { selectedTable, setSelectedTable, tableOptions } = useSettingsTableSelection(tablesList);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draggingIndex, setDraggingIndex] = useState(null);

    const loadColumnOrder = async (tableName) => {
        if (!tableName) return;
        setLoading(true);
        setRows([]);
        try {
            const orderedColumns = await loadOrderedColumnsForTable(tableName);
            setRows(orderedColumns.map((column) => ({ column })));
        } catch (err) {
            addNotification?.("Failed to load column order: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTable) loadColumnOrder(selectedTable);
    }, [selectedTable]);

    const moveRow = (fromIndex, toIndex) => {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
        setRows((prev) => {
            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
    };

    const handleSave = async () => {
        if (!selectedTable || rows.length === 0) return;
        setSaving(true);
        try {
            const { sortRules, dataSortPreset } = await getExistingSettingsBundle(selectedTable);
            const columnOrder = rows.map((row) => row.column.toUpperCase());
            await SaveTableSettings(selectedTable, { columnOrder, sortRules, dataSortPreset });
            notifyTableSettingsSaved(selectedTable);
            addNotification?.(`Column order saved for ${formatTableLabel(selectedTable)}`, "success");
        } catch (err) {
            addNotification?.("Failed to save column order: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!selectedTable) return;
        if (!confirm("Reset column display order to defaults for this table?")) return;
        setSaving(true);
        try {
            const { dbCols, sortRules, dataSortPreset } = await getExistingSettingsBundle(selectedTable);
            const columnOrder = applyDefaultColumnOrder(dbCols).map((column) => column.toUpperCase());
            await SaveTableSettings(selectedTable, { columnOrder, sortRules, dataSortPreset });
            notifyTableSettingsSaved(selectedTable);
            await loadColumnOrder(selectedTable);
            addNotification?.("Column order reset to defaults.", "success");
        } catch (err) {
            addNotification?.("Failed to reset column order: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="settings-card settings-card--columns">
            <div className="settings-card-head settings-card-head--dark">
                <div className="settings-card-head-main">
                    <Columns3 size={18} strokeWidth={2.2} />
                    <div>
                        <h3>Column Order</h3>
                        <p>Drag rows to set how columns appear in management tables</p>
                    </div>
                </div>
                {rows.length > 0 && (
                    <div className="settings-card-head-meta">
                        <span className="settings-stat-pill">{rows.length} columns</span>
                    </div>
                )}
            </div>

            <SettingsTableToolbar
                tableOptions={tableOptions}
                selectedTable={selectedTable}
                onTableChange={setSelectedTable}
                onSave={handleSave}
                onReset={handleReset}
                saving={saving}
                loading={loading}
                saveDisabled={rows.length === 0}
            />

            {loading ? (
                <div className="settings-panel-loading">
                    <Loading_db inline={true} />
                </div>
            ) : rows.length === 0 ? (
                <NoData_db message="NO COLUMNS FOUND FOR THIS TABLE" height="160px" />
            ) : (
                <div className="settings-columns-scroll">
                    <div className="settings-columns-table settings-columns-table--order">
                        <div className="settings-columns-head">
                            <span className="col-grip">Order</span>
                            <span className="col-name">Column</span>
                        </div>

                        <div className="settings-columns-body">
                            {rows.map((row, index) => (
                                <div
                                    key={row.column}
                                    className={`settings-columns-row ${draggingIndex === index ? "is-dragging" : ""}`}
                                    draggable={!saving}
                                    onDragStart={() => setDraggingIndex(index)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        if (draggingIndex === null || draggingIndex === index) return;
                                        moveRow(draggingIndex, index);
                                        setDraggingIndex(null);
                                    }}
                                    onDragEnd={() => setDraggingIndex(null)}
                                >
                                    <div className="col-grip" title="Drag to reorder">
                                        <GripVertical size={15} aria-hidden="true" />
                                        <span className="col-index">{index + 1}</span>
                                    </div>
                                    <span className="col-name" title={row.column}>
                                        {row.column}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function SettingsOptionGrid({ options, value, onChange, disabled = false, stacked = false }) {
    return (
        <div className={`settings-option-grid ${stacked ? "settings-option-grid--stack" : ""}`}>
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        className={`settings-option-card ${isSelected ? "is-selected" : ""}`}
                        onClick={() => onChange(option.value)}
                        disabled={disabled}
                        aria-pressed={isSelected}
                    >
                        <span className="settings-option-card-label">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function SettingsDataSortSection({ addNotification, tablesList }) {
    const { selectedTable, setSelectedTable, tableOptions } = useSettingsTableSelection(tablesList);
    const [dataSortPreset, setDataSortPreset] = useState("ROW_ID");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadDataSort = async (tableName) => {
        if (!tableName) return;
        setLoading(true);
        try {
            const { dataSortPreset: savedPreset } = await getExistingSettingsBundle(tableName);
            setDataSortPreset(savedPreset);
        } catch (err) {
            addNotification?.("Failed to load data sort: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTable) loadDataSort(selectedTable);
    }, [selectedTable]);

    const selectedPresetLabel = useMemo(
        () => DATA_SORT_PRESET_OPTIONS.find((option) => option.value === dataSortPreset)?.label || dataSortPreset,
        [dataSortPreset]
    );

    const handleSave = async () => {
        if (!selectedTable) return;
        setSaving(true);
        try {
            const { orderedColumns } = await getExistingSettingsBundle(selectedTable);
            const sortRules = getPresetSortRules(dataSortPreset, orderedColumns);
            const columnOrder = orderedColumns.map((column) => column.toUpperCase());
            await SaveTableSettings(selectedTable, {
                columnOrder,
                sortRules,
                dataSortPreset,
            });
            notifyTableSettingsSaved(selectedTable);
            addNotification?.(`Data sort saved for ${formatTableLabel(selectedTable)}`, "success");
        } catch (err) {
            addNotification?.("Failed to save data sort: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!selectedTable) return;
        if (!confirm("Reset data sort logic to ROW_ID for this table?")) return;
        setSaving(true);
        try {
            const { orderedColumns } = await getExistingSettingsBundle(selectedTable);
            const sortRules = getPresetSortRules("ROW_ID", orderedColumns);
            const columnOrder = orderedColumns.map((column) => column.toUpperCase());
            await SaveTableSettings(selectedTable, {
                columnOrder,
                sortRules,
                dataSortPreset: "ROW_ID",
            });
            notifyTableSettingsSaved(selectedTable);
            setDataSortPreset("ROW_ID");
            addNotification?.("Data sort reset to ROW_ID.", "success");
        } catch (err) {
            addNotification?.("Failed to reset data sort: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="settings-card settings-card--columns">
            <div className="settings-card-head settings-card-head--dark">
                <div className="settings-card-head-main">
                    <ArrowDownUp size={18} strokeWidth={2.2} />
                    <div>
                        <h3>Data Sort Logic</h3>
                        <p>Choose how rows are ordered when the table loads</p>
                    </div>
                </div>
                <div className="settings-card-head-meta">
                    <span className="settings-stat-pill settings-stat-pill--gold">{selectedPresetLabel}</span>
                </div>
            </div>

            <SettingsTableToolbar
                tableOptions={tableOptions}
                selectedTable={selectedTable}
                onTableChange={setSelectedTable}
                onSave={handleSave}
                onReset={handleReset}
                saving={saving}
                loading={loading}
                saveDisabled={!selectedTable}
            />

            {loading ? (
                <div className="settings-panel-loading">
                    <Loading_db inline={true} />
                </div>
            ) : (
                <div className="settings-data-sort-body">
                    <p className="settings-data-sort-hint">
                        Pick how rows are ordered when the table loads, then press Save.
                    </p>
                    <SettingsOptionGrid
                        options={DATA_SORT_PRESET_OPTIONS}
                        value={dataSortPreset}
                        onChange={setDataSortPreset}
                        disabled={loading || saving}
                        stacked={true}
                    />
                </div>
            )}
        </section>
    );
}

function SettingsDisplaySection({ nameDisplayLang, savingLang, onNameLangChange }) {
    return (
        <section className="settings-card settings-card--display">
            <div className="settings-card-head settings-card-head--dark">
                <div className="settings-card-head-main">
                    <Languages size={18} strokeWidth={2.2} />
                    <div>
                        <h3>Display Data</h3>
                        <p>Choose which name language appears in catalog columns</p>
                    </div>
                </div>
            </div>
            <div className={`settings-display-body ${savingLang ? "is-saving" : ""}`}>
                <SettingsOptionGrid
                    options={NAME_DISPLAY_LANG_OPTIONS}
                    value={nameDisplayLang}
                    onChange={onNameLangChange}
                    disabled={savingLang}
                />
            </div>
        </section>
    );
}

function SettingsTabsNav({ activeTab, onChange }) {
    const tabs = [
        { id: SETTINGS_TABS.DISPLAY, label: "Display Data", icon: Languages },
        { id: SETTINGS_TABS.COLUMNS, label: "Column Order", icon: Columns3 },
        { id: SETTINGS_TABS.DATA_SORT, label: "Data Sort Logic", icon: ArrowDownUp },
    ];

    return (
        <nav className="settings-tabs" aria-label="Settings sections">
            {tabs.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    type="button"
                    className={`settings-tab-btn ${activeTab === id ? "is-active" : ""}`}
                    onClick={() => onChange(id)}
                >
                    <Icon size={16} strokeWidth={2.2} />
                    <span>{label}</span>
                </button>
            ))}
        </nav>
    );
}

export default function Settings_db({ addNotification }) {
    const [nameDisplayLang, setNameDisplayLang] = useState("auto");
    const [tablesList, setTablesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingLang, setSavingLang] = useState(false);
    const [activeTab, setActiveTab] = useState(SETTINGS_TABS.DISPLAY);

    useEffect(() => {
        let cancelled = false;

        const loadSettings = async () => {
            setLoading(true);
            try {
                const [displayLang, tables] = await Promise.all([
                    FetchNameDisplayLang(),
                    fetchAllManagementTables(),
                ]);
                if (!cancelled) {
                    setNameDisplayLang(displayLang);
                    setTablesList(tables);
                }
            } catch (err) {
                if (!cancelled) {
                    addNotification?.("Failed to load settings: " + err.message, "error");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadSettings();
        return () => { cancelled = true; };
    }, [addNotification]);

    const handleNameLangChange = async (lang) => {
        setSavingLang(true);
        setNameDisplayLang(lang);

        try {
            await SaveNameDisplayLang(lang);
            addNotification?.(
                lang === "en"
                    ? "Name display set to English across the app."
                    : lang === "ar"
                        ? "تم تعيين عرض الأسماء بالعربية في التطبيق."
                        : "Name display set to automatic — shows whichever name is available in each row.",
                "success"
            );
        } catch (err) {
            setNameDisplayLang(await FetchNameDisplayLang());
            addNotification?.("Failed to save name display language: " + err.message, "error");
        } finally {
            setSavingLang(false);
        }
    };

    if (loading) {
        return <Loading_db inline={true} />;
    }

    return (
        <div className="settings-shell settings-db-unified">
            <header className="settings-hero">
                <div className="settings-hero-main">
                    <span className="settings-hero-kicker">Global Management</span>
                    <h2>Settings</h2>
                </div>
            </header>

            <SettingsTabsNav activeTab={activeTab} onChange={setActiveTab} />

            <div className="settings-layout">
                {activeTab === SETTINGS_TABS.DISPLAY && (
                    <SettingsDisplaySection
                        nameDisplayLang={nameDisplayLang}
                        savingLang={savingLang}
                        onNameLangChange={handleNameLangChange}
                    />
                )}

                {activeTab === SETTINGS_TABS.COLUMNS && (
                    tablesList.length > 0 ? (
                        <SettingsColumnOrderSection
                            addNotification={addNotification}
                            tablesList={tablesList}
                        />
                    ) : (
                        <div className="settings-card settings-card--empty">
                            <div className="settings-db-empty">No tables available for column settings.</div>
                        </div>
                    )
                )}

                {activeTab === SETTINGS_TABS.DATA_SORT && (
                    tablesList.length > 0 ? (
                        <SettingsDataSortSection
                            addNotification={addNotification}
                            tablesList={tablesList}
                        />
                    ) : (
                        <div className="settings-card settings-card--empty">
                            <div className="settings-db-empty">No tables available for data sort settings.</div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
