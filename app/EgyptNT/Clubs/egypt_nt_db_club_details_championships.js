"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";

export default function ClubDetailsChampionships({ squadClubStats, scoringClubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "ga", direction: "desc" });
    const pageSize = 50;

    // Merge championships from both squad and scoring stats
    const mergedChampionships = useMemo(() => {
        const champMap = {};

        // 1. Process squad championships
        const squadChamps = squadClubStats?.champions || [];
        squadChamps.forEach(c => {
            champMap[c.name] = {
                name: c.name,
                callups: c.callups,
                squadPlayers: c.playerCount,
                seasonCount: c.seasonCount,
                goals: 0,
                assists: 0,
                ga: 0
            };
        });

        // 2. Process scoring championships
        const scoringChamps = scoringClubStats?.championships || [];
        scoringChamps.forEach(c => {
            if (!champMap[c.name]) {
                champMap[c.name] = {
                    name: c.name,
                    callups: 0,
                    squadPlayers: 0,
                    seasonCount: 0,
                    goals: c.goals,
                    assists: c.assists,
                    ga: c.ga
                };
            } else {
                champMap[c.name].goals = c.goals;
                champMap[c.name].assists = c.assists;
                champMap[c.name].ga = c.ga;
            }
        });

        return Object.values(champMap);
    }, [squadClubStats, scoringClubStats]);

    const filteredChampionships = useMemo(() => {
        if (!searchTerm.trim()) return mergedChampionships;
        const query = searchTerm.toLowerCase().trim();
        return mergedChampionships.filter(c => c.name.toLowerCase().includes(query));
    }, [mergedChampionships, searchTerm]);

    const sortedChamps = useMemo(() => {
        const list = [...filteredChampionships];
        if (!sortConfig.key) return list;

        list.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === "name") {
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
    }, [filteredChampionships, sortConfig]);

    const paginatedChamps = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedChamps.slice(start, start + pageSize);
    }, [sortedChamps, currentPage]);

    const totalPages = Math.ceil(filteredChampionships.length / pageSize);

    const totals = useMemo(() => {
        return filteredChampionships.reduce(
            (acc, champ) => {
                acc.callups += champ.callups;
                acc.ga += champ.ga;
                acc.goals += champ.goals;
                acc.assists += champ.assists;
                return acc;
            },
            { callups: 0, ga: 0, goals: 0, assists: 0 }
        );
    }, [filteredChampionships]);

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

    if (mergedChampionships.length === 0) {
        return <NoData_db message="NO CHAMPIONSHIP DATA AVAILABLE FOR THIS CLUB" height="240px" />;
    }

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search tournament name..."
                />
            </div>

            <div className="squad-table-container">
                <table className="luxury-squad-table">
                    <colgroup>
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "35%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th className="sortable-header" onClick={() => handleSort("name")}>
                                TOURNAMENT NAME {renderSortIcon("name")}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort("callups")} style={{ textAlign: "center" }}>
                                CALL-UPS {renderSortIcon("callups")}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort("squadPlayers")} style={{ textAlign: "center" }}>
                                SQUAD PLAYERS {renderSortIcon("squadPlayers")}
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
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedChamps.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={7}
                                message="No tournaments found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedChamps.map((champ, idx) => (
                                <tr key={champ.name}>
                                    <td className="row-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td className="player-name-cell">{champ.name}</td>
                                    <td className="count-cell highlight-blue" style={{ textAlign: "center" }}>
                                        {champ.callups > 0 ? `${champ.callups} Times` : "—"}
                                    </td>
                                    <td className="count-cell highlight-gold" style={{ textAlign: "center" }}>
                                        {champ.squadPlayers > 0 ? `${champ.squadPlayers} Players` : "—"}
                                    </td>
                                    <td className="club-stat-cell highlight-gold">{champ.ga > 0 ? champ.ga : "—"}</td>
                                    <td className="club-stat-cell g-val">{champ.goals > 0 ? champ.goals : "—"}</td>
                                    <td className="club-stat-cell a-val">{champ.assists > 0 ? champ.assists : "—"}</td>
                                </tr>
                            ))
                        )}
                        {paginatedChamps.length > 0 && filteredChampionships.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td className="player-name-cell">TOTAL</td>
                                <td style={{ textAlign: "center", fontWeight: "bold" }}>{totals.callups}</td>
                                <td />
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && filteredChampionships.length > 0 && (
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
