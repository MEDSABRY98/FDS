"use client";

import { useMemo } from "react";

export default function Manager_SeasonName_Module({ stats }) {
    const statsByChampSeason = stats.statsByChampSeason || {};

    const extractYear = (str) => {
        const match = String(str).match(/\d{4}/);
        return match ? parseInt(match[0]) : 0;
    };

    const sortedChamps = useMemo(() => {
        return Object.keys(statsByChampSeason).sort();
    }, [statsByChampSeason]);

    return (
        <div className="tab-content" style={{ paddingTop: '10px' }}>
            <div className="seasons-wrap" style={{ maxWidth: '1450px', width: '98%', margin: '0 auto' }}>
                <div className="section-title" style={{ fontSize: '24px', color: 'var(--player-gold)', fontFamily: 'Bebas Neue', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>
                    MANAGER PERFORMANCE <span className="accent" style={{ color: '#fff' }}>- SEASON NAME</span>
                </div>
                <div className="gold-line" style={{ height: '2px', background: 'var(--player-gold)', width: '60px', marginBottom: '30px' }}></div>

                {sortedChamps.map(champ => {
                    const sortedSeasons = Object.keys(statsByChampSeason[champ]).sort((a, b) => {
                        const yearA = extractYear(a);
                        const yearB = extractYear(b);
                        if (yearB !== yearA) return yearB - yearA;
                        return b.localeCompare(a);
                    });

                    const totals = { MP: 0, W: 0, D: 0, L: 0, GS: 0, GA: 0, CS_FOR: 0, CS_AGN: 0 };
                    sortedSeasons.forEach(sKey => {
                        const s = statsByChampSeason[champ][sKey];
                        totals.MP += s.matches;
                        totals.W += s.wins;
                        totals.D += s.draws;
                        totals.L += s.losses;
                        totals.GS += s.gs;
                        totals.GA += s.ga;
                        totals.CS_FOR += s.csFor;
                        totals.CS_AGN += s.csAgainst;
                    });

                    return (
                        <div key={champ} className="champion-section" style={{ marginBottom: '40px', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ebebeb', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <div className="champ-title-bar" style={{ background: '#0a0a0a', color: 'var(--player-gold)', padding: '16px 24px', fontFamily: 'Bebas Neue', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '5px solid var(--player-gold)' }}>
                                <span>🏆</span> {champ}
                            </div>
                            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
                                    <thead>
                                        <tr style={{ background: '#f8f9fa' }}>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>SEASON</th>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>MP</th>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>W</th>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>D</th>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>L</th>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>WIN %</th>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>GS-GA</th>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>CS FOR</th>
                                            <th style={{ padding: '16px 15px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', letterSpacing: '2px', fontWeight: '700' }}>CS AGAINST</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedSeasons.map((season, idx) => {
                                            const s = statsByChampSeason[champ][season];
                                            const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={season} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '15px', fontWeight: '800', color: '#000', fontFamily: 'Outfit' }}>{season}</td>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '18px', color: 'var(--player-gold)', fontFamily: 'Outfit', fontWeight: '900' }}>{s.matches}</td>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '16px', color: '#2ecc71', fontWeight: '900', fontFamily: 'Outfit' }}>{s.wins}</td>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '16px', color: '#e67e22', fontWeight: '900', fontFamily: 'Outfit' }}>{s.draws}</td>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '16px', color: '#e74c3c', fontWeight: '900', fontFamily: 'Outfit' }}>{s.losses}</td>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '18px', color: '#000', fontFamily: 'Outfit', fontWeight: '900' }}>{wr}%</td>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', fontWeight: '800' }}>{s.gs} - {s.ga}</td>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '18px', color: '#2ecc71', fontFamily: 'Outfit', fontWeight: '900' }}>{s.csFor || "-"}</td>
                                                    <td style={{ padding: '18px 15px', textAlign: 'center', fontSize: '18px', color: '#e74c3c', fontFamily: 'Outfit', fontWeight: '900' }}>{s.csAgainst || "-"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: '#0a0a0a', color: '#fff', fontWeight: '700' }}>
                                            <td style={{ padding: '20px', color: 'var(--player-gold)', fontFamily: 'Outfit', letterSpacing: '2px', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>TOTAL</td>
                                            <td style={{ padding: '20px', textAlign: 'center', color: 'var(--player-gold)', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.MP}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', color: '#2ecc71', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.W}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', color: '#e67e22', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.D}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', color: '#e74c3c', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.L}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', color: 'var(--player-gold)', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>
                                                {totals.MP > 0 ? ((totals.W / totals.MP) * 100).toFixed(1) : 0}%
                                            </td>
                                            <td style={{ padding: '20px', textAlign: 'center', fontSize: '15px', fontFamily: 'Space Mono' }}>{totals.GS} - {totals.GA}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', color: '#2ecc71', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.CS_FOR}</td>
                                            <td style={{ padding: '20px', textAlign: 'center', color: '#e74c3c', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{totals.CS_AGN}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
