"use client";

import { useMemo } from "react";

export default function Referee_Championships_Module({ stats }) {
    const compStore = stats.compStats || {};

    const comps = useMemo(() => {
        return Object.keys(compStore).sort((a, b) => (compStore[b].matches - compStore[a].matches) || a.localeCompare(b));
    }, [compStore]);

    const totals = useMemo(() => {
        return comps.reduce((acc, name) => {
            const s = compStore[name];
            acc.matches += s.matches;
            acc.wins += s.wins;
            acc.draws += s.draws;
            acc.losses += s.losses;
            acc.gs += s.gs;
            acc.ga += s.ga;
            acc.csFor += s.csFor;
            acc.csAgainst += s.csAgainst;
            acc.penFor += (s.penFor || 0);
            acc.penAgainst += (s.penAgainst || 0);
            return acc;
        }, { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 });
    }, [compStore, comps]);

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '25px' }}>REFEREE PERFORMANCE BY CHAMPIONSHIP</div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>CHAMPIONSHIP NAME</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>MP</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>W</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>D</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>L</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>WIN %</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>PEN+/-</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>GS-GA</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>CS FOR</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>CS AGAINST</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comps.length === 0 ? (
                            <tr>
                                <td colSpan="10" style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>No championship data available.</td>
                            </tr>
                        ) : (
                            comps.map(name => {
                                const s = compStore[name];
                                const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={name}>
                                        <td style={{ fontWeight: '800', color: 'var(--player-dark)', fontSize: '15px', fontFamily: 'Outfit' }}>{name}</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '18px', color: 'var(--player-gold)' }}>{s.matches || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.wins || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e67e22', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.draws || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.losses || "-"}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--player-dark)', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{wr}%</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '14px', fontWeight: '700' }}>
                                            <span style={{ color: '#2ecc71' }}>{s.penFor || 0}</span> / <span style={{ color: '#e74c3c' }}>{s.penAgainst || 0}</span>
                                        </td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '800', fontSize: '14px' }}>{s.gs} - {s.ga}</td>
                                        <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.csFor || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.csAgainst || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                        {comps.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>TOTAL</td>
                                <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px' }}>{totals.matches || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.wins || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#e67e22', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.draws || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.losses || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>
                                    {totals.matches > 0 ? ((totals.wins / totals.matches) * 100).toFixed(1) : 0}%
                                </td>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', fontWeight: '800' }}>
                                    <span style={{ color: '#2ecc71' }}>{totals.penFor}</span> / <span style={{ color: '#ff6b6b' }}>{totals.penAgainst}</span>
                                </td>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '900', fontSize: '15px' }}>{totals.gs} - {totals.ga}</td>
                                <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.csFor || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.csAgainst || "-"}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
