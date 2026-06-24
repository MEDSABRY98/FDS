"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../../lib/SearchBar_db";
import DropDownList_db from "../../../lib/DropDownList_db";
import NoData_db from "../../../lib/NoData_db";
import { buildPlayerClubStats } from "./egypt_nt_db_club_stats_utils";

const SORT_COLUMNS = [
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

export default function EgyptNTClubStatsPlayers({ playerDetails, filteredMatches }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [clubFilter, setClubFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "goals", direction: "desc" });

    const playerRows = useMemo(
        () => buildPlayerClubStats(playerDetails, filteredMatches),
        [playerDetails, filteredMatches]
    );

    const clubOptions = useMemo(() => {
        const clubs = [...new Set(playerRows.map(r => r.club))].sort((a, b) => a.localeCompare(b));
        return [
            { value: "all", label: "All Clubs" },
            ...clubs.map(club => ({ value: club, label: club }))
        ];
    }, [playerRows]);

    const filteredRows = useMemo(() => {
        let rows = playerRows;

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
    }, [playerRows, clubFilter, searchTerm]);

    const sortedRows = useMemo(
        () => sortRows(filteredRows, sortConfig),
        [filteredRows, sortConfig]
    );

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedRows.slice(start, start + PAGE_SIZE);
    }, [sortedRows, currentPage]);

    const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE);

    const totals = useMemo(() => {
        return filteredRows.reduce(
            (acc, row) => {
                acc.ga += row.ga;
                acc.goals += row.goals;
                acc.assists += row.assists;
                acc.penGoals += row.penGoals;
                return acc;
            },
            { ga: 0, goals: 0, assists: 0, penGoals: 0 }
        );
    }, [filteredRows]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleClubFilterChange = (value) => {
        setClubFilter(value);
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

    if (playerRows.length === 0) {
        return <NoData_db message="NO PLAYER × CLUB SCORING DATA AVAILABLE" height="240px" />;
    }

    return (
        <div className="squad-subtab-container fade-in">
            <div className="club-performance-toolbar">
                <DropDownList_db
                    value={clubFilter}
                    onChange={handleClubFilterChange}
                    options={clubOptions}
                    placeholder="Filter by club..."
                    searchable={true}
                />
                <SearchBar_db
                    className="club-performance-search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search club or player..."
                />
            </div>

            <div className="squad-table-container">
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
                        {paginatedRows.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={SORT_COLUMNS.length + 1}
                                message="No player × club rows found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedRows.map((row, idx) => (
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
                        {paginatedRows.length > 0 && filteredRows.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td colSpan={2} className="player-name-cell">TOTAL</td>
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td className="club-stat-cell">{totals.penGoals}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && sortedRows.length > 0 && (
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
