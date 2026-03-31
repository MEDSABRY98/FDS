"use client";

import { useMemo, useState, useEffect } from "react";
import "./alahly_db_h2h.css";
import { AlAhlyService } from "./alahly_db_service";

/**
 * Head-to-Head (H2H) Tab Component
 * Displays Al Ahly's record against all opponents.
 */
export default function AlAhlyH2H({ matches }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'matches', direction: 'desc' });

    // Aggregate Stats from Matches
    const h2hStats = useMemo(() => {
        const statsMap = {};

        (matches || []).forEach(match => {
            const oppName = String(match["OPPONENT TEAM"] || "").trim();
            if (!oppName || oppName.toLowerCase() === "unknown") return;

            if (!statsMap[oppName]) {
                statsMap[oppName] = {
                    opponent: oppName,
                    matches: 0,
                    wins: 0,
                    pDraws: 0,
                    nDraws: 0,
                    losses: 0,
                    gf: 0,
                    ga: 0,
                    gd: 0,
                    csFor: 0,
                    csAgainst: 0,
                    winRate: 0,
                    ppg: 0
                };
            }

            const gf = Number(match.GF) || 0;
            const ga = Number(match.GA) || 0;
            const wdl = String(match["W-D-L"] || "").toUpperCase();

            statsMap[oppName].matches += 1;
            statsMap[oppName].gf += gf;
            statsMap[oppName].ga += ga;

            if (wdl.includes('W')) {
                statsMap[oppName].wins += 1;
            } else if (wdl.includes('D')) {
                if (gf > 0 || ga > 0) {
                    statsMap[oppName].pDraws += 1;
                } else {
                    statsMap[oppName].nDraws += 1;
                }
            } else if (wdl.includes('L')) {
                statsMap[oppName].losses += 1;
            }

            if (ga === 0) statsMap[oppName].csFor += 1;
            if (gf === 0) statsMap[oppName].csAgainst += 1;

            // Clean Sheets Calculation
            if (ga === 0) statsMap[oppName].csFor += 1;
            if (gf === 0) statsMap[oppName].csAgainst += 1;
        });

        // Calculate Derived Stats
        const statsList = Object.values(statsMap).map(s => {
            const gd = s.gf - s.ga;
            const winRate = s.matches > 0 ? (s.wins / s.matches) * 100 : 0;
            const points = (s.wins * 3) + s.pDraws + s.nDraws;
            const ppg = s.matches > 0 ? points / s.matches : 0;

            return { ...s, gd, winRate, ppg };
        });

        return statsList;
    }, [matches]);

    // Filter by Search Term
    const filteredStats = useMemo(() => {
        let result = h2hStats.filter(s =>
            s.opponent.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [h2hStats, searchTerm, sortConfig]);

    // Calculate Totals
    const totals = useMemo(() => {
        return filteredStats.reduce((acc, curr) => ({
            matches: acc.matches + curr.matches,
            wins: acc.wins + curr.wins,
            pDraws: acc.pDraws + curr.pDraws,
            nDraws: acc.nDraws + curr.nDraws,
            losses: acc.losses + curr.losses,
            gf: acc.gf + curr.gf,
            ga: acc.ga + curr.ga,
            gd: acc.gd + curr.gd,
            csFor: acc.csFor + curr.csFor,
            csAgainst: acc.csAgainst + curr.csAgainst
        }), { matches: 0, wins: 0, pDraws: 0, nDraws: 0, losses: 0, gf: 0, ga: 0, gd: 0, csFor: 0, csAgainst: 0 });
    }, [filteredStats]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // Excel Export
    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [filteredStats]);

    const handleExport = () => {
        const exportData = filteredStats.map((s, i) => ({
            "#": i + 1,
            "OPPONENT": s.opponent,
            "PLAYED": s.matches,
            "WINS": s.wins,
            "D(+)": s.pDraws,
            "D(-)": s.nDraws,
            "LOSSES": s.losses,
            "GF": s.gf,
            "GA": s.ga,
            "GD": s.gd,
            "CS FOR": s.csFor,
            "CS AGAINST": s.csAgainst,
            "PPG": s.ppg.toFixed(2)
        }));
        AlAhlyService.exportToExcel(exportData, "AlAhly_H2H_Summary");
    };

    return (
        <div className="tab-content" id="tab-h2h">
            <div className="h2h-premium-wrap" style={{ maxWidth: '1400px' }}>
                <div className="header-tabs-container">
                    <div className="section-title">AL AHLY <span className="accent">HEAD TO HEAD</span></div>
                </div>
                <div className="gold-line"></div>

                <div className="h2h-controls">
                    <div className="search-wrap-premium">
                        <input
                            type="text"
                            placeholder="Find an opponent..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h2h-search-input"
                        />
                    </div>
                </div>

                <div className="table-container-premium">
                    <table className="modern-h2h-table fade-in">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>#</th>
                                <th className="team-name-cell" onClick={() => handleSort('opponent')} style={{ cursor: 'pointer' }}>
                                    OPPONENT {sortConfig.key === 'opponent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('matches')} style={{ cursor: 'pointer' }}>
                                    P {sortConfig.key === 'matches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('wins')} style={{ cursor: 'pointer' }}>
                                    W {sortConfig.key === 'wins' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('pDraws')} style={{ cursor: 'pointer' }}>
                                    D (+) {sortConfig.key === 'pDraws' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('nDraws')} style={{ cursor: 'pointer' }}>
                                    D (-) {sortConfig.key === 'nDraws' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('losses')} style={{ cursor: 'pointer' }}>
                                    L {sortConfig.key === 'losses' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('gf')} style={{ cursor: 'pointer' }}>
                                    GF {sortConfig.key === 'gf' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('ga')} style={{ cursor: 'pointer' }}>
                                    GA {sortConfig.key === 'ga' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('gd')} style={{ cursor: 'pointer' }}>
                                    GD {sortConfig.key === 'gd' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('csFor')} style={{ cursor: 'pointer' }}>
                                    CS FOR {sortConfig.key === 'csFor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('csAgainst')} style={{ cursor: 'pointer' }}>
                                    CS AG {sortConfig.key === 'csAgainst' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStats.length === 0 ? (
                                <tr><td colSpan="12" style={{ padding: '100px', opacity: 0.4 }}>No H2H records found.</td></tr>
                            ) : (
                                filteredStats.map((s, i) => (
                                    <tr key={s.opponent}>
                                        <td><span className={`rank-badge-premium ${i < 3 ? 'rank-gold' : ''}`}>{i + 1}</span></td>
                                        <td className="team-name-cell">{s.opponent}</td>
                                        <td>{s.matches}</td>
                                        <td className="win-text">{s.wins}</td>
                                        <td className="draw-text">{s.pDraws}</td>
                                        <td className="draw-text" style={{ opacity: 0.7 }}>{s.nDraws}</td>
                                        <td className="loss-text">{s.losses}</td>
                                        <td className="gf-text">{s.gf}</td>
                                        <td className="ga-text">{s.ga}</td>
                                        <td className="gd-text" style={{ color: s.gd >= 0 ? '#2ecc71' : '#e74c3c' }}>{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                                        <td style={{ color: '#2ecc71', fontWeight: 800 }}>{s.csFor}</td>
                                        <td style={{ color: '#e74c3c', fontWeight: 800 }}>{s.csAgainst}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {filteredStats.length > 0 && (
                            <tfoot className="total-row-premium">
                                <tr className="total-row-premium">
                                    <td colSpan="2" style={{ textAlign: 'center' }}>TOTAL</td>
                                    <td style={{ color: 'var(--gold)' }}>{totals.matches}</td>
                                    <td className="win-text">{totals.wins}</td>
                                    <td className="draw-text">{totals.pDraws}</td>
                                    <td className="draw-text" style={{ opacity: 0.7 }}>{totals.nDraws}</td>
                                    <td className="loss-text">{totals.losses}</td>
                                    <td className="gf-text">{totals.gf}</td>
                                    <td className="ga-text">{totals.ga}</td>
                                    <td className="gd-text" style={{ color: totals.gd >= 0 ? '#2ecc71' : '#e74c3c' }}>{totals.gd > 0 ? `+${totals.gd}` : totals.gd}</td>
                                    <td style={{ color: '#2ecc71' }}>{totals.csFor}</td>
                                    <td style={{ color: '#e74c3c' }}>{totals.csAgainst}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
