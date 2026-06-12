"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../lib/NoData_db";
import { ChevronRight, ArrowLeft, Calendar, Zap } from "lucide-react";
import { exportMatchesToExcel, exportSummaryToExcel } from "./egy_c_excel_export";
import "./egy_c_years.css";

export default function EgyptClubYears({ matches }) {
    const [selectedYear, setSelectedYear] = useState(null);

    const [currentPageOverview, setCurrentPageOverview] = useState(1);
    const [currentPageDetail, setCurrentPageDetail] = useState(1);

    // Reset details pagination when selectedYear changes
    useEffect(() => {
        setCurrentPageDetail(1);
    }, [selectedYear]);

    // Reset overview pagination when matches changes
    useEffect(() => {
        setCurrentPageOverview(1);
    }, [matches]);

    // Group by Year and aggregate stats
    const yearsData = useMemo(() => {
        const stats = {};
        matches.forEach(m => {
            const name = m.YEAR || (m.DATE ? new Date(m.DATE).getFullYear().toString() : null);
            if (!name) return;

            if (!stats[name]) {
                stats[name] = {
                    name,
                    played: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    gf: 0,
                    ga: 0,
                    csf: 0,
                    csa: 0
                };
            }

            const y = stats[name];
            y.played++;
            if (m["W-D-L"] === "W") y.wins++;
            else if (m["W-D-L"] === "L") y.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) y.draws++;

            y.gf += (Number(m.GF) || 0);
            y.ga += (Number(m.GA) || 0);

            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") y.csf++;
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") y.csa++;
        });

        // Sort years descending
        return Object.values(stats).sort((a, b) => b.name.localeCompare(a.name));
    }, [matches]);

    const yearProfile = useMemo(() => {
        if (!selectedYear) return null;
        return matches.filter(m => {
            const yr = m.YEAR || (m.DATE ? new Date(m.DATE).getFullYear().toString() : null);
            return yr === selectedYear;
        });
    }, [selectedYear, matches]);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (selectedYear && yearProfile) {
                exportMatchesToExcel(yearProfile, `Year_${selectedYear}_Matches`);
            } else {
                exportSummaryToExcel(yearsData, "EgyptClubs_Years_Summary", "name", "YEAR");
            }
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [yearsData, selectedYear, yearProfile]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    if (selectedYear && yearProfile) {
        return (
            <div className="detail-wrap fade-in">
                {/* Back Header */}
                <div className="detail-back-header">
                    <button 
                        onClick={() => setSelectedYear(null)}
                        className="back-button"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="detail-title">
                            {selectedYear} <span className="accent">YEAR MATCHES</span>
                        </h2>
                    </div>
                </div>

                <div className="gold-line" style={{ margin: '-10px 0 30px' }}></div>

                {/* Match Logs */}
                <div className="detail-matches-card">
                    <div className="detail-matches-title">
                        <Zap size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> Year Fixtures ({yearProfile.length} Matches)
                    </div>
                    {(() => {
                        const pageSize = 50;
                        const paginatedMatches = yearProfile.slice((currentPageDetail - 1) * pageSize, currentPageDetail * pageSize);
                        const totalPages = Math.ceil(yearProfile.length / pageSize);
                        return (
                            <div>
                                <table className="detail-matches-table">
                                     <thead>
                                         <tr>
                                             <th style={{ width: '10%' }}>DATE</th>
                                             <th style={{ width: '28%' }}>SEASON</th>
                                             <th style={{ width: '8%' }}>ROUND</th>
                                             <th style={{ width: '15%' }}>EGYPT CLUB</th>
                                             <th style={{ width: '10%' }}>SCORE</th>
                                             <th style={{ width: '15%' }}>OPPONENT CLUB</th>
                                             <th style={{ width: '6%' }}>H-A-N</th>
                                             <th style={{ width: '8%' }}>RESULT</th>
                                             <th style={{ width: '10%' }}>NOTE</th>
                                         </tr>
                                     </thead>
                                    <tbody>
                                        {paginatedMatches.map((m, i) => (
                                            <tr key={i}>
                                                <td style={{ color: '#666', fontFamily: 'Space Mono, monospace' }}>{formatDate(m.DATE)}</td>
                                                <td style={{ fontWeight: '600' }}>{m.SEASON}</td>
                                                <td style={{ color: '#666' }}>{m.ROUND}</td>
                                                <td style={{ fontWeight: '700' }}>🛡️ {m["EGYPT TEAM"]}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}>
                                                    {m.GF} - {m.GA} {m.PEN ? `(${m.PEN})` : ""}
                                                </td>
                                                <td>🚩 {m["OPPONENT TEAM"]}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{m["H-A-N"]}</td>
                                                <td style={{ 
                                                    fontWeight: 'bold',
                                                    color: m["W-D-L"] === 'W' ? '#00c853' : (m["W-D-L"] === 'L' ? '#ff4d4d' : 'var(--gold, #c9a84c)')
                                                }}>
                                                    {m["W-D-L"]}
                                                </td>
                                                <td style={{ color: '#888', fontSize: '11px' }}>{m["W-L Q & F"] ? m["W-L Q & F"] : (m.NOTE ? m.NOTE : "")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="pagination-container">
                                        <button 
                                            disabled={currentPageDetail === 1}
                                            onClick={() => setCurrentPageDetail(p => Math.max(1, p - 1))}
                                            className="page-btn"
                                        >
                                            ← PREV
                                        </button>
                                        <div className="page-info">
                                            PAGE {currentPageDetail} OF {totalPages}
                                        </div>
                                        <button 
                                            disabled={currentPageDetail === totalPages}
                                            onClick={() => setCurrentPageDetail(p => Math.min(totalPages, p + 1))}
                                            className="page-btn"
                                        >
                                            NEXT →
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content" id="tab-years">
            <div className="years-wrap">
                <div className="header-tabs-container">
                    <div className="section-title">EGYPT CLUB <span className="accent">YEARS</span></div>
                </div>
                <div className="gold-line" style={{ margin: '15px 0 30px' }}></div>

                {yearsData.length === 0 ? (
                    <NoData_db message="No years data found." />
                ) : (() => {
                    const pageSize = 50;
                    const paginatedYears = yearsData.slice((currentPageOverview - 1) * pageSize, currentPageOverview * pageSize);
                    const totalPages = Math.ceil(yearsData.length / pageSize);
                    
                    const totals = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
                    yearsData.forEach(y => {
                        totals.played += y.played;
                        totals.wins += y.wins;
                        totals.draws += y.draws;
                        totals.losses += y.losses;
                        totals.gf += y.gf;
                        totals.ga += y.ga;
                        totals.csf += y.csf;
                        totals.csa += y.csa;
                    });
                    const totalsWinRate = totals.played > 0 ? Math.round((totals.wins / totals.played) * 100) : 0;

                    return (
                        <div className="table-container">
                            <table className="years-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '25%' }}>YEAR</th>
                                        <th style={{ width: '7.5%' }}>PLAYED</th>
                                        <th style={{ color: '#00c853', width: '7.5%' }}>WON</th>
                                        <th style={{ color: 'var(--gold, #c9a84c)', width: '8%' }}>WIN %</th>
                                        <th style={{ color: 'var(--gold, #c9a84c)', width: '7.5%' }}>DRAW</th>
                                        <th style={{ color: '#ff4d4d', width: '7.5%' }}>LOSE</th>
                                        <th style={{ width: '7.5%' }}>GF</th>
                                        <th style={{ width: '7.5%' }}>GA</th>
                                        <th style={{ width: '7.5%' }}>CSF</th>
                                        <th style={{ width: '7.5%' }}>CSA</th>
                                        <th style={{ width: '7%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedYears.map((y) => {
                                        const winRate = y.played > 0 ? Math.round((y.wins / y.played) * 100) : 0;
                                        return (
                                            <tr 
                                                key={y.name} 
                                                onClick={() => setSelectedYear(y.name)}
                                                className="year-table-row"
                                            >
                                                <td className="year-name-cell">
                                                    📅 {y.name}
                                                </td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{y.played}</td>
                                                <td style={{ color: '#00c853', fontWeight: '600', fontFamily: 'Space Mono, monospace' }}>{y.wins}</td>
                                                <td style={{ fontWeight: 'bold', color: 'var(--gold, #c9a84c)' }}>
                                                    {winRate}%
                                                </td>
                                                <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{y.draws}</td>
                                                <td style={{ color: '#ff4d4d', fontFamily: 'Space Mono, monospace' }}>{y.losses}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{y.gf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{y.ga}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{y.csf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{y.csa}</td>
                                                <td>
                                                    <ChevronRight size={18} style={{ color: '#888' }} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    
                                    {/* Totals Row */}
                                    <tr className="year-totals-row">
                                        <td className="totals-label">TOTAL ({yearsData.length} Years)</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.played}</td>
                                        <td style={{ color: '#00c853', fontFamily: 'Space Mono, monospace' }}>{totals.wins}</td>
                                        <td style={{ color: 'var(--gold, #c9a84c)' }}>{totalsWinRate}%</td>
                                        <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{totals.draws}</td>
                                        <td style={{ color: '#ff4d4d', fontFamily: 'Space Mono, monospace' }}>{totals.losses}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.gf}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.ga}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.csf}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.csa}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-container">
                                    <button 
                                        disabled={currentPageOverview === 1}
                                        onClick={() => setCurrentPageOverview(p => Math.max(1, p - 1))}
                                        className="page-btn"
                                    >
                                        ← PREV
                                    </button>
                                    <div className="page-info">
                                        PAGE {currentPageOverview} OF {totalPages}
                                    </div>
                                    <button 
                                        disabled={currentPageOverview === totalPages}
                                        onClick={() => setCurrentPageOverview(p => Math.min(totalPages, p + 1))}
                                        className="page-btn"
                                    >
                                        NEXT →
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
