"use client";

import { useState, useRef, useEffect } from "react";
import "./alahly_db_filters.css";

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
    dbFilters, updateFilter, filterOptions,
    startDate, setStartDate, endDate, setEndDate
}) {
    return (
        <div className="tab-content" id="tab-filters">
            <div className="filters-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                <div className="section-title">AL AHLY <span className="accent">FILTERS</span></div>
                <div className="gold-line"></div>

                <div className="filter-grid-layout">
                    {/* ROW 1 */}
                    <SearchableSelect label="MATCH ID" value={dbFilters.match_id} options={filterOptions?.match_ids || []} onChange={(v) => updateFilter('match_id', v)} />
                    <SearchableSelect label="CHAMPION SYSTEM" value={dbFilters.champion_system} options={filterOptions?.champion_systems || []} onChange={(v) => updateFilter('champion_system', v)} />
                    <div className="filter-group">
                        <label className="filter-label">DATE FROM</label>
                        <input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">DATE TO</label>
                        <input type="date" className="date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>

                    {/* ROW 2 */}
                    <SearchableSelect label="YEAR" value={dbFilters.year} options={filterOptions?.years || []} onChange={(v) => updateFilter('year', v)} />
                    <SearchableSelect label="CHAMPION" value={dbFilters.champion} options={filterOptions?.champions || []} onChange={(v) => updateFilter('champion', v)} />
                    <SearchableSelect label="SEASON - NAME" value={dbFilters.season} options={filterOptions?.seasons || []} onChange={(v) => updateFilter('season', v)} />
                    <SearchableSelect label="SEASON - NUMBER" value={dbFilters.sy} options={filterOptions?.sy || []} onChange={(v) => updateFilter('sy', v)} />

                    {/* REST */}
                    <SearchableSelect label="AHLY MANAGER" value={dbFilters.ahly_manager} options={filterOptions?.ahly_managers || []} onChange={(v) => updateFilter('ahly_manager', v)} />
                    <SearchableSelect label="OPPONENT MANAGER" value={dbFilters.opponent_manager} options={filterOptions?.opponent_managers || []} onChange={(v) => updateFilter('opponent_manager', v)} />
                    <SearchableSelect label="REFEREE" value={dbFilters.referee} options={filterOptions?.referees || []} onChange={(v) => updateFilter('referee', v)} />
                    <SearchableSelect label="ROUND" value={dbFilters.round} options={filterOptions?.rounds || []} onChange={(v) => updateFilter('round', v)} />
                    <SearchableSelect label="H-A-N (H/A/N)" value={dbFilters.han} options={filterOptions?.han || []} onChange={(v) => updateFilter('han', v)} />
                    <SearchableSelect label="STADIUM" value={dbFilters.stad} options={filterOptions?.stadiums || []} onChange={(v) => updateFilter('stad', v)} />
                    <SearchableSelect label="AHLY TEAM" value={dbFilters.ahly_team} options={filterOptions?.ahly_teams || []} onChange={(v) => updateFilter('ahly_team', v)} />
                    <SearchableSelect label="GF" value={dbFilters.gf} options={filterOptions?.gf || []} onChange={(v) => updateFilter('gf', v)} />
                    <SearchableSelect label="GA" value={dbFilters.ga} options={filterOptions?.ga || []} onChange={(v) => updateFilter('ga', v)} />
                    <SearchableSelect label="ET (Extra Time)" value={dbFilters.et} options={filterOptions?.et || []} onChange={(v) => updateFilter('et', v)} />
                    <SearchableSelect label="PENALTIES" value={dbFilters.pen} options={filterOptions?.pen || []} onChange={(v) => updateFilter('pen', v)} />
                    <SearchableSelect label="OPPONENT TEAM" value={dbFilters.opponent_team} options={filterOptions?.opponent_teams || []} onChange={(v) => updateFilter('opponent_team', v)} />
                    <SearchableSelect label="W-D-L" value={dbFilters.wdl} options={filterOptions?.wdl || []} onChange={(v) => updateFilter('wdl', v)} />
                    <SearchableSelect label="CLEAN SHEET" value={dbFilters.clean_sheet} options={filterOptions?.clean_sheets || []} onChange={(v) => updateFilter('clean_sheet', v)} />
                    <SearchableSelect label="NOTE" value={dbFilters.note} options={filterOptions?.notes || []} onChange={(v) => updateFilter('note', v)} />
                </div>

                <div className="filter-footer">
                    <button className="reset-btn" onClick={() => window.location.reload()}>RESET ALL FILTERS</button>
                </div>
            </div>

            <style jsx>{`
                .filter-grid-layout { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                .date-input {
                    width: 100%; height: 44px; background: var(--surface); border: 1px solid var(--border);
                    padding: 8px 12px; border-radius: 2px; outline: none; font-family: inherit; font-size: 13px; box-sizing: border-box;
                }
                .date-input:focus { border-color: var(--gold); background: #fff; }
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
