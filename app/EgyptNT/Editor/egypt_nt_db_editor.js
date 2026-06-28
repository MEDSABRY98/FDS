"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import "./egypt_nt_db_editor.css";
import {
    supabase,
    getChangedFormFields,
    resolveCatalogFieldsInForm,
    AutocompleteInput,
    fetchCatalogDisplayNames,
    applyLineupLogic,
    getLineupSubOutOptions,
    GkGoalEventIdMultiSelect,
    parseGkEventIds,
    serializeGkEventIds,
    getPrimaryEventIdForSort,
    collectMatchIds,
    buildEgyptNtMatchId,
    fetchMatchIdExists,
    normalizeMatchId,
} from "../../Database";
import Login_db from "../../lib/Login_db";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { useNotification } from "../../lib/Notification_db";
import {
    prepareHowPenMissedRowForSave,
    formatHowPenMissedForDisplay,
    buildHowPenMissedAutocompleteOptions,
} from "../../Alahly/Penalties/alahly_db_penalties_utils";

// â”€â”€ Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EMPTY_MATCH = {
    "MATCH_ID": "", "AGE": "", "CHAMPION_SYSTEM": "", "DATE": "", "CHAMPION": "", "SEASON": "",
    "EGYPT MANAGER": "", "OPPONENT MANAGER": "", "REFREE": "", "ROUND": "", "PLACE": "",
    "H-A-N": "", "Egypt TEAM": "", "GF": "", "GA": "", "ET": "",
    "PEN": "", "OPPONENT TEAM": "", "NOTE": "", "MOTM": ""
};
const EMPTY_LINEUP = { "MATCH_ID": "", "MATCH MINUTE": "", "TEAM": "", "PLAYER NAME": "", "CLUB": "", "STATU": "", "PLAYER NAME OUT": "", "OUT MINUTE": "", "TOTAL MINUTE": "" };
const EMPTY_PLAYER = { "MATCH_ID": "", "EVENT_ID": "", "PARENT_EVENT_ID": "", "PLAYER NAME": "", "TEAM": "", "CLUB": "", "TYPE": "", "TYPE_SUB": "", "MINUTE": "" };
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

const sortRowsByEventId = (rows = []) => {
    return [...rows].sort((a, b) => {
        const idA = getPrimaryEventIdForSort(a?.EVENT_ID);
        const idB = getPrimaryEventIdForSort(b?.EVENT_ID);
        if (!idA && !idB) return 0;
        if (!idA) return 1;
        if (!idB) return -1;
        const suffixDiff = parseEventIdSuffix(idA) - parseEventIdSuffix(idB);
        if (suffixDiff !== 0) return suffixDiff;
        return idA.localeCompare(idB);
    });
};

const sortRowsByRowId = (rows = []) => {
    return [...rows].sort((a, b) => {
        const idA = String(a?.ROW_ID || "").trim();
        const idB = String(b?.ROW_ID || "").trim();
        if (!idA && !idB) return 0;
        if (!idA) return 1;
        if (!idB) return -1;
        const suffixDiff = parseEventIdSuffix(idA) - parseEventIdSuffix(idB);
        if (suffixDiff !== 0) return suffixDiff;
        return idA.localeCompare(idB);
    });
};

const sortRowsForTable = (tableName, rows = []) => {
    if (tableName === "egy_NT_PLAYERDETAILS") return sortRowsByEventId(rows);
    if (tableName === "egy_NT_GKSDETAILS") return sortRowsByEventId(rows);
    if (tableName === "egy_NT_HOWPENMISSED") return sortRowsByEventId(rows);
    if (tableName === "egy_NT_LINEUPDETAILS") return sortRowsByRowId(rows);
    return rows;
};

const normalizeTeamName = (value) => String(value || "").trim().toLowerCase();

const getDefaultEgyptTeamLabel = (matchInfo = {}) => (
    String(matchInfo["Egypt TEAM"] || matchInfo["EGYPT TEAM"] || "EGYPT").trim() || "EGYPT"
);

const buildLineupTeamResolver = (matchInfo = {}) => {
    const egyptTeamName = getDefaultEgyptTeamLabel(matchInfo);
    const opponentTeamName = String(matchInfo["OPPONENT TEAM"] || "").trim();

    const egyptIdentifiers = new Set([
        "egypt",
        "مصر",
        "منتخب مصر",
        "المنتخب المصري",
        normalizeTeamName(egyptTeamName),
    ].filter(Boolean));

    const resolveLineupTeamSide = (teamValue) => {
        const name = String(teamValue || "").trim();
        if (!name) return null;

        const normalizedName = normalizeTeamName(name);
        if (opponentTeamName && normalizedName === normalizeTeamName(opponentTeamName)) return "opponent";
        if (normalizedName === "opponent" && opponentTeamName) return "opponent";
        if (egyptIdentifiers.has(normalizedName)) return "egypt";
        return null;
    };

    return {
        egyptTeamName,
        opponentTeamName,
        isEgyptLineupTeam: (teamValue) => resolveLineupTeamSide(teamValue) === "egypt",
        isOpponentLineupTeam: (teamValue) => resolveLineupTeamSide(teamValue) === "opponent",
        resolveLineupTeamSide,
    };
};

const splitLineupRowsByTeam = (rows = [], matchInfo = {}) => {
    const { resolveLineupTeamSide } = buildLineupTeamResolver(matchInfo);
    const egy = [];
    const opp = [];

    rows.forEach((row) => {
        const side = resolveLineupTeamSide(row?.TEAM);
        if (side === "egypt") {
            egy.push(row);
        } else if (side === "opponent") {
            opp.push(row);
        } else {
            opp.push(row);
        }
    });

    return { egy, opp };
};

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

const isLinkedRowSaveable = (tableName, row) => {
    if (tableName === "egy_NT_PLAYERDETAILS") return isPlayerEventRowSaveable(row);
    if (tableName === "egy_NT_GKSDETAILS") return isGkRowSaveable(row);
    if (tableName === "egy_NT_HOWPENMISSED") return isPenRowSaveable(row);
    return String(row?.["PLAYER NAME"] || "").trim() !== "";
};

const EDITOR_META_KEYS = new Set(["_isNew", "_isDirty", "_key", "_snapshot"]);

const toEditorSnapshot = (row = {}) => {
    const snapshot = {};
    Object.keys(row).forEach((key) => {
        if (!EDITOR_META_KEYS.has(key)) snapshot[key] = row[key];
    });
    return snapshot;
};

const attachEditorRowMeta = (row, key) => ({
    ...row,
    _key: key,
    _snapshot: toEditorSnapshot(row),
});

const hasPersistedRowId = (row) => {
    const rowId = String(row?.ROW_ID ?? "").trim();
    return rowId !== "" && rowId !== "null" && rowId !== "undefined";
};

const shouldInsertEditorRow = (row) => Boolean(row?._isNew) && !hasPersistedRowId(row);

const mergeSavedEditorRow = (existingRow, savedRow) => {
    const merged = { ...existingRow, ...savedRow, _isNew: false, _isDirty: false };
    merged._snapshot = toEditorSnapshot(merged);
    return merged;
};

const UNNAMED_PLAYER_LABEL = "— Unnamed Player —";

