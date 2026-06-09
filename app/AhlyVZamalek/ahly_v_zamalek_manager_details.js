"use client";

import { useMemo, useState, useEffect } from "react";
import "./ahly_v_zamalek_manager_details.css";
import ManagerOverview from "./ahly_v_zamalek_manager_details_overview";
import ManagerMatches from "./ahly_v_zamalek_manager_details_matches";
import ManagerSeasons from "./ahly_v_zamalek_manager_details_seasons";
import ManagerVsTeams from "./ahly_v_zamalek_manager_details_vs_teams";
import ManagerChampionships from "./ahly_v_zamalek_manager_details_championships";
import ManagerPlayersUsed from "./ahly_v_zamalek_manager_details_players_used";
import { AhlyVZamalekService } from "./ahly_v_zamalek_service";
import { AhlyVZamalekExcelExport } from "./ahly_v_zamalek_export_excel";

export default function AhlyVZamalekManagerDetails({ managerName, managerStatus, masterMatches, onBack, playerDetails, lineupDetails }) {
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const { stats } = useMemo(() => {
        const summary = {
            matches: 0, wins: 0, draws: 0, losses: 0,
            gs: 0, ga: 0, csFor: 0, csAgainst: 0,
            matchHistory: [], seasonalStats: {}, compStats: {},
            statsByChampSeason: {}, statsByOpponent: {}, statsAsOpponentMgr: {},
            playerUsedStats: {}
        };

        const isAhlyTeam = (t) => {
            if (!t) return false;
            const s = String(t).trim();
            return s === "الأهلي" || s.toLowerCase() === "ahly" || s.toLowerCase() === "al ahly";
        };

        if (!managerName || !masterMatches) return { stats: summary };

        // 1. Matches as AHLY Manager
        const allAhlyMatches = masterMatches.filter(m => m["AHLY MANAGER"] && String(m["AHLY MANAGER"]).trim() === managerName);
        // 2. Matches as ZAMALEK Manager
        const allZamalekMatches = masterMatches.filter(m => m["ZAMALEK MANAGER"] && String(m["ZAMALEK MANAGER"]).trim() === managerName);

        const allMgrMatches = [...allAhlyMatches, ...allZamalekMatches];

        allMgrMatches.forEach(m => {
            summary.matches += 1;
            const gf = parseInt(m.GF) || 0;
            const ga = parseInt(m.GA) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            const champion = String(m.CHAMPION || "Unknown").trim();
            const season = String(m["SEASON - NAME"] || "Unknown").trim();

            const isAsAhly = m["AHLY MANAGER"] && String(m["AHLY MANAGER"]).trim() === managerName;
            const coachedTeam = isAsAhly ? "الأهلي" : "الزمالك";
            const oppTeam = isAsAhly ? "الزمالك" : "الأهلي";

            summary.gs += isAsAhly ? gf : ga;
            summary.ga += isAsAhly ? ga : gf;

            let result = 'D';
            if (isAsAhly) {
                if (wdl === "W") { summary.wins += 1; result = 'W'; }
                else if (wdl === "L") { summary.losses += 1; result = 'L'; }
                else { summary.draws += 1; }
            } else {
                if (wdl === "L") { summary.wins += 1; result = 'W'; }
                else if (wdl === "W") { summary.losses += 1; result = 'L'; }
                else { summary.draws += 1; }
            }

            // Clean Sheet Logic
            const cleanSheet = String(m["CLEAN SHEET"] || "").toUpperCase();
            let isCsFor = false;
            let isCsAgainst = false;

            if (isAsAhly) {
                isCsFor = cleanSheet.includes('AHLY') || cleanSheet === 'F' || cleanSheet === 'BOTH';
                isCsAgainst = cleanSheet.includes('ZAMALEK') || cleanSheet === 'A' || cleanSheet === 'BOTH';
            } else {
                isCsFor = cleanSheet.includes('ZAMALEK') || cleanSheet === 'A' || cleanSheet === 'BOTH';
                isCsAgainst = cleanSheet.includes('AHLY') || cleanSheet === 'F' || cleanSheet === 'BOTH';
            }

            if (isCsFor) summary.csFor += 1;
            if (isCsAgainst) summary.csAgainst += 1;

            summary.matchHistory.push({
                idx: m.MATCH_ID,
                date: m.DATE || "—",
                champion, season,
                opponent: oppTeam,
                managedTeam: coachedTeam,
                gf: isAsAhly ? gf : ga,
                ga: isAsAhly ? ga : gf,
                wdl: result,
                role: isAsAhly ? 'Ahly' : 'Zamalek'
            });

            // Grouping by Opponent Team (Vs Teams)
            if (isAsAhly) {
                if (!summary.statsByOpponent[oppTeam]) summary.statsByOpponent[oppTeam] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = summary.statsByOpponent[oppTeam];
                s.matches += 1; s.gs += gf; s.ga += ga;
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (isCsFor) s.csFor += 1;
                if (isCsAgainst) s.csAgainst += 1;
            } else {
                if (!summary.statsAsOpponentMgr[coachedTeam]) summary.statsAsOpponentMgr[coachedTeam] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = summary.statsAsOpponentMgr[coachedTeam];
                s.matches += 1; s.gs += ga; s.ga += gf;
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (isCsFor) s.csFor += 1;
                if (isCsAgainst) s.csAgainst += 1;
            }

            // Championship and Season performance
            [season, champion].forEach((key, i) => {
                const target = [summary.seasonalStats, summary.compStats][i];
                if (!target[key]) target[key] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = target[key];
                s.matches += 1;
                s.gs += (isAsAhly ? gf : ga);
                s.ga += (isAsAhly ? ga : gf);
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (isCsFor) s.csFor += 1;
                if (isCsAgainst) s.csAgainst += 1;
            });

            // Detailed Championship + Season
            if (!summary.statsByChampSeason[champion]) summary.statsByChampSeason[champion] = {};
            if (!summary.statsByChampSeason[champion][season]) summary.statsByChampSeason[champion][season] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
            const cs = summary.statsByChampSeason[champion][season];
            cs.matches += 1; cs.gs += (isAsAhly ? gf : ga); cs.ga += (isAsAhly ? ga : gf);
            if (result === 'W') cs.wins += 1; else if (result === 'L') cs.losses += 1; else cs.draws += 1;
            if (isCsFor) cs.csFor += 1;
            if (isCsAgainst) cs.csAgainst += 1;

            // Players Used
            const matchLineups = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(m.MATCH_ID));
            const matchEvents = (playerDetails || []).filter(p => String(p.MATCH_ID) === String(m.MATCH_ID));

            const teamLineups = matchLineups.filter(l => {
                const isAhlyLineup = isAhlyTeam(l.TEAM);
                return isAsAhly ? isAhlyLineup : !isAhlyLineup;
            });

            const teamEvents = matchEvents.filter(p => {
                const isAhlyEvent = isAhlyTeam(p.TEAM);
                return isAsAhly ? isAhlyEvent : !isAhlyEvent;
            });

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

                const isGoal = type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
                const isAssist = type === "ASSIST" || type === "اسيست" || type === "صنع";

                if (isGoal) ps.goals += 1;
                if (isAssist) ps.assists += 1;
            });
        });

        summary.matchHistory.sort((a, b) => {
            const da = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
            const db = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
            return db - da;
        });

        return { stats: summary };
    }, [managerName, masterMatches, playerDetails, lineupDetails]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('avz-export-excel', handleGlobalExport);
        return () => window.removeEventListener('avz-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = () => {
        let exportData = [];
        let filename = `Derby_Manager_${managerName}_${activeTab}`;
        switch (activeTab) {
            case 'overview':
                exportData = [{ "METRIC": "Matches", "VALUE": stats.matches }, { "METRIC": "Wins", "VALUE": stats.wins }, { "METRIC": "Draws", "VALUE": stats.draws }, { "METRIC": "Losses", "VALUE": stats.losses }, { "METRIC": "GF", "VALUE": stats.gs }, { "METRIC": "GA", "VALUE": stats.ga }];
                break;
            case 'matches':
                exportData = stats.matchHistory.map((m, i) => ({
                    "#": i + 1, "DATE": m.date, "CHAMPION": m.champion, "SEASON": m.season, "OPPONENT": m.opponent, "MANAGED TEAM": m.managedTeam, "WDL": m.wdl, "GF": m.gf, "GA": m.ga
                }));
                break;
            case 'championships':
                exportData = Object.keys(stats.compStats).map((c, i) => {
                    const s = stats.compStats[c];
                    return { "#": i + 1, "CHAMPION": c, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga, "CS": s.csFor };
                });
                break;
            case 'players_used':
                exportData = Object.values(stats.playerUsedStats).sort((a, b) => b.apps - a.apps).map((p, i) => ({
                    "#": i + 1, "PLAYER": p.name, "APPS": p.apps, "MINS": p.mins, "GOALS": p.goals, "ASSISTS": p.assists
                }));
                break;
            case 'seasons':
                exportData = [];
                Object.keys(stats.statsByChampSeason).forEach(comp => {
                    Object.keys(stats.statsByChampSeason[comp]).forEach(season => {
                        const s = stats.statsByChampSeason[comp][season];
                        exportData.push({ "CHAMPION": comp, "SEASON": season, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga });
                    });
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
        if (exportData.length > 0) AhlyVZamalekExcelExport.exportToExcel(exportData, filename);
    };

    return (
        <div className="player-details-container fade-in">
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}>
                        <span>←</span> All Managers
                    </button>
                    <div className="name-and-teams">
                        <h1 className="player-main-name">
                            {managerName.split(' ').slice(0, -1).join(' ')} <span>{managerName.split(' ').slice(-1)}</span>
                        </h1>
                    </div>
                </div>

                <div className="hero-stats-quick" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div className="quick-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'Space Mono', letterSpacing: '2px' }}>MATCHES</div>
                        <div style={{ color: 'var(--mgr-gold)', fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '2px' }}>{stats.matches}</div>
                    </div>
                </div>
            </div>

            <div className="player-details-tabs">
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

            <div className="tab-content-area" style={{ padding: '0px 0' }}>
                {activeTab === 'overview' && <ManagerOverview stats={stats} />}
                {activeTab === 'matches' && <ManagerMatches stats={stats} />}
                {activeTab === 'championships' && <ManagerChampionships stats={stats} />}
                {activeTab === 'seasons' && <ManagerSeasons stats={stats} />}
                {activeTab === 'players_used' && <ManagerPlayersUsed stats={stats} />}
                {activeTab === 'vs_teams' && <ManagerVsTeams stats={stats} managerStatus={managerStatus} />}
            </div>
        </div>
    );
}
