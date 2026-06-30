"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./int_nt_add_matches.css";
import Login_db from "../../lib/Login_db";
import { useNotification } from "../../lib/Notification_db";
import { AutocompleteInput, fetchCatalogDisplayNames } from "../../Database";
import { IntNtService } from "../Service/int_nt_service";

const EMPTY_ROW = {
    GAME: "", AGE: "", SEASON: "", "HOST COUNTRY": "", DATE: "", CATEGORY: "", ROUND: "",
    TEAMA: "", "TEAMA CONTINENT": "", TEAMASCORE: "", TEAMBSCORE: "", TEAMAPEN: "", TEAMBPEN: "",
    TEAMB: "", "TEAMB CONTINENT": "",
};

const FIELD_ROW_1 = ["GAME", "AGE", "SEASON", "HOST COUNTRY"];
const FIELD_ROW_2 = ["DATE", "CATEGORY", "ROUND", "TEAMA"];
const FIELD_ROW_3 = ["TEAMA CONTINENT", "TEAMASCORE", "TEAMBSCORE", "TEAMB"];
const FIELD_ROW_4 = ["TEAMB CONTINENT", "TEAMAPEN", "TEAMBPEN"];
const EDITABLE_COLUMNS = [...FIELD_ROW_1, ...FIELD_ROW_2, ...FIELD_ROW_3, ...FIELD_ROW_4];
const DEFAULT_ROW_COUNT = 1;

const createEmptyRow = () => ({ ...EMPTY_ROW, _key: Date.now() + Math.random() });
const isRowBlank = (row) => EDITABLE_COLUMNS.every((col) => !String(row[col] ?? "").trim());
const uniqueFrom = (matches, col) =>
    [...new Set(matches.map((m) => m[col]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "ar"));

export default function IntNtAddMatches({ matches = [], onRefresh }) {
    const { addNotification } = useNotification();
    const [rows, setRows] = useState(() => Array.from({ length: DEFAULT_ROW_COUNT }, createEmptyRow));
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [nextRowIdPreview, setNextRowIdPreview] = useState("");
    const [teamOptions, setTeamOptions] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [teams, nextIds] = await Promise.all([
                    fetchCatalogDisplayNames("db_TEAMS"),
                    IntNtService.allocateIntNtRowIds(1),
                ]);
                if (!cancelled) {
                    setTeamOptions(teams || []);
                    setNextRowIdPreview(nextIds[0] || "R-0001");
                }
            } catch (e) {
                console.error(e);
            }
        })();
        return () => { cancelled = true; };
    }, [matches.length]);

    const fieldOptions = useMemo(() => {
        const fromData = {};
        EDITABLE_COLUMNS.forEach((col) => { fromData[col] = uniqueFrom(matches, col); });
        return {
            ...fromData,
            TEAMA: teamOptions.length ? teamOptions : uniqueFrom(matches, "TEAMA"),
            TEAMB: teamOptions.length ? teamOptions : uniqueFrom(matches, "TEAMB"),
        };
    }, [matches, teamOptions]);

    const updateRow = useCallback((rowKey, col, value) => {
        setRows((prev) => prev.map((row) => (row._key === rowKey ? { ...row, [col]: value } : row)));
        setErrors([]);
    }, []);

    const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);
    const deleteRow = (rowKey) => setRows((prev) => {
        const next = prev.filter((r) => r._key !== rowKey);
        return next.length ? next : [createEmptyRow()];
    });

    const handleSaveAll = async () => {
        const payloadRows = rows.filter((row) => !isRowBlank(row));
        if (!payloadRows.length) { addNotification("No rows to save.", "warn"); return; }
        setSaving(true);
        setErrors([]);
        try {
            const existingFingerprints = await IntNtService.getExistingMatchFingerprints();
            const validationErrors = IntNtService.validateBulkRows(payloadRows, existingFingerprints);
            if (validationErrors.length) {
                setErrors(validationErrors);
                addNotification("Fix validation errors before saving.", "error");
                return;
            }
            const { inserted } = await IntNtService.insertMatchesBulk(payloadRows);
            addNotification(`${inserted} match(es) saved.`, "success");
            setRows(Array.from({ length: DEFAULT_ROW_COUNT }, createEmptyRow));
            onRefresh?.();
        } catch (error) {
            addNotification(`Save failed: ${error.message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const renderInput = (row, col) => {
        const options = fieldOptions[col];
        if (options?.length) {
            return (
                <AutocompleteInput
                    value={row[col] ?? ""}
                    options={options}
                    onChange={(val) => updateRow(row._key, col, val)}
                    className="int-nt-field-input field-input"
                    accentColor="#c9a84c"
                />
            );
        }
        return (
            <input type="text" className="int-nt-field-input" value={row[col] ?? ""} onChange={(e) => updateRow(row._key, col, e.target.value)} />
        );
    };

    const renderGroup = (row, fields, wideCol) => (
        <div className="int-nt-fields-row">
            {fields.map((col) => (
                <div key={col} className={`int-nt-field ${col === wideCol ? "int-nt-field--wide" : ""}`}>
                    <label className="int-nt-field-label">{col}</label>
                    {renderInput(row, col)}
                </div>
            ))}
        </div>
    );

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="int-nt-add-wrap">
                <div className="int-nt-add-header">
                    <h2>ADD <span className="accent">MATCHES</span></h2>
                    <div className="int-nt-add-actions">
                        <button type="button" className="int-nt-btn secondary" onClick={addRow}>+ ADD MATCH</button>
                        <button type="button" className="int-nt-btn primary" onClick={handleSaveAll} disabled={saving}>
                            {saving ? "SAVING..." : "SAVE ALL"}
                        </button>
                    </div>
                </div>
                <div className="gold-line" />
                <div className="int-nt-cards-list">
                    {rows.map((row, index) => (
                            <article key={row._key} className="int-nt-card">
                                <div className="int-nt-card-header">
                                    <span className="int-nt-card-index">MATCH {index + 1}</span>
                                    <div className="int-nt-preview-wrap">
                                        <span className="int-nt-preview-label">ROW_ID</span>
                                        <div className="int-nt-preview empty">auto on save ({nextRowIdPreview})</div>
                                    </div>
                                    <button type="button" className="int-nt-delete-btn" onClick={() => deleteRow(row._key)}>✕</button>
                                </div>
                                {renderGroup(row, FIELD_ROW_1)}
                                {renderGroup(row, FIELD_ROW_2)}
                                {renderGroup(row, FIELD_ROW_3)}
                                {renderGroup(row, FIELD_ROW_4)}
                            </article>
                    ))}
                </div>
                {errors.length > 0 && (
                    <div className="int-nt-errors">
                        <strong>Validation errors</strong>
                        <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
                    </div>
                )}
            </div>
        </Login_db>
    );
}