const listIndexedRowsByEventId = (rows = []) => (
    rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
            const idA = getPrimaryEventIdForSort(a.row?.EVENT_ID);
            const idB = getPrimaryEventIdForSort(b.row?.EVENT_ID);
            const suffixDiff = parseEventIdSuffix(idA) - parseEventIdSuffix(idB);
            if (suffixDiff !== 0) return suffixDiff;
            if (!idA && idB) return 1;
            if (idA && !idB) return -1;
            return idA.localeCompare(idB);
        })
);

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

const formatEventLine = (row) => {
    const parts = [
        String(row.TYPE || "").trim(),
        String(row.TYPE_SUB || "").trim(),
        String(row.MINUTE || "").trim() ? `${String(row.MINUTE).trim()}'` : "",
    ].filter(Boolean);
    return parts.join(" · ") || "—";
};

const formatGkLine = (row) => {
    const linkedGoals = parseGkEventIds(row.EVENT_ID).length;
    const parts = [
        String(row.STATU || "").trim(),
        String(row["OUT MINUTE"] || "").trim() ? `OUT ${String(row["OUT MINUTE"]).trim()}'` : "",
        String(row["GOALS CONCEDED"] || "").trim() !== "" ? `GC ${String(row["GOALS CONCEDED"]).trim()}` : "",
        linkedGoals ? `${linkedGoals} goal link${linkedGoals > 1 ? "s" : ""}` : "",
    ].filter(Boolean);
    return parts.join(" · ") || "—";
};

const formatPenLine = (row) => {
    const parts = [
        formatHowPenMissedForDisplay(row["HOW MISSED?"]),
        String(row.MINUTE || "").trim() ? `${String(row.MINUTE).trim()}'` : "",
    ].filter(Boolean);
    return parts.join(" · ") || "—";
};

const buildPlayerEventIdOptions = (playerRows = []) => (
    [...new Set(playerRows.map((row) => String(row?.EVENT_ID || "").trim()).filter(Boolean))]
        .sort((a, b) => parseEventIdSuffix(a) - parseEventIdSuffix(b))
);

