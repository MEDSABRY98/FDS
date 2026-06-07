"use client";

import { useState, useCallback, useEffect } from "react";
import "./ahly_v_zamalek_editor.css";
import { supabase } from "../lib/supabase";
import Login_db from "../lib/Login_db";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import { useNotification } from "../lib/Notification_db";

// ── Helper ──────────────────────────────────────────────────────────────────
const EMPTY_MATCH = {
    "MATCH_ID": "", "CHAMPION SYSTEM": "", "DATE": "", "YEAR": "", "SEASON - NAME": "",
    "SEASON - NUMBER": "", "AHLY MANAGER": "", "ZAMALEK MANAGER": "", "REFEREE": "", "CHAMPION": "",
    "ROUND": "", "H-A-N": "", "STAD": "", "AHLY": "الأهلي", "GF": "", "GA": "", "ET": "",
    "PEN": "", "ZAMALEK": "الزمالك", "W-D-L": "", "CLEAN SHEET": "", "F/W-D-L": "", "Q/W-D-L": ""
};
const EMPTY_LINEUP = { "MATCH_ID": "", "MATCH MINUTE": "", "TEAM": "", "PLAYER NAME": "", "STATU": "", "PLAYER NAME OUT": "", "OUT MINUTE": "", "TOTAL MINUTE": "" };
const EMPTY_PLAYER = { "MATCH_ID": "", "EVENT_ID": "", "PARENT_EVENT_ID": "", "PLAYER NAME": "", "TEAM": "", "TYPE": "", "TYPE_SUB": "", "MINUTE": "" };

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
                        borderTop: openUpwards ? '1px solid rgba(0, 0, 0, 0.08)' : '3px solid #da1b22',
                        borderBottom: openUpwards ? '3px solid #da1b22' : '1px solid rgba(0, 0, 0, 0.08)',
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
                                    e.currentTarget.style.background = 'rgba(218, 27, 34, 0.15)';
                                    e.currentTarget.style.color = '#000';
                                    e.currentTarget.style.paddingLeft = '20px';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#333';
                                    e.currentTarget.style.paddingLeft = '14px';
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
                        color: color,
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
                                                            ? '1.5px solid rgba(218, 27, 34, 0.4)'
                                                            : (row._isDirty || row._isNew ? '1.5px solid ' + color : '1px solid #f0f0f0'),
                                                        background: isAuto ? 'rgba(218, 27, 34, 0.05)' : '#fff',
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
                                                            ? '1.5px solid rgba(218, 27, 34, 0.4)'
                                                            : (row._isDirty || row._isNew ? '1.5px solid ' + color : '1px solid #f0f0f0'),
                                                        background: isAuto ? 'rgba(218, 27, 34, 0.05)' : '#fff',
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
export default function AhlyVZamalekEditor() {
    const [searchId, setSearchId] = useState('');
    const [matchData, setMatchData] = useState(null);
    const [ahlyLineupRows, setAhlyLineupRows] = useState([]);
    const [zamalekLineupRows, setZamalekLineupRows] = useState([]);
    const [playerRows, setPlayerRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState('search'); // 'search' | 'edit' | 'new'
    const { addNotification } = useNotification();
    const [newMatchData, setNewMatchData] = useState({ ...EMPTY_MATCH });
    const [activeLinkedTab, setActiveLinkedTab] = useState('ahly_lineup');
    // Staged linked rows
    const [newAhlyRows, setNewAhlyRows] = useState([]);
    const [newZamalekRows, setNewZamalekRows] = useState([]);
    const [newPlayerRows, setNewPlayerRows] = useState([]);
    const [nextMatchNum, setNextMatchNum] = useState(null);
    const [matchFieldOptions, setMatchFieldOptions] = useState({});
    const [allPlayersList, setAllPlayersList] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [eventSubTypes, setEventSubTypes] = useState([]);

    const AUTOCOMPLETE_FIELDS = [
        'CHAMPION SYSTEM', 'CHAMPION', 'SEASON - NAME', 'SEASON - NUMBER', 'AHLY MANAGER', 'ZAMALEK MANAGER',
        'REFEREE', 'ROUND', 'H-A-N', 'STAD', 'AHLY', 'ET', 'PEN', 'ZAMALEK', 'W-D-L', 'CLEAN SHEET', 'F/W-D-L', 'Q/W-D-L'
    ];

    // Fetch all players globally from lineups and player details
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

            await fetchTableNames('alahly_vs_zamalek_LINEUPDETAILS');
            await fetchTableNames('alahly_vs_zamalek_PLAYERDETAILS');

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

            const t = await fetchUniqueCol('alahly_vs_zamalek_PLAYERDETAILS', 'TYPE');
            setEventTypes(t);
            const ts = await fetchUniqueCol('alahly_vs_zamalek_PLAYERDETAILS', 'TYPE_SUB');
            setEventSubTypes(ts);
        })();
    }, []);

    // Fetch max number + unique values for new match ID
    useEffect(() => {
        if (mode !== 'new') return;
        (async () => {
            const { data } = await supabase.from('alahly_vs_zamalek_MATCHDETAILS').select('*');
            if (!data) return;

            const nums = data.map(r => {
                const m = String(r.MATCH_ID).match(/(\d+)$/);
                return m ? parseInt(m[1], 10) : 0;
            });
            setNextMatchNum(Math.max(0, ...nums) + 1);

            const opts = {};
            AUTOCOMPLETE_FIELDS.forEach(col => {
                opts[col] = [...new Set(data.map(r => r[col]).filter(Boolean))].sort();
            });
            setMatchFieldOptions(opts);
        })();
    }, [mode]);

    // Auto-generate MATCH_ID when Champion changes
    useEffect(() => {
        if (mode !== 'new' || nextMatchNum === null) return;
        const comp = newMatchData['CHAMPION'] || '';
        setNewMatchData(prev => ({ ...prev, MATCH_ID: comp ? `${comp}${nextMatchNum}` : '' }));
    }, [newMatchData['CHAMPION'], nextMatchNum]);

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

    const handleNewAhlyRows = useCallback((action) => setNewAhlyRows(p => applyLineupLogic(p, action)), []);
    const handleNewZamalekRows = useCallback((action) => setNewZamalekRows(p => applyLineupLogic(p, action)), []);
    const handleEditAhlyRows = useCallback((action) => setAhlyLineupRows(p => applyLineupLogic(p, action)), []);
    const handleEditZamalekRows = useCallback((action) => setZamalekLineupRows(p => applyLineupLogic(p, action)), []);

    useEffect(() => {
        if (mode === 'new') {
            const initialAhly = Array.from({ length: 16 }, (_, i) => ({
                ...EMPTY_LINEUP,
                "MATCH MINUTE": "90",
                "TEAM": "الأهلي",
                "STATU": i < 11 ? "اساسي" : "احتياطي",
                "TOTAL MINUTE": i < 11 ? "90" : "",
                MATCH_ID: newMatchData.MATCH_ID || '',
                _isNew: true,
                _key: Date.now() + i
            }));
            const initialZamalek = Array.from({ length: 16 }, (_, i) => ({
                ...EMPTY_LINEUP,
                "MATCH MINUTE": "90",
                "TEAM": "الزمالك",
                "STATU": i < 11 ? "اساسي" : "احتياطي",
                "TOTAL MINUTE": i < 11 ? "90" : "",
                MATCH_ID: newMatchData.MATCH_ID || '',
                _isNew: true,
                _key: Date.now() + 100 + i
            }));
            handleNewAhlyRows(initialAhly);
            handleNewZamalekRows(initialZamalek);
        }
    }, [mode]);

    useEffect(() => {
        if (mode === 'new') {
            setNewAhlyRows(prev => prev.map(r => ({ ...r, MATCH_ID: newMatchData.MATCH_ID || '' })));
            setNewZamalekRows(prev => prev.map(r => ({ ...r, MATCH_ID: newMatchData.MATCH_ID || '' })));
        }
    }, [newMatchData.MATCH_ID, mode]);

    const addToast = (msg, type = 'success') => {
        addNotification(msg, type);
    };

    // ── Search Match ────────────────────────────────────────────────────────
    const handleSearch = async () => {
        const id = searchId.trim();
        if (!id) return;
        setLoading(true);
        try {
            const [{ data: md }, { data: ld }, { data: pd }] = await Promise.all([
                supabase.from('alahly_vs_zamalek_MATCHDETAILS').select('*').eq('MATCH_ID', id).maybeSingle(),
                supabase.from('alahly_vs_zamalek_LINEUPDETAILS').select('*').eq('MATCH_ID', id),
                supabase.from('alahly_vs_zamalek_PLAYERDETAILS').select('*').eq('MATCH_ID', id)
            ]);

            if (!md) { addToast(`Match ID "${id}" not found`, 'error'); setLoading(false); return; }
            setMatchData({ ...md });

            if (!ld || ld.length === 0) {
                const initialAhly = Array.from({ length: 16 }, (_, i) => ({
                    ...EMPTY_LINEUP,
                    "MATCH MINUTE": "90",
                    "TEAM": "الأهلي",
                    "STATU": i < 11 ? "اساسي" : "احتياطي",
                    "TOTAL MINUTE": i < 11 ? "90" : "",
                    MATCH_ID: id,
                    _isNew: true,
                    _key: Date.now() + i
                }));
                const initialZamalek = Array.from({ length: 16 }, (_, i) => ({
                    ...EMPTY_LINEUP,
                    "MATCH MINUTE": "90",
                    "TEAM": "الزمالك",
                    "STATU": i < 11 ? "اساسي" : "احتياطي",
                    "TOTAL MINUTE": i < 11 ? "90" : "",
                    MATCH_ID: id,
                    _isNew: true,
                    _key: Date.now() + 100 + i
                }));
                setAhlyLineupRows(applyLineupLogic(initialAhly, initialAhly));
                setZamalekLineupRows(applyLineupLogic(initialZamalek, initialZamalek));
            } else {
                setAhlyLineupRows(ld.filter(r => r.TEAM === "الأهلي").map((r, i) => ({ ...r, _key: i })));
                setZamalekLineupRows(ld.filter(r => r.TEAM === "الزمالك").map((r, i) => ({ ...r, _key: 100 + i })));
            }

            setPlayerRows((pd || []).map((r, i) => ({ ...r, _key: 1000 + i })));
            setMode('edit');
        } catch (e) { addToast('Error: ' + e.message, 'error'); }
        setLoading(false);
    };

    // ── Save Single Row ──────────────────────────────────────────────────────
    const handleSaveRow = useCallback(async (row, ri, tableName) => {
        if (isSaving) return;
        setIsSaving(true);
        const { _isNew, _isDirty, _key, ...cleanRow } = row;

        if (!cleanRow.MATCH_ID && matchData) cleanRow.MATCH_ID = matchData.MATCH_ID;
        if (cleanRow.ROW_ID === "" || cleanRow.ROW_ID === null || cleanRow.ROW_ID === undefined) {
            delete cleanRow.ROW_ID;
        }

        try {
            let result;
            if (_isNew) {
                result = await supabase.from(tableName).insert(cleanRow).select();
            } else {
                if (cleanRow.ROW_ID) {
                    result = await supabase.from(tableName).update(cleanRow).eq('ROW_ID', cleanRow.ROW_ID).select();
                } else {
                    result = await supabase.from(tableName).upsert(cleanRow).select();
                }
            }

            if (result.error) {
                addNotification(`Supabase Error (${tableName}):\n${result.error.message}\n${result.error.hint || ''}`, "error");
                throw result.error;
            }

            const savedRow = result.data?.[0];
            if (!savedRow) throw new Error("No data returned from DB after save success.");

            addToast(row._isNew ? 'Row inserted ✓' : 'Row updated ✓');

            if (tableName === 'alahly_vs_zamalek_LINEUPDETAILS') {
                const setter = row.TEAM === "الأهلي" ? setAhlyLineupRows : setZamalekLineupRows;
                setter(prev => prev.map((r, i) =>
                    i === ri ? { ...r, ...savedRow, _isNew: false, _isDirty: false } : r
                ));
            } else {
                setPlayerRows(prev => prev.map((r, i) =>
                    i === ri ? { ...r, ...savedRow, _isNew: false, _isDirty: false } : r
                ));
            }

        } catch (e) {
            console.error("Save Error:", e);
            addToast('Save FAILED: ' + (e.message || "Unknown error"), 'error');
        } finally {
            setIsSaving(false);
        }
    }, [matchData]);

    // ── Delete Row ───────────────────────────────────────────────────────────
    const handleDeleteRow = useCallback(async (row, ri, tableName, setterFn) => {
        if (!confirm('Delete this row?')) return;
        if (!row._isNew) {
            try {
                let remaining;
                setterFn(prev => {
                    remaining = prev.filter((_, i) => i !== ri).map(({ _isNew, _isDirty, _key, ...clean }) => clean);
                    return prev.filter((_, i) => i !== ri);
                });

                const { error: delErr } = await supabase.from(tableName).delete().eq('MATCH_ID', matchData.MATCH_ID).eq('TEAM', row.TEAM);
                if (delErr) throw delErr;
                if (remaining && remaining.length > 0) {
                    const { error: insErr } = await supabase.from(tableName).insert(remaining);
                    if (insErr) throw insErr;
                }
                addToast('Row deleted ✓', 'warn');
            } catch (e) { addToast('Delete failed: ' + e.message, 'error'); }
        } else {
            setterFn(prev => prev.filter((_, i) => i !== ri));
        }
    }, [matchData]);

    // ── Save Match Details (Global) ──────────────────────────────────────────
    const handleSaveMatch = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const { ...cleanMatchData } = matchData;
            const { error: matchErr } = await supabase.from('alahly_vs_zamalek_MATCHDETAILS').upsert(cleanMatchData);
            if (matchErr) throw matchErr;

            const saveLinkedTable = async (tableName, rows, setter) => {
                const pending = rows.filter(r => r._isNew || r._isDirty);
                const filled = pending.filter(r => r["PLAYER NAME"] && String(r["PLAYER NAME"]).trim() !== "");
                if (filled.length === 0) return;

                const toInsert = filled.filter(r => r._isNew);
                const toUpdate = filled.filter(r => !r._isNew);

                const cleanObj = (r, isNew) => {
                    const { _isNew, _isDirty, _key, ...clean } = { ...r, MATCH_ID: matchData.MATCH_ID };
                    if (isNew || !clean.ROW_ID || clean.ROW_ID === "" || clean.ROW_ID === null) {
                        delete clean.ROW_ID;
                    }
                    return clean;
                };

                let savedResults = [];
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

            await Promise.all([
                saveLinkedTable('alahly_vs_zamalek_LINEUPDETAILS', ahlyLineupRows, setAhlyLineupRows),
                saveLinkedTable('alahly_vs_zamalek_LINEUPDETAILS', zamalekLineupRows, setZamalekLineupRows),
                saveLinkedTable('alahly_vs_zamalek_PLAYERDETAILS', playerRows, setPlayerRows),
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

    // ── Create Match ──────────────────────────────────────────────────────────
    const handleCreateMatch = async () => {
        if (!newMatchData.MATCH_ID) { addToast('MATCH_ID is required', 'error'); return; }
        setIsSaving(true);
        const mid = newMatchData.MATCH_ID;
        try {
            const { ...cleanNewMatchData } = newMatchData;
            const { error: matchErr } = await supabase.from('alahly_vs_zamalek_MATCHDETAILS').insert(cleanNewMatchData);
            if (matchErr) {
                console.error("Match Insert Error:", matchErr);
                throw new Error(`Match Details: ${matchErr.message}`);
            }

            const saveStagedTable = async (tableName, rows) => {
                const filled = rows.filter(r => r["PLAYER NAME"] && String(r["PLAYER NAME"]).trim() !== "");
                if (filled.length === 0) return;

                const clean = filled.map(({ _isNew, _isDirty, _key, ...r }) => {
                    const row = { ...r, MATCH_ID: mid };
                    if (row.ROW_ID === "" || row.ROW_ID === null) delete row.ROW_ID;
                    return row;
                });

                const { error: insErr } = await supabase.from(tableName).insert(clean);
                if (insErr) {
                    console.error(`Error saving ${tableName}:`, insErr);
                    throw new Error(`${tableName}: ${insErr.message}`);
                }
            };

            await Promise.all([
                saveStagedTable('alahly_vs_zamalek_LINEUPDETAILS', [...newAhlyRows, ...newZamalekRows]),
                saveStagedTable('alahly_vs_zamalek_PLAYERDETAILS', newPlayerRows),
            ]);

            addToast('Derby Match + all linked data created ✓');
            setSearchId(mid);
            setNewAhlyRows([]); setNewZamalekRows([]); setNewPlayerRows([]);
            setMode('search');
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

    return (
        <Login_db title="DERBY EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="editor-container">
    
                {/* Mode toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
                    <div style={{ display: 'flex', width: 400, background: '#f8f8f8', borderRadius: 12, padding: 4 }}>
                        <button
                            onClick={() => { setMode('search'); setMatchData(null); }}
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: (mode === 'search' || mode === 'edit') ? '#da1b22' : 'transparent',
                                color: (mode === 'search' || mode === 'edit') ? '#fff' : '#888', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                                cursor: 'pointer', borderRadius: 10, transition: 'all 0.2s', fontSize: 13, letterSpacing: 1
                            }}>
                            SEARCH MATCH
                        </button>
                        <button
                            onClick={() => { setMode('new'); setMatchData(null); setNewMatchData({ ...EMPTY_MATCH }); }}
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: mode === 'new' ? '#da1b22' : 'transparent',
                                color: mode === 'new' ? '#fff' : '#888', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                                cursor: 'pointer', borderRadius: 10, transition: 'all 0.2s', fontSize: 13, letterSpacing: 1
                            }}>
                            ADD MATCH
                        </button>
                    </div>
                </div>

                {/* Mode: Search */}
                {mode === 'search' && (
                    <div className="portal-container">
                        <div className="portal-icon">🔎</div>
                        <div className="portal-title">ENTER DERBY MATCH ID</div>
                        <div className="portal-subtitle">Type the Match ID to load all linked records for editing</div>
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

                {/* Mode: New Match */}
                {mode === 'new' && (
                    <>
                        <div className="editor-card">
                            <div className="card-header" style={{ marginBottom: 30 }}>
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#22c55e' }} />
                                    <h2 className="card-title">NEW DERBY MATCH DETAILS</h2>
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
                                                onFocus={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#da1b22'; }}
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

                        {/* Linked tables staged */}
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#3b82f6' }} />
                                    <h2 className="card-title">LINKED TABLE DATA (STAGED)</h2>
                                </div>
                            </div>

                            <div className="linked-tabs-grid">
                                <button onClick={() => setActiveLinkedTab('ahly_lineup')} className="tab-btn" style={{ background: activeLinkedTab === 'ahly_lineup' ? '#da1b22' : '#f8f8f8', color: activeLinkedTab === 'ahly_lineup' ? '#fff' : '#888' }}>AHLY LINEUP</button>
                                <button onClick={() => setActiveLinkedTab('zamalek_lineup')} className="tab-btn" style={{ background: activeLinkedTab === 'zamalek_lineup' ? '#3b82f6' : '#f8f8f8', color: activeLinkedTab === 'zamalek_lineup' ? '#fff' : '#888' }}>ZAMALEK LINEUP</button>
                                <button onClick={() => setActiveLinkedTab('events')} className="tab-btn" style={{ background: activeLinkedTab === 'events' ? '#8b5cf6' : '#f8f8f8', color: activeLinkedTab === 'events' ? '#fff' : '#888' }}>PLAYER EVENTS</button>
                            </div>

                            {activeLinkedTab === 'ahly_lineup' && (
                                <EditableTable
                                    title="AHLY LINEUP DETAILS" color="#da1b22"
                                    rows={newAhlyRows} setRows={handleNewAhlyRows}
                                    columns={lineupCols} matchId={newMatchData.MATCH_ID || '---'}
                                    emptyRow={EMPTY_LINEUP} tableName="alahly_vs_zamalek_LINEUPDETAILS"
                                    onSave={() => { }} onDelete={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))} isSaving={false}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": ["الأهلي"],
                                        "PLAYER NAME OUT": newAhlyRows.filter(r => String(r.STATU || '').trim() === 'اساسي' && String(r["PLAYER NAME"] || '').trim()).map(r => r["PLAYER NAME"]).sort((a, b) => a.localeCompare(b, 'ar'))
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'zamalek_lineup' && (
                                <EditableTable
                                    title="ZAMALEK LINEUP DETAILS" color="#3b82f6"
                                    rows={newZamalekRows} setRows={handleNewZamalekRows}
                                    columns={lineupCols} matchId={newMatchData.MATCH_ID || '---'}
                                    emptyRow={EMPTY_LINEUP} tableName="alahly_vs_zamalek_LINEUPDETAILS"
                                    onSave={() => { }} onDelete={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))} isSaving={false}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": ["الزمالك"],
                                        "PLAYER NAME OUT": newZamalekRows.filter(r => String(r.STATU || '').trim() === 'اساسي' && String(r["PLAYER NAME"] || '').trim()).map(r => r["PLAYER NAME"]).sort((a, b) => a.localeCompare(b, 'ar'))
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'events' && (
                                <EditableTable
                                    title="PLAYER EVENTS" color="#8b5cf6"
                                    rows={newPlayerRows} setRows={setNewPlayerRows}
                                    columns={playerCols} matchId={newMatchData.MATCH_ID || '---'}
                                    emptyRow={EMPTY_PLAYER} tableName="alahly_vs_zamalek_PLAYERDETAILS"
                                    onSave={() => { }} onDelete={(row, ri, _, setter) => setter(prev => prev.filter((_, i) => i !== ri))} isSaving={false}
                                    autoFields={{ 'EVENT_ID': (mid, rows) => `${mid}-${rows.length + 1}` }}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": ["الأهلي", "الزمالك"],
                                        "TYPE": eventTypes,
                                        "TYPE_SUB": eventSubTypes
                                    }}
                                />
                            )}
                        </div>
                    </>
                )}

                {/* Mode: Edit */}
                {mode === 'edit' && matchData && (
                    <>
                        <div className="editor-card">
                            <div className="card-header">
                                <div className="card-title-wrap">
                                    <div className="card-indicator" style={{ background: '#da1b22' }} />
                                    <div>
                                        <h2 className="card-title">MATCH DETAILS</h2>
                                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#888', marginTop: 2 }}>ID: {matchData.MATCH_ID}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        onClick={() => { setMode('search'); setMatchData(null); }}
                                        title="Back to search"
                                        className="action-btn-circle">←</button>
                                    <button
                                        onClick={handleSaveMatch}
                                        disabled={isSaving}
                                        title="Save Derby Match"
                                        className="save-match-btn">{isSaving ? '⏳' : '💾'}</button>
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
                                            onFocus={e => { if (field !== 'MATCH_ID') e.target.style.borderColor = '#da1b22'; }}
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
                                <button onClick={() => setActiveLinkedTab('ahly_lineup')} className="tab-btn" style={{ background: activeLinkedTab === 'ahly_lineup' ? '#da1b22' : '#f8f8f8', color: activeLinkedTab === 'ahly_lineup' ? '#fff' : '#888' }}>AHLY LINEUP</button>
                                <button onClick={() => setActiveLinkedTab('zamalek_lineup')} className="tab-btn" style={{ background: activeLinkedTab === 'zamalek_lineup' ? '#3b82f6' : '#f8f8f8', color: activeLinkedTab === 'zamalek_lineup' ? '#fff' : '#888' }}>ZAMALEK LINEUP</button>
                                <button onClick={() => setActiveLinkedTab('events')} className="tab-btn" style={{ background: activeLinkedTab === 'events' ? '#8b5cf6' : '#f8f8f8', color: activeLinkedTab === 'events' ? '#fff' : '#888' }}>PLAYER EVENTS</button>
                            </div>

                            {activeLinkedTab === 'ahly_lineup' && (
                                <EditableTable
                                    title="AHLY LINEUP DETAILS" color="#da1b22"
                                    rows={ahlyLineupRows} setRows={handleEditAhlyRows}
                                    columns={lineupCols} matchId={matchData.MATCH_ID}
                                    emptyRow={{ ...EMPTY_LINEUP, TEAM: "الأهلي" }} tableName="alahly_vs_zamalek_LINEUPDETAILS"
                                    onSave={handleSaveRow} onDelete={handleDeleteRow} isSaving={isSaving}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": ["الأهلي"],
                                        "PLAYER NAME OUT": ahlyLineupRows.filter(r => String(r.STATU || '').trim() === 'اساسي' && String(r["PLAYER NAME"] || '').trim()).map(r => r["PLAYER NAME"]).sort((a, b) => a.localeCompare(b, 'ar'))
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'zamalek_lineup' && (
                                <EditableTable
                                    title="ZAMALEK LINEUP DETAILS" color="#3b82f6"
                                    rows={zamalekLineupRows} setRows={handleEditZamalekRows}
                                    columns={lineupCols} matchId={matchData.MATCH_ID}
                                    emptyRow={{ ...EMPTY_LINEUP, TEAM: "الزمالك" }} tableName="alahly_vs_zamalek_LINEUPDETAILS"
                                    onSave={handleSaveRow} onDelete={handleDeleteRow} isSaving={isSaving}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": ["الزمالك"],
                                        "PLAYER NAME OUT": zamalekLineupRows.filter(r => String(r.STATU || '').trim() === 'اساسي' && String(r["PLAYER NAME"] || '').trim()).map(r => r["PLAYER NAME"]).sort((a, b) => a.localeCompare(b, 'ar'))
                                    }}
                                />
                            )}
                            {activeLinkedTab === 'events' && (
                                <EditableTable
                                    title="PLAYER EVENTS" color="#8b5cf6"
                                    rows={playerRows} setRows={setPlayerRows}
                                    columns={playerCols} matchId={matchData.MATCH_ID}
                                    emptyRow={EMPTY_PLAYER} tableName="alahly_vs_zamalek_PLAYERDETAILS"
                                    onSave={handleSaveRow} onDelete={handleDeleteRow} isSaving={isSaving}
                                    autoFields={{ 'EVENT_ID': (mid, rows) => `${mid}-${rows.length + 1}` }}
                                    columnOptions={{
                                        "PLAYER NAME": allPlayersList,
                                        "TEAM": ["الأهلي", "الزمالك"],
                                        "TYPE": eventTypes,
                                        "TYPE_SUB": eventSubTypes
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
