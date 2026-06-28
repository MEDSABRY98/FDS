"use client";

import { useMemo, useState, useEffect } from "react";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import "../../Alahly/PlayerDetails/alahly_db_player_details.css";
import "../Managers/egypt_nt_db_managers.css";
import Manager_Overview_Module from "./egypt_nt_db_manager_details_overview";
import Manager_Matches_Module from "./egypt_nt_db_manager_details_matches";
import Manager_Championships_Module from "./egypt_nt_db_manager_details_championships";
import Manager_Seasons_Module from "./egypt_nt_db_manager_details_seasons";
import Manager_VsTeams_Module from "./egypt_nt_db_manager_details_vs_teams";
import Manager_VsManagers_Module from "./egypt_nt_db_manager_details_vs_managers";
import Manager_PlayersUsed_Module from "./egypt_nt_db_manager_details_players_used";
import {
    buildMatchEgyptSideResolver,
    isGoalEvent,
    isAssistEvent,
    getMatchGoalScoreStates,
    applyScoreStateStats,
    compareSeasonLabels,
} from "./egypt_nt_manager_details_utils";

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
            statsByOpponentManager: {},
            statsAsFacingEgyptMgr: {},
            playerUsedStats: {},
            aheadWin: 0,
            aheadDraw: 0,
            aheadLoss: 0,
            behindWin: 0,
            behindDraw: 0,
            behindLoss: 0,
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

            const matchLineupsForState = (lineupDetails || []).filter((l) => String(l.MATCH_ID) === String(m.MATCH_ID));
            const matchEventsForState = (playerDetails || []).filter((p) => String(p.MATCH_ID) === String(m.MATCH_ID));
            applyScoreStateStats(
                summary,
                getMatchGoalScoreStates(m, matchEventsForState, matchLineupsForState, managerName, result)
            );

            if (isAsEgypt) {
                if (!summary.statsByOpponent[opp]) summary.statsByOpponent[opp] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = summary.statsByOpponent[opp];
                s.matches += 1; s.gs += gf; s.ga += ga;
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (ga === 0) s.csFor += 1;
                if (gf === 0) s.csAgainst += 1;

                if (!summary.statsByOpponentManager[oppManager]) {
                    summary.statsByOpponentManager[oppManager] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                }
                const mgrStats = summary.statsByOpponentManager[oppManager];
                mgrStats.matches += 1; mgrStats.gs += gf; mgrStats.ga += ga;
                if (result === 'W') mgrStats.wins += 1; else if (result === 'L') mgrStats.losses += 1; else mgrStats.draws += 1;
                if (ga === 0) mgrStats.csFor += 1;
                if (gf === 0) mgrStats.csAgainst += 1;
            } else {
                if (!summary.statsAsOpponentMgr[coachedTeam]) summary.statsAsOpponentMgr[coachedTeam] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = summary.statsAsOpponentMgr[coachedTeam];
                s.matches += 1; s.gs += ga; s.ga += gf;
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (gf === 0) s.csFor += 1;
                if (ga === 0) s.csAgainst += 1;

                const egyptMgr = String(m["EGYPT MANAGER"] || "—").trim();
                if (!summary.statsAsFacingEgyptMgr[egyptMgr]) {
                    summary.statsAsFacingEgyptMgr[egyptMgr] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                }
                const facingStats = summary.statsAsFacingEgyptMgr[egyptMgr];
                facingStats.matches += 1; facingStats.gs += ga; facingStats.ga += gf;
                if (result === 'W') facingStats.wins += 1; else if (result === 'L') facingStats.losses += 1; else facingStats.draws += 1;
                if (gf === 0) facingStats.csFor += 1;
                if (ga === 0) facingStats.csAgainst += 1;
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
                exportData = [
                    { "METRIC": "Matches", "VALUE": stats.matches },
                    { "METRIC": "Wins", "VALUE": stats.wins },
                    { "METRIC": "Win %", "VALUE": stats.matches > 0 ? `${((stats.wins / stats.matches) * 100).toFixed(1)}%` : "0%" },
                    { "METRIC": "Draws", "VALUE": stats.draws },
                    { "METRIC": "Losses", "VALUE": stats.losses },
                    { "METRIC": "Loss %", "VALUE": stats.matches > 0 ? `${((stats.losses / stats.matches) * 100).toFixed(1)}%` : "0%" },
                    { "METRIC": "GF", "VALUE": stats.gs },
                    { "METRIC": "GF Average", "VALUE": stats.matches > 0 ? (stats.gs / stats.matches).toFixed(2) : 0 },
                    { "METRIC": "GA", "VALUE": stats.ga },
                    { "METRIC": "GA Average", "VALUE": stats.matches > 0 ? (stats.ga / stats.matches).toFixed(2) : 0 },
                    { "METRIC": "CS For", "VALUE": stats.csFor },
                    { "METRIC": "CS Against", "VALUE": stats.csAgainst },
                    { "METRIC": "Ahead & Won", "VALUE": stats.aheadWin },
                    { "METRIC": "Ahead & Drew", "VALUE": stats.aheadDraw },
                    { "METRIC": "Ahead & Lost", "VALUE": stats.aheadLoss },
                    { "METRIC": "Behind & Won", "VALUE": stats.behindWin },
                    { "METRIC": "Behind & Drew", "VALUE": stats.behindDraw },
                    { "METRIC": "Behind & Lost", "VALUE": stats.behindLoss },
                ];
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
                    "#": i + 1, "PLAYER": p.name, "APPS": p.apps, "MINS": p.mins, "G+A": (p.goals || 0) + (p.assists || 0), "GOALS": p.goals, "ASSISTS": p.assists
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
            case 'vs_managers': {
                const mgrCombined = { ...stats.statsByOpponentManager, ...stats.statsAsFacingEgyptMgr };
                exportData = Object.keys(mgrCombined).sort((a, b) => mgrCombined[b].matches - mgrCombined[a].matches).map((mgr, i) => {
                    const s = mgrCombined[mgr];
                    return { "#": i + 1, "MANAGER": mgr, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga, "CS-F": s.csFor };
                });
                break;
            }
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
                    { id: 'vs_managers', label: 'Vs Managers' },
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
                {activeTab === 'vs_teams' && <Manager_VsTeams_Module stats={stats} />}
                {activeTab === 'vs_managers' && <Manager_VsManagers_Module stats={stats} />}
                {activeTab === 'players_used' && <Manager_PlayersUsed_Module stats={stats} />}
            </div>
        </div>
    );
}
