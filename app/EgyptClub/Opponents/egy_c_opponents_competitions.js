"use client";

import { useMemo, useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import NoData_db from "../../lib/NoData_db";
import { exportSummaryToExcel } from "../ExcelExport/egy_c_excel_export";

export default function EgyptClubOpponentsCompetitions({ matches }) {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when matches change
    useEffect(() => {
        setCurrentPage(1);
    }, [matches]);

    const competitionsData = useMemo(() => {
        const comps = {};
        matches.forEach(m => {
            const compName = m.CHAMPION || "Other";
            if (!comps[compName]) {
                comps[compName] = { name: compName, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
            }
            const c = comps[compName];
            c.played++;
            if (m["W-D-L"] === "L") c.wins++;
            else if (m["W-D-L"] === "W") c.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) c.draws++;
            
            c.gf += (Number(m.GA) || 0); // Opponent goals (match GA)
            c.ga += (Number(m.GF) || 0); // Opponent conceded (match GF)
            
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") c.csf++;
            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") c.csa++;
        });
        
        return Object.values(comps).sort((a, b) => b.played - a.played);
    }, [matches]);

    useEffect(() => {
        const handleGlobalExport = () => {
            exportSummaryToExcel(competitionsData, "EgyptClubs_OpponentProfile_Competitions", "name", "COMPETITION");
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [competitionsData]);

    const totals = useMemo(() => {
        const t = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
        competitionsData.forEach(c => {
            t.played += c.played;
            t.wins += c.wins;
            t.draws += c.draws;
            t.losses += c.losses;
            t.gf += c.gf;
            t.ga += c.ga;
            t.csf += c.csf;
            t.csa += c.csa;
        });
        t.winRate = t.played > 0 ? Math.round((t.wins / t.played) * 100) : 0;
        return t;
    }, [competitionsData]);

    if (competitionsData.length === 0) {
        return <NoData_db message="No competition records available." />;
    }

    const pageSize = 50;
    const paginatedCompetitions = competitionsData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(competitionsData.length / pageSize);

    return (
        <div className="profile-competitions fade-in" style={{ background: '#fff', border: '1px solid #eef0f2', padding: '24px', borderRadius: '4px' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '20px', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> Competition H2H Breakdown
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px', textAlign: 'center', tableLayout: 'fixed' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #eee', textAlign: 'center', color: '#888', height: '48px' }}>
                            <th style={{ fontWeight: 'bold', textAlign: 'center', width: '28%', fontSize: '16px' }}>COMPETITION</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', width: '8%', fontSize: '16px' }}>PLAYED</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', color: '#00c853', width: '8%', fontSize: '16px' }}>WON</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--gold, #c9a84c)', width: '8%', fontSize: '16px' }}>WIN %</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--gold, #c9a84c)', width: '8%', fontSize: '16px' }}>DRAW</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', color: '#ff4d4d', width: '8%', fontSize: '16px' }}>LOSE</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', width: '8%', fontSize: '16px' }}>GF</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', width: '8%', fontSize: '16px' }}>GA</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', width: '8%', fontSize: '16px' }}>CSF</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold', width: '8%', fontSize: '16px' }}>CSA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCompetitions.map((c, i) => {
                            const winRate = c.played > 0 ? Math.round((c.wins / c.played) * 100) : 0;
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', textAlign: 'center', height: '56px' }}>
                                    <td style={{ fontWeight: '700', fontSize: '17px', color: '#000', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏆 {c.name}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{c.played}</td>
                                    <td style={{ textAlign: 'center', color: '#00c853', fontWeight: '600', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{c.wins}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--gold, #c9a84c)', fontSize: '16px' }}>{winRate}%</td>
                                    <td style={{ textAlign: 'center', color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{c.draws}</td>
                                    <td style={{ textAlign: 'center', color: '#ff4d4d', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{c.losses}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{c.gf}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{c.ga}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{c.csf || 0}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{c.csa || 0}</td>
                                </tr>
                            );
                        })}
                        {/* Totals Row */}
                        <tr style={{ background: '#f9f9f9', borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', fontWeight: 'bold', height: '56px' }}>
                            <td style={{ fontWeight: 'bold', textAlign: 'center', color: '#000', fontSize: '17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>TOTAL ({competitionsData.length} Competitions)</td>
                            <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{totals.played}</td>
                            <td style={{ textAlign: 'center', color: '#00c853', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{totals.wins}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--gold, #c9a84c)', fontSize: '16px' }}>{totals.winRate}%</td>
                            <td style={{ textAlign: 'center', color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{totals.draws}</td>
                            <td style={{ textAlign: 'center', color: '#ff4d4d', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{totals.losses}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{totals.gf}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{totals.ga}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{totals.csf}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{totals.csa}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '10px 0' }}>
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        style={{
                            background: 'rgba(201, 168, 76, 0.1)', 
                            border: '1px solid rgba(201, 168, 76, 0.2)', 
                            padding: '6px 15px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: '800', 
                            cursor: 'pointer', 
                            color: 'var(--gold, #c9a84c)',
                            fontFamily: 'Space Mono, monospace',
                            opacity: currentPage === 1 ? 0.3 : 1
                        }}
                    >
                        ← PREV
                    </button>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: '800', color: 'var(--gold, #c9a84c)' }}>
                        PAGE {currentPage} OF {totalPages}
                    </div>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        style={{
                            background: 'rgba(201, 168, 76, 0.1)', 
                            border: '1px solid rgba(201, 168, 76, 0.2)', 
                            padding: '6px 15px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: '800', 
                            cursor: 'pointer', 
                            color: 'var(--gold, #c9a84c)',
                            fontFamily: 'Space Mono, monospace',
                            opacity: currentPage === totalPages ? 0.3 : 1
                        }}
                    >
                        NEXT →
                    </button>
                </div>
            )}
        </div>
    );
}
