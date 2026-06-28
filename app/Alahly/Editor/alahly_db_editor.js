"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import "./alahly_db_editor.css";
import {
    supabase,
    AutocompleteInput,
    fetchCatalogDisplayNames,
    applyLineupLogic,
    buildOpponentDateMatchId,
    fetchMatchIdExists,
    normalizeMatchId,
} from "../../Database";
import Login_db from "../../lib/Login_db";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { useNotification } from "../../lib/Notification_db";
import { normalizeHowPenMissedRowForEditor } from "../Penalties/alahly_db_penalties_utils";
import {
    EMPTY_MATCH,
    ALAHLY_MATCH_LINKED_TABLES,
    AUTOCOMPLETE_FIELDS,
    isFinalRound,
} from "./alahly_db_editor_constants";
import { sortRowsByEventId, findRowIndexInList } from "./alahly_db_editor_event_utils";
import {
    resolveAhlyTeam,
    resolveOpponentTeam,
    inferLineupTeamsFromRows,
    applyMatchTeamsToLineupRows,
    isLineupForAhly,
    isLineupForOpponent,
    createInitialTeamLineup,
    normalizeSavedMatchLineup,
    mergeTeamLineupUpdate,
} from "./alahly_db_editor_lineup_utils";
import {
    prepareMatchDetailsPayload,
    persistLinkedTableRows,
    insertStagedLinkedTableRows,
} from "./alahly_db_editor_save_utils";
import PlayerEventsPanel from "./alahly_db_editor_events_panel";
import GkDetailsPanel from "./alahly_db_editor_gks_panel";
import PenaltyMissesPanel from "./alahly_db_editor_pens_panel";
import LineupPanel from "./alahly_db_editor_lineup_panel";

