"use client";

import { useState, useMemo } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import NoData_db from "../../lib/NoData_db";
import { buildPlayerClubStats } from "./egypt_nt_db_clubs_utils";

const SORT_COLUMNS_SCORING = [
    { key: "club", label: "CLUB NAME" },
    { key: "player", label: "PLAYER NAME" },
    { key: "ga", label: "G+A" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "penGoals", label: "PEN G" }
];

const PAGE_SIZE = 50;

function getSortValue(row, key) {
    switch (key) {
        case "club":
            return String(row.club || "").toLowerCase();
        case "player":
            return String(row.player || "").toLowerCase();
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
            return (valueA - valueB) * multiplier
                || a.club.localeCompare(b.club)
                || a.player.localeCompare(b.player);
        }

        return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" }) * multiplier
            || a.club.localeCompare(b.club)
            || a.player.localeCompare(b.player);
    });
}

export default function EgyptNTClubsPlayers({ squadData, playerDetails, filteredMatches }) {
    const [viewMode, setViewMode] = useState("callups"); // "callups" | "scoring"
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    
    // Callup-specific states
    const [clubModalPlayer, setClubModalPlayer] = useState(null);
    const [champModalPlayer, setChampModalPlayer] = useState(null);
    const [seasonsModalPlayer, setSeasonsModalPlayer] = useState(null);

    // Scoring-specific states
    const [clubFilter, setClubFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState({ key: "goals", direction: "desc" });

    // 1. Process Callup player statistics
    const callupPlayerStats = useMemo(() => {
        const stats = {};

        (squadData || []).forEach(item => {
            const name = String(item.PLAYERNAME || "").trim();
            if (!name) return;

            if (!stats[name]) {
                stats[name] = {
                    name,
                    callups: 0,
                    clubs: {},
                    champions: {},
                    seasonsByChamp: {}
                };
            }

            stats[name].callups += 1;

            const club = String(item.CLUB || "Unknown").trim();
            stats[name].clubs[club] = (stats[name].clubs[club] || 0) + 1;

            const champ = String(item.CHAMPION || "Unknown").trim();
            stats[name].champions[champ] = (stats[name].champions[champ] || 0) + 1;

            const season = String(item.SEASON || "").trim();
            if (season) {
                if (!stats[name].seasonsByChamp[champ]) {
                    stats[name].seasonsByChamp[champ] = new Set();
                }
                stats[name].seasonsByChamp[champ].add(season);
            }
        });

        // Convert Sets to sorted arrays
        Object.values(stats).forEach(player => {
            for (const champ in player.seasonsByChamp) {
                player.seasonsByChamp[champ] = [...player.seasonsByChamp[champ]].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
            }
        });

        return Object.values(stats).sort((a, b) => b.callups - a.callups || a.name.localeCompare(b.name));
    }, [squadData]);

    // 2. Process Scoring player statistics
    const scoringPlayerRows = useMemo(
        () => buildPlayerClubStats(playerDetails, filteredMatches),
        [playerDetails, filteredMatches]
    );

    const clubOptions = useMemo(() => {
        const clubs = [...new Set(scoringPlayerRows.map(r => r.club))].sort((a, b) => a.localeCompare(b));
        return [
            { value: "all", label: "All Clubs" },
            ...clubs.map(club => ({ value: club, label: club }))
        ];
    }, [scoringPlayerRows]);

    // Filtering call-up players
    const filteredCallupPlayers = useMemo(() => {
        if (!searchTerm.trim()) return callupPlayerStats;
        const query = searchTerm.toLowerCase().trim();
        return callupPlayerStats.filter(p => p.name.toLowerCase().includes(query));
    }, [callupPlayerStats, searchTerm]);

    // Filtering & sorting scoring players
    const filteredScoringPlayers = useMemo(() => {
        let rows = scoringPlayerRows;

        if (clubFilter !== "all") {
            rows = rows.filter(row => row.club === clubFilter);
        }

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase().trim();
            rows = rows.filter(row =>
                row.club.toLowerCase().includes(query) ||
                row.player.toLowerCase().includes(query)
            );
        }

        return rows;
    }, [scoringPlayerRows, clubFilter, searchTerm]);

    const sortedScoringPlayers = useMemo(() => {
        return sortRows(filteredScoringPlayers, sortConfig);
    }, [filteredScoringPlayers, sortConfig]);

    // Paginated rows
    const paginatedCallups = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredCallupPlayers.slice(start, start + PAGE_SIZE);
    }, [filteredCallupPlayers, currentPage]);

    const paginatedScoring = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedScoringPlayers.slice(start, start + PAGE_SIZE);
    }, [sortedScoringPlayers, currentPage]);

    const totalPages = useMemo(() => {
        const totalRows = viewMode === "callups" ? filteredCallupPlayers.length : sortedScoringPlayers.length;
        return Math.ceil(totalRows / PAGE_SIZE);
    }, [viewMode, filteredCallupPlayers, sortedScoringPlayers]);

    // Totals for scoring
    const scoringTotals = useMemo(() => {
        return filteredScoringPlayers.reduce(
            (acc, row) => {
                acc.ga += row.ga;
                acc.goals += row.goals;
                acc.assists += row.assists;
                acc.penGoals += row.penGoals;
                return acc;
            },
            { ga: 0, goals: 0, assists: 0, penGoals: 0 }
        );
    }, [filteredScoringPlayers]);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    const handleClubFilterChange = (val) => {
        setClubFilter(val);
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

    return (
        <div className="squad-subtab-container fade-in">
            {/* Switcher */}
            <div className="squad-subtabs-switcher" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <button
                    type="button"
                    className={`subtab-btn ${viewMode === "callups" ? "active" : ""}`}
                    onClick={() => { setViewMode("callups"); setCurrentPage(1); setSearchTerm(""); }}
                    style={{ fontSize: "16px", padding: "10px 20px" }}
                >
                    📋 Call-up Stats
                </button>
                <button
                    type="button"
                    className={`subtab-btn ${viewMode === "scoring" ? "active" : ""}`}
                    onClick={() => { setViewMode("scoring"); setCurrentPage(1); setSearchTerm(""); }}
                    style={{ fontSize: "16px", padding: "10px 20px" }}
                >
                    ⚽ Scoring Stats
                </button>
            </div>

            {/* Toolbar */}
            <div className="club-performance-toolbar" style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
                {viewMode === "scoring" && (
                    <DropDownList_db
                        value={clubFilter}
                        onChange={handleClubFilterChange}
                        options={clubOptions}
                        placeholder="Filter by club..."
                        searchable={true}
                    />
                )}
                <SearchBar_db
                    className="club-performance-search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={viewMode === "callups" ? "Search player name..." : "Search club or player..."}
                />
            </div>

            {/* Table rendering */}
            <div className="squad-table-container">
                {viewMode === "callups" ? (
                    <table className="luxury-squad-table">
                        <colgroup>
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "32%" }} />
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "16%" }} />
                            <col style={{ width: "16%" }} />
                            <col style={{ width: "16%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>PLAYER NAME</th>
                                <th>CALL-UPS COUNT</th>
                                <th style={{ textAlign: "center" }}>CLUBS DETAILS</th>
                                <th style={{ textAlign: "center" }}>CHAMPIONS DETAILS</th>
                                <th style={{ textAlign: "center" }}>SEASONS DETAILS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCallups.length === 0 ? (
                                <NoData_db
                                    isTable
                                    colSpan={6}
                                    message="No players found matching your query."
                                    height="200px"
                                />
                            ) : (
                                paginatedCallups.map((player, idx) => (
                                    <tr key={player.name}>
                                        <td className="row-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td className="player-name-cell">{player.name}</td>
                                        <td className="callups-count">{player.callups} Times</td>
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                type="button"
                                                className="action-btn club-btn"
                                                onClick={() => setClubModalPlayer(player)}
                                                title="View Clubs"
                                                style={{ fontSize: "18px", padding: "6px 12px" }}
                                            >
                                                🏢
                                            </button>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                type="button"
                                                className="action-btn champ-btn"
                                                onClick={() => setChampModalPlayer(player)}
                                                title="View Tournaments"
                                                style={{ fontSize: "18px", padding: "6px 12px" }}
                                            >
                                                🏆
                                            </button>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                type="button"
                                                className="action-btn seasons-btn"
                                                onClick={() => setSeasonsModalPlayer(player)}
                                                title="View Seasons"
                                                style={{ fontSize: "18px", padding: "6px 12px" }}
                                            >
                                                🗓️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="luxury-squad-table">
                        <colgroup>
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "22%" }} />
                            <col style={{ width: "22%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                {SORT_COLUMNS_SCORING.map(column => (
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
                                    colSpan={SORT_COLUMNS_SCORING.length + 1}
                                    message="No player × club rows found matching your query."
                                    height="200px"
                                />
                            ) : (
                                paginatedScoring.map((row, idx) => (
                                    <tr key={`${row.club}-${row.player}-${idx}`}>
                                        <td className="row-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td className="club-name-cell">{row.club}</td>
                                        <td className="player-name-cell">{row.player}</td>
                                        <td className="club-stat-cell highlight-gold">{row.ga}</td>
                                        <td className="club-stat-cell g-val">{row.goals}</td>
                                        <td className="club-stat-cell a-val">{row.assists}</td>
                                        <td className="club-stat-cell">{row.penGoals}</td>
                                    </tr>
                                ))
                            )}
                            {paginatedScoring.length > 0 && filteredScoringPlayers.length > 0 && (
                                <tr className="club-stats-total-row">
                                    <td />
                                    <td colSpan={2} className="player-name-cell">TOTAL</td>
                                    <td className="club-stat-cell highlight-gold">{scoringTotals.ga}</td>
                                    <td className="club-stat-cell g-val">{scoringTotals.goals}</td>
                                    <td className="club-stat-cell a-val">{scoringTotals.assists}</td>
                                    <td className="club-stat-cell">{scoringTotals.penGoals}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
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

            {/* Modals for Call-ups */}
            {clubModalPlayer && (
                <div className="squad-modal-overlay" onClick={() => setClubModalPlayer(null)}>
                    <div className="squad-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🏢 Clubs representation for: <br /><span className="gold">{clubModalPlayer.name}</span></h3>
                            <button className="close-modal-btn" onClick={() => setClubModalPlayer(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <table className="modal-data-table">
                                <thead>
                                    <tr>
                                        <th>Club Name</th>
                                        <th style={{ width: "100px", textAlign: "center" }}>Call-ups</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(clubModalPlayer.clubs)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([club, count]) => (
                                            <tr key={club}>
                                                <td className="item-name">{club}</td>
                                                <td className="item-count">{count}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {champModalPlayer && (
                <div className="squad-modal-overlay" onClick={() => setChampModalPlayer(null)}>
                    <div className="squad-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🏆 Tournaments call-ups for: <br /><span className="gold">{champModalPlayer.name}</span></h3>
                            <button className="close-modal-btn" onClick={() => setChampModalPlayer(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <table className="modal-data-table">
                                <thead>
                                    <tr>
                                        <th>Tournament Name</th>
                                        <th style={{ width: "100px", textAlign: "center" }}>Call-ups</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(champModalPlayer.champions)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([champ, count]) => (
                                            <tr key={champ}>
                                                <td className="item-name">{champ}</td>
                                                <td className="item-count">{count}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {seasonsModalPlayer && (
                <div className="squad-modal-overlay" onClick={() => setSeasonsModalPlayer(null)}>
                    <div className="squad-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🗓️ Participated Seasons for: <br /><span className="gold">{seasonsModalPlayer.name}</span></h3>
                            <button className="close-modal-btn" onClick={() => setSeasonsModalPlayer(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-seasons-container">
                                {Object.entries(seasonsModalPlayer.seasonsByChamp).map(([champ, seasons]) => (
                                    <div key={champ} className="modal-champ-group">
                                        <h4 className="modal-champ-title">{champ}</h4>
                                        <div className="modal-seasons-list">
                                            {seasons.map(s => (
                                                <span key={s} className="modal-season-badge">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
