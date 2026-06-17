"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase, fetchCatalogDisplayNames } from "../../lib/supabase";
import { useNotification } from "../../lib/Notification_db";
import { Save, Plus, Trash2 } from "lucide-react";
import "./egypt_nt_db_squad_editor.css";

const EMPTY_ROW = {
    PLAYERNAME: "",
    POSITION: "",
    CLUB: "",
    SEASON: "",
    CHAMPION: ""
};

function AutocompleteInput({ value, onChange, options = [], placeholder, className, style, disabled }) {
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
                className={className}
                onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
                onFocus={() => { setOpen(true); if (ref.current) setRect(ref.current.getBoundingClientRect()); }}
                onBlur={() => setTimeout(() => setOpen(false), 180)}
                style={{ ...style, width: '100%', boxSizing: 'border-box' }}
                autoComplete="off"
            />
            {open && filtered.length > 0 && !disabled && rect && typeof window !== 'undefined' && createPortal(
                (() => {
                    const spaceBelow = window.innerHeight - rect.bottom;
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
                })(), document.body
            )}
        </div>
    );
}

export default function EgyptNTSquadEditor() {
    const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();
    const [suggestions, setSuggestions] = useState({
        players: [],
        positions: [],
        clubs: [],
        seasons: [],
        champions: []
    });

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { data: squadData, error: sErr } = await supabase.from('egy_NT_SQUAD').select('POSITION, CLUB, SEASON, CHAMPION');
                if (sErr) throw sErr;

                const players = await fetchCatalogDisplayNames('db_PLAYERS');

                setSuggestions({
                    players,
                    positions: [...new Set(squadData.map(d => d.POSITION).filter(Boolean))].sort(),
                    clubs: [...new Set(squadData.map(d => d.CLUB).filter(Boolean))].sort(),
                    seasons: [...new Set(squadData.map(d => d.SEASON).filter(Boolean))].sort(),
                    champions: [...new Set(squadData.map(d => d.CHAMPION).filter(Boolean))].sort()
                });
            } catch (err) {
                console.error("Error fetching suggestions:", err);
            }
        };

        fetchSuggestions();
        window.addEventListener("nameDisplayLangChanged", fetchSuggestions);
        return () => window.removeEventListener("nameDisplayLangChanged", fetchSuggestions);
    }, []);

    const handleAddRow = () => {
        setRows([...rows, { ...EMPTY_ROW }]);
    };

    const handleRemoveRow = (index) => {
        const newRows = [...rows];
        newRows.splice(index, 1);
        if (newRows.length === 0) newRows.push({ ...EMPTY_ROW });
        setRows(newRows);
    };

    const handleChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleSave = async () => {
        // Filter out completely empty rows
        const validRows = rows.filter(r => r.PLAYERNAME.trim() !== "");
        
        if (validRows.length === 0) {
            addNotification('No valid data to save. Please enter at least a player name.', 'error');
            return;
        }

        setIsSaving(true);

        try {
            // 1. Fetch all existing ROW_IDs to find the true max numeric value safely
            const { data: existingIds, error: idError } = await supabase
                .from("egy_NT_SQUAD")
                .select("ROW_ID");

            if (idError) throw idError;

            let currentMaxNum = 0;
            if (existingIds && existingIds.length > 0) {
                existingIds.forEach(item => {
                    if (item.ROW_ID) {
                        const match = String(item.ROW_ID).match(/\d+/);
                        if (match) {
                            const num = parseInt(match[0], 10);
                            if (num > currentMaxNum) {
                                currentMaxNum = num;
                            }
                        }
                    }
                });
            }

            // 2. Assign the new incremented ROW_IDs to our valid rows
            const rowsToInsert = validRows.map((row, index) => {
                const nextNum = currentMaxNum + 1 + index;
                const nextRowId = `R-${String(nextNum).padStart(4, '0')}`;
                return {
                    ...row,
                    ROW_ID: nextRowId
                };
            });

            // 3. Insert into the database
            const { data, error } = await supabase
                .from("egy_NT_SQUAD")
                .insert(rowsToInsert);

            if (error) throw error;

            addNotification('Squad data saved successfully!', 'success');
            setRows([{ ...EMPTY_ROW }]); // Reset on success
            
        } catch (error) {
            console.error("Error saving squad data:", error);
            addNotification(`Error saving data: ${error.message || error.details || 'Unknown Error'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="tab-content" id="tab-add-squad">
            <div className="squad-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingBottom: '50px' }}>
                <div className="section-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '30px', direction: 'ltr' }}>
                        <div className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
                            ADD <span className="accent">SQUAD</span>
                        </div>
                    </div>
                    <div className="gold-line"></div>
                </div>

                <div className="squad-editor-container">
                    <table className="squad-editor-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>PLAYER NAME</th>
                                <th style={{ width: '15%' }}>POSITION</th>
                                <th style={{ width: '25%' }}>CLUB</th>
                                <th style={{ width: '15%' }}>CHAMPION</th>
                                <th style={{ width: '15%' }}>SEASON</th>
                                <th style={{ width: '5%', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <AutocompleteInput 
                                            value={row.PLAYERNAME}
                                            options={suggestions.players}
                                            onChange={(val) => handleChange(idx, 'PLAYERNAME', val)}
                                            className="squad-editor-input"
                                            placeholder="Enter Player Name"
                                        />
                                    </td>
                                    <td>
                                        <AutocompleteInput 
                                            value={row.POSITION}
                                            options={suggestions.positions}
                                            onChange={(val) => handleChange(idx, 'POSITION', val)}
                                            className="squad-editor-input"
                                            placeholder="Ex: GK, DF, MF, FW"
                                        />
                                    </td>
                                    <td>
                                        <AutocompleteInput 
                                            value={row.CLUB}
                                            options={suggestions.clubs}
                                            onChange={(val) => handleChange(idx, 'CLUB', val)}
                                            className="squad-editor-input"
                                            placeholder="Enter Club"
                                        />
                                    </td>
                                    <td>
                                        <AutocompleteInput 
                                            value={row.CHAMPION}
                                            options={suggestions.champions}
                                            onChange={(val) => handleChange(idx, 'CHAMPION', val)}
                                            className="squad-editor-input"
                                            placeholder="Ex: AFCON 2023"
                                        />
                                    </td>
                                    <td>
                                        <AutocompleteInput 
                                            value={row.SEASON}
                                            options={suggestions.seasons}
                                            onChange={(val) => handleChange(idx, 'SEASON', val)}
                                            className="squad-editor-input"
                                            placeholder="Ex: 2023/2024"
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleRemoveRow(idx)}
                                            className="squad-editor-btn-remove"
                                            title="Remove Row"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
                        <button 
                            className="squad-editor-btn-add"
                            onClick={handleAddRow}
                            title="Add Another Row"
                        >
                            <Plus size={24} />
                        </button>

                        <button 
                            className="squad-editor-btn-save"
                            onClick={handleSave}
                            disabled={isSaving}
                            title="Save Squad Data"
                        >
                            <Save size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
