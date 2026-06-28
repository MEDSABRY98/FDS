"use client";

import { useMemo, useRef } from "react";
import { AutocompleteInput, getLineupSubOutOptions } from "../../Database";
import { EMPTY_LINEUP } from "./egypt_nt_db_editor_constants";
import { createEmptyStarterSlot } from "./egypt_nt_db_editor_lineup_utils";

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

export default function LineupPanel({
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
            if (!String(currentRow["PLAYER NAME"] || "").trim() !== "") return;
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
                    Lineup rows save with the global SAVE MATCH button (TEAM syncs from Egypt / Opponent TEAM above).
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