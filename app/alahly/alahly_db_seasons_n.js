"use client";

import { useMemo } from "react";
import "./alahly_db_seasons.css";

export default function AlAhlySeasonsN({ matches }) {

    // --- STEP 1: GROUP DATA ONLY BY SY (Season Year) ---
    const statsBySY = useMemo(() => {
        const stats = {};

        (matches || []).forEach(m => {
            const syVal = String(m["SEASON - NUMBER"] || "Unknown SY").trim();

            if (!stats[syVal]) {
                stats[syVal] = {
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

            const row = stats[syVal];
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
    const extractYear = (str) => {
        const match = String(str).match(/\d{4}/);
        return match ? parseInt(match[0]) : 0;
    };

    const sortedSYs = useMemo(() => {
        return Object.keys(statsBySY).sort((a, b) => {
            const yearA = extractYear(a);
            const yearB = extractYear(b);
            if (yearB !== yearA) return yearB - yearA;
            return b.localeCompare(a);
        });
    }, [statsBySY]);

    // Calculate Grand Total
    const grandTotals = useMemo(() => {
        const t = { MP: 0, W: 0, DP: 0, DN: 0, L: 0, GF: 0, GA: 0, CSF: 0, CSA: 0 };
        Object.values(statsBySY).forEach(s => {
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
    }, [statsBySY]);

    return (
        <div className="tab-content" id="tab-seasons-n">
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '0' }}>
                <div className="section-title">AL AHLY <span className="accent">SEASONS - NUMBER</span></div>
                <div className="gold-line"></div>

                <div className="table-responsive" style={{ marginTop: '20px' }}>
                    <table className="seasons-data-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>S. NUMBER (SY)</th>
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
                            {sortedSYs.length === 0 ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '100px', opacity: 0.4 }}>No data found.</td></tr>
                            ) : (
                                sortedSYs.map(sy => {
                                    const s = statsBySY[sy];
                                    const pts = (s.W * 3) + (s.DP + s.DN);
                                    return (
                                        <tr key={sy}>
                                            <td className="season-cell">{sy}</td>
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

            <style jsx>{`
                .table-responsive { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); }
                .seasons-data-table { width: 100%; border-collapse: collapse; font-family: 'DM Sans', sans-serif; }
                .seasons-data-table th { 
                    background: rgba(0,0,0,0.05); 
                    padding: 16px 12px; 
                    font-size: 12px; 
                    font-family: 'Space Mono', monospace; 
                    color: var(--black); 
                    border-bottom: 3px solid var(--gold); 
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .seasons-data-table td { padding: 14px 12px; text-align: center; font-size: 16px; border-bottom: 1px solid var(--border); font-weight: 500; }
                .season-cell { color: var(--black); font-weight: 600; }
                .w-cell { color: #2ecc71; }
                .l-cell { color: #e74c3c; }
                .cs-cell { color: var(--gold); font-weight: 700; }
                .pts-cell-total { font-weight: 700; color: var(--black); }
                
                .seasons-data-table tbody tr:nth-child(odd) { background: #ffffff; }
                .seasons-data-table tbody tr:nth-child(even) { background: rgba(0,0,0,0.03); }
                .seasons-data-table tbody tr:hover td { background: rgba(201,168,76,0.05); }

                .grand-total-row td { border-bottom: none; font-weight: 700; font-size: 17px; padding: 18px 12px; }
                .total-label { color: var(--gold) !important; font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
            `}</style>
        </div>
    );
}
