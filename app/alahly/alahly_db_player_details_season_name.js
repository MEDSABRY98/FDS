"use client";

import { useMemo } from "react";

export default function PlayerSeasonNameTable({ stats }) {
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
                    PLAYER PERFORMANCE <span className="accent" style={{ color: '#fff' }}>- SEASON NAME</span>
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
                            NO DATA AVAILABLE FOR THIS PLAYER
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

                        const totals = { MP: 0, mins: 0, G: 0, A: 0, PG: 0, PS: 0, PM: 0 };
                        sortedSeasons.forEach(sKey => {
                            const s = statsByChampSeason[champ][sKey];
                            totals.MP += s.apps;
                            totals.mins += s.mins;
                            totals.G += s.goals;
                            totals.A += s.assists;
                            totals.PG += s.penGoals;
                            totals.PS += s.penSaved;
                            totals.PM += s.penMissed;
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
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>SEASON</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>MP</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>MINS</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>GOALS</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>ASSISTS</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>P. GOALS</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>P. SAVED</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>P. MISSED</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedSeasons.map((season, idx) => {
                                                const s = statsByChampSeason[champ][season];
                                                return (
                                                    <tr key={season} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '18px', color: '#000', fontFamily: 'Outfit' }}>{season}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>{s.apps || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '18px', opacity: 0.8, color: '#444', fontFamily: 'Space Mono' }}>{s.mins || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#27ae60', fontFamily: 'Bebas Neue' }}>{s.goals || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#2980b9', fontFamily: 'Bebas Neue' }}>{s.assists || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '20px', color: '#444', fontFamily: 'Space Mono' }}>{s.penGoals || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '20px', color: '#e67e22', fontFamily: 'Space Mono' }}>{s.penSaved || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '20px', color: '#e74c3c', fontFamily: 'Space Mono' }}>{s.penMissed || "-"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#000', color: '#fff', fontWeight: '700' }}>
                                                <td style={{ padding: '25px 20px', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '2px', fontSize: '24px' }}>TOTAL</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: 'var(--player-gold)', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.MP || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', fontSize: '20px', fontFamily: 'Space Mono' }}>{totals.mins || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#5ef193', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.G || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#5dade2', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.A || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', fontSize: '22px', fontFamily: 'Space Mono' }}>{totals.PG || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', fontSize: '22px', color: '#e67e22', fontFamily: 'Space Mono' }}>{totals.PS || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#ff6b6b', fontSize: '22px', fontFamily: 'Space Mono' }}>{totals.PM || "-"}</td>
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
