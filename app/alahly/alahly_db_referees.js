"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { AlAhlyService } from "./alahly_db_service";
import "./alahly_db_referees.css";
import Referee_Details_Hub from "./alahly_db_referee_details";

export default function AlAhlyReferees({ matches, playerDetails, howPenMissed }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReferee, setSelectedReferee] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;
    const statusDropdownRef = useRef(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Calculate Referee Statistics (Main List)
    const stats = useMemo(() => {
        const refereeStats = {};
        // ... (reuse calculation logic from previous version for the list)
        (matches || []).forEach(m => {
            let name = String(m.REFREE || "").trim();
            if (!name || name === "" || name === "?" || name === "؟") name = "?";
            if (!refereeStats[name]) {
                refereeStats[name] = {
                    name, matches: 0, wins: 0, pDraws: 0, nDraws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0
                };
            }
            const s = refereeStats[name];
            s.matches += 1;
            const gf = parseInt(m["GF"]) || 0;
            const ga = parseInt(m["GA"]) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            s.gs += gf; s.ga += ga;
            if (wdl === "W") s.wins += 1;
            else if (wdl === "L") s.losses += 1;
            else if (wdl === "D" || wdl.includes("DRAW")) {
                if (gf > 0 || ga > 0) s.pDraws += 1;
                else s.nDraws += 1;
            }
            if (ga === 0) s.csFor += 1;
            if (gf === 0) s.csAgainst += 1;

            const matchId = String(m.MATCH_ID);
            const matchEvents = (playerDetails || []).filter(p =>
                String(p.MATCH_ID) === matchId &&
                (String(p.TYPE).toUpperCase() === 'PENGOAL' || String(p.TYPE_SUB).toUpperCase() === 'PENGOAL')
            );
            const penForAhly = matchEvents.filter(p => {
                const t = String(p.TEAM || "");
                return t.toUpperCase().includes('AHLY') || t.includes('الأهلي');
            }).length;
            const penAgainstAhly = matchEvents.length - penForAhly;
            s.penFor += penForAhly;
            s.penAgainst += penAgainstAhly;
        });

        return Object.values(refereeStats)
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (a.name === "?" || a.name === "؟") return 1;
                if (b.name === "?" || b.name === "؟") return -1;
                return b.matches - a.matches;
            });
    }, [matches, playerDetails, searchTerm]);

    const totalPages = Math.ceil(stats.length / pageSize);
    const paginatedStats = useMemo(() => {
        return stats.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [stats, currentPage]);

    const grandTotals = useMemo(() => {
        return stats.reduce((acc, s) => ({
            matches: acc.matches + s.matches,
            wins: acc.wins + s.wins,
            pDraws: acc.pDraws + s.pDraws,
            nDraws: acc.nDraws + s.nDraws,
            losses: acc.losses + s.losses,
            gs: acc.gs + s.gs,
            ga: acc.ga + s.ga,
            csFor: acc.csFor + s.csFor,
            csAgainst: acc.csAgainst + s.csAgainst,
            penFor: acc.penFor + s.penFor,
            penAgainst: acc.penAgainst + s.penAgainst
        }), { matches: 0, wins: 0, pDraws: 0, nDraws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 });
    }, [stats]);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (!selectedReferee) handleExport();
        };
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [stats, selectedReferee]);

    const handleExport = () => {
        const exportData = stats.map((s, idx) => ({
            "#": idx + 1,
            "Referee Name": s.name,
            "MP": s.matches,
            "W": s.wins,
            "D(+)": s.pDraws,
            "D(-)": s.nDraws,
            "L": s.losses,
            "GF": s.gs,
            "GA": s.ga,
            "CS(F)": s.csFor,
            "CS(A)": s.csAgainst,
            "PEN(F)": s.penFor,
            "PEN(A)": s.penAgainst
        }));
        AlAhlyService.exportToExcel(exportData, "AlAhly_Referees_Stats");
    };

    if (selectedReferee) {
        return (
            <Referee_Details_Hub
                refereeName={selectedReferee}
                masterMatches={matches}
                playerDetails={playerDetails}
                onBack={() => setSelectedReferee(null)}
            />
        );
    }

    return (
        <div className="tab-content fade-in" id="tab-referees">
            <div className="referee-premium-wrap">
                <div className="header-tabs-container">
                    <div className="section-title">AL AHLY <span className="accent">REFEREES</span></div>
                </div>
                <div className="gold-line"></div>

                <div className="referee-controls">
                    <div className="referee-search-wrap">
                        <input
                            type="text"
                            placeholder="Search referee name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="referee-search-input"
                        />
                    </div>
                </div>

                <div className="referee-table-container premium-scroll">
                    <table className="modern-referee-table">
                        <colgroup>
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>#</th>
                                <th style={{ textAlign: 'center' }}>Referee Name</th>
                                <th>MP</th>
                                <th>W</th>
                                <th>D (+)</th>
                                <th>D (-)</th>
                                <th>L</th>
                                <th>GF</th>
                                <th>GA</th>
                                <th>CS (F)</th>
                                <th>CS (A)</th>
                                <th>PEN (F)</th>
                                <th>PEN (A)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStats.length > 0 ? (
                                paginatedStats.map((s, idx) => (
                                    <tr key={s.name}>
                                        <td style={{ textAlign: 'center', opacity: 0.3, fontWeight: 800 }}>
                                            {(currentPage - 1) * pageSize + idx + 1}
                                        </td>
                                        <td className="p-name"
                                            style={{ textAlign: 'center', cursor: 'pointer' }}
                                            onClick={() => setSelectedReferee(s.name)}
                                        >
                                            {s.name}
                                        </td>
                                        <td>{s.matches}</td>
                                        <td className="w-cell">{s.wins}</td>
                                        <td style={{ color: '#aaa' }}>{s.pDraws}</td>
                                        <td style={{ color: '#777' }}>{s.nDraws}</td>
                                        <td className="l-cell">{s.losses}</td>
                                        <td>{s.gs}</td>
                                        <td>{s.ga}</td>
                                        <td className="cs-cell" style={{ color: 'var(--gold)', fontWeight: 800 }}>{s.csFor}</td>
                                        <td>{s.csAgainst}</td>
                                        <td style={{ color: '#f39c12', fontWeight: 800 }}>{s.penFor}</td>
                                        <td style={{ color: '#e67e22', fontWeight: 800 }}>{s.penAgainst}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="13" style={{ padding: '100px', opacity: 0.4 }}>No referees found.</td></tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="grand-total-row">
                                <td></td>
                                <td className="total-label" style={{ textAlign: 'center' }}>G. TOTAL</td>
                                <td>{grandTotals.matches}</td>
                                <td className="w-cell">{grandTotals.wins}</td>
                                <td>{grandTotals.pDraws}</td>
                                <td>{grandTotals.nDraws}</td>
                                <td className="l-cell">{grandTotals.losses}</td>
                                <td>{grandTotals.gs}</td>
                                <td>{grandTotals.ga}</td>
                                <td className="cs-cell" style={{ color: 'var(--gold)', fontWeight: 800 }}>{grandTotals.csFor}</td>
                                <td>{grandTotals.csAgainst}</td>
                                <td style={{ color: '#f39c12' }}>{grandTotals.penFor}</td>
                                <td style={{ color: '#e67e22' }}>{grandTotals.penAgainst}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-referee">
                        <button className="page-btn prev-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>PREV</button>
                        <div className="page-info">PAGE <span className="p-num">{currentPage}</span> OF <span className="p-num">{totalPages}</span></div>
                        <button className="page-btn next-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>NEXT</button>
                    </div>
                )}
            </div>
        </div>
    );
}
