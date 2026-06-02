"use client";

import { useMemo, useEffect } from "react";
import "./egypt_nt_db_champions.css";
import { EgyptNTService } from "./egypt_nt_db_service";
import NoData_db from "../lib/NoData_db";

export default function EgyptNTChampions({ matchesData }) {
    const championStats = useMemo(() => {
        if (!matchesData || matchesData.length === 0) return [];

        const compMap = new Map();

        matchesData.forEach(match => {
            const name = match.CHAMPION || "Other Matches";
            if (!compMap.has(name)) {
                compMap.set(name, {
                    name,
                    mp: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    gf: 0,
                    ga: 0,
                    cs: 0,
                });
            }

            const stats = compMap.get(name);
            stats.mp++;

            const result = String(match["W-D-L"] || "").toUpperCase();
            if (result === "W") {
                stats.wins++;
            } else if (result === "L") {
                stats.losses++;
            } else if (result.startsWith("D")) {
                stats.draws++;
            }

            const gf = parseInt(match.GF) || 0;
            const ga = parseInt(match.GA) || 0;
            stats.gf += gf;
            stats.ga += ga;

            if (ga === 0) stats.cs++;
        });

        return Array.from(compMap.values())
            .map(s => {
                const winRate = s.mp > 0 ? ((s.wins / s.mp) * 100).toFixed(1) : "0.0";
                return {
                    ...s,
                    winRate
                };
            })
            .sort((a, b) => b.wins - a.wins || b.mp - a.mp);
    }, [matchesData]);

    const grandTotals = useMemo(() => {
        const t = { mp: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, cs: 0 };
        championStats.forEach(s => {
            t.mp += s.mp;
            t.wins += s.wins;
            t.draws += s.draws;
            t.losses += s.losses;
            t.gf += s.gf;
            t.ga += s.ga;
            t.cs += s.cs;
        });
        return t;
    }, [championStats]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [championStats]);

    const handleExport = () => {
        const exportData = championStats.map((comp, idx) => ({
            "#": idx + 1,
            "COMPETITION": comp.name,
            "MP": comp.mp,
            "W": comp.wins,
            "D": comp.draws,
            "L": comp.losses,
            "WIN %": `${comp.winRate}%`,
            "GF": comp.gf,
            "GA": comp.ga,
            "CS": comp.cs
        }));
        EgyptNTService.exportToExcel(exportData, "EgyptNT_Competitions");
    };

    return (
        <div className="tab-content fade-in" id="tab-egypt-champions">
            <div className="egypt-champions-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '0' }}>
                <div className="section-title">EGYPT NT <span className="accent">COMPETITIONS</span></div>
                <div className="gold-line"></div>

                <div className="egypt-table-container">
                    <table className="egypt-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>#</th>
                                <th style={{ textAlign: 'center' }}>COMPETITION</th>
                                <th style={{ width: '100px' }}>MP</th>
                                <th style={{ width: '120px', color: '#16a34a' }}>W</th>
                                <th style={{ width: '100px' }}>D</th>
                                <th style={{ width: '120px', color: '#dc2626' }}>L</th>
                                <th style={{ width: '120px' }}>WIN %</th>
                                <th style={{ width: '120px' }}>GF</th>
                                <th style={{ width: '120px' }}>GA</th>
                                <th style={{ width: '120px', color: 'var(--gold)' }}>CS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {championStats.length === 0 ? (
                                <NoData_db isTable={true} colSpan={10} message="No competition records found." />
                            ) : (
                                championStats.map((comp, idx) => (
                                    <tr key={comp.name}>
                                        <td>
                                            <span className={`rank-badge-premium ${idx < 3 ? 'rank-gold' : ''}`}>
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="p-name" style={{ textAlign: 'center' }}>{comp.name}</td>
                                        <td>{comp.mp}</td>
                                        <td className="w-cell">{comp.wins}</td>
                                        <td className="d-cell">{comp.draws}</td>
                                        <td className="l-cell">{comp.losses}</td>
                                        <td style={{ color: 'var(--gold)' }}>{comp.winRate}%</td>
                                        <td className="w-cell">{comp.gf}</td>
                                        <td className="l-cell">{comp.ga}</td>
                                        <td className="cs-cell" style={{ fontWeight: 800 }}>{comp.cs}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {championStats.length > 0 && (
                            <tfoot>
                                <tr className="total-row-premium">
                                    <td colSpan="2" style={{ textAlign: 'center' }}>TOTALS</td>
                                    <td>{grandTotals.mp}</td>
                                    <td className="w-cell">{grandTotals.wins}</td>
                                    <td className="d-cell">{grandTotals.draws}</td>
                                    <td className="l-cell">{grandTotals.losses}</td>
                                    <td>{grandTotals.mp > 0 ? ((grandTotals.wins / grandTotals.mp) * 100).toFixed(1) : "0.0"}%</td>
                                    <td className="w-cell">{grandTotals.gf}</td>
                                    <td className="l-cell">{grandTotals.ga}</td>
                                    <td className="cs-cell" style={{ fontWeight: 800 }}>{grandTotals.cs}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
