"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { UseColumnOrder, SortFilterFields } from "../../lib/Settings_db";
import "../../lib/Filters_db.css";
import "./alahly_db_filters.css";

const TABLE_NAME = "alahly_MATCHDETAILS";

const FILTER_FIELD_DEFS = [
    { key: "country", label: "COUNTRY", type: "select", optionsKey: "countries" },
    { key: "continent", label: "CONTINENT", type: "select", optionsKey: "continents" },
    { key: "match_id", label: "MATCH ID", type: "select", optionsKey: "match_ids", dbColumn: "MATCH_ID" },
    { key: "champion_system", label: "CHAMPION SYSTEM", type: "select", optionsKey: "champion_systems", dbColumn: "CHAMPION SYSTEM" },
    { key: "date_from", label: "DATE FROM", type: "date", dbColumn: "DATE" },
    { key: "date_to", label: "DATE TO", type: "date", dbColumn: "DATE" },
    { key: "year", label: "YEAR", type: "select", optionsKey: "years", dbColumn: "DATE" },
    { key: "champion", label: "CHAMPION", type: "select", optionsKey: "champions", dbColumn: "CHAMPION" },
    { key: "season", label: "SEASON - NAME", type: "select", optionsKey: "seasons", dbColumn: "SEASON - NAME" },
    { key: "sy", label: "SEASON - NUMBER", type: "select", optionsKey: "sy", dbColumn: "SEASON - NUMBER" },
    { key: "ahly_manager", label: "AHLY MANAGER", type: "select", optionsKey: "ahly_managers", dbColumn: "AHLY MANAGER" },
    { key: "opponent_manager", label: "OPPONENT MANAGER", type: "select", optionsKey: "opponent_managers", dbColumn: "OPPONENT MANAGER" },
    { key: "referee", label: "REFEREE", type: "select", optionsKey: "referees", dbColumn: "REFREE" },
    { key: "round", label: "ROUND", type: "select", optionsKey: "rounds", dbColumn: "ROUND" },
    { key: "han", label: "H-A-N (H/A/N)", type: "select", optionsKey: "han", dbColumn: "H-A-N" },
    { key: "stad", label: "STADIUM", type: "select", optionsKey: "stadiums", dbColumn: "STAD" },
    { key: "ahly_team", label: "AHLY TEAM", type: "select", optionsKey: "ahly_teams", dbColumn: "AHLY TEAM" },
    { key: "gf", label: "GF", type: "select", optionsKey: "gf", dbColumn: "GF" },
    { key: "ga", label: "GA", type: "select", optionsKey: "ga", dbColumn: "GA" },
    { key: "et", label: "ET (Extra Time)", type: "select", optionsKey: "et", dbColumn: "ET" },
    { key: "pen", label: "PENALTIES", type: "select", optionsKey: "pen", dbColumn: "PEN" },
    { key: "opponent_team", label: "OPPONENT TEAM", type: "select", optionsKey: "opponent_teams", dbColumn: "OPPONENT TEAM" },
    { key: "wdl", label: "W-D-L", type: "select", optionsKey: "wdl", dbColumn: "W-D-L" },
    { key: "clean_sheet", label: "CLEAN SHEET", type: "select", optionsKey: "clean_sheets", dbColumn: "CLEAN SHEET" },
    { key: "note", label: "NOTE", type: "select", optionsKey: "notes", dbColumn: "NOTE" },
];

