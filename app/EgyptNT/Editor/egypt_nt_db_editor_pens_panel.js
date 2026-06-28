"use client";

import { useState, useMemo } from "react";
import { AutocompleteInput } from "../../Database";
import NoData_db from "../../lib/NoData_db";
import { useNotification } from "../../lib/Notification_db";
import { formatHowPenMissedForDisplay, buildHowPenMissedAutocompleteOptions } from "../../Alahly/Penalties/alahly_db_penalties_utils";
import { EMPTY_PEN } from "./egypt_nt_db_editor_constants";
import EditorEventCard from "./egypt_nt_db_editor_event_card";
import {
    listIndexedRowsByEventId,
    sortRowsByEventId,
    isPenRowSaveable,
    formatPenLine,
    buildPlayerEventIdOptions,
} from "./egypt_nt_db_editor_event_utils";

export default function PenaltyMissesPanel({
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