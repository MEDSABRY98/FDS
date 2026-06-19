"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { EgyptNTPKSService } from "../Service/egypt_nt_pks_service";
import { fetchCatalogDisplayNames, AutocompleteInput } from "../../Database";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import { useNotification } from "../../lib/Notification_db";
import "./egypt_nt_pks_editor.css";

const ACCENT = "#C8102E";

const EMPTY_KICK_ROW = {
    "Egypt PLAYER": "",
    "Egypt STATUS": "GOAL",
    "EGYPT HOW MISS": "",
    "OPPONENT PLAYER": "",
    "OPPONENT STATUS": "GOAL",
    "OPPONENT HOW MISS": "",
    "EGYPT GK": "",
    "OPPONENT GK": "",
};

function createKickRow(overrides = {}) {
    return {
        ...EMPTY_KICK_ROW,
        _localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        ...overrides,
    };
}

function toDropdownOptions(values = []) {
    return (values || [])
        .map((raw) => String(raw || "").trim())
        .filter(Boolean)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
        .map((value) => ({ value, label: value }));
}

function getKickRowKey(row) {
    return row.ORIGINAL_ROW_ID || row._localId;
}

function resolveMatchIdFromSearch(searchTerm, pksData = []) {
    const trimmed = String(searchTerm || "").trim();
    if (!trimmed) return "";

    const upper = trimmed.toUpperCase();

    const byDisplay = (pksData || []).find(
        (k) => String(k.DISPLAY_ID || "").toUpperCase() === upper
    );
    if (byDisplay) return String(byDisplay.MATCH_ID || byDisplay.PKS_ID || "").trim();

    const byMatchId = (pksData || []).find(
        (k) => String(k.MATCH_ID || "").toUpperCase() === upper
            || String(k.PKS_ID || "").toUpperCase() === upper
    );
    if (byMatchId) return String(byMatchId.MATCH_ID || byMatchId.PKS_ID || "").trim();

    return trimmed;
}

function loadShootoutFromKicks(kicks, setCommonData, setKickRows, setFoundKicks, setEditingKick) {
    const first = kicks[0];
    setFoundKicks(kicks);
    setCommonData({
        MATCH_ID: first.MATCH_ID,
        "PKS System": first["PKS System"],
        "CHAMPION System": first["CHAMPION System"],
        "Egypt TEAM": first["Egypt TEAM"],
        "OPPONENT TEAM": first["OPPONENT TEAM"],
        "PKS W-L": first["PKS W-L"],
        "G-EGYPT": first["G-EGYPT"],
        "G-OPPONENT": first["G-OPPONENT"],
        DISPLAY_ID: first.DISPLAY_ID,
    });
    setKickRows(kicks.map((k) => createKickRow({
        "Egypt PLAYER": k["Egypt PLAYER"],
        "Egypt STATUS": k["Egypt STATUS"],
        "EGYPT HOW MISS": k["EGYPT HOW MISS"],
        "OPPONENT PLAYER": k["OPPONENT PLAYER"],
        "OPPONENT STATUS": k["OPPONENT STATUS"],
        "OPPONENT HOW MISS": k["OPPONENT HOW MISS"],
        "EGYPT GK": k["EGYPT GK"],
        "OPPONENT GK": k["OPPONENT GK"],
        ORIGINAL_ROW_ID: k.ROW_ID,
        _localId: undefined,
    })));
    setEditingKick(true);
}

