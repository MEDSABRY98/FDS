"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./egy_c_add_matches.css";
import Login_db from "../../lib/Login_db";
import { useNotification } from "../../lib/Notification_db";
import { AutocompleteInput, fetchCatalogDisplayNames } from "../../Database";
import {
    buildEgyptClubMatchId,
    EgyptClubService,
} from "../Service/egy_c_service";

const EMPTY_ROW = {
    DATE: "",
    "EGYPT TEAM": "",
    "OPPONENT TEAM": "",
    GF: "",
    GA: "",
    "CHAMPION SYSTEM": "",
    CHAMPION: "",
    SEASON: "",
    ROUND: "",
    "H-A-N": "",
    PLACE: "",
    ET: "",
    PEN: "",
    "W-L Q & F": "",
    NOTE: "",
};

const FIELD_ROW_1 = [
    "DATE",
    "EGYPT TEAM",
    "OPPONENT TEAM",
    "GF",
    "GA",
    "CHAMPION SYSTEM",
    "CHAMPION",
    "SEASON",
];

const FIELD_ROW_2 = [
    "ROUND",
    "H-A-N",
    "PLACE",
    "ET",
    "PEN",
    "W-L Q & F",
    "NOTE",
];

const EDITABLE_COLUMNS = [...FIELD_ROW_1, ...FIELD_ROW_2];
const CATALOG_COLUMNS = new Set(["EGYPT TEAM", "OPPONENT TEAM", "PLACE"]);
const DEFAULT_ROW_COUNT = 5;

const createEmptyRow = () => ({
    ...EMPTY_ROW,
    _key: Date.now() + Math.random(),
});

const isRowBlank = (row) =>
    EDITABLE_COLUMNS.every((col) => !String(row[col] ?? "").trim());

const uniqueFromMatches = (matches, col) =>
    [...new Set(matches.map((m) => m[col]).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), "ar")
    );

