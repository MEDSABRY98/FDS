"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase, fetchCatalogDisplayNames } from "../../../Database";
import { useNotification } from "../../../lib/Notification_db";
import { Save, Plus, Trash2, Download, RefreshCw } from "lucide-react";
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
                style={{ ...style, width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
                autoComplete="off"
            />
            <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#999' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
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
    const [deletedRowIds, setDeletedRowIds] = useState([]);
    const [selectedLoadOption, setSelectedLoadOption] = useState("");
    const [suggestions, setSuggestions] = useState({
        players: [],
        positions: [],
        clubs: [],
        seasons: [],
        champions: [],
        loadOptions: []
    });

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { data: squadData, error: sErr } = await supabase.from('egy_NT_SQUAD').select('POSITION, CLUB, SEASON, CHAMPION');
                if (sErr) throw sErr;

                const optionsSet = new Set();
                (squadData || []).forEach(d => {
                    if (d.CHAMPION && d.SEASON) {
                        optionsSet.add(`${d.CHAMPION} — ${d.SEASON}`);
                    } else if (d.SEASON) {
                        optionsSet.add(`${d.SEASON}`);
                    }
                });

                const players = await fetchCatalogDisplayNames('db_PLAYERS');
                setSuggestions({
                    players,
                    positions: [...new Set(squadData.map(d => d.POSITION).filter(Boolean))].sort(),
                    clubs: [...new Set(squadData.map(d => d.CLUB).filter(Boolean))].sort(),
                    seasons: [...new Set(squadData.map(d => d.SEASON).filter(Boolean))].sort(),
                    champions: [...new Set(squadData.map(d => d.CHAMPION).filter(Boolean))].sort(),
                    loadOptions: [...optionsSet].sort()
                });
            } catch (err) {
                console.error("Error fetching suggestions:", err);
            }
        };

        fetchSuggestions();
        window.addEventListener("nameDisplayLangChanged", fetchSuggestions);
        return () => window.removeEventListener("nameDisplayLangChanged", fetchSuggestions);
    }, []);

    const handleLoadSquad = async () => {
        if (!selectedLoadOption) return;
        
        let champ = "";
        let season = "";
        if (selectedLoadOption.includes(" — ")) {
            const parts = selectedLoadOption.split(" — ");
            champ = parts[0];
            season = parts[1];
        } else {
            season = selectedLoadOption;
        }

        try {
            setIsSaving(true);
            let query = supabase.from('egy_NT_SQUAD').select('*');
            if (champ) query = query.eq('CHAMPION', champ);
            if (season) query = query.eq('SEASON', season);
            
            query = query.order('ROW_ID', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;

            if (data && data.length > 0) {
                // sort by ID or just use as is
                setRows(data);
                setDeletedRowIds([]);
                addNotification('Squad loaded successfully!', 'success');
            } else {
                addNotification('No data found for this selection.', 'error');
            }
        } catch (err) {
            console.error(err);
            addNotification('Error loading squad.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearSquad = () => {
        setRows([{ ...EMPTY_ROW }]);
        setDeletedRowIds([]);
        setSelectedLoadOption("");
    };

    const handleAddRow = () => {
        setRows([...rows, { ...EMPTY_ROW }]);
    };

    const handleRemoveRow = (index) => {
        const newRows = [...rows];
        const rowToRemove = newRows[index];
        if (rowToRemove.ROW_ID) {
            setDeletedRowIds([...deletedRowIds, rowToRemove.ROW_ID]);
        }
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
        const validRows = rows.filter(r => r.PLAYERNAME.trim() !== "");
        
        if (validRows.length === 0 && deletedRowIds.length === 0) {
            addNotification('No valid data to save or delete.', 'error');
            return;
        }

        setIsSaving(true);

        try {
            // Delete removed rows
            if (deletedRowIds.length > 0) {
                const { error: delError } = await supabase
                    .from("egy_NT_SQUAD")
                    .delete()
                    .in("ROW_ID", deletedRowIds);
                if (delError) throw delError;
            }

            // Assign new ROW_IDs for inserts
            const newRows = validRows.filter(r => !r.ROW_ID);
            let currentMaxNum = 0;
            
            if (newRows.length > 0) {
                const { data: existingIds, error: idError } = await supabase
                    .from("egy_NT_SQUAD")
                    .select("ROW_ID");
                if (idError) throw idError;

                if (existingIds && existingIds.length > 0) {
                    existingIds.forEach(item => {
                        if (item.ROW_ID) {
                            const match = String(item.ROW_ID).match(/\d+/);
                            if (match) {
                                const num = parseInt(match[0], 10);
                                if (num > currentMaxNum) currentMaxNum = num;
                            }
                        }
                    });
                }
            }

            const rowsToUpsert = validRows.map((row) => {
                if (row.ROW_ID) return row; // existing row
                
                currentMaxNum += 1;
                const nextRowId = `R-${String(currentMaxNum).padStart(4, '0')}`;
                return { ...row, ROW_ID: nextRowId };
            });

            if (rowsToUpsert.length > 0) {
                const { error: upsertError } = await supabase
                    .from("egy_NT_SQUAD")
                    .upsert(rowsToUpsert, { onConflict: 'ROW_ID' });
                if (upsertError) throw upsertError;
            }

            addNotification('Squad data saved successfully!', 'success');
            setDeletedRowIds([]);
            
            // Re-sync rows with the new IDs to avoid double inserting on next save
            setRows(rowsToUpsert.length > 0 ? rowsToUpsert : [{ ...EMPTY_ROW }]);
            
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


                <div className="squad-editor-container">
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: '30px', gap: '10px', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
                        <div style={{ width: '100%', maxWidth: '450px' }}>
                            <AutocompleteInput 
                                value={selectedLoadOption}
                                options={suggestions.loadOptions || []}
                                onChange={(val) => setSelectedLoadOption(val)}
                                className="squad-editor-input"
                                placeholder="Select Tournament — Season to load..."
                                style={{ textAlign: 'center', height: '50px', fontSize: '16px', fontWeight: 'bold' }}
                            />
                        </div>
                        <button 
                            className="squad-editor-btn-add" 
                            style={{ background: '#111', color: '#fff', padding: '0', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', border: '1px solid #111', flexShrink: 0, cursor: 'pointer', transition: '0.2s' }}
                            onClick={handleLoadSquad}
                            disabled={isSaving || !selectedLoadOption}
                            title="Load squad from database"
                        >
                            <Download size={22} />
                        </button>
                        <button 
                            className="squad-editor-btn-add" 
                            style={{ background: 'transparent', border: '1px solid #111', color: '#111', padding: '0', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', flexShrink: 0, cursor: 'pointer', transition: '0.2s' }}
                            onClick={handleClearSquad}
                            title="Clear editor to add new squad"
                        >
                            <RefreshCw size={22} />
                        </button>
                    </div>

                    <table className="squad-editor-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>PLAYER NAME</th>
                                <th style={{ width: '15%' }}>POSITION</th>
                                <th style={{ width: '20%' }}>CLUB</th>
                                <th style={{ width: '15%' }}>CHAMPION</th>
                                <th style={{ width: '20%' }}>SEASON</th>
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
