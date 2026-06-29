"use client";

import { useState, useCallback, useEffect } from "react";
import "./egypt_nt_db_editor.css";
import {
    supabase,
    AutocompleteInput,
    fetchCatalogDisplayNames,
    applyLineupLogic,
    buildEgyptNtMatchId,
    fetchMatchIdExists,
    normalizeMatchId,
} from "../../Database";
import Login_db from "../../lib/Login_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { useNotification } from "../../lib/Notification_db";
import {
    EMPTY_MATCH,
    EMPTY_LINEUP,
    EGYPT_NT_MATCH_LINKED_TABLES,
    AUTOCOMPLETE_FIELDS,
} from "./egypt_nt_db_editor_constants";
import { sortRowsByEventId, findRowIndexInList } from "./egypt_nt_db_editor_event_utils";
import {
    getDefaultEgyptTeamLabel,
    getOpponentTeamLabel,
    applyMatchTeamsToEgyptLineupRows,
    splitLineupRowsByTeam,
    normalizeSavedTeamLineup,
} from "./egypt_nt_db_editor_lineup_utils";
import {
    prepareMatchDetailsPayload,
    persistLinkedTableRows,
    insertStagedLinkedTableRows,
} from "./egypt_nt_db_editor_save_utils";
import PlayerEventsPanel from "./egypt_nt_db_editor_events_panel";
import GkDetailsPanel from "./egypt_nt_db_editor_gks_panel";
import LineupPanel from "./egypt_nt_db_editor_lineup_panel";

