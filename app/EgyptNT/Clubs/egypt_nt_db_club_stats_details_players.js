"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";

export default function ClubStatsDetailsPlayers({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const filteredPlayers = useMemo(() => {
        const list = clubStats?.players || [];
        if (!searchTerm.trim()) return list;
        const query = searchTerm.toLowerCase().trim();
        return list.filter(p => p.name.toLowerCase().includes(query));
    }, [clubStats, searchTerm]);

    const paginatedPlayers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPlayers.slice(start, start + pageSize);
    }, [filteredPlayers, currentPage]);

    const totalPages = Math.ceil(filteredPlayers.length / pageSize);

    const totals = useMemo(() => {
        return filteredPlayers.reduce(
            (acc, player) => {
                acc.ga += player.ga;
                acc.goals += player.goals;
                acc.assists += player.assists;
                acc.penGoals += player.penGoals;
                return acc;
            },
            { ga: 0, goals: 0, assists: 0, penGoals: 0 }
        );
    }, [filteredPlayers]);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
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
                        <col style={{ width: "35%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>PLAYER NAME</th>
                            <th>G+A</th>
                            <th>G</th>
                            <th>A</th>
                            <th>PEN G</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPlayers.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={6}
                                message="No players found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedPlayers.map((player, idx) => (
                                <tr key={player.name}>
                                    <td className="row-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td className="player-name-cell">{player.name}</td>
                                    <td className="club-stat-cell highlight-gold">{player.ga}</td>
                                    <td className="club-stat-cell g-val">{player.goals}</td>
                                    <td className="club-stat-cell a-val">{player.assists}</td>
                                    <td className="club-stat-cell">{player.penGoals}</td>
                                </tr>
                            ))
                        )}
                        {paginatedPlayers.length > 0 && filteredPlayers.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td className="player-name-cell">TOTAL</td>
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td className="club-stat-cell">{totals.penGoals}</td>
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
        </div>
    );
}
