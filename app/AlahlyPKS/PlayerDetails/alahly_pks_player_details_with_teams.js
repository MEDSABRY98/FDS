"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";

export default function AlAhlyPKsPlayerDetailsWithTeams({ pksData, playerName }) {
    // Aggregate PKs by My Team (Corrected: Showing stats for the team the player played FOR)
    const teamStats = useMemo(() => {
        const stats = {};
        (pksData || []).forEach(pk => {
            const isAhlyPlayer = pk["AHLY PLAYER"] === playerName;
            // The team the player was playing FOR in this PK:
            const myTeam = isAhlyPlayer ? (pk["AHLY TEAM"] || "النادي الأهلي") : (pk["OPPONENT TEAM"] || "Opponent Team");
            const status = isAhlyPlayer ? pk["AHLY STATUS"] : pk["OPPONENT STATUS"];
            const isGoal = String(status || "").toUpperCase().includes("GOAL");

            if (!stats[myTeam]) stats[myTeam] = { total: 0, goals: 0, misses: 0 };
            stats[myTeam].total++;
            if (isGoal) stats[myTeam].goals++; else stats[myTeam].misses++;
        });
        return Object.keys(stats)
            .map(t => ({ team: t, ...stats[t] }))
            .sort((a, b) => b.total - a.total);
    }, [pksData, playerName]);

    return (
        <div className="history-section fade-in" style={{ padding: '0', border: 'none', boxShadow: 'none' }}>
            <div className="history-title">PERFORMANCE WITH TEAMS</div>
            
            <div style={{ overflowX: 'auto' }}>
                {teamStats.length === 0 ? (
                    <NoData_db message="No team data available." />
                ) : (
                    <table className="player-match-table vs-teams-table">
                        <thead>
                            <tr>
                                <th style={{ fontSize: '15px' }}>PLAYER TEAM</th>
                                <th style={{ fontSize: '15px' }}>TOTAL PKs</th>
                                <th style={{ fontSize: '15px' }}>GOALS</th>
                                <th style={{ fontSize: '15px' }}>MISSES</th>
                                <th style={{ fontSize: '15px' }}>SUCCESS %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamStats.map((st, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: '800', color: 'var(--player-dark)', fontSize: '18px' }}>{st.team}</td>
                                    <td style={{ fontFamily: 'Space Mono', fontWeight: '900', fontSize: '20px' }}>{st.total}</td>
                                    <td style={{ color: '#27ae60', fontWeight: '950', fontSize: '24px' }}>{st.goals}</td>
                                    <td style={{ color: '#e74c3c', fontWeight: '950', fontSize: '24px' }}>{st.misses}</td>
                                    <td style={{ color: 'var(--player-gold)', fontWeight: '950' }}>
                                        {Math.round((st.goals / st.total) * 100)}%
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ fontWeight: '950', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>TOTAL CAREER</td>
                                <td style={{ fontFamily: 'Space Mono', fontWeight: '950', fontSize: '22px' }}>{teamStats.reduce((a, b) => a + b.total, 0)}</td>
                                <td style={{ color: '#27ae60', fontWeight: '950', fontSize: '26px' }}>{teamStats.reduce((a, b) => a + b.goals, 0)}</td>
                                <td style={{ color: '#e74c3c', fontWeight: '950', fontSize: '26px' }}>{teamStats.reduce((a, b) => a + b.misses, 0)}</td>
                                <td style={{ color: 'var(--player-gold)', fontWeight: '950' }}>—</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
