"use client";

import { useMemo, useState } from "react";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import "./alahly_pks_champions.css";

export default function AlAhlyPKsChampions({ pksData }) {
    const [searchTerm, setSearchTerm] = useState("");

    const champsStats = useMemo(() => {
        const stats = {};

        (pksData || []).forEach(kick => {
            const champion = kick["CHAMPION"] || "Unknown Tournament";
            const matchId = kick.PKS_ID || kick.MATCH_ID;
            
            if (!stats[champion]) {
                stats[champion] = {
                    name: champion,
                    matches: new Set(),
                    won: 0,
                    lost: 0,
                    shotsAhly: 0,
                    goalsAhly: 0,
                    missesAhly: 0,
                    shotsOpp: 0,
                    goalsOpp: 0,
                    missesOpp: 0
                };
            }

            const champObj = stats[champion];

            // Match-level stats (Unique Shootouts)
            if (matchId && !champObj.matches.has(matchId)) {
                champObj.matches.add(matchId);
                const result = String(kick["PKS W-L"] || kick["PKS RESULT"] || kick.PKS_RESULT || "").toUpperCase();
                if (result.includes('W')) champObj.won++;
                else if (result.includes('L')) champObj.lost++;
            }

            // Shot-level stats (Ahly)
            if (kick["AHLY PLAYER"]) {
                champObj.shotsAhly++;
                const status = String(kick["AHLY STATUS"] || "").toUpperCase();
                if (status.includes("GOAL")) champObj.goalsAhly++;
                else if (status.includes("MISS") || status.includes("SAVED")) champObj.missesAhly++;
            }

            // Shot-level stats (Opponent)
            if (kick["OPPONENT PLAYER"]) {
                champObj.shotsOpp++;
                const status = String(kick["OPPONENT STATUS"] || "").toUpperCase();
                if (status.includes("GOAL")) champObj.goalsOpp++;
                else if (status.includes("MISS") || status.includes("SAVED")) champObj.missesOpp++;
            }
        });

        return Object.values(stats)
            .map(s => ({
                ...s,
                played: s.matches.size,
                winRate: s.matches.size > 0 ? ((s.won / s.matches.size) * 100).toFixed(1) : "0"
            }))
            .sort((a, b) => b.played - a.played || b.won - a.won);
    }, [pksData]);

    const filteredStats = useMemo(() => {
        if (!searchTerm) return champsStats;
        const low = searchTerm.toLowerCase().trim();
        return champsStats.filter(s => s.name.toLowerCase().includes(low));
    }, [champsStats, searchTerm]);

    return (
        <div className="pks-champions-container fade-in">
            <div className="champs-header-row">
                <h1 className="champs-title">AL AHLY <span className="gold-text">PKS CHAMPIONS</span></h1>
                
                <div className="champs-search-box" style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search tournament name..."
                    />
                </div>
            </div>

            <div className="champs-table-wrapper">
                <table className="champs-main-table">
                    <thead>
                        <tr>
                            <th rowSpan="2" className="sticky-col">TOURNAMENT</th>
                            <th colSpan="4" className="group-header shootout-group">SHOOTOUT PERFORMANCE</th>
                            <th colSpan="3" className="group-header ahly-group">AL AHLY KICKS</th>
                            <th colSpan="3" className="group-header opp-group">OPPONENT KICKS</th>
                        </tr>
                        <tr>
                            <th className="sub-th">P</th>
                            <th className="sub-th">W</th>
                            <th className="sub-th">L</th>
                            <th className="sub-th">WIN %</th>
                            
                            <th className="sub-th">S</th>
                            <th className="sub-th">G</th>
                            <th className="sub-th">M</th>
                            
                            <th className="sub-th">S</th>
                            <th className="sub-th">G</th>
                            <th className="sub-th">M</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStats.length === 0 ? (
                            <NoData_db isTable={true} colSpan={11} message="NO CHAMPION RECORDS FOUND" />
                        ) : (
                            filteredStats.map((st, i) => (
                                <tr key={i} className="champs-row">
                                    <td className="champ-name sticky-col">{st.name}</td>
                                    
                                    {/* Shootout Aggregate */}
                                    <td className="stat-num played">{st.played}</td>
                                    <td className="stat-num win">{st.won}</td>
                                    <td className="stat-num loss">{st.lost}</td>
                                    <td className="stat-num rate">{st.winRate}%</td>
                                    
                                    {/* Ahly Shots */}
                                    <td className="stat-num">{st.shotsAhly}</td>
                                    <td className="stat-num goals">{st.goalsAhly}</td>
                                    <td className="stat-num misses">{st.missesAhly}</td>
                                    
                                    {/* Opponent Shots */}
                                    <td className="stat-num">{st.shotsOpp}</td>
                                    <td className="stat-num goals">{st.goalsOpp}</td>
                                    <td className="stat-num misses">{st.missesOpp}</td>
                                </tr>
                            ))
                        )}
                        {filteredStats.length > 0 && (
                            <tr className="total-champs-row">
                                <td className="champ-name sticky-col">TOTAL CAREER</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.played, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.won, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.lost, 0)}</td>
                                <td className="stat-num">—</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.shotsAhly, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.goalsAhly, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.missesAhly, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.shotsOpp, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.goalsOpp, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.missesOpp, 0)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="champs-legend">
                <span><strong>P:</strong> Matches Played</span>
                <span><strong>W:</strong> Wins</span>
                <span><strong>L:</strong> Losses</span>
                <span><strong>S:</strong> Shots</span>
                <span><strong>G:</strong> Goals</span>
                <span><strong>M:</strong> Misses/Saved</span>
            </div>
        </div>
    );
}
