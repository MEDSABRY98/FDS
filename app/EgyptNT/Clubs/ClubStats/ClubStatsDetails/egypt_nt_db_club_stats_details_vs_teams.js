"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../../../lib/SearchBar_db";
import NoData_db from "../../../../lib/NoData_db";

const SORT_COLUMNS = [
    { key: "name", label: "OPPONENT TEAM" },
    { key: "matches", label: "MATCHES" },
    { key: "ga", label: "G+A" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "penGoals", label: "PEN G" },
    { key: "playerCount", label: "PLAYERS" }
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

    return [...rows].sort((a, b) => {
        const valueA = getSortValue(a, key);
        const valueB = getSortValue(b, key);

        if (typeof valueA === "number" && typeof valueB === "number") {
            return (valueA - valueB) * multiplier || a.name.localeCompare(b.name);
        }

        return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" }) * multiplier
            || a.name.localeCompare(b.name);
    });
}

export default function ClubStatsDetailsVsTeams({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "goals", direction: "desc" });

    const vsTeams = clubStats?.vsTeams || [];

    const filteredTeams = useMemo(() => {
        if (!searchTerm.trim()) return vsTeams;
        const query = searchTerm.toLowerCase().trim();
        return vsTeams.filter(team => team.name.toLowerCase().includes(query));
    }, [vsTeams, searchTerm]);

    const sortedTeams = useMemo(
        () => sortRows(filteredTeams, sortConfig),
        [filteredTeams, sortConfig]
    );

    const paginatedTeams = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedTeams.slice(start, start + PAGE_SIZE);
    }, [sortedTeams, currentPage]);

    const totalPages = Math.ceil(sortedTeams.length / PAGE_SIZE);

    const totals = useMemo(() => {
        return filteredTeams.reduce(
            (acc, team) => {
                acc.matches += team.matches;
                acc.ga += team.ga;
                acc.goals += team.goals;
                acc.assists += team.assists;
                acc.penGoals += team.penGoals;
                return acc;
            },
            { matches: 0, ga: 0, goals: 0, assists: 0, penGoals: 0 }
        );
    }, [filteredTeams]);

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

    if (vsTeams.length === 0) {
        return <NoData_db message="NO VS TEAMS DATA AVAILABLE FOR THIS CLUB" height="240px" />;
    }

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search opponent team..."
                />
            </div>

            <div className="squad-table-container">
                <table className="luxury-squad-table">
                    <colgroup>
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "28%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
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
                        {paginatedTeams.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={SORT_COLUMNS.length + 1}
                                message="No opponent teams found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedTeams.map((team, idx) => (
                                <tr key={team.name}>
                                    <td className="row-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                    <td className="player-name-cell">{team.name}</td>
                                    <td className="club-stat-cell">{team.matches}</td>
                                    <td className="club-stat-cell highlight-gold">{team.ga}</td>
                                    <td className="club-stat-cell g-val">{team.goals}</td>
                                    <td className="club-stat-cell a-val">{team.assists}</td>
                                    <td className="club-stat-cell">{team.penGoals}</td>
                                    <td className="count-cell highlight-blue">{team.playerCount}</td>
                                </tr>
                            ))
                        )}
                        {filteredTeams.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td className="player-name-cell">TOTAL</td>
                                <td className="club-stat-cell">{totals.matches}</td>
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td className="club-stat-cell">{totals.penGoals}</td>
                                <td>—</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && sortedTeams.length > 0 && (
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
