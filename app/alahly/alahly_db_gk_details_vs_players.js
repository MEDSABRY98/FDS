"use client";

import { useState } from "react";

export default function GK_VsPlayers_Component_Unique({ stats }) {
    const [search, setSearch] = useState("");

    const scorerStore = stats.statsByScorer || {};
    const scorerNames = Object.keys(scorerStore)
        .filter(name => name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (scorerStore[b].goals - scorerStore[a].goals) || a.localeCompare(b));

    const totals = scorerNames.reduce((acc, name) => {
        const s = scorerStore[name];
        acc.goals += s.goals || 0;
        acc.pens_scored += s.pens_scored || 0;
        acc.pens_saved += s.pens_saved || 0;
        return acc;
    }, { goals: 0, pens_scored: 0, pens_saved: 0 });

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '15px' }}>GK PERFORMANCE VS PLAYERS</div>

            {/* Exact Replicated Search Box from VS TEAMS */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div className="search-wrap-premium" style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <input
                        type="text"
                        placeholder="SEARCH SCORER NAME..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="p-search-input"
                        style={{ textAlign: 'center' }}
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table vs-teams-table">
                    <thead>
                        <tr>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PLAYER NAME</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>TOTAL GOALS</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PENALTY SCORED</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PENALTY SAVED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scorerNames.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No data available.</td>
                            </tr>
                        ) : (
                            scorerNames.map(name => {
                                const s = scorerStore[name];
                                return (
                                    <tr key={name}>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '800', color: '#000', fontFamily: 'Outfit', fontSize: '15px' }}>{name}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', color: '#e74c3c', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.goals || "-"}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '18px' }}>{s.pens_scored || "-"}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', color: (s.pens_saved > 0 ? '#2980b9' : 'inherit'), fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.pens_saved || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                        {scorerNames.length > 0 && (
                            <tr style={{ background: '#0a0a0a', color: '#fff', fontWeight: '700' }}>
                                <td style={{ padding: '20px', textAlign: 'center', fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>TOTAL</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.goals || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px' }}>{totals.pens_scored || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#5dade2', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.pens_saved || "-"}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
