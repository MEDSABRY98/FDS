"use client";

import { useState, useMemo } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";

export default function ClubDetailsPlayers({ squadClubStats, scoringClubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [seasonsModalPlayer, setSeasonsModalPlayer] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: "ga", direction: "desc" });
    const pageSize = 50;

    // Merge players from both squad call-ups and scoring stats
    const mergedPlayers = useMemo(() => {
        const playerMap = {};

        // 1. Process squad call-ups
        const squadPlayersList = squadClubStats?.players || [];
        squadPlayersList.forEach(p => {
            playerMap[p.name] = {
                name: p.name,
                position: p.position || "—",
                callups: p.callups,
                seasonsByChamp: p.seasonsByChamp || {},
                goals: 0,
                assists: 0,
                penGoals: 0,
                ga: 0
            };
        });

        // 2. Process scoring stats
        const scoringPlayersList = scoringClubStats?.players || [];
        scoringPlayersList.forEach(p => {
            if (!playerMap[p.name]) {
                playerMap[p.name] = {
                    name: p.name,
                    position: "—",
                    callups: 0,
                    seasonsByChamp: {},
                    goals: p.goals,
                    assists: p.assists,
                    penGoals: p.penGoals,
                    ga: p.ga
                };
            } else {
                playerMap[p.name].goals = p.goals;
                playerMap[p.name].assists = p.assists;
                playerMap[p.name].penGoals = p.penGoals;
                playerMap[p.name].ga = p.ga;
            }
        });

        return Object.values(playerMap);
    }, [squadClubStats, scoringClubStats]);

    const filteredPlayers = useMemo(() => {
        if (!searchTerm.trim()) return mergedPlayers;
        const query = searchTerm.toLowerCase().trim();
        return mergedPlayers.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.position.toLowerCase().includes(query)
        );
    }, [mergedPlayers, searchTerm]);

    const sortedPlayers = useMemo(() => {
        const list = [...filteredPlayers];
        if (!sortConfig.key) return list;

        list.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === "name" || sortConfig.key === "position") {
                const strA = String(valA || "");
                const strB = String(valB || "");
                const comp = strA.localeCompare(strB, "ar");
                if (comp !== 0) {
                    return sortConfig.direction === "asc" ? comp : -comp;
                }
            } else {
                const numA = Number(valA) || 0;
                const numB = Number(valB) || 0;
                if (numA !== numB) {
                    return sortConfig.direction === "asc" ? numA - numB : numB - numA;
                }
            }

            // Fallback stable sorting:
            if (b.ga !== a.ga) return b.ga - a.ga;
            if (b.goals !== a.goals) return b.goals - a.goals;
            if (b.assists !== a.assists) return b.assists - a.assists;
            if (b.callups !== a.callups) return b.callups - a.callups;
            return a.name.localeCompare(b.name, "ar");
        });

        return list;
    }, [filteredPlayers, sortConfig]);

    const paginatedPlayers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedPlayers.slice(start, start + pageSize);
    }, [sortedPlayers, currentPage]);

    const totalPages = Math.ceil(filteredPlayers.length / pageSize);

    const totals = useMemo(() => {
        return filteredPlayers.reduce(
            (acc, player) => {
                acc.callups += player.callups;
                acc.ga += player.ga;
                acc.goals += player.goals;
                acc.assists += player.assists;
                acc.penGoals += player.penGoals;
                return acc;
            },
            { callups: 0, ga: 0, goals: 0, assists: 0, penGoals: 0 }
        );
    }, [filteredPlayers]);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        setSortConfig(prev => {
            let direction = "desc";
            if (prev.key === key) {
                direction = prev.direction === "desc" ? "asc" : "desc";
            }
            return { key, direction };
        });
        setCurrentPage(1);
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <span style={{ marginLeft: "6px", opacity: 0.3, fontSize: "11px" }}>⇅</span>;
        }
        return sortConfig.direction === "asc" ? (
            <span style={{ marginLeft: "6px", color: "var(--gold)", fontSize: "11px" }}>▲</span>
        ) : (
            <span style={{ marginLeft: "6px", color: "var(--gold)", fontSize: "11px" }}>▼</span>
        );
    };

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search player name..."
                />
            </div>

            <div className="squad-table-container">
                <table className="luxury-squad-table">
                    <colgroup>
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "8%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th className="sortable-header" onClick={() => handleSort("name")}>
                                PLAYER NAME {renderSortIcon("name")}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort("position")}>
                                POSITION {renderSortIcon("position")}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort("callups")} style={{ textAlign: "center" }}>
                                CALL-UPS {renderSortIcon("callups")}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort("ga")}>
                                G+A {renderSortIcon("ga")}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort("goals")}>
                                G {renderSortIcon("goals")}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort("assists")}>
                                A {renderSortIcon("assists")}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort("penGoals")}>
                                PEN G {renderSortIcon("penGoals")}
                            </th>
                            <th style={{ textAlign: "center" }}>SEASONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPlayers.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={9}
                                message="No players found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedPlayers.map((player, idx) => (
                                <tr key={player.name}>
                                    <td className="row-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td className="player-name-cell">{player.name}</td>
                                    <td>{player.position}</td>
                                    <td className="callups-count" style={{ textAlign: "center" }}>
                                        {player.callups > 0 ? `${player.callups} Times` : "—"}
                                    </td>
                                    <td className="club-stat-cell highlight-gold">{player.ga > 0 ? player.ga : "—"}</td>
                                    <td className="club-stat-cell g-val">{player.goals > 0 ? player.goals : "—"}</td>
                                    <td className="club-stat-cell a-val">{player.assists > 0 ? player.assists : "—"}</td>
                                    <td className="club-stat-cell">{player.penGoals > 0 ? player.penGoals : "—"}</td>
                                    <td style={{ textAlign: "center" }}>
                                        {player.callups > 0 ? (
                                            <button
                                                type="button"
                                                className="club-view-btn"
                                                onClick={() => setSeasonsModalPlayer(player)}
                                            >
                                                View
                                            </button>
                                        ) : "—"}
                                    </td>
                                </tr>
                            ))
                        )}
                        {paginatedPlayers.length > 0 && filteredPlayers.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td colSpan={2} className="player-name-cell">TOTAL</td>
                                <td style={{ textAlign: "center", fontWeight: "bold" }}>{totals.callups}</td>
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td className="club-stat-cell">{totals.penGoals}</td>
                                <td />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && filteredPlayers.length > 0 && (
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

            {seasonsModalPlayer && (
                <div className="squad-modal-overlay" onClick={() => setSeasonsModalPlayer(null)}>
                    <div className="squad-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                Participated Seasons for: <br />
                                <span className="gold">{seasonsModalPlayer.name}</span>
                            </h3>
                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={() => setSeasonsModalPlayer(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-seasons-container">
                                {Object.entries(seasonsModalPlayer.seasonsByChamp || {}).map(([champ, seasons]) => (
                                    <div key={champ} className="modal-champ-group">
                                        <h4 className="modal-champ-title">{champ}</h4>
                                        <div className="modal-seasons-list">
                                            {seasons.map(season => (
                                                <span key={season} className="modal-season-badge">{season}</span>
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
