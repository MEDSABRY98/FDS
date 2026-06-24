"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar_db from "../../../lib/SearchBar_db";
import NoData_db from "../../../lib/NoData_db";
import { buildScoringClubStats } from "./egypt_nt_db_club_stats_utils";
import EgyptNTClubStatsDetails from "./ClubStatsDetails/egypt_nt_db_club_stats_details";

const SORT_COLUMNS = [
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

export default function EgyptNTClubStatsClubs({
    playerDetails,
    filteredMatches,
    onDetailsViewChange
}) {
    const [selectedClub, setSelectedClub] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "goals", direction: "desc" });

    useEffect(() => {
        onDetailsViewChange?.(Boolean(selectedClub));
        return () => onDetailsViewChange?.(false);
    }, [selectedClub, onDetailsViewChange]);

    const clubStats = useMemo(
        () => buildScoringClubStats(playerDetails, filteredMatches),
        [playerDetails, filteredMatches]
    );

    const filteredClubs = useMemo(() => {
        if (!searchTerm.trim()) return clubStats;
        const query = searchTerm.toLowerCase().trim();
        return clubStats.filter(c => c.club.toLowerCase().includes(query));
    }, [clubStats, searchTerm]);

    const sortedClubs = useMemo(
        () => sortRows(filteredClubs, sortConfig),
        [filteredClubs, sortConfig]
    );

    const paginatedClubs = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedClubs.slice(start, start + PAGE_SIZE);
    }, [sortedClubs, currentPage]);

    const totalPages = Math.ceil(sortedClubs.length / PAGE_SIZE);

    const totals = useMemo(() => {
        return filteredClubs.reduce(
            (acc, club) => {
                acc.ga += club.ga;
                acc.goals += club.goals;
                acc.assists += club.assists;
                acc.penGoals += club.penGoals;
                return acc;
            },
            { ga: 0, goals: 0, assists: 0, penGoals: 0 }
        );
    }, [filteredClubs]);

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
            <EgyptNTClubStatsDetails
                clubName={selectedClub}
                playerDetails={playerDetails}
                filteredMatches={filteredMatches}
                onBack={() => setSelectedClub(null)}
            />
        );
    }

    if (clubStats.length === 0) {
        return <NoData_db message="NO SCORING CLUB DATA AVAILABLE" height="240px" />;
    }

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search club name..."
                />
            </div>

            <div className="squad-table-container">
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
                            {SORT_COLUMNS.map(column => (
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
                        {paginatedClubs.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={SORT_COLUMNS.length + 1}
                                message="No clubs found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedClubs.map((club, idx) => (
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
                        {paginatedClubs.length > 0 && filteredClubs.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td className="player-name-cell">TOTAL</td>
                                <td>—</td>
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td className="club-stat-cell">{totals.penGoals}</td>
                                <td>—</td>
                                <td>—</td>
                                <td>—</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && sortedClubs.length > 0 && (
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
