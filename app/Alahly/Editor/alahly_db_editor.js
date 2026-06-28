"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import "./alahly_db_editor.css";
import { supabase, AutocompleteInput, fetchCatalogDisplayNames, sortRowsByTableSortRules, applyLineupLogic } from "../../Database";
import Login_db from "../../lib/Login_db";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { useNotification } from "../../lib/Notification_db";
import {
    normalizeHowPenMissedRowForEditor,
    sanitizeHowPenMissedRowForSave,
    isEditorLinkedRowFilled,
} from "../Penalties/alahly_db_penalties_utils";
// â”€â”€ Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EMPTY_MATCH = {
    "MATCH_ID": "", "CHAMPION SYSTEM": "", "DATE": "", "CHAMPION": "", "SEASON - NAME": "",
    "SEASON - NUMBER": "", "AHLY MANAGER": "", "OPPONENT MANAGER": "", "REFREE": "", "ROUND": "",
    "H-A-N": "", "STAD": "", "AHLY TEAM": "", "GF": "", "GA": "", "ET": "",
    "PEN": "", "OPPONENT TEAM": "", "NOTE": "", "MOTM": ""
};
const EMPTY_LINEUP = { "MATCH_ID": "", "MATCH MINUTE": "", "TEAM": "", "PLAYER NAME": "", "STATU": "", "PLAYER NAME OUT": "", "OUT MINUTE": "", "TOTAL MINUTE": "" };
const EMPTY_PLAYER = { "MATCH_ID": "", "EVENT_ID": "", "PARENT_EVENT_ID": "", "PLAYER NAME": "", "TEAM": "", "TYPE": "", "TYPE_SUB": "", "MINUTE": "" };
const EMPTY_GK = { "MATCH_ID": "", "EVENT_ID": "", "TEAM": "", "PLAYER NAME": "", "STATU": "", "OUT MINUTE": "", "GOALS CONCEDED": "" };
const EMPTY_PEN = { "MATCH_ID": "", "EVENT_ID": "", "HOW MISSED?": "", "TEAM": "", "MINUTE": "" };

const parseEventIdSuffix = (eventId) => {
    const id = String(eventId || "").trim();
    if (!id) return 0;
    const trailing = id.match(/(\d+)(?!.*\d)/);
    return trailing ? parseInt(trailing[1], 10) : 0;
};

const getNextPlayerEventId = (matchId, rows = []) => {
    const normalizedMatchId = String(matchId || "").trim();
    if (!normalizedMatchId) return "";

    let maxSuffix = 0;
    rows.forEach((row) => {
        maxSuffix = Math.max(maxSuffix, parseEventIdSuffix(row?.EVENT_ID));
    });

    return `${normalizedMatchId}-${maxSuffix + 1}`;
};

const sortRowsByEventId = (rows = []) => (
    [...rows].sort((a, b) => {
        const idA = String(a?.EVENT_ID || "").trim();
        const idB = String(b?.EVENT_ID || "").trim();
        if (!idA && !idB) return 0;
        if (!idA) return 1;
        if (!idB) return -1;
        const suffixDiff = parseEventIdSuffix(idA) - parseEventIdSuffix(idB);
        if (suffixDiff !== 0) return suffixDiff;
        return idA.localeCompare(idB);
    })
);

const listIndexedRowsByEventId = (rows = []) => (
    rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
            const suffixDiff = parseEventIdSuffix(a.row?.EVENT_ID) - parseEventIdSuffix(b.row?.EVENT_ID);
            if (suffixDiff !== 0) return suffixDiff;
            if (!a.row?.EVENT_ID && b.row?.EVENT_ID) return 1;
            if (a.row?.EVENT_ID && !b.row?.EVENT_ID) return -1;
            return String(a.row?.EVENT_ID || "").localeCompare(String(b.row?.EVENT_ID || ""));
        })
);

const buildPlayerEventIdOptions = (playerRows = []) => (
    [...new Set(playerRows.map((row) => String(row?.EVENT_ID || "").trim()).filter(Boolean))]
        .sort((a, b) => parseEventIdSuffix(a) - parseEventIdSuffix(b))
);

const isPlayerEventRowSaveable = (row) => (
    String(row?.["PLAYER NAME"] || "").trim() !== "" ||
    String(row?.TYPE || "").trim() !== "" ||
    String(row?.MINUTE || "").trim() !== "" ||
    String(row?.TYPE_SUB || "").trim() !== ""
);

const isGkRowSaveable = (row) => String(row?.["PLAYER NAME"] || "").trim() !== "";

const isPenRowSaveable = (row) => (
    String(row?.["HOW MISSED?"] || "").trim() !== "" ||
    String(row?.MINUTE || "").trim() !== ""
);

const UNNAMED_PLAYER_LABEL = "— Unnamed Player —";

const formatEventLine = (row) => {
    const parts = [
        String(row.TYPE || "").trim(),
        String(row.TYPE_SUB || "").trim(),
        String(row.MINUTE || "").trim() ? `${String(row.MINUTE).trim()}'` : "",
    ].filter(Boolean);
    return parts.join(" · ") || "—";
};

const formatGkLine = (row) => {
    const parts = [
        String(row.STATU || "").trim(),
        String(row["OUT MINUTE"] || "").trim() ? `OUT ${String(row["OUT MINUTE"]).trim()}'` : "",
        String(row["GOALS CONCEDED"] || "").trim() !== "" ? `GC ${String(row["GOALS CONCEDED"]).trim()}` : "",
    ].filter(Boolean);
    return parts.join(" · ") || "—";
};

const formatPenLine = (row) => {
    const parts = [
        String(row["HOW MISSED?"] || "").trim(),
        String(row.MINUTE || "").trim() ? `${String(row.MINUTE).trim()}'` : "",
    ].filter(Boolean);
    return parts.join(" · ") || "—";
};

const sortByRowIdAsc = (rows) => sortRowsByTableSortRules(rows, ["ROW_ID"], [{ column: "ROW_ID", direction: "asc" }]);

const isFinalRound = (round) => String(round || "").trim() === "النهائي";

const resolveAhlyTeam = (formData = {}) => String(formData["AHLY TEAM"] || "").trim() || "الأهلي";
const resolveOpponentTeam = (formData = {}) => String(formData["OPPONENT TEAM"] || "").trim();

function isLineupForAhly(row, ahlyTeam) {
    const team = String(row?.TEAM || "").trim();
    if (team === ahlyTeam) return true;
    if (!formDataHasCustomAhlyTeam(ahlyTeam) && (team === "الأهلي" || team === "الأهلى")) return true;
    return false;
}

function formDataHasCustomAhlyTeam(ahlyTeam) {
    return ahlyTeam && ahlyTeam !== "الأهلي" && ahlyTeam !== "الأهلى";
}

function isLineupForOpponent(row, opponentTeam, ahlyTeam) {
    const team = String(row?.TEAM || "").trim();
    if (!opponentTeam || !team) return false;
    if (team === opponentTeam) return true;
    if (isLineupForAhly(row, ahlyTeam)) return false;
    return false;
}

function createInitialTeamLineup(matchId, teamName, count = 16) {
    const baseKey = Date.now();
    return Array.from({ length: count }, (_, i) => ({
        ...EMPTY_LINEUP,
        "MATCH MINUTE": "90",
        TEAM: teamName,
        STATU: i < 11 ? "اساسي" : "احتياطي",
        "TOTAL MINUTE": i < 11 ? "90" : "",
        MATCH_ID: matchId || "",
        _isNew: true,
        _key: `lineup-${baseKey}-${teamName}-${i}`,
    }));
}

function isLineupPlayerRowFilled(row) {
    return String(row?.["PLAYER NAME"] || "").trim() !== "";
}

function createEmptyStarterSlot(matchId, teamName, index, matchMinute = "90", baseKey = Date.now()) {
    return {
        ...EMPTY_LINEUP,
        "MATCH MINUTE": matchMinute,
        TEAM: teamName,
        STATU: "اساسي",
        "TOTAL MINUTE": matchMinute,
        MATCH_ID: matchId || "",
        _isNew: true,
        _key: `lineup-slot-${baseKey}-${teamName}-s-${index}`,
    };
}

function normalizeSavedTeamLineup(teamRows, matchId, teamName) {
    const baseKey = Date.now();
    const matchMinute = String(teamRows.find((r) => r["MATCH MINUTE"])?.["MATCH MINUTE"] || "90").trim() || "90";

    const sorted = [...teamRows].sort((a, b) => {
        const rowIdA = String(a?.ROW_ID || "");
        const rowIdB = String(b?.ROW_ID || "");
        if (!rowIdA && !rowIdB) return 0;
        if (!rowIdA) return 1;
        if (!rowIdB) return -1;
        return rowIdA.localeCompare(rowIdB, undefined, { numeric: true });
    });

    const starters = sorted.filter((r) => String(r.STATU || "").trim() === "اساسي");
    const bench = sorted.filter((r) => String(r.STATU || "").trim() === "احتياطي");
    const other = sorted.filter((r) => {
        const status = String(r.STATU || "").trim();
        return status !== "اساسي" && status !== "احتياطي";
    });

    other.forEach((row) => {
        if (!isLineupPlayerRowFilled(row)) return;
        if (starters.length < 11) {
            starters.push({ ...row, STATU: "اساسي" });
        } else {
            bench.push({ ...row, STATU: "احتياطي" });
        }
    });

    while (starters.length > 11) {
        const extra = starters.pop();
        if (isLineupPlayerRowFilled(extra)) {
            bench.unshift({ ...extra, STATU: "احتياطي" });
        }
    }

    while (starters.length < 11) {
        starters.push(createEmptyStarterSlot(matchId, teamName, starters.length, matchMinute, baseKey));
    }

    const filledBench = bench.filter(isLineupPlayerRowFilled);

    return [...starters, ...filledBench].map((row, index) => ({
        ...row,
        TEAM: teamName,
        MATCH_ID: matchId || row.MATCH_ID || "",
        _key: row._key ?? `lineup-loaded-${baseKey}-${teamName}-${index}`,
    }));
}

