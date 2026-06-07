"use client";

import { useState, useCallback, useEffect } from "react";
import "./alahly_db_editor.css";
import { supabase } from "../lib/supabase";
import Login_db from "../lib/Login_db";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import { useNotification } from "../lib/Notification_db";




// ── Helper ──────────────────────────────────────────────────────────────────
const EMPTY_MATCH = {
    "MATCH_ID": "", "CHAMPION SYSTEM": "", "DATE": "", "CHAMPION": "", "SEASON - NAME": "",
    "SEASON - NUMBER": "", "AHLY MANAGER": "", "OPPONENT MANAGER": "", "REFREE": "", "ROUND": "",
    "H-A-N": "", "STAD": "", "AHLY TEAM": "", "GF": "", "GA": "", "ET": "",
    "PEN": "", "OPPONENT TEAM": "", "NOTE": ""
};
const EMPTY_LINEUP = { "MATCH_ID": "", "MATCH MINUTE": "", "TEAM": "", "PLAYER NAME": "", "STATU": "", "PLAYER NAME OUT": "", "OUT MINUTE": "", "TOTAL MINUTE": "" };
const EMPTY_PLAYER = { "MATCH_ID": "", "EVENT_ID": "", "PARENT_EVENT_ID": "", "PLAYER NAME": "", "TEAM": "", "TYPE": "", "TYPE_SUB": "", "MINUTE": "" };
const EMPTY_GK = { "MATCH_ID": "", "EVENT_ID": "", "TEAM": "", "PLAYER NAME": "", "STATU": "", "OUT MINUTE": "", "GOALS CONCEDED": "" };
const EMPTY_PEN = { "MATCH_ID": "", "PARENT_EVENT_ID": "", "HOW MISSED?": "", "TEAM": "", "MINUTE": "" };


// ── Autocomplete Input ───────────────────────────────────────────────────────
function AutocompleteInput({ value, onChange, options = [], placeholder, style, disabled, className }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || '');
    const [rect, setRect] = useState(null);
    const ref = useState(() => ({ current: null }))[0];

    // sync external value
    useEffect(() => { setQuery(value || ''); }, [value]);

    const filtered = query
        ? options.filter(o => String(o).toLowerCase().includes(String(query).toLowerCase())).slice(0, 50)
        : options.slice(0, 50);

    const handleSelect = (opt) => {
        setQuery(opt);
        onChange(opt);
        setOpen(false);
    };

    useEffect(() => {
        if (!open) return;
        const updateRect = () => {
            if (ref.current) setRect(ref.current.getBoundingClientRect());
        };
        updateRect();
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);
        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }, [open]);

    return (
        <div style={{ position: 'relative', width: '100%' }} ref={r => ref.current = r} className="autocomplete-wrapper">
            <input
                value={query}
                disabled={disabled}
                placeholder={placeholder}
                className={className}
                onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
                onFocus={() => { setOpen(true); if (ref.current) setRect(ref.current.getBoundingClientRect()); }}
                onBlur={() => setTimeout(() => setOpen(false), 180)}
                style={{ ...style, width: '100%', boxSizing: 'border-box' }}
                autoComplete="off"
            />
            {open && filtered.length > 0 && !disabled && rect && (() => {
                const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : 300;
                const dropdownHeight = 280;
                const openUpwards = spaceBelow < dropdownHeight && rect.top > spaceBelow;

                return (
                    <div className="premium-scroll" style={{
                        position: 'fixed',
                        left: rect.left,
                        width: rect.width,
                        zIndex: 9999999,
                        ...(openUpwards ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
                        background: 'rgba(255, 255, 255, 0.85)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: openUpwards ? '16px 16px 0 0' : '0 0 16px 16px',
                        borderTop: openUpwards ? '1px solid rgba(0, 0, 0, 0.08)' : '3px solid #c9a84c',
                        borderBottom: openUpwards ? '3px solid #c9a84c' : '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: openUpwards ? '0 -20px 50px -10px rgba(0, 0, 0, 0.15)' : '0 20px 50px -10px rgba(0, 0, 0, 0.15)',
                        maxHeight: dropdownHeight,
                        overflowY: 'auto',
                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                        padding: '10px',
                        animation: openUpwards ? 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        transformOrigin: openUpwards ? 'bottom center' : 'top center'
                    }}>
                        <div style={{ fontSize: 10, color: '#aaa', padding: '0 8px 8px', letterSpacing: 1, fontFamily: "'Space Mono', monospace" }}>
                            SELECT {placeholder ? placeholder.toUpperCase() : 'OPTION'}
                        </div>
                        {filtered.map((opt, i) => (
                            <div key={i}
                                onMouseDown={() => handleSelect(opt)}
                                style={{
                                    padding: '12px 14px', cursor: 'pointer', fontSize: 14,
                                    fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#333',
                                    borderRadius: 10,
                                    display: 'flex', alignItems: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(201, 168, 76, 0.15)';
                                    e.currentTarget.style.color = '#000';
                                    e.currentTarget.style.paddingLeft = '20px'; // dynamic indent
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#333';
                                    e.currentTarget.style.paddingLeft = '14px'; // restore indent
                                }}
                                dir="auto"
                            >
                                <div style={{ flex: 1, transition: 'color 0.2s' }}>{opt}</div>
                            </div>
                        ))}
                    </div>
                );
            })()}
        </div>
    );
}


