"use client";

import { useMemo } from "react";

export default function GK_SeasonNumber_Component_Unique({ stats }) {
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
        const t = { MP: 0, GC: 0, CS: 0, PR: 0, PS: 0 };
        Object.values(statsBySY).forEach(s => {
            t.MP += s.matches;
            t.GC += s.gc;
            t.CS += s.cs;
            t.PR += s.pr;
            t.PS += s.ps;
        });
        return t;
    }, [statsBySY]);

    return (
        <div className="tab-content">
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '10px' }}>
                <div className="section-title" style={{ fontSize: '24px', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '3px', marginBottom: '10px' }}>
                    GK PERFORMANCE <span className="accent" style={{ color: '#fff' }}>- SEASON NUMBER (SY)</span>
                </div>
                <div className="gold-line" style={{ height: '3px', background: 'var(--player-gold)', width: '80px', marginBottom: '30px' }}></div>

                <div className="table-responsive" style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ebebeb', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                    <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
                        <thead>
                            <tr style={{ background: '#0a0a0a' }}>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '12px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>S. NUMBER (SY)</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '12px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>MP</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '12px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>CS</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '12px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>GC</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '12px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PR</th>
                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '12px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSYs.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px', opacity: 0.4 }}>No data found for this GK.</td></tr>
                            ) : (
                                sortedSYs.map((sy, idx) => {
                                    const s = statsBySY[sy];
                                    return (
                                        <tr key={sy} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '20px', textAlign: 'center', fontSize: '15px', fontWeight: '800', color: '#000', fontFamily: 'Outfit' }}>{sy}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', fontSize: '18px', color: 'var(--player-gold)', fontFamily: 'Outfit', fontWeight: '900' }}>{s.matches || "-"}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', fontSize: '18px', color: '#27ae60', fontWeight: '900', fontFamily: 'Outfit' }}>{s.cs || "-"}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', fontSize: '18px', color: s.gc > 0 ? '#e74c3c' : '#27ae60', fontWeight: '900', fontFamily: 'Outfit' }}>{s.gc || "-"}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', fontSize: '18px', color: '#444', fontWeight: '900', fontFamily: 'Outfit' }}>{s.pr || "-"}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', fontSize: '18px', color: '#2980b9', fontWeight: '900', fontFamily: 'Outfit' }}>{s.ps || "-"}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#0a0a0a', color: '#fff', fontWeight: '700' }}>
                                <td style={{ padding: '20px', textAlign: 'center', color: 'var(--player-gold)', fontFamily: 'Outfit', letterSpacing: '2px', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>GRAND TOTAL</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: 'var(--player-gold)', fontSize: '22px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.MP || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#5ef193', fontSize: '22px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.CS || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: grandTotals.GC > 0 ? '#ff6b6b' : '#5ef193', fontSize: '22px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.GC || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', fontSize: '22px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.PR || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#5dade2', fontSize: '22px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.PS || "-"}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
