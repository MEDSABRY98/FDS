"use client";

import { useEffect, useMemo, useState } from "react";
import DropDownList_db from "./DropDownList_db";
import Loading_db from "./Loading_db";
import {
    TABLE_SORT_OPTIONS,
    FetchAllTableSortSettings,
    SaveTableSortSetting,
    formatManagementTableLabel,
} from "./supabase";
import "./Settings_db.css";

export default function Settings_db({ availableTables = [], addNotification }) {
    const [sortSettings, setSortSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingTable, setSavingTable] = useState("");

    const tableRows = useMemo(() => {
        return [...availableTables]
            .filter((table) => table.name !== "SETTINGS" && table.name !== "COLUMN_SORT")
            .map((table) => ({
                name: table.name,
                label: table.label || formatManagementTableLabel(table.name),
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [availableTables]);

    useEffect(() => {
        let cancelled = false;

        const loadSettings = async () => {
            setLoading(true);
            try {
                const settings = await FetchAllTableSortSettings();
                if (!cancelled) setSortSettings(settings);
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

    const handleSortChange = async (tableName, sorting) => {
        setSavingTable(tableName);
        setSortSettings((prev) => ({ ...prev, [tableName]: sorting }));

        try {
            await SaveTableSortSetting(tableName, sorting);
            addNotification?.(
                `Sort order saved for ${formatManagementTableLabel(tableName)}`,
                "success"
            );
        } catch (err) {
            setSortSettings((prev) => {
                const next = { ...prev };
                delete next[tableName];
                return next;
            });
            addNotification?.("Failed to save sort setting: " + err.message, "error");
        } finally {
            setSavingTable("");
        }
    };

    if (loading) {
        return (
            <Loading_db
                title="SETTINGS"
                subtitle="DATABASE"
                message="LOADING TABLE SORT PREFERENCES..."
                inline={true}
            />
        );
    }

    return (
        <div className="settings-db-container">
            <header className="settings-db-header">
                <h2>Table Sort Settings</h2>
                <p>Choose how each management table is sorted when loaded.</p>
            </header>

            {tableRows.length === 0 ? (
                <div className="settings-db-empty">No tables available for this module.</div>
            ) : (
                <div className="settings-db-list">
                    {tableRows.map((table) => (
                        <div
                            key={table.name}
                            className={`settings-db-row ${savingTable === table.name ? "is-saving" : ""}`}
                        >
                            <span className="settings-db-table-name">{table.label}</span>
                            <DropDownList_db
                                className="settings-db-dropdown"
                                options={TABLE_SORT_OPTIONS}
                                value={sortSettings[table.name] || "ROW_ID"}
                                onChange={(value) => handleSortChange(table.name, value)}
                                placeholder="Select sort order..."
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