function PlayerEventsPanel({
    title,
    color,
    rows,
    setRows,
    matchId,
    teamOptions,
    allPlayersList,
    allTeamsList,
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
        setForm({
            ...EMPTY_PLAYER,
            MATCH_ID: matchId,
            ...preset,
        });
        setModalOpen(true);
    };

    const openEditModal = (row, index) => {
        setEditingIndex(index);
        setForm({
            ...EMPTY_PLAYER,
            ...row,
            MATCH_ID: row.MATCH_ID || matchId,
        });
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
                    await onSaveRow(newRow, newIndex, "egy_NT_PLAYERDETAILS", setRows);
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
                    await onSaveRow(updatedRow, newIndex, "egy_NT_PLAYERDETAILS", setRows);
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
                            tableName="egy_NT_PLAYERDETAILS"
                            setRows={setRows}
                            title={String(row["PLAYER NAME"] || "").trim() || UNNAMED_PLAYER_LABEL}
                            meta={[row.CLUB, row.TEAM].map((v) => String(v || "").trim()).filter(Boolean).join(" · ") || null}
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
                                <div className="field-label">CLUB</div>
                                <AutocompleteInput
                                    value={form.CLUB ?? ""}
                                    options={allTeamsList}
                                    placeholder="Club"
                                    onChange={(val) => updateFormField("CLUB", val)}
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

        const serializedEventId = serializeGkEventIds(parseGkEventIds(cleanForm.EVENT_ID));
        const goalsConceded = String(cleanForm["GOALS CONCEDED"] || "").trim();
        const linkedCount = parseGkEventIds(serializedEventId).length;
        if (goalsConceded && linkedCount && parseInt(goalsConceded, 10) !== linkedCount) {
            addNotification(
                `Linked goal events (${linkedCount}) do not match GOALS CONCEDED (${goalsConceded}).`,
                "warn"
            );
        }

        setSavingModal(true);
        try {
            if (editingIndex === null) {
                const newRow = {
                    ...EMPTY_GK,
                    ...cleanForm,
                    MATCH_ID: matchId,
                    EVENT_ID: serializedEventId,
                    _isNew: true,
                    _key: Date.now(),
                };

                const nextRows = sortRowsByEventId([...rows, newRow]);
                const newIndex = nextRows.findIndex((row) => row._key === newRow._key);
                setRows(nextRows);

                if (persistToDb && onSaveRow) {
                    await onSaveRow(newRow, newIndex, "egy_NT_GKSDETAILS", setRows);
                }
            } else {
                const existingRow = rows[editingIndex];
                const updatedRow = {
                    ...existingRow,
                    ...cleanForm,
                    MATCH_ID: matchId,
                    EVENT_ID: serializedEventId,
                    _isDirty: true,
                };
                const nextRows = sortRowsByEventId(
                    rows.map((row, index) => (index === editingIndex ? updatedRow : row))
                );
                const newIndex = nextRows.findIndex((row) => row._key === updatedRow._key);
                setRows(nextRows);

                if (persistToDb && onSaveRow) {
                    await onSaveRow(updatedRow, newIndex, "egy_NT_GKSDETAILS", setRows);
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
                            tableName="egy_NT_GKSDETAILS"
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
                            <div className="player-event-modal-field" style={{ gridColumn: "1 / -1" }}>
                                <div className="field-label">EVENT ID (GOALS CONCEDED)</div>
                                <GkGoalEventIdMultiSelect
                                    playerEventRows={playerEventRows}
                                    value={form.EVENT_ID ?? ""}
                                    onChange={(val) => updateFormField("EVENT_ID", val)}
                                    accentColor={color}
                                    style={{ width: "100%" }}
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
    gkPlayerOptions,
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
    const howMissedOptions = useMemo(
        () => buildHowPenMissedAutocompleteOptions(gkPlayerOptions),
        [gkPlayerOptions]
    );

    const openAddModal = (preset = {}) => {
        setEditingIndex(null);
        setForm({ ...EMPTY_PEN, MATCH_ID: matchId, ...preset });
        setModalOpen(true);
    };

    const openEditModal = (row, index) => {
        setEditingIndex(index);
        setForm({
            ...EMPTY_PEN,
            ...row,
            MATCH_ID: row.MATCH_ID || matchId,
            "HOW MISSED?": formatHowPenMissedForDisplay(row["HOW MISSED?"]),
        });
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
                    await onSaveRow(newRow, newIndex, "egy_NT_HOWPENMISSED", setRows);
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
                    await onSaveRow(updatedRow, newIndex, "egy_NT_HOWPENMISSED", setRows);
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
                            tableName="egy_NT_HOWPENMISSED"
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
                                <div className="field-label">HOW MISSED? / SAVING GK</div>
                                <AutocompleteInput
                                    value={form["HOW MISSED?"] ?? ""}
                                    options={howMissedOptions}
                                    placeholder="Miss reason or goalkeeper"
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
    allTeamsList,
    subOutOptions,
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

                <div className="lineup-player-field lineup-player-field--wide">
                    <div className="field-label">CLUB</div>
                    <AutocompleteInput
                        value={row.CLUB ?? ""}
                        options={allTeamsList}
                        placeholder="Club"
                        onChange={(val) => onFieldChange("CLUB", val)}
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
                            options={subOutOptions}
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
    allTeamsList,
    persistToDb,
    onSaveRow,
    onDeleteRow,
    isSaving,
}) {
    const savingRef = useRef(new Set());
    const rowsRef = useRef(rows);
    rowsRef.current = rows;
    const matchMinute = String(rows[0]?.["MATCH MINUTE"] || "90").trim() || "90";

    const subOutOptions = useMemo(() => getLineupSubOutOptions(rows), [rows]);

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
            if (!isLinkedRowSaveable("egy_NT_LINEUPDETAILS", currentRow)) return;
            if (!currentRow._isDirty && !currentRow._isNew) return;

            const rowKey = currentRow._key;
            if (savingRef.current.has(rowKey)) return;

            const idx = latestRows.findIndex((r) => r._key === rowKey);
            if (idx < 0) return;

            savingRef.current.add(rowKey);
            try {
                await onSaveRow(currentRow, idx, "egy_NT_LINEUPDETAILS", setRows);
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
            onDeleteRow(row, idx, "egy_NT_LINEUPDETAILS", setRows);
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
            allTeamsList={allTeamsList}
            subOutOptions={subOutOptions}
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
export default function EgyptNTEditor() {
    const [searchId, setSearchId] = useState('');
    const [matchData, setMatchData] = useState(null);       // MATCHDETAILS record
    
    // Split states for Egypt and Opponent
    const [egyLineupRows, setEgyLineupRows] = useState([]);
    const [oppLineupRows, setOppLineupRows] = useState([]);
    
    const [playerRows, setPlayerRows] = useState([]);
    const [gkRows, setGkRows] = useState([]);
    const [penRows, setPenRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState('search'); // 'search' | 'edit' | 'new'
    const { addNotification } = useNotification();
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [newMatchData, setNewMatchData] = useState({ ...EMPTY_MATCH });
    const [activeLinkedTab, setActiveLinkedTab] = useState('lineup_egy');
    
    // new match linked rows (staged before create)
    const [newEgyLineupRows, setNewEgyLineupRows] = useState([]);
    const [newOppLineupRows, setNewOppLineupRows] = useState([]);
    const [newPlayerRows, setNewPlayerRows] = useState([]);
    const [newGkRows, setNewGkRows] = useState([]);
    const [newPenRows, setNewPenRows] = useState([]);
    
    const existingMatchIdsRef = useRef(new Set());
    const [matchIdsLoaded, setMatchIdsLoaded] = useState(false);
    const [matchFieldOptions, setMatchFieldOptions] = useState({}); // unique values per column
    const [allPlayersList, setAllPlayersList] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [eventSubTypes, setEventSubTypes] = useState([]);
    const [catalogLists, setCatalogLists] = useState({ managers: [], stadiums: [], referees: [] });
    const [allTeamsList, setAllTeamsList] = useState([]);

    const AUTOCOMPLETE_FIELDS = [
        'AGE', 'CHAMPION_SYSTEM', 'CHAMPION', 'SEASON', 'EGYPT MANAGER', 'OPPONENT MANAGER',
        'REFREE', 'ROUND', 'PLACE', 'H-A-N', 'Egypt TEAM', 'ET', 'PEN', 'OPPONENT TEAM', 'NOTE'
    ];

    useEffect(() => {
        let cancelled = false;

        const loadCatalogLists = async () => {
            try {
                const [players, managers, stadiums, referees, teams] = await Promise.all([
                    fetchCatalogDisplayNames('db_PLAYERS'),
                    fetchCatalogDisplayNames('db_MANAGERS'),
                    fetchCatalogDisplayNames('db_STADIUMS'),
                    fetchCatalogDisplayNames('db_REFEREES'),
                    fetchCatalogDisplayNames('db_TEAMS'),
                ]);

                if (cancelled) return;
                setAllPlayersList(players);
                setAllTeamsList(teams);
                setCatalogLists({ managers, stadiums, referees });

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

                const t = await fetchUniqueCol('egy_NT_PLAYERDETAILS', 'TYPE');
                setEventTypes(t);

                const ts = await fetchUniqueCol('egy_NT_PLAYERDETAILS', 'TYPE_SUB');
                setEventSubTypes(ts);
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

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const querySearchId = params.get("searchId");
            if (querySearchId) {
                setSearchId(querySearchId);
                triggerSearch(querySearchId);
            }
        }
        
        async function triggerSearch(id) {
            setLoading(true);
            try {
                const [{ data: md }, { data: ld }, { data: pd }, { data: gd }, { data: pen }] = await Promise.all([
                    supabase.from('egy_NT_MATCHDETAILS').select('*').eq('MATCH_ID', id).maybeSingle(),
                    supabase.from('egy_NT_LINEUPDETAILS').select('*').eq('MATCH_ID', id),
                    supabase.from('egy_NT_PLAYERDETAILS').select('*').eq('MATCH_ID', id),
                    supabase.from('egy_NT_GKSDETAILS').select('*').eq('MATCH_ID', id),
                    supabase.from('egy_NT_HOWPENMISSED').select('*').eq('MATCH_ID', id),
                ]);
                if (!md) { addToast(`Match ID "${id}" not found`, 'error'); setLoading(false); return; }
                setMatchData({ ...md });
                if (!ld || ld.length === 0) {
                    const egyNorm = normalizeSavedTeamLineup([], id, getDefaultEgyptTeamLabel(md));
                    const oppNorm = normalizeSavedTeamLineup([], id, md?.["OPPONENT TEAM"] || "OPPONENT");
                    setEgyLineupRows(applyLineupLogic(egyNorm, egyNorm));
                    setOppLineupRows(applyLineupLogic(oppNorm, oppNorm));
                } else {
                    const { egy, opp } = splitLineupRowsByTeam(ld, md);
                    const egyNorm = normalizeSavedTeamLineup(egy, id, getDefaultEgyptTeamLabel(md));
                    const oppNorm = normalizeSavedTeamLineup(opp, id, md?.["OPPONENT TEAM"] || "OPPONENT");
                    setEgyLineupRows(applyLineupLogic(egyNorm, egyNorm));
                    setOppLineupRows(applyLineupLogic(oppNorm, oppNorm));
                }
                setPlayerRows(sortRowsByEventId((pd || []).map((r, i) => attachEditorRowMeta(r, 1000 + i))));
                setGkRows(sortRowsByEventId((gd || []).map((r, i) => attachEditorRowMeta(r, 2000 + i))));
                setPenRows(sortRowsByEventId((pen || []).map((r, i) => attachEditorRowMeta(r, 3000 + i))));
                setMode('edit');
            } catch (e) { addToast('Error: ' + e.message, 'error'); }
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (mode !== 'new') return;
        setMatchIdsLoaded(false);
        (async () => {
            let allMatchData = [];
            let from = 0;
            const limit = 1000;
            while (true) {
                const { data, error } = await supabase.from('egy_NT_MATCHDETAILS').select('*').range(from, from + limit - 1);
                if (error || !data || data.length === 0) break;
                allMatchData.push(...data);
                if (data.length < limit) break;
                from += limit;
            }

            const data = allMatchData;

            existingMatchIdsRef.current = collectMatchIds(data);
            setMatchIdsLoaded(true);

            const managerList = catalogLists.managers;
            const stadiumList = catalogLists.stadiums;
            const refereeList = catalogLists.referees;

            const opts = {};
            AUTOCOMPLETE_FIELDS.forEach(col => {
                if (['EGYPT MANAGER', 'OPPONENT MANAGER'].includes(col)) {
                    opts[col] = managerList;
                } else if (col === 'PLACE') {
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

    useEffect(() => {
        if (mode !== 'new' || !matchIdsLoaded) return;
        const suggested = buildEgyptNtMatchId({
            age: newMatchData.AGE,
            egyptTeam: newMatchData["Egypt TEAM"],
            opponent: newMatchData["OPPONENT TEAM"],
            date: newMatchData.DATE,
        });
        setNewMatchData(prev => (prev.MATCH_ID === suggested ? prev : { ...prev, MATCH_ID: suggested }));
    }, [newMatchData.AGE, newMatchData["Egypt TEAM"], newMatchData["OPPONENT TEAM"], newMatchData.DATE, mode, matchIdsLoaded]);

    const handleNewEgyLineupRows = useCallback((action) => setNewEgyLineupRows(p => applyLineupLogic(p, action)), []);
    const handleNewOppLineupRows = useCallback((action) => setNewOppLineupRows(p => applyLineupLogic(p, action)), []);
    const handleEditEgyLineupRows = useCallback((action) => setEgyLineupRows(p => applyLineupLogic(p, action)), []);
    const handleEditOppLineupRows = useCallback((action) => setOppLineupRows(p => applyLineupLogic(p, action)), []);

    useEffect(() => {
        if (mode === 'new') {
            const initialEgyLineup = Array.from({ length: 16 }, (_, i) => ({
                ...EMPTY_LINEUP,
                "MATCH MINUTE": "90",
                "TEAM": getDefaultEgyptTeamLabel(newMatchData),
                "STATU": i < 11 ? "اساسي" : "احتياطي",
                "TOTAL MINUTE": i < 11 ? "90" : "",
                MATCH_ID: newMatchData.MATCH_ID || '',
                _isNew: true,
                _key: Date.now() + i
            }));
            const initialOppLineup = Array.from({ length: 16 }, (_, i) => ({
                ...EMPTY_LINEUP,
                "MATCH MINUTE": "90",
                "TEAM": newMatchData["OPPONENT TEAM"] || "OPPONENT",
                "STATU": i < 11 ? "اساسي" : "احتياطي",
                "TOTAL MINUTE": i < 11 ? "90" : "",
                MATCH_ID: newMatchData.MATCH_ID || '',
                _isNew: true,
                _key: Date.now() + 100 + i
            }));
            handleNewEgyLineupRows(initialEgyLineup);
            handleNewOppLineupRows(initialOppLineup);
        }
    }, [mode]);

    useEffect(() => {
        if (mode === 'new') {
            setNewEgyLineupRows(prev => prev.map(r => ({ ...r, MATCH_ID: newMatchData.MATCH_ID || '' })));
            setNewOppLineupRows(prev => prev.map(r => ({ ...r, MATCH_ID: newMatchData.MATCH_ID || '' })));
        }
    }, [newMatchData.MATCH_ID, mode]);

    useEffect(() => {
        if (mode === 'new' && newMatchData["Egypt TEAM"]) {
            const egyLabel = getDefaultEgyptTeamLabel(newMatchData);
            setNewEgyLineupRows(prev => prev.map(r => r.TEAM !== egyLabel ? { ...r, TEAM: egyLabel } : r));
        }
    }, [newMatchData["Egypt TEAM"], mode]);

    useEffect(() => {
        if (mode === 'new' && newMatchData["OPPONENT TEAM"]) {
            setNewOppLineupRows(prev => prev.map(r => r.TEAM !== newMatchData["OPPONENT TEAM"] ? { ...r, TEAM: newMatchData["OPPONENT TEAM"] } : r));
        }
    }, [newMatchData["OPPONENT TEAM"], mode]);

    useEffect(() => {
        if (mode === 'edit' && matchData?.["Egypt TEAM"]) {
            const egyLabel = getDefaultEgyptTeamLabel(matchData);
            setEgyLineupRows(prev => prev.map(r => r.TEAM !== egyLabel ? { ...r, TEAM: egyLabel, _isDirty: true } : r));
        }
    }, [matchData?.["Egypt TEAM"], mode]);

    useEffect(() => {
        if (mode === 'edit' && matchData && matchData["OPPONENT TEAM"]) {
            setOppLineupRows(prev => prev.map(r => r.TEAM !== matchData["OPPONENT TEAM"] ? { ...r, TEAM: matchData["OPPONENT TEAM"], _isDirty: true } : r));
        }
    }, [matchData?.["OPPONENT TEAM"], mode]);

    const addToast = (msg, type = 'success') => {
        addNotification(msg, type);
    };

    const resolveNextPlayerEventId = useCallback(async (matchId, currentRows = [], excludeKey = null) => {
        const normalizedMatchId = String(matchId || "").trim();
        if (!normalizedMatchId) return "";

        const localRows = currentRows.filter((row) => row._key !== excludeKey);
        let combined = [...localRows];

        const { data: dbEvents, error } = await supabase
            .from("egy_NT_PLAYERDETAILS")
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
                supabase.from('egy_NT_MATCHDETAILS').select('*').eq('MATCH_ID', id).maybeSingle(),
                supabase.from('egy_NT_LINEUPDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('egy_NT_PLAYERDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('egy_NT_GKSDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('egy_NT_HOWPENMISSED').select('*').eq('MATCH_ID', id),
            ]);
            if (!md) { addToast(`Match ID "${id}" not found`, 'error'); setLoading(false); return; }
            setMatchData({ ...md });
            if (!ld || ld.length === 0) {
                const egyNorm = normalizeSavedTeamLineup([], id, getDefaultEgyptTeamLabel(md));
                const oppNorm = normalizeSavedTeamLineup([], id, md?.["OPPONENT TEAM"] || "OPPONENT");
                setEgyLineupRows(applyLineupLogic(egyNorm, egyNorm));
                setOppLineupRows(applyLineupLogic(oppNorm, oppNorm));
            } else {
                const { egy, opp } = splitLineupRowsByTeam(ld, md);
                const egyNorm = normalizeSavedTeamLineup(egy, id, getDefaultEgyptTeamLabel(md));
                const oppNorm = normalizeSavedTeamLineup(opp, id, md?.["OPPONENT TEAM"] || "OPPONENT");
                setEgyLineupRows(applyLineupLogic(egyNorm, egyNorm));
                setOppLineupRows(applyLineupLogic(oppNorm, oppNorm));
            }
            setPlayerRows(sortRowsByEventId((pd || []).map((r, i) => attachEditorRowMeta(r, 1000 + i))));
            setGkRows(sortRowsByEventId((gd || []).map((r, i) => attachEditorRowMeta(r, 2000 + i))));
            setPenRows(sortRowsByEventId((pen || []).map((r, i) => attachEditorRowMeta(r, 3000 + i))));
            setMode('edit');
        } catch (e) { addToast('Error: ' + e.message, 'error'); }
        setLoading(false);
    };

    // â”€â”€ Save a single row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSaveRow = useCallback(async (row, ri, tableName, setterFn) => {
        if (isSaving) return;
        setIsSaving(true);
        const { _isNew, _isDirty, _key, _snapshot, ...cleanRow } = row;

        if (!cleanRow.MATCH_ID && matchData) cleanRow.MATCH_ID = matchData.MATCH_ID;

        if (tableName === "egy_NT_PLAYERDETAILS" && !isPlayerEventRowSaveable(cleanRow)) {
            addToast("Fill at least PLAYER NAME, TYPE, or MINUTE before saving.", "error");
            setIsSaving(false);
            return;
        }

        try {
            if (tableName === "egy_NT_PLAYERDETAILS" && _isNew && cleanRow.MATCH_ID) {
                cleanRow.EVENT_ID = await resolveNextPlayerEventId(
                    cleanRow.MATCH_ID,
                    playerRows,
                    row._key
                );
            }

            if (tableName === "egy_NT_HOWPENMISSED") {
                Object.assign(cleanRow, await prepareHowPenMissedRowForSave(cleanRow));
            }

            let result;
            const treatAsInsert = _isNew && !hasPersistedRowId(row);

            if (treatAsInsert) {
                const insertPayload = await resolveCatalogFieldsInForm(tableName, cleanRow);
                result = await supabase.from(tableName).insert(insertPayload).select();
            } else {
                const changed = getChangedFormFields(_snapshot || {}, cleanRow);
                if (Object.keys(changed).length === 0) {
                    addToast("No changes to save.", "info");
                    setIsSaving(false);
                    return;
                }

                const resolved = await resolveCatalogFieldsInForm(tableName, changed);
                if (hasPersistedRowId(cleanRow)) {
                    result = await supabase.from(tableName).update(resolved).eq("ROW_ID", cleanRow.ROW_ID).select();
                } else if (cleanRow.EVENT_ID) {
                    result = await supabase.from(tableName).update(resolved).eq("EVENT_ID", cleanRow.EVENT_ID).select();
                } else {
                    result = await supabase.from(tableName).update(resolved).match(cleanRow).select();
                }
            }

            if (result.error) {
                addNotification(`Supabase Error (${tableName}):\n${result.error.message}\n${result.error.hint || ''}`, "error");
                throw result.error;
            }

            const savedRow = result.data?.[0];
            if (!savedRow) throw new Error("No data returned from DB after save success.");

            addToast(treatAsInsert ? 'Row inserted ✓' : 'Row updated ✓');

            setterFn?.(prev => {
                const idx = findRowIndexInList(prev, row, ri);
                const updated = prev.map((r, i) => {
                    if (i !== idx) return r;
                    return mergeSavedEditorRow(r, savedRow);
                });
                return sortRowsForTable(tableName, updated);
            });
        } catch (e) {
            console.error("Save Error:", e);
            addToast('Save FAILED: ' + (e.message || "Unknown error"), 'error');
        } finally {
            setIsSaving(false);
        }
    }, [matchData, playerRows, resolveNextPlayerEventId, isSaving, addNotification]);

    // â”€â”€ Delete a row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleDeleteRow = useCallback((row, ri, tableName, setterFn) => {
        setConfirmDelete({ row, ri, tableName, setterFn });
    }, []);

    const executeDeleteRow = async () => {
        if (!confirmDelete) return;
        const { row, ri, tableName, setterFn } = confirmDelete;
        setConfirmDelete(null);
        if (!row._isNew) {
            try {
                if (row.ROW_ID) {
                    const { error: delErr } = await supabase.from(tableName).delete().eq('ROW_ID', row.ROW_ID);
                    if (delErr) throw delErr;
                } else {
                    const { error: delErr } = await supabase.from(tableName).delete().eq('MATCH_ID', matchData.MATCH_ID);
                    if (delErr) throw delErr;
                }
                setterFn?.((prev) => {
                    const idx = findRowIndexInList(prev, row, ri);
                    return prev.filter((_, i) => i !== idx);
                });
                addToast('Row deleted ✓', 'warn');
            } catch (e) { addToast('Delete failed: ' + e.message, 'error'); }
        } else {
            setterFn?.((prev) => {
                const idx = findRowIndexInList(prev, row, ri);
                return prev.filter((_, i) => i !== idx);
            });
        }
    };

    // â”€â”€ Save Match Details (Global Save) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSaveMatch = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const { "W-D-L": wdl, "CLEAN SHEET": cs, ...cleanMatchData } = matchData;
            const { error: matchErr } = await supabase.from('egy_NT_MATCHDETAILS').upsert(cleanMatchData);
            if (matchErr) throw matchErr;

            const saveLinkedTable = async (tableName, rows, setter) => {
                const pending = rows.filter(r => r._isNew || r._isDirty);
                const filled = pending.filter(r => isLinkedRowSaveable(tableName, r));
                if (filled.length === 0) return;

                const toInsert = filled.filter(shouldInsertEditorRow);
                const toUpdate = filled.filter((row) => !shouldInsertEditorRow(row));

                const cleanObj = (r, isNew) => {
                    const { _isNew, _isDirty, _key, _snapshot, ...clean } = { ...r, MATCH_ID: matchData.MATCH_ID };
                    if (!isNew && !hasPersistedRowId(clean)) {
                        delete clean.ROW_ID;
                    }
                    return clean;
                };

                let savedResults = [];
                const insertedByKey = new Map();
                try {
                    if (toInsert.length > 0) {
                        let insertPayload = toInsert.map(r => cleanObj(r, true));

                        if (tableName === "egy_NT_PLAYERDETAILS") {
                            const { data: dbEvents, error: eventFetchError } = await supabase
                                .from("egy_NT_PLAYERDETAILS")
                                .select("EVENT_ID")
                                .eq("MATCH_ID", matchData.MATCH_ID);
                            if (eventFetchError) throw eventFetchError;

                            let combined = [
                                ...rows.filter((row) => !shouldInsertEditorRow(row) || !toInsert.some((pending) => pending._key === row._key)),
                                ...(dbEvents || []).map((event) => ({ EVENT_ID: event.EVENT_ID }))
                            ];

                            insertPayload = toInsert.map((pendingRow) => {
                                const clean = cleanObj(pendingRow, true);
                                clean.EVENT_ID = getNextPlayerEventId(matchData.MATCH_ID, combined);
                                combined = [...combined, { EVENT_ID: clean.EVENT_ID }];
                                return clean;
                            });
                        }

                        insertPayload = await Promise.all(
                            insertPayload.map(async (payload) => {
                                const prepared = tableName === "egy_NT_HOWPENMISSED"
                                    ? await prepareHowPenMissedRowForSave(payload)
                                    : payload;
                                return resolveCatalogFieldsInForm(tableName, prepared);
                            })
                        );

                        if (tableName === "egy_NT_PLAYERDETAILS") {
                            const { data: existingRows, error: existingFetchError } = await supabase
                                .from("egy_NT_PLAYERDETAILS")
                                .select("EVENT_ID, ROW_ID")
                                .eq("MATCH_ID", matchData.MATCH_ID);
                            if (existingFetchError) throw existingFetchError;

                            const existingByEventId = new Map(
                                (existingRows || []).map((eventRow) => [String(eventRow.EVENT_ID), eventRow])
                            );

                            const safeInsertPayload = [];
                            const safeInsertSources = [];

                            insertPayload.forEach((payload, index) => {
                                const sourceRow = toInsert[index];
                                const existingMatch = existingByEventId.get(String(payload.EVENT_ID));
                                if (existingMatch) {
                                    insertedByKey.set(sourceRow._key, {
                                        ROW_ID: existingMatch.ROW_ID,
                                        EVENT_ID: existingMatch.EVENT_ID,
                                    });
                                    toUpdate.push({
                                        ...sourceRow,
                                        ROW_ID: existingMatch.ROW_ID,
                                        EVENT_ID: existingMatch.EVENT_ID,
                                        _isNew: false
                                    });
                                    return;
                                }

                                safeInsertPayload.push(payload);
                                safeInsertSources.push(sourceRow);
                                existingByEventId.set(String(payload.EVENT_ID), payload);
                            });

                            insertPayload = safeInsertPayload;
                            toInsert.length = 0;
                            toInsert.push(...safeInsertSources);
                        }

                        if (insertPayload.length > 0) {
                            const { data, error: insErr } = await supabase.from(tableName).insert(insertPayload).select();
                            if (insErr) throw insErr;
                            (data || []).forEach((savedRow, index) => {
                                const sourceKey = toInsert[index]?._key;
                                if (sourceKey != null) insertedByKey.set(sourceKey, savedRow);
                                savedResults.push(savedRow);
                            });
                        }
                    }
                    if (toUpdate.length > 0) {
                        for (const pendingRow of toUpdate) {
                            const clean = cleanObj(pendingRow, false);
                            const changed = getChangedFormFields(pendingRow._snapshot || {}, clean);
                            if (Object.keys(changed).length === 0) continue;

                            const resolved = tableName === "egy_NT_HOWPENMISSED"
                                ? await prepareHowPenMissedRowForSave({ ...clean, ...changed })
                                : await resolveCatalogFieldsInForm(tableName, changed);
                            let updateQuery = supabase.from(tableName).update(resolved);
                            if (hasPersistedRowId(clean)) {
                                updateQuery = updateQuery.eq("ROW_ID", clean.ROW_ID);
                            } else if (clean.EVENT_ID) {
                                updateQuery = updateQuery.eq("EVENT_ID", clean.EVENT_ID);
                            } else {
                                updateQuery = updateQuery.match(clean);
                            }

                            const { data, error: upErr } = await updateQuery.select();
                            if (upErr) throw upErr;
                            if (data?.[0]) savedResults.push(data[0]);
                        }
                    }
                } catch (e) {
                    throw new Error(`${tableName}: ${e.message}`);
                }

                if (savedResults.length > 0 || insertedByKey.size > 0) {
                    setter(prev => {
                        const updated = prev.map(existingRow => {
                            if (insertedByKey.has(existingRow._key)) {
                                return mergeSavedEditorRow(existingRow, insertedByKey.get(existingRow._key));
                            }

                            const saved = savedResults.find((candidate) => {
                                if (hasPersistedRowId(existingRow) && hasPersistedRowId(candidate)) {
                                    return String(candidate.ROW_ID) === String(existingRow.ROW_ID);
                                }
                                if (existingRow.EVENT_ID && candidate.EVENT_ID) {
                                    return String(candidate.EVENT_ID) === String(existingRow.EVENT_ID);
                                }
                                return false;
                            });

                            return saved ? mergeSavedEditorRow(existingRow, saved) : existingRow;
                        });
                        return sortRowsForTable(tableName, updated);
                    });
                }
            };

            await Promise.all([
                saveLinkedTable('egy_NT_LINEUPDETAILS', egyLineupRows, setEgyLineupRows),
                saveLinkedTable('egy_NT_LINEUPDETAILS', oppLineupRows, setOppLineupRows),
                saveLinkedTable('egy_NT_PLAYERDETAILS', playerRows, setPlayerRows),
                saveLinkedTable('egy_NT_GKSDETAILS', gkRows, setGkRows),
                saveLinkedTable('egy_NT_HOWPENMISSED', penRows, setPenRows),
            ]);

            addToast('Match and all pending records saved ✓');
        } catch (e) {
            addNotification(`Global Save Failed:\n${e.message}`, "error");
            addToast('Save Failed: ' + e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // â”€â”€ Create New Match â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleCreateMatch = async () => {
        const mid = normalizeMatchId(newMatchData.MATCH_ID);
        if (!mid) { addToast('MATCH_ID is required', 'error'); return; }

        setIsSaving(true);
        try {
            const exists = await fetchMatchIdExists(supabase, 'egy_NT_MATCHDETAILS', mid);
            if (exists) {
                addNotification(`Cannot create match: MATCH_ID "${mid}" already exists in the database.`, "error");
                addToast(`MATCH_ID "${mid}" already exists`, 'error');
                return;
            }

            const { "W-D-L": wdl, "CLEAN SHEET": cs, ...cleanNewMatchData } = newMatchData;
            const { error: matchErr } = await supabase.from('egy_NT_MATCHDETAILS').insert({ ...cleanNewMatchData, MATCH_ID: mid });
            if (matchErr) throw new Error(`Match Details: ${matchErr.message}`);

            const saveStagedTable = async (tableName, rows) => {
                const filled = rows.filter(r => isLinkedRowSaveable(tableName, r));
                if (filled.length === 0) return;

                let combined = [];
                let clean = filled.map(({ _isNew, _isDirty, _key, _snapshot, ...r }) => {
                    const row = { ...r, MATCH_ID: mid };

                    if (tableName === "egy_NT_PLAYERDETAILS") {
                        row.EVENT_ID = getNextPlayerEventId(mid, combined);
                        combined = [...combined, { EVENT_ID: row.EVENT_ID }];
                    }

                    return row;
                });

                clean = await Promise.all(
                    clean.map(async (row) => {
                        const prepared = tableName === "egy_NT_HOWPENMISSED"
                            ? await prepareHowPenMissedRowForSave(row)
                            : row;
                        return resolveCatalogFieldsInForm(tableName, prepared);
                    })
                );

                const { error: insErr } = await supabase.from(tableName).insert(clean);
                if (insErr) throw new Error(`${tableName}: ${insErr.message}`);
            };

            await Promise.all([
                saveStagedTable('egy_NT_LINEUPDETAILS', [...newEgyLineupRows, ...newOppLineupRows]),
                saveStagedTable('egy_NT_PLAYERDETAILS', newPlayerRows),
                saveStagedTable('egy_NT_GKSDETAILS', newGkRows),
                saveStagedTable('egy_NT_HOWPENMISSED', newPenRows),
            ]);

            addToast('Match + all linked data created ✓');
            setSearchId(mid);
            setNewEgyLineupRows([]); setNewOppLineupRows([]); setNewPlayerRows([]); setNewGkRows([]); setNewPenRows([]);
            setMode('search');
            setTimeout(() => handleSearch(), 400);

        } catch (e) {
            addNotification(`Failed to create match:\n${e.message}`, "error");
            addToast('Error: ' + e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const matchInfoFields = Object.keys(EMPTY_MATCH).filter(field => field !== 'MOTM');
    const newEgyTeamLabel = getDefaultEgyptTeamLabel(newMatchData);
    const editEgyTeamLabel = getDefaultEgyptTeamLabel(matchData || {});

    const renderLineupPanel = ({ title, color, rows, setRows, formData, isNew, teamName }) => {
        const matchId = isNew ? (formData.MATCH_ID || "---") : formData.MATCH_ID;
        return (
            <LineupPanel
                title={title}
                color={color}
                rows={rows}
                setRows={setRows}
                matchId={matchId}
                teamName={teamName}
                allPlayersList={allPlayersList}
                allTeamsList={allTeamsList}
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
                                flex: 1, padding: '12px 0', border: 'none', background: (mode === 'search' || mode === 'edit') ? '#C8102E' : 'transparent',
                                color: (mode === 'search' || mode === 'edit') ? '#000' : '#888', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                                cursor: 'pointer', borderRadius: 10, transition: 'all 0.2s', fontSize: 13, letterSpacing: 1
                            }}>
                            SEARCH MATCH
                        </button>
                        <button
                            onClick={() => { setMode('new'); setMatchData(null); setNewMatchData({ ...EMPTY_MATCH }); }}
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: mode === 'new' ? '#C8102E' : 'transparent',
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
                        <div className="portal-title">ENTER MATCH ID</div>
                        <div className="portal-subtitle">Type the Match ID to load all linked records for editing</div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', width: '100%', maxWidth: 520 }}>
                            <SearchBar_db value={searchId} onChange={setSearchId} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Match ID..." style={{ flex: 1 }} />
                            <button onClick={handleSearch} disabled={loading} className="load-btn">{loading ? 'Loading...' : 'LOAD →'}</button>
                        </div>
                    </div>
                )}

                {/* â”€â”€ Mode: New Match â”€â”€ */}
                {mode === 'new' && (
                    <>
                        <div className="editor-card">
                            <div className="card-header" style={{ marginBottom: 30 }}>
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#22c55e' }} />
                                    <h2 className="card-title">NEW MATCH DETAILS</h2>
                                </div>
                            </div>
                            <div className="grid-fields" style={{ marginBottom: 30 }}>
                                {matchInfoFields.map(field => (
                                    <div key={field}>
                                        <div className="field-label" style={{ color: field === 'MATCH_ID' ? '#22c55e' : '#999' }}>
                                            {field} {field === 'MATCH_ID' && <span style={{ color: '#aaa', fontWeight: 400, letterSpacing: 0 }}>(auto: Age + Opponent + Date)</span>}
                                        </div>
                                        {AUTOCOMPLETE_FIELDS.includes(field) ? (
                                            <AutocompleteInput
                                                value={newMatchData[field] ?? ''}
                                                options={matchFieldOptions[field] || []}
                                                onChange={val => setNewMatchData(prev => ({ ...prev, [field]: val }))}
                                                className="field-input"
                                            />
                                        ) : (
                                            <input
                                                type={field === 'DATE' ? 'date' : 'text'}
                                                value={newMatchData[field] ?? ''}
                                                disabled={field === 'MATCH_ID'}
                                                onChange={e => {
                                                    if (field === 'MATCH_ID') return;
                                                    setNewMatchData(prev => ({ ...prev, [field]: e.target.value }));
                                                }}
                                                className="field-input"
                                                style={{
                                                    border: field === 'MATCH_ID' ? '2px solid #22c55e' : '1.5px solid #e8e8e8',
                                                    background: field === 'MATCH_ID' ? 'rgba(34,197,94,0.05)' : '#fff',
                                                }}
                                                onFocus={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#C8102E'; }}
                                                onBlur={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#e8e8e8'; }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button onClick={handleCreateMatch} disabled={isSaving} className="create-match-btn">{isSaving ? 'Creating...' : '✓ CREATE MATCH'}</button>
                            </div>
                        </div>

                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA</h2>
                                </div>
                            </div>
                            <div className="linked-tabs-grid">
                                <button onClick={() => setActiveLinkedTab('lineup_egy')} className="tab-btn" style={{ background: activeLinkedTab === 'lineup_egy' ? '#C8102E' : '#f8f8f8', color: activeLinkedTab === 'lineup_egy' ? '#fff' : '#888' }}>EGYPT LINEUP</button>
                                <button onClick={() => setActiveLinkedTab('lineup_opp')} className="tab-btn" style={{ background: activeLinkedTab === 'lineup_opp' ? '#3b82f6' : '#f8f8f8', color: activeLinkedTab === 'lineup_opp' ? '#fff' : '#888' }}>OPPONENT LINEUP</button>
                                <button onClick={() => setActiveLinkedTab('events')} className="tab-btn" style={{ background: activeLinkedTab === 'events' ? '#8b5cf6' : '#f8f8f8', color: activeLinkedTab === 'events' ? '#fff' : '#888' }}>PLAYER EVENTS</button>
                                <button onClick={() => setActiveLinkedTab('motm')} className="tab-btn" style={{ background: activeLinkedTab === 'motm' ? '#10b981' : '#f8f8f8', color: activeLinkedTab === 'motm' ? '#fff' : '#888' }}>MOTM</button>
                                <button onClick={() => setActiveLinkedTab('gks')} className="tab-btn" style={{ background: activeLinkedTab === 'gks' ? '#f59e0b' : '#f8f8f8', color: activeLinkedTab === 'gks' ? '#fff' : '#888' }}>GK DETAILS</button>
                                <button onClick={() => setActiveLinkedTab('pens')} className="tab-btn" style={{ background: activeLinkedTab === 'pens' ? '#ef4444' : '#f8f8f8', color: activeLinkedTab === 'pens' ? '#fff' : '#888' }}>PENALTY MISSES</button>
                            </div>

                            {activeLinkedTab === 'lineup_egy' && renderLineupPanel({
                                title: "EGYPT LINEUP",
                                color: "#C8102E",
                                rows: newEgyLineupRows,
                                setRows: handleNewEgyLineupRows,
                                formData: newMatchData,
                                isNew: true,
                                teamName: newEgyTeamLabel,
                            })}
                            {activeLinkedTab === 'lineup_opp' && renderLineupPanel({
                                title: "OPPONENT LINEUP",
                                color: "#3b82f6",
                                rows: newOppLineupRows,
                                setRows: handleNewOppLineupRows,
                                formData: newMatchData,
                                isNew: true,
                                teamName: newMatchData["OPPONENT TEAM"] || "OPPONENT",
                            })}
                            {activeLinkedTab === 'events' && (
                                <PlayerEventsPanel
                                    title="PLAYER EVENTS"
                                    color="#8b5cf6"
                                    rows={newPlayerRows}
                                    setRows={setNewPlayerRows}
                                    matchId={newMatchData.MATCH_ID || '---'}
                                    teamOptions={[newEgyTeamLabel, newMatchData["OPPONENT TEAM"]].filter(Boolean)}
                                    allPlayersList={allPlayersList}
                                    allTeamsList={allTeamsList}
                                    eventTypes={eventTypes}
                                    eventSubTypes={eventSubTypes}
                                    persistToDb={false}
                                    onDeleteRow={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))}
                                    isSaving={false}
                                    resolveNextEventId={async (mid, currentRows) => getNextPlayerEventId(mid, currentRows)}
                                />
                            )}
                            {activeLinkedTab === 'gks' && (
                                <GkDetailsPanel
                                    title="GK DETAILS"
                                    color="#f59e0b"
                                    rows={newGkRows}
                                    setRows={setNewGkRows}
                                    matchId={newMatchData.MATCH_ID || '---'}
                                    teamOptions={[newEgyTeamLabel, newMatchData["OPPONENT TEAM"]].filter(Boolean)}
                                    allPlayersList={allPlayersList}
                                    playerEventRows={newPlayerRows}
                                    persistToDb={false}
                                    onDeleteRow={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))}
                                    isSaving={false}
                                />
                            )}
                            {activeLinkedTab === 'pens' && (
                                <PenaltyMissesPanel
                                    title="PENALTY MISSES"
                                    color="#ef4444"
                                    rows={newPenRows}
                                    setRows={setNewPenRows}
                                    matchId={newMatchData.MATCH_ID || '---'}
                                    teamOptions={[newEgyTeamLabel, newMatchData["OPPONENT TEAM"]].filter(Boolean)}
                                    gkPlayerOptions={allPlayersList}
                                    playerEventRows={newPlayerRows}
                                    persistToDb={false}
                                    onDeleteRow={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))}
                                    isSaving={false}
                                />
                            )}
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
                                        accentColor="#C8102E"
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
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#C8102E' }} />
                                    <div>
                                        <h2 className="card-title">MATCH DETAILS</h2>
                                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#888', marginTop: 2 }}>ID: {matchData.MATCH_ID}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => { setMode('search'); setMatchData(null); }} title="Back to search" className="action-btn-circle">←</button>
                                    <button onClick={handleSaveMatch} disabled={isSaving} title="Save match" className="save-match-btn">{isSaving ? '⏳' : '💾'}</button>
                                </div>
                            </div>
                            <div className="grid-fields">
                                {matchInfoFields.map(field => (
                                    <div key={field}>
                                        <div className="field-label">{field}</div>
                                        <input
                                            type={field === 'DATE' ? 'date' : 'text'}
                                            value={matchData[field] ?? ''}
                                            disabled={field === 'MATCH_ID'}
                                            onChange={e => setMatchData(prev => ({ ...prev, [field]: e.target.value }))}
                                            className="field-input"
                                            onFocus={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#C8102E'; }}
                                            onBlur={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#e8e8e8'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA</h2>
                                </div>
                            </div>
                            <div className="linked-tabs-grid">
                                <button onClick={() => setActiveLinkedTab('lineup_egy')} className="tab-btn" style={{ background: activeLinkedTab === 'lineup_egy' ? '#C8102E' : '#f8f8f8', color: activeLinkedTab === 'lineup_egy' ? '#fff' : '#888' }}>EGYPT LINEUP</button>
                                <button onClick={() => setActiveLinkedTab('lineup_opp')} className="tab-btn" style={{ background: activeLinkedTab === 'lineup_opp' ? '#3b82f6' : '#f8f8f8', color: activeLinkedTab === 'lineup_opp' ? '#fff' : '#888' }}>OPPONENT LINEUP</button>
                                <button onClick={() => setActiveLinkedTab('events')} className="tab-btn" style={{ background: activeLinkedTab === 'events' ? '#8b5cf6' : '#f8f8f8', color: activeLinkedTab === 'events' ? '#fff' : '#888' }}>PLAYER EVENTS</button>
                                <button onClick={() => setActiveLinkedTab('motm')} className="tab-btn" style={{ background: activeLinkedTab === 'motm' ? '#10b981' : '#f8f8f8', color: activeLinkedTab === 'motm' ? '#fff' : '#888' }}>MOTM</button>
                                <button onClick={() => setActiveLinkedTab('gks')} className="tab-btn" style={{ background: activeLinkedTab === 'gks' ? '#f59e0b' : '#f8f8f8', color: activeLinkedTab === 'gks' ? '#fff' : '#888' }}>GK DETAILS</button>
                                <button onClick={() => setActiveLinkedTab('pens')} className="tab-btn" style={{ background: activeLinkedTab === 'pens' ? '#ef4444' : '#f8f8f8', color: activeLinkedTab === 'pens' ? '#fff' : '#888' }}>PENALTY MISSES</button>
                            </div>

                            {activeLinkedTab === 'lineup_egy' && renderLineupPanel({
                                title: "EGYPT LINEUP",
                                color: "#C8102E",
                                rows: egyLineupRows,
                                setRows: handleEditEgyLineupRows,
                                formData: matchData,
                                isNew: false,
                                teamName: editEgyTeamLabel,
                            })}
                            {activeLinkedTab === 'lineup_opp' && renderLineupPanel({
                                title: "OPPONENT LINEUP",
                                color: "#3b82f6",
                                rows: oppLineupRows,
                                setRows: handleEditOppLineupRows,
                                formData: matchData,
                                isNew: false,
                                teamName: matchData["OPPONENT TEAM"] || "OPPONENT",
                            })}
                            {activeLinkedTab === 'events' && (
                                <PlayerEventsPanel
                                    title="PLAYER EVENTS"
                                    color="#8b5cf6"
                                    rows={playerRows}
                                    setRows={setPlayerRows}
                                    matchId={matchData.MATCH_ID}
                                    teamOptions={[editEgyTeamLabel, matchData["OPPONENT TEAM"]].filter(Boolean)}
                                    allPlayersList={allPlayersList}
                                    allTeamsList={allTeamsList}
                                    eventTypes={eventTypes}
                                    eventSubTypes={eventSubTypes}
                                    persistToDb
                                    onSaveRow={handleSaveRow}
                                    onDeleteRow={handleDeleteRow}
                                    isSaving={isSaving}
                                    resolveNextEventId={resolveNextPlayerEventId}
                                />
                            )}
                            {activeLinkedTab === 'gks' && (
                                <GkDetailsPanel
                                    title="GK DETAILS"
                                    color="#f59e0b"
                                    rows={gkRows}
                                    setRows={setGkRows}
                                    matchId={matchData.MATCH_ID}
                                    teamOptions={[editEgyTeamLabel, matchData["OPPONENT TEAM"]].filter(Boolean)}
                                    allPlayersList={allPlayersList}
                                    playerEventRows={playerRows}
                                    persistToDb
                                    onSaveRow={handleSaveRow}
                                    onDeleteRow={handleDeleteRow}
                                    isSaving={isSaving}
                                />
                            )}
                            {activeLinkedTab === 'pens' && (
                                <PenaltyMissesPanel
                                    title="PENALTY MISSES"
                                    color="#ef4444"
                                    rows={penRows}
                                    setRows={setPenRows}
                                    matchId={matchData.MATCH_ID}
                                    teamOptions={[editEgyTeamLabel, matchData["OPPONENT TEAM"]].filter(Boolean)}
                                    gkPlayerOptions={allPlayersList}
                                    playerEventRows={playerRows}
                                    persistToDb
                                    onSaveRow={handleSaveRow}
                                    onDeleteRow={handleDeleteRow}
                                    isSaving={isSaving}
                                />
                            )}
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
                                        accentColor="#C8102E"
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
            {/* Custom Confirm Delete Modal */}
            {confirmDelete && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-box">
                        <div className="confirm-modal-icon">⚠️</div>
                        <div className="confirm-modal-title">Delete Row?</div>
                        <div className="confirm-modal-text">
                            Are you sure you want to delete this row? This action cannot be undone.
                        </div>
                        <div className="confirm-modal-actions">
                            <button className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setConfirmDelete(null)}>
                                CANCEL
                            </button>
                            <button className="confirm-modal-btn confirm-modal-btn-delete" onClick={executeDeleteRow}>
                                DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Login_db>
    );
}
