"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import EgyptNTSquadClubDetails from "./egypt_nt_db_squad_club_details";

export default function EgyptNTSquadClubs({ squadData, matches, lineupDetails, playerDetails, gkDetails, onDetailsViewChange }) {
    const [selectedClub, setSelectedClub] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    useEffect(() => {
        onDetailsViewChange?.(Boolean(selectedClub));
        return () => onDetailsViewChange?.(false);
    }, [selectedClub, onDetailsViewChange]);

    // Process club statistics
    const clubStats = useMemo(() => {
        const stats = {};

        (squadData || []).forEach(item => {
            const club = String(item.CLUB || "").trim();
            if (!club) return;

            if (!stats[club]) {
                stats[club] = {
                    name: club,
                    players: new Set(),
                    champions: new Set()
                };
            }

            if (item.PLAYERNAME) {
                stats[club].players.add(String(item.PLAYERNAME).trim());
            }

            if (item.CHAMPION) {
                stats[club].champions.add(String(item.CHAMPION).trim());
            }
        });

        return Object.values(stats)
            .map(c => ({
                name: c.name,
                playerCount: c.players.size,
                championCount: c.champions.size
            }))
            .sort((a, b) => b.playerCount - a.playerCount || b.championCount - a.championCount || a.name.localeCompare(b.name));
    }, [squadData]);

    // Filtered by search
    const filteredClubs = useMemo(() => {
        if (!searchTerm) return clubStats;
        const query = searchTerm.toLowerCase().trim();
        return clubStats.filter(c => c.name.toLowerCase().includes(query));
    }, [clubStats, searchTerm]);

    // Paginated
    const paginatedClubs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredClubs.slice(start, start + pageSize);
    }, [filteredClubs, currentPage]);

    const totalPages = Math.ceil(filteredClubs.length / pageSize);

    // Page reset on search
    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    if (selectedClub) {
        return (
            <EgyptNTSquadClubDetails
                clubName={selectedClub}
                squadData={squadData}
                matches={matches}
                lineupDetails={lineupDetails}
                playerDetails={playerDetails}
                gkDetails={gkDetails}
                onBack={() => setSelectedClub(null)}
            />
        );
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
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "45%" }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "25%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>CLUB NAME</th>
                            <th style={{ textAlign: "center" }}>NUMBER OF PLAYERS</th>
                            <th style={{ textAlign: "center" }}>NUMBER OF TOURNAMENTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedClubs.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={4}
                                message="No clubs found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedClubs.map((club, idx) => (
                                <tr key={club.name}>
                                    <td className="row-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td className="club-name-cell">
                                        <button
                                            type="button"
                                            className="club-name-link"
                                            onClick={() => setSelectedClub(club.name)}
                                            title={`View ${club.name} details`}
                                        >
                                            {club.name}
                                        </button>
                                    </td>
                                    <td className="count-cell highlight-blue">{club.playerCount} Players</td>
                                    <td className="count-cell highlight-gold">{club.championCount} Tournaments</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && filteredClubs.length > 0 && (
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

        </div>
    );
}
