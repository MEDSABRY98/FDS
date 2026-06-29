"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

export default function Manager_SeasonNumber_Module({ stats }) {
    const [search, setSearch] = useState("");
    const statsBySY = stats.statsBySY || {};
    const allSYs = Object.keys(statsBySY).sort((a, b) => b.localeCompare(a));

    const sortedSYs = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allSYs.filter(sy => !q || sy.toLowerCase().includes(q));
    }, [allSYs, search]);

    const grandTotals = useMemo(() => {
        const t = { MP: 0, W: 0, D: 0, L: 0, GS: 0, GA: 0, CS_FOR: 0, CS_AGN: 0 };
        sortedSYs.forEach(sy => {
            const s = statsBySY[sy];
            t.MP += s.matches;
            t.W += s.wins;
            t.D += s.draws;
            t.L += s.losses;
            t.GS += s.gs;
            t.GA += s.ga;
            t.CS_FOR += s.csFor;
            t.CS_AGN += s.csAgainst;
        });
        return t;
    }, [statsBySY, sortedSYs]);

    return (
        <div className="tab-content" style={{ paddingTop: '20px' }}>
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                {allSYs.length > 0 && (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                        <div style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                            <SearchBar_db
                                value={search}
                                onChange={setSearch}
                                placeholder="SEARCH SEASON NUMBER..."
                            />
                        </div>
                    </div>
                )}

                <div className="table-responsive" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ebebeb', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    {sortedSYs.length === 0 ? (
                        <NoData_db message={allSYs.length === 0 ? "No data found for this manager." : "No season numbers match your search."} />
                    ) : (
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
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>CS FOR</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>CS AGAINST</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSYs.map((sy, idx) => {
                                    const s = statsBySY[sy];
                                    const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={sy} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '15px', fontWeight: '800', color: '#000', fontFamily: 'Outfit' }}>{sy}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: 'var(--player-gold)', fontFamily: 'Outfit', fontWeight: '900', letterSpacing: '0.5px' }}>{s.matches}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '16px', color: '#2ecc71', fontWeight: '900', fontFamily: 'Outfit' }}>{s.wins}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '16px', color: '#e67e22', fontWeight: '900', fontFamily: 'Outfit' }}>{s.draws}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '16px', color: '#e74c3c', fontWeight: '900', fontFamily: 'Outfit' }}>{s.losses}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#000', fontFamily: 'Outfit', fontWeight: '900' }}>{wr}%</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '14px', fontFamily: 'Space Mono', fontWeight: '800' }}>{s.gs} - {s.ga}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#2ecc71', fontFamily: 'Outfit', fontWeight: '900' }}>{s.csFor || "-"}</td>
                                            <td style={{ padding: '18px 20px', textAlign: 'center', fontSize: '18px', color: '#e74c3c', fontFamily: 'Outfit', fontWeight: '900' }}>{s.csAgainst || "-"}</td>
                                        </tr>
                                    );
                            })}
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
                                <td style={{ padding: '20px', textAlign: 'center', color: '#2ecc71', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.CS_FOR || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#e74c3c', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '900' }}>{grandTotals.CS_AGN || "-"}</td>
                            </tr>
                        </tfoot>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
