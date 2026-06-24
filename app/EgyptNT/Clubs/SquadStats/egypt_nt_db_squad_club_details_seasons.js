"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../../lib/SearchBar_db";
import NoData_db from "../../../lib/NoData_db";

export default function ClubDetailsSeasons({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const seasons = clubStats?.seasons || [];

    const filteredSeasons = useMemo(() => {
        if (!searchTerm.trim()) return seasons;
        const query = searchTerm.toLowerCase().trim();
        return seasons.filter(season => season.name.toLowerCase().includes(query));
    }, [seasons, searchTerm]);

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search season name..."
                />
            </div>

            <div className="squad-table-container">
                <table className="luxury-squad-table">
                    <colgroup>
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "23%" }} />
                        <col style={{ width: "23%" }} />
                        <col style={{ width: "24%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>SEASON</th>
                            <th>CALL-UPS</th>
                            <th>PLAYERS</th>
                            <th>TOURNAMENTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {seasons.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={4}
                                message="No season data available for this club."
                                height="200px"
                            />
                        ) : filteredSeasons.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={4}
                                message="No seasons found matching your query."
                                height="200px"
                            />
                        ) : (
                            filteredSeasons.map(season => (
                                <tr key={season.name}>
                                    <td className="player-name-cell">{season.name}</td>
                                    <td className="callups-count">{season.callups}</td>
                                    <td className="count-cell highlight-blue">{season.playerCount}</td>
                                    <td className="count-cell highlight-gold">{season.championCount}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
