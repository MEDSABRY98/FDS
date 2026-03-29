"use client";

import { useMemo } from "react";

export default function Referee_SeasonNumber_Module({ stats }) {
    const statsBySY = stats.statsBySY || {};
    const sortedSYs = Object.keys(statsBySY).sort((a, b) => b.localeCompare(a));

    const grandTotals = useMemo(() => {
        const t = { MP: 0, W: 0, D: 0, L: 0, GS: 0, GA: 0, PF: 0, PA: 0, CS_FOR: 0, CS_AGN: 0 };
        Object.values(statsBySY).forEach(s => {
            t.MP += s.matches;
            t.W += s.wins;
            t.D += s.draws;
            t.L += s.losses;
            t.GS += s.gs;
            t.GA += s.ga;
            t.PF += s.penFor;
            t.PA += s.penAgainst;
            t.CS_FOR += s.csFor;
            t.CS_AGN += s.csAgainst;
        });
        return t;
    }, [statsBySY]);

    return (
        <div className="tab-content" style={{ paddingTop: '20px' }}>
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                <div className="section-title" style={{ fontSize: '24px', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '2px', marginBottom: '10px' }}>
                    REFEREE PERFORMANCE <span className="accent" style={{ color: '#fff' }}>- SEASON NUMBER (SY)</span>
                </div>
                <div className="gold-line" style={{ height: '2px', background: 'var(--player-gold)', width: '60px', marginBottom: '30px' }}></div>

                <div className="table-responsive" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ebebeb', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
                        <thead>
                            <tr style={{ background: '#0a0a0a' }}>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>S. NUMBER (SY)</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>MP</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>W</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>D</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>L</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>WIN %</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>GS-GA</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PEN F-A</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>CS F-A</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSYs.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '100px', opacity: 0.4 }}>No data found for this referee.</td></tr>
                            ) : (
                                sortedSYs.map((sy, idx) => {
                                    const s = statsBySY[sy];
                                    const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={sy} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '15px', fontWeight: '800', color: '#000', fontFamily: 'Outfit' }}>{sy}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: 'var(--player-gold)', fontFamily: 'Outfit', fontWeight: '900', letterSpacing: '0.5px' }}>{s.matches}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '16px', color: '#27ae60', fontWeight: '900', fontFamily: 'Outfit' }}>{s.wins}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '16px', color: '#e67e22', fontWeight: '900', fontFamily: 'Outfit' }}>{s.draws}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '16px', color: '#e74c3c', fontWeight: '900', fontFamily: 'Outfit' }}>{s.losses}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#000', fontFamily: 'Outfit', fontWeight: '900' }}>{wr}%</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', fontWeight: '800' }}>{s.gs} - {s.ga}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#000', fontFamily: 'Outfit', fontWeight: '900' }}>{s.penFor} / <span style={{ color: '#888' }}>{s.penAgainst}</span></td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#2ecc71', fontFamily: 'Outfit', fontWeight: '900' }}>{s.csFor} / <span style={{ color: '#e74c3c' }}>{s.csAgainst}</span></td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#0a0a0a', color: '#fff', fontWeight: '700' }}>
                                <td style={{ padding: '20px', textAlign: 'center', color: 'var(--player-gold)', fontFamily: 'Outfit', letterSpacing: '2px', fontSize: '14px', fontWeight: '900', borderRight: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>GRAND TOTAL</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: 'var(--player-gold)', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.MP || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#2ecc71', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.W || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#e67e22', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.D || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#e74c3c', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.L || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: 'var(--player-gold)', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>
                                    {grandTotals.MP > 0 ? ((grandTotals.W / grandTotals.MP) * 100).toFixed(1) : 0}%
                                </td>
                                <td style={{ padding: '20px', textAlign: 'center', fontSize: '15px', fontFamily: 'Space Mono' }}>{grandTotals.GS} - {grandTotals.GA}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#fff', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.PF} / <span style={{ color: '#888' }}>{grandTotals.PA}</span></td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#2ecc71', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.CS_FOR} / <span style={{ color: '#e74c3c' }}>{grandTotals.CS_AGN}</span></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
