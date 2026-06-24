"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../../../lib/SearchBar_db";
import NoData_db from "../../../../lib/NoData_db";
import { compareSeasonStatsRows } from "../egypt_nt_db_club_stats_utils";

const SORT_COLUMNS = [
    { key: "name", label: "SEASON" },
    { key: "matches", label: "MATCHES" },
    { key: "ga", label: "G+A" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "penGoals", label: "PEN G" },
    { key: "playerCount", label: "PLAYERS" },
    { key: "championCount", label: "TOURNAMENTS" }
];

const PAGE_SIZE = 50;

function getSortValue(row, key) {
    switch (key) {
        case "name":
            return String(row.name || "").toLowerCase();
        default:
            return row[key] ?? 0;
    }
}

function sortRows(rows, sortConfig) {
    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    if (key === "name") {
        return [...rows].sort((a, b) => compareSeasonStatsRows(a, b) * multiplier);
    }

    return [...rows].sort((a, b) => {
        const valueA = getSortValue(a, key);
        const valueB = getSortValue(b, key);

        if (typeof valueA === "number" && typeof valueB === "number") {
            return (valueA - valueB) * multiplier
                || compareSeasonStatsRows(a, b);
        }

        return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" }) * multiplier
            || compareSeasonStatsRows(a, b);
    });
}

export default function ClubStatsDetailsSeasons({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const seasons = clubStats?.seasons || [];

    const filteredSeasons = useMemo(() => {
        if (!searchTerm.trim()) return seasons;
        const query = searchTerm.toLowerCase().trim();
        return seasons.filter(season => season.name.toLowerCase().includes(query));
    }, [seasons, searchTerm]);

    const sortedSeasons = useMemo(
        () => sortRows(filteredSeasons, sortConfig),
        [filteredSeasons, sortConfig]
    );

    const paginatedSeasons = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedSeasons.slice(start, start + PAGE_SIZE);
    }, [sortedSeasons, currentPage]);

    const totalPages = Math.ceil(sortedSeasons.length / PAGE_SIZE);

    const totals = useMemo(() => {
        return filteredSeasons.reduce(
            (acc, season) => {
                acc.matches += season.matches;
                acc.ga += season.ga;
                acc.goals += season.goals;
                acc.assists += season.assists;
                acc.penGoals += season.penGoals;
                return acc;
            },
            { matches: 0, ga: 0, goals: 0, assists: 0, penGoals: 0 }
        );
    }, [filteredSeasons]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
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

    if (seasons.length === 0) {
        return <NoData_db message="NO SEASON DATA AVAILABLE FOR THIS CLUB" height="240px" />;
    }

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search season name..."
                />
            </div>

            <div className="squad-table-container">
                <table className="luxury-squad-table">
                    <colgroup>
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "12%" }} />
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
                        {paginatedSeasons.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={SORT_COLUMNS.length + 1}
                                message="No seasons found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedSeasons.map((season, idx) => (
                                <tr key={season.name}>
                                    <td className="row-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                    <td className="player-name-cell">{season.name}</td>
                                    <td className="club-stat-cell">{season.matches}</td>
                                    <td className="club-stat-cell highlight-gold">{season.ga}</td>
                                    <td className="club-stat-cell g-val">{season.goals}</td>
                                    <td className="club-stat-cell a-val">{season.assists}</td>
                                    <td className="club-stat-cell">{season.penGoals}</td>
                                    <td className="count-cell highlight-blue">{season.playerCount}</td>
                                    <td className="count-cell highlight-gold">{season.championCount}</td>
                                </tr>
                            ))
                        )}
                        {filteredSeasons.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td className="player-name-cell">TOTAL</td>
                                <td className="club-stat-cell">{totals.matches}</td>
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td className="club-stat-cell">{totals.penGoals}</td>
                                <td>—</td>
                                <td>—</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && sortedSeasons.length > 0 && (
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
