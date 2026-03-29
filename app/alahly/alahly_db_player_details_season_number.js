"use client";

import { useMemo } from "react";

export default function PlayerSeasonNumberTable({ stats }) {
    const statsBySY = stats.statsBySY || {};

    const extractYear = (str) => {
        const match = String(str).match(/\d{4}/);
        return match ? parseInt(match[0]) : 0;
    };

    const sortedSYs = useMemo(() => {
        return Object.keys(statsBySY).sort((a, b) => {
            const yearA = extractYear(a);
            const yearB = extractYear(b);
            if (yearB !== yearA) return yearB - yearA;
            return b.localeCompare(a);
        });
    }, [statsBySY]);

    const grandTotals = useMemo(() => {
        const t = { MP: 0, mins: 0, G: 0, A: 0, PG: 0, PS: 0, PM: 0 };
        Object.values(statsBySY).forEach(s => {
            t.MP += s.apps;
            t.mins += s.mins;
            t.G += s.goals;
            t.A += s.assists;
            t.PG += s.penGoals;
            t.PS += s.penSaved;
            t.PM += s.penMissed;
        });
        return t;
    }, [statsBySY]);

    return (
        <div className="tab-content">
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '10px' }}>
                <div className="section-title" style={{ fontSize: '24px', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '2px', marginBottom: '10px' }}>
                    PLAYER PERFORMANCE <span className="accent" style={{ color: '#fff' }}>- SEASON NUMBER (SY)</span>
                </div>
                <div className="gold-line" style={{ height: '2px', background: 'var(--player-gold)', width: '60px', marginBottom: '30px' }}></div>

                <div className="table-responsive" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ebebeb', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
                        <thead>
                            <tr style={{ background: '#0a0a0a' }}>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>S. NUMBER (SY)</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>MP</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>MINS</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>GOALS</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>ASSISTS</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>P. GOALS</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>P. SAVED</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>P. MISSED</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSYs.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '100px', opacity: 0.4 }}>No data found for this player.</td></tr>
                            ) : (
                                sortedSYs.map((sy, idx) => {
                                    const s = statsBySY[sy];
                                    return (
                                        <tr key={sy} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '18px', color: '#000', fontFamily: 'Outfit' }}>{sy}</td>
                                            <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>{s.apps || "-"}</td>
                                            <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '18px', opacity: 0.8, color: '#444', fontFamily: 'Space Mono' }}>{s.mins || "-"}</td>
                                            <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#27ae60', fontFamily: 'Bebas Neue' }}>{s.goals || "-"}</td>
                                            <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#2980b9', fontFamily: 'Bebas Neue' }}>{s.assists || "-"}</td>
                                            <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '20px', color: '#444', fontFamily: 'Space Mono' }}>{s.penGoals || "-"}</td>
                                            <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '20px', color: '#e67e22', fontFamily: 'Space Mono' }}>{s.penSaved || "-"}</td>
                                            <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '20px', color: '#e74c3c', fontFamily: 'Space Mono' }}>{s.penMissed || "-"}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#000', color: '#fff', fontWeight: '700' }}>
                                <td style={{ padding: '25px 20px', textAlign: 'center', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '2px', fontSize: '24px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>GRAND TOTAL</td>
                                <td style={{ padding: '25px 20px', textAlign: 'center', color: 'var(--player-gold)', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{grandTotals.MP || "-"}</td>
                                <td style={{ padding: '25px 20px', textAlign: 'center', fontSize: '20px', fontFamily: 'Space Mono' }}>{grandTotals.mins || "-"}</td>
                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#5ef193', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{grandTotals.G || "-"}</td>
                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#5dade2', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{grandTotals.A || "-"}</td>
                                <td style={{ padding: '25px 20px', textAlign: 'center', fontSize: '22px', fontFamily: 'Space Mono' }}>{grandTotals.PG || "-"}</td>
                                <td style={{ padding: '25px 20px', textAlign: 'center', fontSize: '22px', color: '#e67e22', fontFamily: 'Space Mono' }}>{grandTotals.PS || "-"}</td>
                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#ff6b6b', fontSize: '22px', fontFamily: 'Bebas Neue' }}>{grandTotals.PM || "-"}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