function normalizeSavedMatchLineup(allRows, matchId, matchInfo = {}) {
    const ahlyTeam = resolveAhlyTeam(matchInfo);
    const oppTeam = resolveOpponentTeam(matchInfo);

    const ahlySaved = allRows.filter((r) => isLineupForAhly(r, ahlyTeam));
    const oppSaved = oppTeam
        ? allRows.filter((r) => isLineupForOpponent(r, oppTeam, ahlyTeam))
        : [];

    const ahlyNorm = normalizeSavedTeamLineup(ahlySaved, matchId, ahlyTeam);
    const oppNorm = oppTeam ? normalizeSavedTeamLineup(oppSaved, matchId, oppTeam) : [];

    const combined = [...ahlyNorm, ...oppNorm];
    return applyLineupLogic(combined, combined);
}

function findRowIndexInList(list, row, fallbackIndex) {
    if (row?._key != null) {
        const byKey = list.findIndex((r) => r._key === row._key);
        if (byKey >= 0) return byKey;
    }
    if (row?.ROW_ID) {
        const byRowId = list.findIndex((r) => r.ROW_ID === row.ROW_ID);
        if (byRowId >= 0) return byRowId;
    }
    return fallbackIndex;
}

function mergeTeamLineupUpdate(allRows, teamFilter, teamAction, applyLogic) {
    const others = allRows.filter((r) => !teamFilter(r));
    const teamPrev = allRows.filter(teamFilter);
    const teamNext = typeof teamAction === "function" ? teamAction(teamPrev) : teamAction;
    const combinedNext = [...others, ...teamNext];
    return applyLogic(allRows, combinedNext);
}

function EditorEventCard({
    row,
    index,
    isSaving,
    savingModal,
    onEdit,
    onDelete,
    tableName,
    setRows,
    title,
    meta,
    description,
    extra,
}) {
    const isDirty = row._isNew || row._isDirty;

    return (
        <div className={`player-event-card player-event-card-single${isDirty ? " player-event-card-dirty" : ""}`}>
            <div className="player-event-card-head player-event-card-head-row">
                <span className="player-event-id">{row.EVENT_ID || "—"}</span>
                <div className="player-event-item-actions">
                    <button
                        type="button"
                        className="player-event-action-btn player-event-action-edit"
                        title="Edit"
                        disabled={isSaving || savingModal}
                        onClick={() => onEdit(row, index)}
                    >
                        ✎
                    </button>
                    <button
                        type="button"
                        className="player-event-action-btn player-event-action-delete"
                        title="Delete"
                        disabled={isSaving || savingModal}
                        onClick={() => onDelete(row, index, tableName, setRows)}
                    >
                        ✕
                    </button>
                </div>
            </div>
            {title && <div className="player-event-card-name">{title}</div>}
            {meta && <div className="player-event-card-meta">{meta}</div>}
            {description && <div className="player-event-card-desc">{description}</div>}
            {extra}
        </div>
    );
}

