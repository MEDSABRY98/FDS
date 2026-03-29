"use client";

import { useMemo } from "react";

export default function GK_Championships_Module({ stats }) {
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
            acc.gc += s.gc;
            acc.cs += s.cs;
            acc.ps += s.ps;
            acc.pr += s.pr;
            return acc;
        }, { matches: 0, wins: 0, draws: 0, losses: 0, gc: 0, cs: 0, ps: 0, pr: 0 });
    }, [compStore, comps]);

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '25px' }}>GOALKEEPER PERFORMANCE BY CHAMPIONSHIP</div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>CHAMPIONSHIP NAME</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>MP</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>GA</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>CS</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>CS %</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>PS / PR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comps.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>No championship data available.</td>
                            </tr>
                        ) : (
                            comps.map(name => {
                                const s = compStore[name];
                                const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                const csr = s.matches > 0 ? ((s.cs / s.matches) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={name}>
                                        <td style={{ fontWeight: '800', color: 'var(--player-dark)', fontSize: '15px', fontFamily: 'Outfit' }}>{name}</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '18px', color: 'var(--player-gold)' }}>{s.matches || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.gc}</td>
                                        <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.cs}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--player-dark)', fontWeight: '800', fontSize: '16px', fontFamily: 'Outfit' }}>{csr}%</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', fontWeight: '700' }}>
                                            <span style={{ color: '#2ecc71' }}>{s.ps}</span> / <span style={{ color: '#999' }}>{s.pr}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        {comps.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>TOTAL</td>
                                <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px' }}>{totals.matches || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.gc}</td>
                                <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.cs}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>
                                    {totals.matches > 0 ? ((totals.cs / totals.matches) * 100).toFixed(1) : 0}%
                                </td>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '16px', fontWeight: '800' }}>
                                    <span style={{ color: '#2ecc71' }}>{totals.ps}</span> / <span style={{ color: '#999' }}>{totals.pr}</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
