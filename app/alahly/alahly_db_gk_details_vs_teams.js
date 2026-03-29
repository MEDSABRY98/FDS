"use client";

import { useState } from "react";

export default function GK_VsTeams_Component_Unique({ stats }) {
    const [search, setSearch] = useState("");

    const oppStore = stats.statsByOpponent || {};
    const oppNames = Object.keys(oppStore)
        .filter(name => name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (oppStore[b].matches - oppStore[a].matches) || a.localeCompare(b));

    const totals = oppNames.reduce((acc, name) => {
        const s = oppStore[name];
        acc.apps += s.matches;
        acc.gc += s.gc;
        acc.cs += s.cs;
        acc.pr += s.pr;
        acc.ps += s.ps;
        return acc;
    }, { apps: 0, gc: 0, cs: 0, pr: 0, ps: 0 });

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '15px' }}>GK PERFORMANCE VS OPPONENTS</div>

            {/* Replicated Premium Search Box Centered */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div className="search-wrap-premium" style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <input
                        type="text"
                        placeholder="SEARCH OPPONENT TEAM..."
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
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>OPPONENT TEAM</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>MATCHES</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>CLEAN SHEETS</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>GOALS CONCEDED</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PEN REC.</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PEN SAVED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {oppNames.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No opponent data available.</td>
                            </tr>
                        ) : (
                            oppNames.map(name => {
                                const s = oppStore[name];
                                return (
                                    <tr key={name}>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '800', color: '#000', fontFamily: 'Outfit', fontSize: '15px' }}>{name}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '18px', color: 'var(--player-gold)' }}>{s.matches || "-"}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', color: '#27ae60', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.cs || "-"}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', color: s.gc > 0 ? '#e74c3c' : '#27ae60', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.gc || "-"}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '18px' }}>{s.pr || "-"}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center', color: (s.ps || 0) > 0 ? '#2980b9' : 'inherit', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.ps || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                        {oppNames.length > 0 && (
                            <tr style={{ background: '#0a0a0a', color: '#fff', fontWeight: '700' }}>
                                <td style={{ padding: '20px', textAlign: 'center', fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>TOTAL</td>
                                <td style={{ padding: '20px', textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px', color: 'var(--player-gold)' }}>{totals.apps || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#5ef193', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.cs || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: totals.gc > 0 ? '#ff6b6b' : '#5ef193', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.gc || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.pr || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#5dade2', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.ps || "-"}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
