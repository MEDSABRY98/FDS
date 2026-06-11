"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { exportMatchesToExcel } from "./egypt_club_excel_export";

export default function EgyptClubProfileMatches({ clubProfile, formatDate }) {
    useEffect(() => {
        const handleGlobalExport = () => {
            exportMatchesToExcel(clubProfile?.matches || [], `${clubProfile?.name || "Club"}_Matches`);
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [clubProfile]);
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when clubProfile changes
    useEffect(() => {
        setCurrentPage(1);
    }, [clubProfile]);

    const matches = clubProfile?.matches || [];
    const pageSize = 50;
    const paginatedMatches = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(matches.length / pageSize);

    return (
        <div className="profile-matches fade-in">
            {/* Match Logs */}
            <div style={{ background: '#fff', border: '1px solid #eef0f2', padding: '24px', borderRadius: '4px' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '20px', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> Full Match Log ({matches.length} Matches)
                </div>
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee', textAlign: 'center', color: '#888' }}>
                                <th style={{ padding: '10px 0', fontWeight: 'normal', textAlign: 'center', width: '10%' }}>DATE</th>
                                <th style={{ padding: '10px 0', fontWeight: 'normal', textAlign: 'center', width: '28%' }}>SEASON</th>
                                <th style={{ padding: '10px 0', fontWeight: 'normal', textAlign: 'center', width: '8%' }}>ROUND</th>
                                <th style={{ padding: '10px 0', fontWeight: 'normal', textAlign: 'center', width: '18%' }}>OPPONENT</th>
                                <th style={{ padding: '10px 0', textAlign: 'center', fontWeight: 'normal', width: '10%' }}>SCORE</th>
                                <th style={{ padding: '10px 0', textAlign: 'center', fontWeight: 'normal', width: '8%' }}>H-A-N</th>
                                <th style={{ padding: '10px 0', textAlign: 'center', fontWeight: 'normal', width: '8%' }}>RESULT</th>
                                <th style={{ padding: '10px 0', fontWeight: 'normal', textAlign: 'center', width: '10%' }}>NOTE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedMatches.map((m, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', textAlign: 'center' }}>
                                    <td style={{ padding: '10px 0', color: '#666', fontFamily: 'Space Mono, monospace', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(m.DATE)}</td>
                                    <td style={{ padding: '10px 0', fontWeight: '600', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.SEASON}</td>
                                    <td style={{ padding: '10px 0', color: '#666', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.ROUND}</td>
                                    <td style={{ padding: '10px 0', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m["OPPONENT TEAM"]}</td>
                                    <td style={{ padding: '10px 0', textAlign: 'center', fontFamily: 'Space Mono, monospace', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {m.GF} - {m.GA} {m.PEN ? `(${m.PEN})` : ""}
                                    </td>
                                    <td style={{ padding: '10px 0', textAlign: 'center', fontFamily: 'Space Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m["H-A-N"]}</td>
                                    <td style={{ 
                                        padding: '10px 0', 
                                        textAlign: 'center', 
                                        fontWeight: 'bold',
                                        color: m["W-D-L"] === 'W' ? '#00c853' : (m["W-D-L"] === 'L' ? '#ff4d4d' : 'var(--gold, #c9a84c)'),
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        {m["W-D-L"]}
                                    </td>
                                    <td style={{ padding: '10px 0', color: '#888', fontSize: '11px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m["W-L Q & F"] ? m["W-L Q & F"] : (m.NOTE ? m.NOTE : "")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

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
            </div>
        </div>
    );
}
