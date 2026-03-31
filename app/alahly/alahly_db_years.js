"use client";

import { useMemo, useEffect } from "react";
import "./alahly_db_years.css";
import { AlAhlyService } from "./alahly_db_service";

export default function AlAhlyYears({ matches }) {

    // --- STEP 1: GROUP DATA ONLY BY YEAR (Extracted from DATE) ---
    const statsByYear = useMemo(() => {
        const stats = {};

        (matches || []).forEach(m => {
            const dateStr = String(m.DATE || "").trim();
            let yearVal = "Unknown";

            if (dateStr) {
                const parts = dateStr.split(/[-/]/);
                if (parts[0].length === 4) yearVal = parts[0];
                else {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getFullYear())) {
                        yearVal = String(d.getFullYear());
                    }
                }
            }

            if (!stats[yearVal]) {
                stats[yearVal] = {
                    MP: 0,
                    W: 0,
                    DP: 0,
                    DN: 0,
                    L: 0,
                    GF: 0,
                    GA: 0,
                    CSF: 0,
                    CSA: 0
                };
            }

            const row = stats[yearVal];
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            const isD = wdl.includes('D');
            const isW = wdl.includes('W');
            const isL = wdl.includes('L');

            row.MP += 1;
            if (isW) row.W += 1;
            else if (isL) row.L += 1;
            else if (isD) {
                if (Number(m.GF) === 0 && Number(m.GA) === 0) row.DN += 1;
                else row.DP += 1;
            }

            row.GF += Number(m.GF) || 0;
            row.GA += Number(m.GA) || 0;
            if (Number(m.GA) === 0) row.CSF += 1;
            if (Number(m.GF) === 0) row.CSA += 1;
        });

        return stats;
    }, [matches]);

    // Sorting Helper
    const sortedYears = useMemo(() => {
        return Object.keys(statsByYear).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
            return b.localeCompare(a);
        });
    }, [statsByYear]);

    // Calculate Grand Total
    const grandTotals = useMemo(() => {
        const t = { MP: 0, W: 0, DP: 0, DN: 0, L: 0, GF: 0, GA: 0, CSF: 0, CSA: 0 };
        Object.values(statsByYear).forEach(s => {
            t.MP += s.MP;
            t.W += s.W;
            t.DP += s.DP;
            t.DN += s.DN;
            t.L += s.L;
            t.GF += s.GF;
            t.GA += s.GA;
            t.CSF += s.CSF;
            t.CSA += s.CSA;
        });
        return t;
    }, [statsByYear]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [statsByYear, sortedYears]);

    const handleExport = () => {
        const exportData = sortedYears.map(year => {
            const s = statsByYear[year];
            return {
                "YEAR": year,
                "MP": s.MP,
                "W": s.W,
                "D(+)": s.DP,
                "D(-)": s.DN,
                "L": s.L,
                "GF": s.GF,
                "GA": s.GA,
                "CS(F)": s.CSF,
                "CS(A)": s.CSA
            };
        });
        AlAhlyService.exportToExcel(exportData, "AlAhly_Stats_By_Year");
    };

    return (
        <div className="tab-content" id="tab-years">
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '0' }}>
                <div className="section-title">AL AHLY <span className="accent">YEARS</span></div>
                <div className="gold-line"></div>

                <div className="table-responsive" style={{ marginTop: '20px' }}>
                    <table className="seasons-data-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>YEAR</th>
                                <th>MP</th>
                                <th>W</th>
                                <th title="Positive Draws">D(+)</th>
                                <th title="Negative Draws">D(-)</th>
                                <th>L</th>
                                <th>GF</th>
                                <th>GA</th>
                                <th title="Clean Sheet For">CS(F)</th>
                                <th title="Clean Sheet Against">CS(A)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedYears.length === 0 ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '100px', opacity: 0.4 }}>No data found.</td></tr>
                            ) : (
                                sortedYears.map(year => {
                                    const s = statsByYear[year];
                                    return (
                                        <tr key={year}>
                                            <td className="season-cell">{year}</td>
                                            <td>{s.MP}</td>
                                            <td className="w-cell">{s.W}</td>
                                            <td>{s.DP}</td>
                                            <td>{s.DN}</td>
                                            <td className="l-cell">{s.L}</td>
                                            <td>{s.GF}</td>
                                            <td>{s.GA}</td>
                                            <td className="cs-cell">{s.CSF}</td>
                                            <td>{s.CSA}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="grand-total-row" style={{ background: '#000', color: '#fff' }}>
                                <td className="total-label">G. TOTAL</td>
                                <td>{grandTotals.MP}</td>
                                <td className="w-cell" style={{ color: '#5ef193' }}>{grandTotals.W}</td>
                                <td>{grandTotals.DP}</td>
                                <td>{grandTotals.DN}</td>
                                <td className="l-cell" style={{ color: '#ff6b6b' }}>{grandTotals.L}</td>
                                <td>{grandTotals.GF}</td>
                                <td>{grandTotals.GA}</td>
                                <td className="cs-cell" style={{ color: 'var(--gold)' }}>{grandTotals.CSF}</td>
                                <td>{grandTotals.CSA}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