export default function EgyptNTEditor() {
    const [searchId, setSearchId] = useState('');
    const [matchData, setMatchData] = useState(null);
    const [egyLineupRows, setEgyLineupRows] = useState([]);
    const [oppLineupRows, setOppLineupRows] = useState([]);
    const [playerRows, setPlayerRows] = useState([]);
    const [gkRows, setGkRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState('search');
    const { addNotification } = useNotification();
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmDeleteMatch, setConfirmDeleteMatch] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newMatchData, setNewMatchData] = useState({ ...EMPTY_MATCH });
    const [activeLinkedTab, setActiveLinkedTab] = useState('lineup_egy');
    const [newEgyLineupRows, setNewEgyLineupRows] = useState([]);
    const [newOppLineupRows, setNewOppLineupRows] = useState([]);
    const [newPlayerRows, setNewPlayerRows] = useState([]);
    const [newGkRows, setNewGkRows] = useState([]);
    const [matchFieldOptions, setMatchFieldOptions] = useState({});
    const [allPlayersList, setAllPlayersList] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [eventSubTypes, setEventSubTypes] = useState([]);
    const [catalogLists, setCatalogLists] = useState({ managers: [], stadiums: [], referees: [] });
    const [allTeamsList, setAllTeamsList] = useState([]);

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

    const loadMatchIntoEditor = useCallback(async (id) => {
        const [{ data: md }, { data: ld }, { data: pd }, { data: gd }] = await Promise.all([
            supabase.from('egy_NT_MATCHDETAILS').select('*').eq('MATCH_ID', id).maybeSingle(),
            supabase.from('egy_NT_LINEUPDETAILS').select('*').eq('MATCH_ID', id),
            supabase.from('egy_NT_PLAYERDETAILS').select('*').eq('MATCH_ID', id),
            supabase.from('egy_NT_GKSDETAILS').select('*').eq('MATCH_ID', id),
        ]);
        if (!md) {
            addNotification(`Match ID "${id}" not found`, 'error');
            return false;
        }
        setMatchData({ ...md });
        if (!ld || ld.length === 0) {
            const egyNorm = normalizeSavedTeamLineup([], id, getDefaultEgyptTeamLabel(md));
            const oppNorm = normalizeSavedTeamLineup([], id, getOpponentTeamLabel(md));
            setEgyLineupRows(applyLineupLogic(egyNorm, egyNorm));
            setOppLineupRows(applyLineupLogic(oppNorm, oppNorm));
        } else {
            const { egy, opp } = splitLineupRowsByTeam(ld, md);
            const egyNorm = normalizeSavedTeamLineup(egy, id, getDefaultEgyptTeamLabel(md));
            const oppNorm = normalizeSavedTeamLineup(opp, id, getOpponentTeamLabel(md));
            setEgyLineupRows(applyLineupLogic(egyNorm, egyNorm));
            setOppLineupRows(applyLineupLogic(oppNorm, oppNorm));
        }
        setPlayerRows(sortRowsByEventId((pd || []).map((r, i) => ({ ...r, _key: r._key ?? 1000 + i }))));
        setGkRows(sortRowsByEventId((gd || []).map((r, i) => ({ ...r, _key: r._key ?? 2000 + i }))));
        setMode('edit');
        return true;
    }, [addNotification]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const querySearchId = params.get("searchId");
        if (!querySearchId) return;

        setSearchId(querySearchId);
        setLoading(true);
        loadMatchIntoEditor(querySearchId)
            .catch((e) => addNotification('Error: ' + e.message, 'error'))
            .finally(() => setLoading(false));
    }, [loadMatchIntoEditor, addNotification]);

    useEffect(() => {
        if (mode !== 'new') return;
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
                    opts[col] = [...new Set(allMatchData.map(r => r[col]).filter(Boolean))].sort();
                }
            });
            setMatchFieldOptions(opts);
        })();
    }, [mode, catalogLists]);

    useEffect(() => {
        if (mode !== 'new') return;
        const suggested = buildEgyptNtMatchId({
            age: newMatchData.AGE,
            egyptTeam: newMatchData["Egypt TEAM"],
            opponent: newMatchData["OPPONENT TEAM"],
            date: newMatchData.DATE,
        });
        setNewMatchData(prev => (prev.MATCH_ID === suggested ? prev : { ...prev, MATCH_ID: suggested }));
    }, [newMatchData.AGE, newMatchData["Egypt TEAM"], newMatchData["OPPONENT TEAM"], newMatchData.DATE, mode]);

    const handleNewEgyLineupRows = useCallback((action) => setNewEgyLineupRows(p => applyLineupLogic(p, action)), []);
    const handleNewOppLineupRows = useCallback((action) => setNewOppLineupRows(p => applyLineupLogic(p, action)), []);
    const handleEditEgyLineupRows = useCallback((action) => setEgyLineupRows(p => applyLineupLogic(p, action)), []);
    const handleEditOppLineupRows = useCallback((action) => setOppLineupRows(p => applyLineupLogic(p, action)), []);

    useEffect(() => {
        if (mode !== 'new') return;
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
            "TEAM": getOpponentTeamLabel(newMatchData),
            "STATU": i < 11 ? "اساسي" : "احتياطي",
            "TOTAL MINUTE": i < 11 ? "90" : "",
            MATCH_ID: newMatchData.MATCH_ID || '',
            _isNew: true,
            _key: Date.now() + 100 + i
        }));
        handleNewEgyLineupRows(initialEgyLineup);
        handleNewOppLineupRows(initialOppLineup);
    }, [mode]);

    useEffect(() => {
        if (mode !== 'new') return;
        setNewEgyLineupRows(prev => prev.map(r => ({ ...r, MATCH_ID: newMatchData.MATCH_ID || '' })));
        setNewOppLineupRows(prev => prev.map(r => ({ ...r, MATCH_ID: newMatchData.MATCH_ID || '' })));
    }, [newMatchData.MATCH_ID, mode]);

    const addToast = (msg, type = 'success') => {
        addNotification(msg, type);
    };

    const handleStagedDelete = useCallback((row, ri, _tableName, setterFn) => {
        setterFn?.((prev) => {
            const idx = findRowIndexInList(prev, row, ri);
            return prev.filter((_, i) => i !== idx);
        });
    }, []);

    const handleSearch = async () => {
        const id = searchId.trim();
        if (!id) return;
        setLoading(true);
        try {
            await loadMatchIntoEditor(id);
        } catch (e) {
            addToast('Error: ' + e.message, 'error');
        }
        setLoading(false);
    };

    const handleDeleteRow = useCallback((row, ri, tableName, setterFn) => {
        setConfirmDelete({ row, ri, tableName, setterFn });
    }, []);

    const executeDeleteRow = useCallback(async () => {
        if (!confirmDelete) return;
        const { row, ri, tableName, setterFn } = confirmDelete;
        setConfirmDelete(null);

        const setterMap = {
            egy_NT_PLAYERDETAILS: setPlayerRows,
            egy_NT_GKSDETAILS: setGkRows,
        };
        const applyRemove = (prev) => {
            const idx = findRowIndexInList(prev, row, ri);
            return prev.filter((_, i) => i !== idx);
        };

        if (row._isNew) {
            (setterFn || setterMap[tableName])?.(applyRemove);
            return;
        }

        if (!row.ROW_ID) {
            (setterFn || setterMap[tableName])?.(applyRemove);
            return;
        }

        try {
            const { error: delErr } = await supabase.from(tableName).delete().eq("ROW_ID", row.ROW_ID);
            if (delErr) throw delErr;
            (setterFn || setterMap[tableName])?.(applyRemove);
            addToast("Row deleted ✓", "warn");
        } catch (e) {
            addToast("Delete failed: " + e.message, "error");
        }
    }, [confirmDelete]);

    const executeDeleteMatch = async () => {
        const mid = normalizeMatchId(matchData?.MATCH_ID);
        if (!mid || isDeleting) return;

        setConfirmDeleteMatch(false);
        setIsDeleting(true);

        try {
            for (const tableName of EGYPT_NT_MATCH_LINKED_TABLES) {
                const { error } = await supabase.from(tableName).delete().eq("MATCH_ID", mid);
                if (error) throw new Error(`${tableName}: ${error.message}`);
            }

            const { error: matchErr } = await supabase.from("egy_NT_MATCHDETAILS").delete().eq("MATCH_ID", mid);
            if (matchErr) throw new Error(`egy_NT_MATCHDETAILS: ${matchErr.message}`);

            setMatchData(null);
            setEgyLineupRows([]);
            setOppLineupRows([]);
            setPlayerRows([]);
            setGkRows([]);
            setSearchId("");
            setMode("search");
            addToast(`Match "${mid}" deleted from all tables ✓`, "warn");
        } catch (e) {
            console.error("Delete Match Error:", e);
            addNotification(`Failed to delete match.\n${e.message}`, "error");
            addToast("Delete failed: " + e.message, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveMatch = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const matchId = matchData.MATCH_ID;
        const matchPayload = prepareMatchDetailsPayload(matchData);
        const { syncedEgy, syncedOpp } = applyMatchTeamsToEgyptLineupRows(egyLineupRows, oppLineupRows, matchData);
        setEgyLineupRows(syncedEgy);
        setOppLineupRows(syncedOpp);

        try {
            const nextEgy = await persistLinkedTableRows("egy_NT_LINEUPDETAILS", syncedEgy, matchId);
            const nextOpp = await persistLinkedTableRows("egy_NT_LINEUPDETAILS", syncedOpp, matchId);
            const nextPlayers = await persistLinkedTableRows("egy_NT_PLAYERDETAILS", playerRows, matchId);
            const nextGks = await persistLinkedTableRows("egy_NT_GKSDETAILS", gkRows, matchId);

            const { error: matchErr } = await supabase.from("egy_NT_MATCHDETAILS").upsert(matchPayload);
            if (matchErr) throw new Error(`egy_NT_MATCHDETAILS: ${matchErr.message}`);

            setEgyLineupRows(nextEgy);
            setOppLineupRows(nextOpp);
            setPlayerRows(nextPlayers);
            setGkRows(nextGks);
            setMatchData({ ...matchData, ...matchPayload });

            addToast("Match and all pending records saved ✓");
        } catch (e) {
            console.error("Global Save Error:", e);
            addNotification(`Save failed — match details were not updated.\n${e.message}`, "error");
            addToast("Save Failed: " + e.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateMatch = async () => {
        const mid = normalizeMatchId(newMatchData.MATCH_ID);
        if (!mid) { addToast('MATCH_ID is required', 'error'); return; }

        setIsSaving(true);
        let matchInserted = false;

        try {
            const exists = await fetchMatchIdExists(supabase, 'egy_NT_MATCHDETAILS', mid);
            if (exists) {
                addNotification(`Cannot create match: MATCH_ID "${mid}" already exists in the database.`, "error");
                addToast(`MATCH_ID "${mid}" already exists`, 'error');
                return;
            }

            const { syncedEgy, syncedOpp } = applyMatchTeamsToEgyptLineupRows(newEgyLineupRows, newOppLineupRows, newMatchData);
            setNewEgyLineupRows(syncedEgy);
            setNewOppLineupRows(syncedOpp);

            const matchPayload = prepareMatchDetailsPayload({ ...newMatchData, MATCH_ID: mid });
            const { error: matchErr } = await supabase.from('egy_NT_MATCHDETAILS').insert(matchPayload);
            if (matchErr) throw new Error(`egy_NT_MATCHDETAILS: ${matchErr.message}`);
            matchInserted = true;

            await insertStagedLinkedTableRows('egy_NT_LINEUPDETAILS', [...syncedEgy, ...syncedOpp], mid);
            await insertStagedLinkedTableRows('egy_NT_PLAYERDETAILS', newPlayerRows, mid);
            await insertStagedLinkedTableRows('egy_NT_GKSDETAILS', newGkRows, mid);

            addToast('Match + all linked data created ✓');
            setSearchId(mid);
            setNewEgyLineupRows([]);
            setNewOppLineupRows([]);
            setNewPlayerRows([]);
            setNewGkRows([]);
            setMode('search');
            setTimeout(() => handleSearch(), 400);
        } catch (e) {
            console.error("Create Match Error:", e);
            if (matchInserted) {
                await supabase.from('egy_NT_MATCHDETAILS').delete().eq('MATCH_ID', mid);
            }
            addNotification(`Failed to create match — nothing was kept in the database.\n${e.message}`, "error");
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
                persistToDb={false}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isSaving}
            />
        );
    };

    const renderPlayerEventsPanel = ({ formData, isNew }) => {
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;
        const teamOptions = [getDefaultEgyptTeamLabel(formData), formData["OPPONENT TEAM"]].filter(Boolean);
        return (
            <PlayerEventsPanel
                title="PLAYER EVENTS"
                color="#8b5cf6"
                rows={isNew ? newPlayerRows : playerRows}
                setRows={isNew ? setNewPlayerRows : setPlayerRows}
                matchId={matchId}
                teamOptions={teamOptions}
                allPlayersList={allPlayersList}
                allTeamsList={allTeamsList}
                eventTypes={eventTypes}
                eventSubTypes={eventSubTypes}
                gkPlayerOptions={allPlayersList}
                persistToDb={false}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isSaving}
            />
        );
    };

    const renderGkDetailsPanel = ({ formData, isNew }) => {
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;
        const teamOptions = [getDefaultEgyptTeamLabel(formData), formData["OPPONENT TEAM"]].filter(Boolean);
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
                persistToDb={false}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isSaving}
            />
        );
    };

    const renderMotmPanel = (formData, setFormData) => (
        <div style={{ padding: '20px', background: '#fafafa', borderRadius: '20px', border: '1px solid #eee', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 24 }}>🏆</span>
                <h3 style={{ margin: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: '#0a0a0a' }}>
                    MAN OF THE MATCH
                </h3>
            </div>
            <div className="field-label">SELECT MOTM PLAYER</div>
            <AutocompleteInput
                value={formData.MOTM ?? ''}
                options={allPlayersList}
                placeholder="Search player name..."
                onChange={val => setFormData(prev => ({ ...prev, MOTM: val }))}
                className="field-input"
                accentColor="#C8102E"
                style={{ width: '100%', height: '40px', fontSize: '14px', background: '#fff' }}
            />
            <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
                * This searchable dropdown suggests all players in the system. Search and select the Man of the Match winner.
            </p>
        </div>
    );

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="editor-container">
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
                                teamName: getOpponentTeamLabel(newMatchData),
                            })}
                            {activeLinkedTab === 'events' && renderPlayerEventsPanel({ formData: newMatchData, isNew: true })}
                            {activeLinkedTab === 'gks' && renderGkDetailsPanel({ formData: newMatchData, isNew: true })}
                            {activeLinkedTab === 'motm' && renderMotmPanel(newMatchData, setNewMatchData)}
                        </div>
                    </>
                )}

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
                                    <button
                                        onClick={() => setConfirmDeleteMatch(true)}
                                        disabled={isSaving || isDeleting}
                                        title="Delete match and all linked records"
                                        className="delete-match-btn"
                                    >
                                        {isDeleting ? '⏳' : '🗑️'}
                                    </button>
                                    <button onClick={handleSaveMatch} disabled={isSaving || isDeleting} title="Save match" className="save-match-btn">{isSaving ? '⏳' : '💾'}</button>
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
                                teamName: getOpponentTeamLabel(matchData),
                            })}
                            {activeLinkedTab === 'events' && renderPlayerEventsPanel({ formData: matchData, isNew: false })}
                            {activeLinkedTab === 'gks' && renderGkDetailsPanel({ formData: matchData, isNew: false })}
                            {activeLinkedTab === 'motm' && renderMotmPanel(matchData, setMatchData)}
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
                            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setConfirmDelete(null)}>
                                CANCEL
                            </button>
                            <button type="button" className="confirm-modal-btn confirm-modal-btn-delete" onClick={executeDeleteRow}>
                                DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDeleteMatch && matchData && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-box">
                        <div className="confirm-modal-icon">🗑️</div>
                        <div className="confirm-modal-title">Delete Match?</div>
                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-modal-btn confirm-modal-btn-cancel"
                                onClick={() => setConfirmDeleteMatch(false)}
                                disabled={isDeleting}
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="confirm-modal-btn confirm-modal-btn-delete"
                                onClick={executeDeleteMatch}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "DELETING..." : "DELETE"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Login_db>
    );
}
