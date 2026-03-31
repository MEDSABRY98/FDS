"use client";

import { useEffect, useMemo } from "react";
import "./alahly_db_seasons.css";
import { AlAhlyService } from "./alahly_db_service";

export default function AlAhlySeasons({ matches }) {

    // --- STEP 1: GROUP DATA BY CHAMPION AND THEN BY SEASON ---
    const statsByChampion = {};

    matches.forEach(m => {
        const champ = m.CHAMPION || "Unknown Competition";
        const season = m["SEASON - NAME"] || "Unknown Season";

        if (!statsByChampion[champ]) {
            statsByChampion[champ] = {};
        }

        if (!statsByChampion[champ][season]) {
            statsByChampion[champ][season] = {
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

        const row = statsByChampion[champ][season];
        const isD = m["W-D-L"] && m["W-D-L"].toUpperCase().includes('D');
        const isW = m["W-D-L"] && m["W-D-L"].toUpperCase().includes('W');
        const isL = m["W-D-L"] && m["W-D-L"].toUpperCase().includes('L');

        row.MP += 1;
        if (isW) row.W += 1;
        if (isL) row.L += 1;
        if (isD) {
            if (Number(m.GF) === 0 && Number(m.GA) === 0) row.DN += 1;
            else row.DP += 1;
        }

        row.GF += Number(m.GF) || 0;
        row.GA += Number(m.GA) || 0;
        if (Number(m.GA) === 0) row.CSF += 1;
        if (Number(m.GF) === 0) row.CSA += 1;
    });

    // Helper to extract the first 4-digit year from a string for sorting
    const extractYear = (str) => {
        const match = str.match(/\d{4}/);
        return match ? parseInt(match[0]) : 0;
    };

    // --- STEP 2: SORT CHAMPIONS ALPHABETICALLY ---
    const sortedChamps = Object.keys(statsByChampion).sort();

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [statsByChampion, sortedChamps]);

    const handleExport = () => {
        const exportData = [];
        sortedChamps.forEach(champ => {
            const seasons = Object.keys(statsByChampion[champ]).sort((a, b) => {
                const yearA = extractYear(a);
                const yearB = extractYear(b);
                if (yearB !== yearA) return yearB - yearA;
                return b.localeCompare(a);
            });
            seasons.forEach(season => {
                const s = statsByChampion[champ][season];
                exportData.push({
                    "CHAMPION": champ,
                    "SEASON": season,
                    "MP": s.MP,
                    "W": s.W,
                    "D(+)": s.DP,
                    "D(-)": s.DN,
                    "L": s.L,
                    "GF": s.GF,
                    "GA": s.GA,
                    "CS(F)": s.CSF,
                    "CS(A)": s.CSA
                });
            });
        });
        AlAhlyService.exportToExcel(exportData, "AlAhly_Seasons_Name");
    };

    return (
        <div className="tab-content" id="tab-seasons">
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '0' }}>
                <div className="section-title">AL AHLY <span className="accent">SEASONS - NAME</span></div>
                <div className="gold-line"></div>

                {sortedChamps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px', opacity: 0.4 }}>No data found.</div>
                ) : (
                    sortedChamps.map(champ => {
                        // SMART SORT: Extract year and sort descending
                        const sortedSeasons = Object.keys(statsByChampion[champ]).sort((a, b) => {
                            const yearA = extractYear(a);
                            const yearB = extractYear(b);
                            // If years are same, fallback to alphabetical (for cases like same year but different titles)
                            if (yearB !== yearA) return yearB - yearA;
                            return b.localeCompare(a);
                        });

                        // Calculate Grand Totals for this Champion
                        const totals = { MP: 0, W: 0, DP: 0, DN: 0, L: 0, GF: 0, GA: 0, CSF: 0, CSA: 0 };
                        sortedSeasons.forEach(seasonKey => {
                            const s = statsByChampion[champ][seasonKey];
                            totals.MP += s.MP;
                            totals.W += s.W;
                            totals.DP += s.DP;
                            totals.DN += s.DN;
                            totals.L += s.L;
                            totals.GF += s.GF;
                            totals.GA += s.GA;
                            totals.CSF += s.CSF;
                            totals.CSA += s.CSA;
                        });

                        return (
                            <div key={champ} className="champion-section" style={{ marginBottom: '40px' }}>
                                <div className="champ-title-bar">
                                    <span className="champ-icon">🏆</span>
                                    {champ}
                                </div>
                                <div className="table-responsive">
                                    <table className="seasons-data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'center' }}>SEASON</th>
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
                                            {sortedSeasons.map(season => {
                                                const s = statsByChampion[champ][season];
                                                const pts = (s.W * 3) + (s.DP + s.DN);
                                                return (
                                                    <tr key={season}>
                                                        <td className="season-cell">{season}</td>
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
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="grand-total-row">
                                                <td className="total-label">G. TOTAL</td>
                                                <td>{totals.MP}</td>
                                                <td className="w-cell">{totals.W}</td>
                                                <td>{totals.DP}</td>
                                                <td>{totals.DN}</td>
                                                <td className="l-cell">{totals.L}</td>
                                                <td>{totals.GF}</td>
                                                <td>{totals.GA}</td>
                                                <td className="cs-cell">{totals.CSF}</td>
                                                <td>{totals.CSA}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style jsx>{`
                .champ-title-bar {
                    background: var(--black);
                    color: var(--gold);
                    padding: 14px 24px;
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 22px;
                    letter-spacing: 1.5px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-radius: 2px 2px 0 0;
                    border-left: 4px solid var(--gold);
                }
                .champ-icon { font-size: 18px; filter: grayscale(1) invert(1); opacity: 0.8; }
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
                
                /* Zebra Striping */
                .seasons-data-table tbody tr:nth-child(odd) { background: #ffffff; }
                .seasons-data-table tbody tr:nth-child(even) { background: rgba(0,0,0,0.03); }
                .seasons-data-table tbody tr:hover td { background: rgba(201,168,76,0.05); }

                .grand-total-row { background: var(--black) !important; color: #fff; }
                .grand-total-row td { border-bottom: none; font-weight: 700; font-size: 17px; padding: 18px 12px; }
                .total-label { color: var(--gold) !important; font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
                .grand-total-row .pts-cell-total { background: rgba(255,255,255,0.1); color: #fff; }
                .grand-total-row .w-cell { color: #5ef193; }
                .grand-total-row .l-cell { color: #ff6b6b; }
                .seasons-data-table tr:hover td { background: rgba(0,0,0,0.02); }
            `}</style>
        </div>
    );
}
