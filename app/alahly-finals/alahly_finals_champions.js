"use client";

import { useMemo } from "react";
import { Award, Globe, Shield, Star, Zap, TrendingUp, Target } from "lucide-react";
import "./alahly_finals_champions.css";

export default function AlAhlyFinalsChampions({ finalsData }) {
    const championStats = useMemo(() => {
        if (!finalsData || finalsData.length === 0) return [];

        const compMap = new Map();

        finalsData.forEach(match => {
            const name = match.CHAMPION || "Unknown Competition";
            if (!compMap.has(name)) {
                compMap.set(name, {
                    name,
                    finalIds: new Set(),
                    finalWins: new Set(),
                    finalLosses: new Set(),
                    matchesCount: 0,
                    matchWins: 0,
                    matchLosses: 0,
                    matchDraws: 0,
                    gf: 0,
                    ga: 0,
                    cleanSheets: 0,
                    seasons: new Set(),
                });
            }

            const stats = compMap.get(name);
            const finalId = match.FINAL_ID || match.MATCH_ID;

            stats.finalIds.add(finalId);
            stats.matchesCount++;
            stats.seasons.add(match["SEASON - NAME"]);

            const finalResult = String(match["W-D-L FINAL"] || "").toUpperCase();
            if (finalResult === "CHAMPION" || finalResult.includes("W")) {
                stats.finalWins.add(finalId);
            } else if (finalResult === "RUNNER-UP" || finalResult.includes("L")) {
                stats.finalLosses.add(finalId);
            }

            const matchResult = String(match["W-D-L MATCH"] || "").toUpperCase();
            if (matchResult === "W") stats.matchWins++;
            else if (matchResult === "L") stats.matchLosses++;
            else if (matchResult === "D") stats.matchDraws++;

            const gf = parseInt(match.GF) || 0;
            const ga = parseInt(match.GA) || 0;
            stats.gf += gf;
            stats.ga += ga;
            if (ga === 0) stats.cleanSheets++;
        });

        return Array.from(compMap.values())
            .map(s => {
                const totalFinals = s.finalIds.size;
                const wins = s.finalWins.size;
                return {
                    name: s.name,
                    totalFinals,
                    wins,
                    losses: totalFinals - wins,
                    winRate: totalFinals > 0 ? ((wins / totalFinals) * 100).toFixed(1) : "0.0",
                    matchesCount: s.matchesCount,
                    matchWins: s.matchWins,
                    matchLosses: s.matchLosses,
                    matchDraws: s.matchDraws,
                    gf: s.gf,
                    ga: s.ga,
                    cleanSheets: s.cleanSheets,
                };
            })
            .sort((a, b) => b.wins - a.wins || b.totalFinals - a.totalFinals);
    }, [finalsData]);

    const grandTotals = useMemo(() => {
        const t = { finals: 0, wins: 0, losses: 0, mp: 0, mw: 0, ml: 0, gf: 0, ga: 0, cs: 0 };
        championStats.forEach(s => {
            t.finals += s.totalFinals; t.wins += s.wins; t.losses += s.losses;
            t.mp += s.matchesCount; t.mw += s.matchWins; t.ml += s.matchLosses;
            t.gf += s.gf; t.ga += s.ga; t.cs += s.cleanSheets;
        });
        return t;
    }, [championStats]);

    return (
        <div className="tab-content fade-in" id="tab-finals-champions">
            <div className="mgr-premium-wrap" style={{ maxWidth: '1440px', margin: '0 auto' }}>
                <div className="finals-matches-header">
                    <h1 className="matches-title">AL AHLY <span className="gold-text">CHAMPIONS</span></h1>
                </div>

                <div className="mgr-table-container shadow-premium">
                    <table className="mgr-table" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th style={{ textAlign: 'center' }}>COMPETITION</th>
                                <th>FINALS</th>
                                <th>W (🏆)</th>
                                <th>WIN %</th>
                                <th>L</th>
                                <th>MP</th>
                                <th>MW</th>
                                <th>GF</th>
                                <th>GA</th>
                                <th>CS</th>
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
                                    <td>{comp.totalFinals}</td>
                                    <td className="w-cell">{comp.wins}</td>
                                    <td style={{ color: 'var(--gold)' }}>{comp.winRate}%</td>
                                    <td className="l-cell">{comp.losses}</td>
                                    <td>{comp.matchesCount}</td>
                                    <td>{comp.matchWins}</td>
                                    <td className="w-cell">{comp.gf}</td>
                                    <td className="l-cell">{comp.ga}</td>
                                    <td className="cs-cell" style={{ color: 'var(--gold)', fontWeight: 800 }}>{comp.cleanSheets}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="total-row-premium">
                                <td colSpan="2" style={{ textAlign: 'center' }}>TOTALS</td>
                                <td>{grandTotals.finals}</td>
                                <td className="w-cell">{grandTotals.wins}</td>
                                <td>{((grandTotals.wins / grandTotals.finals) * 100).toFixed(1)}%</td>
                                <td className="l-cell">{grandTotals.losses}</td>
                                <td>{grandTotals.mp}</td>
                                <td>{grandTotals.mw}</td>
                                <td className="w-cell">{grandTotals.gf}</td>
                                <td className="l-cell">{grandTotals.ga}</td>
                                <td className="cs-cell" style={{ color: 'var(--gold)', fontWeight: 800 }}>{grandTotals.cs}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
