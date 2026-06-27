"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import { buildScoringClubStats, getGroupKey, getGroupColumnLabel, GROUPING_MODES } from "./egypt_nt_db_clubs_utils";
import EgyptNTClubDetails from "./egypt_nt_db_club_details";

const SORT_COLUMNS_SCORING = [
    { key: "club", label: "CLUB NAME" },
    { key: "scorersCount", label: "SCORERS" },
    { key: "ga", label: "G+A" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "penGoals", label: "PEN G" },
    { key: "seasonCount", label: "SEAS" },
    { key: "matchCount", label: "MP" },
    { key: "minutes", label: "MINS" }
];

const PAGE_SIZE = 50;

function getSortValue(row, key) {
    switch (key) {
        case "club":
            return String(row.club || "").toLowerCase();
        default:
            return row[key] ?? 0;
    }
}

function sortRows(rows, sortConfig) {
    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
        const valueA = getSortValue(a, key);
        const valueB = getSortValue(b, key);

        if (typeof valueA === "number" && typeof valueB === "number") {
            return (valueA - valueB) * multiplier || a.club.localeCompare(b.club);
        }

        return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" }) * multiplier
            || a.club.localeCompare(b.club);
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

export default function EgyptNTClubsList({
    squadData,
    matches,
    lineupDetails,
    playerDetails,
    gkDetails,
    groupingMode = GROUPING_MODES.CLUB,
    onDetailsViewChange
}) {
    const [selectedClub, setSelectedClub] = useState(null);
    const [viewMode, setViewMode] = useState("callups"); // "callups" | "scoring"
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "goals", direction: "desc" });
    const [selectedChampionships, setSelectedChampionships] = useState([]);

    useEffect(() => {
        onDetailsViewChange?.(Boolean(selectedClub));
        return () => onDetailsViewChange?.(false);
    }, [selectedClub, onDetailsViewChange]);

    useEffect(() => {
        setSelectedClub(null);
        setCurrentPage(1);
        setSearchTerm("");
    }, [groupingMode]);

    const groupColumnLabel = getGroupColumnLabel(groupingMode);

    const scoringSortColumns = useMemo(() => (
        SORT_COLUMNS_SCORING.map(column => (
            column.key === "club"
                ? { ...column, label: groupColumnLabel }
                : column
        ))
    ), [groupColumnLabel]);

    const uniqueChampionships = useMemo(() => {
        const champs = (squadData || []).map(item => String(item.CHAMPION || "").trim()).filter(Boolean);
        return [...new Set(champs)].sort();
    }, [squadData]);

    const filteredSquadData = useMemo(() => {
        if (selectedChampionships.length === 0) return squadData;
        return (squadData || []).filter(item => selectedChampionships.includes(String(item.CHAMPION || "").trim()));
    }, [squadData, selectedChampionships]);

    const filteredMatches = useMemo(() => {
        if (selectedChampionships.length === 0) return matches;
        return (matches || []).filter(match => selectedChampionships.includes(String(match.CHAMPION || "").trim()));
    }, [matches, selectedChampionships]);

    // Process squad/call-up club stats
    const callupClubStats = useMemo(() => {
        const stats = {};

        (filteredSquadData || []).forEach(item => {
            const clubRaw = String(item.CLUB || "").trim();
            if (!clubRaw) return;

            const groupKey = getGroupKey(clubRaw, groupingMode);
            if (!groupKey) return;

            if (!stats[groupKey]) {
                stats[groupKey] = {
                    name: groupKey,
                    players: new Set(),
                    champions: new Set(),
                    seasons: new Set()
                };
            }

            if (item.PLAYERNAME) {
                stats[groupKey].players.add(String(item.PLAYERNAME).trim());
            }

            if (item.CHAMPION) {
                stats[groupKey].champions.add(String(item.CHAMPION).trim());
            }

            if (item.SEASON) {
                stats[groupKey].seasons.add(String(item.SEASON).trim());
            }
        });

        return Object.values(stats)
            .map(c => ({
                name: c.name,
                playerCount: c.players.size,
                championCount: c.champions.size,
                seasonCount: c.seasons.size
            }))
            .sort((a, b) =>
                b.playerCount - a.playerCount ||
                b.championCount - a.championCount ||
                b.seasonCount - a.seasonCount ||
                a.name.localeCompare(b.name)
            );
    }, [filteredSquadData, groupingMode]);

    // Process scoring club stats
    const scoringClubStats = useMemo(() => {
        return buildScoringClubStats(
            playerDetails,
            filteredMatches,
            groupingMode,
            filteredSquadData,
            { lineupDetails, gkDetails }
        );
    }, [playerDetails, filteredMatches, groupingMode, filteredSquadData, lineupDetails, gkDetails]);

    // Search and sort call-up clubs
    const filteredCallupClubs = useMemo(() => {
        const list = callupClubStats;
        if (!searchTerm.trim()) return list;
        const query = searchTerm.toLowerCase().trim();
        return list.filter(c => c.name.toLowerCase().includes(query));
    }, [callupClubStats, searchTerm]);

    // Search and sort scoring clubs
    const filteredScoringClubs = useMemo(() => {
        const list = scoringClubStats;
        if (!searchTerm.trim()) return list;
        const query = searchTerm.toLowerCase().trim();
        return list.filter(c => c.club.toLowerCase().includes(query));
    }, [scoringClubStats, searchTerm]);

    const sortedScoringClubs = useMemo(() => {
        return sortRows(filteredScoringClubs, sortConfig);
    }, [filteredScoringClubs, sortConfig]);

    // Pagination for both
    const paginatedCallups = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredCallupClubs.slice(start, start + PAGE_SIZE);
    }, [filteredCallupClubs, currentPage]);

    const paginatedScoring = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedScoringClubs.slice(start, start + PAGE_SIZE);
    }, [sortedScoringClubs, currentPage]);

    const totalPages = useMemo(() => {
        const totalRows = viewMode === "callups" ? filteredCallupClubs.length : sortedScoringClubs.length;
        return Math.ceil(totalRows / PAGE_SIZE);
    }, [viewMode, filteredCallupClubs, sortedScoringClubs]);

    // Totals for scoring
    const scoringTotals = useMemo(() => {
        return filteredScoringClubs.reduce(
            (acc, club) => {
                acc.ga += club.ga;
                acc.goals += club.goals;
                acc.assists += club.assists;
                acc.penGoals += club.penGoals;
                acc.matchCount += club.matchCount;
                acc.minutes += club.minutes;
                return acc;
            },
            { ga: 0, goals: 0, assists: 0, penGoals: 0, matchCount: 0, minutes: 0 }
        );
    }, [filteredScoringClubs]);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
        }));
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕";
        return sortConfig.direction === "asc" ? "↑" : "↓";
    };

    if (selectedClub) {
        return (
            <EgyptNTClubDetails
                groupKey={selectedClub}
                groupingMode={groupingMode}
                squadData={filteredSquadData}
                matches={filteredMatches}
                lineupDetails={lineupDetails}
                playerDetails={playerDetails}
                gkDetails={gkDetails}
                onBack={() => setSelectedClub(null)}
            />
        );
    }

    return (
        <div className="squad-subtab-container fade-in">
            {/* View Mode Toggle Switcher */}
            <div className="squad-subtabs-switcher" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <button
                    type="button"
                    className={`subtab-btn ${viewMode === "callups" ? "active" : ""}`}
                    onClick={() => { setViewMode("callups"); setCurrentPage(1); setSearchTerm(""); setSelectedChampionships([]); }}
                    style={{ fontSize: "16px", padding: "10px 20px" }}
                >
                    📊 Call-up Stats
                </button>
                <button
                    type="button"
                    className={`subtab-btn ${viewMode === "scoring" ? "active" : ""}`}
                    onClick={() => { setViewMode("scoring"); setCurrentPage(1); setSearchTerm(""); setSelectedChampionships([]); }}
                    style={{ fontSize: "16px", padding: "10px 20px" }}
                >
                    ⚽ Scoring Stats
                </button>
            </div>

            <div className="squad-search-wrap" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", flexWrap: "wrap", marginBottom: "20px" }}>
                {/* Championships Multi-Select Dropdown */}
                <div style={{ minWidth: "220px", width: "260px" }}>
                    <MultiSelectDropdown
                        options={uniqueChampionships}
                        selectedValues={selectedChampionships}
                        onChange={(vals) => { setSelectedChampionships(vals); setCurrentPage(1); }}
                        placeholder="All Tournaments"
                    />
                </div>

                {/* Search Input */}
                <div style={{ minWidth: "250px", width: "320px" }}>
                    <SearchBar_db
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search club name..."
                    />
                </div>
            </div>

            <div className="squad-table-container">
                {viewMode === "callups" ? (
                    <table className="luxury-squad-table">
                        <colgroup>
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "35%" }} />
                            <col style={{ width: "20%" }} />
                            <col style={{ width: "20%" }} />
                            <col style={{ width: "20%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{groupColumnLabel}</th>
                                <th style={{ textAlign: "center" }}>NUMBER OF PLAYERS</th>
                                <th style={{ textAlign: "center" }}>NUMBER OF TOURNAMENTS</th>
                                <th style={{ textAlign: "center" }}>NUMBER OF SEASONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCallups.length === 0 ? (
                                <NoData_db
                                    isTable
                                    colSpan={5}
                                    message="No clubs found matching your query."
                                    height="200px"
                                />
                            ) : (
                                paginatedCallups.map((club, idx) => (
                                    <tr key={club.name}>
                                        <td className="row-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td className="club-name-cell">
                                            <button
                                                type="button"
                                                className="club-name-link"
                                                onClick={() => setSelectedClub(club.name)}
                                                title={`View ${club.name} details`}
                                            >
                                                {club.name}
                                            </button>
                                        </td>
                                        <td className="count-cell highlight-blue">{club.playerCount} Players</td>
                                        <td className="count-cell highlight-gold">{club.championCount} Tournaments</td>
                                        <td className="count-cell">{club.seasonCount} Seasons</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="luxury-squad-table">
                        <colgroup>
                            <col style={{ width: "4%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "7%" }} />
                            <col style={{ width: "7%" }} />
                            <col style={{ width: "7%" }} />
                            <col style={{ width: "7%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "8%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                {scoringSortColumns.map(column => (
                                    <th
                                        key={column.key}
                                        className="club-sortable-header"
                                        onClick={() => handleSort(column.key)}
                                    >
                                        {column.label}{" "}
                                        <span className="club-sort-icon">{getSortIcon(column.key)}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedScoring.length === 0 ? (
                                <NoData_db
                                    isTable
                                    colSpan={scoringSortColumns.length + 1}
                                    message="No clubs found matching your query."
                                    height="200px"
                                />
                            ) : (
                                paginatedScoring.map((club, idx) => (
                                    <tr key={club.club}>
                                        <td className="row-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td className="club-name-cell">
                                            <button
                                                type="button"
                                                className="club-name-link"
                                                onClick={() => setSelectedClub(club.club)}
                                                title={`View ${club.club} scoring stats`}
                                            >
                                                {club.club}
                                            </button>
                                        </td>
                                        <td className="club-stat-cell">{club.scorersCount}</td>
                                        <td className="club-stat-cell highlight-gold">{club.ga}</td>
                                        <td className="club-stat-cell g-val">{club.goals}</td>
                                        <td className="club-stat-cell a-val">{club.assists}</td>
                                        <td className="club-stat-cell">{club.penGoals}</td>
                                        <td className="club-stat-cell">{club.seasonCount}</td>
                                        <td className="club-stat-cell">{club.matchCount}</td>
                                        <td className="club-stat-cell">{club.minutes}</td>
                                    </tr>
                                ))
                            )}
                            {paginatedScoring.length > 0 && filteredScoringClubs.length > 0 && (
                                <tr className="club-stats-total-row">
                                    <td />
                                    <td className="player-name-cell">TOTAL</td>
                                    <td>—</td>
                                    <td className="club-stat-cell highlight-gold">{scoringTotals.ga}</td>
                                    <td className="club-stat-cell g-val">{scoringTotals.goals}</td>
                                    <td className="club-stat-cell a-val">{scoringTotals.assists}</td>
                                    <td className="club-stat-cell">{scoringTotals.penGoals}</td>
                                    <td>—</td>
                                    <td className="club-stat-cell">{scoringTotals.matchCount}</td>
                                    <td className="club-stat-cell">{scoringTotals.minutes}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="squad-pagination">
                    <button
                        type="button"
                        className="pag-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        ←
                    </button>
                    <span className="pag-info">
                        Page <strong>{currentPage}</strong> of {totalPages}
                    </span>
                    <button
                        type="button"
                        className="pag-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}
