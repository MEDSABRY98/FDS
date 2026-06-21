"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../../lib/SearchBar_db";
import NoData_db from "../../../lib/NoData_db";

export default function ClubStatsDetailsChampionships({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const champions = clubStats?.championships || [];

    const filteredChampions = useMemo(() => {
        if (!searchTerm.trim()) return champions;
        const query = searchTerm.toLowerCase().trim();
        return champions.filter(champ => champ.name.toLowerCase().includes(query));
    }, [champions, searchTerm]);

    const totals = useMemo(() => {
        return filteredChampions.reduce(
            (acc, champ) => {
                acc.ga += champ.ga;
                acc.goals += champ.goals;
                acc.assists += champ.assists;
                return acc;
            },
            { ga: 0, goals: 0, assists: 0 }
        );
    }, [filteredChampions]);

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search tournament name..."
                />
            </div>

            <div className="squad-table-container">
                <table className="luxury-squad-table">
                    <colgroup>
                        <col style={{ width: "35%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "20%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>TOURNAMENT</th>
                            <th>G+A</th>
                            <th>G</th>
                            <th>A</th>
                            <th>PLAYERS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {champions.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={5}
                                message="No tournament data available for this club."
                                height="200px"
                            />
                        ) : filteredChampions.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={5}
                                message="No tournaments found matching your query."
                                height="200px"
                            />
                        ) : (
                            filteredChampions.map(champ => (
                                <tr key={champ.name}>
                                    <td className="player-name-cell">{champ.name}</td>
                                    <td className="club-stat-cell highlight-gold">{champ.ga}</td>
                                    <td className="club-stat-cell g-val">{champ.goals}</td>
                                    <td className="club-stat-cell a-val">{champ.assists}</td>
                                    <td className="count-cell highlight-blue">{champ.playerCount}</td>
                                </tr>
                            ))
                        )}
                        {filteredChampions.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td className="player-name-cell">TOTAL</td>
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td>—</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
