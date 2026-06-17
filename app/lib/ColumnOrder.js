"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";
import DropDownList_db from "./DropDownList_db";
import NoData_db from "./NoData_db";
import { GripVertical, ArrowUp, ArrowDown, Save, RotateCcw, Sparkles } from "lucide-react";

export async function FetchColumnOrder(TableName) {
    if (!TableName) return null;
    try {
        const { data: Data } = await supabase
            .from("db_COLUMN_ORDERS")
            .select("COLUMN_ORDER")
            .eq("TABLE_NAME", TableName)
            .maybeSingle();
        return Data?.COLUMN_ORDER || null;
    } catch (Err) {
        console.error("Failed to fetch column order:", Err);
        return null;
    }
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

function applyDefaultColumnOrder(columns) {
    const sortedCols = [...columns];
    const rowIdIdx = sortedCols.findIndex((c) => c.toUpperCase() === "ROW_ID");
    if (rowIdIdx > -1) {
        const rowIdKey = sortedCols[rowIdIdx];
        sortedCols.splice(rowIdIdx, 1);
        sortedCols.unshift(rowIdKey);
    }
    return sortedCols;
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
        all = [...all, ...dbManagementRes.data.map((t) => ({
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

export function ColumnSortView({ addNotification }) {
    const [tablesList, setTablesList] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draggingIndex, setDraggingIndex] = useState(null);

    useEffect(() => {
        const loadAllTables = async () => {
            setLoading(true);
            try {
                const all = await fetchAllManagementTables();
                setTablesList(all);
                if (all.length > 0) setSelectedTable(all[0].name);
            } catch (err) {
                console.error("Failed to load tables list:", err);
                addNotification("Failed to load tables: " + err.message, "error");
            } finally {
                setLoading(false);
            }
        };
        loadAllTables();
    }, [addNotification]);

    const fetchColumnsForTable = async (tableName) => {
        if (!tableName) return;
        setLoading(true);
        try {
            const dbCols = await fetchTableColumnNames(tableName);
            const savedOrder = await FetchColumnOrder(tableName);
            const sortedCols = savedOrder?.length
                ? SortColumnNames(dbCols, savedOrder)
                : applyDefaultColumnOrder(dbCols);
            setColumns(sortedCols);
        } catch (err) {
            console.error("Failed to load columns for table:", err);
            addNotification("Failed to load table columns: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTable) fetchColumnsForTable(selectedTable);
    }, [selectedTable]);

    const handleDragStart = (e, index) => {
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggingIndex === null || draggingIndex === targetIndex) return;

        const updated = [...columns];
        const [draggedItem] = updated.splice(draggingIndex, 1);
        updated.splice(targetIndex, 0, draggedItem);

        setColumns(updated);
        setDraggingIndex(null);
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const updated = [...columns];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        setColumns(updated);
    };

    const moveDown = (index) => {
        if (index === columns.length - 1) return;
        const updated = [...columns];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        setColumns(updated);
    };

    const handleSaveOrder = async () => {
        if (!selectedTable) return;
        setSaving(true);
        try {
            const uppercaseCols = columns.map((c) => c.toUpperCase());
            const { error } = await supabase
                .from("db_COLUMN_ORDERS")
                .upsert({
                    TABLE_NAME: selectedTable,
                    COLUMN_ORDER: uppercaseCols,
                });

            if (error) throw error;
            addNotification(
                `Successfully saved column order for ${selectedTable.replace("alahly_", "").replace("db_", "").replace("egy_CLUB_", "").replace("egy_NT_", "").replace(/_/g, " ").toUpperCase()}`,
                "success"
            );
        } catch (err) {
            console.error("Failed to save column order:", err);
            addNotification("Failed to save order: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefault = async () => {
        if (!selectedTable) return;
        if (!confirm("Are you sure you want to reset this table to default column ordering? This will delete the custom database configuration for this table.")) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from("db_COLUMN_ORDERS")
                .delete()
                .eq("TABLE_NAME", selectedTable);

            if (error) throw error;
            addNotification("Reset column order to system defaults", "success");
            fetchColumnsForTable(selectedTable);
        } catch (err) {
            console.error("Failed to reset column order:", err);
            addNotification("Failed to reset order: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const tableOptions = useMemo(
        () => tablesList.map((Table) => ({ value: Table.name, label: Table.label })),
        [tablesList]
    );

    return (
        <div className="column-sorter-container">
            <header className="sorter-header">
                <div className="header-info">
                    <Sparkles className="gold-sparkle" size={24} />
                    <h2>COLUMN ORDER CUSTOMIZER</h2>
                </div>
            </header>

            <div className="sorter-controls">
                <div className={`table-selector-wrap ${loading || saving ? "is-disabled" : ""}`}>
                    <label>SELECT TABLE TO SORT</label>
                    <DropDownList_db
                        options={tableOptions}
                        value={selectedTable}
                        onChange={setSelectedTable}
                        placeholder="Select Table..."
                        searchable={true}
                    />
                </div>

                <div className="action-buttons-wrap">
                    <button
                        className="save-btn"
                        onClick={handleSaveOrder}
                        disabled={loading || saving || columns.length === 0}
                        title="Save Current Order"
                    >
                        {saving ? (
                            <div className="btn-loader-wrap">
                                <div className="btn-spinner"></div>
                            </div>
                        ) : (
                            <Save size={16} />
                        )}
                    </button>

                    <button
                        className="reset-btn"
                        onClick={handleResetToDefault}
                        disabled={loading || saving || columns.length === 0}
                        title="Reset to Defaults"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="sorter-loading">
                    <div className="spinner"></div>
                    <p>LOADING COLUMN SCHEMAS...</p>
                </div>
            ) : (
                <div className="columns-drag-list">
                    {columns.map((col, index) => (
                        <div
                            key={col}
                            className={`column-drag-item ${draggingIndex === index ? "dragging" : ""}`}
                            draggable={!saving}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                        >
                            <div className="item-drag-handle">
                                <GripVertical size={16} />
                            </div>

                            <div className="item-position-badge">
                                {index + 1}
                            </div>

                            <span className="item-column-name">{col}</span>

                            <div className="item-quick-actions">
                                <button
                                    title="Move Up"
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0 || saving}
                                    className="arrow-btn"
                                >
                                    <ArrowUp size={14} />
                                </button>
                                <button
                                    title="Move Down"
                                    onClick={() => moveDown(index)}
                                    disabled={index === columns.length - 1 || saving}
                                    className="arrow-btn"
                                >
                                    <ArrowDown size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {columns.length === 0 && (
                        <NoData_db
                            message="NO COLUMNS FOUND OR TABLE IS EMPTY"
                            height="240px"
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default ColumnSortView;
