"use client";

import { useMemo } from "react";

export default function GK_SeasonName_Component_Unique({ stats }) {
    const statsByChampSeason = stats.statsByChampSeason || {};

    const extractYear = (str) => {
        const match = String(str).match(/\d{4}/);
        return match ? parseInt(match[0]) : 0;
    };

    const sortedChamps = useMemo(() => {
        return Object.keys(statsByChampSeason).sort();
    }, [statsByChampSeason]);

    return (
        <div className="tab-content">
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '10px' }}>
                <div className="section-title" style={{ fontSize: '24px', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '2px', marginBottom: '10px' }}>
                    GK PERFORMANCE <span className="accent" style={{ color: '#fff' }}>- SEASON NAME</span>
                </div>
                <div className="gold-line" style={{ height: '2px', background: 'var(--player-gold)', width: '60px', marginBottom: '30px' }}></div>

                {sortedChamps.length === 0 ? (
                    <div className="no-data-premium" style={{
                        textAlign: 'center',
                        padding: '120px 20px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '24px',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        marginTop: '40px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px', filter: 'grayscale(1)', opacity: 0.5 }}>📊</div>
                        <div style={{
                            fontFamily: 'Bebas Neue',
                            fontSize: '28px',
                            color: 'var(--player-gold)',
                            letterSpacing: '3px',
                            textShadow: '0 0 10px rgba(201,168,76,0.2)'
                        }}>
                            NO DATA AVAILABLE FOR THIS GK
                        </div>
                        <div style={{ color: '#666', fontFamily: 'Space Mono', fontSize: '11px', marginTop: '10px' }}>Try adjusting your filters to see more results</div>
                    </div>
                ) : (
                    sortedChamps.map(champ => {
                        const sortedSeasons = Object.keys(statsByChampSeason[champ]).sort((a, b) => {
                            const yearA = extractYear(a);
                            const yearB = extractYear(b);
                            if (yearB !== yearA) return yearB - yearA;
                            return b.localeCompare(a);
                        });

                        const totals = { MP: 0, CS: 0, GC: 0, PR: 0, PS: 0 };
                        sortedSeasons.forEach(sKey => {
                            const s = statsByChampSeason[champ][sKey];
                            totals.MP += s.matches;
                            totals.CS += s.cs;
                            totals.GC += s.gc;
                            totals.PR += s.pr;
                            totals.PS += s.ps;
                        });

                        return (
                            <div key={champ} className="champion-section" style={{ marginBottom: '40px', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ebebeb', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <div className="champ-title-bar" style={{ background: '#0a0a0a', color: 'var(--player-gold)', padding: '16px 24px', fontFamily: 'Bebas Neue', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '5px solid var(--player-gold)' }}>
                                    <span style={{ fontSize: '18px' }}>🏆</span> {champ}
                                </div>
                                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
                                        <thead>
                                            <tr style={{ background: '#f8f9fa' }}>
                                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>SEASON</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>MP</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>CLEAN SHEETS</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>G. CONCEDED</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PEN REC.</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>PEN SAVED</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedSeasons.map((season, idx) => {
                                                const s = statsByChampSeason[champ][season];
                                                return (
                                                    <tr key={season} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '15px', fontWeight: '800', color: '#000', fontFamily: 'Outfit' }}>{season}</td>
                                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: 'var(--player-gold)', fontFamily: 'Outfit', fontWeight: '900' }}>{s.matches || "-"}</td>
                                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#27ae60', fontWeight: '900', fontFamily: 'Outfit' }}>{s.cs || "-"}</td>
                                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: s.gc > 0 ? '#e74c3c' : '#27ae60', fontWeight: '900', fontFamily: 'Outfit' }}>{s.gc || "-"}</td>
                                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#444', fontWeight: '900', fontFamily: 'Outfit' }}>{s.pr || "-"}</td>
                                                        <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#2980b9', fontWeight: '900', fontFamily: 'Outfit' }}>{s.ps || "-"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#0a0a0a', color: '#fff', fontWeight: '700' }}>
                                                <td style={{ padding: '20px', color: 'var(--player-gold)', fontFamily: 'Outfit', letterSpacing: '2px', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>TOTAL</td>
                                                <td style={{ padding: '20px', textAlign: 'center', color: 'var(--player-gold)', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.MP || "-"}</td>
                                                <td style={{ padding: '20px', textAlign: 'center', color: '#5ef193', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.CS || "-"}</td>
                                                <td style={{ padding: '20px', textAlign: 'center', color: totals.GC > 0 ? '#ff6b6b' : '#5ef193', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.GC || "-"}</td>
                                                <td style={{ padding: '20px', textAlign: 'center', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.PR || "-"}</td>
                                                <td style={{ padding: '20px', textAlign: 'center', color: '#5dade2', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.PS || "-"}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
