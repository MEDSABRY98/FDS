"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AlAhlyService } from "../../Alahly/Service/alahly_db_service";
import { fetchCatalogDisplayNames, AutocompleteInput } from "../../Database";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import { useNotification } from "../../lib/Notification_db";
import "./alahly_pks_editor.css";

const EMPTY_KICK_ROW = {
    "AHLY PLAYER": "",
    "AHLY STATUS": "GOAL",
    "HOWMISS AHLY": "",
    "OPPONENT PLAYER": "",
    "OPPONENT STATUS": "GOAL",
    "HOWMISS OPPONENT": "",
    "AHLY GK": "",
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

function formatMatchPickerLabel(match) {
    if (!match) return "";
    const date = String(match.DATE || "").slice(0, 10);
    const opponent = match["OPPONENT TEAM"] || "";
    const champion = match.CHAMPION || "";
    const pen = match.PEN || "";
    return [match.MATCH_ID, date, opponent, champion, pen].filter(Boolean).join(" · ");
}

function loadShootoutFromKicks(kicks, setCommonData, setKickRows, setFoundKicks, setEditingKick) {
    const first = kicks[0];
    setFoundKicks(kicks);
    setCommonData({
        PKS_ID: first.PKS_ID,
        MATCH_ID: first.MATCH_ID || "",
        "PKS SYSTEM": first["PKS SYSTEM"],
        "WHO START?": first["WHO START?"],
        "MATCH RESULT": first["MATCH RESULT"],
        "PKS W-L": first["PKS W-L"],
        "G-OPPONENT": first["G-OPPONENT"],
        "G-AHLY": first["G-AHLY"],
    });
    setKickRows(kicks.map((k) => createKickRow({
        "AHLY PLAYER": k["AHLY PLAYER"],
        "AHLY STATUS": k["AHLY STATUS"],
        "HOWMISS AHLY": k["HOWMISS AHLY"],
        "OPPONENT PLAYER": k["OPPONENT PLAYER"],
        "OPPONENT STATUS": k["OPPONENT STATUS"],
        "HOWMISS OPPONENT": k["HOWMISS OPPONENT"],
        "AHLY GK": k["AHLY GK"],
        "OPPONENT GK": k["OPPONENT GK"],
        ORIGINAL_ROW_ID: k.ROW_ID,
        _localId: undefined,
    })));
    setEditingKick(true);
}

function MatchSummary({ match }) {
    if (!match) {
        return (
            <div className="pks-match-summary pks-match-summary--empty">
                Select a MATCH ID to load match details from the main database.
            </div>
        );
    }

    const season = match["SEASON - NAME"] || match["SEASON - NUMBER"] || "—";

    return (
        <div className="pks-match-summary">
            <div className="pks-match-summary-title">MATCH DETAILS (from main database)</div>
            <div className="pks-match-summary-grid">
                <span><strong>Date:</strong> {String(match.DATE || "").slice(0, 10) || "—"}</span>
                <span><strong>Champion:</strong> {match.CHAMPION || "—"}</span>
                <span><strong>Season:</strong> {season}</span>
                <span><strong>Round:</strong> {match.ROUND || "—"}</span>
                <span><strong>Ahly Team:</strong> {match["AHLY TEAM"] || "—"}</span>
                <span><strong>Opponent:</strong> {match["OPPONENT TEAM"] || "—"}</span>
                <span><strong>Champion System:</strong> {match["CHAMPION SYSTEM"] || "—"}</span>
                <span><strong>PEN:</strong> {match.PEN || "—"}</span>
            </div>
        </div>
    );
}

const KickRow = React.memo(function KickRow({
    row,
    index,
    canRemove,
    playerOptions,
    howMissOptions,
    ahlyStatusOptions,
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
                <div className="side-box ahly-side">
                    <label>AL AHLY KICKER</label>
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={playerOptions}
                        value={row["AHLY PLAYER"] || ""}
                        onChange={(v) => onKickChange(index, "AHLY PLAYER", v)}
                        placeholder="Player Name"
                        accentColor="#c9a84c"
                    />
                    <DropDownList_db
                        allowCustom
                        className="pks-dropdown-compact"
                        options={ahlyStatusOptions}
                        value={row["AHLY STATUS"] || ""}
                        onChange={(v) => onKickChange(index, "AHLY STATUS", v)}
                        placeholder="Status"
                    />
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={howMissOptions}
                        value={row["HOWMISS AHLY"] || ""}
                        onChange={(v) => onKickChange(index, "HOWMISS AHLY", v)}
                        placeholder="How Missed?"
                        accentColor="#c9a84c"
                    />
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={playerOptions}
                        value={row["OPPONENT GK"] || ""}
                        onChange={(v) => onKickChange(index, "OPPONENT GK", v)}
                        placeholder="Opponent GK"
                        accentColor="#c9a84c"
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
                        accentColor="#c9a84c"
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
                        value={row["HOWMISS OPPONENT"] || ""}
                        onChange={(v) => onKickChange(index, "HOWMISS OPPONENT", v)}
                        placeholder="How Missed?"
                        accentColor="#c9a84c"
                    />
                    <AutocompleteInput
                        className="pks-autocomplete-compact"
                        options={playerOptions}
                        value={row["AHLY GK"] || ""}
                        onChange={(v) => onKickChange(index, "AHLY GK", v)}
                        placeholder="Ahly GK"
                        accentColor="#c9a84c"
                    />
                </div>
            </div>
        </div>
    );
});

export default function AlAhlyPKsEditor({ pksData, pksSuggestions = {}, penaltyMatches = [], onDataSaved }) {
    const { addNotification } = useNotification();
    const [mode, setMode] = useState("SEARCH");
    const [searchId, setSearchId] = useState("");
    const [foundKicks, setFoundKicks] = useState([]);
    const [editingKick, setEditingKick] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const matchById = useMemo(() => {
        const map = new Map();
        (penaltyMatches || []).forEach((m) => {
            const id = String(m.MATCH_ID || "").trim();
            if (id) map.set(id, m);
        });
        return map;
    }, [penaltyMatches]);

    const matchPickerOptions = useMemo(
        () => (penaltyMatches || []).map((m) => ({
            value: m.MATCH_ID,
            label: formatMatchPickerLabel(m),
        })),
        [penaltyMatches]
    );

    const getNextPksId = useCallback(() => {
        if (!pksData || pksData.length === 0) return "PKS-0100";
        const ids = pksData.map((item) => {
            const match = String(item.PKS_ID).match(/PKS-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        });
        const maxId = Math.max(...ids);
        return `PKS-${String(maxId + 1).padStart(4, "0")}`;
    }, [pksData]);

    const initialCommonData = useMemo(() => ({
        PKS_ID: getNextPksId(),
        MATCH_ID: "",
        "PKS SYSTEM": "",
        "WHO START?": "",
        "MATCH RESULT": "",
        "PKS W-L": "",
        "G-OPPONENT": 0,
        "G-AHLY": 0,
    }), [getNextPksId]);

    const [commonData, setCommonData] = useState({});
    const [kickRows, setKickRows] = useState(() => [createKickRow()]);
    const [resolvedMatch, setResolvedMatch] = useState(null);
    const scrollToNewKickRef = useRef(false);
    const [catalogNames, setCatalogNames] = useState({ players: [] });

    const selectedMatch = useMemo(() => {
        const id = String(commonData.MATCH_ID || "").trim();
        if (!id) return resolvedMatch;
        return matchById.get(id) || resolvedMatch;
    }, [commonData.MATCH_ID, matchById, resolvedMatch]);

    useEffect(() => {
        let active = true;

        async function loadCatalogNames() {
            try {
                const players = await fetchCatalogDisplayNames("db_PLAYERS");
                if (active) setCatalogNames({ players });
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
            setResolvedMatch(null);
        }
    }, [mode, initialCommonData]);

    useEffect(() => {
        const matchId = String(commonData.MATCH_ID || "").trim();
        if (!matchId) {
            setResolvedMatch(null);
            return;
        }
        if (matchById.has(matchId)) {
            setResolvedMatch(matchById.get(matchId));
            return;
        }

        let active = true;
        AlAhlyService.getMatchByMatchId(matchId)
            .then((match) => {
                if (active) setResolvedMatch(match);
            })
            .catch(() => {
                if (active) setResolvedMatch(null);
            });

        return () => { active = false; };
    }, [commonData.MATCH_ID, matchById]);

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
        whoStart: toDropdownOptions(pksSuggestions.whoStart),
        ahlyStatus: toDropdownOptions(pksSuggestions.ahlyStatus),
        oppStatus: toDropdownOptions(pksSuggestions.oppStatus),
        pksWL: toDropdownOptions(pksSuggestions.pksWL),
        howMiss: toDropdownOptions(pksSuggestions.howMiss),
        matchId: matchPickerOptions,
    }), [pksSuggestions, matchPickerOptions]);

    const playerOptions = catalogNames.players;

    const handleSearch = async () => {
        if (!searchId.trim() || isSearching) return;
        setIsSearching(true);
        try {
            let kicks = (pksData || []).filter(
                (k) => String(k.PKS_ID).toUpperCase() === searchId.toUpperCase().trim()
            );

            if (kicks.length === 0) {
                kicks = await AlAhlyService.getPKsByPksId(searchId.trim());
            }

            if (kicks.length === 0) {
                setFoundKicks([]);
                setEditingKick(null);
                addNotification("No shootout found with this ID.", "error");
            } else {
                const enriched = await AlAhlyService.enrichPksWithMatchDetails(kicks);
                loadShootoutFromKicks(enriched, setCommonData, setKickRows, setFoundKicks, setEditingKick);
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
            addNotification("MATCH ID is required. Link this shootout to a main match.", "error");
            return;
        }

        setIsSaving(true);
        try {
            await AlAhlyService.savePKSShootout({
                commonData,
                kickRows,
                existingKicks: editingKick ? foundKicks : [],
            });

            if (onDataSaved) {
                await onDataSaved();
            }

            const savedPksId = commonData.PKS_ID;
            const freshKicks = savedPksId
                ? await AlAhlyService.getPKsByPksId(savedPksId)
                : [];

            setSearchId(savedPksId || "");
            setMode("SEARCH");
            addNotification(`Shootout ${savedPksId} saved successfully.`, "success");

            if (freshKicks.length > 0) {
                const enriched = await AlAhlyService.enrichPksWithMatchDetails(freshKicks);
                loadShootoutFromKicks(
                    enriched,
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

    const renderShootoutBuilder = () => (
        <div className="shootout-builder fade-in">
            <div className="builder-section common-info">
                <div className="section-header">
                    <span className="section-num">01</span>
                    <h3>GENERAL MATCH DETAILS</h3>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>PKS ID</label>
                        <input type="text" value={commonData.PKS_ID || ""} onChange={(e) => setCommonField("PKS_ID", e.target.value)} />
                    </div>
                    <div className="form-group form-group--wide">
                        <label>MATCH ID *</label>
                        <DropDownList_db
                            allowCustom
                            options={dropdownOptions.matchId}
                            value={commonData.MATCH_ID || ""}
                            onChange={(v) => setCommonField("MATCH_ID", v)}
                            placeholder="Select penalty match..."
                            searchable
                        />
                    </div>
                    <div className="form-group form-group--full">
                        <MatchSummary match={selectedMatch} />
                    </div>
                    <div className="form-group">
                        <label>PKS SYSTEM</label>
                        <DropDownList_db allowCustom options={dropdownOptions.pksSystem} value={commonData["PKS SYSTEM"] || ""} onChange={(v) => setCommonField("PKS SYSTEM", v)} placeholder="Select PKS System" searchable />
                    </div>
                    <div className="form-group">
                        <label>WHO START?</label>
                        <DropDownList_db allowCustom options={dropdownOptions.whoStart} value={commonData["WHO START?"] || ""} onChange={(v) => setCommonField("WHO START?", v)} placeholder="Who starts?" />
                    </div>
                    <div className="form-group">
                        <label>MATCH RESULT</label>
                        <input type="text" value={commonData["MATCH RESULT"] || ""} onChange={(e) => setCommonField("MATCH RESULT", e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>PKS W-L</label>
                        <DropDownList_db allowCustom options={dropdownOptions.pksWL} value={commonData["PKS W-L"] || ""} onChange={(v) => setCommonField("PKS W-L", v)} placeholder="Select Result" />
                    </div>
                    <div className="form-group">
                        <label>G-AHLY</label>
                        <input type="number" value={commonData["G-AHLY"] || 0} onChange={(e) => setCommonField("G-AHLY", parseInt(e.target.value, 10) || 0)} />
                    </div>
                    <div className="form-group">
                        <label>G-OPPONENT</label>
                        <input type="number" value={commonData["G-OPPONENT"] || 0} onChange={(e) => setCommonField("G-OPPONENT", parseInt(e.target.value, 10) || 0)} />
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
                            ahlyStatusOptions={dropdownOptions.ahlyStatus}
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
                            <div className="portal-icon">🔎</div>
                            <div className="portal-title">ENTER PKS ID</div>
                            <div className="portal-subtitle">
                                Type the Shootout PKS ID to load all linked records for editing
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "center", width: "100%", maxWidth: 520 }}>
                                <SearchBar_db
                                    value={searchId}
                                    onChange={setSearchId}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="PKS ID..."
                                    style={{ flex: 1 }}
                                />
                                <button onClick={handleSearch} disabled={isSearching} className="load-btn" type="button">
                                    {isSearching ? (
                                        <span className="btn-loader-wrap">
                                            <span className="btn-spinner btn-spinner--light" />
                                            Loading...
                                        </span>
                                    ) : "LOAD →"}
                                </button>
                            </div>
                        </div>
                    )}

                    {editingKick && (
                        <div className="bulk-edit-container fade-in">
                            <div className="form-header">
                                <h2 style={{ fontFamily: "Bebas Neue", color: "var(--gold)" }}>
                                    EDITING SHOOTOUT: {commonData.PKS_ID}
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
