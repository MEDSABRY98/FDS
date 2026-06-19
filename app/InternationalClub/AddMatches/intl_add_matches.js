"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./intl_add_matches.css";
import Login_db from "../../lib/Login_db";
import { useNotification } from "../../lib/Notification_db";
import { AutocompleteInput, fetchCatalogDisplayNames } from "../../Database";
import { buildIntlMatchId, IntlClubService } from "../Service/intl_service";

const EMPTY_ROW = {
    GAME: "",
    KIND: "",
    Edition: "",
    ROUND: "",
    "H-A-N": "",
    "TEAM A": "",
    "TEAM A CONTINENT": "",
    GF: "",
    GA: "",
    PEN: "",
    "TEAM B": "",
    "TEAM B CONTINENT": "",
    NOTE: "",
};

const FIELD_ROW_1 = ["GAME", "KIND", "Edition", "ROUND"];
const FIELD_ROW_2 = ["H-A-N", "TEAM A", "TEAM A CONTINENT", "GF"];
const FIELD_ROW_3 = ["GA", "PEN", "TEAM B", "TEAM B CONTINENT"];
const FIELD_ROW_4 = ["NOTE"];
const EDITABLE_COLUMNS = [...FIELD_ROW_1, ...FIELD_ROW_2, ...FIELD_ROW_3, ...FIELD_ROW_4];
const DEFAULT_ROW_COUNT = 1;

const createEmptyRow = () => ({ ...EMPTY_ROW, _key: Date.now() + Math.random() });
const isRowBlank = (row) => EDITABLE_COLUMNS.every((col) => !String(row[col] ?? "").trim());

const uniqueFrom = (matches, col) =>
    [...new Set(matches.map((m) => m[col]).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), "ar")
    );

export default function IntlClubAddMatches({ matches = [], onRefresh }) {
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
                    IntlClubService.allocateIntlRowIds(1),
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
        EDITABLE_COLUMNS.forEach((col) => {
            fromData[col] = uniqueFrom(matches, col);
        });
        return {
            ...fromData,
            "TEAM A": teamOptions.length ? teamOptions : uniqueFrom(matches, "TEAM A"),
            "TEAM B": teamOptions.length ? teamOptions : uniqueFrom(matches, "TEAM B"),
            "TEAM A CONTINENT": ["Africa", "Asia", ...uniqueFrom(matches, "TEAM A CONTINENT")].filter((v, i, a) => a.indexOf(v) === i),
            "TEAM B CONTINENT": ["Africa", "Asia", ...uniqueFrom(matches, "TEAM B CONTINENT")].filter((v, i, a) => a.indexOf(v) === i),
            "H-A-N": ["H", "A", "N", ...uniqueFrom(matches, "H-A-N")].filter((v, i, a) => a.indexOf(v) === i),
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
        if (!payloadRows.length) {
            addNotification("No rows to save.", "warn");
            return;
        }
        setSaving(true);
        setErrors([]);
        try {
            const existingIds = await IntlClubService.getExistingMatchIds();
            const validationErrors = IntlClubService.validateBulkRows(payloadRows, existingIds);
            if (validationErrors.length) {
                setErrors(validationErrors);
                addNotification("Fix validation errors before saving.", "error");
                return;
            }
            const { inserted } = await IntlClubService.insertMatchesBulk(payloadRows);
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
                    className="intl-field-input field-input"
                    accentColor="#c9a84c"
                />
            );
        }
        return (
            <input
                type="text"
                className="intl-field-input"
                value={row[col] ?? ""}
                onChange={(e) => updateRow(row._key, col, e.target.value)}
            />
        );
    };

    const renderGroup = (row, fields, wideCol) => (
        <div className="intl-fields-row">
            {fields.map((col) => (
                <div key={col} className={`intl-field ${col === wideCol ? "intl-field--wide" : ""}`}>
                    <label className="intl-field-label">{col}</label>
                    {renderInput(row, col)}
                </div>
            ))}
        </div>
    );

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="intl-add-wrap">
                <div className="intl-add-header">
                    <h2>ADD <span className="accent">MATCHES</span></h2>
                    <div className="intl-add-actions">
                        <button type="button" className="intl-btn secondary" onClick={addRow}>+ ADD MATCH</button>
                        <button type="button" className="intl-btn primary" onClick={handleSaveAll} disabled={saving}>
                            {saving ? "SAVING..." : "SAVE ALL"}
                        </button>
                    </div>
                </div>
                <div className="gold-line" />
                <div className="intl-cards-list">
                    {rows.map((row, index) => {
                        const matchId = buildIntlMatchId(row.Edition, row["TEAM A"], row["TEAM B"]);
                        return (
                            <article key={row._key} className="intl-card">
                                <div className="intl-card-header">
                                    <span className="intl-card-index">MATCH {index + 1}</span>
                                    <div className="intl-preview-wrap">
                                        <span className="intl-preview-label">NEXT ROW_ID: {nextRowIdPreview}</span>
                                        <div className={`intl-preview ${matchId ? "" : "empty"}`}>
                                            MATCH_ID: {matchId || "—"}
                                        </div>
                                    </div>
                                    <button type="button" className="intl-delete-btn" onClick={() => deleteRow(row._key)}>✕</button>
                                </div>
                                {renderGroup(row, FIELD_ROW_1)}
                                {renderGroup(row, FIELD_ROW_2)}
                                {renderGroup(row, FIELD_ROW_3)}
                                {renderGroup(row, FIELD_ROW_4, "NOTE")}
                            </article>
                        );
                    })}
                </div>
                {errors.length > 0 && (
                    <div className="intl-errors">
                        <strong>Validation errors</strong>
                        <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
                    </div>
                )}
            </div>
        </Login_db>
    );
}
