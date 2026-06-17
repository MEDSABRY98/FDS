"use client";

import { useEffect, useMemo, useState } from "react";
import DropDownList_db from "./DropDownList_db";
import Loading_db from "./Loading_db";
import {
    TABLE_SORT_OPTIONS,
    FetchAllTableSortSettings,
    SaveTableSortSetting,
    FetchNameDisplayLang,
    SaveNameDisplayLang,
    NAME_DISPLAY_LANG_OPTIONS,
    NAME_DISPLAY_LANGUAGE_HINT,
    formatManagementTableLabel,
} from "./supabase";
import "./Settings_db.css";

export default function Settings_db({ availableTables = [], addNotification }) {
    const [sortSettings, setSortSettings] = useState({});
    const [nameDisplayLang, setNameDisplayLang] = useState("ar");
    const [loading, setLoading] = useState(true);
    const [savingTable, setSavingTable] = useState("");
    const [savingLang, setSavingLang] = useState(false);

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
                const [settings, displayLang] = await Promise.all([
                    FetchAllTableSortSettings(),
                    FetchNameDisplayLang(),
                ]);
                if (!cancelled) {
                    setSortSettings(settings);
                    setNameDisplayLang(displayLang);
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

    const handleNameLangChange = async (lang) => {
        setSavingLang(true);
        setNameDisplayLang(lang);

        try {
            await SaveNameDisplayLang(lang);
            addNotification?.(
                lang === "en"
                    ? "Name display set to English across the app."
                    : "تم تعيين عرض الأسماء بالعربية في التطبيق.",
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
                <h2>Global Settings</h2>
            </header>

            <section className="settings-db-section">
                <div className="settings-db-row settings-db-row-global">
                    <div className="settings-db-row-copy">
                        <span className="settings-db-table-name">Name Display Language</span>
                        <span className="settings-db-row-hint">{NAME_DISPLAY_LANGUAGE_HINT}</span>
                    </div>
                    <DropDownList_db
                        className="settings-db-dropdown"
                        options={NAME_DISPLAY_LANG_OPTIONS}
                        value={nameDisplayLang}
                        onChange={handleNameLangChange}
                        placeholder="Select display language..."
                    />
                </div>
            </section>

            <header className="settings-db-subheader">
                <h3>Table Sort Settings</h3>
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
