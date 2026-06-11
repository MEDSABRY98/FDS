"use client";

import { useMemo } from "react";
import "./egypt_club_db_dashboard.css";
import NoData_db from "../lib/NoData_db";

export default function EgyptClubDashboard({ matches }) {
    // --- STATISTICS CALCULATIONS ---
    const stats = useMemo(() => {
        const total = matches.length;

        const wins = matches.filter(m => m["W-D-L"] === "W").length;
        const losses = matches.filter(m => m["W-D-L"] === "L").length;
        const draws = matches.filter(m => m["W-D-L"] && m["W-D-L"].startsWith("D")).length;
        
        const posDraws = matches.filter(m => m["W-D-L"] === "D").length;
        const negDraws = matches.filter(m => m["W-D-L"] === "D.").length; // scoreless draws

        const gfTotal = matches.reduce((sum, m) => sum + (Number(m.GF) || 0), 0);
        const gaTotal = matches.reduce((sum, m) => sum + (Number(m.GA) || 0), 0);
        const gfAvg = total > 0 ? (gfTotal / total).toFixed(2) : "0.00";
        const gaAvg = total > 0 ? (gaTotal / total).toFixed(2) : "0.00";

        const csFor = matches.filter(m => m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH").length;
        const csAgainst = matches.filter(m => m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH").length;

        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

        // TOP 5 WINS (Largest goal difference, then goals scored)
        const topWins = [...matches]
            .filter(m => m["W-D-L"] === "W")
            .sort((a, b) => {
                const diffA = (Number(a.GF) || 0) - (Number(a.GA) || 0);
                const diffB = (Number(b.GF) || 0) - (Number(b.GA) || 0);
                if (diffB !== diffA) return diffB - diffA;
                return (Number(b.GF) || 0) - (Number(a.GF) || 0);
            })
            .slice(0, 5);

        // TOP 5 DEFEATS
        const worstLosses = [...matches]
            .filter(m => m["W-D-L"] === "L")
            .sort((a, b) => {
                const diffA = (Number(a.GA) || 0) - (Number(a.GF) || 0);
                const diffB = (Number(b.GA) || 0) - (Number(b.GF) || 0);
                if (diffB !== diffA) return diffB - diffA;
                return (Number(b.GA) || 0) - (Number(a.GA) || 0);
            })
            .slice(0, 5);

        // TOP 5 Egyptian Clubs by Wins
        const clubStats = {};
        matches.forEach(m => {
            const club = m["EGYPT TEAM"];
            if (!club) return;
            if (!clubStats[club]) {
                clubStats[club] = { name: club, played: 0, wins: 0, gf: 0, ga: 0 };
            }
            clubStats[club].played++;
            if (m["W-D-L"] === "W") {
                clubStats[club].wins++;
            }
            clubStats[club].gf += (Number(m.GF) || 0);
            clubStats[club].ga += (Number(m.GA) || 0);
        });

        const topClubs = Object.values(clubStats)
            .sort((a, b) => b.wins - a.wins || b.played - a.played)
            .slice(0, 5);

        return {
            total,
            wins,
            losses,
            draws,
            posDraws,
            negDraws,
            gfTotal,
            gaTotal,
            gfAvg,
            gaAvg,
            csFor,
            csAgainst,
            winRate,
            topWins,
            worstLosses,
            topClubs
        };
    }, [matches]);

    if (stats.total === 0) {
        return (
            <div className="tab-content" id="tab-dashboard">
                <div className="dashboard-wrap">
                    <div className="section-header">
                        <div className="section-title">EGYPT CLUBS <span className="accent">DASHBOARD</span></div>
                    </div>
                    <div className="gold-line" style={{ height: '2px', background: 'var(--gold, #c9a84c)', margin: '15px 0 30px' }}></div>
                    <NoData_db message="No match records match the current filters." />
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content" id="tab-dashboard">
            <div className="dashboard-wrap">
                <div className="section-header">
                    <div className="section-title">EGYPT CLUBS <span className="accent">DASHBOARD</span></div>
                </div>

                <div className="gold-line" style={{ height: '2px', background: 'var(--gold, #c9a84c)', margin: '15px 0 30px' }}></div>

                {/* KPI CARDS */}
                <div className="kpi-grid">
                    <div className="kpi-card" style={{ background: '#000', borderColor: 'var(--gold, #c9a84c)' }}>
                        <span className="kpi-label">TOTAL MATCHES</span>
                        <div className="kpi-value">{stats.total}</div>
                        <div className="kpi-sub">Overall Filtered Games</div>
                        <span className="kpi-icon">⚽</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">TOTAL WINS</span>
                        <div className="kpi-value" style={{ color: 'var(--gold, #c9a84c)' }}>{stats.wins}</div>
                        <div className="kpi-sub">↑ {stats.winRate}% win rate</div>
                        <span className="kpi-icon">🏆</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">DRAWS (ALL)</span>
                        <div className="kpi-value">{stats.draws}</div>
                        <div className="kpi-sub">{stats.posDraws} Scored · {stats.negDraws} Scoreless</div>
                        <span className="kpi-icon">🤝</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">LOSSES</span>
                        <div className="kpi-value" style={{ color: '#ff4d4d' }}>{stats.losses}</div>
                        <div className="kpi-sub">Match Defeats</div>
                        <span className="kpi-icon">🔻</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">GOALS FOR / AVG</span>
                        <div className="kpi-value">{stats.gfTotal} <span style={{ fontSize: '16px', opacity: 0.5 }}>/ {stats.gfAvg}</span></div>
                        <div className="kpi-sub">Goals Scored by Egyptian Clubs</div>
                        <span className="kpi-icon">📢</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">GOALS AGST / AVG</span>
                        <div className="kpi-value">{stats.gaTotal} <span style={{ fontSize: '16px', opacity: 0.5 }}>/ {stats.gaAvg}</span></div>
                        <div className="kpi-sub">Goals Conceded to Opponents</div>
                        <span className="kpi-icon">🥅</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">CLEAN SHEETS (F)</span>
                        <div className="kpi-value">{stats.csFor}</div>
                        <div className="kpi-sub">Defensive Clean Sheets</div>
                        <span className="kpi-icon">🛡️</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">CLEAN SHEETS (A)</span>
                        <div className="kpi-value">{stats.csAgainst}</div>
                        <div className="kpi-sub">Offensive Blankings</div>
                        <span className="kpi-icon">🚫</span>
                    </div>
                </div>

                <div className="dash-grid">
                    {/* TOP 5 EGYPTIAN CLUBS */}
                    <div className="chart-card">
                        <div className="chart-card-title">Top 5 Egyptian Clubs (by Wins)</div>
                        <div className="scorer-list">
                            {stats.topClubs.length > 0 ? stats.topClubs.map((club, idx) => (
                                <div key={club.name} className="scorer-row" style={{ borderLeft: '3px solid var(--gold, #c9a84c)', paddingLeft: '12px' }}>
                                    <div className="scorer-rank">{`0${idx + 1}`}</div>
                                    <div className="scorer-avatar">🛡️</div>
                                    <div className="scorer-info">
                                        <div className="scorer-name" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>{club.name}</div>
                                        <div className="scorer-pos">Played {club.played} · GF {club.gf} · GA {club.ga}</div>
                                    </div>
                                    <div className="scorer-goals" style={{ color: 'var(--gold, #c9a84c)' }}>{club.wins} <span>W</span></div>
                                </div>
                            )) : <NoData_db message="No club statistics available." />}
                        </div>
                    </div>

                    {/* TOP 5 WINS */}
                    <div className="chart-card">
                        <div className="chart-card-title">Top 5 Performances (Largest Wins)</div>
                        <div className="scorer-list">
                            {stats.topWins.length > 0 ? stats.topWins.map((m, idx) => (
                                <div key={m.MATCH_ID} className="scorer-row" style={{ borderLeft: '3px solid #00c853', paddingLeft: '12px' }}>
                                    <div className="scorer-rank">{`0${idx + 1}`}</div>
                                    <div className="scorer-avatar">🏆</div>
                                    <div className="scorer-info">
                                        <div className="scorer-name" style={{ direction: 'rtl', textAlign: 'left' }}>
                                            {m["EGYPT TEAM"]} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.5 }}>vs</span> {m["OPPONENT TEAM"]}
                                        </div>
                                        <div className="scorer-pos">{m.CHAMPION} · {m.SEASON} · {m.DATE}</div>
                                    </div>
                                    <div className="scorer-goals" style={{ color: '#00c853' }}>{m.GF} - {m.GA}</div>
                                </div>
                            )) : <NoData_db message="No wins recorded yet." />}
                        </div>
                    </div>

                    {/* WORST 5 LOSSES */}
                    <div className="chart-card" style={{ gridColumn: 'span 1' }}>
                        <div className="chart-card-title">Worst 5 Defeats (Largest Losses)</div>
                        <div className="scorer-list">
                            {stats.worstLosses.length > 0 ? stats.worstLosses.map((m, idx) => (
                                <div key={m.MATCH_ID} className="scorer-row" style={{ borderLeft: '3px solid #ff4d4d', paddingLeft: '12px' }}>
                                    <div className="scorer-rank">{`0${idx + 1}`}</div>
                                    <div className="scorer-avatar">🔻</div>
                                    <div className="scorer-info">
                                        <div className="scorer-name" style={{ direction: 'rtl', textAlign: 'left' }}>
                                            {m["EGYPT TEAM"]} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.5 }}>vs</span> {m["OPPONENT TEAM"]}
                                        </div>
                                        <div className="scorer-pos">{m.CHAMPION} · {m.SEASON} · {m.DATE}</div>
                                    </div>
                                    <div className="scorer-goals" style={{ color: '#ff4d4d' }}>{m.GF} - {m.GA}</div>
                                </div>
                            )) : <NoData_db message="No losses recorded yet." />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
