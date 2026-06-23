"use client";

import { useMemo, useEffect } from "react";
import NoData_db from "../../lib/NoData_db";
import { EXPORT_EVENT } from "../ExcelExport/int_nt_excel_export";
import "../Matches/int_nt_matches.css";
import "./int_nt_continents.css";

function accumulateSide(stats, opponent, outcome, gf, ga) {
    if (!stats[opponent]) stats[opponent] = { opponent, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
    const row = stats[opponent];
    row.played++;
    row.gf += gf;
    row.ga += ga;
    const code = String(outcome ?? "").toUpperCase();
    if (code === "W") row.wins++;
    else if (code === "L") row.losses++;
    else if (code.startsWith("D")) row.draws++;
}

export default function IntNtContinents({ matches, countries }) {
    const countryRowMap = useMemo(() => {
        const map = new Map();
        (countries || []).forEach(c => {
            if (c.COUNTRY_NAME) map.set(c.COUNTRY_NAME.toLowerCase(), c);
            if (c.COUNTRY_NAME_EN) map.set(c.COUNTRY_NAME_EN.toLowerCase(), c);
        });
        return map;
    }, [countries]);

    const getTeamRegions = (teamName) => {
        if (!teamName) return [];
        const c = countryRowMap.get(String(teamName).toLowerCase());
        if (!c) return [];
        const regions = [];
        if (c.CONTINENT) regions.push(String(c.CONTINENT).toUpperCase());
        if (c.IS_ARAB) regions.push("دول عربية");
        return regions;
    };

    const tablesData = useMemo(() => {
        const baseRegions = ["أفريقيا", "اسيا", "دول عربية"];
        const results = {};
        
        baseRegions.forEach(base => {
            const stats = {};
            (matches || []).forEach(m => {
                const rA = getTeamRegions(m.TEAMA);
                const rB = getTeamRegions(m.TEAMB);
                
                const outcome = m.OUTCOME;
                const gf = parseInt(m.TEAMASCORE, 10) || 0;
                const ga = parseInt(m.TEAMBSCORE, 10) || 0;

                // If TEAMA is in baseRegion, accumulate stats vs all regions of TEAMB
                if (rA.includes(base)) {
                    rB.forEach(opp => {
                        accumulateSide(stats, opp, outcome, gf, ga);
                    });
                }
                
                // If TEAMB is in baseRegion, accumulate stats vs all regions of TEAMA (flipped outcome)
                if (rB.includes(base)) {
                    const flippedOutcome = outcome === "W" ? "L" : outcome === "L" ? "W" : outcome;
                    rA.forEach(opp => {
                        accumulateSide(stats, opp, flippedOutcome, ga, gf);
                    });
                }
            });

            results[base] = Object.values(stats)
                .map((row) => ({ ...row, gd: row.gf - row.ga, winRate: row.played ? Math.round((row.wins / row.played) * 100) : 0 }))
                .sort((a, b) => {
                    const wa = b.played - a.played;
                    if (wa !== 0) return wa;
                    return a.opponent.localeCompare(b.opponent, 'ar');
                });
        });
        
        return results;
    }, [matches, countryRowMap]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.detail?.activeTab !== "continents" || !e.detail?.claim) return;
            e.detail.claim();
            e.detail.done({ ok: false, message: "Exporting multiple region tables is not supported yet." });
        };
        window.addEventListener(EXPORT_EVENT, handler);
        return () => window.removeEventListener(EXPORT_EVENT, handler);
    }, []);

    const hasAnyData = Object.values(tablesData).some(arr => arr.length > 0);
    if (!hasAnyData) return <NoData_db message="NO CONTINENT DATA AVAILABLE" />;

    return (
        <div className="int-nt-continents fade-in">
            <div className="int-nt-page-header">
                <h1>COMPARISONS</h1>
            </div>
            
            {["أفريقيا", "اسيا", "دول عربية"].map(baseRegion => {
                const comparison = tablesData[baseRegion];
                if (!comparison || comparison.length === 0) return null;
                
                return (
                    <div key={baseRegion} style={{ marginBottom: "40px", background: "#fff", padding: "20px", borderRadius: "14px", border: "1px solid #eee", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
                        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", marginBottom: "20px", color: "var(--gold)" }}>
                            {baseRegion.toUpperCase()} <span style={{ color: "#888", fontSize: "24px" }}>VS OTHERS</span>
                        </h2>
                        <div className="int-nt-table-wrap" style={{ border: "none", boxShadow: "none", padding: 0 }}>
                            <table className="int-nt-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "center" }}>VS REGION</th>
                                        <th>P</th>
                                        <th>W</th>
                                        <th>D</th>
                                        <th>L</th>
                                        <th>GF</th>
                                        <th>GA</th>
                                        <th>GD</th>
                                        <th>WIN %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparison.map((row) => (
                                        <tr key={row.opponent}>
                                            <td style={{ textAlign: "center" }}><strong>{row.opponent}</strong></td>
                                            <td>{row.played}</td>
                                            <td>{row.wins}</td>
                                            <td>{row.draws}</td>
                                            <td>{row.losses}</td>
                                            <td>{row.gf}</td>
                                            <td>{row.ga}</td>
                                            <td dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                                            <td>{row.winRate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
