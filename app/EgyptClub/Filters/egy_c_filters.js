"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { UseColumnOrder, SortFilterFields } from "../../lib/Settings_db";
import "../../lib/Filters_db.css";

const TABLE_NAME = "egy_CLUB_MATCHDETAILS";

const FILTER_FIELD_DEFS = [
    { key: "country", label: "COUNTRY", type: "select", optionsKey: "countries" },
    { key: "continent", label: "CONTINENT", type: "select", optionsKey: "continents" },
    { key: "row_id", label: "ROW ID", type: "select", optionsKey: "row_ids", dbColumn: "ROW_ID" },
    { key: "champion_system", label: "CHAMPION SYSTEM", type: "select", optionsKey: "champion_systems", dbColumn: "CHAMPION SYSTEM" },
    { key: "date_from", label: "DATE FROM", type: "date", dbColumn: "DATE" },
    { key: "date_to", label: "DATE TO", type: "date", dbColumn: "DATE" },
    { key: "year", label: "YEAR", type: "select", optionsKey: "years", dbColumn: "DATE" },
    { key: "champion", label: "COMPETITION", type: "select", optionsKey: "champions", dbColumn: "CHAMPION" },
    { key: "season", label: "SEASON", type: "select", optionsKey: "seasons", dbColumn: "SEASON" },
    { key: "round", label: "ROUND", type: "select", optionsKey: "rounds", dbColumn: "ROUND" },
    { key: "place", label: "PLACE / STADIUM", type: "select", optionsKey: "places", dbColumn: "PLACE" },
    { key: "han", label: "VENUE (H-A-N)", type: "select", optionsKey: "han", dbColumn: "H-A-N" },
    { key: "egypt_team", label: "EGYPT CLUB", type: "select", optionsKey: "egy_teams", dbColumn: "EGYPT TEAM" },
    { key: "gf", label: "GOALS FOR (GF)", type: "select", optionsKey: "gf", dbColumn: "GF" },
    { key: "ga", label: "GOALS AGST (GA)", type: "select", optionsKey: "ga", dbColumn: "GA" },
    { key: "et", label: "ET (EXTRA TIME)", type: "select", optionsKey: "et", dbColumn: "ET" },
    { key: "pen", label: "PENALTIES", type: "select", optionsKey: "pen", dbColumn: "PEN" },
    { key: "opponent_team", label: "OPPONENT CLUB", type: "select", optionsKey: "opponent_teams", dbColumn: "OPPONENT TEAM" },
    { key: "wl_q_f", label: "W-L Q & F", type: "select", optionsKey: "wl_q_fs", dbColumn: "W-L Q & F" },
    { key: "note", label: "NOTE", type: "select", optionsKey: "notes", dbColumn: "NOTE" },
    { key: "wdl", label: "W-D-L RESULT", type: "select", optionsKey: "wdl", dbColumn: "W-D-L" },
    { key: "clean_sheet", label: "CLEAN SHEET", type: "select", optionsKey: "clean_sheets", dbColumn: "CLEAN SHEET" },
];

