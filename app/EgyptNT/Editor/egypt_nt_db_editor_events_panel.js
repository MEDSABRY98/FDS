"use client";

import { useState, useMemo } from "react";
import { AutocompleteInput } from "../../Database";
import NoData_db from "../../lib/NoData_db";
import { useNotification } from "../../lib/Notification_db";
import { EMPTY_PLAYER } from "./egypt_nt_db_editor_constants";
import EditorEventCard from "./egypt_nt_db_editor_event_card";
import {
    listIndexedRowsByEventId,
    parseEventIdSuffix,
    sortRowsByEventId,
    getNextPlayerEventId,
    isPlayerEventRowSaveable,
    formatEventLine,
    UNNAMED_PLAYER_LABEL,
} from "./egypt_nt_db_editor_event_utils";

export default function PlayerEventsPanel({
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