const KickRow = React.memo(function KickRow({
    row,
    index,
    canRemove,
    playerOptions,
    howMissOptions,
    egyptStatusOptions,
    oppStatusOptions,
    onKickChange,
    onRemove,
}) {
    return (
        <div className="builder-row-box">
            <div className="row-title">
                <span>KICK {index + 1}</span>
                {canRemove && (
                    <button type="button" className="remove-row-btn" onClick={() => onRemove(index)}>
                        REMOVE
                    </button>
                )}
            </div>
            <div className="builder-grid-compact">
                <div className="side-box egypt-side">
                    <label>EGYPT KICKER</label>
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={playerOptions}
                        value={row["Egypt PLAYER"] || ""}
                        onChange={(v) => onKickChange(index, "Egypt PLAYER", v)}
                        placeholder="Player Name"
                        accentColor={ACCENT}
                    />
                    <DropDownList_db
                        allowCustom
                        className="pks-dropdown-compact"
                        options={egyptStatusOptions}
                        value={row["Egypt STATUS"] || ""}
                        onChange={(v) => onKickChange(index, "Egypt STATUS", v)}
                        placeholder="Status"
                    />
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={howMissOptions}
                        value={row["EGYPT HOW MISS"] || ""}
                        onChange={(v) => onKickChange(index, "EGYPT HOW MISS", v)}
                        placeholder="How Missed?"
                        accentColor={ACCENT}
                    />
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={playerOptions}
                        value={row["OPPONENT GK"] || ""}
                        onChange={(v) => onKickChange(index, "OPPONENT GK", v)}
                        placeholder="Opponent GK"
                        accentColor={ACCENT}
                    />
                </div>
                <div className="side-box opp-side">
                    <label>OPPONENT KICKER</label>
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={playerOptions}
                        value={row["OPPONENT PLAYER"] || ""}
                        onChange={(v) => onKickChange(index, "OPPONENT PLAYER", v)}
                        placeholder="Player Name"
                        accentColor={ACCENT}
                    />
                    <DropDownList_db
                        allowCustom
                        className="pks-dropdown-compact"
                        options={oppStatusOptions}
                        value={row["OPPONENT STATUS"] || ""}
                        onChange={(v) => onKickChange(index, "OPPONENT STATUS", v)}
                        placeholder="Status"
                    />
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={howMissOptions}
                        value={row["OPPONENT HOW MISS"] || ""}
                        onChange={(v) => onKickChange(index, "OPPONENT HOW MISS", v)}
                        placeholder="How Missed?"
                        accentColor={ACCENT}
                    />
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={playerOptions}
                        value={row["EGYPT GK"] || ""}
                        onChange={(v) => onKickChange(index, "EGYPT GK", v)}
                        placeholder="Egypt GK"
                        accentColor={ACCENT}
                    />
                </div>
            </div>
        </div>
    );
});

