"use client";

import { useMemo } from "react";
import "./ahly_v_zamalek_champions.css";

export default function AhlyVZamalekChampions({ derbyData }) {
    const championStats = useMemo(() => {
        if (!derbyData || derbyData.length === 0) return [];

        const compMap = new Map();

        derbyData.forEach(match => {
            const name = match.CHAMPION || "Other Matches";
            if (!compMap.has(name)) {
                compMap.set(name, {
                    name,
                    mp: 0,
                    ahlyWins: 0,
                    draws: 0,
                    zamalekWins: 0,
                    gf: 0, // Ahly Goals
                    ga: 0, // Zamalek Goals
                    ahlyCS: 0, // Ahly Clean Sheets
                    zamalekCS: 0, // Zamalek Clean Sheets
                });
            }

            const stats = compMap.get(name);
            stats.mp++;

            const result = String(match["W-D-L"] || "").toUpperCase();
            if (result === "W") {
                stats.ahlyWins++;
            } else if (result === "L") {
                stats.zamalekWins++;
            } else if (result === "D") {
                stats.draws++;
            }

            const gf = parseInt(match.GF) || 0;
            const ga = parseInt(match.GA) || 0;
            stats.gf += gf;
            stats.ga += ga;

            if (ga === 0) stats.ahlyCS++;
            if (gf === 0) stats.zamalekCS++;
        });

        return Array.from(compMap.values())
            .map(s => {
                const totalAhlyWins = s.ahlyWins;
                const winRate = s.mp > 0 ? ((totalAhlyWins / s.mp) * 100).toFixed(1) : "0.0";
                return {
                    ...s,
                    winRate
                };
            })
            .sort((a, b) => b.ahlyWins - a.ahlyWins || b.mp - a.mp);
    }, [derbyData]);

    const grandTotals = useMemo(() => {
        const t = { mp: 0, ahlyWins: 0, draws: 0, zamalekWins: 0, gf: 0, ga: 0, ahlyCS: 0, zamalekCS: 0 };
        championStats.forEach(s => {
            t.mp += s.mp;
            t.ahlyWins += s.ahlyWins;
            t.draws += s.draws;
            t.zamalekWins += s.zamalekWins;
            t.gf += s.gf;
            t.ga += s.ga;
            t.ahlyCS += s.ahlyCS;
            t.zamalekCS += s.zamalekCS;
        });
        return t;
    }, [championStats]);

    return (
        <div className="tab-content fade-in" id="tab-avz-champions">
            <div className="avz-premium-wrap" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div className="avz-champions-header">
                    <h1 className="champions-title">DERBY <span className="gold-text">COMPETITIONS</span></h1>
                </div>

                <div className="avz-table-container">
                    <table className="avz-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>#</th>
                                <th style={{ textAlign: 'center' }}>COMPETITION</th>
                                <th style={{ width: '80px' }}>MP</th>
                                <th style={{ width: '120px', color: '#16a34a' }}>AHLY W</th>
                                <th style={{ width: '80px' }}>D</th>
                                <th style={{ width: '120px', color: '#dc2626' }}>ZAM W</th>
                                <th style={{ width: '120px' }}>AHLY GF</th>
                                <th style={{ width: '120px' }}>ZAM GF</th>
                                <th style={{ width: '120px', color: 'var(--gold)' }}>AHLY CS</th>
                                <th style={{ width: '120px', color: 'var(--gold)' }}>ZAM CS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {championStats.map((comp, idx) => (
                                <tr key={comp.name}>
                                    <td>
                                        <span className={`rank-badge-premium ${idx < 3 ? 'rank-gold' : ''}`}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="p-name" style={{ textAlign: 'center' }}>{comp.name}</td>
                                    <td>{comp.mp}</td>
                                    <td className="ahly-win-cell">{comp.ahlyWins}</td>
                                    <td className="draw-cell">{comp.draws}</td>
                                    <td className="zamalek-win-cell">{comp.zamalekWins}</td>
                                    <td className="ahly-win-cell">{comp.gf}</td>
                                    <td className="zamalek-win-cell">{comp.ga}</td>
                                    <td className="cs-cell" style={{ fontWeight: 800 }}>{comp.ahlyCS}</td>
                                    <td className="cs-cell" style={{ fontWeight: 800 }}>{comp.zamalekCS}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="total-row-premium">
                                <td colSpan="2" style={{ textAlign: 'center' }}>TOTALS</td>
                                <td>{grandTotals.mp}</td>
                                <td className="ahly-win-cell">{grandTotals.ahlyWins}</td>
                                <td className="draw-cell">{grandTotals.draws}</td>
                                <td className="zamalek-win-cell">{grandTotals.zamalekWins}</td>
                                <td className="ahly-win-cell">{grandTotals.gf}</td>
                                <td className="zamalek-win-cell">{grandTotals.ga}</td>
                                <td className="cs-cell" style={{ fontWeight: 800 }}>{grandTotals.ahlyCS}</td>
                                <td className="cs-cell" style={{ fontWeight: 800 }}>{grandTotals.zamalekCS}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
