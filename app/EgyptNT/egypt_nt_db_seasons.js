"use client";

import { useEffect, useMemo } from "react";
import { EgyptNTService } from "./egypt_nt_db_service";
import NoData_db from "../lib/NoData_db";
import "./egypt_nt_db_seasons.css";

export default function EgyptNTSeasons({ matches }) {
    const statsByChampion = useMemo(() => {
        const stats = {};
        (matches || []).forEach(m => {
            const champ = m.CHAMPION || "Unknown Competition";
            const season = m["SEASON"] || "Unknown Season";

            if (!stats[champ]) stats[champ] = {};
            if (!stats[champ][season]) {
                stats[champ][season] = {
                    MP: 0, W: 0, DP: 0, DN: 0, L: 0, GF: 0, GA: 0, CSF: 0, CSA: 0
                };
            }

            const row = stats[champ][season];
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            const isD = wdl.includes('D');
            const isW = wdl.includes('W');
            const isL = wdl.includes('L');

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
        return stats;
    }, [matches]);

    const extractYear = (str) => {
        const match = str.match(/\d{4}/);
        return match ? parseInt(match[0]) : 0;
    };

    const sortedChamps = useMemo(() => {
        return Object.keys(statsByChampion).sort();
    }, [statsByChampion]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
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
        EgyptNTService.exportToExcel(exportData, "EgyptNT_Seasons");
    };

    return (
        <div className="tab-content" id="tab-seasons">
            <div className="seasons-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '0' }}>
                <div className="section-title">EGYPT NT <span className="accent">SEASONS</span></div>
                <div className="gold-line"></div>

                {sortedChamps.length === 0 ? (
                    <NoData_db message="No data found." />
                ) : (
                    sortedChamps.map(champ => {
                        const sortedSeasons = Object.keys(statsByChampion[champ]).sort((a, b) => {
                            const yearA = extractYear(a);
                            const yearB = extractYear(b);
                            if (yearB !== yearA) return yearB - yearA;
                            return b.localeCompare(a);
                        });

                        const totals = { MP: 0, W: 0, DP: 0, DN: 0, L: 0, GF: 0, GA: 0, CSF: 0, CSA: 0 };
                        sortedSeasons.forEach(seasonKey => {
                            const s = statsByChampion[champ][seasonKey];
                            totals.MP += s.MP; totals.W += s.W; totals.DP += s.DP; totals.DN += s.DN; totals.L += s.L;
                            totals.GF += s.GF; totals.GA += s.GA; totals.CSF += s.CSF; totals.CSA += s.CSA;
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
        </div>
    );
}
