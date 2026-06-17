"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import "./egypt_nt_pks_h2h.css";

export default function EgyptNTPKSH2H({ pksData }) {
    const [searchTerm, setSearchTerm] = useState("");

    const h2hStats = useMemo(() => {
        const stats = {};

        (pksData || []).forEach(kick => {
            const oppTeam = kick["OPPONENT TEAM"] || "Unknown";
            const matchId = kick.PKS_ID || kick.MATCH_ID;

            if (!stats[oppTeam]) {
                stats[oppTeam] = {
                    team: oppTeam,
                    matches: new Set(),
                    won: 0,
                    lost: 0,
                    shotsEgypt: 0,
                    goalsEgypt: 0,
                    missesEgypt: 0,
                    shotsOpp: 0,
                    goalsOpp: 0,
                    missesOpp: 0
                };
            }

            const teamObj = stats[oppTeam];

            if (matchId && !teamObj.matches.has(matchId)) {
                teamObj.matches.add(matchId);
                const result = String(kick["PKS W-L"] || "").toUpperCase();
                if (result.includes('W')) teamObj.won++;
                else if (result.includes('L')) teamObj.lost++;
            }

            if (kick["Egypt PLAYER"]) {
                teamObj.shotsEgypt++;
                const status = String(kick["Egypt STATUS"] || "").toUpperCase();
                if (status.includes("GOAL") || status === "G") teamObj.goalsEgypt++;
                else if (status.includes("MISS") || status === "M" || status.includes("SAVED")) teamObj.missesEgypt++;
            }

            if (kick["OPPONENT PLAYER"]) {
                teamObj.shotsOpp++;
                const status = String(kick["OPPONENT STATUS"] || "").toUpperCase();
                if (status.includes("GOAL") || status === "G") teamObj.goalsOpp++;
                else if (status.includes("MISS") || status === "M" || status.includes("SAVED")) teamObj.missesOpp++;
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
        if (!searchTerm) return h2hStats;
        const low = searchTerm.toLowerCase().trim();
        return h2hStats.filter(s => s.team.toLowerCase().includes(low));
    }, [h2hStats, searchTerm]);

    return (
        <div className="pks-h2h-container fade-in">
            <div className="h2h-header-row">
                <h1 className="h2h-title">EGYPT NT <span className="gold-text">PKs H2H</span></h1>
                
                <div className="h2h-search-box" style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search opponent team..."
                    />
                </div>
            </div>

            {filteredStats.length === 0 ? (
                <NoData_db message="NO H2H RECORDS FOUND" />
            ) : (
                <div className="h2h-table-wrapper">
                    <table className="h2h-main-table">
                        <thead>
                            <tr>
                                <th rowSpan="2" className="sticky-col">OPPONENT TEAM</th>
                                <th colSpan="4" className="group-header shootout-group">SHOOTOUT PERFORMANCE</th>
                                <th colSpan="3" className="group-header egypt-group">EGYPT KICKS</th>
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
                            {filteredStats.map((st, i) => (
                                <tr key={i} className="h2h-row">
                                    <td className="team-name sticky-col">{st.team}</td>
                                    
                                    {/* Shootout Aggregate */}
                                    <td className="stat-num played">{st.played}</td>
                                    <td className="stat-num win">{st.won}</td>
                                    <td className="stat-num loss">{st.lost}</td>
                                    <td className="stat-num rate">{st.winRate}%</td>
                                    
                                    {/* Egypt Shots */}
                                    <td className="stat-num">{st.shotsEgypt}</td>
                                    <td className="stat-num goals">{st.goalsEgypt}</td>
                                    <td className="stat-num misses">{st.missesEgypt}</td>
                                    
                                    {/* Opponent Shots */}
                                    <td className="stat-num">{st.shotsOpp}</td>
                                    <td className="stat-num goals">{st.goalsOpp}</td>
                                    <td className="stat-num misses">{st.missesOpp}</td>
                                </tr>
                            ))}
                            <tr className="total-h2h-row">
                                <td className="team-name sticky-col">TOTAL CAREER</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.played, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.won, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.lost, 0)}</td>
                                <td className="stat-num">—</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.shotsEgypt, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.goalsEgypt, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.missesEgypt, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.shotsOpp, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.goalsOpp, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.missesOpp, 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            
            <div className="h2h-legend">
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
