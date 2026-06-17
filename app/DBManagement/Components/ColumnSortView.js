"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import DropDownList_db from "../../lib/DropDownList_db";
import NoData_db from "../../lib/NoData_db";
import { GripVertical, ArrowUp, ArrowDown, Save, RotateCcw, Sparkles } from "lucide-react";

export default function ColumnSortView({ addNotification }) {
    const [tablesList, setTablesList] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draggingIndex, setDraggingIndex] = useState(null);

    // Fetch all tables on mount
    useEffect(() => {
        const loadAllTables = async () => {
            setLoading(true);
            try {
                const [alahlyRes, dbManagementRes, egyptclubRes, egyptntRes] = await Promise.all([
                    supabase.rpc('get_alahly_tables'),
                    supabase.rpc('get_dbmanagement_tables'),
                    supabase.rpc('get_egyptclub_tables'),
                    supabase.rpc('get_egyptnt_tables')
                ]);

                let all = [];
                if (alahlyRes.data) {
                    all = [...all, ...alahlyRes.data.map(t => ({
                        name: t.table_name,
                        label: `AL AHLY: ${t.table_name.replace('alahly_', '').replace(/_/g, ' ').toUpperCase()}`
                    }))];
                }
                if (dbManagementRes.data) {
                    all = [...all, ...dbManagementRes.data.map(t => ({
                        name: t.table_name,
                        label: `GLOBAL: ${t.table_name.replace('db_', '').replace(/_/g, ' ').toUpperCase()}`
                    }))];
                }
                if (egyptclubRes.data) {
                    all = [...all, ...egyptclubRes.data.map(t => ({
                        name: t.table_name,
                        label: `EGYPT CLUB: ${t.table_name.replace('egy_CLUB_', '').replace(/_/g, ' ').toUpperCase()}`
                    }))];
                }
                if (egyptntRes.data) {
                    all = [...all, ...egyptntRes.data.map(t => ({
                        name: t.table_name,
                        label: `EGYPT NT: ${t.table_name.replace('egy_NT_', '').replace(/_/g, ' ').toUpperCase()}`
                    }))];
                }

                // Sort tables by display label
                all.sort((a, b) => a.label.localeCompare(b.label));

                setTablesList(all);
                if (all.length > 0) {
                    setSelectedTable(all[0].name);
                }
            } catch (err) {
                console.error("Failed to load tables list:", err);
                addNotification("Failed to load tables: " + err.message, "error");
            } finally {
                setLoading(false);
            }
        };
        loadAllTables();
    }, [addNotification]);

    // Fetch columns for selected table
    const fetchColumnsForTable = async (tableName) => {
        if (!tableName) return;
        setLoading(true);
        try {
            // 1. Fetch schema columns using get_table_columns RPC
            const { data: schemaCols, error: schemaError } = await supabase
                .rpc("get_table_columns", { target_table: tableName });

            if (schemaError) throw schemaError;

            let dbCols = (schemaCols || []).map(row => row.column_name);

            // 2. Fetch saved order from db_COLUMN_ORDERS
            const { data: orderData } = await supabase
                .from("db_COLUMN_ORDERS")
                .select("COLUMN_ORDER")
                .eq("TABLE_NAME", tableName)
                .maybeSingle();

            const savedOrder = orderData?.COLUMN_ORDER || [];

            // 3. Sort dbCols according to savedOrder
            const sortedCols = [...dbCols];
            if (savedOrder.length > 0) {
                // Ensure matching is case-insensitive
                const normalizedSaved = savedOrder.map(c => c.toUpperCase());
                sortedCols.sort((a, b) => {
                    const idxA = normalizedSaved.indexOf(a.toUpperCase());
                    const idxB = normalizedSaved.indexOf(b.toUpperCase());
                    if (idxA === -1 && idxB === -1) return 0;
                    if (idxA === -1) return 1;
                    if (idxB === -1) return -1;
                    return idxA - idxB;
                });
            } else {
                // Default fallback: force ROW_ID to front
                const rowIdIdx = sortedCols.findIndex(c => c.toUpperCase() === "ROW_ID");
                if (rowIdIdx > -1) {
                    const rowIdKey = sortedCols[rowIdIdx];
                    sortedCols.splice(rowIdIdx, 1);
                    sortedCols.unshift(rowIdKey);
                }
            }

            setColumns(sortedCols);
        } catch (err) {
            console.error("Failed to load columns for table:", err);
            addNotification("Failed to load table columns: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTable) {
            fetchColumnsForTable(selectedTable);
        }
    }, [selectedTable]);

    // Drag-and-drop Handlers
    const handleDragStart = (e, index) => {
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
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

    // Up/Down Button handlers
    const moveUp = (index) => {
        if (index === 0) return;
        const updated = [...columns];
        const temp = updated[index];
        updated[index] = updated[index - 1];
        updated[index - 1] = temp;
        setColumns(updated);
    };

    const moveDown = (index) => {
        if (index === columns.length - 1) return;
        const updated = [...columns];
        const temp = updated[index];
        updated[index] = updated[index + 1];
        updated[index + 1] = temp;
        setColumns(updated);
    };

    // Save Order to Supabase
    const handleSaveOrder = async () => {
        if (!selectedTable) return;
        setSaving(true);
        try {
            // Save the column names in UPPERCASE
            const uppercaseCols = columns.map(c => c.toUpperCase());
            const { error } = await supabase
                .from("db_COLUMN_ORDERS")
                .upsert({
                    TABLE_NAME: selectedTable,
                    COLUMN_ORDER: uppercaseCols
                });

            if (error) throw error;
            addNotification(`Successfully saved column order for ${selectedTable.replace('alahly_', '').replace('db_', '').replace('egy_CLUB_', '').replace('egy_NT_', '').replace(/_/g, ' ').toUpperCase()}`, "success");
        } catch (err) {
            console.error("Failed to save column order:", err);
            addNotification("Failed to save order: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    // Reset to local defaults
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
                            className={`column-drag-item ${draggingIndex === index ? 'dragging' : ''}`}
                            draggable={!saving}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
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
