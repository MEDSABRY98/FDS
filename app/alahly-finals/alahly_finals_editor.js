"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Loader2, Shield, Clock, Users, Save, Trash2, Search, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { AlAhlyFinalsService } from "../alahly/alahly_finals_service";
import SearchBar_db from "../lib/SearchBar_db";
import NoData_db from "../lib/NoData_db";
import Login_db from "../lib/Login_db";
import "./alahly_finals_editor.css";

// ── Components ───────────────────────────────────────────────────────────────

function AutocompleteInput({ value, onChange, options = [], placeholder, style, disabled }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || '');
    const [rect, setRect] = useState(null);
    const ref = useState(() => ({ current: null }))[0];

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
        const updateRect = () => { if (ref.current) setRect(ref.current.getBoundingClientRect()); };
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
                className="premium-input-field"
                onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
                onFocus={() => { setOpen(true); if (ref.current) setRect(ref.current.getBoundingClientRect()); }}
                onBlur={() => setTimeout(() => setOpen(false), 180)}
                style={{ ...style }}
                autoComplete="off"
            />
            {open && filtered.length > 0 && !disabled && rect && (
                <div className="premium-scroll autocomplete-dropdown" style={{
                    position: 'fixed',
                    left: rect.left,
                    width: rect.width,
                    zIndex: 9999999,
                    top: rect.bottom + 8,
                    maxHeight: 280,
                    overflowY: 'auto'
                }}>
                    {filtered.map((opt, i) => (
                        <div key={i} className="dropdown-item" onMouseDown={() => handleSelect(opt)} dir="auto">
                            <div className="opt-text">{opt}</div>
                            <div className="opt-dot" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Toast({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast-card ${t.type}`}>
                    <div className="toast-icon">
                        {t.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    </div>
                    <div className="toast-content">
                        <div className="toast-title">{t.type === 'error' ? 'SYSTEM ERROR' : 'SUCCESS'}</div>
                        <div className="toast-msg">{t.msg}</div>
                    </div>
                    <div className="toast-progress" />
                </div>
            ))}
        </div>
    );
}

function DateSelectionModal({ matches, onSelect, onClose }) {
    if (!matches || matches.length === 0) return null;
    
    return (
        <div className="premium-modal-overlay" onClick={onClose}>
            <div className="date-picker-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>MULTI-STAGE DISCOVERED</h2>
                    <button className="close-x" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="date-selection-grid">
                        {matches.map((m, i) => (
                            <button key={i} className="selection-card" onClick={() => onSelect(m)}>
                                <div className="card-top">
                                    <Clock size={16} />
                                    <span>{m.DATE}</span>
                                </div>
                                <div className="card-bottom">
                                    <span className="opp">{m["OPPONENT TEAM"]}</span>
                                    <span className="score">{m.GF} - {m.GA}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function EditableTable({ title, color, rows, setRows, columns, parentId, emptyRow, onSave, isSaving, columnOptions = {}, autoFields = {} }) {
    const handleAdd = () => {
        let newRow = { ...emptyRow, _isNew: true, _key: Date.now() };
        
        // Apply auto-generation logic
        Object.keys(autoFields).forEach(fieldKey => {
            const generator = autoFields[fieldKey];
            if (typeof generator === 'function') {
                newRow[fieldKey] = generator(parentId, rows);
            }
        });

        if (columns.includes("FINAL_ID") && !newRow["FINAL_ID"]) newRow["FINAL_ID"] = parentId;
        setRows([...rows, newRow]);
    };

    const handleRemove = (ri) => {
        setRows(rows.filter((_, i) => i !== ri));
    };

    return (
        <div className="editable-table-section">
            <div className="table-header">
                <div className="header-label">
                    <div className="indicator" style={{ background: color }} />
                    <h3>{title} <span className="row-count">({rows.length} rows)</span></h3>
                </div>
                <button className="add-row-btn" onClick={handleAdd}>
                    <span className="plus-sign">+</span> ADD ROW
                </button>
            </div>

            <div className="table-viewport-container">
                <div className="table-viewport premium-scroll">
                    <table className="premium-editor-table">
                        <thead>
                            <tr>
                                {columns.map(col => <th key={col}>{col}</th>)}
                                <th className="act-col">ACT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr key={row._key || ri} className={row._isNew ? 'new-row' : ''}>
                                    {columns.map(col => (
                                        <td key={col}>
                                            {columnOptions[col] ? (
                                                <AutocompleteInput
                                                    value={row[col] ?? ''}
                                                    options={columnOptions[col]}
                                                    onChange={val => setRows(prev => prev.map((r, i) => i === ri ? { ...r, [col]: val, _isDirty: true } : r))}
                                                />
                                            ) : (
                                                <input
                                                    value={row[col] ?? ''}
                                                    className="table-cell-input"
                                                    onChange={e => setRows(prev => prev.map((r, i) => i === ri ? { ...r, [col]: e.target.value, _isDirty: true } : r))}
                                                />
                                            )}
                                        </td>
                                    ))}
                                    <td className="act-col">
                                        <button className="del-btn" onClick={() => handleRemove(ri)}>✕</button>
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
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AlAhlyFinalsEditor({ matchesData, lineupsData, playersData }) {
    const [mode, setMode] = useState("SEARCH");
    const [searchId, setSearchId] = useState("");
    const [pendingMatches, setPendingMatches] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [activeTab, setActiveTab] = useState("lineup");

    const [matchForm, setMatchForm] = useState({});
    const [lineupRows, setLineupRows] = useState([]);
    const [eventRows, setEventRows] = useState([]);

    const addToast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const suggestions = useMemo(() => ({
        champions: [...new Set(matchesData.map(m => m.CHAMPION).filter(Boolean))].sort(),
        seasons: [...new Set(matchesData.map(m => m["SEASON - NAME"]).filter(Boolean))].sort(),
        managers: [...new Set([...matchesData.map(m => m["AHLY MANAGER"]), ...matchesData.map(m => m["OPPONENT MANAGER"])].filter(Boolean))].sort(),
        opponents: [...new Set(matchesData.map(m => m["OPPONENT TEAM"]).filter(Boolean))].sort(),
        championSystems: [...new Set(matchesData.map(m => m["CHAMPION SYSTEM"]).filter(Boolean))].sort(),
        referees: [...new Set(matchesData.map(m => m["REFREE"]).filter(Boolean))].sort(),
        hanOptions: [...new Set(matchesData.map(m => m["H-A-N"]).filter(Boolean))].sort(),
        etOptions: [...new Set(matchesData.map(m => m["ET"]).filter(Boolean))].sort(),
        penOptions: [...new Set(matchesData.map(m => m["PEN"]).filter(Boolean))].sort(),
        wdlMatchOptions: [...new Set(matchesData.map(m => m["W-D-L MATCH"]).filter(Boolean))].sort(),
        wdlFinalOptions: [...new Set(matchesData.map(m => m["W-D-L FINAL"]).filter(Boolean))].sort(),
        players: [...new Set([...lineupsData.map(l => l["PLAYER NAME"]), ...playersData.map(p => p["PLAYER NAME"])].filter(Boolean))].sort(),
        eventTypes: ["GOAL", "RED CARD", "YELLOW CARD", "ASSIST", "PENALTY GOAL", "OWN GOAL"]
    }), [matchesData, lineupsData, playersData]);

    // --- Date Formatting Helpers ---
    const standardizeDate = (d) => {
        if (!d) return "";
        const s = String(d).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
        if (s.includes('/')) {
            const parts = s.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        try {
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
        } catch (e) {}
        return s;
    };

    const formatToInputDate = (dateStr) => {
        return standardizeDate(dateStr);
    };

    const formatToDBDate = (dateStr) => {
        // If the user says the date is YYYY-MM-DD, we should keep it that way for the DB
        return standardizeDate(dateStr);
    };

    const applyLineupLogic = (prev, action) => {
        const next = typeof action === 'function' ? action(prev) : action;
        const changedRow = next.find((r, i) => r["MATCH MINUTE"] !== prev[i]?.["MATCH MINUTE"]);
        const matchMinuteRef = changedRow ? changedRow["MATCH MINUTE"] : (next[0]?.["MATCH MINUTE"] || '90');

        return next.map((row) => {
            let outMin = parseInt(row["OUT MINUTE"]);
            let matchMin = parseInt(matchMinuteRef) || 90;
            let total = "";

            if (row.STATU === 'اساسي' || row.STATU === 'أساسي') {
                const playerName = String(row["PLAYER NAME"] || "").trim();
                const subOutRow = playerName ? next.find(r => String(r["PLAYER NAME OUT"] || "").trim() === playerName) : null;
                
                if (subOutRow) {
                    const actualOutMin = parseInt(subOutRow["OUT MINUTE"]);
                    total = !isNaN(actualOutMin) ? actualOutMin : matchMin;
                } else {
                    total = matchMin;
                }
            } else if (row.STATU === 'احتياطي' || row.STATU === 'احتياط') {
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

    const handleLineupRowsUpdate = useCallback((action) => setLineupRows(p => applyLineupLogic(p, action)), []);

    const handleSearch = () => {
        const id = searchId.trim().toUpperCase();
        if (!id) return;
        setLoading(true);
        setPendingMatches([]);
        
        // Search in both FINAL_ID and MATCH_ID for robustness
        const matches = matchesData.filter(m => 
            String(m.FINAL_ID || '').trim().toUpperCase() === id ||
            String(m.MATCH_ID || '').trim().toUpperCase() === id
        );

        if (matches.length === 0) {
            addToast("No records found for this ID.", "error");
        } else if (matches.length === 1) {
            loadMatch(matches[0]);
        } else {
            setPendingMatches(matches);
            setShowModal(true);
        }
        setLoading(false);
    };

    const loadMatch = (match) => {
        const inputDate = formatToInputDate(match.DATE);
        setMatchForm({ ...match, DATE: inputDate });
        
        const matchFinalId = String(match.FINAL_ID || '').trim().toUpperCase();
        const matchDate = standardizeDate(match.DATE);

        const relatedLineups = lineupsData.filter(l => 
            String(l.FINAL_ID || '').trim().toUpperCase() === matchFinalId && 
            standardizeDate(l.DATE) === matchDate
        );

        const relatedEvents = playersData.filter(p => {
            const pFinalId = String(p["FINAL ID"] || p.FINAL_ID || '').trim().toUpperCase();
            return pFinalId === matchFinalId && standardizeDate(p.DATE) === matchDate;
        });

        setLineupRows(relatedLineups.map((l, i) => ({ ...l, _key: i })));
        setEventRows(relatedEvents.map((e, i) => ({ 
            ...e, 
            "FINAL_ID": e["FINAL ID"] || e.FINAL_ID,
            _key: i 
        })));
        setMode("EDIT");
        setSelectedMatch(match);
        setShowModal(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const finalId = matchForm.FINAL_ID;
            const dbDate = formatToDBDate(matchForm.DATE);

            const updatedMatch = { ...matchForm, DATE: dbDate };
            const updatedLineups = lineupRows.map(l => {
                const { _isNew, _isDirty, _key, ...clean } = l;
                return { ...clean, FINAL_ID: finalId, DATE: dbDate };
            });
            const updatedEvents = eventRows.map(e => {
                const { _isNew, _isDirty, _key, ...clean } = e;
                return { ...clean, "FINAL ID": finalId, DATE: dbDate };
            });

            await AlAhlyFinalsService.upsertMatchDetails(updatedMatch);
            await AlAhlyFinalsService.updateMatchLineups(finalId, dbDate, updatedLineups);
            await AlAhlyFinalsService.updateMatchEvents(finalId, dbDate, updatedEvents);

            addToast("Match and all linked records saved successfully!");


            setMode("SEARCH");
            setSelectedMatch(null);
        } catch (err) {
            console.error("Sync Error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // ── Side Effects for Mode & Sync ─────────────────────────────────────────

    // Auto-populate 16 rows when creating a new match
    useEffect(() => {
        if (mode === 'CREATE') {
            const initialLineup = Array.from({ length: 16 }, (_, i) => ({
                "PLAYER NAME": "",
                "PLAYER NAME OUT": "",
                "TEAM": "الأهلي",
                "STATU": i < 11 ? "اساسي" : "احتياطي",
                "MATCH MINUTE": "90",
                "OUT MINUTE": "",
                "TOTAL MINUTE": i < 11 ? "90" : "",
                FINAL_ID: matchForm.FINAL_ID || '',
                DATE: matchForm.DATE || '',
                _isNew: true,
                _isDirty: true,
                _key: Date.now() + i
            }));
            setLineupRows(applyLineupLogic([], initialLineup));
        }
    }, [mode]);

    // Sync IDs from matchForm to existing lineup rows
    useEffect(() => {
        if (mode === 'CREATE' || mode === 'EDIT') {
            setLineupRows(prev => prev.map(r => ({ 
                ...r, 
                FINAL_ID: matchForm.FINAL_ID || '', 
                DATE: matchForm.DATE || '' 
            })));
            setEventRows(prev => prev.map(r => ({ 
                ...r, 
                "FINAL ID": matchForm.FINAL_ID || '', 
                DATE: matchForm.DATE || '' 
            })));
        }
    }, [matchForm.FINAL_ID, matchForm.DATE, mode]);

    const renderSearchPortal = () => (
        <div className="search-portal-wrap fade-in">
            <div className="search-portal-card">
                <div className="portal-icon">🔎</div>
                <div className="portal-text-zone">
                    <h1 className="portal-title">ENTER MATCH ID</h1>
                    <p className="portal-subtitle">Type the Match ID to load all linked records for editing</p>
                </div>

                <div className="portal-search-group">
                    <SearchBar_db value={searchId} onChange={setSearchId} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Match ID..." />
                    <button className="portal-execute-btn" onClick={handleSearch} disabled={loading}>
                        {loading ? 'Loading...' : 'LOAD →'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderEditor = () => (
        <div className="editor-stacked-layout fade-in">
            <Toast toasts={toasts} />

            {/* ── Match Details Card ── */}
            <div className="editor-card main-form-card">
                <div className="card-header">
                    <div className="header-left">
                        <div className="indicator-gold" />
                        <div>
                            <h2>{mode === "CREATE" ? "NEW MATCH DETAILS" : "MATCH DETAILS"}</h2>
                            <span className="sub-id">ID: {matchForm.FINAL_ID}</span>
                        </div>
                    </div>
                    {mode === "EDIT" && (
                        <div className="header-right">
                            <button className="nav-back-btn" onClick={() => { setMode("SEARCH"); setSelectedMatch(null); }}>←</button>
                            <button className="global-save-btn" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? '⏳' : '💾'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="field-grid-auto">
                    {[
                        { label: "FINAL_ID", key: "FINAL_ID", type: "text" },
                        { label: "MATCH_ID", key: "MATCH_ID", type: "text" },
                        { label: "CHAMPION SYSTEM", key: "CHAMPION SYSTEM", type: "suggest", options: suggestions.championSystems },
                        { label: "DATE", key: "DATE", type: "date" },
                        { label: "CHAMPION", key: "CHAMPION", type: "suggest", options: suggestions.champions },
                        { label: "SEASON - NAME", key: "SEASON - NAME", type: "suggest", options: suggestions.seasons },
                        { label: "REFEREE", key: "REFREE", type: "suggest", options: suggestions.referees },
                        { label: "H-A-N", key: "H-A-N", type: "suggest", options: suggestions.hanOptions },
                        { label: "AHLY MANAGER", key: "AHLY MANAGER", type: "suggest", options: suggestions.managers },
                        { label: "OPPONENT MANAGER", key: "OPPONENT MANAGER", type: "suggest", options: suggestions.managers },
                        { label: "OPPONENT TEAM", key: "OPPONENT TEAM", type: "suggest", options: suggestions.opponents },
                    ].map(f => (
                        <div key={f.key} className="field-unit">
                            <label className="field-label">{f.label}</label>
                            {f.type === "suggest" ? (
                                <AutocompleteInput value={matchForm[f.key]} options={f.options} onChange={val => setMatchForm({ ...matchForm, [f.key]: val })} />
                            ) : (
                                <input 
                                    type={f.type === "date" ? "date" : "text"} 
                                    value={matchForm[f.key] || ""} 
                                    onChange={e => setMatchForm({ ...matchForm, [f.key]: e.target.value })} 
                                    className="premium-input-field" 
                                    disabled={f.key === 'FINAL_ID' && mode === 'EDIT'} 
                                />
                            )}
                        </div>
                    ))}
                    <div className="field-unit">
                        <label className="field-label">GF</label>
                        <input type="number" value={matchForm.GF || 0} onChange={e => setMatchForm({ ...matchForm, GF: e.target.value })} className="premium-input-field" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                    </div>
                    <div className="field-unit">
                        <label className="field-label">GA</label>
                        <input type="number" value={matchForm.GA || 0} onChange={e => setMatchForm({ ...matchForm, GA: e.target.value })} className="premium-input-field" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                    </div>
                    <div className="field-unit">
                        <label className="field-label">ET</label>
                        <AutocompleteInput value={matchForm["ET"]} options={suggestions.etOptions} onChange={val => setMatchForm({ ...matchForm, "ET": val })} />
                    </div>
                    <div className="field-unit">
                        <label className="field-label">PEN</label>
                        <AutocompleteInput value={matchForm["PEN"]} options={suggestions.penOptions} onChange={val => setMatchForm({ ...matchForm, "PEN": val })} />
                    </div>
                    <div className="field-unit">
                        <label className="field-label">W-D-L MATCH</label>
                        <AutocompleteInput value={matchForm["W-D-L MATCH"]} options={suggestions.wdlMatchOptions} onChange={val => setMatchForm({ ...matchForm, "W-D-L MATCH": val })} />
                    </div>
                    <div className="field-unit">
                        <label className="field-label">W-D-L FINAL</label>
                        <AutocompleteInput value={matchForm["W-D-L FINAL"]} options={suggestions.wdlFinalOptions} onChange={val => setMatchForm({ ...matchForm, "W-D-L FINAL": val })} />
                    </div>
                </div>

                {mode === "CREATE" && (
                    <div className="main-action-wrap">
                        <button className="main-action-btn" onClick={handleSave} disabled={isSaving}>
                            <span>{isSaving ? '⏳' : '✓'}</span>
                            {isSaving ? 'CREATING MATCH...' : 'CREATE MATCH'}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Linked Tables Card ── */}
            <div className="editor-card linked-tables-card">
                <div className="card-header">
                    <div className="header-left">
                        <div className="indicator-blue" />
                        <h2>LINKED TABLE DATA</h2>
                    </div>
                </div>

                <div className="table-tab-grid">
                    <button className={activeTab === 'lineup' ? 'active lineup' : ''} onClick={() => setActiveTab('lineup')}>LINEUP DETAILS</button>
                    <button className={activeTab === 'events' ? 'active events' : ''} onClick={() => setActiveTab('events')}>PLAYER EVENTS</button>
                    <button className="disabled" disabled>GK DETAILS</button>
                    <button className="disabled" disabled>PENALTY MISSES</button>
                </div>

                <div className="tab-pane-container premium-scroll">
                    {activeTab === 'lineup' && (
                        <EditableTable
                            title="LINEUP DETAILS"
                            color="#3b82f6"
                            rows={lineupRows}
                            setRows={handleLineupRowsUpdate}
                            parentId={matchForm.FINAL_ID}
                            columns={["FINAL_ID", "MATCH MINUTE", "TEAM", "PLAYER NAME", "STATU", "PLAYER NAME OUT", "OUT MINUTE", "TOTAL MINUTE"]}
                            emptyRow={{ "PLAYER NAME": "", TEAM: "الأهلي", STATU: "اساسي", "PLAYER NAME OUT": "", "MATCH MINUTE": "90", "TOTAL MINUTE": "90" }}
                            columnOptions={{
                                "PLAYER NAME": suggestions.players,
                                "TEAM": ["الأهلي", matchForm["OPPONENT TEAM"]].filter(Boolean),
                                "STATU": ["اساسي", "احتياطي"],
                                "PLAYER NAME OUT": lineupRows.filter(r => (String(r.STATU || '').trim() === 'اساسي' || String(r.STATU || '').trim() === 'أساسي') && String(r["PLAYER NAME"] || '').trim()).map(r => r["PLAYER NAME"]).sort((a, b) => a.localeCompare(b, 'ar'))
                            }}
                        />
                    )}
                    {activeTab === 'events' && (
                        <EditableTable
                            title="PLAYER EVENTS"
                            color="#8b5cf6"
                            rows={eventRows}
                            setRows={setEventRows}
                            parentId={matchForm.FINAL_ID}
                            columns={["FINAL_ID", "EVENT_ID", "PARENT_EVENT_ID", "PLAYER NAME", "TEAM", "TYPE", "TYPE_SUB", "MINUTE"]}
                            emptyRow={{ "FINAL_ID": "", "EVENT_ID": "", "PARENT_EVENT_ID": "", "PLAYER NAME": "", TEAM: "الأهلي", TYPE: "GOAL", TYPE_SUB: "", MINUTE: "" }}
                            autoFields={{ 
                                "EVENT_ID": (id, rows) => `${id}-${rows.length + 1}`,
                                "FINAL_ID": (id) => id 
                            }}
                            columnOptions={{
                                "PLAYER NAME": suggestions.players,
                                "TEAM": ["الأهلي", matchForm["OPPONENT TEAM"]].filter(Boolean),
                                "TYPE": suggestions.eventTypes
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div className="alahly-editor-sync-page">
                <div className="editor-top-nav">
                    <div className="nav-brand">
                        <h1 className="main-title">MATCH <span className="gold">EDITOR</span></h1>
                    </div>
                    <div className="nav-mode-toggles">
                        <button className={`mode-btn ${mode === "SEARCH" || mode === "EDIT" ? "active" : ""}`} onClick={() => { setMode("SEARCH"); setSelectedMatch(null); }}>
                            <Search size={20} />
                        </button>
                        <button className={`mode-btn ${mode === "CREATE" ? "active" : ""}`} onClick={() => {
                            const maxId = matchesData.reduce((max, match) => {
                                const parts = String(match.FINAL_ID || '').split('-');
                                const num = parseInt(parts[1]);
                                return !isNaN(num) && num > max ? num : max;
                            }, 0);
                            const nextId = `FINAL-${(maxId + 1).toString().padStart(4, '0')}`;

                            setMode("CREATE");
                            setMatchForm({ FINAL_ID: nextId, DATE: "", "AHLY TEAM": "الأهلي" });
                            setLineupRows([]);
                            setEventRows([]);
                        }}>
                            ➕
                        </button>
                    </div>
                </div>

                {showModal && <DateSelectionModal matches={pendingMatches} onSelect={loadMatch} onClose={() => setShowModal(false)} />}

                {mode === "SEARCH" && !selectedMatch && renderSearchPortal()}
                {(mode === "EDIT" || mode === "CREATE") && renderEditor()}
            </div>
            <style jsx>{`
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes toastSlideIn { from { opacity: 0; transform: translateX(50px) scale(0.9); } to { opacity: 1; transform: translateX(0) scale(1); } }
                @keyframes toastProgress { from { width: 100%; } to { width: 0%; } }
                .fade-in { animation: slideIn 0.4s ease-out; }
            `}</style>
        </Login_db>
    );
}