// --- SEARCHABLE SELECT COMPONENT ---
function SearchableSelect({ label, value, options = [], onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [openUpwards, setOpenUpwards] = useState(false);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownMaxHeight = 300;
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

    // Ensure value is treated as an array of selected options
    const selectedValues = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (value === "All") return [];
        return [value];
    }, [value]);

    const filteredOptions = options.filter(opt =>
        String(opt).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleOption = (opt) => {
        if (opt === "All") {
            onChange("All");
            return;
        }

        let nextValues;
        if (selectedValues.includes(opt)) {
            nextValues = selectedValues.filter(v => v !== opt);
        } else {
            nextValues = [...selectedValues, opt];
        }

        if (nextValues.length === 0) {
            onChange("All");
        } else {
            onChange(nextValues);
        }
    };

    const isAllSelected = selectedValues.length === 0 || selectedValues.includes("All");

    const displayLabel = useMemo(() => {
        if (isAllSelected) return "All";
        if (selectedValues.length === 1) return selectedValues[0];
        if (selectedValues.length <= 2) return selectedValues.join(", ");
        return `${selectedValues.length} Selected`;
    }, [selectedValues, isAllSelected]);

    return (
        <div className="filter-group" ref={dropdownRef}>
            <label className="filter-label">{label}</label>
            <div className="select-container">
                <div
                    ref={triggerRef}
                    className={`custom-select-box ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="select-display-text">{displayLabel}</span>
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
                            {/* Render 'All' option first if not already in options */}
                            {!options.includes("All") && (
                                <div
                                    className={`option-item ${isAllSelected ? 'active' : ''}`}
                                    onClick={() => handleToggleOption("All")}
                                    style={{ display: "flex", alignItems: "center", gap: "10px" }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={() => {}}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "var(--gold, #c9a84c)" }}
                                    />
                                    <span>All</span>
                                </div>
                            )}
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => {
                                    if (opt === "All") return null; // Handled above
                                    const isChecked = selectedValues.includes(opt);
                                    return (
                                        <div
                                            key={idx}
                                            className={`option-item ${isChecked ? 'active' : ''}`}
                                            onClick={() => handleToggleOption(opt)}
                                            style={{ display: "flex", alignItems: "center", gap: "10px" }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {}}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "var(--gold, #c9a84c)" }}
                                            />
                                            <span>{opt}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="no-options">No matches found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .filter-group { position: relative; width: 100%; display: flex; flex-direction: column; gap: 8px; }
                .filter-label {
                    font-family: 'Space Mono', monospace;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    color: #555;
                    text-transform: uppercase;
                }
                .select-container { position: relative; width: 100%; }
                .custom-select-box {
                    background: #f9f9f9;
                    border: 1px solid #e2e8f0;
                    padding: 12px;
                    border-radius: 4px;
                    font-size: 13px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 44px;
                    box-sizing: border-box;
                    color: #333;
                    font-weight: 500;
                    transition: border-color 0.2s;
                }
                .custom-select-box:hover { border-color: var(--gold, #c9a84c); }
                .custom-select-box.open { border-color: var(--gold, #c9a84c); background: #fff; }
                .select-display-text {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 85%;
                }
                .select-arrow { font-size: 8px; opacity: 0.5; color: #666; }
                .custom-dropdown {
                    position: absolute;
                    left: 0; right: 0;
                    background: #fff;
                    border: 1px solid var(--gold, #c9a84c);
                    z-index: 10000;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .custom-dropdown.down { top: calc(100% + 4px); }
                .custom-dropdown.up { bottom: calc(100% + 4px); }
                .dropdown-search-input { 
                    width: 100%; 
                    padding: 10px 12px; 
                    border: none; 
                    border-bottom: 1px solid #eee; 
                    outline: none; 
                    font-size: 13px; 
                    box-sizing: border-box;
                }
                .options-list { max-height: 250px; overflow-y: auto; }
                .option-item { padding: 10px 12px; font-size: 13px; cursor: pointer; color: #333; display: flex; align-items: center; gap: 10px; }
                .option-item:hover { background: #f7f7f7; color: var(--gold, #c9a84c); }
                .option-item.active { background: rgba(201, 168, 76, 0.08); color: var(--gold, #c9a84c); font-weight: bold; }
                .no-options { padding: 12px; font-size: 12px; color: #888; text-align: center; }
                .options-list::-webkit-scrollbar { width: 5px; }
                .options-list::-webkit-scrollbar-thumb { background: var(--gold, #c9a84c); border-radius: 10px; }
                .option-item input[type="checkbox"] {
                    width: 14px;
                    height: 14px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}

// --- MAIN FILTERS COMPONENT ---
export default function EgyptClubFilters({
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
                    <input type="date" className="filter-date-input filter-date-input--club" value={value} onChange={(e) => onChange(e.target.value)} />
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
                .filter-grid-layout { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .filter-group { display: flex; flex-direction: column; gap: 8px; }
                .filter-label {
                    font-family: 'Space Mono', monospace;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    color: #555;
                    text-transform: uppercase;
                }
                @media (max-width: 1024px) { .filter-grid-layout { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 600px) { .filter-grid-layout { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}
