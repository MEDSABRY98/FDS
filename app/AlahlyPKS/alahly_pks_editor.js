"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlAhlyService } from "../Alahly/alahly_db_service";
import SearchBar_db from "../lib/SearchBar_db";
import "./alahly_pks_editor.css";

export default function AlAhlyPKsEditor({ pksData }) {
    const [mode, setMode] = useState("SEARCH"); // SEARCH or CREATE
    const [searchId, setSearchId] = useState("");
    const [foundKicks, setFoundKicks] = useState([]);
    const [editingKick, setEditingKick] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

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
        "AHLY TEAM": "الأهلي",
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

    // Update commonData when mode switches to CREATE
    useEffect(() => {
        if (mode === "CREATE") {
            setCommonData(initialCommonData);
            setKickRows([initialKickRow]);
        }
    }, [mode, initialCommonData]);
    const [editFormData, setEditFormData] = useState({});

    // Generate unique suggestions for datalists
    const suggestions = useMemo(() => {
        const getUnique = (key) => [...new Set((pksData || []).map(item => item[key]).filter(Boolean))].sort();
        return {
            pksSystem: getUnique("PKS SYSTEM"),
            champSystem: getUnique("CHAMPION SYSTEM"),
            champion: getUnique("CHAMPION"),
            season: getUnique("SEASON"),
            round: getUnique("ROUND"),
            whoStart: getUnique("WHO START?"),
            oppTeam: getUnique("OPPONENT TEAM"),
            oppPlayer: getUnique("OPPONENT PLAYER"),
            oppGK: getUnique("OPPONENT GK"),
            ahlyGk: getUnique("AHLY GK"),
            ahlyPlayer: getUnique("AHLY PLAYER"),
            oppStatus: getUnique("OPPONENT STATUS"),
            ahlyStatus: getUnique("AHLY STATUS"),
            pksWL: getUnique("PKS W-L"),
            howMiss: [...new Set([
                ...(pksData || []).map(item => item["HOWMISS AHLY"]),
                ...(pksData || []).map(item => item["HOWMISS OPPONENT"])
            ].filter(Boolean))].sort()
        };
    }, [pksData]);

    const handleSearch = async () => {
        if (!searchId.trim()) return;
        setLoading(true);
        setMessage({ text: "", type: "" });
        try {
            const kicks = (pksData || []).filter(k => String(k.PKS_ID).toUpperCase() === searchId.toUpperCase().trim());
            setFoundKicks(kicks);
            if (kicks.length === 0) {
                setMessage({ text: "No shootout found with this ID.", type: "error" });
            } else {
                // Auto-load into builder for bulk edit
                const first = kicks[0];
                setCommonData({
                    PKS_ID: first.PKS_ID,
                    MATCH_ID: first.MATCH_ID,
                    DATE: first.DATE,
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
        } catch (err) {
            setMessage({ text: "Error searching for shootout.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
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
        setLoading(true);
        setMessage({ text: "Saving Shootout...", type: "info" });
        try {
            if (editingKick) {
                for (const k of foundKicks) {
                    await AlAhlyService.deletePKSRecord(k.ROW_ID);
                }
            }

            const finalRecords = kickRows.map(row => ({
                ...commonData,
                ...row,
                ROW_ID: row.ORIGINAL_ROW_ID || ("R-" + Math.floor(Math.random() * 100000) + Date.now().toString().slice(-4))
            }));

            for (const rec of finalRecords) {
                const { ORIGINAL_ROW_ID, ...cleanRec } = rec;
                await AlAhlyService.createPKSRecord(cleanRec);
            }

            setMessage({ text: `Success! Saved shootout ${commonData.PKS_ID}`, type: "success" });
            setEditingKick(null);
            setMode("SEARCH");
            setSearchId("");
        } catch (err) {
            setMessage({ text: "Failed to save shootout records.", type: "error" });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderShootoutBuilder = () => {
        return (
            <div className="shootout-builder fade-in">
                <div className="builder-section common-info">
                    <div className="section-header">
                        <span className="section-num">01</span>
                        <h3>GENERAL MATCH DETAILS</h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label>PKS ID</label><input type="text" value={commonData.PKS_ID || ""} onChange={(e) => setCommonData({...commonData, PKS_ID: e.target.value})} /></div>
                        <div className="form-group"><label>MATCH ID</label><input type="text" value={commonData.MATCH_ID || ""} onChange={(e) => setCommonData({...commonData, MATCH_ID: e.target.value})} /></div>
                        <div className="form-group"><label>DATE</label><input type="date" value={commonData.DATE || ""} onChange={(e) => setCommonData({...commonData, DATE: e.target.value})} /></div>
                        <div className="form-group"><label>CHAMPION</label><input list="list-champion" value={commonData.CHAMPION || ""} onChange={(e) => setCommonData({...commonData, CHAMPION: e.target.value})} /></div>
                        <div className="form-group"><label>SEASON</label><input list="list-season" value={commonData.SEASON || ""} onChange={(e) => setCommonData({...commonData, SEASON: e.target.value})} /></div>
                        <div className="form-group"><label>ROUND</label><input list="list-round" value={commonData.ROUND || ""} onChange={(e) => setCommonData({...commonData, ROUND: e.target.value})} /></div>
                        <div className="form-group"><label>WHO START?</label><input list="list-who-start" value={commonData["WHO START?"] || ""} onChange={(e) => setCommonData({...commonData, "WHO START?": e.target.value})} /></div>
                        <div className="form-group"><label>OPPONENT TEAM</label><input list="list-opp-team" value={commonData["OPPONENT TEAM"] || ""} onChange={(e) => setCommonData({...commonData, "OPPONENT TEAM": e.target.value})} /></div>
                        <div className="form-group"><label>PKS W-L</label><input list="list-pks-wl" value={commonData["PKS W-L"] || ""} onChange={(e) => setCommonData({...commonData, "PKS W-L": e.target.value})} /></div>
                        <div className="form-group"><label>G-AHLY</label><input type="number" value={commonData["G-AHLY"] || 0} onChange={(e) => setCommonData({...commonData, "G-AHLY": parseInt(e.target.value) || 0})} /></div>
                        <div className="form-group"><label>G-OPPONENT</label><input type="number" value={commonData["G-OPPONENT"] || 0} onChange={(e) => setCommonData({...commonData, "G-OPPONENT": parseInt(e.target.value) || 0})} /></div>
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
                                        <input list="list-ahly-player" placeholder="Player Name" value={row["AHLY PLAYER"] || ""} onChange={(e) => handleKickChange(idx, "AHLY PLAYER", e.target.value)} />
                                        <input list="list-ahly-status" placeholder="Status" value={row["AHLY STATUS"] || ""} onChange={(e) => handleKickChange(idx, "AHLY STATUS", e.target.value)} />
                                        <input list="list-how-miss" placeholder="How Missed?" value={row["HOWMISS AHLY"] || ""} onChange={(e) => handleKickChange(idx, "HOWMISS AHLY", e.target.value)} />
                                        <input list="list-opp-gk" placeholder="Opponent GK" value={row["OPPONENT GK"] || ""} onChange={(e) => handleKickChange(idx, "OPPONENT GK", e.target.value)} />
                                    </div>
                                    <div className="side-box opp-side">
                                        <label>OPPONENT KICKER</label>
                                        <input list="list-opp-player" placeholder="Player Name" value={row["OPPONENT PLAYER"] || ""} onChange={(e) => handleKickChange(idx, "OPPONENT PLAYER", e.target.value)} />
                                        <input list="list-opp-status" placeholder="Status" value={row["OPPONENT STATUS"] || ""} onChange={(e) => handleKickChange(idx, "OPPONENT STATUS", e.target.value)} />
                                        <input list="list-how-miss" placeholder="How Missed?" value={row["HOWMISS OPPONENT"] || ""} onChange={(e) => handleKickChange(idx, "HOWMISS OPPONENT", e.target.value)} />
                                        <input list="list-ahly-gk" placeholder="Ahly GK" value={row["AHLY GK"] || ""} onChange={(e) => handleKickChange(idx, "AHLY GK", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button className="add-row-btn-lux" onClick={handleAddRow}>+ ADD ANOTHER KICK</button>
                </div>

                <div className="builder-actions">
                    <button className="save-all-btn" onClick={handleSaveShootout} disabled={loading}>
                        {editingKick ? `UPDATE SHOOTOUT (${kickRows.length} KICKS)` : `SAVE SHOOTOUT (${kickRows.length} KICKS)`}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="pks-editor-container fade-in">
            <datalist id="list-pks-system">{suggestions.pksSystem.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-champ-system">{suggestions.champSystem.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-champion">{suggestions.champion.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-season">{suggestions.season.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-round">{suggestions.round.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-who-start">{suggestions.whoStart.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-opp-team">{suggestions.oppTeam.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-opp-player">{suggestions.oppPlayer.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-opp-gk">{suggestions.oppGK.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-ahly-gk">{suggestions.ahlyGk.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-ahly-player">{suggestions.ahlyPlayer.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-how-miss">{suggestions.howMiss.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-opp-status">{suggestions.oppStatus.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-ahly-status">{suggestions.ahlyStatus.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="list-pks-wl">{suggestions.pksWL.map(v => <option key={v} value={v} />)}</datalist>

            <div className="editor-header">
                <h1 className="editor-title">AL AHLY <span className="gold-text">PKS EDITOR</span></h1>
                <div className="editor-tabs">
                    <button className={`editor-tab-btn ${mode === "SEARCH" && !editingKick ? "active" : ""}`} onClick={() => { setMode("SEARCH"); setEditingKick(null); setFoundKicks([]); setMessage({text:"", type:""}); }}>SEARCH</button>
                    <button className={`editor-tab-btn ${mode === "CREATE" || (mode === "SEARCH" && editingKick) ? "active" : ""}`} onClick={() => { setMode("CREATE"); setEditingKick(null); setCommonData(initialCommonData); setKickRows([initialKickRow]); setMessage({text:"", type:""}); }}>CREATE & EDIT</button>
                </div>
            </div>

            {message.text && (
                <div className={`editor-message ${message.type}`}>{message.text}</div>
            )}

            {mode === "SEARCH" && (
                <div className="search-section">
                    {!editingKick && (
                        <div className="search-input-group" style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ flex: 1 }}>
                                <SearchBar_db
                                    value={searchId}
                                    onChange={setSearchId}
                                    placeholder="Enter PKS ID..."
                                />
                            </div>
                            <button 
                                onClick={handleSearch} 
                                disabled={loading}
                                style={{
                                    height: '52px',
                                    padding: '0 30px',
                                    background: 'var(--gold)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontFamily: 'Bebas Neue',
                                    fontSize: '20px',
                                    letterSpacing: '2px',
                                    cursor: 'pointer',
                                    transition: '0.3s'
                                }}
                            >
                                SEARCH
                            </button>
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


