"use client";

import { useState, useMemo } from "react";
import SearchBar_db from "../lib/SearchBar_db";
import NoData_db from "../lib/NoData_db";
import "./egypt_nt_db_squad_players.css";

export default function EgyptNTSquadPlayers({ squadData }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [clubModalPlayer, setClubModalPlayer] = useState(null);
    const [champModalPlayer, setChampModalPlayer] = useState(null);
    const [seasonsModalPlayer, setSeasonsModalPlayer] = useState(null);
    const pageSize = 50;

    // Process player statistics
    const playerStats = useMemo(() => {
        const stats = {};
        
        (squadData || []).forEach(item => {
            const name = String(item.PLAYERNAME || "").trim();
            if (!name) return;

            if (!stats[name]) {
                stats[name] = {
                    name,
                    callups: 0,
                    clubs: {},
                    champions: {},
                    seasonsByChamp: {}
                };
            }

            stats[name].callups += 1;
            
            const club = String(item.CLUB || "Unknown").trim();
            stats[name].clubs[club] = (stats[name].clubs[club] || 0) + 1;

            const champ = String(item.CHAMPION || "Unknown").trim();
            stats[name].champions[champ] = (stats[name].champions[champ] || 0) + 1;

            const season = String(item.SEASON || "").trim();
            if (season) {
                if (!stats[name].seasonsByChamp[champ]) {
                    stats[name].seasonsByChamp[champ] = new Set();
                }
                stats[name].seasonsByChamp[champ].add(season);
            }
        });

        // Convert Sets to sorted arrays
        Object.values(stats).forEach(player => {
            for (const champ in player.seasonsByChamp) {
                player.seasonsByChamp[champ] = [...player.seasonsByChamp[champ]].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
            }
        });

        return Object.values(stats).sort((a, b) => b.callups - a.callups || a.name.localeCompare(b.name));
    }, [squadData]);

    // Filtered by search
    const filteredPlayers = useMemo(() => {
        if (!searchTerm) return playerStats;
        const query = searchTerm.toLowerCase().trim();
        return playerStats.filter(p => p.name.toLowerCase().includes(query));
    }, [playerStats, searchTerm]);

    // Paginated
    const paginatedPlayers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPlayers.slice(start, start + pageSize);
    }, [filteredPlayers, currentPage]);

    const totalPages = Math.ceil(filteredPlayers.length / pageSize);

    // Page reset on search
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

            {filteredPlayers.length === 0 ? (
                <NoData_db message="No players found matching your query." />
            ) : (
                <>
                    <div className="squad-table-container">
                        <table className="luxury-squad-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>PLAYER NAME</th>
                                    <th>CALL-UPS COUNT</th>
                                    <th style={{ textAlign: "center" }}>CLUBS DETAILS</th>
                                    <th style={{ textAlign: "center" }}>CHAMPIONS DETAILS</th>
                                    <th style={{ textAlign: "center" }}>SEASONS DETAILS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPlayers.map((player, idx) => (
                                    <tr key={player.name}>
                                        <td className="row-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                        <td className="player-name-cell">{player.name}</td>
                                        <td className="callups-count">{player.callups} Times</td>
                                        <td style={{ textAlign: "center" }}>
                                            <button 
                                                className="action-btn club-btn"
                                                onClick={() => setClubModalPlayer(player)}
                                                title="View Clubs"
                                                style={{ fontSize: '18px', padding: '6px 12px' }}
                                            >
                                                🏢
                                            </button>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button 
                                                className="action-btn champ-btn"
                                                onClick={() => setChampModalPlayer(player)}
                                                title="View Tournaments"
                                                style={{ fontSize: '18px', padding: '6px 12px' }}
                                            >
                                                🏆
                                            </button>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button 
                                                className="action-btn seasons-btn"
                                                onClick={() => setSeasonsModalPlayer(player)}
                                                title="View Seasons"
                                                style={{ fontSize: '18px', padding: '6px 12px' }}
                                            >
                                                🗓️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="squad-pagination">
                            <button 
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
                                className="pag-btn"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Club Pop-up Modal */}
            {clubModalPlayer && (
                <div className="squad-modal-overlay" onClick={() => setClubModalPlayer(null)}>
                    <div className="squad-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🏢 Clubs representation for: <br/><span className="gold">{clubModalPlayer.name}</span></h3>
                            <button className="close-modal-btn" onClick={() => setClubModalPlayer(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <table className="modal-data-table">
                                <thead>
                                    <tr>
                                        <th>Club Name</th>
                                        <th style={{ width: "100px", textAlign: "center" }}>Call-ups</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(clubModalPlayer.clubs)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([club, count]) => (
                                            <tr key={club}>
                                                <td className="item-name">{club}</td>
                                                <td className="item-count">{count}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Champion Pop-up Modal */}
            {champModalPlayer && (
                <div className="squad-modal-overlay" onClick={() => setChampModalPlayer(null)}>
                    <div className="squad-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🏆 Tournaments call-ups for: <br/><span className="gold">{champModalPlayer.name}</span></h3>
                            <button className="close-modal-btn" onClick={() => setChampModalPlayer(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <table className="modal-data-table">
                                <thead>
                                    <tr>
                                        <th>Tournament Name</th>
                                        <th style={{ width: "100px", textAlign: "center" }}>Call-ups</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(champModalPlayer.champions)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([champ, count]) => (
                                            <tr key={champ}>
                                                <td className="item-name">{champ}</td>
                                                <td className="item-count">{count}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Seasons Pop-up Modal */}
            {seasonsModalPlayer && (
                <div className="squad-modal-overlay" onClick={() => setSeasonsModalPlayer(null)}>
                    <div className="squad-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🗓️ Participated Seasons for: <br/><span className="gold">{seasonsModalPlayer.name}</span></h3>
                            <button className="close-modal-btn" onClick={() => setSeasonsModalPlayer(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-seasons-container">
                                {Object.entries(seasonsModalPlayer.seasonsByChamp).map(([champ, seasons]) => (
                                    <div key={champ} className="modal-champ-group">
                                        <h4 className="modal-champ-title">{champ}</h4>
                                        <div className="modal-seasons-list">
                                            {seasons.map(s => (
                                                <span key={s} className="modal-season-badge">{s}</span>
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
