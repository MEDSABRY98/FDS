"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import { buildClubOnlyPerformance, buildClubPlayerPerformance } from "./egypt_nt_db_squad_club_details";

const VIEW_MODES = {
    player: "player",
    club: "club"
};

const PLAYER_SORT_COLUMNS = [
    { key: "club", label: "CLUB NAME" },
    { key: "name", label: "PLAYER NAME" },
    { key: "position", label: "POSITION" },
    { key: "mp", label: "MP" },
    { key: "mins", label: "MINS" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "ga", label: "GA" },
    { key: "cs", label: "CS" }
];

const CLUB_SORT_COLUMNS = [
    { key: "club", label: "CLUB NAME" },
    { key: "playerCount", label: "PLAYERS" },
    { key: "mp", label: "MP" },
    { key: "mins", label: "MINS" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "ga", label: "GA" },
    { key: "cs", label: "CS" }
];

const PAGE_SIZE = 50;

function StatCell({ value, isGkOnly = false, active = true }) {
    if (isGkOnly && !active) {
        return <td className="club-stat-cell muted">—</td>;
    }

    return <td className="club-stat-cell">{value ?? 0}</td>;
}

function getSortValue(row, key, viewMode) {
    const stats = row.ntStats || {};

    switch (key) {
        case "club":
            return String(row.club || "").toLowerCase();
        case "name":
            return String(row.name || "").toLowerCase();
        case "position":
            return String(row.position || "").toLowerCase();
        case "playerCount":
            return row.playerCount ?? 0;
        case "mp":
            return stats.mp ?? 0;
        case "mins":
            return stats.mins ?? 0;
        case "goals":
            return stats.goals ?? 0;
        case "assists":
            return stats.assists ?? 0;
        case "ga":
            return stats.isGk ? (stats.ga ?? 0) : -1;
        case "cs":
            return stats.isGk ? (stats.cs ?? 0) : -1;
        default:
            return 0;
    }
}

function sortRows(rows, sortConfig, viewMode) {
    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
        const valueA = getSortValue(a, key, viewMode);
        const valueB = getSortValue(b, key, viewMode);

        if (typeof valueA === "number" && typeof valueB === "number") {
            return (valueA - valueB) * multiplier
                || a.club.localeCompare(b.club)
                || String(a.name || "").localeCompare(String(b.name || ""));
        }

        return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" }) * multiplier
            || a.club.localeCompare(b.club)
            || String(a.name || "").localeCompare(String(b.name || ""));
    });
}

