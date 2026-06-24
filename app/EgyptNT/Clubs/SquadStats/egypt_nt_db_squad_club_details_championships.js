"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../../lib/SearchBar_db";
import NoData_db from "../../../lib/NoData_db";

export default function ClubDetailsChampionships({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const champions = clubStats?.champions || [];

    const filteredChampions = useMemo(() => {
        if (!searchTerm.trim()) return champions;
        const query = searchTerm.toLowerCase().trim();
        return champions.filter(champ => champ.name.toLowerCase().includes(query));
    }, [champions, searchTerm]);

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
                        <col style={{ width: "40%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "20%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>TOURNAMENT</th>
                            <th>CALL-UPS</th>
                            <th>PLAYERS</th>
                            <th>SEASONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {champions.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={4}
                                message="No tournament data available for this club."
                                height="200px"
                            />
                        ) : filteredChampions.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={4}
                                message="No tournaments found matching your query."
                                height="200px"
                            />
                        ) : (
                            filteredChampions.map(champ => (
                                <tr key={champ.name}>
                                    <td className="player-name-cell">{champ.name}</td>
                                    <td className="callups-count">{champ.callups}</td>
                                    <td className="count-cell highlight-blue">{champ.playerCount}</td>
                                    <td className="count-cell highlight-gold">{champ.seasonCount}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
