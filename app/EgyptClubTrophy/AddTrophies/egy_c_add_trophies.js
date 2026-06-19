"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./egy_c_add_trophies.css";
import Login_db from "../../lib/Login_db";
import { useNotification } from "../../lib/Notification_db";
import { AutocompleteInput, fetchCatalogDisplayNames } from "../../Database";
import {
    buildTrophyKey,
    EgyptClubTrophyService,
} from "../egy_c_trophy_service";
import competitionOrder from "../column_order.json";

const EMPTY_ROW = {
    CHAMPION: "",
    COMPETITION: "",
    SEASON: "",
    PLACE: "",
    RESULT: "",
    PEN: "",
    "RUNNER-UP": "",
    NOTE: "",
};

const FIELD_ROW_1 = ["CHAMPION", "COMPETITION", "SEASON", "PLACE"];
const FIELD_ROW_2 = ["RESULT", "PEN", "RUNNER-UP", "NOTE"];
const EDITABLE_COLUMNS = [...FIELD_ROW_1, ...FIELD_ROW_2];
const CATALOG_COLUMNS = new Set(["CHAMPION"]);
const DEFAULT_ROW_COUNT = 1;

const createEmptyRow = () => ({
    ...EMPTY_ROW,
    _key: Date.now() + Math.random(),
});

const isRowBlank = (row) =>
    EDITABLE_COLUMNS.every((col) => !String(row[col] ?? "").trim());

const uniqueFromTrophies = (trophies, col) =>
    [...new Set(trophies.map((t) => t[col]).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), "ar")
    );

const buildTrophyPreview = (row) => {
    const season = String(row.SEASON ?? "").trim();
    const competition = String(row.COMPETITION ?? "").trim();
    const champion = String(row.CHAMPION ?? "").trim();
    if (!season && !competition && !champion) return "";
    const left = season && competition ? `${season} | ${competition}` : season || competition;
    return champion ? `${left} → ${champion}` : left;
};

export default function EgyptClubAddTrophies({ trophies = [], onRefresh }) {
    const { addNotification } = useNotification();
    const [rows, setRows] = useState(() => Array.from({ length: DEFAULT_ROW_COUNT }, createEmptyRow));
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [teamOptions, setTeamOptions] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const teams = await fetchCatalogDisplayNames("db_TEAMS");
                if (!cancelled) setTeamOptions(teams || []);
            } catch (error) {
                console.error("Failed to load team catalog:", error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const fieldOptions = useMemo(() => {
        const fromData = {};
        EDITABLE_COLUMNS.forEach((col) => {
            if (CATALOG_COLUMNS.has(col) || col === "COMPETITION") return;
            fromData[col] = uniqueFromTrophies(trophies, col);
        });

        const fromDb = uniqueFromTrophies(trophies, "COMPETITION");
        const competitionOptions = [
            ...competitionOrder,
            ...fromDb.filter((c) => !competitionOrder.includes(c)),
        ];

        return {
            ...fromData,
            CHAMPION: teamOptions.length
                ? teamOptions
                : uniqueFromTrophies(trophies, "CHAMPION"),
            COMPETITION: competitionOptions,
            "RUNNER-UP": teamOptions.length
                ? [...new Set([...teamOptions, ...uniqueFromTrophies(trophies, "RUNNER-UP")])].sort((a, b) =>
                      String(a).localeCompare(String(b), "ar")
                  )
                : uniqueFromTrophies(trophies, "RUNNER-UP"),
        };
    }, [trophies, teamOptions]);

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
            addNotification("No rows to save. Fill at least one trophy row.", "warn");
            return;
        }

        setSaving(true);
        setErrors([]);

        try {
            const existingKeys = await EgyptClubTrophyService.getExistingTrophyKeys();
            const validationErrors = EgyptClubTrophyService.validateBulkRows(payloadRows, existingKeys);
            if (validationErrors.length > 0) {
                setErrors(validationErrors);
                addNotification("Fix validation errors before saving.", "error");
                return;
            }

            const { inserted } = await EgyptClubTrophyService.insertTrophiesBulk(payloadRows);
            addNotification(`${inserted} trophy record(s) saved successfully.`, "success");
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
        const options = fieldOptions[col];
        if (options?.length) {
            return (
                <AutocompleteInput
                    value={row[col] ?? ""}
                    options={options}
                    onChange={(val) => updateRow(row._key, col, val)}
                    className="trophy-field-input field-input"
                    accentColor="#c9a84c"
                />
            );
        }

        return (
            <input
                type="text"
                className="trophy-field-input"
                value={row[col] ?? ""}
                onChange={(e) => updateRow(row._key, col, e.target.value)}
            />
        );
    };

    const renderFieldGroup = (row, fields) => (
        <div className="trophy-fields-row">
            {fields.map((col) => (
                <div key={col} className="trophy-field">
                    <label className="trophy-field-label">{col}</label>
                    {renderFieldInput(row, col)}
                </div>
            ))}
        </div>
    );

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="tab-content" id="tab-add-trophies">
                <div className="add-trophies-wrap">
                    <div className="add-trophies-header">
                        <h2 className="add-trophies-title">
                            ADD <span className="accent">TROPHIES</span>
                        </h2>
                        <div className="add-trophies-actions">
                            <button type="button" className="add-trophies-btn secondary" onClick={addRow}>
                                + ADD TROPHY
                            </button>
                            <button
                                type="button"
                                className="add-trophies-btn primary"
                                onClick={handleSaveAll}
                                disabled={saving}
                            >
                                {saving ? "SAVING..." : "✓ SAVE ALL TROPHIES"}
                            </button>
                        </div>
                    </div>

                    <div className="gold-line" />

                    <div className="trophy-cards-list">
                        {rows.map((row, index) => {
                            const preview = buildTrophyPreview(row);
                            const keyPreview = buildTrophyKey(row.SEASON, row.COMPETITION);
                            return (
                                <article key={row._key} className="trophy-card">
                                    <div className="trophy-card-header">
                                        <div className="trophy-card-index">TROPHY {index + 1}</div>
                                        <div className="trophy-card-id-wrap">
                                            <span className="trophy-card-id-label">PREVIEW</span>
                                            <div className={`trophy-preview ${preview ? "" : "empty"}`}>
                                                {preview || "—"}
                                            </div>
                                            {keyPreview && (
                                                <span className="trophy-key-hint">Key: {keyPreview}</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="add-trophies-delete-btn"
                                            onClick={() => deleteRow(row._key)}
                                            title="Remove trophy"
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
                        <div className="add-trophies-errors">
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