function PlayerEventsPanel({
    title,
    color,
    rows,
    setRows,
    matchId,
    teamOptions,
    allPlayersList,
    eventTypes,
    eventSubTypes,
    persistToDb,
    onSaveRow,
    onDeleteRow,
    isSaving,
    resolveNextEventId,
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_PLAYER });
    const [savingModal, setSavingModal] = useState(false);
    const { addNotification } = useNotification();

    const sortedEntries = useMemo(() => listIndexedRowsByEventId(rows), [rows]);

    const parentEventOptions = useMemo(() => {
        const ids = rows
            .map((row) => String(row.EVENT_ID || "").trim())
            .filter(Boolean);
        return [...new Set(ids)].sort((a, b) => parseEventIdSuffix(a) - parseEventIdSuffix(b));
    }, [rows]);

    const openAddModal = (preset = {}) => {
        setEditingIndex(null);
        setForm({ ...EMPTY_PLAYER, MATCH_ID: matchId, ...preset });
        setModalOpen(true);
    };

    const openEditModal = (row, index) => {
        setEditingIndex(index);
        setForm({ ...EMPTY_PLAYER, ...row, MATCH_ID: row.MATCH_ID || matchId });
        setModalOpen(true);
    };

    const closeModal = (force = false) => {
        if (!force && savingModal) return;
        setModalOpen(false);
        setEditingIndex(null);
        setForm({ ...EMPTY_PLAYER });
    };

    const updateFormField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleModalSave = async () => {
        const cleanForm = { ...form };
        if (!isPlayerEventRowSaveable(cleanForm)) {
            addNotification("Fill at least PLAYER NAME, TYPE, or MINUTE before saving.", "error");
            return;
        }

        setSavingModal(true);
        try {
            if (editingIndex === null) {
                let eventId = String(cleanForm.EVENT_ID || "").trim();
                if (!eventId) {
                    eventId = persistToDb
                        ? await resolveNextEventId(matchId, rows)
                        : getNextPlayerEventId(matchId, rows);
                }

                const newRow = {
                    ...EMPTY_PLAYER,
                    ...cleanForm,
                    MATCH_ID: matchId,
                    EVENT_ID: eventId,
                    _isNew: true,
                    _key: Date.now(),
                };

                const nextRows = sortRowsByEventId([...rows, newRow]);
                const newIndex = nextRows.findIndex((row) => row._key === newRow._key);
                setRows(nextRows);

                if (persistToDb && onSaveRow) {
                    await onSaveRow(newRow, newIndex, "alahly_PLAYERDETAILS", setRows);
                }
            } else {
                const existingRow = rows[editingIndex];
                const updatedRow = {
                    ...existingRow,
                    ...cleanForm,
                    MATCH_ID: matchId,
                    _isDirty: true,
                };
                const nextRows = sortRowsByEventId(
                    rows.map((row, index) => (index === editingIndex ? updatedRow : row))
                );
                const newIndex = nextRows.findIndex((row) => row._key === updatedRow._key);
                setRows(nextRows);

                if (persistToDb && onSaveRow) {
                    await onSaveRow(updatedRow, newIndex, "alahly_PLAYERDETAILS", setRows);
                }
            }

            closeModal(true);
        } catch (error) {
            addNotification(`Failed to save event: ${error.message}`, "error");
        } finally {
            setSavingModal(false);
        }
    };

    return (
        <div className="player-events-panel" style={{ "--panel-accent": color }}>
            <div className="player-events-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 4, height: 24, background: color, borderRadius: 4 }} />
                    <h3 className="player-events-title">
                        {title}
                        <span className="player-events-count">({rows.length} events)</span>
                    </h3>
                </div>
                <button
                    type="button"
                    className="player-events-add-btn"
                    onClick={() => openAddModal()}
                    disabled={isSaving || savingModal}
                >
                    <span>+</span> ADD EVENT
                </button>
            </div>

            {rows.length === 0 ? (
                <NoData_db message="NO PLAYER EVENTS FOUND" height="240px" />
            ) : (
                <div className="player-events-grid">
                    {sortedEntries.map(({ row, index }) => (
                        <EditorEventCard
                            key={row._key ?? `${row.EVENT_ID}-${index}`}
                            row={row}
                            index={index}
                            isSaving={isSaving}
                            savingModal={savingModal}
                            onEdit={openEditModal}
                            onDelete={onDeleteRow}
                            tableName="alahly_PLAYERDETAILS"
                            setRows={setRows}
                            title={String(row["PLAYER NAME"] || "").trim() || UNNAMED_PLAYER_LABEL}
                            meta={String(row.TEAM || "").trim() || null}
                            description={formatEventLine(row)}
                            extra={String(row.PARENT_EVENT_ID || "").trim() ? (
                                <span className="player-event-parent">↳ {row.PARENT_EVENT_ID}</span>
                            ) : null}
                        />
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="confirm-modal-overlay" onClick={closeModal}>
                    <div className="player-event-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="player-event-modal-head">
                            <h3>{editingIndex === null ? "ADD PLAYER EVENT" : "EDIT PLAYER EVENT"}</h3>
                        </div>

                        <div className="player-event-modal-grid">
                            <div className="player-event-modal-field">
                                <div className="field-label">PARENT EVENT ID</div>
                                <AutocompleteInput
                                    value={form.PARENT_EVENT_ID ?? ""}
                                    options={parentEventOptions}
                                    placeholder="Optional"
                                    onChange={(val) => updateFormField("PARENT_EVENT_ID", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">PLAYER NAME</div>
                                <AutocompleteInput
                                    value={form["PLAYER NAME"] ?? ""}
                                    options={allPlayersList}
                                    placeholder="Player name"
                                    onChange={(val) => updateFormField("PLAYER NAME", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">TEAM</div>
                                <AutocompleteInput
                                    value={form.TEAM ?? ""}
                                    options={teamOptions}
                                    placeholder="Team"
                                    onChange={(val) => updateFormField("TEAM", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">TYPE</div>
                                <AutocompleteInput
                                    value={form.TYPE ?? ""}
                                    options={eventTypes}
                                    placeholder="Type"
                                    onChange={(val) => updateFormField("TYPE", val)}
                                    className="field-input field-input-fit"
                                    shrinkToFit
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">TYPE SUB</div>
                                <AutocompleteInput
                                    value={form.TYPE_SUB ?? ""}
                                    options={eventSubTypes}
                                    placeholder="Type sub"
                                    onChange={(val) => updateFormField("TYPE_SUB", val)}
                                    className="field-input field-input-fit"
                                    shrinkToFit
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">MINUTE</div>
                                <input
                                    value={form.MINUTE ?? ""}
                                    onChange={(e) => updateFormField("MINUTE", e.target.value)}
                                    className="field-input"
                                    placeholder="Minute"
                                    style={{ width: "100%", height: "42px", fontSize: "14px" }}
                                />
                            </div>
                        </div>

                        <div className="player-event-modal-actions">
                            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={closeModal} disabled={savingModal}>
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="player-event-modal-save"
                                onClick={handleModalSave}
                                disabled={savingModal || isSaving}
                                style={{ background: color }}
                            >
                                {savingModal ? "SAVING..." : "SAVE EVENT"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function GkDetailsPanel({
    title,
    color,
    rows,
    setRows,
    matchId,
    teamOptions,
    allPlayersList,
    playerEventRows,
    persistToDb,
    onSaveRow,
    onDeleteRow,
    isSaving,
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_GK });
    const [savingModal, setSavingModal] = useState(false);
    const { addNotification } = useNotification();

    const sortedEntries = useMemo(() => listIndexedRowsByEventId(rows), [rows]);
    const eventIdOptions = useMemo(() => buildPlayerEventIdOptions(playerEventRows), [playerEventRows]);
    const statuOptions = ["اساسي", "احتياطي"];

    const openAddModal = (preset = {}) => {
        setEditingIndex(null);
        setForm({ ...EMPTY_GK, MATCH_ID: matchId, ...preset });
        setModalOpen(true);
    };

    const openEditModal = (row, index) => {
        setEditingIndex(index);
        setForm({ ...EMPTY_GK, ...row, MATCH_ID: row.MATCH_ID || matchId });
        setModalOpen(true);
    };

    const closeModal = (force = false) => {
        if (!force && savingModal) return;
        setModalOpen(false);
        setEditingIndex(null);
        setForm({ ...EMPTY_GK });
    };

    const updateFormField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleModalSave = async () => {
        const cleanForm = { ...form };
        if (!isGkRowSaveable(cleanForm)) {
            addNotification("Fill PLAYER NAME before saving.", "error");
            return;
        }

        setSavingModal(true);
        try {
            if (editingIndex === null) {
                const newRow = {
                    ...EMPTY_GK,
                    ...cleanForm,
                    MATCH_ID: matchId,
                    EVENT_ID: String(cleanForm.EVENT_ID || "").trim(),
                    _isNew: true,
                    _key: Date.now(),
                };

                const nextRows = sortRowsByEventId([...rows, newRow]);
                const newIndex = nextRows.findIndex((row) => row._key === newRow._key);
                setRows(nextRows);

                if (persistToDb && onSaveRow) {
                    await onSaveRow(newRow, newIndex, "alahly_GKSDETAILS", setRows);
                }
            } else {
                const existingRow = rows[editingIndex];
                const updatedRow = {
                    ...existingRow,
                    ...cleanForm,
                    MATCH_ID: matchId,
                    _isDirty: true,
                };
                const nextRows = sortRowsByEventId(
                    rows.map((row, index) => (index === editingIndex ? updatedRow : row))
                );
                const newIndex = nextRows.findIndex((row) => row._key === updatedRow._key);
                setRows(nextRows);

                if (persistToDb && onSaveRow) {
                    await onSaveRow(updatedRow, newIndex, "alahly_GKSDETAILS", setRows);
                }
            }

            closeModal(true);
        } catch (error) {
            addNotification(`Failed to save GK row: ${error.message}`, "error");
        } finally {
            setSavingModal(false);
        }
    };

    return (
        <div className="player-events-panel" style={{ "--panel-accent": color }}>
            <div className="player-events-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 4, height: 24, background: color, borderRadius: 4 }} />
                    <h3 className="player-events-title">
                        {title}
                        <span className="player-events-count">({rows.length} records)</span>
                    </h3>
                </div>
                <button
                    type="button"
                    className="player-events-add-btn"
                    onClick={() => openAddModal()}
                    disabled={isSaving || savingModal}
                >
                    <span>+</span> ADD GK
                </button>
            </div>

            {rows.length === 0 ? (
                <NoData_db message="NO GK DETAILS FOUND" height="240px" />
            ) : (
                <div className="player-events-grid">
                    {sortedEntries.map(({ row, index }) => (
                        <EditorEventCard
                            key={row._key ?? `${row.EVENT_ID}-${index}`}
                            row={row}
                            index={index}
                            isSaving={isSaving}
                            savingModal={savingModal}
                            onEdit={openEditModal}
                            onDelete={onDeleteRow}
                            tableName="alahly_GKSDETAILS"
                            setRows={setRows}
                            title={String(row["PLAYER NAME"] || "").trim() || UNNAMED_PLAYER_LABEL}
                            meta={String(row.TEAM || "").trim() || null}
                            description={formatGkLine(row)}
                        />
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="confirm-modal-overlay" onClick={closeModal}>
                    <div className="player-event-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="player-event-modal-head">
                            <h3>{editingIndex === null ? "ADD GK DETAIL" : "EDIT GK DETAIL"}</h3>
                        </div>

                        <div className="player-event-modal-grid">
                            <div className="player-event-modal-field">
                                <div className="field-label">EVENT ID</div>
                                <AutocompleteInput
                                    value={form.EVENT_ID ?? ""}
                                    options={eventIdOptions}
                                    placeholder="Link to player event"
                                    onChange={(val) => updateFormField("EVENT_ID", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">PLAYER NAME</div>
                                <AutocompleteInput
                                    value={form["PLAYER NAME"] ?? ""}
                                    options={allPlayersList}
                                    placeholder="Keeper name"
                                    onChange={(val) => updateFormField("PLAYER NAME", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">TEAM</div>
                                <AutocompleteInput
                                    value={form.TEAM ?? ""}
                                    options={teamOptions}
                                    placeholder="Team"
                                    onChange={(val) => updateFormField("TEAM", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">STATU</div>
                                <AutocompleteInput
                                    value={form.STATU ?? ""}
                                    options={statuOptions}
                                    placeholder="Status"
                                    onChange={(val) => updateFormField("STATU", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">OUT MINUTE</div>
                                <input
                                    value={form["OUT MINUTE"] ?? ""}
                                    onChange={(e) => updateFormField("OUT MINUTE", e.target.value)}
                                    className="field-input"
                                    placeholder="Out minute"
                                    style={{ width: "100%", height: "42px", fontSize: "14px" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">GOALS CONCEDED</div>
                                <input
                                    value={form["GOALS CONCEDED"] ?? ""}
                                    onChange={(e) => updateFormField("GOALS CONCEDED", e.target.value)}
                                    className="field-input"
                                    placeholder="Goals conceded"
                                    style={{ width: "100%", height: "42px", fontSize: "14px" }}
                                />
                            </div>
                        </div>

                        <div className="player-event-modal-actions">
                            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={closeModal} disabled={savingModal}>
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="player-event-modal-save"
                                onClick={handleModalSave}
                                disabled={savingModal || isSaving}
                                style={{ background: color }}
                            >
                                {savingModal ? "SAVING..." : "SAVE GK"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PenaltyMissesPanel({
    title,
    color,
    rows,
    setRows,
    matchId,
    teamOptions,
    howMissedOptions,
    playerEventRows,
    persistToDb,
    onSaveRow,
    onDeleteRow,
    isSaving,
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_PEN });
    const [savingModal, setSavingModal] = useState(false);
    const { addNotification } = useNotification();

    const sortedEntries = useMemo(() => listIndexedRowsByEventId(rows), [rows]);
    const eventIdOptions = useMemo(() => buildPlayerEventIdOptions(playerEventRows), [playerEventRows]);

    const openAddModal = (preset = {}) => {
        setEditingIndex(null);
        setForm({ ...EMPTY_PEN, MATCH_ID: matchId, ...preset });
        setModalOpen(true);
    };

    const openEditModal = (row, index) => {
        setEditingIndex(index);
        setForm({ ...EMPTY_PEN, ...row, MATCH_ID: row.MATCH_ID || matchId });
        setModalOpen(true);
    };

    const closeModal = (force = false) => {
        if (!force && savingModal) return;
        setModalOpen(false);
        setEditingIndex(null);
        setForm({ ...EMPTY_PEN });
    };

    const updateFormField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleModalSave = async () => {
        const cleanForm = { ...form };
        if (!isPenRowSaveable(cleanForm)) {
            addNotification("Fill HOW MISSED or MINUTE before saving.", "error");
            return;
        }

        setSavingModal(true);
        try {
            if (editingIndex === null) {
                const newRow = {
                    ...EMPTY_PEN,
                    ...cleanForm,
                    MATCH_ID: matchId,
                    EVENT_ID: String(cleanForm.EVENT_ID || "").trim(),
                    _isNew: true,
                    _key: Date.now(),
                };

                const nextRows = sortRowsByEventId([...rows, newRow]);
                const newIndex = nextRows.findIndex((row) => row._key === newRow._key);
                setRows(nextRows);

                if (persistToDb && onSaveRow) {
                    await onSaveRow(newRow, newIndex, "alahly_HOWPENMISSED", setRows);
                }
            } else {
                const existingRow = rows[editingIndex];
                const updatedRow = {
                    ...existingRow,
                    ...cleanForm,
                    MATCH_ID: matchId,
                    _isDirty: true,
                };
                const nextRows = sortRowsByEventId(
                    rows.map((row, index) => (index === editingIndex ? updatedRow : row))
                );
                const newIndex = nextRows.findIndex((row) => row._key === updatedRow._key);
                setRows(nextRows);

                if (persistToDb && onSaveRow) {
                    await onSaveRow(updatedRow, newIndex, "alahly_HOWPENMISSED", setRows);
                }
            }

            closeModal(true);
        } catch (error) {
            addNotification(`Failed to save penalty miss: ${error.message}`, "error");
        } finally {
            setSavingModal(false);
        }
    };

    return (
        <div className="player-events-panel" style={{ "--panel-accent": color }}>
            <div className="player-events-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 4, height: 24, background: color, borderRadius: 4 }} />
                    <h3 className="player-events-title">
                        {title}
                        <span className="player-events-count">({rows.length} misses)</span>
                    </h3>
                </div>
                <button
                    type="button"
                    className="player-events-add-btn"
                    onClick={() => openAddModal()}
                    disabled={isSaving || savingModal}
                >
                    <span>+</span> ADD PEN MISS
                </button>
            </div>

            {rows.length === 0 ? (
                <NoData_db message="NO PENALTY MISSES FOUND" height="240px" />
            ) : (
                <div className="player-events-grid">
                    {sortedEntries.map(({ row, index }) => (
                        <EditorEventCard
                            key={row._key ?? `${row.EVENT_ID}-${index}`}
                            row={row}
                            index={index}
                            isSaving={isSaving}
                            savingModal={savingModal}
                            onEdit={openEditModal}
                            onDelete={onDeleteRow}
                            tableName="alahly_HOWPENMISSED"
                            setRows={setRows}
                            title={String(row.TEAM || "").trim() || "—"}
                            description={formatPenLine(row)}
                        />
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="confirm-modal-overlay" onClick={closeModal}>
                    <div className="player-event-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="player-event-modal-head">
                            <h3>{editingIndex === null ? "ADD PENALTY MISS" : "EDIT PENALTY MISS"}</h3>
                        </div>

                        <div className="player-event-modal-grid">
                            <div className="player-event-modal-field">
                                <div className="field-label">EVENT ID</div>
                                <AutocompleteInput
                                    value={form.EVENT_ID ?? ""}
                                    options={eventIdOptions}
                                    placeholder="Select player event ID"
                                    onChange={(val) => updateFormField("EVENT_ID", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">TEAM</div>
                                <AutocompleteInput
                                    value={form.TEAM ?? ""}
                                    options={teamOptions}
                                    placeholder="Team"
                                    onChange={(val) => updateFormField("TEAM", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">HOW MISSED?</div>
                                <AutocompleteInput
                                    value={form["HOW MISSED?"] ?? ""}
                                    options={howMissedOptions}
                                    placeholder="How missed"
                                    onChange={(val) => updateFormField("HOW MISSED?", val)}
                                    className="field-input"
                                    accentColor={color}
                                    style={{ width: "100%", height: "42px", fontSize: "14px", background: "#fff" }}
                                />
                            </div>
                            <div className="player-event-modal-field">
                                <div className="field-label">MINUTE</div>
                                <input
                                    value={form.MINUTE ?? ""}
                                    onChange={(e) => updateFormField("MINUTE", e.target.value)}
                                    className="field-input"
                                    placeholder="Minute"
                                    style={{ width: "100%", height: "42px", fontSize: "14px" }}
                                />
                            </div>
                        </div>

                        <div className="player-event-modal-actions">
                            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={closeModal} disabled={savingModal}>
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="player-event-modal-save"
                                onClick={handleModalSave}
                                disabled={savingModal || isSaving}
                                style={{ background: color }}
                            >
                                {savingModal ? "SAVING..." : "SAVE PEN MISS"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LineupPlayerCard({
    row,
    slotLabel,
    variant,
    color,
    allPlayersList,
    starterNames,
    onFieldChange,
    onBlur,
    onDelete,
    isSaving,
}) {
    const isStarter = String(row.STATU || "").trim() === "اساسي";
    const isDirty = row._isNew || row._isDirty;
    const totalMin = String(row["TOTAL MINUTE"] || "").trim();
    const playerName = String(row["PLAYER NAME"] || "").trim();

    return (
        <div
            className={`lineup-player-card lineup-player-card--${variant}${isDirty ? " lineup-player-card--dirty" : ""}`}
            style={{ "--panel-accent": color }}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    onBlur(row);
                }
            }}
        >
            <div className="lineup-player-card-head">
                <span className="lineup-player-slot">{slotLabel}</span>
                {totalMin ? (
                    <span className="lineup-player-total">{totalMin}&apos;</span>
                ) : (
                    <span className="lineup-player-total lineup-player-total--empty">—</span>
                )}
                <button
                    type="button"
                    className="player-event-action-btn player-event-action-delete"
                    title="Remove"
                    disabled={isSaving}
                    onClick={onDelete}
                >
                    ✕
                </button>
            </div>

            <div className="lineup-player-card-body">
                <div className="lineup-player-field lineup-player-field--wide">
                    <div className="field-label">PLAYER NAME</div>
                    <AutocompleteInput
                        value={row["PLAYER NAME"] ?? ""}
                        options={allPlayersList}
                        placeholder="Player name"
                        onChange={(val) => onFieldChange("PLAYER NAME", val)}
                        className="field-input"
                        accentColor={color}
                        style={{ width: "100%", height: "38px", fontSize: "13px", background: "#fff" }}
                    />
                </div>

                <div className="lineup-player-field-row">
                    <div className="lineup-player-field">
                        <div className="field-label">STATU</div>
                        <AutocompleteInput
                            value={row.STATU ?? ""}
                            options={["اساسي", "احتياطي"]}
                            placeholder="Status"
                            onChange={(val) => onFieldChange("STATU", val)}
                            className="field-input"
                            accentColor={color}
                            style={{ width: "100%", height: "38px", fontSize: "13px", background: "#fff" }}
                        />
                    </div>
                    {!isStarter && (
                        <div className="lineup-player-field">
                            <div className="field-label">OUT MINUTE</div>
                            <input
                                value={row["OUT MINUTE"] ?? ""}
                                onChange={(e) => onFieldChange("OUT MINUTE", e.target.value)}
                                className="field-input"
                                placeholder="In min"
                                style={{ width: "100%", height: "38px", fontSize: "13px" }}
                            />
                        </div>
                    )}
                </div>

                {!isStarter && (
                    <div className="lineup-player-field lineup-player-field--wide">
                        <div className="field-label">PLAYER NAME OUT</div>
                        <AutocompleteInput
                            value={row["PLAYER NAME OUT"] ?? ""}
                            options={starterNames}
                            placeholder="Subbed for"
                            onChange={(val) => onFieldChange("PLAYER NAME OUT", val)}
                            className="field-input"
                            accentColor={color}
                            style={{ width: "100%", height: "38px", fontSize: "13px", background: "#fff" }}
                        />
                    </div>
                )}

                {isStarter && playerName && (
                    <div className="lineup-player-starter-badge">Starter</div>
                )}
            </div>
        </div>
    );
}

function LineupPanel({
    title,
    color,
    rows,
    setRows,
    matchId,
    teamName,
    allPlayersList,
    persistToDb,
    onSaveRow,
    onDeleteRow,
    isSaving,
}) {
    const savingRef = useRef(new Set());
    const rowsRef = useRef(rows);
    rowsRef.current = rows;
    const matchMinute = String(rows[0]?.["MATCH MINUTE"] || "90").trim() || "90";

    const starterNames = useMemo(
        () =>
            rows
                .filter((r) => String(r.STATU || "").trim() === "اساسي" && String(r["PLAYER NAME"] || "").trim())
                .map((r) => String(r["PLAYER NAME"]).trim())
                .sort((a, b) => a.localeCompare(b, "ar")),
        [rows]
    );

    const starters = useMemo(
        () => rows.filter((r) => String(r.STATU || "").trim() === "اساسي"),
        [rows]
    );

    const bench = useMemo(
        () => rows.filter((r) => String(r.STATU || "").trim() !== "اساسي"),
        [rows]
    );

    const updateField = (rowKey, field, value) => {
        setRows((prev) =>
            prev.map((r) => (r._key === rowKey ? { ...r, [field]: value, _isDirty: true } : r))
        );
    };

    const updateMatchMinute = (value) => {
        setRows((prev) => prev.map((r) => ({ ...r, "MATCH MINUTE": value, _isDirty: true })));
    };

    const handleCardBlur = (row) => {
        if (!persistToDb || !onSaveRow || isSaving) return;

        window.setTimeout(async () => {
            const latestRows = rowsRef.current;
            const currentRow = latestRows.find((r) => r._key === row._key);
            if (!currentRow) return;
            if (!String(currentRow["PLAYER NAME"] || "").trim()) return;
            if (!currentRow._isDirty && !currentRow._isNew) return;

            const rowKey = currentRow._key;
            if (savingRef.current.has(rowKey)) return;

            const idx = latestRows.findIndex((r) => r._key === rowKey);
            if (idx < 0) return;

            savingRef.current.add(rowKey);
            try {
                await onSaveRow(currentRow, idx, "alahly_LINEUPDETAILS");
            } finally {
                savingRef.current.delete(rowKey);
            }
        }, 0);
    };

    const handleAddSub = () => {
        setRows((prev) => [
            ...prev,
            {
                ...EMPTY_LINEUP,
                "MATCH MINUTE": matchMinute,
                TEAM: teamName,
                STATU: "احتياطي",
                MATCH_ID: matchId,
                _isNew: true,
                _key: `lineup-add-${Date.now()}`,
            },
        ]);
    };

    const handleDelete = (row, variant) => {
        const idx = rows.findIndex((r) => r._key === row._key);
        if (idx < 0) return;

        if (persistToDb && variant === "starter") {
            setRows((prev) =>
                prev.map((r) => {
                    if (r._key !== row._key) return r;
                    return {
                        ...createEmptyStarterSlot(matchId, teamName, 0, matchMinute),
                        _key: r._key,
                        ROW_ID: r.ROW_ID,
                        _isNew: !r.ROW_ID,
                        _isDirty: true,
                    };
                })
            );
            return;
        }

        if (onDeleteRow) {
            onDeleteRow(row, idx, "alahly_LINEUPDETAILS", setRows);
        } else {
            setRows((prev) => prev.filter((_, i) => i !== idx));
        }
    };

    const renderCard = (row, slotLabel, variant) => (
        <LineupPlayerCard
            key={row._key ?? `${variant}-${slotLabel}`}
            row={row}
            slotLabel={slotLabel}
            variant={variant}
            color={color}
            allPlayersList={allPlayersList}
            starterNames={starterNames}
            onFieldChange={(field, value) => updateField(row._key, field, value)}
            onBlur={handleCardBlur}
            onDelete={() => handleDelete(row, variant)}
            isSaving={isSaving}
        />
    );

    return (
        <div className="lineup-panel player-events-panel" style={{ "--panel-accent": color }}>
            <div className="player-events-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 4, height: 24, background: color, borderRadius: 4 }} />
                    <h3 className="player-events-title">
                        {title}
                        <span className="player-events-count">({rows.length} slots)</span>
                    </h3>
                </div>
            </div>

            <div className="lineup-settings-card">
                <div className="lineup-settings-main">
                    <div className="lineup-settings-label">MATCH MINUTE</div>
                    <input
                        type="text"
                        className="field-input lineup-minute-input"
                        value={matchMinute}
                        onChange={(e) => updateMatchMinute(e.target.value)}
                        placeholder="90"
                    />
                </div>
                <p className="lineup-settings-hint">
                    Total minutes for all players are calculated from this value.
                    {persistToDb ? " Changes auto-save when you leave each player card." : ""}
                </p>
            </div>

            <h4 className="lineup-section-title">STARTING XI</h4>
            <div className="player-events-grid lineup-grid">
                {starters.map((row, i) => renderCard(row, `#${i + 1}`, "starter"))}
            </div>

            {bench.length > 0 && (
                <>
                    <h4 className="lineup-section-title">BENCH</h4>
                    <div className="player-events-grid lineup-grid">
                        {bench.map((row, i) => renderCard(row, `SUB ${i + 1}`, "bench"))}
                    </div>
                </>
            )}

            <button
                type="button"
                className="lineup-add-sub-btn"
                onClick={handleAddSub}
                disabled={isSaving}
            >
                + ADD SUB
            </button>
        </div>
    );
}

// â”€â”€ Main Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AlAhlyEditor() {
    const [searchId, setSearchId] = useState('');
    const [matchData, setMatchData] = useState(null);       // MATCHDETAILS record
    const [lineupRows, setLineupRows] = useState([]);
    const [playerRows, setPlayerRows] = useState([]);
    const [gkRows, setGkRows] = useState([]);
    const [penRows, setPenRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState('search'); // 'search' | 'edit' | 'new'
    const { addNotification } = useNotification();
    const [newMatchData, setNewMatchData] = useState({ ...EMPTY_MATCH });
    const [activeLinkedTab, setActiveLinkedTab] = useState('lineup-ahly');
    // new match linked rows (staged before create)
    const [newLineupRows, setNewLineupRows] = useState([]);
    const [newPlayerRows, setNewPlayerRows] = useState([]);
    const [newGkRows, setNewGkRows] = useState([]);
    const [newPenRows, setNewPenRows] = useState([]);
    const [nextMatchNum, setNextMatchNum] = useState(null);
    const [matchFieldOptions, setMatchFieldOptions] = useState({}); // unique values per column
    const [allPlayersList, setAllPlayersList] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [eventSubTypes, setEventSubTypes] = useState([]);
    const [howMissedOptions, setHowMissedOptions] = useState([]);
    const [wdlFinalOptions, setWdlFinalOptions] = useState([]);
    const [catalogLists, setCatalogLists] = useState({ managers: [], stadiums: [], referees: [] });
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Fields that use autocomplete (not date/number/auto)
    const AUTOCOMPLETE_FIELDS = [
        'CHAMPION SYSTEM', 'CHAMPION', 'SEASON - NAME', 'SEASON - NUMBER', 'AHLY MANAGER', 'OPPONENT MANAGER',
        'REFREE', 'ROUND', 'H-A-N', 'STAD', 'AHLY TEAM', 'ET', 'PEN', 'OPPONENT TEAM', 'NOTE'
    ];

    // Fetch all players globally from catalog using display language setting
    useEffect(() => {
        let cancelled = false;

        const loadCatalogLists = async () => {
            try {
                const [players, managers, stadiums, referees] = await Promise.all([
                    fetchCatalogDisplayNames('db_PLAYERS'),
                    fetchCatalogDisplayNames('db_MANAGERS'),
                    fetchCatalogDisplayNames('db_STADIUMS'),
                    fetchCatalogDisplayNames('db_REFEREES'),
                ]);

                if (cancelled) return;
                setAllPlayersList(players);

                const fetchUniqueCol = async (tableName, col) => {
                    let results = [];
                    let from = 0;
                    while (true) {
                        const { data } = await supabase.from(tableName).select(`"${col}"`).range(from, from + 999);
                        if (!data || data.length === 0) break;
                        results.push(...data.map(d => d[col]).filter(Boolean));
                        if (data.length < 1000) break;
                        from += 1000;
                    }
                    return [...new Set(results)].sort((a, b) => a.localeCompare(b, 'ar'));
                };

                const t = await fetchUniqueCol('alahly_PLAYERDETAILS', 'TYPE');
                setEventTypes(t);
                const ts = await fetchUniqueCol('alahly_PLAYERDETAILS', 'TYPE_SUB');
                setEventSubTypes(ts);
                const hm = await fetchUniqueCol('alahly_HOWPENMISSED', 'HOW MISSED?');
                setHowMissedOptions(hm);
                const wdlFinal = await fetchUniqueCol('alahly_MATCHDETAILS', 'W-D-L FINAL');
                setWdlFinalOptions(wdlFinal);

                setCatalogLists({
                    managers,
                    stadiums,
                    referees,
                });
            } catch (error) {
                console.error("Error fetching catalog lists for dropdown:", error);
            }
        };

        loadCatalogLists();
        window.addEventListener("nameDisplayLangChanged", loadCatalogLists);
        return () => {
            cancelled = true;
            window.removeEventListener("nameDisplayLangChanged", loadCatalogLists);
        };
    }, []);

    // Fetch max number + unique column values when entering 'new' or 'edit' mode
    useEffect(() => {
        if (mode !== 'new' && mode !== 'edit') return;
        (async () => {
            const { data } = await supabase.from('alahly_MATCHDETAILS').select('*');
            if (!data) return;

            // Max trailing number for next ID
            const nums = data.map(r => {
                const m = String(r.MATCH_ID).match(/(\d+)$/);
                return m ? parseInt(m[1], 10) : 0;
            });
            setNextMatchNum(Math.max(0, ...nums) + 1);

            // Use catalog lists loaded with the global display language setting
            const managerList = catalogLists.managers;
            const stadiumList = catalogLists.stadiums;
            const refereeList = catalogLists.referees;

            // Unique values per column
            const opts = {};
            AUTOCOMPLETE_FIELDS.forEach(col => {
                if (['AHLY MANAGER', 'OPPONENT MANAGER'].includes(col)) {
                    opts[col] = managerList;
                } else if (col === 'STAD') {
                    opts[col] = stadiumList;
                } else if (col === 'REFREE') {
                    opts[col] = refereeList;
                } else {
                    opts[col] = [...new Set(data.map(r => r[col]).filter(Boolean))].sort();
                }
            });
            setMatchFieldOptions(opts);
        })();
    }, [mode, catalogLists]);

    // Auto-build MATCH_ID when OPPONENT TEAM or nextMatchNum changes
    useEffect(() => {
        if (mode !== 'new' || nextMatchNum === null) return;
        const opp = newMatchData['OPPONENT TEAM'] || '';
        setNewMatchData(prev => ({ ...prev, MATCH_ID: opp ? `${opp}${nextMatchNum}` : '' }));
    }, [newMatchData['OPPONENT TEAM'], nextMatchNum]);

    // Auto-suggest FINAL_ID for new final matches
    useEffect(() => {
        if (mode !== 'new' || !isFinalRound(newMatchData.ROUND) || newMatchData.FINAL_ID) return;
        (async () => {
            const { data } = await supabase.from('alahly_MATCHDETAILS').select('FINAL_ID');
            const nums = (data || []).map(r => {
                const m = String(r.FINAL_ID || '').match(/FINAL-(\d+)$/i);
                return m ? parseInt(m[1], 10) : 0;
            });
            const next = Math.max(0, ...nums, 0) + 1;
            setNewMatchData(prev => ({ ...prev, FINAL_ID: `FINAL-${String(next).padStart(4, '0')}` }));
        })();
    }, [mode, newMatchData.ROUND, newMatchData.FINAL_ID]);

    const renderFinalIdField = (formData, setFormData) => (
        <div key="FINAL_ID">
            <div className="field-label">FINAL_ID</div>
            <input
                type="text"
                value={formData.FINAL_ID ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, FINAL_ID: e.target.value }))}
                className="field-input"
                onFocus={e => { e.target.style.borderColor = '#c9a84c'; }}
                onBlur={e => { e.target.style.borderColor = '#e8e8e8'; }}
            />
        </div>
    );

    const renderWdlFinalField = (formData, setFormData) => (
        <div key="W-D-L FINAL">
            <div className="field-label">W-D-L FINAL</div>
            <AutocompleteInput
                value={formData["W-D-L FINAL"] ?? ''}
                options={wdlFinalOptions}
                onChange={val => setFormData(prev => ({ ...prev, "W-D-L FINAL": val }))}
                className="field-input"
                accentColor="#c9a84c"
            />
        </div>
    );

    const renderMatchField = (field, formData, setFormData, { matchIdAuto = false } = {}) => (
        <div key={field}>
            <div className="field-label" style={{ color: field === 'MATCH_ID' && matchIdAuto ? '#22c55e' : '#999' }}>
                {field} {field === 'MATCH_ID' && matchIdAuto && <span style={{ color: '#aaa', fontWeight: 400, letterSpacing: 0 }}>(auto)</span>}
            </div>
            {AUTOCOMPLETE_FIELDS.includes(field) ? (
                <AutocompleteInput
                    value={formData[field] ?? ''}
                    options={matchFieldOptions[field] || []}
                    onChange={val => setFormData(prev => ({ ...prev, [field]: val }))}
                    className="field-input"
                    accentColor="#c9a84c"
                />
            ) : (
                <input
                    type={field === 'DATE' ? 'date' : 'text'}
                    value={formData[field] ?? ''}
                    disabled={field === 'MATCH_ID'}
                    onChange={e => {
                        if (field === 'MATCH_ID') return;
                        setFormData(prev => ({ ...prev, [field]: e.target.value }));
                    }}
                    className="field-input"
                    style={{
                        border: field === 'MATCH_ID' && matchIdAuto ? '2px solid #22c55e' : '1.5px solid #e8e8e8',
                        background: field === 'MATCH_ID' && matchIdAuto ? 'rgba(34,197,94,0.05)' : '#fff',
                    }}
                    onFocus={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#c9a84c'; }}
                    onBlur={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = field === 'MATCH_ID' && matchIdAuto ? '#22c55e' : '#e8e8e8'; }}
                />
            )}
        </div>
    );

    const renderMatchFieldsGrid = (formData, setFormData, { matchIdAuto = false } = {}) =>
        Object.keys(EMPTY_MATCH).filter(field => field !== 'MOTM').flatMap(field => {
            const showFinal = isFinalRound(formData.ROUND);
            if (field === 'MATCH_ID') {
                return [
                    renderMatchField(field, formData, setFormData, { matchIdAuto }),
                    ...(showFinal ? [renderFinalIdField(formData, setFormData)] : []),
                ];
            }
            if (field === 'NOTE') {
                return [
                    ...(showFinal ? [renderWdlFinalField(formData, setFormData)] : []),
                    renderMatchField(field, formData, setFormData, { matchIdAuto }),
                ];
            }
            return [renderMatchField(field, formData, setFormData, { matchIdAuto })];
        });

    const handleNewLineupRows = useCallback((action) => {
        setNewLineupRows((prev) => mergeTeamLineupUpdate(prev, () => true, action, applyLineupLogic));
    }, []);

    const makeNewAhlyLineupSetter = useCallback((formData) => {
        const ahlyTeam = resolveAhlyTeam(formData);
        const filter = (r) => isLineupForAhly(r, ahlyTeam);
        return (action) => setNewLineupRows((prev) => mergeTeamLineupUpdate(prev, filter, action, applyLineupLogic));
    }, []);

    const makeNewOpponentLineupSetter = useCallback((formData) => {
        const ahlyTeam = resolveAhlyTeam(formData);
        const oppTeam = resolveOpponentTeam(formData);
        const filter = (r) => isLineupForOpponent(r, oppTeam, ahlyTeam);
        return (action) => setNewLineupRows((prev) => mergeTeamLineupUpdate(prev, filter, action, applyLineupLogic));
    }, []);

    const makeEditAhlyLineupSetter = useCallback((formData) => {
        const ahlyTeam = resolveAhlyTeam(formData);
        const filter = (r) => isLineupForAhly(r, ahlyTeam);
        return (action) => setLineupRows((prev) => mergeTeamLineupUpdate(prev, filter, action, applyLineupLogic));
    }, []);

    const makeEditOpponentLineupSetter = useCallback((formData) => {
        const ahlyTeam = resolveAhlyTeam(formData);
        const oppTeam = resolveOpponentTeam(formData);
        const filter = (r) => isLineupForOpponent(r, oppTeam, ahlyTeam);
        return (action) => setLineupRows((prev) => mergeTeamLineupUpdate(prev, filter, action, applyLineupLogic));
    }, []);

    const handleEditLineupRows = useCallback((action) => {
        setLineupRows((prev) => mergeTeamLineupUpdate(prev, () => true, action, applyLineupLogic));
    }, []);

    useEffect(() => {
        if (mode === 'new') {
            const ahlyTeam = resolveAhlyTeam(newMatchData);
            const oppTeam = resolveOpponentTeam(newMatchData);
            const matchId = newMatchData.MATCH_ID || '';
            const ahlyRows = createInitialTeamLineup(matchId, ahlyTeam);
            const oppRows = oppTeam ? createInitialTeamLineup(matchId, oppTeam) : [];
            handleNewLineupRows([...ahlyRows, ...oppRows]);
            setActiveLinkedTab('lineup-ahly');
        }
    }, [mode]);

    useEffect(() => {
        if (mode !== 'new') return;
        const oppTeam = resolveOpponentTeam(newMatchData);
        if (!oppTeam) return;

        setNewLineupRows((prev) => {
            const ahlyTeam = resolveAhlyTeam(newMatchData);
            const matchId = newMatchData.MATCH_ID || '';
            const nonAhlyRows = prev.filter((r) => !isLineupForAhly(r, ahlyTeam));

            if (nonAhlyRows.length === 0) {
                return [...prev, ...createInitialTeamLineup(matchId, oppTeam)];
            }

            return prev.map((r) => {
                if (isLineupForAhly(r, ahlyTeam)) {
                    return { ...r, MATCH_ID: matchId || r.MATCH_ID };
                }
                return { ...r, TEAM: oppTeam, MATCH_ID: matchId || r.MATCH_ID };
            });
        });
    }, [newMatchData['OPPONENT TEAM'], newMatchData.MATCH_ID, mode]);

    useEffect(() => {
        if (mode === 'new') {
            setNewLineupRows(prev => prev.map(r => ({ ...r, MATCH_ID: newMatchData.MATCH_ID || '' })));
        }
    }, [newMatchData.MATCH_ID, mode]);

    const addToast = (msg, type = 'success') => {
        addNotification(msg, type);
    };

    const resolveNextPlayerEventId = useCallback(async (matchId, currentRows = [], excludeKey = null) => {
        const normalizedMatchId = String(matchId || "").trim();
        if (!normalizedMatchId) return "";

        const localRows = currentRows.filter((row) => row._key !== excludeKey);
        let combined = [...localRows];

        const { data: dbEvents, error } = await supabase
            .from("alahly_PLAYERDETAILS")
            .select("EVENT_ID")
            .eq("MATCH_ID", normalizedMatchId);

        if (error) throw error;
        if (dbEvents?.length) {
            combined = [...combined, ...dbEvents.map((event) => ({ EVENT_ID: event.EVENT_ID }))];
        }

        return getNextPlayerEventId(normalizedMatchId, combined);
    }, []);

    const handleStagedDelete = useCallback((row, ri, _tableName, setterFn) => {
        setterFn?.((prev) => {
            const idx = findRowIndexInList(prev, row, ri);
            return prev.filter((_, i) => i !== idx);
        });
    }, []);

    // â”€â”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSearch = async () => {
        const id = searchId.trim();
        if (!id) return;
        setLoading(true);
        try {
            const [{ data: md }, { data: ld }, { data: pd }, { data: gd }, { data: pen }] = await Promise.all([
                supabase.from('alahly_MATCHDETAILS').select('*').eq('MATCH_ID', id).maybeSingle(),
                supabase.from('alahly_LINEUPDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('alahly_PLAYERDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('alahly_GKSDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('alahly_HOWPENMISSED').select('*').eq('MATCH_ID', id),
            ]);
            if (!md) { addToast(`Match ID "${id}" not found`, 'error'); setLoading(false); return; }
            setMatchData({ ...md });
            if (!ld || ld.length === 0) {
                setLineupRows(normalizeSavedMatchLineup([], id, md));
            } else {
                setLineupRows(normalizeSavedMatchLineup(ld, id, md));
            }
            setActiveLinkedTab('lineup-ahly');
            setPlayerRows(sortRowsByEventId((pd || []).map((r, i) => ({ ...r, _key: r._key ?? 1000 + i }))));
            setGkRows(sortRowsByEventId((gd || []).map((r, i) => ({ ...r, _key: r._key ?? 2000 + i }))));
            setPenRows(sortRowsByEventId((pen || []).map((r, i) => ({
                ...normalizeHowPenMissedRowForEditor(r),
                _key: r._key ?? 3000 + i,
            }))));
            setMode('edit');
        } catch (e) { addToast('Error: ' + e.message, 'error'); }
        setLoading(false);
    };

    // â”€â”€ Save a single row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSaveRow = useCallback(async (row, ri, tableName, setterFn) => {
        if (isSaving) return;
        setIsSaving(true);
        const { _isNew, _isDirty, _key, ...cleanRow } = row;

        if (!cleanRow.MATCH_ID && matchData) cleanRow.MATCH_ID = matchData.MATCH_ID;

        if (cleanRow.ROW_ID === "" || cleanRow.ROW_ID === null || cleanRow.ROW_ID === undefined) {
            delete cleanRow.ROW_ID;
        }

        try {
            if (tableName === "alahly_PLAYERDETAILS" && _isNew && !String(cleanRow.EVENT_ID || "").trim() && cleanRow.MATCH_ID) {
                cleanRow.EVENT_ID = await resolveNextPlayerEventId(cleanRow.MATCH_ID, playerRows, row._key);
            }

            const payload = tableName === "alahly_HOWPENMISSED"
                ? sanitizeHowPenMissedRowForSave(cleanRow)
                : cleanRow;

            let result;
            if (_isNew) {
                result = await supabase.from(tableName).insert(payload).select();
            } else if (payload.ROW_ID) {
                result = await supabase.from(tableName).update(payload).eq('ROW_ID', payload.ROW_ID).select();
            } else {
                result = await supabase.from(tableName).upsert(payload).select();
            }

            if (result.error) {
                addNotification(`Supabase Error (${tableName}):\n${result.error.message}\n${result.error.hint || ''}`, "error");
                throw result.error;
            }

            const savedRow = result.data?.[0];
            if (!savedRow) throw new Error("No data returned from DB after save success.");

            addToast(row._isNew ? 'Row inserted ✓' : 'Row updated ✓');

            const setterMap = {
                'alahly_LINEUPDETAILS': setLineupRows,
                'alahly_PLAYERDETAILS': setPlayerRows,
                'alahly_GKSDETAILS': setGkRows,
                'alahly_HOWPENMISSED': setPenRows,
            };

            const applyUpdate = (prev) => {
                const idx = findRowIndexInList(prev, row, ri);
                let merged = { ...prev[idx], ...savedRow, _isNew: false, _isDirty: false };
                if (tableName === "alahly_HOWPENMISSED") {
                    merged = normalizeHowPenMissedRowForEditor(merged);
                }
                const updated = prev.map((r, i) => (i === idx ? merged : r));
                if (
                    tableName === "alahly_PLAYERDETAILS" ||
                    tableName === "alahly_GKSDETAILS" ||
                    tableName === "alahly_HOWPENMISSED"
                ) {
                    return sortRowsByEventId(updated);
                }
                return updated;
            };

            (setterFn || setterMap[tableName])?.(applyUpdate);
        } catch (e) {
            console.error("Save Error:", e);
            addToast('Save FAILED: ' + (e.message || "Unknown error"), 'error');
        } finally {
            setIsSaving(false);
        }
    }, [matchData, playerRows, resolveNextPlayerEventId, isSaving]);



    // â”€â”€ Delete a row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleDeleteRow = useCallback((row, ri, tableName, setterFn) => {
        setConfirmDelete({ row, ri, tableName, setterFn });
    }, []);

    const executeDeleteRow = useCallback(async () => {
        if (!confirmDelete) return;
        const { row, ri, tableName, setterFn } = confirmDelete;
        setConfirmDelete(null);

        const setterMap = {
            alahly_LINEUPDETAILS: setLineupRows,
            alahly_PLAYERDETAILS: setPlayerRows,
            alahly_GKSDETAILS: setGkRows,
            alahly_HOWPENMISSED: setPenRows,
        };
        const applyRemove = (prev) => {
            const idx = findRowIndexInList(prev, row, ri);
            return prev.filter((_, i) => i !== idx);
        };

        if (!row._isNew) {
            try {
                if (row.ROW_ID) {
                    const { error: delErr } = await supabase.from(tableName).delete().eq("ROW_ID", row.ROW_ID);
                    if (delErr) throw delErr;
                    (setterFn || setterMap[tableName])?.(applyRemove);
                } else {
                    let remaining;
                    const currentSetter = setterFn || setterMap[tableName];
                    currentSetter((prev) => {
                        const idx = findRowIndexInList(prev, row, ri);
                        remaining = prev
                            .filter((_, i) => i !== idx)
                            .map(({ _isNew, _isDirty, _key, ...clean }) => clean);
                        return prev.filter((_, i) => i !== idx);
                    });
                    const { error: delErr } = await supabase.from(tableName).delete().eq("MATCH_ID", matchData.MATCH_ID);
                    if (delErr) throw delErr;
                    if (remaining && remaining.length > 0) {
                        const { error: insErr } = await supabase.from(tableName).insert(remaining);
                        if (insErr) throw insErr;
                    }
                }

                addToast("Row deleted ✓", "warn");
            } catch (e) {
                addToast("Delete failed: " + e.message, "error");
            }
        } else {
            (setterFn || setterMap[tableName])?.(applyRemove);
        }
    }, [confirmDelete, matchData]);

    // â”€â”€ Save Match Details (Global Save) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSaveMatch = async () => {
        if (isSaving) return; // Prevent overlapping saves
        setIsSaving(true);
        try {

            // 1. Save main match details (exclude W-D-L and CLEAN SHEET from database payload)
            const { "W-D-L": wdl, "CLEAN SHEET": cs, ...cleanMatchData } = matchData;
            const { error: matchErr } = await supabase.from('alahly_MATCHDETAILS').upsert(cleanMatchData);
            if (matchErr) throw matchErr;

            // 2. Helper to save pending changes in linked tables
            const saveLinkedTable = async (tableName, rows, setter) => {
                const pending = rows.filter(r => r._isNew || r._isDirty);
                const filled = pending.filter((r) => isEditorLinkedRowFilled(tableName, r));
                if (filled.length === 0) return;

                // Split into new (INSERT) and existing (UPSERT)
                const toInsert = filled.filter(r => r._isNew);
                const toUpdate = filled.filter(r => !r._isNew);

                const cleanObj = (r, isNew) => {
                    const { _isNew, _isDirty, _key, ...clean } = { ...r, MATCH_ID: matchData.MATCH_ID };
                    // For new rows, never send ROW_ID to allow DB to generate it
                    if (isNew || !clean.ROW_ID || clean.ROW_ID === "" || clean.ROW_ID === null) {
                        delete clean.ROW_ID;
                    }
                    return tableName === "alahly_HOWPENMISSED"
                        ? sanitizeHowPenMissedRowForSave(clean)
                        : clean;
                };

                let savedResults = [];

                try {
                    // Separate calls to prevent PostgREST mixed-batch NULL issues
                    if (toInsert.length > 0) {
                        const { data, error: insErr } = await supabase.from(tableName).insert(toInsert.map(r => cleanObj(r, true))).select();
                        if (insErr) throw insErr;
                        if (data) savedResults.push(...data);
                    }

                    if (toUpdate.length > 0) {
                        const { data, error: upErr } = await supabase.from(tableName).upsert(toUpdate.map(r => cleanObj(r, false))).select();
                        if (upErr) throw upErr;
                        if (data) savedResults.push(...data);
                    }
                } catch (e) {
                    console.error(`Error saving ${tableName}:`, e);
                    throw new Error(`${tableName}: ${e.message}`);
                }

                // Reflect saved state back to UI
                if (savedResults.length > 0) {
                    setter(prev => prev.map(existingRow => {
                        const saved = savedResults.find(s =>
                            (existingRow.ROW_ID && s.ROW_ID === existingRow.ROW_ID) ||
                            (existingRow._isNew && !existingRow.ROW_ID &&
                                s["PLAYER NAME"] === existingRow["PLAYER NAME"] &&
                                s.TEAM === existingRow.TEAM)
                        );
                        return saved ? { ...existingRow, ...saved, _isNew: false, _isDirty: false } : existingRow;
                    }));
                }
            };

            // Run saves for all tabs in parallel
            await Promise.all([
                saveLinkedTable('alahly_LINEUPDETAILS', lineupRows, setLineupRows),
                saveLinkedTable('alahly_PLAYERDETAILS', playerRows, setPlayerRows),
                saveLinkedTable('alahly_GKSDETAILS', gkRows, setGkRows),
                saveLinkedTable('alahly_HOWPENMISSED', penRows, setPenRows),
            ]);

            addToast('Match and all pending records saved ✓');
        } catch (e) {
            console.error("Global Save Error:", e);
            addNotification(`Global Save Failed:\n${e.message}`, "error");
            addToast('Save Failed: ' + e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };


    // â”€â”€ Create New Match â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleCreateMatch = async () => {
        if (!newMatchData.MATCH_ID) { addToast('MATCH_ID is required', 'error'); return; }
        setIsSaving(true);
        const mid = newMatchData.MATCH_ID;
        try {
            // 1. Insert main match record (exclude W-D-L and CLEAN SHEET from database payload)
            const { "W-D-L": wdl, "CLEAN SHEET": cs, ...cleanNewMatchData } = newMatchData;
            const { error: matchErr } = await supabase.from('alahly_MATCHDETAILS').insert(cleanNewMatchData);
            if (matchErr) {
                console.error("Match Insert Error:", matchErr);
                throw new Error(`Match Details: ${matchErr.message}`);
            }

            // 2. Helper to insert staged linked rows with error checking
            const saveStagedTable = async (tableName, rows) => {
                const filled = rows.filter((r) => isEditorLinkedRowFilled(tableName, r));
                if (filled.length === 0) return;

                const clean = filled.map(({ _isNew, _isDirty, _key, ...r }) => {
                    const row = { ...r, MATCH_ID: mid };
                    if (row.ROW_ID === "" || row.ROW_ID === null) delete row.ROW_ID;
                    return tableName === "alahly_HOWPENMISSED"
                        ? sanitizeHowPenMissedRowForSave(row)
                        : row;
                });

                const { error: insErr } = await supabase.from(tableName).insert(clean);
                if (insErr) {
                    console.error(`Error saving ${tableName}:`, insErr);
                    throw new Error(`${tableName}: ${insErr.message}`);
                }
            };

            // 3. Batch insert all linked data
            await Promise.all([
                saveStagedTable('alahly_LINEUPDETAILS', newLineupRows),
                saveStagedTable('alahly_PLAYERDETAILS', newPlayerRows),
                saveStagedTable('alahly_GKSDETAILS', newGkRows),
                saveStagedTable('alahly_HOWPENMISSED', newPenRows),
            ]);

            addToast('Match + all linked data created ✓');
            setSearchId(mid);
            // Reset states
            setNewLineupRows([]); setNewPlayerRows([]); setNewGkRows([]); setNewPenRows([]);
            setMode('search');
            // Auto-load the newly created match
            setTimeout(() => handleSearch(), 400);

        } catch (e) {
            console.error("Create Match Error:", e);
            addNotification(`Failed to create match:\n${e.message}`, "error");
            addToast('Error: ' + e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const matchInfoFields = Object.keys(EMPTY_MATCH);

    const renderPlayerEventsPanel = ({ formData, isNew }) => {
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;
        const teamOptions = [formData["AHLY TEAM"], formData["OPPONENT TEAM"]].filter(Boolean);
        return (
            <PlayerEventsPanel
                title="PLAYER EVENTS"
                color="#8b5cf6"
                rows={isNew ? newPlayerRows : playerRows}
                setRows={isNew ? setNewPlayerRows : setPlayerRows}
                matchId={matchId}
                teamOptions={teamOptions}
                allPlayersList={allPlayersList}
                eventTypes={eventTypes}
                eventSubTypes={eventSubTypes}
                persistToDb={!isNew}
                onSaveRow={handleSaveRow}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isNew ? false : isSaving}
                resolveNextEventId={resolveNextPlayerEventId}
            />
        );
    };

    const renderGkDetailsPanel = ({ formData, isNew }) => {
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;
        const teamOptions = [formData["AHLY TEAM"], formData["OPPONENT TEAM"]].filter(Boolean);
        const playerEventRows = isNew ? newPlayerRows : playerRows;
        return (
            <GkDetailsPanel
                title="GK DETAILS"
                color="#f59e0b"
                rows={isNew ? newGkRows : gkRows}
                setRows={isNew ? setNewGkRows : setGkRows}
                matchId={matchId}
                teamOptions={teamOptions}
                allPlayersList={allPlayersList}
                playerEventRows={playerEventRows}
                persistToDb={!isNew}
                onSaveRow={handleSaveRow}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isNew ? false : isSaving}
            />
        );
    };

    const renderPenaltyMissesPanel = ({ formData, isNew }) => {
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;
        const teamOptions = [formData["AHLY TEAM"], formData["OPPONENT TEAM"]].filter(Boolean);
        const playerEventRows = isNew ? newPlayerRows : playerRows;
        return (
            <PenaltyMissesPanel
                title="PENALTY MISSES"
                color="#ef4444"
                rows={isNew ? newPenRows : penRows}
                setRows={isNew ? setNewPenRows : setPenRows}
                matchId={matchId}
                teamOptions={teamOptions}
                howMissedOptions={howMissedOptions}
                playerEventRows={playerEventRows}
                persistToDb={!isNew}
                onSaveRow={handleSaveRow}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isNew ? false : isSaving}
            />
        );
    };

    const renderLinkedTabBar = (formData) => {
        const ahlyTeam = resolveAhlyTeam(formData);
        const oppTeam = resolveOpponentTeam(formData);
        const tabStyle = (tabId, activeBg, activeColor = '#fff') => ({
            background: activeLinkedTab === tabId ? activeBg : '#f8f8f8',
            color: activeLinkedTab === tabId ? activeColor : '#888',
        });

        return (
            <div className="linked-tabs-grid linked-tabs-grid--6">
                <button type="button" onClick={() => setActiveLinkedTab('lineup-ahly')} className="tab-btn" style={tabStyle('lineup-ahly', '#c9a84c', '#0a0a0a')}>
                    LINEUP — {ahlyTeam}
                </button>
                <button
                    type="button"
                    onClick={() => oppTeam && setActiveLinkedTab('lineup-opponent')}
                    className="tab-btn"
                    style={tabStyle('lineup-opponent', '#3b82f6')}
                    disabled={!oppTeam}
                    title={!oppTeam ? 'Select OPPONENT TEAM in match details first' : undefined}
                >
                    LINEUP — {oppTeam || 'OPPONENT'}
                </button>
                <button type="button" onClick={() => setActiveLinkedTab('events')} className="tab-btn" style={tabStyle('events', '#8b5cf6')}>PLAYER EVENTS</button>
                <button type="button" onClick={() => setActiveLinkedTab('motm')} className="tab-btn" style={tabStyle('motm', '#10b981')}>MOTM</button>
                <button type="button" onClick={() => setActiveLinkedTab('gks')} className="tab-btn" style={tabStyle('gks', '#f59e0b')}>GK DETAILS</button>
                <button type="button" onClick={() => setActiveLinkedTab('pens')} className="tab-btn" style={tabStyle('pens', '#ef4444')}>PENALTY MISSES</button>
            </div>
        );
    };

    const renderLineupTable = ({ formData, isNew, side }) => {
        const ahlyTeam = resolveAhlyTeam(formData);
        const oppTeam = resolveOpponentTeam(formData);
        const isAhly = side === 'ahly';
        const teamName = isAhly ? ahlyTeam : oppTeam;
        const allRows = isNew ? newLineupRows : lineupRows;
        const rows = isAhly
            ? allRows.filter((r) => isLineupForAhly(r, ahlyTeam))
            : allRows.filter((r) => isLineupForOpponent(r, oppTeam, ahlyTeam));
        const setRows = isNew
            ? (isAhly ? makeNewAhlyLineupSetter(formData) : makeNewOpponentLineupSetter(formData))
            : (isAhly ? makeEditAhlyLineupSetter(formData) : makeEditOpponentLineupSetter(formData));
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;

        if (!isAhly && !oppTeam) {
            return (
                <NoData_db
                    message={isNew ? 'SELECT OPPONENT TEAM IN MATCH DETAILS TO EDIT OPPONENT LINEUP' : 'SET OPPONENT TEAM IN MATCH DETAILS TO EDIT OPPONENT LINEUP'}
                    height="240px"
                />
            );
        }

        return (
            <LineupPanel
                title={`LINEUP — ${teamName}`}
                color={isAhly ? '#c9a84c' : '#3b82f6'}
                rows={rows}
                setRows={setRows}
                matchId={matchId}
                teamName={teamName}
                allPlayersList={allPlayersList}
                persistToDb={!isNew}
                onSaveRow={handleSaveRow}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isNew ? false : isSaving}
            />
        );
    };

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="editor-container">
    
                {/* â”€â”€ Header â”€â”€ */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, marginBottom: 30 }}>
                    <div style={{ display: 'flex', width: 400, background: '#f8f8f8', borderRadius: 12, padding: 4 }}>
                        <button
                            onClick={() => { setMode('search'); setMatchData(null); }}
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: (mode === 'search' || mode === 'edit') ? '#c9a84c' : 'transparent',
                                color: (mode === 'search' || mode === 'edit') ? '#000' : '#888', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                                cursor: 'pointer', borderRadius: 10, transition: 'all 0.2s', fontSize: 13, letterSpacing: 1
                            }}>
                            SEARCH MATCH
                        </button>
                        <button
                            onClick={() => { setMode('new'); setMatchData(null); setNewMatchData({ ...EMPTY_MATCH }); }}
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: mode === 'new' ? '#c9a84c' : 'transparent',
                                color: mode === 'new' ? '#000' : '#888', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                                cursor: 'pointer', borderRadius: 10, transition: 'all 0.2s', fontSize: 13, letterSpacing: 1
                            }}>
                            ADD MATCH
                        </button>
                    </div>
                </div>

                {/* â”€â”€ Mode: Search = portal â”€â”€ */}
                {(mode === 'search') && (
                    <div className="portal-container">
                        <div className="portal-icon">🔎</div>
                        <div className="portal-title">
                            ENTER MATCH ID
                        </div>
                        <div className="portal-subtitle">
                            Type the Match ID to load all linked records for editing
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', width: '100%', maxWidth: 520 }}>
                            <SearchBar_db
                                value={searchId}
                                onChange={setSearchId}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Match ID..."
                                style={{ flex: 1 }}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="load-btn">
                                {loading ? 'Loading...' : 'LOAD →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* â”€â”€ Mode: New Match â”€â”€ */}
                {mode === 'new' && (
                    <>
                        {/* Match Details form */}
                        <div className="editor-card">
                            <div className="card-header" style={{ marginBottom: 30 }}>
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#22c55e' }} />
                                    <h2 className="card-title">NEW MATCH DETAILS</h2>
                                </div>
                            </div>
                            <div className="grid-fields" style={{ marginBottom: 30 }}>
                                {renderMatchFieldsGrid(newMatchData, setNewMatchData, { matchIdAuto: true })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={handleCreateMatch}
                                    disabled={isSaving}
                                    className="create-match-btn">
                                    {isSaving ? 'Creating...' : '✓ CREATE MATCH'}
                                </button>
                            </div>
                        </div>

                        {/* Linked tables - staged before create */}
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA</h2>
                                </div>
                            </div>

                            {renderLinkedTabBar(newMatchData)}

                            {activeLinkedTab === 'lineup-ahly' && renderLineupTable({ formData: newMatchData, isNew: true, side: 'ahly' })}
                            {activeLinkedTab === 'lineup-opponent' && renderLineupTable({ formData: newMatchData, isNew: true, side: 'opponent' })}
                            {activeLinkedTab === 'events' && renderPlayerEventsPanel({ formData: newMatchData, isNew: true })}
                            {activeLinkedTab === 'gks' && renderGkDetailsPanel({ formData: newMatchData, isNew: true })}
                            {activeLinkedTab === 'pens' && renderPenaltyMissesPanel({ formData: newMatchData, isNew: true })}
                            {activeLinkedTab === 'motm' && (
                                <div style={{ padding: '20px', background: '#fafafa', borderRadius: '20px', border: '1px solid #eee', maxWidth: '500px', margin: '0 auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                        <span style={{ fontSize: 24 }}>🏆</span>
                                        <h3 style={{ margin: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: '#0a0a0a' }}>
                                            MAN OF THE MATCH
                                        </h3>
                                    </div>
                                    <div className="field-label">SELECT MOTM PLAYER</div>
                                    <AutocompleteInput
                                        value={newMatchData.MOTM ?? ''}
                                        options={allPlayersList}
                                        placeholder="Search player name..."
                                        onChange={val => setNewMatchData(prev => ({ ...prev, MOTM: val }))}
                                        className="field-input"
                                        accentColor="#c9a84c"
                                        style={{ width: '100%', height: '40px', fontSize: '14px', background: '#fff' }}
                                    />
                                    <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
                                        * This searchable dropdown suggests all players in the system. Search and select the Man of the Match winner.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* â”€â”€ Mode: Edit â”€â”€ */}
                {mode === 'edit' && matchData && (
                    <>
                        {/* Match Details Card */}
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#c9a84c' }} />
                                    <div>
                                        <h2 className="card-title">MATCH DETAILS</h2>
                                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#888', marginTop: 2 }}>ID: {matchData.MATCH_ID}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        onClick={() => { setMode('search'); setMatchData(null); }}
                                        title="Back to search"
                                        className="action-btn-circle">
                                        ←
                                    </button>
                                    <button
                                        onClick={handleSaveMatch}
                                        disabled={isSaving}
                                        title="Save match"
                                        className="save-match-btn">
                                        {isSaving ? '⏳' : '💾'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid-fields">
                                {renderMatchFieldsGrid(matchData, setMatchData)}
                            </div>
                        </div>

                        {/* Linked Tables */}
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA</h2>
                                </div>
                            </div>

                            {renderLinkedTabBar(matchData)}

                            {activeLinkedTab === 'lineup-ahly' && renderLineupTable({ formData: matchData, isNew: false, side: 'ahly' })}
                            {activeLinkedTab === 'lineup-opponent' && renderLineupTable({ formData: matchData, isNew: false, side: 'opponent' })}
                            {activeLinkedTab === 'events' && renderPlayerEventsPanel({ formData: matchData, isNew: false })}
                            {activeLinkedTab === 'gks' && renderGkDetailsPanel({ formData: matchData, isNew: false })}
                            {activeLinkedTab === 'pens' && renderPenaltyMissesPanel({ formData: matchData, isNew: false })}
                            {activeLinkedTab === 'motm' && (
                                <div style={{ padding: '20px', background: '#fafafa', borderRadius: '20px', border: '1px solid #eee', maxWidth: '500px', margin: '0 auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                        <span style={{ fontSize: 24 }}>🏆</span>
                                        <h3 style={{ margin: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: '#0a0a0a' }}>
                                            MAN OF THE MATCH
                                        </h3>
                                    </div>
                                    <div className="field-label">SELECT MOTM PLAYER</div>
                                    <AutocompleteInput
                                        value={matchData.MOTM ?? ''}
                                        options={allPlayersList}
                                        placeholder="Search player name..."
                                        onChange={val => setMatchData(prev => ({ ...prev, MOTM: val }))}
                                        className="field-input"
                                        accentColor="#c9a84c"
                                        style={{ width: '100%', height: '40px', fontSize: '14px', background: '#fff' }}
                                    />
                                    <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
                                        * This searchable dropdown suggests all players in the system. Search and select the Man of the Match winner.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {confirmDelete && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-box">
                        <div className="confirm-modal-icon">⚠️</div>
                        <div className="confirm-modal-title">Delete Row?</div>
                        <div className="confirm-modal-text">
                            Are you sure you want to delete this row? This action cannot be undone.
                        </div>
                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-modal-btn confirm-modal-btn-cancel"
                                onClick={() => setConfirmDelete(null)}
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="confirm-modal-btn confirm-modal-btn-delete"
                                onClick={executeDeleteRow}
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Login_db>
    );
}
