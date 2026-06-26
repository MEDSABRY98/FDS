"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import NoData_db from "../../lib/NoData_db";
import Loading_db from "../../lib/Loading_db";
import { buildPlayerSeasonStatsMap, isGkPosition, getGroupKey, getGroupColumnLabel, GROUPING_MODES } from "./egypt_nt_db_clubs_utils";

const SORT_COLUMNS = [
    { key: "club", label: "CLUB" },
    { key: "name", label: "PLAYER NAME" },
    { key: "position", label: "POSITION" },
    { key: "champion", label: "TOURNAMENT" },
    { key: "mp", label: "MP" },
    { key: "mins", label: "MINS" },
    { key: "g_plus_a", label: "G+A" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "ga", label: "GA" },
    { key: "cs", label: "CS" }
];

const ROWS_PER_PAGE = 50;

function emptySeasonStats() {
    return { mp: 0, mins: 0, goals: 0, assists: 0, ga: 0, cs: 0, gkCaps: 0 };
}

function getSeasonStatsKey(playerName, season) {
    return `${String(playerName || "").trim()}|${String(season || "").trim()}`;
}

function resolvePlayerSeasonStats(playerName, season, position, seasonStatsMap) {
    const raw = seasonStatsMap[getSeasonStatsKey(playerName, season)] || emptySeasonStats();
    const isGk = isGkPosition(position) || raw.gkCaps > 0;

    return {
        isGk,
        mp: isGk ? raw.gkCaps : raw.mp,
        mins: raw.mins,
        goals: raw.goals,
        assists: raw.assists,
        ga: isGk ? raw.ga : null,
        cs: isGk ? raw.cs : null
    };
}

function StatCell({ value, isGkOnly = false, active = true }) {
    if (isGkOnly && !active) {
        return <td className="club-stat-cell muted">—</td>;
    }
    return <td className="club-stat-cell">{value ?? 0}</td>;
}

function getSortValue(row, key) {
    const stats = row.ntStats || {};
    switch (key) {
        case "club":      return String(row.club || "").toLowerCase();
        case "name":      return String(row.name || "").toLowerCase();
        case "position":  return String(row.position || "").toLowerCase();
        case "champion":  return String(row.champion || "").toLowerCase();
        case "players_count": return row.playerCount ?? 0;
        case "mp":        return stats.mp ?? 0;
        case "mins":      return stats.mins ?? 0;
        case "g_plus_a":  return (stats.goals ?? 0) + (stats.assists ?? 0);
        case "goals":     return stats.goals ?? 0;
        case "assists":   return stats.assists ?? 0;
        case "ga":        return stats.isGk ? (stats.ga ?? 0) : -1;
        case "cs":        return stats.isGk ? (stats.cs ?? 0) : -1;
        default:          return 0;
    }
}

function sortRows(rows, sortConfig) {
    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
        const valueA = getSortValue(a, key);
        const valueB = getSortValue(b, key);

        let primaryDiff = 0;
        if (typeof valueA === "number" && typeof valueB === "number") {
            primaryDiff = (valueA - valueB) * multiplier;
        } else {
            primaryDiff = String(valueA).localeCompare(String(valueB), undefined, { numeric: true, sensitivity: "base" }) * multiplier;
        }

        if (primaryDiff !== 0) return primaryDiff;

        // Fallbacks
        const gaA = (a.ntStats?.goals ?? 0) + (a.ntStats?.assists ?? 0);
        const gaB = (b.ntStats?.goals ?? 0) + (b.ntStats?.assists ?? 0);
        if (gaA !== gaB) return gaB - gaA;

        const minsA = a.ntStats?.mins ?? 0;
        const minsB = b.ntStats?.mins ?? 0;
        if (minsA !== minsB) return minsB - minsA;

        return String(a.name).localeCompare(String(b.name));
    });
}