export default function EgyptNTPKSEditor({ pksData, pksSuggestions = {}, onDataSaved }) {
    const { addNotification } = useNotification();
    const [mode, setMode] = useState("SEARCH");
    const [searchId, setSearchId] = useState("");
    const [foundKicks, setFoundKicks] = useState([]);
    const [editingKick, setEditingKick] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const defaultEgyptTeam = useMemo(() => {
        const fromData = (pksData || []).find((item) => item["Egypt TEAM"])?.["Egypt TEAM"];
        return fromData || "Ù…ØµØ±";
    }, [pksData]);

    const initialCommonData = useMemo(() => ({
        MATCH_ID: "",
        "PKS System": "",
        "CHAMPION System": "",
        "Egypt TEAM": defaultEgyptTeam,
        "OPPONENT TEAM": "",
        "PKS W-L": "",
        "G-OPPONENT": 0,
        "G-EGYPT": 0,
    }), [defaultEgyptTeam]);

    const [commonData, setCommonData] = useState({});
    const [kickRows, setKickRows] = useState(() => [createKickRow()]);
    const scrollToNewKickRef = useRef(false);
    const [catalogNames, setCatalogNames] = useState({ players: [], teams: [] });

    useEffect(() => {
        let active = true;

        async function loadCatalogNames() {
            try {
                const [players, teams] = await Promise.all([
                    fetchCatalogDisplayNames("db_PLAYERS"),
                    fetchCatalogDisplayNames("db_TEAMS"),
                ]);
                if (active) setCatalogNames({ players, teams });
            } catch (err) {
                console.error("Failed to load PKS catalog names:", err);
            }
        }

        loadCatalogNames();
        window.addEventListener("nameDisplayLangChanged", loadCatalogNames);
        return () => {
            active = false;
            window.removeEventListener("nameDisplayLangChanged", loadCatalogNames);
        };
    }, []);

    useEffect(() => {
        if (mode === "CREATE") {
            setCommonData(initialCommonData);
            setKickRows([createKickRow()]);
        }
    }, [mode, initialCommonData]);

    useEffect(() => {
        if (!scrollToNewKickRef.current) return;
        scrollToNewKickRef.current = false;
        requestAnimationFrame(() => {
            const rowBoxes = document.querySelectorAll(".pks-editor-container .builder-row-box");
            rowBoxes[rowBoxes.length - 1]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    }, [kickRows.length]);

    const dropdownOptions = useMemo(() => ({
        pksSystem: toDropdownOptions(pksSuggestions.pksSystem),
        champSystem: toDropdownOptions(pksSuggestions.champSystem),
        egyptStatus: toDropdownOptions(pksSuggestions.egyptStatus),
        oppStatus: toDropdownOptions(pksSuggestions.oppStatus),
        pksWL: toDropdownOptions(pksSuggestions.pksWL),
        howMiss: toDropdownOptions(pksSuggestions.howMiss),
    }), [pksSuggestions]);

    const playerOptions = catalogNames.players;
    const teamOptions = catalogNames.teams;

    const handleSearch = async () => {
        if (!searchId.trim() || isSearching) return;
        setIsSearching(true);
        try {
            const matchId = resolveMatchIdFromSearch(searchId, pksData);

            let kicks = (pksData || []).filter(
                (k) => String(k.MATCH_ID || k.PKS_ID || "").toUpperCase() === matchId.toUpperCase()
            );

            if (kicks.length === 0) {
                kicks = await EgyptNTPKSService.getPKsByMatchId(matchId);
            }

            if (kicks.length === 0) {
                setFoundKicks([]);
                setEditingKick(null);
                addNotification("No shootout found with this ID.", "error");
            } else {
                const displayMatch = (pksData || []).find(
                    (k) => String(k.MATCH_ID || k.PKS_ID || "").toUpperCase() === matchId.toUpperCase()
                );
                const kicksWithDisplay = displayMatch?.DISPLAY_ID
                    ? kicks.map((k) => ({ ...k, DISPLAY_ID: displayMatch.DISPLAY_ID }))
                    : kicks;
                loadShootoutFromKicks(kicksWithDisplay, setCommonData, setKickRows, setFoundKicks, setEditingKick);
            }
        } catch (err) {
            addNotification(err?.message || "Error searching for shootout.", "error");
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddRow = useCallback(() => {
        scrollToNewKickRef.current = true;
        setKickRows((prev) => [...prev, createKickRow()]);
    }, []);

    const handleRemoveRow = useCallback((index) => {
        setKickRows((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleKickChange = useCallback((index, field, value) => {
        setKickRows((prev) => {
            const newRows = [...prev];
            newRows[index] = { ...newRows[index], [field]: value };
            return newRows;
        });
    }, []);

    const setCommonField = useCallback((field, value) => {
        setCommonData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveShootout = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!String(commonData.MATCH_ID || "").trim()) {
            addNotification("MATCH ID is required.", "error");
            return;
        }

        setIsSaving(true);
        try {
            await EgyptNTPKSService.savePKSShootout({
                commonData,
                kickRows,
                existingKicks: editingKick ? foundKicks : [],
            });

            if (onDataSaved) {
                await onDataSaved();
            }

            const savedMatchId = String(commonData.MATCH_ID || "").trim();
            const freshKicks = savedMatchId
                ? await EgyptNTPKSService.getPKsByMatchId(savedMatchId)
                : [];

            setSearchId(savedMatchId || "");
            setMode("SEARCH");
            addNotification(`Shootout ${savedMatchId} saved successfully.`, "success");

            if (freshKicks.length > 0) {
                loadShootoutFromKicks(
                    freshKicks,
                    setCommonData,
                    setKickRows,
                    setFoundKicks,
                    setEditingKick
                );
            } else {
                setEditingKick(null);
                setFoundKicks([]);
            }
        } catch (err) {
            addNotification(err?.message || "Failed to save shootout records.", "error");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const editingLabel = commonData.DISPLAY_ID
        ? `${commonData.DISPLAY_ID} (${commonData.MATCH_ID})`
        : commonData.MATCH_ID;

    const renderShootoutBuilder = () => (
        <div className="shootout-builder fade-in">
            <div className="builder-section common-info">
                <div className="section-header">
                    <span className="section-num">01</span>
                    <h3>GENERAL MATCH DETAILS</h3>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>MATCH ID</label>
                        <input
                            type="text"
                            value={commonData.MATCH_ID || ""}
                            onChange={(e) => setCommonField("MATCH_ID", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>PKS SYSTEM</label>
                        <DropDownList_db
                            allowCustom
                            options={dropdownOptions.pksSystem}
                            value={commonData["PKS System"] || ""}
                            onChange={(v) => setCommonField("PKS System", v)}
                            placeholder="Select PKS System"
                            searchable
                        />
                    </div>
                    <div className="form-group">
                        <label>CHAMPION SYSTEM</label>
                        <DropDownList_db
                            allowCustom
                            options={dropdownOptions.champSystem}
                            value={commonData["CHAMPION System"] || ""}
                            onChange={(v) => setCommonField("CHAMPION System", v)}
                            placeholder="Select Champion System"
                            searchable
                        />
                    </div>
                    <div className="form-group">
                        <label>EGYPT TEAM</label>
                        <AutocompleteInput
                            options={teamOptions}
                            value={commonData["Egypt TEAM"] || ""}
                            onChange={(v) => setCommonField("Egypt TEAM", v)}
                            placeholder="Select Egypt Team"
                            accentColor={ACCENT}
                        />
                    </div>
                    <div className="form-group">
                        <label>OPPONENT TEAM</label>
                        <AutocompleteInput
                            options={teamOptions}
                            value={commonData["OPPONENT TEAM"] || ""}
                            onChange={(v) => setCommonField("OPPONENT TEAM", v)}
                            placeholder="Select Opponent Team"
                            accentColor={ACCENT}
                        />
                    </div>
                    <div className="form-group">
                        <label>PKS W-L</label>
                        <DropDownList_db
                            allowCustom
                            options={dropdownOptions.pksWL}
                            value={commonData["PKS W-L"] || ""}
                            onChange={(v) => setCommonField("PKS W-L", v)}
                            placeholder="Select Result"
                        />
                    </div>
                    <div className="form-group">
                        <label>G-EGYPT</label>
                        <input
                            type="number"
                            value={commonData["G-EGYPT"] || 0}
                            onChange={(e) => setCommonField("G-EGYPT", parseInt(e.target.value, 10) || 0)}
                        />
                    </div>
                    <div className="form-group">
                        <label>G-OPPONENT</label>
                        <input
                            type="number"
                            value={commonData["G-OPPONENT"] || 0}
                            onChange={(e) => setCommonField("G-OPPONENT", parseInt(e.target.value, 10) || 0)}
                        />
                    </div>
                </div>
            </div>

            <div className="builder-section kicks-info">
                <div className="section-header">
                    <span className="section-num">02</span>
                    <h3>KICKS & PLAYERS</h3>
                </div>

                <div className="kicks-list">
                    {kickRows.map((row, idx) => (
                        <KickRow
                            key={getKickRowKey(row)}
                            row={row}
                            index={idx}
                            canRemove={kickRows.length > 1}
                            playerOptions={playerOptions}
                            howMissOptions={pksSuggestions.howMiss || []}
                            egyptStatusOptions={dropdownOptions.egyptStatus}
                            oppStatusOptions={dropdownOptions.oppStatus}
                            onKickChange={handleKickChange}
                            onRemove={handleRemoveRow}
                        />
                    ))}
                </div>

                <button type="button" className="add-row-btn-lux" onClick={handleAddRow}>+ ADD ANOTHER KICK</button>
            </div>

            <div className="builder-actions">
                <button type="button" className="save-all-btn" onClick={handleSaveShootout} disabled={isSaving}>
                    {isSaving ? (
                        <span className="btn-loader-wrap">
                            <span className="btn-spinner" />
                            {editingKick ? "Updating..." : "Saving..."}
                        </span>
                    ) : (
                        editingKick
                            ? `UPDATE SHOOTOUT (${kickRows.length} KICKS)`
                            : `SAVE SHOOTOUT (${kickRows.length} KICKS)`
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="pks-editor-container fade-in">
            <div className="mode-switch-wrap">
                <div className="mode-switch">
                    <button
                        type="button"
                        onClick={() => { setMode("SEARCH"); setEditingKick(null); setFoundKicks([]); }}
                        className={`mode-switch-btn ${(mode === "SEARCH" || editingKick) ? "active" : ""}`}
                    >
                        SEARCH PKS
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode("CREATE"); setEditingKick(null); setCommonData(initialCommonData); setKickRows([createKickRow()]); }}
                        className={`mode-switch-btn ${mode === "CREATE" && !editingKick ? "active" : ""}`}
                    >
                        ADD PKS
                    </button>
                </div>
            </div>

            {mode === "SEARCH" && (
                <div className="search-section">
                    {!editingKick && (
                        <div className="portal-container">
                            <div className="portal-icon">ðŸ”Ž</div>
                            <div className="portal-title">ENTER MATCH ID</div>
                            <div className="portal-subtitle">
                                Type MATCH ID or PK-N (display ID) to load all linked records for editing
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "center", width: "100%", maxWidth: 520 }}>
                                <SearchBar_db
                                    value={searchId}
                                    onChange={setSearchId}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="MATCH ID or PK-N..."
                                    style={{ flex: 1 }}
                                />
                                <button onClick={handleSearch} disabled={isSearching} className="load-btn" type="button">
                                    {isSearching ? (
                                        <span className="btn-loader-wrap">
                                            <span className="btn-spinner btn-spinner--light" />
                                            Loading...
                                        </span>
                                    ) : "LOAD â†’"}
                                </button>
                            </div>
                        </div>
                    )}

                    {editingKick && (
                        <div className="bulk-edit-container fade-in">
                            <div className="form-header">
                                <h2 style={{ fontFamily: "Bebas Neue", color: "var(--egypt-red)" }}>
                                    EDITING SHOOTOUT: {editingLabel}
                                </h2>
                                <button type="button" className="cancel-btn" onClick={() => { setEditingKick(null); setFoundKicks([]); }}>
                                    EXIT EDIT
                                </button>
                            </div>
                            {renderShootoutBuilder()}
                        </div>
                    )}
                </div>
            )}

            {mode === "CREATE" && (
                <div className="create-section">
                    {renderShootoutBuilder()}
                </div>
            )}
        </div>
    );
}
