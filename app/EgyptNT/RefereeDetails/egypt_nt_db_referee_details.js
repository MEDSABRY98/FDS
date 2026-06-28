"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../../lib/NoData_db";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import "../../Alahly/PlayerDetails/alahly_db_player_details.css";
import "../Referees/egypt_nt_db_referees.css";

function parseSeasonParts(season) {
    const raw = String(season || "").trim();
    if (!raw) return { text: "", number: 0, raw };

    const numberMatch = raw.match(/\d+/);
    const number = numberMatch ? parseInt(numberMatch[0], 10) : 0;
    const text = raw
        .replace(/\d+/g, " ")
        .replace(/[/\-–—|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    return { text, number, raw };
}

function compareSeasonLabels(a, b) {
    const partA = parseSeasonParts(a);
    const partB = parseSeasonParts(b);

    const textCmp = partA.text.localeCompare(partB.text, undefined, { sensitivity: "base" });
    if (textCmp !== 0) return textCmp;

    if (partB.number !== partA.number) return partB.number - partA.number;

    return partB.raw.localeCompare(partA.raw, undefined, { numeric: true });
}

function Referee_Overview_Module({ stats }) {
    return (
        <div className="stats-grid-premium fade-in">
            <div className="stat-card-premium">
                <span className="stat-label-modern">Matches Refereed</span>
                <div className="stat-value-modern" style={{ color: 'var(--gold)' }}>{stats.matches}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Egypt Wins</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.wins}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Draws</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{stats.draws}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Egypt Losses</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.losses}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Egypt Goals For</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.gs}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Egypt Goals Against</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.ga}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheets For</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.csFor}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheets Against</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.csAgainst}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Awarded For</span>
                <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.penFor}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Awarded Against</span>
                <div className="stat-value-modern" style={{ color: '#9b59b6' }}>{stats.penAgainst}</div>
            </div>
        </div>
    );
}

