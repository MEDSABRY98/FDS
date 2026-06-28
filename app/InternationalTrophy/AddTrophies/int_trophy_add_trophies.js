"use client";

import { useCallback, useMemo, useState } from "react";
import "./int_trophy_add_trophies.css";
import "../Leaderboard/int_trophy_leaderboard.css";
import Login_db from "../../lib/Login_db";
import { useNotification } from "../../lib/Notification_db";
import { AutocompleteInput } from "../../Database";
import { buildTrophyKey, IntTrophyService } from "../Service/int_trophy_service";

const EMPTY_ROW = {
    TYPE: "",
    AREA: "",
    GAME: "",
    COMPETITION: "",
    SEASON: "",
    "W-MANAGER": "",
    "L-MANAGER": "",
    PLACE: "",
    CHAMPION: "",
    RESULT: "",
    "RUNNER-UP": "",
    NOTE: "",
};

const FIELD_ROW_1 = ["TYPE", "AREA", "GAME", "COMPETITION"];
const FIELD_ROW_2 = ["SEASON", "PLACE", "W-MANAGER", "L-MANAGER"];
const FIELD_ROW_3 = ["CHAMPION", "RESULT", "RUNNER-UP", "NOTE"];
const EDITABLE_COLUMNS = [...FIELD_ROW_1, ...FIELD_ROW_2, ...FIELD_ROW_3];
const TYPE_OPTIONS = ["Club", "NT"];
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
    const type = String(row.TYPE ?? "").trim();
    const game = String(row.GAME ?? "").trim();
    const competition = String(row.COMPETITION ?? "").trim();
    const season = String(row.SEASON ?? "").trim();
    const champion = String(row.CHAMPION ?? "").trim();
    if (!type && !game && !competition && !season && !champion) return "";
    const left = [type, game, competition, season].filter(Boolean).join(" | ");
    return champion ? `${left} → ${champion}` : left;
};

export default function IntTrophyAddTrophies({ trophies = [], onRefresh }) {
    const { addNotification } = useNotification();
    const [rows, setRows] = useState(() => Array.from({ length: DEFAULT_ROW_COUNT }, createEmptyRow));
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);

    const fieldOptions = useMemo(() => {
        const fromData = {};
        EDITABLE_COLUMNS.forEach((col) => {
            if (col === "TYPE") return;
            fromData[col] = uniqueFromTrophies(trophies, col);
        });
        return { ...fromData, TYPE: TYPE_OPTIONS };
    }, [trophies]);

    const updateRow = useCallback((rowKey, col, value) => {
        setRows((prev) =>
            prev.map((row) => (row._key === rowKey ? { ...row, [col]: value } : row))
        );
        setErrors([]);
    }, []);

    const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

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
            const existingKeys = await IntTrophyService.getExistingTrophyKeys();
            const validationErrors = IntTrophyService.validateBulkRows(payloadRows, existingKeys);
            if (validationErrors.length > 0) {
                setErrors(validationErrors);
                addNotification("Fix validation errors before saving.", "error");
                return;
            }

            const { inserted } = await IntTrophyService.insertTrophiesBulk(payloadRows);
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
                <div className="add-trophies-wrap int-trophy-lb">
                    <div className="int-trophy-lb-header">
                        <h1>ADD <span className="gold">TROPHIES</span></h1>
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
                            const keyPreview = buildTrophyKey(
                                row.TYPE, row.GAME, row.COMPETITION, row.SEASON, row.PLACE, row["RUNNER-UP"]
                            );
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
                                    {renderFieldGroup(row, FIELD_ROW_3)}
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