export default function EgyptClubAddMatches({ matches = [], onRefresh }) {
    const { addNotification } = useNotification();
    const [rows, setRows] = useState(() => Array.from({ length: DEFAULT_ROW_COUNT }, createEmptyRow));
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [catalogOptions, setCatalogOptions] = useState({
        teams: [],
        stadiums: [],
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [teams, stadiums] = await Promise.all([
                    fetchCatalogDisplayNames("db_TEAMS"),
                    fetchCatalogDisplayNames("db_STADIUMS"),
                ]);
                if (!cancelled) {
                    setCatalogOptions({
                        teams: teams || [],
                        stadiums: stadiums || [],
                    });
                }
            } catch (error) {
                console.error("Failed to load catalog options:", error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const fieldOptions = useMemo(() => {
        const fromData = {};
        EDITABLE_COLUMNS.forEach((col) => {
            if (CATALOG_COLUMNS.has(col)) return;
            fromData[col] = uniqueFromMatches(matches, col);
        });
        return {
            ...fromData,
            "EGYPT TEAM": catalogOptions.teams.length
                ? catalogOptions.teams
                : uniqueFromMatches(matches, "EGYPT TEAM"),
            "OPPONENT TEAM": catalogOptions.teams.length
                ? catalogOptions.teams
                : uniqueFromMatches(matches, "OPPONENT TEAM"),
            PLACE: catalogOptions.stadiums.length
                ? catalogOptions.stadiums
                : uniqueFromMatches(matches, "PLACE"),
            "H-A-N": ["H", "A", "N", ...uniqueFromMatches(matches, "H-A-N")].filter(
                (v, i, arr) => arr.indexOf(v) === i
            ),
        };
    }, [matches, catalogOptions]);

    const updateRow = useCallback((rowKey, col, value) => {
        setRows((prev) =>
            prev.map((row) => (row._key === rowKey ? { ...row, [col]: value } : row))
        );
        setErrors([]);
    }, []);

    const addRow = () => {
        setRows((prev) => [...prev, createEmptyRow()]);
    };

    const deleteRow = (rowKey) => {
        setRows((prev) => {
            const next = prev.filter((row) => row._key !== rowKey);
            return next.length > 0 ? next : [createEmptyRow()];
        });
    };

    const handleSaveAll = async () => {
        const payloadRows = rows.filter((row) => !isRowBlank(row));
        if (payloadRows.length === 0) {
            addNotification("No rows to save. Fill at least one match row.", "warn");
            return;
        }

        setSaving(true);
        setErrors([]);

        try {
            const existingIds = await EgyptClubService.getExistingMatchIds();
            const validationErrors = EgyptClubService.validateBulkRows(payloadRows, existingIds);
            if (validationErrors.length > 0) {
                setErrors(validationErrors);
                addNotification("Fix validation errors before saving.", "error");
                return;
            }

            const { inserted } = await EgyptClubService.insertMatchesBulk(payloadRows);
            addNotification(`${inserted} match(es) saved successfully.`, "success");
            setRows(Array.from({ length: DEFAULT_ROW_COUNT }, createEmptyRow));
            onRefresh?.();
        } catch (error) {
            console.error("Bulk insert failed:", error);
            addNotification(`Save failed: ${error.message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const renderFieldInput = (row, col) => {
        if (col === "DATE") {
            return (
                <input
                    type="date"
                    className="match-field-input"
                    value={row.DATE ?? ""}
                    onChange={(e) => updateRow(row._key, col, e.target.value)}
                />
            );
        }

        const options = fieldOptions[col];
        if (options?.length) {
            return (
                <AutocompleteInput
                    value={row[col] ?? ""}
                    options={options}
                    onChange={(val) => updateRow(row._key, col, val)}
                    className="match-field-input field-input"
                    accentColor="#c9a84c"
                />
            );
        }

        return (
            <input
                type="text"
                className="match-field-input"
                value={row[col] ?? ""}
                onChange={(e) => updateRow(row._key, col, e.target.value)}
            />
        );
    };

    const renderFieldGroup = (row, fields) => (
        <div className="match-fields-row">
            {fields.map((col) => (
                <div key={col} className={`match-field ${col === "NOTE" ? "match-field--wide" : ""}`}>
                    <label className="match-field-label">{col}</label>
                    {renderFieldInput(row, col)}
                </div>
            ))}
        </div>
    );

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="tab-content" id="tab-add-matches">
                <div className="add-matches-wrap">
                    <div className="add-matches-header">
                        <h2 className="add-matches-title">
                            ADD <span className="accent">MATCHES</span>
                        </h2>
                        <div className="add-matches-actions">
                            <button type="button" className="add-matches-btn secondary" onClick={addRow}>
                                + ADD MATCH
                            </button>
                            <button
                                type="button"
                                className="add-matches-btn primary"
                                onClick={handleSaveAll}
                                disabled={saving}
                            >
                                {saving ? "SAVING..." : "✓ SAVE ALL MATCHES"}
                            </button>
                        </div>
                    </div>

                    <div className="gold-line" />

                    <div className="match-cards-list">
                        {rows.map((row, index) => {
                            const previewId = buildEgyptClubMatchId(row["OPPONENT TEAM"], row.DATE);
                            return (
                                <article key={row._key} className="match-card">
                                    <div className="match-card-header">
                                        <div className="match-card-index">MATCH {index + 1}</div>
                                        <div className="match-card-id-wrap">
                                            <span className="match-card-id-label">MATCH_ID</span>
                                            <div className={`match-id-preview ${previewId ? "" : "empty"}`}>
                                                {previewId || "—"}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="add-matches-delete-btn"
                                            onClick={() => deleteRow(row._key)}
                                            title="Remove match"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {renderFieldGroup(row, FIELD_ROW_1)}
                                    {renderFieldGroup(row, FIELD_ROW_2)}
                                </article>
                            );
                        })}
                    </div>

                    {errors.length > 0 && (
                        <div className="add-matches-errors">
                            <strong>Validation errors</strong>
                            <ul>
                                {errors.map((msg) => (
                                    <li key={msg}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </Login_db>
    );
}