// ── Editable Table ───────────────────────────────────────────────────────────
function EditableTable({ title, color, rows, setRows, columns, matchId, emptyRow, tableName, onSave, onDelete, isSaving, autoFields = {}, columnOptions = {} }) {

    const handleAdd = () => {
        const computed = {};
        Object.entries(autoFields).forEach(([field, fn]) => {
            computed[field] = fn(matchId, rows);
        });
        const row = { ...emptyRow, ...computed, MATCH_ID: matchId, _isNew: true, _key: Date.now() };
        setRows([...rows, row]);
    };

    return (
        <div style={{ marginBottom: 40 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 4, height: 24, background: color, borderRadius: 4 }} />
                    <h3 style={{ margin: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: '#0a0a0a' }}>
                        {title} <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#999', fontWeight: 400 }}>({rows.length} rows)</span>
                    </h3>
                </div>
                <button
                    onClick={handleAdd}
                    style={{
                        background: '#0a0a0a',
                        color: '#c9a84c',
                        border: 'none', borderRadius: 10, padding: '7px 18px',
                        cursor: 'pointer', fontWeight: 800, fontSize: 12,
                        fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s', letterSpacing: 0.5
                    }}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                    ADD ROW
                </button>
            </div>

            {/* Data table */}
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col}>
                                    {col}
                                </th>
                            ))}
                            <th>ACT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr key={row._key || ri} className={row._isNew ? "table-row-new" : ""} style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.2s' }}>
                                {columns.map(col => {
                                    const isAuto = col in autoFields;
                                    return (
                                        <td key={col} style={{ padding: '6px 10px', textAlign: 'center' }}>
                                            {columnOptions[col] ? (
                                                <AutocompleteInput
                                                    value={row[col] ?? ''}
                                                    options={columnOptions[col]}
                                                    placeholder={col}
                                                    disabled={isAuto}
                                                    onChange={val => setRows(prev => prev.map((r, i) => i === ri ? { ...r, [col]: val, _isDirty: true } : r))}
                                                    className="field-input"
                                                    style={{
                                                        border: isAuto
                                                            ? '1.5px solid rgba(201, 168, 76, 0.4)'
                                                            : (row._isDirty || row._isNew ? '1.5px solid ' + color : '1px solid #f0f0f0'),
                                                        background: isAuto ? 'rgba(201, 168, 76, 0.05)' : '#fff',
                                                        height: '34px', fontSize: '12px',
                                                        minWidth: col === 'PLAYER NAME' || col === 'PLAYER NAME OUT' ? 140 : 80,
                                                        textAlign: 'center',
                                                        color: isAuto ? '#888' : '#000'
                                                    }}
                                                />
                                            ) : (
                                                <input
                                                    value={row[col] ?? ''}
                                                    disabled={isAuto}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setRows(prev => prev.map((r, i) => i === ri ? { ...r, [col]: val, _isDirty: true } : r));
                                                    }}
                                                    className="field-input"
                                                    style={{
                                                        border: isAuto
                                                            ? '1.5px solid rgba(201, 168, 76, 0.4)'
                                                            : (row._isDirty || row._isNew ? '1.5px solid ' + color : '1px solid #f0f0f0'),
                                                        background: isAuto ? 'rgba(201, 168, 76, 0.05)' : '#fff',
                                                        height: '34px', fontSize: '12px',
                                                        minWidth: col === 'PLAYER NAME' || col === 'PLAYER NAME OUT' ? 140 : 80,
                                                        textAlign: 'center',
                                                        color: isAuto ? '#888' : '#000'
                                                    }}
                                                />
                                            )}
                                        </td>
                                    );
                                })}
                                <td style={{ padding: '6px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                        {(row._isDirty || row._isNew) && (
                                            <button onClick={() => onSave(row, ri, tableName)} disabled={isSaving}
                                                className="row-action-btn"
                                                style={{ background: '#22c55e', color: '#fff' }}>
                                                {isSaving ? '...' : '💾'}
                                            </button>
                                        )}
                                        <button onClick={() => onDelete(row, ri, tableName, setRows)}
                                            className="row-action-btn"
                                            style={{ background: '#fee2e2', color: '#ef4444', padding: '5px 10px' }}>
                                            ✕
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <NoData_db
                                isTable={true}
                                colSpan={columns.length + 1}
                                message={`NO ${title.toUpperCase()} RECORDS FOUND`}
                            />
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Main Editor ──────────────────────────────────────────────────────────────
export default function AlAhlyEditor() {
    const [searchId, setSearchId] = useState('');
    const [matchData, setMatchData] = useState(null);       // MATCHDETAILS record
    const [lineupRows, setLineupRows] = useState([]);
    const [playerRows, setPlayerRows] = useState([]);
    const [gkRows, setGkRows] = useState([]);
    const [penRows, setPenRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState('search'); // 'search' | 'edit' | 'new'
    const { addNotification } = useNotification();
    const [newMatchData, setNewMatchData] = useState({ ...EMPTY_MATCH });
    const [activeLinkedTab, setActiveLinkedTab] = useState('lineup');
    // new match linked rows (staged before create)
    const [newLineupRows, setNewLineupRows] = useState([]);
    const [newPlayerRows, setNewPlayerRows] = useState([]);
    const [newGkRows, setNewGkRows] = useState([]);
    const [newPenRows, setNewPenRows] = useState([]);
    const [nextMatchNum, setNextMatchNum] = useState(null);
    const [matchFieldOptions, setMatchFieldOptions] = useState({}); // unique values per column
    const [allPlayersList, setAllPlayersList] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [eventSubTypes, setEventSubTypes] = useState([]);
    const [howMissedOptions, setHowMissedOptions] = useState([]);

    // Fields that use autocomplete (not date/number/auto)
    const AUTOCOMPLETE_FIELDS = [
        'CHAMPION SYSTEM', 'CHAMPION', 'SEASON - NAME', 'SEASON - NUMBER', 'AHLY MANAGER', 'OPPONENT MANAGER',
        'REFREE', 'ROUND', 'H-A-N', 'STAD', 'AHLY TEAM', 'ET', 'PEN', 'OPPONENT TEAM', 'NOTE'
    ];

    // Fetch all players globally using pagination to bypass the 1000 limits
    useEffect(() => {
        (async () => {
            let allNames = [];
            const fetchTableNames = async (tableName) => {
                let from = 0;
                const limit = 1000;
                while (true) {
                    const { data, error } = await supabase.from(tableName).select('"PLAYER NAME"').range(from, from + limit - 1);
                    if (error) { console.error(tableName, error); break; }
                    if (!data || data.length === 0) break;
                    allNames.push(...data.map(d => d['PLAYER NAME']).filter(Boolean));
                    if (data.length < limit) break;
                    from += limit;
                }
            };

            await fetchTableNames('alahly_LINEUPDETAILS');
            await fetchTableNames('alahly_PLAYERDETAILS');
            await fetchTableNames('alahly_GKSDETAILS');

            const uniquePlayers = [...new Set(allNames)];
            uniquePlayers.sort((a, b) => a.localeCompare(b, 'ar'));
            setAllPlayersList(uniquePlayers);

            // Fetch unique TYPE and TYPE_SUB from PLAYERDETAILS
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
            const hm = await fetchUniqueCol('alahly_HOWPENMISSED', 'HOW MISSED?');
            setHowMissedOptions(hm);
        })();
    }, []);

    // Fetch max number + unique column values when entering 'new' mode
    useEffect(() => {
        if (mode !== 'new') return;
        (async () => {
            const { data } = await supabase.from('alahly_MATCHDETAILS').select('*');
            if (!data) return;

            // Max trailing number for next ID
            const nums = data.map(r => {
                const m = String(r.MATCH_ID).match(/(\d+)$/);
                return m ? parseInt(m[1], 10) : 0;
            });
            setNextMatchNum(Math.max(0, ...nums) + 1);

            // Unique values per column
            const opts = {};
            AUTOCOMPLETE_FIELDS.forEach(col => {
                opts[col] = [...new Set(data.map(r => r[col]).filter(Boolean))].sort();
            });
            setMatchFieldOptions(opts);
        })();
    }, [mode]);

    // Auto-build MATCH_ID when OPPONENT TEAM or nextMatchNum changes
    useEffect(() => {
        if (mode !== 'new' || nextMatchNum === null) return;
        const opp = newMatchData['OPPONENT TEAM'] || '';
        setNewMatchData(prev => ({ ...prev, MATCH_ID: opp ? `${opp}${nextMatchNum}` : '' }));
    }, [newMatchData['OPPONENT TEAM'], nextMatchNum]);

    const applyLineupLogic = (prev, action) => {
        const next = typeof action === 'function' ? action(prev) : action;
        const changedRow = next.find((r, i) => r["MATCH MINUTE"] !== prev[i]?.["MATCH MINUTE"]);
        const matchMinuteRef = changedRow ? changedRow["MATCH MINUTE"] : (next[0]?.["MATCH MINUTE"] || '90');

        return next.map((row) => {
            let outMin = parseInt(row["OUT MINUTE"]);
            let matchMin = parseInt(matchMinuteRef) || 90;
            let total = "";

            if (row.STATU === 'اساسي') {
                const playerName = String(row["PLAYER NAME"] || "").trim();
                const subOutRow = playerName ? next.find(r => String(r["PLAYER NAME OUT"] || "").trim() === playerName) : null;

                if (subOutRow) {
                    const actualOutMin = parseInt(subOutRow["OUT MINUTE"]);
                    total = !isNaN(actualOutMin) ? actualOutMin : matchMin;
                } else {
                    total = matchMin;
                }
            } else if (row.STATU === 'احتياطي') {
                if (!isNaN(outMin) && outMin > 0) {
                    total = Math.max(0, matchMin - outMin);
                }
            } else {
                total = row["TOTAL MINUTE"] || "";
            }

            return {
                ...row,
                "MATCH MINUTE": matchMinuteRef,
                "TOTAL MINUTE": total.toString()
            };
        });
    };

    const handleNewLineupRows = useCallback((action) => setNewLineupRows(p => applyLineupLogic(p, action)), []);
    const handleEditLineupRows = useCallback((action) => setLineupRows(p => applyLineupLogic(p, action)), []);

    useEffect(() => {
        if (mode === 'new') {
            const initialLineup = Array.from({ length: 16 }, (_, i) => ({
                ...EMPTY_LINEUP,
                "MATCH MINUTE": "90",
                "TEAM": "الأهلي",
                "STATU": i < 11 ? "اساسي" : "احتياطي",
                "TOTAL MINUTE": i < 11 ? "90" : "",
                MATCH_ID: newMatchData.MATCH_ID || '',
                _isNew: true,
                _key: Date.now() + i
            }));
            handleNewLineupRows(initialLineup);
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

    // ── Search ──────────────────────────────────────────────────────────────
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
                const initialLineup = Array.from({ length: 16 }, (_, i) => ({
                    ...EMPTY_LINEUP,
                    "MATCH MINUTE": "90",
                    "TEAM": "الأهلي",
                    "STATU": i < 11 ? "اساسي" : "احتياطي",
                    "TOTAL MINUTE": i < 11 ? "90" : "",
                    MATCH_ID: id,
                    _isNew: true,
                    _key: Date.now() + i
                }));
                setLineupRows(applyLineupLogic(initialLineup, initialLineup));
            } else {
                setLineupRows(ld.map((r, i) => ({ ...r, _key: i })));
            }
            setPlayerRows((pd || []).map((r, i) => ({ ...r, _key: 1000 + i })));
            setGkRows((gd || []).map((r, i) => ({ ...r, _key: 2000 + i })));
            setPenRows((pen || []).map((r, i) => ({ ...r, _key: 3000 + i })));
            setMode('edit');
        } catch (e) { addToast('Error: ' + e.message, 'error'); }
        setLoading(false);
    };

    // ── Save a single row ────────────────────────────────────────────────────
    const handleSaveRow = useCallback(async (row, ri, tableName) => {
        if (isSaving) return; // Prevent overlapping saves
        setIsSaving(true);
        const { _isNew, _isDirty, _key, ...cleanRow } = row;


        if (!cleanRow.MATCH_ID && matchData) cleanRow.MATCH_ID = matchData.MATCH_ID;

        // Ensure we don't send an empty string for ROW_ID
        if (cleanRow.ROW_ID === "" || cleanRow.ROW_ID === null || cleanRow.ROW_ID === undefined) {
            delete cleanRow.ROW_ID;
        }

        try {
            let result;
            if (_isNew) {
                // New record insertion
                result = await supabase.from(tableName).insert(cleanRow).select();
            } else {
                // Update record by ROW_ID
                if (cleanRow.ROW_ID) {
                    result = await supabase.from(tableName).update(cleanRow).eq('ROW_ID', cleanRow.ROW_ID).select();
                } else {
                    // Safety fallback if ROW_ID missing
                    result = await supabase.from(tableName).upsert(cleanRow).select();
                }
            }

            if (result.error) {
                // Show detailed error in alert for debugging
                addNotification(`Supabase Error (${tableName}):\n${result.error.message}\n${result.error.hint || ''}`, "error");
                throw result.error;
            }

            const savedRow = result.data?.[0];
            if (!savedRow) throw new Error("No data returned from DB after save success.");

            addToast(row._isNew ? 'Row inserted ✓' : 'Row updated ✓');

            const setterMap = {
                'alahly_LINEUPDETAILS': setLineupRows,
                'alahly_PLAYERDETAILS': setPlayerRows,
                'alahly_GKSDETAILS': setGkRows,
                'alahly_HOWPENMISSED': setPenRows,
            };

            setterMap[tableName]?.(prev => prev.map((r, i) =>
                i === ri ? { ...r, ...savedRow, _isNew: false, _isDirty: false } : r
            ));

        } catch (e) {
            console.error("Save Error:", e);
            addToast('Save FAILED: ' + (e.message || "Unknown error"), 'error');
        } finally {
            setIsSaving(false);
        }
    }, [matchData, setLineupRows, setPlayerRows, setGkRows, setPenRows]);



    // ── Delete a row ─────────────────────────────────────────────────────────
    const handleDeleteRow = useCallback(async (row, ri, tableName, setterFn) => {
        if (!confirm('Delete this row?')) return;
        if (!row._isNew) {
            try {
                // For tables without PK we delete by match_id + row index isn't reliable
                // Best approach: delete all rows for match, re-insert remaining
                const setterMap = {
                    'alahly_LINEUPDETAILS': setLineupRows,
                    'alahly_PLAYERDETAILS': setPlayerRows,
                    'alahly_GKSDETAILS': setGkRows,
                    'alahly_HOWPENMISSED': setPenRows,
                };
                const currentSetter = setterMap[tableName];
                // Get all rows except this one
                let remaining;
                currentSetter(prev => {
                    remaining = prev.filter((_, i) => i !== ri).map(({ _isNew, _isDirty, _key, ...clean }) => clean);
                    return prev.filter((_, i) => i !== ri);
                });
                // Delete all then re-insert
                const { error: delErr } = await supabase.from(tableName).delete().eq('MATCH_ID', matchData.MATCH_ID);
                if (delErr) throw delErr;
                if (remaining && remaining.length > 0) {
                    const { error: insErr } = await supabase.from(tableName).insert(remaining);
                    if (insErr) throw insErr;
                }
                addToast('Row deleted ✓', 'warn');
            } catch (e) { addToast('Delete failed: ' + e.message, 'error'); }
        } else {
            const setterMap = {
                'alahly_LINEUPDETAILS': setLineupRows,
                'alahly_PLAYERDETAILS': setPlayerRows,
                'alahly_GKSDETAILS': setGkRows,
                'alahly_HOWPENMISSED': setPenRows,
            };
            setterMap[tableName]?.(prev => prev.filter((_, i) => i !== ri));
        }
    }, [matchData]);

    // ── Save Match Details (Global Save) ────────────────────────────────────
    const handleSaveMatch = async () => {
        if (isSaving) return; // Prevent overlapping saves
        setIsSaving(true);
        try {

            // 1. Save main match details (exclude W-D-L and CLEAN SHEET from database payload)
            const { "W-D-L": wdl, "CLEAN SHEET": cs, ...cleanMatchData } = matchData;
            const { error: matchErr } = await supabase.from('alahly_MATCHDETAILS').upsert(cleanMatchData);
            if (matchErr) throw matchErr;

            // 2. Helper to save pending changes in linked tables
            const saveLinkedTable = async (tableName, rows, setter) => {
                const pending = rows.filter(r => r._isNew || r._isDirty);
                // Filter out ghost rows
                const filled = pending.filter(r => r["PLAYER NAME"] && String(r["PLAYER NAME"]).trim() !== "");
                if (filled.length === 0) return;

                // Split into new (INSERT) and existing (UPSERT)
                const toInsert = filled.filter(r => r._isNew);
                const toUpdate = filled.filter(r => !r._isNew);

                const cleanObj = (r, isNew) => {
                    const { _isNew, _isDirty, _key, ...clean } = { ...r, MATCH_ID: matchData.MATCH_ID };
                    // For new rows, never send ROW_ID to allow DB to generate it
                    if (isNew || !clean.ROW_ID || clean.ROW_ID === "" || clean.ROW_ID === null) {
                        delete clean.ROW_ID;
                    }
                    return clean;
                };

                let savedResults = [];

                try {
                    // Separate calls to prevent PostgREST mixed-batch NULL issues
                    if (toInsert.length > 0) {
                        const { data, error: insErr } = await supabase.from(tableName).insert(toInsert.map(r => cleanObj(r, true))).select();
                        if (insErr) throw insErr;
                        if (data) savedResults.push(...data);
                    }

                    if (toUpdate.length > 0) {
                        const { data, error: upErr } = await supabase.from(tableName).upsert(toUpdate.map(r => cleanObj(r, false))).select();
                        if (upErr) throw upErr;
                        if (data) savedResults.push(...data);
                    }
                } catch (e) {
                    console.error(`Error saving ${tableName}:`, e);
                    throw new Error(`${tableName}: ${e.message}`);
                }

                // Reflect saved state back to UI
                if (savedResults.length > 0) {
                    setter(prev => prev.map(existingRow => {
                        const saved = savedResults.find(s =>
                            (existingRow.ROW_ID && s.ROW_ID === existingRow.ROW_ID) ||
                            (existingRow._isNew && !existingRow.ROW_ID &&
                                s["PLAYER NAME"] === existingRow["PLAYER NAME"] &&
                                s.TEAM === existingRow.TEAM)
                        );
                        return saved ? { ...existingRow, ...saved, _isNew: false, _isDirty: false } : existingRow;
                    }));
                }
            };

            // Run saves for all tabs in parallel
            await Promise.all([
                saveLinkedTable('alahly_LINEUPDETAILS', lineupRows, setLineupRows),
                saveLinkedTable('alahly_PLAYERDETAILS', playerRows, setPlayerRows),
                saveLinkedTable('alahly_GKSDETAILS', gkRows, setGkRows),
                saveLinkedTable('alahly_HOWPENMISSED', penRows, setPenRows),
            ]);

            addToast('Match and all pending records saved ✓');
        } catch (e) {
            console.error("Global Save Error:", e);
            addNotification(`Global Save Failed:\n${e.message}`, "error");
            addToast('Save Failed: ' + e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };


    // ── Create New Match ─────────────────────────────────────────────────────
    const handleCreateMatch = async () => {
        if (!newMatchData.MATCH_ID) { addToast('MATCH_ID is required', 'error'); return; }
        setIsSaving(true);
        const mid = newMatchData.MATCH_ID;
        try {
            // 1. Insert main match record (exclude W-D-L and CLEAN SHEET from database payload)
            const { "W-D-L": wdl, "CLEAN SHEET": cs, ...cleanNewMatchData } = newMatchData;
            const { error: matchErr } = await supabase.from('alahly_MATCHDETAILS').insert(cleanNewMatchData);
            if (matchErr) {
                console.error("Match Insert Error:", matchErr);
                throw new Error(`Match Details: ${matchErr.message}`);
            }

            // 2. Helper to insert staged linked rows with error checking
            const saveStagedTable = async (tableName, rows) => {
                // Filter out rows that have no player name (prevent ghost rows)
                const filled = rows.filter(r => r["PLAYER NAME"] && String(r["PLAYER NAME"]).trim() !== "");
                if (filled.length === 0) return;

                const clean = filled.map(({ _isNew, _isDirty, _key, ...r }) => {
                    const row = { ...r, MATCH_ID: mid };
                    // Safety check for empty ROW_ID
                    if (row.ROW_ID === "" || row.ROW_ID === null) delete row.ROW_ID;
                    return row;
                });

                const { error: insErr } = await supabase.from(tableName).insert(clean);
                if (insErr) {
                    console.error(`Error saving ${tableName}:`, insErr);
                    throw new Error(`${tableName}: ${insErr.message}`);
                }
            };

            // 3. Batch insert all linked data
            await Promise.all([
                saveStagedTable('alahly_LINEUPDETAILS', newLineupRows),
                saveStagedTable('alahly_PLAYERDETAILS', newPlayerRows),
                saveStagedTable('alahly_GKSDETAILS', newGkRows),
                saveStagedTable('alahly_HOWPENMISSED', newPenRows),
            ]);

            addToast('Match + all linked data created ✓');
            setSearchId(mid);
            // Reset states
            setNewLineupRows([]); setNewPlayerRows([]); setNewGkRows([]); setNewPenRows([]);
            setMode('search');
            // Auto-load the newly created match
            setTimeout(() => handleSearch(), 400);

        } catch (e) {
            console.error("Create Match Error:", e);
            addNotification(`Failed to create match:\n${e.message}`, "error");
            addToast('Error: ' + e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const matchInfoFields = Object.keys(EMPTY_MATCH);
    const lineupCols = Object.keys(EMPTY_LINEUP);
    const playerCols = Object.keys(EMPTY_PLAYER);
    const gkCols = Object.keys(EMPTY_GK);
    const penCols = Object.keys(EMPTY_PEN);

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="editor-container">
    
                {/* ── Header ── */}
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

                {/* ── Mode: Search = portal ── */}
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

                {/* ── Mode: New Match ── */}
                {mode === 'new' && (
                    <>
                        {/* Match Details form */}
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
                                            {field} {field === 'MATCH_ID' && <span style={{ color: '#aaa', fontWeight: 400, letterSpacing: 0 }}>(auto)</span>}
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
                                                onFocus={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#c9a84c'; }}
                                                onBlur={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#e8e8e8'; }}
                                            />
                                        )}
                                    </div>
                                ))}
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

                        {/* Linked tables - staged before create */}
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA</h2>
                                </div>
                            </div>

                            <div className="linked-tabs-grid">
                                <button onClick={() => setActiveLinkedTab('lineup')} className="tab-btn" style={{ background: activeLinkedTab === 'lineup' ? '#3b82f6' : '#f8f8f8', color: activeLinkedTab === 'lineup' ? '#fff' : '#888' }}>LINEUP DETAILS</button>
                                <button onClick={() => setActiveLinkedTab('events')} className="tab-btn" style={{ background: activeLinkedTab === 'events' ? '#8b5cf6' : '#f8f8f8', color: activeLinkedTab === 'events' ? '#fff' : '#888' }}>PLAYER EVENTS</button>
                                <button onClick={() => setActiveLinkedTab('gks')} className="tab-btn" style={{ background: activeLinkedTab === 'gks' ? '#f59e0b' : '#f8f8f8', color: activeLinkedTab === 'gks' ? '#fff' : '#888' }}>GK DETAILS</button>
                                <button onClick={() => setActiveLinkedTab('pens')} className="tab-btn" style={{ background: activeLinkedTab === 'pens' ? '#ef4444' : '#f8f8f8', color: activeLinkedTab === 'pens' ? '#fff' : '#888' }}>PENALTY MISSES</button>
                            </div>

                            {activeLinkedTab === 'lineup' && (
                                <EditableTable
                                    title="LINEUP DETAILS" color="#3b82f6"
                                    rows={newLineupRows} setRows={handleNewLineupRows}
                                    columns={lineupCols} matchId={newMatchData.MATCH_ID || '---'}
                                    emptyRow={EMPTY_LINEUP} tableName="alahly_LINEUPDETAILS"
                                    onSave={() => { }} onDelete={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))} isSaving={false}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": [newMatchData["AHLY TEAM"], newMatchData["OPPONENT TEAM"]].filter(Boolean),
                                        "PLAYER NAME OUT": newLineupRows.filter(r => String(r.STATU || '').trim() === 'اساسي' && String(r["PLAYER NAME"] || '').trim()).map(r => r["PLAYER NAME"]).sort((a, b) => a.localeCompare(b, 'ar'))
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'events' && (
                                <EditableTable
                                    title="PLAYER EVENTS" color="#8b5cf6"
                                    rows={newPlayerRows} setRows={setNewPlayerRows}
                                    columns={playerCols} matchId={newMatchData.MATCH_ID || '---'}
                                    emptyRow={EMPTY_PLAYER} tableName="alahly_PLAYERDETAILS"
                                    onSave={() => { }} onDelete={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))} isSaving={false}
                                    autoFields={{ 'EVENT_ID': (mid, rows) => `${mid}-${rows.length + 1}` }}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": [newMatchData["AHLY TEAM"], newMatchData["OPPONENT TEAM"]].filter(Boolean),
                                        "TYPE": eventTypes,
                                        "TYPE_SUB": eventSubTypes
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'gks' && (
                                <EditableTable
                                    title="GK DETAILS" color="#f59e0b"
                                    rows={newGkRows} setRows={setNewGkRows}
                                    columns={gkCols} matchId={newMatchData.MATCH_ID || '---'}
                                    emptyRow={EMPTY_GK} tableName="alahly_GKSDETAILS"
                                    onSave={() => { }} onDelete={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))} isSaving={false}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": [newMatchData["AHLY TEAM"], newMatchData["OPPONENT TEAM"]].filter(Boolean),
                                        "STATU": ["اساسي", "احتياطي"]
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'pens' && (
                                <EditableTable
                                    title="PENALTY MISSES" color="#ef4444"
                                    rows={newPenRows} setRows={setNewPenRows}
                                    columns={penCols} matchId={newMatchData.MATCH_ID || '---'}
                                    emptyRow={EMPTY_PEN} tableName="alahly_HOWPENMISSED"
                                    onSave={() => { }} onDelete={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))} isSaving={false}
                                    columnOptions={{
                                        "TEAM": [newMatchData["AHLY TEAM"], newMatchData["OPPONENT TEAM"]].filter(Boolean),
                                        "HOW MISSED?": howMissedOptions
                                    }}
                                />
                            )}
                        </div>
                    </>
                )}

                {/* ── Mode: Edit ── */}
                {mode === 'edit' && matchData && (
                    <>
                        {/* Match Details Card */}
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
                                        onClick={handleSaveMatch}
                                        disabled={isSaving}
                                        title="Save match"
                                        className="save-match-btn">
                                        {isSaving ? '⏳' : '💾'}
                                    </button>
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
                                            onFocus={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#c9a84c'; }}
                                            onBlur={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#e8e8e8'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Linked Tables */}
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA</h2>
                                </div>
                            </div>

                            <div className="linked-tabs-grid">
                                <button onClick={() => setActiveLinkedTab('lineup')} className="tab-btn" style={{ background: activeLinkedTab === 'lineup' ? '#3b82f6' : '#f8f8f8', color: activeLinkedTab === 'lineup' ? '#fff' : '#888' }}>LINEUP DETAILS</button>
                                <button onClick={() => setActiveLinkedTab('events')} className="tab-btn" style={{ background: activeLinkedTab === 'events' ? '#8b5cf6' : '#f8f8f8', color: activeLinkedTab === 'events' ? '#fff' : '#888' }}>PLAYER EVENTS</button>
                                <button onClick={() => setActiveLinkedTab('gks')} className="tab-btn" style={{ background: activeLinkedTab === 'gks' ? '#f59e0b' : '#f8f8f8', color: activeLinkedTab === 'gks' ? '#fff' : '#888' }}>GK DETAILS</button>
                                <button onClick={() => setActiveLinkedTab('pens')} className="tab-btn" style={{ background: activeLinkedTab === 'pens' ? '#ef4444' : '#f8f8f8', color: activeLinkedTab === 'pens' ? '#fff' : '#888' }}>PENALTY MISSES</button>
                            </div>

                            {activeLinkedTab === 'lineup' && (
                                <EditableTable
                                    title="LINEUP DETAILS" color="#3b82f6"
                                    rows={lineupRows} setRows={handleEditLineupRows}
                                    columns={lineupCols} matchId={matchData.MATCH_ID}
                                    emptyRow={EMPTY_LINEUP} tableName="alahly_LINEUPDETAILS"
                                    onSave={handleSaveRow} onDelete={handleDeleteRow} isSaving={isSaving}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": [matchData["AHLY TEAM"], matchData["OPPONENT TEAM"]].filter(Boolean),
                                        "PLAYER NAME OUT": lineupRows.filter(r => String(r.STATU || '').trim() === 'اساسي' && String(r["PLAYER NAME"] || '').trim()).map(r => r["PLAYER NAME"]).sort((a, b) => a.localeCompare(b, 'ar'))
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'events' && (
                                <EditableTable
                                    title="PLAYER EVENTS" color="#8b5cf6"
                                    rows={playerRows} setRows={setPlayerRows}
                                    columns={playerCols} matchId={matchData.MATCH_ID}
                                    emptyRow={EMPTY_PLAYER} tableName="alahly_PLAYERDETAILS"
                                    onSave={handleSaveRow} onDelete={handleDeleteRow} isSaving={isSaving}
                                    autoFields={{ 'EVENT_ID': (mid, rows) => `${mid}-${rows.length + 1}` }}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": [matchData["AHLY TEAM"], matchData["OPPONENT TEAM"]].filter(Boolean),
                                        "TYPE": eventTypes,
                                        "TYPE_SUB": eventSubTypes
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'gks' && (
                                <EditableTable
                                    title="GK DETAILS" color="#f59e0b"
                                    rows={gkRows} setRows={setGkRows}
                                    columns={gkCols} matchId={matchData.MATCH_ID}
                                    emptyRow={EMPTY_GK} tableName="alahly_GKSDETAILS"
                                    onSave={handleSaveRow} onDelete={handleDeleteRow} isSaving={isSaving}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": [matchData["AHLY TEAM"], matchData["OPPONENT TEAM"]].filter(Boolean),
                                        "STATU": ["اساسي", "احتياطي"]
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'pens' && (
                                <EditableTable
                                    title="PENALTY MISSES" color="#ef4444"
                                    rows={penRows} setRows={setPenRows}
                                    columns={penCols} matchId={matchData.MATCH_ID}
                                    emptyRow={EMPTY_PEN} tableName="alahly_HOWPENMISSED"
                                    onSave={handleSaveRow} onDelete={handleDeleteRow} isSaving={isSaving}
                                    columnOptions={{
                                        "TEAM": [matchData["AHLY TEAM"], matchData["OPPONENT TEAM"]].filter(Boolean),
                                        "HOW MISSED?": howMissedOptions
                                    }}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </Login_db>
    );
}
