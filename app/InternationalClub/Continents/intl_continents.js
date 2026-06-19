"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../../lib/NoData_db";
import { exportIntlContinentComparisonToExcel, EXPORT_EVENT } from "../ExcelExport/intl_excel_export";
import "../Matches/intl_matches.css";
import "./intl_continents.css";

function normalizeContinent(value) {
    return String(value ?? "").trim();
}

function accumulateSide(stats, opponent, wdl, gf, ga) {
    if (!stats[opponent]) {
        stats[opponent] = { opponent, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
    }
    const row = stats[opponent];
    row.played++;
    row.gf += gf;
    row.ga += ga;

    const outcome = String(wdl ?? "").toUpperCase();
    if (outcome === "W") row.wins++;
    else if (outcome === "L") row.losses++;
    else if (outcome.startsWith("D")) row.draws++;
}

function buildContinentComparison(matches, continent) {
    const stats = {};

    (matches || []).forEach((m) => {
        const contA = normalizeContinent(m["TEAM A CONTINENT"]);
        const contB = normalizeContinent(m["TEAM B CONTINENT"]);
        const wdl = m["W-D-L"];
        const gf = Number(m.GF) || 0;
        const ga = Number(m.GA) || 0;

        if (contA === continent && contB) {
            accumulateSide(stats, contB, wdl, gf, ga);
        } else if (contB === continent && contA) {
            const flippedWdl = wdl === "W" ? "L" : wdl === "L" ? "W" : wdl;
            accumulateSide(stats, contA, flippedWdl, ga, gf);
        }
    });

    return Object.values(stats)
        .map((row) => ({
            ...row,
            gd: row.gf - row.ga,
            winRate: row.played ? Math.round((row.wins / row.played) * 100) : 0,
        }))
        .sort((a, b) => b.played - a.played || b.wins - a.wins);
}

export default function IntlClubContinents({ matches }) {
    const [selectedContinent, setSelectedContinent] = useState(null);

    const continents = useMemo(() => {
        const map = {};
        (matches || []).forEach((m) => {
            [m["TEAM A CONTINENT"], m["TEAM B CONTINENT"]].forEach((cont) => {
                const name = normalizeContinent(cont);
                if (!name) return;
                if (!map[name]) map[name] = { name, appearances: 0 };
                map[name].appearances++;
            });
        });
        return Object.values(map).sort((a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name));
    }, [matches]);

    const comparison = useMemo(() => {
        if (!selectedContinent) return [];
        return buildContinentComparison(matches, selectedContinent);
    }, [matches, selectedContinent]);

    const continentTotals = useMemo(() => {
        if (!selectedContinent) return null;
        return comparison.reduce(
            (acc, row) => {
                acc.played += row.played;
                acc.wins += row.wins;
                acc.draws += row.draws;
                acc.losses += row.losses;
                acc.gf += row.gf;
                acc.ga += row.ga;
                return acc;
            },
            { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }
        );
    }, [comparison, selectedContinent]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.detail?.activeTab !== "continents" || !selectedContinent || !e.detail?.claim) return;
            e.detail.claim();
            const ok = await exportIntlContinentComparisonToExcel(e.detail.matches, selectedContinent);
            e.detail.done({ ok });
        };
        window.addEventListener(EXPORT_EVENT, handler);
        return () => window.removeEventListener(EXPORT_EVENT, handler);
    }, [selectedContinent]);

    if (!continents.length) return <NoData_db message="NO CONTINENT DATA" />;

    if (selectedContinent) {
        return (
            <div className="intl-continents">
                <button type="button" className="intl-continents-back" onClick={() => setSelectedContinent(null)}>
                    ← Back to Continents
                </button>
                <h1>{selectedContinent}</h1>

                {continentTotals && (
                    <div className="intl-continents-totals">
                        <span>{continentTotals.played} P</span>
                        <span>{continentTotals.wins} W</span>
                        <span>{continentTotals.draws} D</span>
                        <span>{continentTotals.losses} L</span>
                        <span>{continentTotals.gf} GF</span>
                        <span>{continentTotals.ga} GA</span>
                    </div>
                )}

                {comparison.length === 0 ? (
                    <NoData_db message="NO CROSS-CONTINENT MATCHES FOUND" />
                ) : (
                    <div className="intl-table-wrap">
                        <table className="intl-table">
                            <thead>
                                <tr>
                                    <th>VS CONTINENT</th>
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
                                        <td><strong>{row.opponent}</strong></td>
                                        <td>{row.played}</td>
                                        <td>{row.wins}</td>
                                        <td>{row.draws}</td>
                                        <td>{row.losses}</td>
                                        <td>{row.gf}</td>
                                        <td>{row.ga}</td>
                                        <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                                        <td>{row.winRate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="intl-continents">
            <h1>CONTINENTS</h1>
            <div className="intl-continent-grid">
                {continents.map((c) => (
                    <button
                        key={c.name}
                        type="button"
                        className="intl-continent-card"
                        onClick={() => setSelectedContinent(c.name)}
                    >
                        <strong>{c.name}</strong>
                        <span>{c.appearances} team appearances</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
