"use client";

import { useState, useMemo } from "react";
import { AutocompleteInput, GkGoalEventIdMultiSelect, parseGkEventIds, serializeGkEventIds } from "../../Database";
import NoData_db from "../../lib/NoData_db";
import { useNotification } from "../../lib/Notification_db";
import { EMPTY_GK } from "./egypt_nt_db_editor_constants";
import EditorEventCard from "./egypt_nt_db_editor_event_card";
import {
    listIndexedRowsByEventId,
    sortRowsByEventId,
    isGkRowSaveable,
    formatGkLine,
    UNNAMED_PLAYER_LABEL,
} from "./egypt_nt_db_editor_event_utils";

export default function GkDetailsPanel({
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