// --- SEARCHABLE SELECT COMPONENT ---
function SearchableSelect({ label, value, options, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [openUpwards, setOpenUpwards] = useState(false);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownMaxHeight = 420;
            if (spaceBelow < dropdownMaxHeight && rect.top > dropdownMaxHeight) {
                setOpenUpwards(true);
            } else {
                setOpenUpwards(false);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        String(opt).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="filter-group" ref={dropdownRef}>
            <label className="filter-label">{label}</label>
            <div className="select-container">
                <div
                    ref={triggerRef}
                    className={`custom-select-box ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {value}
                    <span className="select-arrow">▼</span>
                </div>

                {isOpen && (
                    <div className={`custom-dropdown ${openUpwards ? 'up' : 'down'}`}>
                        <input
                            type="text"
                            className="dropdown-search-input"
                            placeholder="Search..."
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="options-list">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        className={`option-item ${value === opt ? 'active' : ''}`}
                                        onClick={() => {
                                            onChange(opt);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                        }}
                                    >
                                        {opt}
                                    </div>
                                ))
                            ) : (
                                <div className="no-options">No matches found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .filter-group { position: relative; width: 100%; display: flex; flex-direction: column; gap: 8px; }
                .select-container { position: relative; width: 100%; }
                .custom-select-box {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    padding: 12px;
                    border-radius: 2px;
                    font-size: 13px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 44px;
                    box-sizing: border-box;
                }
                .custom-select-box:hover { border-color: var(--gold); }
                .custom-select-box.open { border-color: var(--gold); background: #fff; }
                .select-arrow { font-size: 8px; opacity: 0.5; }
                .custom-dropdown {
                    position: absolute;
                    left: 0; right: 0;
                    background: #fff;
                    border: 1px solid var(--gold);
                    z-index: 10000;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .custom-dropdown.down { top: calc(100% + 4px); border-top: none; }
                .custom-dropdown.up { bottom: calc(100% + 4px); border-bottom: none; }
                .dropdown-search-input { width: 100%; padding: 10px; border: none; border-bottom: 1px solid var(--border); outline: none; font-size: 13px; }
                .options-list { max-height: 360px; overflow-y: auto; }
                .option-item { padding: 10px 12px; font-size: 13px; cursor: pointer; }
                .option-item:hover { background: var(--surface); color: var(--gold); }
                .option-item.active { background: var(--gold-dim); color: var(--gold); font-weight: bold; }
                .no-options { padding: 12px; font-size: 12px; color: var(--text-muted); text-align: center; }
                .options-list::-webkit-scrollbar { width: 4px; }
                .options-list::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 10px; }
            `}</style>
        </div>
    );
}

// --- MAIN FILTERS COMPONENT ---
export default function AlAhlyFilters({
    dbFilters, updateFilter, resetFilters, filterOptions,
    startDate, setStartDate, endDate, setEndDate
}) {
    const ColumnOrder = UseColumnOrder(TABLE_NAME);
    const SortedFields = useMemo(
        () => SortFilterFields(FILTER_FIELD_DEFS, ColumnOrder),
        [ColumnOrder]
    );

    const renderField = (field) => {
        if (field.type === "date") {
            const value = field.key === "date_from" ? startDate : endDate;
            const onChange = field.key === "date_from" ? setStartDate : setEndDate;
            return (
                <div key={field.key} className="filter-group">
                    <label className="filter-label">{field.label}</label>
                    <input type="date" className="filter-date-input" value={value} onChange={(e) => onChange(e.target.value)} />
                </div>
            );
        }

        return (
            <SearchableSelect
                key={field.key}
                label={field.label}
                value={dbFilters[field.key]}
                options={filterOptions?.[field.optionsKey] || []}
                onChange={(v) => updateFilter(field.key, v)}
            />
        );
    };

    return (
        <div style={{ padding: '30px' }}>
            <div className="filters-wrap" style={{ maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
                <div className="filter-grid-layout">
                    {SortedFields.map(renderField)}
                </div>
            </div>

            <style jsx>{`
                .filter-grid-layout { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                @media (max-width: 1024px) { .filter-grid-layout { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 600px) { .filter-grid-layout { grid-template-columns: 1fr; } }
                .filter-footer { display: flex; justify-content: center; margin-top: 40px; }
                .reset-btn {
                    background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 12px 32px;
                    font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; border-radius: 2px;
                }
                .reset-btn:hover { color: var(--gold); border-color: var(--gold); background: rgba(201,168,76,0.05); }
            `}</style>
        </div>
    );
}
