"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";

export default function ManagerSeasons({ stats }) {
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
                <div className="section-title" style={{ fontSize: '24px', color: 'var(--mgr-gold)', fontFamily: 'Bebas Neue', letterSpacing: '2px', marginBottom: '10px' }}>
                    MANAGER PERFORMANCE <span className="accent" style={{ color: '#fff' }}>- SEASONS</span>
                </div>
                <div className="gold-line" style={{ height: '2px', background: 'var(--mgr-gold)', width: '60px', marginBottom: '30px' }}></div>

                {sortedChamps.length === 0 ? (
                    <NoData_db message="NO DATA AVAILABLE FOR THIS MANAGER" />
                ) : (
                    sortedChamps.map(champ => {
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
                                <div className="champ-title-bar" style={{ background: '#0a0a0a', color: 'var(--mgr-gold)', padding: '16px 24px', fontFamily: 'Bebas Neue', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '5px solid var(--mgr-gold)' }}>
                                    <span style={{ fontSize: '18px' }}>🏆</span> {champ}
                                </div>
                                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
                                        <thead>
                                            <tr style={{ background: '#f8f9fa' }}>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>SEASON</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>MP</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>W</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>D</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>L</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>WIN %</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>GS-GA</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>CS FOR</th>
                                                <th style={{ padding: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', color: '#888', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '1px' }}>CS AGAINST</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedSeasons.map((season, idx) => {
                                                const s = statsByChampSeason[champ][season];
                                                const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                                return (
                                                    <tr key={season} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '18px', color: '#000', fontFamily: 'Outfit' }}>{season}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: 'var(--mgr-gold)', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>{s.matches || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#27ae60', fontFamily: 'Bebas Neue' }}>{s.wins || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#e67e22', fontFamily: 'Bebas Neue' }}>{s.draws || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#e74c3c', fontFamily: 'Bebas Neue' }}>{s.losses || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#000', fontFamily: 'Bebas Neue' }}>{wr}%</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', fontWeight: '800' }}>{s.gs} - {s.ga}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#27ae60', fontFamily: 'Bebas Neue' }}>{s.csFor || "-"}</td>
                                                        <td style={{ padding: '22px 20px', textAlign: 'center', fontSize: '24px', color: '#e74c3c', fontFamily: 'Bebas Neue' }}>{s.csAgainst || "-"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#000', color: '#fff', fontWeight: '700' }}>
                                                <td style={{ padding: '25px 20px', color: 'var(--mgr-gold)', fontFamily: 'Bebas Neue', letterSpacing: '2px', fontSize: '24px' }}>TOTAL</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: 'var(--mgr-gold)', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.MP || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#5ef193', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.W || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#f39c12', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.D || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#ff6b6b', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.L || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: 'var(--mgr-gold)', fontSize: '32px', fontFamily: 'Bebas Neue' }}>
                                                    {totals.MP > 0 ? ((totals.W / totals.MP) * 100).toFixed(1) : 0}%
                                                </td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', fontSize: '15px', fontFamily: 'Space Mono' }}>{totals.GS} - {totals.GA}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#5ef193', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.CS_FOR || "-"}</td>
                                                <td style={{ padding: '25px 20px', textAlign: 'center', color: '#ff6b6b', fontSize: '32px', fontFamily: 'Bebas Neue' }}>{totals.CS_AGN || "-"}</td>
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