function Referee_Matches_Module({ stats }) {
    return (
        <div style={{ overflowX: 'auto' }} className="fade-in">
            <table className="player-match-table ref-matches-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>MATCH ID</th>
                        <th>DATE</th>
                        <th className="ref-season-col">SEASON</th>
                        <th>OPPONENT TEAM</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>RESULT</th>
                        <th>PEN (F)</th>
                        <th>PEN (A)</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.matchHistory.map((m, idx) => (
                        <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{m.idx}</td>
                            <td>{m.date}</td>
                            <td className="ref-season-col">{m.season}</td>
                            <td style={{ fontWeight: '800' }}>{m.opponent}</td>
                            <td>{m.gf}</td>
                            <td>{m.ga}</td>
                            <td>
                                <span className={`m-role-pill ${m.wdl === 'W' ? 'role-starter' : m.wdl === 'L' ? 'role-sub' : ''}`} style={{ fontSize: '11px', fontWeight: '800' }}>
                                    {m.wdl}
                                </span>
                            </td>
                            <td style={{ color: '#2980b9', fontWeight: '800' }}>{m.penFor}</td>
                            <td style={{ color: '#9b59b6', fontWeight: '800' }}>{m.penAgainst}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Referee_Championships_Module({ stats }) {
    const list = Object.keys(stats.compStats).map(c => ({ name: c, ...stats.compStats[c] })).sort((a, b) => b.matches - a.matches);
    return (
        <table className="player-match-table fade-in">
            <thead>
                <tr>
                    <th>CHAMPIONSHIP</th>
                    <th>MP</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>CS (F)</th>
                    <th>PEN (F)</th>
                    <th>PEN (A)</th>
                </tr>
            </thead>
            <tbody>
                {list.map(c => (
                    <tr key={c.name}>
                        <td style={{ fontWeight: '800', color: 'var(--gold)' }}>{c.name}</td>
                        <td>{c.matches}</td>
                        <td style={{ color: '#27ae60' }}>{c.wins}</td>
                        <td>{c.draws}</td>
                        <td style={{ color: '#e74c3c' }}>{c.losses}</td>
                        <td>{c.gs}</td>
                        <td>{c.ga}</td>
                        <td>{c.csFor}</td>
                        <td style={{ color: '#2980b9' }}>{c.penFor}</td>
                        <td style={{ color: '#9b59b6' }}>{c.penAgainst}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Referee_Seasons_Module({ stats }) {
    const list = Object.keys(stats.seasonalStats).map(season => ({ key: season, ...stats.seasonalStats[season] }));
    list.sort((a, b) => compareSeasonLabels(a.key, b.key));
    return (
        <table className="player-match-table fade-in">
            <thead>
                <tr>
                    <th>SEASON</th>
                    <th>MP</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>CS (F)</th>
                    <th>PEN (F)</th>
                    <th>PEN (A)</th>
                </tr>
            </thead>
            <tbody>
                {list.map(s => (
                    <tr key={s.key}>
                        <td style={{ fontWeight: '800', color: 'var(--gold)' }}>{s.key}</td>
                        <td>{s.matches}</td>
                        <td style={{ color: '#27ae60' }}>{s.wins}</td>
                        <td>{s.draws}</td>
                        <td style={{ color: '#e74c3c' }}>{s.losses}</td>
                        <td>{s.gs}</td>
                        <td>{s.ga}</td>
                        <td>{s.csFor}</td>
                        <td style={{ color: '#2980b9' }}>{s.penFor}</td>
                        <td style={{ color: '#9b59b6' }}>{s.penAgainst}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Referee_VsTeams_Module({ stats }) {
    const list = Object.keys(stats.statsByOpponent).map(opp => ({ name: opp, ...stats.statsByOpponent[opp] })).sort((a, b) => b.matches - a.matches);
    return (
        <table className="player-match-table fade-in">
            <thead>
                <tr>
                    <th>OPPONENT TEAM</th>
                    <th>MP</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>CS (F)</th>
                    <th>PEN (F)</th>
                    <th>PEN (A)</th>
                </tr>
            </thead>
            <tbody>
                {list.map(t => (
                    <tr key={t.name}>
                        <td style={{ fontWeight: '800', color: 'var(--gold)' }}>{t.name}</td>
                        <td>{t.matches}</td>
                        <td style={{ color: '#27ae60' }}>{t.wins}</td>
                        <td>{t.draws}</td>
                        <td style={{ color: '#e74c3c' }}>{t.losses}</td>
                        <td>{t.gs}</td>
                        <td>{t.ga}</td>
                        <td>{t.csFor}</td>
                        <td style={{ color: '#2980b9' }}>{t.penFor}</td>
                        <td style={{ color: '#9b59b6' }}>{t.penAgainst}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function EgyptNTRefereeDetails({ refereeName, masterMatches, playerDetails, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { window.scrollTo(0, 0); }, [activeTab]);

    const { stats } = useMemo(() => {
        const summary = {
            matches: 0, wins: 0, draws: 0, losses: 0,
            drawsPos: 0, drawsNeg: 0,
            gs: 0, ga: 0, csFor: 0, csAgainst: 0,
            penFor: 0, penAgainst: 0,
            matchHistory: [], seasonalStats: {}, compStats: {},
            statsByOpponent: {}
        };

        if (!refereeName || !masterMatches) return { stats: summary };

        const isEgyptTeam = (t) => {
            if (!t) return false;
            const s = String(t).trim();
            return s === "مصر" || s === "Egypt" || s === "منتخب مصر" || s === "المنتخب المصري";
        };

        const allRefMatches = masterMatches.filter(m => String(m.REFREE || "").trim() === refereeName);

        allRefMatches.forEach(m => {
            summary.matches += 1;
            const gf = parseInt(m["GF"]) || 0;
            const ga = parseInt(m["GA"]) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            const champion = String(m.CHAMPION || "Unknown").trim();
            const season = String(m.SEASON || "Unknown").trim();
            const opp = String(m["OPPONENT TEAM"] || "—").trim();
            const matchId = String(m.MATCH_ID);

            summary.gs += gf;
            summary.ga += ga;

            let result = 'D';
            if (wdl === "W") { summary.wins += 1; result = 'W'; }
            else if (wdl === "L") { summary.losses += 1; result = 'L'; }
            else {
                summary.draws += 1;
                if (gf > 0 || ga > 0) summary.drawsPos += 1;
                else summary.drawsNeg += 1;
            }

            if (ga === 0) summary.csFor += 1;
            if (gf === 0) summary.csAgainst += 1;

            const matchEvents = (playerDetails || []).filter(p =>
                String(p.MATCH_ID) === matchId &&
                (String(p.TYPE).toUpperCase() === 'PENGOAL' || String(p.TYPE_SUB).toUpperCase() === 'PENGOAL')
            );
            const penForEgypt = matchEvents.filter(p => {
                const t = String(p.TEAM || "");
                return isEgyptTeam(t);
            }).length;
            const penAgainstEgypt = matchEvents.length - penForEgypt;

            summary.penFor += penForEgypt;
            summary.penAgainst += penAgainstEgypt;

            summary.matchHistory.push({
                idx: m.MATCH_ID,
                date: m.DATE,
                season,
                opponent: opp,
                gf, ga, wdl: result,
                penFor: penForEgypt,
                penAgainst: penAgainstEgypt
            });

            if (!summary.compStats[champion]) summary.compStats[champion] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 };
            const comp = summary.compStats[champion];
            comp.matches += 1; comp.gs += gf; comp.ga += ga;
            if (result === 'W') comp.wins += 1; else if (result === 'L') comp.losses += 1; else comp.draws += 1;
            if (ga === 0) comp.csFor += 1;
            if (gf === 0) comp.csAgainst += 1;
            comp.penFor += penForEgypt; comp.penAgainst += penAgainstEgypt;

            if (!summary.seasonalStats[season]) summary.seasonalStats[season] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 };
            const ss = summary.seasonalStats[season];
            ss.matches += 1; ss.gs += gf; ss.ga += ga;
            if (result === 'W') ss.wins += 1; else if (result === 'L') ss.losses += 1; else ss.draws += 1;
            if (ga === 0) ss.csFor += 1;
            if (gf === 0) ss.csAgainst += 1;
            ss.penFor += penForEgypt; ss.penAgainst += penAgainstEgypt;

            if (!summary.statsByOpponent[opp]) summary.statsByOpponent[opp] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 };
            const oppStats = summary.statsByOpponent[opp];
            oppStats.matches += 1; oppStats.gs += gf; oppStats.ga += ga;
            if (result === 'W') oppStats.wins += 1; else if (result === 'L') oppStats.losses += 1; else oppStats.draws += 1;
            if (ga === 0) oppStats.csFor += 1;
            if (gf === 0) oppStats.csAgainst += 1;
            oppStats.penFor += penForEgypt; oppStats.penAgainst += penAgainstEgypt;
        });

        summary.matchHistory.sort((a, b) => {
            const da = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
            const db = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
            return db - da;
        });

        return { stats: summary };
    }, [refereeName, masterMatches, playerDetails]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = () => {
        let exportData = [];
        let filename = `EgyptNT_Referee_${refereeName}_${activeTab}`;
        switch (activeTab) {
            case 'overview':
                exportData = [{ "METRIC": "Matches", "VALUE": stats.matches }, { "METRIC": "Wins", "VALUE": stats.wins }, { "METRIC": "Draws", "VALUE": stats.draws }, { "METRIC": "Losses", "VALUE": stats.losses }, { "METRIC": "GF", "VALUE": stats.gs }, { "METRIC": "GA", "VALUE": stats.ga }];
                break;
            case 'matches':
                exportData = stats.matchHistory.map((m, i) => ({
                    "#": i + 1, "DATE": m.date, "SEASON": m.season, "OPPONENT": m.opponent, "WDL": m.wdl, "GF": m.gf, "GA": m.ga, "PEN-F": m.penFor, "PEN-A": m.penAgainst
                }));
                break;
            case 'championships':
                exportData = Object.keys(stats.compStats).map((c, i) => {
                    const s = stats.compStats[c];
                    return { "#": i + 1, "CHAMPION": c, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga, "CS-F": s.csFor, "PEN-F": s.penFor };
                });
                break;
            case 'seasons':
                exportData = Object.keys(stats.seasonalStats).sort(compareSeasonLabels).map((season, i) => {
                    const s = stats.seasonalStats[season];
                    return { "#": i + 1, "SEASON": season, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga, "CS-F": s.csFor, "PEN-F": s.penFor, "PEN-A": s.penAgainst };
                });
                break;
            case 'vs_teams':
                exportData = Object.keys(stats.statsByOpponent).sort((a, b) => stats.statsByOpponent[b].matches - stats.statsByOpponent[a].matches).map((opp, i) => {
                    const s = stats.statsByOpponent[opp];
                    return { "#": i + 1, "OPPONENT": opp, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga };
                });
                break;
        }
        if (exportData.length > 0) EgyptNTExcelExport.exportToExcel(exportData, filename);
    };

    return (
        <div className="player-details-container fade-in">
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}><span>←</span> All Referees</button>
                    <h1 className="player-main-name">
                        {refereeName.split(' ').slice(0, -1).join(' ')} <span>{refereeName.split(' ').slice(-1)}</span>
                    </h1>
                </div>
                <div className="hero-stats-quick" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div className="quick-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'Space Mono', letterSpacing: '2px' }}>MATCHES</div>
                        <div style={{ color: 'var(--gold)', fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '2px' }}>{stats.matches}</div>
                    </div>
                </div>
            </div>

            <div className="player-details-tabs ref-details-tabs">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'matches', label: 'Matches' },
                    { id: 'championships', label: 'Championships' },
                    { id: 'seasons', label: 'Seasons' },
                    { id: 'vs_teams', label: 'Vs Teams' }
                ].map(t => (
                    <div key={t.id} className={`player-tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                        <span className="tab-title">{t.label.toUpperCase()}</span>
                    </div>
                ))}
            </div>

            <div className="details-tab-content" style={{ marginTop: '30px' }}>
                {activeTab === 'overview' && <Referee_Overview_Module stats={stats} />}
                {activeTab === 'matches' && <Referee_Matches_Module stats={stats} />}
                {activeTab === 'championships' && <Referee_Championships_Module stats={stats} />}
                {activeTab === 'seasons' && <Referee_Seasons_Module stats={stats} />}
                {activeTab === 'vs_teams' && <Referee_VsTeams_Module stats={stats} />}
            </div>
        </div>
    );
}
