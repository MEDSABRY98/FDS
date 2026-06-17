"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AlAhlyService } from "../../Alahly/Service/alahly_db_service";
import { fetchCatalogDisplayNames } from "../../lib/supabase";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import { useNotification } from "../../lib/Notification_db";
import "./alahly_pks_editor.css";

function toDropdownOptions(values = [], currentValue = "") {
    const seen = new Set();
    const options = [];

    const addValue = (raw) => {
        const value = String(raw || "").trim();
        if (!value || seen.has(value)) return;
        seen.add(value);
        options.push({ value, label: value });
    };

    addValue(currentValue);
    values.forEach(addValue);

    return options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

function toDateInputValue(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
}

function loadShootoutFromKicks(kicks, setCommonData, setKickRows, setFoundKicks, setEditingKick) {
    const first = kicks[0];
    setFoundKicks(kicks);
    setCommonData({
        PKS_ID: first.PKS_ID,
        MATCH_ID: first.MATCH_ID,
        DATE: toDateInputValue(first.DATE),
        "PKS SYSTEM": first["PKS SYSTEM"],
        "CHAMPION SYSTEM": first["CHAMPION SYSTEM"],
        CHAMPION: first.CHAMPION,
        SEASON: first.SEASON,
        ROUND: first.ROUND,
        "WHO START?": first["WHO START?"],
        "OPPONENT TEAM": first["OPPONENT TEAM"],
        "AHLY TEAM": first["AHLY TEAM"],
        "MATCH RESULT": first["MATCH RESULT"],
        "PKS W-L": first["PKS W-L"],
        "G-OPPONENT": first["G-OPPONENT"],
        "G-AHLY": first["G-AHLY"]
    });
    setKickRows(kicks.map(k => ({
        "AHLY PLAYER": k["AHLY PLAYER"],
        "AHLY STATUS": k["AHLY STATUS"],
        "HOWMISS AHLY": k["HOWMISS AHLY"],
        "OPPONENT PLAYER": k["OPPONENT PLAYER"],
        "OPPONENT STATUS": k["OPPONENT STATUS"],
        "HOWMISS OPPONENT": k["HOWMISS OPPONENT"],
        "AHLY GK": k["AHLY GK"],
        "OPPONENT GK": k["OPPONENT GK"],
        ORIGINAL_ROW_ID: k.ROW_ID
    })));
    setEditingKick(true);
}

export default function AlAhlyPKsEditor({ pksData, onDataSaved }) {
    const { addNotification } = useNotification();
    const [mode, setMode] = useState("SEARCH"); // SEARCH or CREATE
    const [searchId, setSearchId] = useState("");
    const [foundKicks, setFoundKicks] = useState([]);
    const [editingKick, setEditingKick] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-generate next PKS ID
    const getNextPksId = useCallback(() => {
        if (!pksData || pksData.length === 0) return "PKS-0100";
        const ids = pksData.map(item => {
            const match = String(item.PKS_ID).match(/PKS-(\d+)/i);
            return match ? parseInt(match[1]) : 0;
        });
        const maxId = Math.max(...ids);
        const nextId = maxId + 1;
        return `PKS-${String(nextId).padStart(4, '0')}`;
    }, [pksData]);

    // For CREATE mode: Multi-row management
    const initialCommonData = useMemo(() => ({
        PKS_ID: getNextPksId(),
        MATCH_ID: "",
        DATE: "",
        "PKS SYSTEM": "",
        "CHAMPION SYSTEM": "",
        CHAMPION: "",
        SEASON: "",
        ROUND: "",
        "WHO START?": "",
        "OPPONENT TEAM": "",
        "AHLY TEAM": "الأهلي - مصر",
        "MATCH RESULT": "",
        "PKS W-L": "",
        "G-OPPONENT": 0,
        "G-AHLY": 0
    }), [getNextPksId]);

    const initialKickRow = {
        "AHLY PLAYER": "",
        "AHLY STATUS": "GOAL",
        "HOWMISS AHLY": "",
        "OPPONENT PLAYER": "",
        "OPPONENT STATUS": "GOAL",
        "HOWMISS OPPONENT": "",
        "AHLY GK": "",
        "OPPONENT GK": ""
    };

    const [commonData, setCommonData] = useState({});
    const [kickRows, setKickRows] = useState([initialKickRow]);
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

    // Update commonData when mode switches to CREATE
    useEffect(() => {
        if (mode === "CREATE") {
            setCommonData(initialCommonData);
            setKickRows([initialKickRow]);
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

    // Dropdown option sources — DB catalog fields use db_* tables only; others use PKS history
    const suggestions = useMemo(() => {
        const getUnique = (key) => [...new Set((pksData || []).map(item => item[key]).filter(Boolean))].sort();
        return {
            pksSystem: getUnique("PKS SYSTEM"),
            champSystem: getUnique("CHAMPION SYSTEM"),
            champion: getUnique("CHAMPION"),
            season: getUnique("SEASON"),
            round: getUnique("ROUND"),
            whoStart: getUnique("WHO START?"),
            oppTeam: catalogNames.teams,
            oppPlayer: catalogNames.players,
            oppGK: catalogNames.players,
            ahlyGk: catalogNames.players,
            ahlyPlayer: catalogNames.players,
            ahlyTeam: catalogNames.teams,
            oppStatus: getUnique("OPPONENT STATUS"),
            ahlyStatus: getUnique("AHLY STATUS"),
            pksWL: getUnique("PKS W-L"),
            howMiss: [...new Set([
                ...(pksData || []).map(item => item["HOWMISS AHLY"]),
                ...(pksData || []).map(item => item["HOWMISS OPPONENT"])
            ].filter(Boolean))].sort()
        };
    }, [pksData, catalogNames]);

    const handleSearch = async () => {
        if (!searchId.trim() || isSearching) return;
        setIsSearching(true);
        try {
            let kicks = (pksData || []).filter(k => String(k.PKS_ID).toUpperCase() === searchId.toUpperCase().trim());

            if (kicks.length === 0) {
                kicks = await AlAhlyService.getPKsByPksId(searchId.trim());
            }

            if (kicks.length === 0) {
                setFoundKicks([]);
                setEditingKick(null);
                addNotification("No shootout found with this ID.", "error");
            } else {
                loadShootoutFromKicks(kicks, setCommonData, setKickRows, setFoundKicks, setEditingKick);
            }
        } catch (err) {
            addNotification(err?.message || "Error searching for shootout.", "error");
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddRow = () => {
        scrollToNewKickRef.current = true;
        setKickRows([...kickRows, { ...initialKickRow }]);
    };

    const handleRemoveRow = (index) => {
        setKickRows(kickRows.filter((_, i) => i !== index));
    };

    const handleKickChange = (index, field, value) => {
        const newRows = [...kickRows];
        newRows[index][field] = value;
        setKickRows(newRows);
    };

    const handleSaveShootout = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            const keptOriginalIds = new Set(
                kickRows.map(row => row.ORIGINAL_ROW_ID).filter(Boolean)
            );

            if (editingKick) {
                for (const kick of foundKicks) {
                    if (!keptOriginalIds.has(kick.ROW_ID)) {
                        await AlAhlyService.deletePKSRecord(kick.ROW_ID);
                    }
                }
            }

            const newRows = kickRows.filter(row => !row.ORIGINAL_ROW_ID);
            const allocatedIds = newRows.length > 0
                ? await AlAhlyService.allocatePksRowIds(newRows.length)
                : [];
            let nextNewIdIndex = 0;

            for (const row of kickRows) {
                const { ORIGINAL_ROW_ID, ...kickFields } = row;
                const payload = { ...commonData, ...kickFields };

                if (ORIGINAL_ROW_ID && editingKick) {
                    await AlAhlyService.updatePKSRecord(ORIGINAL_ROW_ID, payload);
                } else {
                    const rowId = allocatedIds[nextNewIdIndex++];
                    await AlAhlyService.createPKSRecord({ ...payload, ROW_ID: rowId });
                }
            }

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

    const renderShootoutBuilder = () => {
        const setCommonField = (field, value) => {
            setCommonData((prev) => ({ ...prev, [field]: value }));
        };

        return (
            <div className="shootout-builder fade-in">
                <div className="builder-section common-info">
                    <div className="section-header">
                        <span className="section-num">01</span>
                        <h3>GENERAL MATCH DETAILS</h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label>PKS ID</label><input type="text" value={commonData.PKS_ID || ""} onChange={(e) => setCommonField("PKS_ID", e.target.value)} /></div>
                        <div className="form-group"><label>MATCH ID</label><input type="text" value={commonData.MATCH_ID || ""} onChange={(e) => setCommonField("MATCH_ID", e.target.value)} /></div>
                        <div className="form-group"><label>DATE</label><input type="date" value={commonData.DATE || ""} onChange={(e) => setCommonField("DATE", e.target.value)} /></div>
                        <div className="form-group">
                            <label>PKS SYSTEM</label>
                            <DropDownList_db allowCustom options={toDropdownOptions(suggestions.pksSystem, commonData["PKS SYSTEM"])} value={commonData["PKS SYSTEM"] || ""} onChange={(v) => setCommonField("PKS SYSTEM", v)} placeholder="Select PKS System" searchable />
                        </div>
                        <div className="form-group">
                            <label>CHAMPION SYSTEM</label>
                            <DropDownList_db allowCustom options={toDropdownOptions(suggestions.champSystem, commonData["CHAMPION SYSTEM"])} value={commonData["CHAMPION SYSTEM"] || ""} onChange={(v) => setCommonField("CHAMPION SYSTEM", v)} placeholder="Select Champion System" searchable />
                        </div>
                        <div className="form-group">
                            <label>CHAMPION</label>
                            <DropDownList_db allowCustom options={toDropdownOptions(suggestions.champion, commonData.CHAMPION)} value={commonData.CHAMPION || ""} onChange={(v) => setCommonField("CHAMPION", v)} placeholder="Select Champion" searchable />
                        </div>
                        <div className="form-group">
                            <label>SEASON</label>
                            <DropDownList_db allowCustom options={toDropdownOptions(suggestions.season, commonData.SEASON)} value={commonData.SEASON || ""} onChange={(v) => setCommonField("SEASON", v)} placeholder="Select Season" searchable />
                        </div>
                        <div className="form-group">
                            <label>ROUND</label>
                            <DropDownList_db allowCustom options={toDropdownOptions(suggestions.round, commonData.ROUND)} value={commonData.ROUND || ""} onChange={(v) => setCommonField("ROUND", v)} placeholder="Select Round" searchable />
                        </div>
                        <div className="form-group">
                            <label>WHO START?</label>
                            <DropDownList_db allowCustom options={toDropdownOptions(suggestions.whoStart, commonData["WHO START?"])} value={commonData["WHO START?"] || ""} onChange={(v) => setCommonField("WHO START?", v)} placeholder="Who starts?" />
                        </div>
                        <div className="form-group">
                            <label>AHLY TEAM</label>
                            <DropDownList_db options={toDropdownOptions(suggestions.ahlyTeam, commonData["AHLY TEAM"])} value={commonData["AHLY TEAM"] || ""} onChange={(v) => setCommonField("AHLY TEAM", v)} placeholder="Select Ahly Team" searchable />
                        </div>
                        <div className="form-group">
                            <label>OPPONENT TEAM</label>
                            <DropDownList_db options={toDropdownOptions(suggestions.oppTeam, commonData["OPPONENT TEAM"])} value={commonData["OPPONENT TEAM"] || ""} onChange={(v) => setCommonField("OPPONENT TEAM", v)} placeholder="Select Opponent Team" searchable />
                        </div>
                        <div className="form-group"><label>MATCH RESULT</label><input type="text" value={commonData["MATCH RESULT"] || ""} onChange={(e) => setCommonField("MATCH RESULT", e.target.value)} /></div>
                        <div className="form-group">
                            <label>PKS W-L</label>
                            <DropDownList_db allowCustom options={toDropdownOptions(suggestions.pksWL, commonData["PKS W-L"])} value={commonData["PKS W-L"] || ""} onChange={(v) => setCommonField("PKS W-L", v)} placeholder="Select Result" />
                        </div>
                        <div className="form-group"><label>G-AHLY</label><input type="number" value={commonData["G-AHLY"] || 0} onChange={(e) => setCommonField("G-AHLY", parseInt(e.target.value, 10) || 0)} /></div>
                        <div className="form-group"><label>G-OPPONENT</label><input type="number" value={commonData["G-OPPONENT"] || 0} onChange={(e) => setCommonField("G-OPPONENT", parseInt(e.target.value, 10) || 0)} /></div>
                    </div>
                </div>

                <div className="builder-section kicks-info">
                    <div className="section-header">
                        <span className="section-num">02</span>
                        <h3>KICKS & PLAYERS</h3>
                    </div>
                    
                    <div className="kicks-list">
                        {kickRows.map((row, idx) => (
                            <div key={idx} className="builder-row-box">
                                <div className="row-title">
                                    <span>KICK {idx + 1}</span>
                                    {kickRows.length > 1 && <button className="remove-row-btn" onClick={() => handleRemoveRow(idx)}>REMOVE</button>}
                                </div>
                                <div className="builder-grid-compact">
                                    <div className="side-box ahly-side">
                                        <label>AL AHLY KICKER</label>
                                        <DropDownList_db className="pks-dropdown-compact" options={toDropdownOptions(suggestions.ahlyPlayer, row["AHLY PLAYER"])} value={row["AHLY PLAYER"] || ""} onChange={(v) => handleKickChange(idx, "AHLY PLAYER", v)} placeholder="Player Name" searchable />
                                        <DropDownList_db allowCustom className="pks-dropdown-compact" options={toDropdownOptions(suggestions.ahlyStatus, row["AHLY STATUS"])} value={row["AHLY STATUS"] || ""} onChange={(v) => handleKickChange(idx, "AHLY STATUS", v)} placeholder="Status" />
                                        <DropDownList_db allowCustom className="pks-dropdown-compact" options={toDropdownOptions(suggestions.howMiss, row["HOWMISS AHLY"])} value={row["HOWMISS AHLY"] || ""} onChange={(v) => handleKickChange(idx, "HOWMISS AHLY", v)} placeholder="How Missed?" searchable />
                                        <DropDownList_db className="pks-dropdown-compact" options={toDropdownOptions(suggestions.oppGK, row["OPPONENT GK"])} value={row["OPPONENT GK"] || ""} onChange={(v) => handleKickChange(idx, "OPPONENT GK", v)} placeholder="Opponent GK" searchable />
                                    </div>
                                    <div className="side-box opp-side">
                                        <label>OPPONENT KICKER</label>
                                        <DropDownList_db className="pks-dropdown-compact" options={toDropdownOptions(suggestions.oppPlayer, row["OPPONENT PLAYER"])} value={row["OPPONENT PLAYER"] || ""} onChange={(v) => handleKickChange(idx, "OPPONENT PLAYER", v)} placeholder="Player Name" searchable />
                                        <DropDownList_db allowCustom className="pks-dropdown-compact" options={toDropdownOptions(suggestions.oppStatus, row["OPPONENT STATUS"])} value={row["OPPONENT STATUS"] || ""} onChange={(v) => handleKickChange(idx, "OPPONENT STATUS", v)} placeholder="Status" />
                                        <DropDownList_db allowCustom className="pks-dropdown-compact" options={toDropdownOptions(suggestions.howMiss, row["HOWMISS OPPONENT"])} value={row["HOWMISS OPPONENT"] || ""} onChange={(v) => handleKickChange(idx, "HOWMISS OPPONENT", v)} placeholder="How Missed?" searchable />
                                        <DropDownList_db className="pks-dropdown-compact" options={toDropdownOptions(suggestions.ahlyGk, row["AHLY GK"])} value={row["AHLY GK"] || ""} onChange={(v) => handleKickChange(idx, "AHLY GK", v)} placeholder="Ahly GK" searchable />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button className="add-row-btn-lux" onClick={handleAddRow}>+ ADD ANOTHER KICK</button>
                </div>

                <div className="builder-actions">
                    <button className="save-all-btn" onClick={handleSaveShootout} disabled={isSaving}>
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
    };

    return (
        <div className="pks-editor-container fade-in">
            {/* ── Header ── */}
            <div className="mode-switch-wrap">
                <div className="mode-switch">
                    <button
                        type="button"
                        onClick={() => { setMode('SEARCH'); setEditingKick(null); setFoundKicks([]); }}
                        className={`mode-switch-btn ${(mode === 'SEARCH' || editingKick) ? 'active' : ''}`}
                    >
                        SEARCH PKS
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('CREATE'); setEditingKick(null); setCommonData(initialCommonData); setKickRows([initialKickRow]); }}
                        className={`mode-switch-btn ${mode === 'CREATE' && !editingKick ? 'active' : ''}`}
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
                            <div className="portal-title">
                                ENTER PKS ID
                            </div>
                            <div className="portal-subtitle">
                                Type the Shootout PKS ID to load all linked records for editing
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', width: '100%', maxWidth: 520 }}>
                                <SearchBar_db
                                    value={searchId}
                                    onChange={setSearchId}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder="PKS ID..."
                                    style={{ flex: 1 }}
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="load-btn">
                                    {isSearching ? (
                                        <span className="btn-loader-wrap">
                                            <span className="btn-spinner btn-spinner--light" />
                                            Loading...
                                        </span>
                                    ) : 'LOAD →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {editingKick && (
                        <div className="bulk-edit-container fade-in">
                            <div className="form-header">
                                <h2 style={{ fontFamily: 'Bebas Neue', color: 'var(--gold)' }}>EDITING SHOOTOUT: {commonData.PKS_ID}</h2>
                                <button type="button" className="cancel-btn" onClick={() => { setEditingKick(null); setFoundKicks([]); }}>EXIT EDIT</button>
                            </div>
                            {/* Render the same builder UI but for editing */}
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


