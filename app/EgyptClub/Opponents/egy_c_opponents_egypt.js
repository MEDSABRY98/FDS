"use client";

import { useState, useEffect, useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import NoData_db from "../../lib/NoData_db";
import { exportSummaryToExcel } from "../ExcelExport/egy_c_excel_export";

export default function EgyptClubOpponentsEgyClubs({ egyptClubs }) {
    useEffect(() => {
        const handleGlobalExport = () => {
            exportSummaryToExcel(egyptClubs || [], "EgyptClubs_OpponentProfile_EgyptClubs", "name", "EGYPTIAN CLUB");
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [egyptClubs]);
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when egyptClubs changes
    useEffect(() => {
        setCurrentPage(1);
    }, [egyptClubs]);

    const totals = useMemo(() => {
        const t = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
        if (egyptClubs) {
            egyptClubs.forEach(club => {
                t.played += club.played || 0;
                t.wins += club.wins || 0;
                t.draws += club.draws || 0;
                t.losses += club.losses || 0;
                t.gf += club.gf || 0;
                t.ga += club.ga || 0;
                t.csf += club.csf || 0;
                t.csa += club.csa || 0;
            });
        }
        t.winRate = t.played > 0 ? Math.round((t.wins / t.played) * 100) : 0;
        return t;
    }, [egyptClubs]);

    if (!egyptClubs || egyptClubs.length === 0) {
        return <NoData_db message="No Egyptian club records available." />;
    }

    const pageSize = 50;
    const paginatedClubs = egyptClubs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(egyptClubs.length / pageSize);

    return (
        <div className="profile-egypt-clubs fade-in" style={{ background: '#fff', border: '1px solid #eef0f2', padding: '24px', borderRadius: '4px' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '20px', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> H2H Records by Egyptian Club
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px', textAlign: 'center', tableLayout: 'fixed' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #eee', textAlign: 'center', color: '#888', height: '48px' }}>
                            <th style={{ fontWeight: 'bold', textAlign: 'center', width: '28%', fontSize: '16px' }}>EGYPTIAN CLUB</th>
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
                        {paginatedClubs.map((club, i) => {
                            const winRate = club.played > 0 ? Math.round((club.wins / club.played) * 100) : 0;
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', textAlign: 'center', height: '56px' }}>
                                    <td style={{ fontWeight: '700', fontSize: '17px', color: '#000', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🛡️ {club.name}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{club.played}</td>
                                    <td style={{ textAlign: 'center', color: '#00c853', fontWeight: '600', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{club.wins}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--gold, #c9a84c)', fontSize: '16px' }}>{winRate}%</td>
                                    <td style={{ textAlign: 'center', color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{club.draws}</td>
                                    <td style={{ textAlign: 'center', color: '#ff4d4d', fontWeight: '600', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{club.losses}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{club.gf}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{club.ga}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{club.csf || 0}</td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: '16px' }}>{club.csa || 0}</td>
                                </tr>
                            );
                        })}
                        {/* Totals Row */}
                        <tr style={{ background: '#f9f9f9', borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', fontWeight: 'bold', height: '56px' }}>
                            <td style={{ fontWeight: 'bold', textAlign: 'center', color: '#000', fontSize: '17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>TOTAL ({egyptClubs.length} Egyptian Clubs)</td>
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