export default function EgyptNTSquadClubPerformance({
    squadData,
    matches,
    lineupDetails,
    playerDetails,
    gkDetails
}) {
    const [viewMode, setViewMode] = useState(VIEW_MODES.player);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "mp", direction: "desc" });

    const matchData = useMemo(
        () => ({ matches, lineupDetails, playerDetails, gkDetails }),
        [matches, lineupDetails, playerDetails, gkDetails]
    );

    const playerRows = useMemo(
        () => buildClubPlayerPerformance(squadData, matchData),
        [squadData, matchData]
    );

    const clubRows = useMemo(
        () => buildClubOnlyPerformance(squadData, matchData),
        [squadData, matchData]
    );

    const performanceRows = viewMode === VIEW_MODES.club ? clubRows : playerRows;
    const sortColumns = viewMode === VIEW_MODES.club ? CLUB_SORT_COLUMNS : PLAYER_SORT_COLUMNS;

    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return performanceRows;

        const query = searchTerm.toLowerCase().trim();

        if (viewMode === VIEW_MODES.club) {
            return performanceRows.filter(row => row.club.toLowerCase().includes(query));
        }

        return performanceRows.filter(row =>
            row.club.toLowerCase().includes(query) ||
            row.name.toLowerCase().includes(query) ||
            String(row.position || "").toLowerCase().includes(query)
        );
    }, [performanceRows, searchTerm, viewMode]);

    const sortedRows = useMemo(
        () => sortRows(filteredRows, sortConfig, viewMode),
        [filteredRows, sortConfig, viewMode]
    );

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedRows.slice(start, start + PAGE_SIZE);
    }, [sortedRows, currentPage]);

    const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE);

    const handleViewChange = (mode) => {
        setViewMode(mode);
        setSearchTerm("");
        setCurrentPage(1);
        setSortConfig({ key: "mp", direction: "desc" });
    };

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

    if (playerRows.length === 0) {
        return <NoData_db message="NO CLUB PERFORMANCE DATA AVAILABLE" height="240px" />;
    }

    return (
        <div className="squad-subtab-container fade-in">
            <div className="club-performance-toolbar">
                <div className="squad-subtabs-switcher">
                    <button
                        type="button"
                        className={`subtab-btn ${viewMode === VIEW_MODES.player ? "active" : ""}`}
                        onClick={() => handleViewChange(VIEW_MODES.player)}
                    >
                        By Player
                    </button>
                    <button
                        type="button"
                        className={`subtab-btn ${viewMode === VIEW_MODES.club ? "active" : ""}`}
                        onClick={() => handleViewChange(VIEW_MODES.club)}
                    >
                        Only Club
                    </button>
                </div>

                <SearchBar_db
                    className="club-performance-search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={viewMode === VIEW_MODES.club ? "Search club name..." : "Search club, player, position..."}
                />
            </div>

            <div className="squad-table-container club-season-table-wrap">
                <table className="luxury-squad-table club-season-stats-table">
                    <colgroup>
                        <col style={{ width: "4%" }} />
                        {viewMode === VIEW_MODES.club ? (
                            <>
                                <col style={{ width: "22%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "8%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "8%" }} />
                                <col style={{ width: "8%" }} />
                                <col style={{ width: "9%" }} />
                                <col style={{ width: "9%" }} />
                            </>
                        ) : (
                            <>
                                <col style={{ width: "16%" }} />
                                <col style={{ width: "16%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "6%" }} />
                                <col style={{ width: "8%" }} />
                                <col style={{ width: "6%" }} />
                                <col style={{ width: "6%" }} />
                                <col style={{ width: "7%" }} />
                                <col style={{ width: "7%" }} />
                            </>
                        )}
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            {sortColumns.map(column => (
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
                        {paginatedRows.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={sortColumns.length + 1}
                                message="No club performance rows found matching your query."
                                height="200px"
                            />
                        ) : viewMode === VIEW_MODES.club ? (
                            paginatedRows.map((row, idx) => {
                                const stats = row.ntStats || {};
                                return (
                                    <tr key={`${row.club}-${idx}`}>
                                        <td className="row-num club-row-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td className="club-name-cell">{row.club}</td>
                                        <StatCell value={row.playerCount} />
                                        <StatCell value={stats.mp} />
                                        <StatCell value={stats.mins} />
                                        <StatCell value={stats.goals} />
                                        <StatCell value={stats.assists} />
                                        <StatCell value={stats.ga} isGkOnly active={stats.isGk} />
                                        <StatCell value={stats.cs} isGkOnly active={stats.isGk} />
                                    </tr>
                                );
                            })
                        ) : (
                            paginatedRows.map((row, idx) => {
                                const stats = row.ntStats || {};
                                return (
                                    <tr key={`${row.club}-${row.name}-${idx}`}>
                                        <td className="row-num club-row-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td className="club-name-cell">{row.club}</td>
                                        <td className="player-name-cell">{row.name}</td>
                                        <td>{row.position}</td>
                                        <StatCell value={stats.mp} />
                                        <StatCell value={stats.mins} />
                                        <StatCell value={stats.goals} />
                                        <StatCell value={stats.assists} />
                                        <StatCell value={stats.ga} isGkOnly active={stats.isGk} />
                                        <StatCell value={stats.cs} isGkOnly active={stats.isGk} />
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && sortedRows.length > 0 && (
                <div className="squad-pagination">
                    <button
                        className="pag-btn"
                        onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                    >
                        ←
                    </button>
                    <span className="pag-info">
                        Page <strong>{currentPage}</strong> of {totalPages}
                    </span>
                    <button
                        className="pag-btn"
                        onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}
