"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../../lib/NoData_db";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import "../../Alahly/PlayerDetails/alahly_db_player_details.css";
import "../Managers/egypt_nt_db_managers.css";

function Manager_Overview_Module({ stats }) {
    return (
        <div className="stats-grid-premium fade-in">
            <div className="stat-card-premium">
                <span className="stat-label-modern">Matches Managed</span>
                <div className="stat-value-modern" style={{ color: 'var(--gold)' }}>{stats.matches}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Wins</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.wins}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Draws</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{stats.draws}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Losses</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.losses}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Goals For</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.gs}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Goals Against</span>
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
        </div>
    );
}

function Manager_Matches_Module({ stats }) {
    return (
        <div style={{ overflowX: 'auto' }} className="fade-in">
            <table className="player-match-table mgr-matches-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>MATCH ID</th>
                        <th>DATE</th>
                        <th className="mgr-season-col">SEASON</th>
                        <th>OPPONENT TEAM</th>
                        <th>OPPONENT MANAGER</th>
                        <th>RESULT</th>
                        <th>GF</th>
                        <th>GA</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.matchHistory.map((m, idx) => (
                        <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{m.idx}</td>
                            <td>{m.date}</td>
                            <td className="mgr-season-col">{m.season}</td>
                            <td style={{ fontWeight: '800' }}>{m.opponent}</td>
                            <td>{m.opponentManager}</td>
                            <td>
                                <span className={`m-role-pill ${m.wdl === 'W' ? 'role-starter' : m.wdl === 'L' ? 'role-sub' : ''}`} style={{ fontSize: '11px', fontWeight: '800' }}>
                                    {m.wdl}
                                </span>
                            </td>
                            <td>{m.gf}</td>
                            <td>{m.ga}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Manager_Championships_Module({ stats }) {
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
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Manager_Seasons_Module({ stats }) {
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
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Manager_VsTeams_Module({ stats, managerStatus }) {
    const combined = { ...stats.statsByOpponent, ...stats.statsAsOpponentMgr };
    const list = Object.keys(combined).map(opp => ({ name: opp, ...combined[opp] })).sort((a, b) => b.matches - a.matches);
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
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Manager_PlayersUsed_Module({ stats }) {
    const list = Object.values(stats.playerUsedStats).sort((a, b) => b.apps - a.apps || b.mins - a.mins);
    return (
        <table className="player-match-table fade-in">
            <thead>
                <tr>
                    <th>PLAYER NAME</th>
                    <th>APPEARANCES</th>
                    <th>MINUTES</th>
                    <th>GOALS</th>
                    <th>ASSISTS</th>
                </tr>
            </thead>
            <tbody>
                {list.map(p => (
                    <tr key={p.name}>
                        <td style={{ fontWeight: '800', color: '#000' }}>{p.name}</td>
                        <td style={{ color: 'var(--gold)', fontWeight: '800' }}>{p.apps}</td>
                        <td>{p.mins}'</td>
                        <td style={{ color: '#e74c3c', fontWeight: '800' }}>{p.goals}</td>
                        <td style={{ color: '#3498db', fontWeight: '800' }}>{p.assists}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

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

function buildMatchEgyptSideResolver(matchInfo, matchLineups = []) {
    const egyptTeamName = String(matchInfo?.["Egypt TEAM"] || matchInfo?.["EGYPT TEAM"] || "منتخب مصر").trim();
    const opponentTeamName = String(matchInfo?.["OPPONENT TEAM"] || "").trim();
    const norm = (value) => String(value || "").trim().toLowerCase();

    const egyptIdentifiers = new Set([
        "egypt",
        "مصر",
        "منتخب مصر",
        "المنتخب المصري",
        norm(egyptTeamName)
    ].filter(Boolean));

    const resolveTeamSide = (teamValue) => {
        const name = String(teamValue || "").trim();
        if (!name) return null;

        const normalizedName = norm(name);
        if (opponentTeamName && normalizedName === norm(opponentTeamName)) return false;
        if (normalizedName === "opponent" && opponentTeamName) return false;
        if (egyptIdentifiers.has(normalizedName)) return true;
        return null;
    };

    const playerSideByName = new Map();
    matchLineups.forEach((lineupRow) => {
        const playerName = String(lineupRow["PLAYER NAME"] || "").trim();
        if (!playerName) return;
        const side = resolveTeamSide(lineupRow.TEAM);
        if (side !== null) playerSideByName.set(playerName, side);
    });

    return (record) => {
        const byTeam = resolveTeamSide(record?.TEAM);
        if (byTeam !== null) return byTeam;

        const playerName = String(record?.["PLAYER NAME"] || "").trim();
        if (playerName && playerSideByName.has(playerName)) {
            return playerSideByName.get(playerName);
        }

        return false;
    };
}

function isGoalEvent(type, sub) {
    const typeUp = String(type || "").trim().toUpperCase();
    const subUp = String(sub || "").trim().toUpperCase();
    const subRaw = String(sub || "").trim();
    return ["GOAL", "هدف"].includes(typeUp) || typeUp === "PENGOAL" || subUp === "PENGOAL" || subRaw === "هدف جزاء";
}

function isAssistEvent(type) {
    const typeUp = String(type || "").trim().toUpperCase();
    const typeRaw = String(type || "").trim();
    return typeUp === "ASSIST" || typeRaw === "اسيست" || typeRaw === "صنع";
}

export default function EgyptNTManagerDetails({ managerName, managerStatus, masterMatches, onBack, playerDetails, lineupDetails }) {
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const { stats } = useMemo(() => {
        const summary = {
            matches: 0, wins: 0, draws: 0, losses: 0,
            drawsPos: 0, drawsNeg: 0,
            gs: 0, ga: 0, csFor: 0, csAgainst: 0,
            matchHistory: [], seasonalStats: {}, compStats: {}, oppStats: {},
            statsByOpponent: {},
            statsAsOpponentMgr: {},
            playerUsedStats: {}
        };

        if (!managerName || !masterMatches) return { stats: summary };

        const allEgyptMatches = masterMatches.filter(m => String(m["EGYPT MANAGER"]).trim() === managerName);
        const allOppMatches = masterMatches.filter(m => String(m["OPPONENT MANAGER"]).trim() === managerName);
        const allMgrMatches = [...allEgyptMatches, ...allOppMatches];

        allMgrMatches.forEach(m => {
            summary.matches += 1;
            const gf = parseInt(m["GF"]) || 0;
            const ga = parseInt(m["GA"]) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            const champion = String(m.CHAMPION || "Unknown").trim();
            const season = String(m.SEASON || "Unknown").trim();

            const isAsEgypt = String(m["EGYPT MANAGER"]).trim() === managerName;
            const opp = isAsEgypt ? (m["OPPONENT TEAM"] || "—") : "مصر";
            const oppManager = isAsEgypt
                ? String(m["OPPONENT MANAGER"] || "—").trim()
                : String(m["EGYPT MANAGER"] || "—").trim();
            const coachedTeam = isAsEgypt ? "مصر" : (m["OPPONENT TEAM"] || "—");

            summary.gs += isAsEgypt ? gf : ga;
            summary.ga += isAsEgypt ? ga : gf;

            let result = 'D';
            if (isAsEgypt) {
                if (wdl === "W") { summary.wins += 1; result = 'W'; }
                else if (wdl === "L") { summary.losses += 1; result = 'L'; }
                else { summary.draws += 1; if (gf > 0) summary.drawsPos += 1; else summary.drawsNeg += 1; }
                if (ga === 0) summary.csFor += 1;
                if (gf === 0) summary.csAgainst += 1;
            } else {
                if (wdl === "L") { summary.wins += 1; result = 'W'; }
                else if (wdl === "W") { summary.losses += 1; result = 'L'; }
                else { summary.draws += 1; if (ga > 0) summary.drawsPos += 1; else summary.drawsNeg += 1; }
                if (gf === 0) summary.csFor += 1;
                if (ga === 0) summary.csAgainst += 1;
            }

            summary.matchHistory.push({
                idx: m.MATCH_ID,
                date: m.DATE,
                season,
                opponent: opp,
                opponentManager: oppManager,
                managedTeam: coachedTeam,
                gf: isAsEgypt ? gf : ga,
                ga: isAsEgypt ? ga : gf,
                wdl: result,
                role: isAsEgypt ? 'Egypt' : 'Opponent'
            });

            if (isAsEgypt) {
                if (!summary.statsByOpponent[opp]) summary.statsByOpponent[opp] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = summary.statsByOpponent[opp];
                s.matches += 1; s.gs += gf; s.ga += ga;
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (ga === 0) s.csFor += 1;
                if (gf === 0) s.csAgainst += 1;
            } else {
                if (!summary.statsAsOpponentMgr[coachedTeam]) summary.statsAsOpponentMgr[coachedTeam] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = summary.statsAsOpponentMgr[coachedTeam];
                s.matches += 1; s.gs += ga; s.ga += gf;
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (gf === 0) s.csFor += 1;
                if (ga === 0) s.csAgainst += 1;
            }

            if (!summary.compStats[champion]) summary.compStats[champion] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
            const comp = summary.compStats[champion];
            comp.matches += 1; comp.gs += (isAsEgypt ? gf : ga); comp.ga += (isAsEgypt ? ga : gf);
            if (result === 'W') comp.wins += 1; else if (result === 'L') comp.losses += 1; else comp.draws += 1;
            if ((isAsEgypt ? ga : gf) === 0) comp.csFor += 1;
            if ((isAsEgypt ? gf : ga) === 0) comp.csAgainst += 1;

            if (!summary.seasonalStats[season]) summary.seasonalStats[season] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
            const ss = summary.seasonalStats[season];
            ss.matches += 1; ss.gs += (isAsEgypt ? gf : ga); ss.ga += (isAsEgypt ? ga : gf);
            if (result === 'W') ss.wins += 1; else if (result === 'L') ss.losses += 1; else ss.draws += 1;
            if ((isAsEgypt ? ga : gf) === 0) ss.csFor += 1;
            if ((isAsEgypt ? gf : ga) === 0) ss.csAgainst += 1;

            // Player Used Statistics
            const matchLineups = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(m.MATCH_ID));
            const matchEvents = (playerDetails || []).filter(p => String(p.MATCH_ID) === String(m.MATCH_ID));
            const isEgyptSide = buildMatchEgyptSideResolver(m, matchLineups);

            const teamLineups = matchLineups.filter(l => isAsEgypt ? isEgyptSide(l) : !isEgyptSide(l));
            const teamEvents = matchEvents.filter(p => isAsEgypt ? isEgyptSide(p) : !isEgyptSide(p));

            teamLineups.forEach(l => {
                const pName = String(l["PLAYER NAME"] || "Unknown").trim();
                if (pName.toLowerCase() === "unknown") return;
                if (!summary.playerUsedStats[pName]) {
                    summary.playerUsedStats[pName] = { name: pName, apps: 0, mins: 0, goals: 0, assists: 0 };
                }
                const ps = summary.playerUsedStats[pName];
                ps.apps += 1;
                ps.mins += parseInt(l["TOTAL MINUTE"] || 0) || 0;
            });

            teamEvents.forEach(p => {
                const pName = String(p["PLAYER NAME"] || "Unknown").trim();
                if (pName.toLowerCase() === "unknown") return;
                if (!summary.playerUsedStats[pName]) {
                    summary.playerUsedStats[pName] = { name: pName, apps: 0, mins: 0, goals: 0, assists: 0 };
                }
                const ps = summary.playerUsedStats[pName];
                const type = String(p.TYPE || "").trim();
                const sub = String(p.TYPE_SUB || "").trim();

                if (isGoalEvent(type, sub)) ps.goals += 1;
                if (isAssistEvent(type)) ps.assists += 1;
            });
        });

        summary.matchHistory.sort((a, b) => {
            const da = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
            const db = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
            return db - da;
        });

        return { stats: summary };
    }, [managerName, managerStatus, masterMatches, playerDetails, lineupDetails]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = () => {
        let exportData = [];
        let filename = `EgyptNT_Manager_${managerName}_${activeTab}`;
        switch (activeTab) {
            case 'overview':
                exportData = [{ "METRIC": "Matches", "VALUE": stats.matches }, { "METRIC": "Wins", "VALUE": stats.wins }, { "METRIC": "Draws", "VALUE": stats.draws }, { "METRIC": "Losses", "VALUE": stats.losses }, { "METRIC": "GF", "VALUE": stats.gs }, { "METRIC": "GA", "VALUE": stats.ga }];
                break;
            case 'matches':
                exportData = stats.matchHistory.map((m, i) => ({
                    "#": i + 1, "DATE": m.date, "SEASON": m.season, "OPPONENT": m.opponent, "OPPONENT MANAGER": m.opponentManager, "WDL": m.wdl, "GF": m.gf, "GA": m.ga
                }));
                break;
            case 'championships':
                exportData = Object.keys(stats.compStats).map((c, i) => {
                    const s = stats.compStats[c];
                    return { "#": i + 1, "CHAMPION": c, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga, "CS-F": s.csFor };
                });
                break;
            case 'players_used':
                exportData = Object.values(stats.playerUsedStats).sort((a, b) => b.apps - a.apps).map((p, i) => ({
                    "#": i + 1, "PLAYER": p.name, "APPS": p.apps, "MINS": p.mins, "GOALS": p.goals, "ASSISTS": p.assists
                }));
                break;
            case 'seasons':
                exportData = Object.keys(stats.seasonalStats).sort(compareSeasonLabels).map((season, i) => {
                    const s = stats.seasonalStats[season];
                    return { "#": i + 1, "SEASON": season, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga, "CS-F": s.csFor };
                });
                break;
            case 'vs_teams':
                const combined = { ...stats.statsByOpponent, ...stats.statsAsOpponentMgr };
                exportData = Object.keys(combined).sort((a, b) => combined[b].matches - combined[a].matches).map((team, i) => {
                    const s = combined[team];
                    return { "#": i + 1, "TEAM": team, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga };
                });
                break;
        }
        if (exportData.length > 0) EgyptNTExcelExport.exportToExcel(exportData, filename);
    };

    return (
        <div className="player-details-container fade-in">
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}><span>←</span> All Managers</button>
                    <h1 className="player-main-name">
                        {managerName.split(' ').slice(0, -1).join(' ')} <span>{managerName.split(' ').slice(-1)}</span>
                    </h1>
                </div>
                <div className="hero-stats-quick" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div className="quick-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'Space Mono', letterSpacing: '2px' }}>MATCHES</div>
                        <div style={{ color: 'var(--gold)', fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '2px' }}>{stats.matches}</div>
                    </div>
                </div>
            </div>

            <div className="player-details-tabs mgr-details-tabs">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'matches', label: 'Matches' },
                    { id: 'championships', label: 'Championships' },
                    { id: 'seasons', label: 'Seasons' },
                    { id: 'vs_teams', label: 'Vs Teams' },
                    { id: 'players_used', label: 'Players Used' }
                ].map(t => (
                    <div key={t.id} className={`player-tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                        <span className="tab-title">{t.label.toUpperCase()}</span>
                    </div>
                ))}
            </div>

            <div className="details-tab-content" style={{ marginTop: '30px' }}>
                {activeTab === 'overview' && <Manager_Overview_Module stats={stats} />}
                {activeTab === 'matches' && <Manager_Matches_Module stats={stats} />}
                {activeTab === 'championships' && <Manager_Championships_Module stats={stats} />}
                {activeTab === 'seasons' && <Manager_Seasons_Module stats={stats} />}
                {activeTab === 'vs_teams' && <Manager_VsTeams_Module stats={stats} managerStatus={managerStatus} />}
                {activeTab === 'players_used' && <Manager_PlayersUsed_Module stats={stats} />}
            </div>
        </div>
    );
}