export default function AlAhlyEditor() {
    const [searchId, setSearchId] = useState('');
    const [matchData, setMatchData] = useState(null);
    const [lineupRows, setLineupRows] = useState([]);
    const [playerRows, setPlayerRows] = useState([]);
    const [gkRows, setGkRows] = useState([]);
    const [penRows, setPenRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState('search');
    const { addNotification } = useNotification();
    const [newMatchData, setNewMatchData] = useState({ ...EMPTY_MATCH });
    const [activeLinkedTab, setActiveLinkedTab] = useState('lineup-ahly');
    const [newLineupRows, setNewLineupRows] = useState([]);
    const [newPlayerRows, setNewPlayerRows] = useState([]);
    const [newGkRows, setNewGkRows] = useState([]);
    const [newPenRows, setNewPenRows] = useState([]);
    const [matchFieldOptions, setMatchFieldOptions] = useState({});
    const [allPlayersList, setAllPlayersList] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [eventSubTypes, setEventSubTypes] = useState([]);
    const [wdlFinalOptions, setWdlFinalOptions] = useState([]);
    const [catalogLists, setCatalogLists] = useState({ managers: [], stadiums: [], referees: [] });
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmDeleteMatch, setConfirmDeleteMatch] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadCatalogLists = async () => {
            try {
                const [players, managers, stadiums, referees] = await Promise.all([
                    fetchCatalogDisplayNames('db_PLAYERS'),
                    fetchCatalogDisplayNames('db_MANAGERS'),
                    fetchCatalogDisplayNames('db_STADIUMS'),
                    fetchCatalogDisplayNames('db_REFEREES'),
                ]);

                if (cancelled) return;
                setAllPlayersList(players);

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

                const t = await fetchUniqueCol('alahly_PLAYERDETAILS', 'TYPE');
                setEventTypes(t);
                const ts = await fetchUniqueCol('alahly_PLAYERDETAILS', 'TYPE_SUB');
                setEventSubTypes(ts);
                const wdlFinal = await fetchUniqueCol('alahly_MATCHDETAILS', 'W-D-L FINAL');
                setWdlFinalOptions(wdlFinal);

                setCatalogLists({
                    managers,
                    stadiums,
                    referees,
                });
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
        if (mode !== 'new' && mode !== 'edit') return;
        (async () => {
            const { data } = await supabase.from('alahly_MATCHDETAILS').select('*');
            if (!data) return;

            const managerList = catalogLists.managers;
            const stadiumList = catalogLists.stadiums;
            const refereeList = catalogLists.referees;

            const opts = {};
            AUTOCOMPLETE_FIELDS.forEach(col => {
                if (['AHLY MANAGER', 'OPPONENT MANAGER'].includes(col)) {
                    opts[col] = managerList;
                } else if (col === 'STAD') {
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
        if (mode !== 'new') return;
        const suggested = buildOpponentDateMatchId(
            newMatchData['OPPONENT TEAM'],
            newMatchData.DATE,
        );
        setNewMatchData(prev => (prev.MATCH_ID === suggested ? prev : { ...prev, MATCH_ID: suggested }));
    }, [newMatchData['OPPONENT TEAM'], newMatchData.DATE, mode]);

    useEffect(() => {
        if (mode !== 'new' || !isFinalRound(newMatchData.ROUND) || newMatchData.FINAL_ID) return;
        (async () => {
            const { data } = await supabase.from('alahly_MATCHDETAILS').select('FINAL_ID');
            const nums = (data || []).map(r => {
                const m = String(r.FINAL_ID || '').match(/FINAL-(\d+)$/i);
                return m ? parseInt(m[1], 10) : 0;
            });
            const next = Math.max(0, ...nums, 0) + 1;
            setNewMatchData(prev => ({ ...prev, FINAL_ID: `FINAL-${String(next).padStart(4, '0')}` }));
        })();
    }, [mode, newMatchData.ROUND, newMatchData.FINAL_ID]);

    const renderFinalIdField = (formData, setFormData) => (
        <div key="FINAL_ID">
            <div className="field-label">FINAL_ID</div>
            <input
                type="text"
                value={formData.FINAL_ID ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, FINAL_ID: e.target.value }))}
                className="field-input"
                onFocus={e => { e.target.style.borderColor = '#c9a84c'; }}
                onBlur={e => { e.target.style.borderColor = '#e8e8e8'; }}
            />
        </div>
    );

    const renderWdlFinalField = (formData, setFormData) => (
        <div key="W-D-L FINAL">
            <div className="field-label">W-D-L FINAL</div>
            <AutocompleteInput
                value={formData["W-D-L FINAL"] ?? ''}
                options={wdlFinalOptions}
                onChange={val => setFormData(prev => ({ ...prev, "W-D-L FINAL": val }))}
                className="field-input"
                accentColor="#c9a84c"
            />
        </div>
    );

    const renderMatchField = (field, formData, setFormData, { matchIdAuto = false } = {}) => (
        <div key={field}>
            <div className="field-label" style={{ color: field === 'MATCH_ID' && matchIdAuto ? '#22c55e' : '#999' }}>
                {field} {field === 'MATCH_ID' && matchIdAuto && <span style={{ color: '#aaa', fontWeight: 400, letterSpacing: 0 }}>(auto: Opponent + Date)</span>}
            </div>
            {AUTOCOMPLETE_FIELDS.includes(field) ? (
                <AutocompleteInput
                    value={formData[field] ?? ''}
                    options={matchFieldOptions[field] || []}
                    onChange={val => setFormData(prev => ({ ...prev, [field]: val }))}
                    className="field-input"
                    accentColor="#c9a84c"
                />
            ) : (
                <input
                    type={field === 'DATE' ? 'date' : 'text'}
                    value={formData[field] ?? ''}
                    disabled={field === 'MATCH_ID'}
                    onChange={e => {
                        if (field === 'MATCH_ID') return;
                        setFormData(prev => ({ ...prev, [field]: e.target.value }));
                    }}
                    className="field-input"
                    style={{
                        border: field === 'MATCH_ID' && matchIdAuto ? '2px solid #22c55e' : '1.5px solid #e8e8e8',
                        background: field === 'MATCH_ID' && matchIdAuto ? 'rgba(34,197,94,0.05)' : '#fff',
                    }}
                    onFocus={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#c9a84c'; }}
                    onBlur={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = field === 'MATCH_ID' && matchIdAuto ? '#22c55e' : '#e8e8e8'; }}
                />
            )}
        </div>
    );

    const renderMatchFieldsGrid = (formData, setFormData, { matchIdAuto = false } = {}) =>
        Object.keys(EMPTY_MATCH).filter(field => field !== 'MOTM').flatMap(field => {
            const showFinal = isFinalRound(formData.ROUND);
            if (field === 'MATCH_ID') {
                return [
                    renderMatchField(field, formData, setFormData, { matchIdAuto }),
                    ...(showFinal ? [renderFinalIdField(formData, setFormData)] : []),
                ];
            }
            if (field === 'NOTE') {
                return [
                    ...(showFinal ? [renderWdlFinalField(formData, setFormData)] : []),
                    renderMatchField(field, formData, setFormData, { matchIdAuto }),
                ];
            }
            return [renderMatchField(field, formData, setFormData, { matchIdAuto })];
        });

    const handleNewLineupRows = useCallback((action) => {
        setNewLineupRows((prev) => mergeTeamLineupUpdate(prev, () => true, action, applyLineupLogic));
    }, []);

    const makeNewAhlyLineupSetter = useCallback((formData) => {
        return (action) => setNewLineupRows((prev) => {
            const { ahlyTeam, oppTeam } = inferLineupTeamsFromRows(prev, formData);
            const filter = (row) => isLineupForAhly(row, ahlyTeam, oppTeam);
            return mergeTeamLineupUpdate(prev, filter, action, applyLineupLogic);
        });
    }, []);

    const makeNewOpponentLineupSetter = useCallback((formData) => {
        return (action) => setNewLineupRows((prev) => {
            const { ahlyTeam, oppTeam } = inferLineupTeamsFromRows(prev, formData);
            const filter = (row) => isLineupForOpponent(row, oppTeam, ahlyTeam);
            return mergeTeamLineupUpdate(prev, filter, action, applyLineupLogic);
        });
    }, []);

    const makeEditAhlyLineupSetter = useCallback((formData) => {
        return (action) => setLineupRows((prev) => {
            const { ahlyTeam, oppTeam } = inferLineupTeamsFromRows(prev, formData);
            const filter = (row) => isLineupForAhly(row, ahlyTeam, oppTeam);
            return mergeTeamLineupUpdate(prev, filter, action, applyLineupLogic);
        });
    }, []);

    const makeEditOpponentLineupSetter = useCallback((formData) => {
        return (action) => setLineupRows((prev) => {
            const { ahlyTeam, oppTeam } = inferLineupTeamsFromRows(prev, formData);
            const filter = (row) => isLineupForOpponent(row, oppTeam, ahlyTeam);
            return mergeTeamLineupUpdate(prev, filter, action, applyLineupLogic);
        });
    }, []);

    useEffect(() => {
        if (mode === 'new') {
            const ahlyTeam = resolveAhlyTeam(newMatchData);
            const oppTeam = resolveOpponentTeam(newMatchData);
            const matchId = newMatchData.MATCH_ID || '';
            const ahlyRows = createInitialTeamLineup(matchId, ahlyTeam);
            const oppRows = oppTeam ? createInitialTeamLineup(matchId, oppTeam) : [];
            handleNewLineupRows([...ahlyRows, ...oppRows]);
            setActiveLinkedTab('lineup-ahly');
        }
    }, [mode]);

    useEffect(() => {
        if (mode === 'new') {
            setNewLineupRows(prev => prev.map(r => ({ ...r, MATCH_ID: newMatchData.MATCH_ID || '' })));
        }
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
            const [{ data: md }, { data: ld }, { data: pd }, { data: gd }, { data: pen }] = await Promise.all([
                supabase.from('alahly_MATCHDETAILS').select('*').eq('MATCH_ID', id).maybeSingle(),
                supabase.from('alahly_LINEUPDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('alahly_PLAYERDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('alahly_GKSDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('alahly_HOWPENMISSED').select('*').eq('MATCH_ID', id),
            ]);
            if (!md) { addToast(`Match ID "${id}" not found`, 'error'); setLoading(false); return; }
            setMatchData({ ...md });
            if (!ld || ld.length === 0) {
                setLineupRows(normalizeSavedMatchLineup([], id, md));
            } else {
                setLineupRows(normalizeSavedMatchLineup(ld, id, md));
            }
            setActiveLinkedTab('lineup-ahly');
            setPlayerRows(sortRowsByEventId((pd || []).map((r, i) => ({ ...r, _key: r._key ?? 1000 + i }))));
            setGkRows(sortRowsByEventId((gd || []).map((r, i) => ({ ...r, _key: r._key ?? 2000 + i }))));
            setPenRows(sortRowsByEventId((pen || []).map((r, i) => ({
                ...normalizeHowPenMissedRowForEditor(r),
                _key: r._key ?? 3000 + i,
            }))));
            setMode('edit');
        } catch (e) { addToast('Error: ' + e.message, 'error'); }
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
            alahly_LINEUPDETAILS: setLineupRows,
            alahly_PLAYERDETAILS: setPlayerRows,
            alahly_GKSDETAILS: setGkRows,
            alahly_HOWPENMISSED: setPenRows,
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
            for (const tableName of ALAHLY_MATCH_LINKED_TABLES) {
                const { error } = await supabase.from(tableName).delete().eq("MATCH_ID", mid);
                if (error) throw new Error(`${tableName}: ${error.message}`);
            }

            const { error: matchErr } = await supabase.from("alahly_MATCHDETAILS").delete().eq("MATCH_ID", mid);
            if (matchErr) throw new Error(`alahly_MATCHDETAILS: ${matchErr.message}`);

            setMatchData(null);
            setLineupRows([]);
            setPlayerRows([]);
            setGkRows([]);
            setPenRows([]);
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

        const syncedLineup = applyMatchTeamsToLineupRows(lineupRows, matchData);
        setLineupRows(syncedLineup);

        try {
            const nextLineup = await persistLinkedTableRows("alahly_LINEUPDETAILS", syncedLineup, matchId);
            const nextPlayers = await persistLinkedTableRows("alahly_PLAYERDETAILS", playerRows, matchId);
            const nextGks = await persistLinkedTableRows("alahly_GKSDETAILS", gkRows, matchId);
            const nextPens = await persistLinkedTableRows("alahly_HOWPENMISSED", penRows, matchId);

            const { error: matchErr } = await supabase.from("alahly_MATCHDETAILS").upsert(matchPayload);
            if (matchErr) throw new Error(`alahly_MATCHDETAILS: ${matchErr.message}`);

            setLineupRows(nextLineup);
            setPlayerRows(nextPlayers);
            setGkRows(nextGks);
            setPenRows(nextPens);
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
            const exists = await fetchMatchIdExists(supabase, 'alahly_MATCHDETAILS', mid);
            if (exists) {
                addNotification(`Cannot create match: MATCH_ID "${mid}" already exists in the database.`, "error");
                addToast(`MATCH_ID "${mid}" already exists`, 'error');
                return;
            }

            const syncedLineup = applyMatchTeamsToLineupRows(newLineupRows, newMatchData);
            setNewLineupRows(syncedLineup);

            const matchPayload = prepareMatchDetailsPayload({ ...newMatchData, MATCH_ID: mid });
            const { error: matchErr } = await supabase.from('alahly_MATCHDETAILS').insert(matchPayload);
            if (matchErr) {
                throw new Error(`alahly_MATCHDETAILS: ${matchErr.message}`);
            }
            matchInserted = true;

            await insertStagedLinkedTableRows('alahly_LINEUPDETAILS', syncedLineup, mid);
            await insertStagedLinkedTableRows('alahly_PLAYERDETAILS', newPlayerRows, mid);
            await insertStagedLinkedTableRows('alahly_GKSDETAILS', newGkRows, mid);
            await insertStagedLinkedTableRows('alahly_HOWPENMISSED', newPenRows, mid);

            addToast('Match + all linked data created ✓');
            setSearchId(mid);
            setNewLineupRows([]); setNewPlayerRows([]); setNewGkRows([]); setNewPenRows([]);
            setMode('search');
            setTimeout(() => handleSearch(), 400);

        } catch (e) {
            console.error("Create Match Error:", e);
            if (matchInserted) {
                await supabase.from('alahly_MATCHDETAILS').delete().eq('MATCH_ID', mid);
            }
            addNotification(`Failed to create match — nothing was kept in the database.\n${e.message}`, "error");
            addToast('Error: ' + e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const renderPlayerEventsPanel = ({ formData, isNew }) => {
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;
        const teamOptions = [formData["AHLY TEAM"], formData["OPPONENT TEAM"]].filter(Boolean);
        return (
            <PlayerEventsPanel
                title="PLAYER EVENTS"
                color="#8b5cf6"
                rows={isNew ? newPlayerRows : playerRows}
                setRows={isNew ? setNewPlayerRows : setPlayerRows}
                matchId={matchId}
                teamOptions={teamOptions}
                allPlayersList={allPlayersList}
                eventTypes={eventTypes}
                eventSubTypes={eventSubTypes}
                persistToDb={false}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isSaving}
            />
        );
    };

    const renderGkDetailsPanel = ({ formData, isNew }) => {
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;
        const teamOptions = [formData["AHLY TEAM"], formData["OPPONENT TEAM"]].filter(Boolean);
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

    const renderPenaltyMissesPanel = ({ formData, isNew }) => {
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;
        const teamOptions = [formData["AHLY TEAM"], formData["OPPONENT TEAM"]].filter(Boolean);
        const playerEventRows = isNew ? newPlayerRows : playerRows;
        return (
            <PenaltyMissesPanel
                title="PENALTY MISSES"
                color="#ef4444"
                rows={isNew ? newPenRows : penRows}
                setRows={isNew ? setNewPenRows : setPenRows}
                matchId={matchId}
                teamOptions={teamOptions}
                gkPlayerOptions={allPlayersList}
                playerEventRows={playerEventRows}
                persistToDb={false}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isSaving}
            />
        );
    };

    const renderLinkedTabBar = (formData) => {
        const ahlyTeam = resolveAhlyTeam(formData);
        const oppTeam = resolveOpponentTeam(formData);
        const tabStyle = (tabId, activeBg, activeColor = '#fff') => ({
            background: activeLinkedTab === tabId ? activeBg : '#f8f8f8',
            color: activeLinkedTab === tabId ? activeColor : '#888',
        });

        return (
            <div className="linked-tabs-grid linked-tabs-grid--6">
                <button type="button" onClick={() => setActiveLinkedTab('lineup-ahly')} className="tab-btn" style={tabStyle('lineup-ahly', '#c9a84c', '#0a0a0a')}>
                    LINEUP — {ahlyTeam}
                </button>
                <button
                    type="button"
                    onClick={() => oppTeam && setActiveLinkedTab('lineup-opponent')}
                    className="tab-btn"
                    style={tabStyle('lineup-opponent', '#3b82f6')}
                    disabled={!oppTeam}
                    title={!oppTeam ? 'Select OPPONENT TEAM in match details first' : undefined}
                >
                    LINEUP — {oppTeam || 'OPPONENT'}
                </button>
                <button type="button" onClick={() => setActiveLinkedTab('events')} className="tab-btn" style={tabStyle('events', '#8b5cf6')}>PLAYER EVENTS</button>
                <button type="button" onClick={() => setActiveLinkedTab('motm')} className="tab-btn" style={tabStyle('motm', '#10b981')}>MOTM</button>
                <button type="button" onClick={() => setActiveLinkedTab('gks')} className="tab-btn" style={tabStyle('gks', '#f59e0b')}>GK DETAILS</button>
                <button type="button" onClick={() => setActiveLinkedTab('pens')} className="tab-btn" style={tabStyle('pens', '#ef4444')}>PENALTY MISSES</button>
            </div>
        );
    };

    const renderLineupTable = ({ formData, isNew, side }) => {
        const isAhly = side === 'ahly';
        const allRows = isNew ? newLineupRows : lineupRows;
        const { ahlyTeam, oppTeam } = inferLineupTeamsFromRows(allRows, formData);
        const teamName = isAhly ? resolveAhlyTeam(formData) : resolveOpponentTeam(formData);
        const rows = isAhly
            ? allRows.filter((row) => isLineupForAhly(row, ahlyTeam, oppTeam))
            : allRows.filter((row) => isLineupForOpponent(row, oppTeam, ahlyTeam));
        const setRows = isNew
            ? (isAhly ? makeNewAhlyLineupSetter(formData) : makeNewOpponentLineupSetter(formData))
            : (isAhly ? makeEditAhlyLineupSetter(formData) : makeEditOpponentLineupSetter(formData));
        const matchId = isNew ? (formData.MATCH_ID || '---') : formData.MATCH_ID;

        if (!isAhly && !oppTeam) {
            return (
                <NoData_db
                    message={isNew ? 'SELECT OPPONENT TEAM IN MATCH DETAILS TO EDIT OPPONENT LINEUP' : 'SET OPPONENT TEAM IN MATCH DETAILS TO EDIT OPPONENT LINEUP'}
                    height="240px"
                />
            );
        }

        return (
            <LineupPanel
                title={`LINEUP — ${teamName}`}
                color={isAhly ? '#c9a84c' : '#3b82f6'}
                rows={rows}
                setRows={setRows}
                matchId={matchId}
                teamName={teamName}
                allPlayersList={allPlayersList}
                persistToDb={false}
                onDeleteRow={isNew ? handleStagedDelete : handleDeleteRow}
                isSaving={isSaving}
            />
        );
    };

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="editor-container">

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, marginBottom: 30 }}>
                    <div style={{ display: 'flex', width: 400, background: '#f8f8f8', borderRadius: 12, padding: 4 }}>
                        <button
                            onClick={() => { setMode('search'); setMatchData(null); }}
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: (mode === 'search' || mode === 'edit') ? '#c9a84c' : 'transparent',
                                color: (mode === 'search' || mode === 'edit') ? '#000' : '#888', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                                cursor: 'pointer', borderRadius: 10, transition: 'all 0.2s', fontSize: 13, letterSpacing: 1
                            }}>
                            SEARCH MATCH
                        </button>
                        <button
                            onClick={() => { setMode('new'); setMatchData(null); setNewMatchData({ ...EMPTY_MATCH }); }}
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: mode === 'new' ? '#c9a84c' : 'transparent',
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
                        <div className="portal-title">
                            ENTER MATCH ID
                        </div>
                        <div className="portal-subtitle">
                            Type the Match ID to load all linked records for editing
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', width: '100%', maxWidth: 520 }}>
                            <SearchBar_db
                                value={searchId}
                                onChange={setSearchId}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Match ID..."
                                style={{ flex: 1 }}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="load-btn">
                                {loading ? 'Loading...' : 'LOAD →'}
                            </button>
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
                                {renderMatchFieldsGrid(newMatchData, setNewMatchData, { matchIdAuto: true })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={handleCreateMatch}
                                    disabled={isSaving}
                                    className="create-match-btn">
                                    {isSaving ? 'Creating...' : '✓ CREATE MATCH'}
                                </button>
                            </div>
                        </div>

                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA</h2>
                                </div>
                            </div>

                            {renderLinkedTabBar(newMatchData)}

                            {activeLinkedTab === 'lineup-ahly' && renderLineupTable({ formData: newMatchData, isNew: true, side: 'ahly' })}
                            {activeLinkedTab === 'lineup-opponent' && renderLineupTable({ formData: newMatchData, isNew: true, side: 'opponent' })}
                            {activeLinkedTab === 'events' && renderPlayerEventsPanel({ formData: newMatchData, isNew: true })}
                            {activeLinkedTab === 'gks' && renderGkDetailsPanel({ formData: newMatchData, isNew: true })}
                            {activeLinkedTab === 'pens' && renderPenaltyMissesPanel({ formData: newMatchData, isNew: true })}
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
                                        accentColor="#c9a84c"
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

                {mode === 'edit' && matchData && (
                    <>
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#c9a84c' }} />
                                    <div>
                                        <h2 className="card-title">MATCH DETAILS</h2>
                                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#888', marginTop: 2 }}>ID: {matchData.MATCH_ID}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        onClick={() => { setMode('search'); setMatchData(null); }}
                                        title="Back to search"
                                        className="action-btn-circle">
                                        ←
                                    </button>
                                    <button
                                        onClick={() => setConfirmDeleteMatch(true)}
                                        disabled={isSaving || isDeleting}
                                        title="Delete match and all linked records"
                                        className="delete-match-btn">
                                        {isDeleting ? '⏳' : '🗑️'}
                                    </button>
                                    <button
                                        onClick={handleSaveMatch}
                                        disabled={isSaving || isDeleting}
                                        title="Save match"
                                        className="save-match-btn">
                                        {isSaving ? '⏳' : '💾'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid-fields">
                                {renderMatchFieldsGrid(matchData, setMatchData)}
                            </div>
                        </div>

                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA</h2>
                                </div>
                            </div>

                            {renderLinkedTabBar(matchData)}

                            {activeLinkedTab === 'lineup-ahly' && renderLineupTable({ formData: matchData, isNew: false, side: 'ahly' })}
                            {activeLinkedTab === 'lineup-opponent' && renderLineupTable({ formData: matchData, isNew: false, side: 'opponent' })}
                            {activeLinkedTab === 'events' && renderPlayerEventsPanel({ formData: matchData, isNew: false })}
                            {activeLinkedTab === 'gks' && renderGkDetailsPanel({ formData: matchData, isNew: false })}
                            {activeLinkedTab === 'pens' && renderPenaltyMissesPanel({ formData: matchData, isNew: false })}
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
                                        accentColor="#c9a84c"
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

            {confirmDelete && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-box">
                        <div className="confirm-modal-icon">⚠️</div>
                        <div className="confirm-modal-title">Delete Row?</div>
                        <div className="confirm-modal-text">
                            Are you sure you want to delete this row? This action cannot be undone.
                        </div>
                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-modal-btn confirm-modal-btn-cancel"
                                onClick={() => setConfirmDelete(null)}
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="confirm-modal-btn confirm-modal-btn-delete"
                                onClick={executeDeleteRow}
                            >
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
