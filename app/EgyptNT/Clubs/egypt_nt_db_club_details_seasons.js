"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import { compareSeasonStatsRows } from "./egypt_nt_db_clubs_utils";

export default function ClubDetailsSeasons({ squadClubStats, scoringClubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    // Merge seasons from both squad and scoring stats
    const mergedSeasons = useMemo(() => {
        const seasonMap = {};

        // 1. Process squad seasons
        const squadSeasonsList = squadClubStats?.seasons || [];
        squadSeasonsList.forEach(s => {
            seasonMap[s.name] = {
                name: s.name,
                callups: s.callups,
                squadPlayers: s.playerCount,
                champCount: s.championCount,
                goals: 0,
                assists: 0,
                penGoals: 0,
                ga: 0
            };
        });

        // 2. Process scoring seasons
        const scoringSeasonsList = scoringClubStats?.seasons || [];
        scoringSeasonsList.forEach(s => {
            if (!seasonMap[s.name]) {
                seasonMap[s.name] = {
                    name: s.name,
                    callups: 0,
                    squadPlayers: 0,
                    champCount: 0,
                    goals: s.goals,
                    assists: s.assists,
                    penGoals: s.penGoals,
                    ga: s.ga
                };
            } else {
                seasonMap[s.name].goals = s.goals;
                seasonMap[s.name].assists = s.assists;
                seasonMap[s.name].penGoals = s.penGoals;
                seasonMap[s.name].ga = s.ga;
            }
        });

        return Object.values(seasonMap).sort(compareSeasonStatsRows);
    }, [squadClubStats, scoringClubStats]);

    const filteredSeasons = useMemo(() => {
        if (!searchTerm.trim()) return mergedSeasons;
        const query = searchTerm.toLowerCase().trim();
        return mergedSeasons.filter(s => s.name.toLowerCase().includes(query));
    }, [mergedSeasons, searchTerm]);

    const paginatedSeasons = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSeasons.slice(start, start + pageSize);
    }, [filteredSeasons, currentPage]);

    const totalPages = Math.ceil(filteredSeasons.length / pageSize);

    const totals = useMemo(() => {
        return filteredSeasons.reduce(
            (acc, season) => {
                acc.callups += season.callups;
                acc.ga += season.ga;
                acc.goals += season.goals;
                acc.assists += season.assists;
                acc.penGoals += season.penGoals;
                return acc;
            },
            { callups: 0, ga: 0, goals: 0, assists: 0, penGoals: 0 }
        );
    }, [filteredSeasons]);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    if (mergedSeasons.length === 0) {
        return <NoData_db message="NO SEASON DATA AVAILABLE FOR THIS CLUB" height="240px" />;
    }

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search season..."
                />
            </div>

            <div className="squad-table-container">
                <table className="luxury-squad-table">
                    <colgroup>
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>SEASON</th>
                            <th style={{ textAlign: "center" }}>CALL-UPS</th>
                            <th style={{ textAlign: "center" }}>SQUAD PLAYERS</th>
                            <th>G+A</th>
                            <th>G</th>
                            <th>A</th>
                            <th>PEN G</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSeasons.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={8}
                                message="No seasons found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedSeasons.map((season, idx) => (
                                <tr key={season.name}>
                                    <td className="row-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td className="player-name-cell">{season.name}</td>
                                    <td className="count-cell highlight-blue" style={{ textAlign: "center" }}>
                                        {season.callups > 0 ? `${season.callups} Times` : "—"}
                                    </td>
                                    <td className="count-cell highlight-gold" style={{ textAlign: "center" }}>
                                        {season.squadPlayers > 0 ? `${season.squadPlayers} Players` : "—"}
                                    </td>
                                    <td className="club-stat-cell highlight-gold">{season.ga > 0 ? season.ga : "—"}</td>
                                    <td className="club-stat-cell g-val">{season.goals > 0 ? season.goals : "—"}</td>
                                    <td className="club-stat-cell a-val">{season.assists > 0 ? season.assists : "—"}</td>
                                    <td className="club-stat-cell">{season.penGoals > 0 ? season.penGoals : "—"}</td>
                                </tr>
                            ))
                        )}
                        {paginatedSeasons.length > 0 && filteredSeasons.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td className="player-name-cell">TOTAL</td>
                                <td style={{ textAlign: "center", fontWeight: "bold" }}>{totals.callups}</td>
                                <td />
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td className="club-stat-cell">{totals.penGoals}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && filteredSeasons.length > 0 && (
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
