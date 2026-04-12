"use client";

import { useMemo } from "react";
import NoData_db from "../lib/NoData_db";

export default function AlAhlyPKsPlayerDetailsVsTeams({ pksData, playerName }) {
    // Aggregate PKs by Opponent (Showing stats AGAINST teams)
    const teamStats = useMemo(() => {
        const stats = {};
        (pksData || []).forEach(pk => {
            const isAhlyPlayer = pk["AHLY PLAYER"] === playerName;
            // The team they are facing in this PK:
            const oppTeam = isAhlyPlayer ? (pk["OPPONENT TEAM"] || "Unknown") : (pk["AHLY TEAM"] || "النادي الأهلي");
            const status = isAhlyPlayer ? pk["AHLY STATUS"] : pk["OPPONENT STATUS"];
            const isGoal = String(status || "").toUpperCase().includes("GOAL");

            if (!stats[oppTeam]) stats[oppTeam] = { total: 0, goals: 0, misses: 0 };
            stats[oppTeam].total++;
            if (isGoal) stats[oppTeam].goals++; else stats[oppTeam].misses++;
        });
        return Object.keys(stats)
            .map(t => ({ team: t, ...stats[t] }))
            .sort((a, b) => b.total - a.total);
    }, [pksData, playerName]);

    return (
        <div className="history-section fade-in" style={{ padding: '0', border: 'none', boxShadow: 'none' }}>
            <div className="history-title">PERFORMANCE AGAINST TEAMS</div>
            
            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table vs-teams-table">
                    <thead>
                        <tr style={{ height: '70px' }}>
                            <th style={{ fontSize: '15px' }}>OPPONENT TEAM</th>
                            <th style={{ fontSize: '15px' }}>TOTAL PKs</th>
                            <th style={{ fontSize: '15px' }}>GOALS</th>
                            <th style={{ fontSize: '15px' }}>MISSES</th>
                            <th style={{ fontSize: '15px' }}>SUCCESS %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamStats.length === 0 ? (
                            <NoData_db isTable={true} colSpan={5} message="No opponent data available." />
                        ) : (
                            teamStats.map((st, idx) => (
                                <tr key={idx} style={{ height: '80px' }}>
                                    <td style={{ fontWeight: '800', color: 'var(--player-dark)', fontSize: '18px' }}>{st.team}</td>
                                    <td style={{ fontFamily: 'Space Mono', fontWeight: '900', fontSize: '20px' }}>{st.total}</td>
                                    <td style={{ color: '#27ae60', fontWeight: '950', fontSize: '24px' }}>{st.goals}</td>
                                    <td style={{ color: '#e74c3c', fontWeight: '950', fontSize: '24px' }}>{st.misses}</td>
                                    <td style={{ color: 'var(--player-gold)', fontWeight: '950', fontSize: '18px' }}>
                                        {Math.round((st.goals / st.total) * 100)}%
                                    </td>
                                </tr>
                            ))
                        )}
                        {teamStats.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)', height: '90px' }}>
                                <td style={{ fontWeight: '950', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>TOTAL AGAINST CAREER</td>
                                <td style={{ fontFamily: 'Space Mono', fontWeight: '950', fontSize: '22px' }}>{teamStats.reduce((a, b) => a + b.total, 0)}</td>
                                <td style={{ color: '#27ae60', fontWeight: '950', fontSize: '26px' }}>{teamStats.reduce((a, b) => a + b.goals, 0)}</td>
                                <td style={{ color: '#e74c3c', fontWeight: '950', fontSize: '26px' }}>{teamStats.reduce((a, b) => a + b.misses, 0)}</td>
                                <td style={{ color: 'var(--player-gold)', fontWeight: '950' }}>—</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