function MultiSelectDropdown({ options, selectedValues, onChange, placeholder = "Select..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleOption = (val) => {
        if (selectedValues.includes(val)) {
            onChange(selectedValues.filter(v => v !== val));
        } else {
            onChange([...selectedValues, val]);
        }
    };

    const handleSelectAll = () => {
        onChange(options);
    };

    const handleClearAll = () => {
        onChange([]);
    };

    const displayLabel = useMemo(() => {
        if (selectedValues.length === 0) return placeholder;
        if (selectedValues.length === options.length) return `All Tournaments (${options.length})`;
        if (selectedValues.length <= 2) return selectedValues.join(", ");
        return `${selectedValues.length} Tournaments Selected`;
    }, [selectedValues, options, placeholder]);

    return (
        <div ref={dropdownRef} className="multiselect-db" style={{ position: "relative", width: "100%" }}>
            <div className="multiselect-trigger-db" onClick={() => setIsOpen(!isOpen)}>
                <span className="current-label-db">
                    {displayLabel}
                </span>
                <div className="dropdown-chevron-db" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>⌄</div>
            </div>
            {isOpen && (
                <div className="multiselect-menu-db">
                    <div className="multiselect-actions-db">
                        <button type="button" onClick={handleSelectAll}>Select All</button>
                        <button type="button" onClick={handleClearAll}>Clear All</button>
                    </div>
                    <div className="multiselect-options-container-db">
                        {options.map((opt) => {
                            const isChecked = selectedValues.includes(opt);
                            return (
                                <div key={opt} className="multiselect-opt-db" onClick={() => handleToggleOption(opt)}>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}} // Handled by parent onClick
                                        onClick={(e) => e.stopPropagation()} // Prevent double trigger
                                    />
                                    <span>{opt}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <style jsx>{`
                .multiselect-db {
                    width: 100%;
                    font-family: 'DM Sans', sans-serif;
                }
                .multiselect-trigger-db {
                    width: 100%;
                    height: 52px;
                    box-sizing: border-box;
                    background: #fdfdfd;
                    border: 2px solid #eee;
                    border-radius: 12px;
                    padding: 0 25px;
                    font-size: 15px;
                    color: #0a0a0a;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
                }
                .multiselect-trigger-db:hover {
                    border-color: #c9a84c;
                    background: #fff;
                    box-shadow: 0 10px 30px rgba(201, 168, 76, 0.08);
                }
                .current-label-db {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 85%;
                }
                .dropdown-chevron-db {
                    color: #c9a84c;
                    font-size: 18px;
                    font-weight: 800;
                }
                .multiselect-menu-db {
                    position: absolute;
                    top: calc(100% + 10px);
                    left: 0;
                    right: 0;
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(201, 168, 76, 0.3);
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    z-index: 1002;
                    display: flex;
                    flex-direction: column;
                    animation: db-fade-in 0.3s ease-out;
                }
                .multiselect-actions-db {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 15px;
                    background: #fafafa;
                    border-bottom: 1px solid #f0f0f0;
                }
                .multiselect-actions-db button {
                    background: none;
                    border: none;
                    color: #c9a84c;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                .multiselect-actions-db button:hover {
                    background: rgba(201, 168, 76, 0.1);
                }
                .multiselect-options-container-db {
                    max-height: 240px;
                    overflow-y: auto;
                    padding: 5px 0;
                }
                .multiselect-opt-db {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 20px;
                    cursor: pointer;
                    transition: 0.2s;
                    color: #666;
                    font-size: 14px;
                    font-weight: 500;
                    user-select: none;
                }
                .multiselect-opt-db:hover {
                    background: rgba(201, 168, 76, 0.1);
                    color: #000;
                }
                .multiselect-opt-db input[type="checkbox"] {
                    accent-color: #c9a84c;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                @keyframes db-fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default function EgyptNTClubsChampionships({ squadData, matches, lineupDetails, playerDetails, gkDetails, groupingMode = GROUPING_MODES.CLUB }) {
    const [viewMode, setViewMode] = useState("player"); // "player" | "club"
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "g_plus_a", direction: "desc" });
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedChampionships, setSelectedChampionships] = useState([]);
    const [selectedClub, setSelectedClub] = useState("");
    const groupColumnLabel = getGroupColumnLabel(groupingMode);
    const isCountryMode = groupingMode === GROUPING_MODES.COUNTRY;

    useEffect(() => {
        setSelectedClub("");
        setCurrentPage(1);
        setSearchTerm("");
    }, [groupingMode]);

    const [seasonStatsMap, setSeasonStatsMap] = useState(null);
    const [isCalculating, setIsCalculating] = useState(true);
    const bgDataRef = useRef({ matches, lineupDetails, playerDetails, gkDetails });

    useEffect(() => {
        setIsCalculating(true);
        const timer = setTimeout(() => {
            const map = buildPlayerSeasonStatsMap(
                bgDataRef.current.matches,
                bgDataRef.current.lineupDetails,
                bgDataRef.current.playerDetails,
                bgDataRef.current.gkDetails
            );
            setSeasonStatsMap(map);
            setIsCalculating(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        bgDataRef.current = { matches, lineupDetails, playerDetails, gkDetails };
        if (isCalculating) return;
        const bgTimer = setTimeout(() => {
            const newMap = buildPlayerSeasonStatsMap(matches, lineupDetails, playerDetails, gkDetails);
            setSeasonStatsMap(prev => (prev === newMap ? prev : newMap));
        }, 200);
        return () => clearTimeout(bgTimer);
    }, [matches, lineupDetails, playerDetails, gkDetails, isCalculating]);

    // Build flat list of all unique rows: club | player | position | champion
    const allRows = useMemo(() => {
        if (!squadData || squadData.length === 0 || !seasonStatsMap) return [];

        const rowsMap = {};

        const mergeNtStats = (target, source) => {
            target.mp += source.mp ?? 0;
            target.mins += source.mins ?? 0;
            target.goals += source.goals ?? 0;
            target.assists += source.assists ?? 0;
            target.isGk = target.isGk || source.isGk;
            if (source.isGk) {
                target.ga = (target.ga ?? 0) + (source.ga ?? 0);
                target.cs = (target.cs ?? 0) + (source.cs ?? 0);
            }
        };

        squadData.forEach(item => {
            const name = String(item.PLAYERNAME || "").trim();
            const clubRaw = String(item.CLUB || "Unknown").trim();
            const groupKey = getGroupKey(clubRaw, groupingMode) || "Unknown";
            const position = String(item.POSITION || "—").trim();
            const champion = String(item.CHAMPION || "Unknown").trim();
            const season = String(item.SEASON || "Unknown").trim();

            if (!name) return;

            const rowKey = `${groupKey}|${name}|${position}|${champion}`;
            const ntStats = resolvePlayerSeasonStats(name, season, position, seasonStatsMap);

            if (rowsMap[rowKey]) {
                if (isCountryMode) {
                    mergeNtStats(rowsMap[rowKey].ntStats, ntStats);
                }
                return;
            }

            rowsMap[rowKey] = {
                name,
                club: groupKey,
                position: position || "—",
                champion,
                season,
                ntStats: { ...ntStats }
            };
        });

        return Object.values(rowsMap);
    }, [squadData, seasonStatsMap, groupingMode, isCountryMode]);

    const clubRows = useMemo(() => {
        const groups = {};
        allRows.forEach(row => {
            const key = `${row.club}|${row.champion}`;
            if (!groups[key]) {
                groups[key] = {
                    club: row.club,
                    champion: row.champion,
                    playersSet: new Set(),
                    mp: 0,
                    mins: 0,
                    goals: 0,
                    assists: 0,
                    ga: 0,
                    cs: 0,
                    hasGk: false
                };
            }
            if (row.name) {
                groups[key].playersSet.add(row.name);
            }
            const stats = row.ntStats || {};
            groups[key].mp += stats.mp ?? 0;
            groups[key].mins += stats.mins ?? 0;
            groups[key].goals += stats.goals ?? 0;
            groups[key].assists += stats.assists ?? 0;
            if (stats.isGk) {
                groups[key].ga += stats.ga ?? 0;
                groups[key].cs += stats.cs ?? 0;
                groups[key].hasGk = true;
            }
        });

        return Object.values(groups).map(g => ({
            club: g.club,
            champion: g.champion,
            playerCount: g.playersSet.size,
            ntStats: {
                mp: g.mp,
                mins: g.mins,
                goals: g.goals,
                assists: g.assists,
                ga: g.hasGk ? g.ga : null,
                cs: g.hasGk ? g.cs : null,
                isGk: g.hasGk
            }
        }));
    }, [allRows]);

    const uniqueChampionships = useMemo(() => {
        const champs = new Set();
        allRows.forEach(row => {
            if (row.champion) champs.add(row.champion);
        });
        return Array.from(champs).sort();
    }, [allRows]);

    const clubOptions = useMemo(() => {
        const uniqueClubs = new Set();
        allRows.forEach(row => {
            if (row.club) uniqueClubs.add(row.club);
        });
        const sortedClubs = Array.from(uniqueClubs).sort();
        return [
            { value: "", label: "All Clubs" },
            ...sortedClubs.map(club => ({ value: club, label: club }))
        ];
    }, [allRows]);

    const filteredRows = useMemo(() => {
        const sourceRows = viewMode === "player" ? allRows : clubRows;
        return sourceRows.filter(row => {
            // 1. Championship Filter (multi-select)
            if (selectedChampionships.length > 0 && !selectedChampionships.includes(row.champion)) {
                return false;
            }
            // 2. Club Filter (single-select)
            if (selectedClub && row.club !== selectedClub) {
                return false;
            }
            // 3. Search Term Filter
            if (searchTerm.trim()) {
                const query = searchTerm.toLowerCase().trim();
                const matchesSearch =
                    row.club.toLowerCase().includes(query) ||
                    row.champion.toLowerCase().includes(query) ||
                    (viewMode === "player" && (
                        row.name.toLowerCase().includes(query) ||
                        String(row.position || "").toLowerCase().includes(query)
                    ));
                if (!matchesSearch) return false;
            }
            return true;
        });
    }, [allRows, clubRows, selectedChampionships, selectedClub, searchTerm, viewMode]);

    const sortedRows = useMemo(() => sortRows(filteredRows, sortConfig), [filteredRows, sortConfig]);

    const totals = useMemo(() => {
        const acc = {
            playerCount: 0,
            mp: 0,
            mins: 0,
            goals: 0,
            assists: 0,
            ga: 0,
            cs: 0,
            hasGk: false
        };

        filteredRows.forEach(row => {
            const stats = row.ntStats || {};
            acc.mp += stats.mp ?? 0;
            acc.mins += stats.mins ?? 0;
            acc.goals += stats.goals ?? 0;
            acc.assists += stats.assists ?? 0;
            if (viewMode === "club") {
                acc.playerCount += row.playerCount ?? 0;
            }
            if (stats.isGk) {
                acc.ga += stats.ga ?? 0;
                acc.cs += stats.cs ?? 0;
                acc.hasGk = true;
            }
        });

        return acc;
    }, [filteredRows, viewMode]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig, selectedChampionships, selectedClub]);

    const totalPages = Math.ceil(sortedRows.length / ROWS_PER_PAGE);
    const paginatedRows = sortedRows.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    );

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕";
        return sortConfig.direction === "asc" ? "↑" : "↓";
    };

    const activeColumns = useMemo(() => {
        const baseColumns = SORT_COLUMNS.map(column => (
            column.key === "club" ? { ...column, label: groupColumnLabel } : column
        ));

        if (viewMode === "player") {
            return baseColumns;
        }
        const filtered = baseColumns.filter(col => col.key !== "name" && col.key !== "position");
        const clubIdx = filtered.findIndex(col => col.key === "club");
        if (clubIdx !== -1) {
            filtered.splice(clubIdx + 1, 0, { key: "players_count", label: "PLAYERS" });
        }
        return filtered;
    }, [viewMode, groupColumnLabel]);

    if (isCalculating || !seasonStatsMap) {
        return <Loading_db title="EGYPT NT" subtitle="SQUAD STATS" message="CALCULATING TOURNAMENT STATS..." inline={true} />;
    }

    if (allRows.length === 0) {
        return <NoData_db message="NO TOURNAMENT DATA AVAILABLE" height="240px" />;
    }

    return (
        <div className="fade-in">
            {/* Sub-tab switcher */}
            <div className="squad-subtabs-switcher" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', width: 'fit-content', margin: '0 auto 20px auto' }}>
                <button
                    className={`subtab-btn ${viewMode === "player" ? "active" : ""}`}
                    onClick={() => { setViewMode("player"); setCurrentPage(1); setSearchTerm(""); }}
                >
                    👤 By Player
                </button>
                <button
                    className={`subtab-btn ${viewMode === "club" ? "active" : ""}`}
                    onClick={() => { setViewMode("club"); setCurrentPage(1); setSearchTerm(""); }}
                >
                    🏢 By {isCountryMode ? "Country" : "Club"}
                </button>
            </div>

            {/* Search Bar & Filters */}
            <div className="squad-search-wrap" style={{ marginBottom: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
                {/* Championships Multi-Select Dropdown */}
                <div style={{ minWidth: "220px", width: "260px" }}>
                    <MultiSelectDropdown
                        options={uniqueChampionships}
                        selectedValues={selectedChampionships}
                        onChange={setSelectedChampionships}
                        placeholder="All Tournaments"
                    />
                </div>

                {/* Clubs Dropdown */}
                <div style={{ minWidth: "200px", width: "220px" }}>
                    <DropDownList_db
                        options={clubOptions}
                        value={selectedClub}
                        onChange={setSelectedClub}
                        placeholder={isCountryMode ? "All Countries" : "All Clubs"}
                        searchable={true}
                    />
                </div>

                {/* Search Input */}
                <div style={{ minWidth: "250px", width: "320px" }}>
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder={viewMode === "player" ? "Search player, position..." : `Search ${groupColumnLabel.toLowerCase()}, tournament...`}
                    />
                </div>

                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "#999", fontWeight: "700" }}>
                    {sortedRows.length} RECORDS
                </span>
            </div>

            {sortedRows.length === 0 ? (
                <NoData_db message="No records found matching your query." height="200px" />
            ) : (
                <>
                    <div className="squad-table-container club-season-table-wrap">
                        <table className="luxury-squad-table club-season-stats-table">
                            <colgroup>
                                {viewMode === "player" ? (
                                    <>
                                        <col style={{ width: "4%" }} />
                                        <col style={{ width: "15%" }} />
                                        <col style={{ width: "15%" }} />
                                        <col style={{ width: "9%" }} />
                                        <col style={{ width: "17%" }} />
                                        <col style={{ width: "5%" }} />
                                        <col style={{ width: "7%" }} />
                                        <col style={{ width: "5%" }} />
                                        <col style={{ width: "5%" }} />
                                        <col style={{ width: "5%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "6%" }} />
                                    </>
                                ) : (
                                    <>
                                        <col style={{ width: "4%" }} />
                                        <col style={{ width: "16%" }} />
                                        <col style={{ width: "10%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "9%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "9%" }} />
                                        <col style={{ width: "9%" }} />
                                    </>
                                )}
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {activeColumns.map(column => (
                                        <th
                                            key={column.key}
                                            className="club-sortable-header"
                                            onClick={() => handleSort(column.key)}
                                        >
                                            {column.label} <span className="club-sort-icon">{getSortIcon(column.key)}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row, idx) => {
                                    const stats = row.ntStats || {};
                                    const globalIdx = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                                    return (
                                        <tr key={`${row.club}-${row.name || ""}-${row.champion}-${row.position || ""}-${idx}`}>
                                            <td className="row-num club-row-num">{globalIdx}</td>
                                            <td className="highlight-blue">{row.club}</td>
                                            {viewMode === "player" ? (
                                                <>
                                                    <td className="player-name-cell">{row.name}</td>
                                                    <td>{row.position}</td>
                                                </>
                                            ) : (
                                                <td className="club-stat-cell">{row.playerCount}</td>
                                            )}
                                            <td>{row.champion}</td>
                                            <StatCell value={stats.mp} />
                                            <StatCell value={stats.mins} />
                                            <StatCell value={(stats.goals ?? 0) + (stats.assists ?? 0)} />
                                            <StatCell value={stats.goals} />
                                            <StatCell value={stats.assists} />
                                            <StatCell value={stats.ga} isGkOnly active={stats.isGk} />
                                            <StatCell value={stats.cs} isGkOnly active={stats.isGk} />
                                        </tr>
                                    );
                                })}
                                {paginatedRows.length > 0 && (
                                    <tr className="club-stats-total-row">
                                        <td />
                                        <td className="player-name-cell">TOTAL</td>
                                        {viewMode === "player" ? (
                                            <>
                                                <td>—</td>
                                                <td>—</td>
                                            </>
                                        ) : (
                                            <td className="club-stat-cell">{totals.playerCount}</td>
                                        )}
                                        <td>—</td>
                                        <StatCell value={totals.mp} />
                                        <StatCell value={totals.mins} />
                                        <StatCell value={totals.goals + totals.assists} />
                                        <StatCell value={totals.goals} />
                                        <StatCell value={totals.assists} />
                                        <StatCell value={totals.ga} isGkOnly active={totals.hasGk} />
                                        <StatCell value={totals.cs} isGkOnly active={totals.hasGk} />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="club-season-pagination" style={{ marginTop: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
                            <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 150, behavior: 'smooth' }); }}>←</button>
                            <span>PAGE {currentPage} OF {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 150, behavior: 'smooth' }); }}>→</button>
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
                .club-season-pagination button { 
                    background: rgba(201, 168, 76, 0.15); 
                    border: 1px solid rgba(201, 168, 76, 0.3); 
                    color: var(--player-gold, #c9a84c); 
                    padding: 8px 18px; 
                    border-radius: 10px; 
                    font-family: 'Space Mono', monospace; 
                    font-weight: 700;
                    font-size: 13px; 
                    cursor: pointer; 
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .club-season-pagination button:hover:not(:disabled) { 
                    background: var(--player-gold, #c9a84c); 
                    color: #000; 
                    border-color: var(--player-gold, #c9a84c);
                    box-shadow: 0 0 15px rgba(201, 168, 76, 0.3);
                    transform: translateY(-1px);
                }
                .club-season-pagination button:disabled { 
                    opacity: 0.3; 
                    cursor: not-allowed; 
                    border-color: rgba(0,0,0,0.1);
                    color: #666;
                }
                .club-season-pagination span { 
                    font-family: 'Space Mono', monospace; 
                    font-size: 14px; 
                    color: var(--player-gold, #c9a84c); 
                    letter-spacing: 2px; 
                    font-weight: 800;
                }
            `}</style>
        </div>
    );
}
