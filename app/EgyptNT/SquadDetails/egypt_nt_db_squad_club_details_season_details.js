"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";

const SORT_COLUMNS = [
    { key: "name", label: "PLAYER NAME" },
    { key: "position", label: "POSITION" },
    { key: "champion", label: "TOURNAMENT" },
    { key: "mp", label: "MP" },
    { key: "mins", label: "MINS" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "ga", label: "GA" },
    { key: "cs", label: "CS" }
];

function StatCell({ value, isGkOnly = false, active = true }) {
    if (isGkOnly && !active) {
        return <td className="club-stat-cell muted">—</td>;
    }

    return <td className="club-stat-cell">{value ?? 0}</td>;
}

function getSortValue(player, key) {
    const stats = player.ntStats || {};

    switch (key) {
        case "name":
            return String(player.name || "").toLowerCase();
        case "position":
            return String(player.position || "").toLowerCase();
        case "champion":
            return String(player.champion || "").toLowerCase();
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

function sortPlayers(players, sortConfig) {
    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    return [...players].sort((a, b) => {
        const valueA = getSortValue(a, key);
        const valueB = getSortValue(b, key);

        if (typeof valueA === "number" && typeof valueB === "number") {
            return (valueA - valueB) * multiplier || a.name.localeCompare(b.name);
        }

        return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" }) * multiplier
            || a.name.localeCompare(b.name);
    });
}

function SeasonPlayersTable({ players }) {
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const sortedPlayers = useMemo(
        () => sortPlayers(players, sortConfig),
        [players, sortConfig]
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

    return (
        <div className="squad-table-container club-season-table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
            <table className="luxury-squad-table club-season-stats-table">
                <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "7%" }} />
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
                                {column.label} <span className="club-sort-icon">{getSortIcon(column.key)}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map((player, idx) => {
                        const stats = player.ntStats || {};
                        return (
                            <tr key={`${player.name}-${player.champion}-${player.position}-${idx}`}>
                                <td className="row-num club-row-num">{idx + 1}</td>
                                <td className="player-name-cell">{player.name}</td>
                                <td>{player.position}</td>
                                <td>{player.champion}</td>
                                <StatCell value={stats.mp} />
                                <StatCell value={stats.mins} />
                                <StatCell value={stats.goals} />
                                <StatCell value={stats.assists} />
                                <StatCell value={stats.ga} isGkOnly active={stats.isGk} />
                                <StatCell value={stats.cs} isGkOnly active={stats.isGk} />
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function ClubDetailsSeasonDetails({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const seasonGroups = clubStats?.seasonGroups || [];

    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return seasonGroups;

        const query = searchTerm.toLowerCase().trim();
        return seasonGroups
            .map(group => {
                const seasonMatch = group.season.toLowerCase().includes(query);
                const players = seasonMatch
                    ? group.players
                    : group.players.filter(player =>
                        player.name.toLowerCase().includes(query) ||
                        String(player.position || "").toLowerCase().includes(query) ||
                        player.champion.toLowerCase().includes(query)
                    );

                if (players.length === 0) return null;
                return { ...group, players };
            })
            .filter(Boolean);
    }, [seasonGroups, searchTerm]);

    if (seasonGroups.length === 0) {
        return <NoData_db message="NO SEASON DATA AVAILABLE FOR THIS CLUB" height="240px" />;
    }

    return (
        <div className="fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search season, player, position, tournament..."
                />
            </div>

            {filteredGroups.length === 0 ? (
                <NoData_db message="No season details found matching your query." height="200px" />
            ) : (
                <>
                    <h3 className="club-details-section-title">SEASON BREAKDOWN</h3>
                    {filteredGroups.map(group => (
                        <div key={group.season} className="club-season-block">
                            <div className="club-season-block-header">
                                <div className="club-season-block-title">{group.season}</div>
                                <div className="club-season-block-meta">
                                    {group.callups} call-ups · {group.players.length} players · {group.champions.length} tournaments
                                </div>
                            </div>
                            <SeasonPlayersTable players={group.players} />
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
