"use client";

import { useMemo, useState } from "react";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";
import "./alahly_pks_managers.css";

export default function AlAhlyPKsManagers({ pksData }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [scope, setScope] = useState("ALL"); // ALL, AHLY, OPPONENTS

    const managerStats = useMemo(() => {
        const stats = {};

        (pksData || []).forEach(kick => {
            const matchId = kick.PKS_ID || kick.MATCH_ID;
            
            const addMatchStat = (managerName, isAhly) => {
                if (!managerName || managerName === "---") return;
                
                if (!stats[managerName]) {
                    stats[managerName] = {
                        name: managerName,
                        matches: new Set(),
                        won: 0,
                        lost: 0,
                        shotsFor: 0,
                        goalsFor: 0,
                        missesFor: 0,
                        shotsAgainst: 0,
                        goalsAgainst: 0,
                        missesAgainst: 0
                    };
                }

                const mgrObj = stats[managerName];

                // Match-level stats
                if (matchId && !mgrObj.matches.has(matchId)) {
                    mgrObj.matches.add(matchId);
                    const result = String(kick["PKS W-L"] || kick["PKS RESULT"] || kick.PKS_RESULT || "").toUpperCase();
                    
                    if (isAhly) {
                        if (result.includes('W')) mgrObj.won++;
                        else if (result.includes('L')) mgrObj.lost++;
                    } else {
                        if (result.includes('L')) mgrObj.won++;
                        else if (result.includes('W')) mgrObj.lost++;
                    }
                }

                // Shot-level stats
                if (isAhly) {
                    if (kick["AHLY PLAYER"]) {
                        mgrObj.shotsFor++;
                        const s = String(kick["AHLY STATUS"] || "").toUpperCase();
                        if (s.includes("GOAL")) mgrObj.goalsFor++;
                        else if (s.includes("MISS") || s.includes("SAVED")) mgrObj.missesFor++;
                    }
                    if (kick["OPPONENT PLAYER"]) {
                        mgrObj.shotsAgainst++;
                        const s = String(kick["OPPONENT STATUS"] || "").toUpperCase();
                        if (s.includes("GOAL")) mgrObj.goalsAgainst++;
                        else if (s.includes("MISS") || s.includes("SAVED")) mgrObj.missesAgainst++;
                    }
                } else {
                    if (kick["OPPONENT PLAYER"]) {
                        mgrObj.shotsFor++;
                        const s = String(kick["OPPONENT STATUS"] || "").toUpperCase();
                        if (s.includes("GOAL")) mgrObj.goalsFor++;
                        else if (s.includes("MISS") || s.includes("SAVED")) mgrObj.missesFor++;
                    }
                    if (kick["AHLY PLAYER"]) {
                        mgrObj.shotsAgainst++;
                        const s = String(kick["AHLY STATUS"] || "").toUpperCase();
                        if (s.includes("GOAL")) mgrObj.goalsAgainst++;
                        else if (s.includes("MISS") || s.includes("SAVED")) mgrObj.missesAgainst++;
                    }
                }
            };

            if (scope === "ALL" || scope === "AHLY") {
                addMatchStat(kick["AHLY MANAGER"], true);
            }
            if (scope === "ALL" || scope === "OPPONENTS") {
                addMatchStat(kick["OPPONENT MANAGER"], false);
            }
        });

        return Object.values(stats)
            .map(s => ({
                ...s,
                played: s.matches.size,
                winRate: s.matches.size > 0 ? ((s.won / s.matches.size) * 100).toFixed(1) : "0"
            }))
            .sort((a, b) => b.played - a.played || b.won - a.won);
    }, [pksData, scope]);

    const filteredStats = useMemo(() => {
        if (!searchTerm) return managerStats;
        const low = searchTerm.toLowerCase().trim();
        return managerStats.filter(s => s.name.toLowerCase().includes(low));
    }, [managerStats, searchTerm]);

    const scopeOptions = [
        { value: "ALL", label: "ALL MANAGERS" },
        { value: "AHLY", label: "AHLY MANAGERS" },
        { value: "OPPONENTS", label: "OPPONENT MANAGERS" }
    ];

    return (
        <div className="pks-h2h-container fade-in">
            <div className="h2h-header-row">
                <h1 className="h2h-title">AL AHLY <span className="gold-text">PKs MANAGERS</span></h1>
                
                <div className="h2h-controls" style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1, maxWidth: '800px', justifyContent: 'flex-end' }}>
                    <div style={{ flex: 1, maxWidth: '400px' }}>
                        <SearchBar_db
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search manager name..."
                        />
                    </div>

                    <div style={{ width: '220px' }}>
                        <DropDownList_db
                            options={scopeOptions}
                            value={scope}
                            onChange={setScope}
                            placeholder="Select Scope"
                        />
                    </div>
                </div>
            </div>

            <div className="h2h-table-wrapper">
                <table className="h2h-main-table">
                    <thead>
                        <tr>
                            <th rowSpan="2" className="sticky-col">MANAGER NAME</th>
                            <th colSpan="4" className="group-header shootout-group">SHOOTOUT PERFORMANCE</th>
                            <th colSpan="3" className="group-header ahly-group">KICKS FOR</th>
                            <th colSpan="3" className="group-header opp-group">KICKS AGAINST</th>
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
                            <NoData_db isTable={true} colSpan={11} message="NO MANAGER RECORDS FOUND" />
                        ) : (
                            filteredStats.map((st, i) => (
                                <tr key={i} className="h2h-row">
                                    <td className="team-name sticky-col">
                                        {st.name}
                                    </td>
                                    
                                    <td className="stat-num played">{st.played}</td>
                                    <td className="stat-num win">{st.won}</td>
                                    <td className="stat-num loss">{st.lost}</td>
                                    <td className="stat-num rate">{st.winRate}%</td>
                                    
                                    <td className="stat-num">{st.shotsFor}</td>
                                    <td className="stat-num goals">{st.goalsFor}</td>
                                    <td className="stat-num misses">{st.missesFor}</td>
                                    
                                    <td className="stat-num">{st.shotsAgainst}</td>
                                    <td className="stat-num goals">{st.goalsAgainst}</td>
                                    <td className="stat-num misses">{st.missesAgainst}</td>
                                </tr>
                            ))
                        )}
                        {filteredStats.length > 0 && (
                            <tr className="total-h2h-row">
                                <td className="team-name sticky-col">TOTAL</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.played, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.won, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.lost, 0)}</td>
                                <td className="stat-num">—</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.shotsFor, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.goalsFor, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.missesFor, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.shotsAgainst, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.goalsAgainst, 0)}</td>
                                <td className="stat-num">{filteredStats.reduce((a, b) => a + b.missesAgainst, 0)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="h2h-legend">
                <span><strong>P:</strong> Shootouts Managed</span>
                <span><strong>W:</strong> Wins</span>
                <span><strong>L:</strong> Losses</span>
                <span><strong>S:</strong> Total Kicks</span>
                <span><strong>G:</strong> Goals</span>
                <span><strong>M:</strong> Misses</span>
            </div>
        </div>
    );
}
