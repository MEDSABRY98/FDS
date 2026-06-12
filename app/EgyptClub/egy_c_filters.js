"use client";

import { useState, useRef, useEffect } from "react";

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
                .option-item { padding: 10px 12px; font-size: 13px; cursor: pointer; color: #333; }
                .option-item:hover { background: #f7f7f7; color: var(--gold, #c9a84c); }
                .option-item.active { background: rgba(201, 168, 76, 0.08); color: var(--gold, #c9a84c); font-weight: bold; }
                .no-options { padding: 12px; font-size: 12px; color: #888; text-align: center; }
                .options-list::-webkit-scrollbar { width: 5px; }
                .options-list::-webkit-scrollbar-thumb { background: var(--gold, #c9a84c); border-radius: 10px; }
            `}</style>
        </div>
    );
}

// --- MAIN FILTERS COMPONENT ---
export default function EgyptClubFilters({
    dbFilters, updateFilter, resetFilters, filterOptions,
    startDate, setStartDate, endDate, setEndDate
}) {
    return (
        <div style={{ padding: '30px' }}>
            <div className="filters-wrap" style={{ maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
                <div className="filter-grid-layout">
                    {/* ROW 1 */}
                    <SearchableSelect label="MATCH ID" value={dbFilters.match_id} options={filterOptions?.match_ids || []} onChange={(v) => updateFilter('match_id', v)} />
                    <SearchableSelect label="CHAMPION SYSTEM" value={dbFilters.champion_system} options={filterOptions?.champion_systems || []} onChange={(v) => updateFilter('champion_system', v)} />
                    <div className="filter-group">
                        <label className="filter-label">DATE FROM</label>
                        <input 
                            type="date" 
                            className="date-input" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">DATE TO</label>
                        <input 
                            type="date" 
                            className="date-input" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                        />
                    </div>

                    {/* ROW 2 */}
                    <SearchableSelect label="YEAR" value={dbFilters.year} options={filterOptions?.years || []} onChange={(v) => updateFilter('year', v)} />
                    <SearchableSelect label="COMPETITION" value={dbFilters.champion} options={filterOptions?.champions || []} onChange={(v) => updateFilter('champion', v)} />
                    <SearchableSelect label="SEASON" value={dbFilters.season} options={filterOptions?.seasons || []} onChange={(v) => updateFilter('season', v)} />
                    <SearchableSelect label="ROUND" value={dbFilters.round} options={filterOptions?.rounds || []} onChange={(v) => updateFilter('round', v)} />

                    {/* ROW 3 */}
                    <SearchableSelect label="PLACE / STADIUM" value={dbFilters.place} options={filterOptions?.places || []} onChange={(v) => updateFilter('place', v)} />
                    <SearchableSelect label="VENUE (H-A-N)" value={dbFilters.han} options={filterOptions?.han || []} onChange={(v) => updateFilter('han', v)} />
                    <SearchableSelect label="EGYPT CLUB" value={dbFilters.egypt_team} options={filterOptions?.egy_teams || []} onChange={(v) => updateFilter('egypt_team', v)} />
                    <SearchableSelect label="GOALS FOR (GF)" value={dbFilters.gf} options={filterOptions?.gf || []} onChange={(v) => updateFilter('gf', v)} />

                    {/* ROW 4 */}
                    <SearchableSelect label="GOALS AGST (GA)" value={dbFilters.ga} options={filterOptions?.ga || []} onChange={(v) => updateFilter('ga', v)} />
                    <SearchableSelect label="ET (EXTRA TIME)" value={dbFilters.et} options={filterOptions?.et || []} onChange={(v) => updateFilter('et', v)} />
                    <SearchableSelect label="PENALTIES" value={dbFilters.pen} options={filterOptions?.pen || []} onChange={(v) => updateFilter('pen', v)} />
                    <SearchableSelect label="OPPONENT CLUB" value={dbFilters.opponent_team} options={filterOptions?.opponent_teams || []} onChange={(v) => updateFilter('opponent_team', v)} />

                    {/* ROW 5 */}
                    <SearchableSelect label="W-L Q & F" value={dbFilters.wl_q_f} options={filterOptions?.wl_q_fs || []} onChange={(v) => updateFilter('wl_q_f', v)} />
                    <SearchableSelect label="NOTE" value={dbFilters.note} options={filterOptions?.notes || []} onChange={(v) => updateFilter('note', v)} />
                    <SearchableSelect label="W-D-L RESULT" value={dbFilters.wdl} options={filterOptions?.wdl || []} onChange={(v) => updateFilter('wdl', v)} />
                    <SearchableSelect label="CLEAN SHEET" value={dbFilters.clean_sheet} options={filterOptions?.clean_sheets || []} onChange={(v) => updateFilter('clean_sheet', v)} />
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
                .date-input {
                    width: 100%; 
                    height: 44px; 
                    background: #f9f9f9; 
                    border: 1px solid #e2e8f0;
                    padding: 8px 12px; 
                    border-radius: 4px; 
                    outline: none; 
                    font-family: inherit; 
                    font-size: 13px; 
                    box-sizing: border-box;
                    color: #333;
                    transition: border-color 0.2s;
                }
                .date-input:focus { border-color: var(--gold, #c9a84c); background: #fff; }
                @media (max-width: 1024px) { .filter-grid-layout { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 600px) { .filter-grid-layout { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}
