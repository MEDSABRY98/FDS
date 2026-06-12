"use client";

import { useMemo, useState, useEffect } from "react";
import DropDownList_db from "../lib/DropDownList_db";
import NoData_db from "../lib/NoData_db";
import { GitCompare, ShieldAlert, Award } from "lucide-react";
import { exportMatchesToExcel, exportSummaryToExcel } from "./egy_c_excel_export";
import "./egy_c_h2h.css";

export default function EgyptClubH2H({ matches }) {
    const [selectedEgy, setSelectedEgy] = useState("");
    const [selectedOpp, setSelectedOpp] = useState("");
    const [h2hTab, setH2hTab] = useState("dashboard"); // dashboard, matches, competitions, seasons
    const [dashboardContext, setDashboardContext] = useState("overall"); // overall, home, away, neutral
    const [currentPage, setCurrentPage] = useState(1);

    // Reset settings when selected teams change
    useEffect(() => {
        setCurrentPage(1);
        setH2hTab("dashboard");
        setDashboardContext("overall");
    }, [selectedEgy, selectedOpp]);

    // Get unique Egypt Teams and Opponent Teams (cross-filtered when one is selected)
    const egyptOptions = useMemo(() => {
        const filteredMatches = selectedOpp
            ? matches.filter(m => m["OPPONENT TEAM"] === selectedOpp)
            : matches;
        const unique = [...new Set(filteredMatches.map(m => m["EGYPT TEAM"]).filter(Boolean))].sort();
        return unique.map(name => ({ value: name, label: name }));
    }, [matches, selectedOpp]);

    const oppOptions = useMemo(() => {
        const filteredMatches = selectedEgy
            ? matches.filter(m => m["EGYPT TEAM"] === selectedEgy)
            : matches;
        const unique = [...new Set(filteredMatches.map(m => m["OPPONENT TEAM"]).filter(Boolean))].sort();
        return unique.map(name => ({ value: name, label: name }));
    }, [matches, selectedEgy]);

    // Filter matches for the selected pair
    const overallMatches = useMemo(() => {
        if (!selectedEgy || !selectedOpp) return [];
        return matches.filter(m =>
            m["EGYPT TEAM"] === selectedEgy && m["OPPONENT TEAM"] === selectedOpp
        );
    }, [selectedEgy, selectedOpp, matches]);

    const homeMatches = useMemo(() => overallMatches.filter(m => m["H-A-N"] === "H"), [overallMatches]);
    const awayMatches = useMemo(() => overallMatches.filter(m => m["H-A-N"] === "A"), [overallMatches]);
    const neutralMatches = useMemo(() => overallMatches.filter(m => m["H-A-N"] === "N"), [overallMatches]);

    // Calculate statistics helper
    const calculateStats = (filteredMatches) => {
        const total = filteredMatches.length;
        const egyWins = filteredMatches.filter(m => m["W-D-L"] === "W").length;
        const oppWins = filteredMatches.filter(m => m["W-D-L"] === "L").length;
        const draws = filteredMatches.filter(m => m["W-D-L"] && m["W-D-L"].startsWith("D")).length;

        const egyGoals = filteredMatches.reduce((sum, m) => sum + (Number(m.GF) || 0), 0);
        const oppGoals = filteredMatches.reduce((sum, m) => sum + (Number(m.GA) || 0), 0);

        const egyCS = filteredMatches.filter(m => m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH").length;
        const oppCS = filteredMatches.filter(m => m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH").length;

        return {
            total,
            egyWins,
            oppWins,
            draws,
            egyGoals,
            oppGoals,
            egyCS,
            oppCS
        };
    };

    const overallStats = useMemo(() => calculateStats(overallMatches), [overallMatches]);
    const homeStats = useMemo(() => calculateStats(homeMatches), [homeMatches]);
    const awayStats = useMemo(() => calculateStats(awayMatches), [awayMatches]);
    const neutralStats = useMemo(() => calculateStats(neutralMatches), [neutralMatches]);

    // Group by Competitions
    const competitionsData = useMemo(() => {
        if (!overallMatches.length) return [];
        const comps = {};
        overallMatches.forEach(m => {
            const comp = m.CHAMPION || "Other";
            if (!comps[comp]) {
                comps[comp] = { name: comp, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
            }
            const c = comps[comp];
            c.played++;
            if (m["W-D-L"] === "W") c.wins++;
            else if (m["W-D-L"] === "L") c.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) c.draws++;
            c.gf += (Number(m.GF) || 0);
            c.ga += (Number(m.GA) || 0);
            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") c.csf++;
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") c.csa++;
        });
        return Object.values(comps).sort((a, b) => b.played - a.played);
    }, [overallMatches]);

    // Group by Seasons
    const seasonsData = useMemo(() => {
        if (!overallMatches.length) return [];
        const seasons = {};
        overallMatches.forEach(m => {
            const season = m.SEASON || "Other";
            if (!seasons[season]) {
                seasons[season] = { name: season, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
            }
            const s = seasons[season];
            s.played++;
            if (m["W-D-L"] === "W") s.wins++;
            else if (m["W-D-L"] === "L") s.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) s.draws++;
            s.gf += (Number(m.GF) || 0);
            s.ga += (Number(m.GA) || 0);
            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") s.csf++;
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") s.csa++;
        });
        return Object.values(seasons).sort((a, b) => b.name.localeCompare(a.name));
    }, [overallMatches]);

    const competitionsTotals = useMemo(() => {
        const t = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
        competitionsData.forEach(comp => {
            t.played += comp.played;
            t.wins += comp.wins;
            t.draws += comp.draws;
            t.losses += comp.losses;
            t.gf += comp.gf;
            t.ga += comp.ga;
        });
        return t;
    }, [competitionsData]);

    const seasonsTotals = useMemo(() => {
        const t = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
        seasonsData.forEach(season => {
            t.played += season.played;
            t.wins += season.wins;
            t.draws += season.draws;
            t.losses += season.losses;
            t.gf += season.gf;
            t.ga += season.ga;
        });
        return t;
    }, [seasonsData]);

    // Contextual Excel Export
    useEffect(() => {
        const handleGlobalExport = () => {
            if (!selectedEgy || !selectedOpp || overallMatches.length === 0) return;
            if (h2hTab === 'dashboard') {
                let targetMatches = overallMatches;
                if (dashboardContext === 'home') targetMatches = homeMatches;
                else if (dashboardContext === 'away') targetMatches = awayMatches;
                else if (dashboardContext === 'neutral') targetMatches = neutralMatches;
                exportMatchesToExcel(targetMatches, `H2H_${selectedEgy}_vs_${selectedOpp}_${dashboardContext.toUpperCase()}`);
            } else if (h2hTab === 'matches') {
                exportMatchesToExcel(overallMatches, `H2H_${selectedEgy}_vs_${selectedOpp}_Matches`);
            } else if (h2hTab === 'competitions') {
                exportSummaryToExcel(competitionsData, `H2H_${selectedEgy}_vs_${selectedOpp}_Competitions`, "name", "COMPETITION");
            } else if (h2hTab === 'seasons') {
                exportSummaryToExcel(seasonsData, `H2H_${selectedEgy}_vs_${selectedOpp}_Seasons`, "name", "SEASON");
            }
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [overallMatches, selectedEgy, selectedOpp, h2hTab, dashboardContext, homeMatches, awayMatches, neutralMatches, competitionsData, seasonsData]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    return (
        <div className="tab-content" id="tab-h2h">
            <div className="h2h-wrap">
                <div className="header-tabs-container">
                    <div className="section-title">HEAD-TO-HEAD <span className="accent">COMPARISON</span></div>
                </div>
                <div className="gold-line" style={{ margin: '15px 0 30px' }}></div>

                {/* SELECTORS ROW */}
                <div className="h2h-selectors-row">
                    <div>
                        <div className="h2h-selector-title">SELECT EGYPTIAN CLUB</div>
                        <DropDownList_db
                            options={egyptOptions}
                            value={selectedEgy}
                            onChange={setSelectedEgy}
                            placeholder="Select Egypt Club..."
                            searchable={true}
                        />
                    </div>

                    <div className="h2h-vs-divider">VS</div>

                    <div>
                        <div className="h2h-selector-title">SELECT OPPONENT CLUB</div>
                        <DropDownList_db
                            options={oppOptions}
                            value={selectedOpp}
                            onChange={setSelectedOpp}
                            placeholder="Select Opponent..."
                            searchable={true}
                        />
                    </div>
                </div>

                {/* SUB-TABS NAVIGATION */}
                {selectedEgy && selectedOpp && overallMatches.length > 0 && (
                    <div className="h2h-subtabs-nav">
                        {[
                            { id: 'dashboard', label: 'DASHBOARD' },
                            { id: 'matches', label: 'MATCHES' },
                            { id: 'competitions', label: 'COMPETITIONS' },
                            { id: 'seasons', label: 'SEASONS' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setH2hTab(tab.id); setCurrentPage(1); }}
                                className={`h2h-subtab-btn ${h2hTab === tab.id ? 'active' : ''}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* COMPARISON RESULTS */}
                {!selectedEgy || !selectedOpp ? (
                    <div className="h2h-empty-state">
                        <GitCompare size={40} style={{ color: 'var(--gold, #c9a84c)', opacity: 0.5, marginBottom: '15px' }} />
                        <h3>SELECT TEAMS TO COMPARE</h3>
                        <p>Please choose an Egyptian club and an opponent from the dropdowns above.</p>
                    </div>
                ) : overallMatches.length === 0 ? (
                    <NoData_db message={`No historical matches found between "${selectedEgy}" and "${selectedOpp}" in this database.`} />
                ) : (
                    <div className="fade-in">
                        {/* TAB CONTENT: DASHBOARD */}
                        {h2hTab === "dashboard" && (
                            <div>
                                {/* Context Toggle buttons */}
                                <div className="h2h-context-toggle">
                                    {[
                                        { id: 'overall', label: 'OVERALL', count: overallMatches.length },
                                        { id: 'home', label: 'HOME', count: homeMatches.length },
                                        { id: 'away', label: 'AWAY', count: awayMatches.length },
                                        { id: 'neutral', label: 'NEUTRAL', count: neutralMatches.length }
                                    ].map(ctx => (
                                        <button
                                            key={ctx.id}
                                            onClick={() => setDashboardContext(ctx.id)}
                                            className={`context-btn ${dashboardContext === ctx.id ? 'active' : ''}`}
                                            disabled={ctx.count === 0}
                                        >
                                            {ctx.label} ({ctx.count})
                                        </button>
                                    ))}
                                </div>

                                {(() => {
                                    let currentStats = overallStats;
                                    if (dashboardContext === 'home') currentStats = homeStats;
                                    else if (dashboardContext === 'away') currentStats = awayStats;
                                    else if (dashboardContext === 'neutral') currentStats = neutralStats;

                                    return (
                                        <div className="h2h-stats-board">
                                            <div className="h2h-board-title">
                                                {dashboardContext.toUpperCase()} HEAD-TO-HEAD <span className="accent">BOARD</span>
                                            </div>

                                            <div className="h2h-stats-grid">
                                                {/* Egypt Club Wins */}
                                                <div className="h2h-stats-column">
                                                    <div className="team-name">{selectedEgy}</div>
                                                    
                                                    <div className="h2h-team-main-stat">
                                                        <div className="win-count egypt">{currentStats.egyWins}</div>
                                                        <div className="stat-label">Wins <span className="pct">({currentStats.total > 0 ? Math.round((currentStats.egyWins / currentStats.total) * 100) : 0}%)</span></div>
                                                    </div>

                                                    <div className="h2h-team-sub-stats">
                                                        <div className="sub-stat-card">
                                                            <span className="label">Goals</span>
                                                            <span className="value">{currentStats.egyGoals}</span>
                                                            <span className="subtext">Avg: {currentStats.total > 0 ? (currentStats.egyGoals / currentStats.total).toFixed(2) : "0.00"}</span>
                                                        </div>
                                                        <div className="sub-stat-card">
                                                            <span className="label">Clean Sheets</span>
                                                            <span className="value">{currentStats.egyCS}</span>
                                                            <span className="subtext">{currentStats.total > 0 ? Math.round((currentStats.egyCS / currentStats.total) * 100) : 0}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Draws / Center Column */}
                                                <div className="h2h-draws-column">
                                                    <div className="h2h-matches-card">
                                                        <div className="matches-count">{currentStats.total}</div>
                                                        <div className="matches-label">Matches</div>
                                                    </div>
                                                    <div className="h2h-draws-card">
                                                        <div className="draws-count">{currentStats.draws}</div>
                                                        <div className="draws-label">Draws <span className="pct">({currentStats.total > 0 ? Math.round((currentStats.draws / currentStats.total) * 100) : 0}%)</span></div>
                                                    </div>
                                                </div>

                                                {/* Opponent Wins */}
                                                <div className="h2h-stats-column">
                                                    <div className="team-name">{selectedOpp}</div>
                                                    
                                                    <div className="h2h-team-main-stat">
                                                        <div className="win-count opponent">{currentStats.oppWins}</div>
                                                        <div className="stat-label">Wins <span className="pct">({currentStats.total > 0 ? Math.round((currentStats.oppWins / currentStats.total) * 100) : 0}%)</span></div>
                                                    </div>

                                                    <div className="h2h-team-sub-stats">
                                                        <div className="sub-stat-card">
                                                            <span className="label">Goals</span>
                                                            <span className="value">{currentStats.oppGoals}</span>
                                                            <span className="subtext">Avg: {currentStats.total > 0 ? (currentStats.oppGoals / currentStats.total).toFixed(2) : "0.00"}</span>
                                                        </div>
                                                        <div className="sub-stat-card">
                                                            <span className="label">Clean Sheets</span>
                                                            <span className="value">{currentStats.oppCS}</span>
                                                            <span className="subtext">{currentStats.total > 0 ? Math.round((currentStats.oppCS / currentStats.total) * 100) : 0}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* TAB CONTENT: MATCHES */}
                        {h2hTab === "matches" && (
                            <div className="h2h-history-log">
                                <div className="history-title">
                                    <GitCompare size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> Match History ({overallMatches.length} Matches)
                                </div>
                                {(() => {
                                    const pageSize = 50;
                                    const paginatedMatches = overallMatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                                    const totalPages = Math.ceil(overallMatches.length / pageSize);
                                    return (
                                        <div>
                                            <table className="h2h-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '12%' }}>DATE</th>
                                                        <th style={{ width: '34%' }}>SEASON</th>
                                                        <th style={{ width: '10%' }}>ROUND</th>
                                                        <th style={{ width: '12%' }}>SCORE</th>
                                                        <th style={{ width: '10%' }}>H-A-N</th>
                                                        <th style={{ width: '12%' }}>RESULT (EGY)</th>
                                                        <th style={{ width: '10%' }}>NOTE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedMatches.map((m, i) => (
                                                        <tr key={i}>
                                                            <td style={{ color: '#666', fontFamily: 'Space Mono, monospace' }}>{formatDate(m.DATE)}</td>
                                                            <td style={{ fontWeight: '600' }}>{m.SEASON}</td>
                                                            <td style={{ color: '#666' }}>{m.ROUND}</td>
                                                            <td style={{ fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}>
                                                                {m.GF} - {m.GA} {m.PEN ? `(${m.PEN})` : ""}
                                                            </td>
                                                            <td style={{ fontFamily: 'Space Mono, monospace' }}>{m["H-A-N"]}</td>
                                                            <td style={{
                                                                fontWeight: 'bold',
                                                                color: m["W-D-L"] === 'W' ? '#00c853' : (m["W-D-L"] === 'L' ? '#ff4d4d' : 'var(--gold, #c9a84c)')
                                                            }}>
                                                                {m["W-D-L"]}
                                                            </td>
                                                            <td style={{ color: '#888', fontSize: '11px' }}>{m["W-L Q & F"] ? m["W-L Q & F"] : (m.NOTE ? m.NOTE : "")}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {/* Pagination Controls */}
                                            {totalPages > 1 && (
                                                <div className="pagination-container">
                                                    <button
                                                        disabled={currentPage === 1}
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        className="page-btn"
                                                    >
                                                        ← PREV
                                                    </button>
                                                    <div className="page-info">
                                                        PAGE {currentPage} OF {totalPages}
                                                    </div>
                                                    <button
                                                        disabled={currentPage === totalPages}
                                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                        className="page-btn"
                                                    >
                                                        NEXT →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* TAB CONTENT: COMPETITIONS */}
                        {h2hTab === "competitions" && (
                            <div className="h2h-history-log">
                                <div className="history-title">
                                    <Award size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> Competition Breakdown
                                </div>
                                <table className="h2h-table">
                                    <thead>
                                        <tr>
                                            <th>COMPETITION</th>
                                            <th>PLAYED</th>
                                            <th style={{ color: '#00c853' }}>EGY WON</th>
                                            <th style={{ color: 'var(--gold, #c9a84c)' }}>DRAW</th>
                                            <th style={{ color: '#ff4d4d' }}>OPP WON</th>
                                            <th>GF</th>
                                            <th>GA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {competitionsData.map((comp, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>🏆 {comp.name}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{comp.played}</td>
                                                <td style={{ color: '#00c853', fontWeight: '600', fontFamily: 'Space Mono, monospace' }}>{comp.wins}</td>
                                                <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{comp.draws}</td>
                                                <td style={{ color: '#ff4d4d', fontWeight: '600', fontFamily: 'Space Mono, monospace' }}>{comp.losses}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{comp.gf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{comp.ga}</td>
                                            </tr>
                                        ))}
                                        {competitionsData.length > 0 && (
                                            <tr style={{ background: '#f9f9f9', borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>
                                                <td style={{ fontWeight: 'bold' }}>GRAND TOTAL</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{competitionsTotals.played}</td>
                                                <td style={{ color: '#00c853', fontFamily: 'Space Mono, monospace' }}>{competitionsTotals.wins}</td>
                                                <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{competitionsTotals.draws}</td>
                                                <td style={{ color: '#ff4d4d', fontFamily: 'Space Mono, monospace' }}>{competitionsTotals.losses}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{competitionsTotals.gf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{competitionsTotals.ga}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAB CONTENT: SEASONS */}
                        {h2hTab === "seasons" && (
                            <div className="h2h-history-log">
                                <div className="history-title">
                                    <Award size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> Season Breakdown
                                </div>
                                <table className="h2h-table">
                                    <thead>
                                        <tr>
                                            <th>SEASON</th>
                                            <th>PLAYED</th>
                                            <th style={{ color: '#00c853' }}>EGY WON</th>
                                            <th style={{ color: 'var(--gold, #c9a84c)' }}>DRAW</th>
                                            <th style={{ color: '#ff4d4d' }}>OPP WON</th>
                                            <th>GF</th>
                                            <th>GA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {seasonsData.map((season, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>📅 {season.name}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{season.played}</td>
                                                <td style={{ color: '#00c853', fontWeight: '600', fontFamily: 'Space Mono, monospace' }}>{season.wins}</td>
                                                <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{season.draws}</td>
                                                <td style={{ color: '#ff4d4d', fontWeight: '600', fontFamily: 'Space Mono, monospace' }}>{season.losses}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{season.gf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{season.ga}</td>
                                            </tr>
                                        ))}
                                        {seasonsData.length > 0 && (
                                            <tr style={{ background: '#f9f9f9', borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>
                                                <td style={{ fontWeight: 'bold' }}>GRAND TOTAL</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{seasonsTotals.played}</td>
                                                <td style={{ color: '#00c853', fontFamily: 'Space Mono, monospace' }}>{seasonsTotals.wins}</td>
                                                <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{seasonsTotals.draws}</td>
                                                <td style={{ color: '#ff4d4d', fontFamily: 'Space Mono, monospace' }}>{seasonsTotals.losses}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{seasonsTotals.gf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{seasonsTotals.ga}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
