"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import { buildScoringClubStats } from "./egypt_nt_db_clubs_utils";
import EgyptNTClubDetails from "./egypt_nt_db_club_details";

const SORT_COLUMNS_SCORING = [
    { key: "club", label: "CLUB NAME" },
    { key: "scorersCount", label: "SCORERS" },
    { key: "ga", label: "G+A" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "penGoals", label: "PEN G" },
    { key: "championshipCount", label: "TOURNAMENTS" },
    { key: "firstDate", label: "FIRST" },
    { key: "lastDate", label: "LAST" }
];

const PAGE_SIZE = 50;

function getSortValue(row, key) {
    switch (key) {
        case "club":
            return String(row.club || "").toLowerCase();
        case "firstDate":
        case "lastDate":
            return String(row[key] || "");
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

export default function EgyptNTClubsList({
    squadData,
    matches,
    lineupDetails,
    playerDetails,
    gkDetails,
    onDetailsViewChange
}) {
    const [selectedClub, setSelectedClub] = useState(null);
    const [viewMode, setViewMode] = useState("callups"); // "callups" | "scoring"
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "goals", direction: "desc" });

    useEffect(() => {
        onDetailsViewChange?.(Boolean(selectedClub));
        return () => onDetailsViewChange?.(false);
    }, [selectedClub, onDetailsViewChange]);

    // Process squad/call-up club stats
    const callupClubStats = useMemo(() => {
        const stats = {};

        (squadData || []).forEach(item => {
            const club = String(item.CLUB || "").trim();
            if (!club) return;

            if (!stats[club]) {
                stats[club] = {
                    name: club,
                    players: new Set(),
                    champions: new Set()
                };
            }

            if (item.PLAYERNAME) {
                stats[club].players.add(String(item.PLAYERNAME).trim());
            }

            if (item.CHAMPION) {
                stats[club].champions.add(String(item.CHAMPION).trim());
            }
        });

        return Object.values(stats)
            .map(c => ({
                name: c.name,
                playerCount: c.players.size,
                championCount: c.champions.size
            }))
            .sort((a, b) => b.playerCount - a.playerCount || b.championCount - a.championCount || a.name.localeCompare(b.name));
    }, [squadData]);

    // Process scoring club stats
    const scoringClubStats = useMemo(() => {
        return buildScoringClubStats(playerDetails, matches);
    }, [playerDetails, matches]);

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
                return acc;
            },
            { ga: 0, goals: 0, assists: 0, penGoals: 0 }
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
                clubName={selectedClub}
                squadData={squadData}
                matches={matches}
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
                    onClick={() => { setViewMode("callups"); setCurrentPage(1); setSearchTerm(""); }}
                    style={{ fontSize: "16px", padding: "10px 20px" }}
                >
                    📊 Call-up Stats
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

            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search club name..."
                />
            </div>

            <div className="squad-table-container">
                {viewMode === "callups" ? (
                    <table className="luxury-squad-table">
                        <colgroup>
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "45%" }} />
                            <col style={{ width: "25%" }} />
                            <col style={{ width: "25%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>CLUB NAME</th>
                                <th style={{ textAlign: "center" }}>NUMBER OF PLAYERS</th>
                                <th style={{ textAlign: "center" }}>NUMBER OF TOURNAMENTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCallups.length === 0 ? (
                                <NoData_db
                                    isTable
                                    colSpan={4}
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
                            <col style={{ width: "9%" }} />
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
                                        <td className="club-stat-cell">{club.championshipCount}</td>
                                        <td className="club-stat-cell date-cell">{club.firstDate || "—"}</td>
                                        <td className="club-stat-cell date-cell">{club.lastDate || "—"}</td>
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
                                    <td>—</td>
                                    <td>—</td>
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
