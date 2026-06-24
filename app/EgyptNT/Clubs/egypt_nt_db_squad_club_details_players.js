"use client";

import { useState, useMemo } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";

export default function ClubDetailsPlayers({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [seasonsModalPlayer, setSeasonsModalPlayer] = useState(null);
    const pageSize = 50;

    const filteredPlayers = useMemo(() => {
        const list = clubStats?.players || [];
        if (!searchTerm) return list;
        const query = searchTerm.toLowerCase().trim();
        return list.filter(p =>
            p.name.toLowerCase().includes(query) ||
            String(p.position || "").toLowerCase().includes(query)
        );
    }, [clubStats, searchTerm]);

    const paginatedPlayers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPlayers.slice(start, start + pageSize);
    }, [filteredPlayers, currentPage]);

    const totalPages = Math.ceil(filteredPlayers.length / pageSize);

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
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "25%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>PLAYER NAME</th>
                            <th>CALL-UPS</th>
                            <th>POSITION</th>
                            <th style={{ textAlign: "center" }}>VIEW</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPlayers.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={5}
                                message="No players found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedPlayers.map((player, idx) => (
                                <tr key={player.name}>
                                    <td className="row-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td className="player-name-cell">{player.name}</td>
                                    <td className="callups-count">{player.callups} Times</td>
                                    <td>{player.position}</td>
                                    <td style={{ textAlign: "center" }}>
                                        <button
                                            type="button"
                                            className="club-view-btn"
                                            onClick={() => setSeasonsModalPlayer(player)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
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
