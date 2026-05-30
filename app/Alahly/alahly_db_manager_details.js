"use client";

import { useMemo, useState, useEffect } from "react";
import "./alahly_db_player_details.css"; // Reuse styling base
import Manager_Overview_Module from "./alahly_db_manager_details_overview";
import Manager_Dashboard_Module from "./alahly_db_manager_details_dashboard";
import Manager_Matches_Module from "./alahly_db_manager_details_matches";
import Manager_SeasonName_Module from "./alahly_db_manager_details_season_name";
import Manager_SeasonNumber_Module from "./alahly_db_manager_details_season_number";
import Manager_VsTeams_Module from "./alahly_db_manager_details_vs_teams";
import Manager_Championships_Module from "./alahly_db_manager_details_championships";
import Manager_PlayersUsed_Module from "./alahly_db_manager_details_players_used";
import { AlAhlyService } from "./alahly_db_service";

export default function Manager_Details_Hub({ managerName, managerStatus, masterMatches, onBack, playerDetails, lineupDetails }) {
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { window.scrollTo(0, 0); }, []);

    // NEW STATES FOR DASHBOARD FILTERS
    const [selectedComps, setSelectedComps] = useState([]);
    const [isCompOpen, setIsCompOpen] = useState(false);
    const [seasonLimit, setSeasonLimit] = useState("");

    const managerColumn = managerStatus === "alahly" ? "AHLY MANAGER" : "OPPONENT MANAGER";
    const teamColumn = managerStatus === "alahly" ? "AHLY TEAM" : "OPPONENT TEAM";

    const { stats, mgrComps, mgrSYs, mgrOpps } = useMemo(() => {
        const summary = {
            matches: 0, wins: 0, draws: 0, losses: 0,
            drawsPos: 0, drawsNeg: 0,
            gs: 0, ga: 0, csFor: 0, csAgainst: 0,
            matchHistory: [], seasonalStats: {}, compStats: {}, oppStats: {},
            statsByChampSeason: {}, statsBySY: {}, statsByOpponent: {},
            statsAsOpponentMgr: {}, // Grouped by team he coached vs Ahly
            playerUsedStats: {} // { pName: { name: pName, apps: 0, mins: 0, goals: 0, assists: 0 } }
        };

        const isAhlyTeam = (t) => {
            if (!t) return false;
            const s = String(t).trim();
            return s === "الأهلي";
        };

        if (!managerName || !masterMatches) return { stats: summary, mgrComps: [], mgrSYs: [], mgrOpps: [] };

        // 1. Matches as AHLY Manager
        const allAhlyMatches = masterMatches.filter(m => String(m["AHLY MANAGER"]).trim() === managerName);
        // 2. Matches as OPPONENT Manager
        const allOppMatches = masterMatches.filter(m => String(m["OPPONENT MANAGER"]).trim() === managerName);

        // Define which side we primarily care about based on initial status, but we will aggregate both
        const allMgrMatches = [...allAhlyMatches, ...allOppMatches];

        const compSet = new Set();
        const sySet = new Set();
        const oppSet = new Set();

        allMgrMatches.forEach(m => {
            const champion = String(m.CHAMPION || "Unknown").trim();
            const sy = String(m["SEASON - NUMBER"] || "Unknown").trim();
            const opp = managerStatus === "alahly" ? m["OPPONENT TEAM"] : m["AHLY TEAM"];
            compSet.add(champion);
            sySet.add(sy);
            if (opp && opp !== "—") oppSet.add(opp);
        });

        const filteredMatches = allMgrMatches;

        filteredMatches.forEach(m => {
            summary.matches += 1;
            const gf = parseInt(m["GF"]) || 0;
            const ga = parseInt(m["GA"]) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            const champion = String(m.CHAMPION || "Unknown").trim();
            const season = String(m["SEASON - NAME"] || "Unknown").trim();
            const sy = String(m["SEASON - NUMBER"] || "Unknown").trim();

            const isAsAhly = String(m["AHLY MANAGER"]).trim() === managerName;
            const opp = isAsAhly ? (m["OPPONENT TEAM"] || "—") : "AL AHLY";
            const coachedTeam = isAsAhly ? "AL AHLY" : (m["OPPONENT TEAM"] || "—");

            summary.gs += isAsAhly ? gf : ga; // If mgr is opponent, Al Ahly's GA is his GS
            summary.ga += isAsAhly ? ga : gf;

            let result = 'D';
            if (isAsAhly) {
                if (wdl === "W") { summary.wins += 1; result = 'W'; }
                else if (wdl === "L") { summary.losses += 1; result = 'L'; }
                else { summary.draws += 1; if (gf > 0) summary.drawsPos += 1; else summary.drawsNeg += 1; }
                if (ga === 0) summary.csFor += 1;
                if (gf === 0) summary.csAgainst += 1;
            } else {
                // If he is opponent manager, Al Ahly's Loss is his Win
                if (wdl === "L") { summary.wins += 1; result = 'W'; }
                else if (wdl === "W") { summary.losses += 1; result = 'L'; }
                else { summary.draws += 1; if (ga > 0) summary.drawsPos += 1; else summary.drawsNeg += 1; }
                if (gf === 0) summary.csFor += 1;
                if (ga === 0) summary.csAgainst += 1;
            }

            summary.matchHistory.push({
                idx: m.MATCH_ID,
                date: m.DATE,
                champion, season, sy,
                opponent: opp,
                managedTeam: coachedTeam,
                gf: isAsAhly ? gf : ga,
                ga: isAsAhly ? ga : gf,
                wdl: result,
                role: isAsAhly ? 'Ahly' : 'Opponent'
            });

            // Grouping logic for "Vs Teams"
            if (isAsAhly) {
                if (!summary.statsByOpponent[opp]) summary.statsByOpponent[opp] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = summary.statsByOpponent[opp];
                s.matches += 1; s.gs += gf; s.ga += ga;
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (ga === 0) s.csFor += 1;
                if (gf === 0) s.csAgainst += 1;
            } else {
                // When he manages an opponent team vs Al Ahly, group by his team name
                if (!summary.statsAsOpponentMgr[coachedTeam]) summary.statsAsOpponentMgr[coachedTeam] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = summary.statsAsOpponentMgr[coachedTeam];
                s.matches += 1;
                s.gs += ga; // His team goals (Opponent GA in DB)
                s.ga += gf; // Against Al Ahly (Opponent GF in DB)
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (gf === 0) s.csFor += 1;
                if (ga === 0) s.csAgainst += 1;
            }

            // General seasonal/comp stats (only if he's the primary status? or both? Let's do both but tag them?)
            // For now, let's just make tabs show data based on the matches we selected.

            [sy, champion].forEach((key, i) => {
                const target = [summary.seasonalStats, summary.compStats][i];
                if (!target[key]) target[key] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
                const s = target[key];
                s.matches += 1;
                s.gs += (isAsAhly ? gf : ga);
                s.ga += (isAsAhly ? ga : gf);
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if ((isAsAhly ? ga : gf) === 0) s.csFor += 1;
                if ((isAsAhly ? gf : ga) === 0) s.csAgainst += 1;
            });

            // Detailed Aggregates for Tabs
            if (!summary.statsByChampSeason[champion]) summary.statsByChampSeason[champion] = {};
            if (!summary.statsByChampSeason[champion][season]) summary.statsByChampSeason[champion][season] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
            const cs = summary.statsByChampSeason[champion][season];
            cs.matches += 1; cs.gs += gf; cs.ga += ga;
            if (result === 'W') cs.wins += 1; else if (result === 'L') cs.losses += 1; else cs.draws += 1;
            if (ga === 0) cs.csFor += 1;
            if (gf === 0) cs.csAgainst += 1;

            if (!summary.statsBySY[sy]) summary.statsBySY[sy] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
            const ss = summary.statsBySY[sy];
            ss.matches += 1; ss.gs += gf; ss.ga += ga;
            if (result === 'W') ss.wins += 1; else if (result === 'L') ss.losses += 1; else ss.draws += 1;
            if (ga === 0) ss.csFor += 1;
            if (gf === 0) ss.csAgainst += 1;

            // Player Used Statistics
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

        return {
            stats: summary,
            mgrComps: Array.from(compSet).sort(),
            mgrSYs: Array.from(sySet).sort((a, b) => b.localeCompare(a)),
            mgrOpps: Array.from(oppSet).sort()
        };
    }, [managerName, managerStatus, masterMatches, playerDetails, lineupDetails]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = () => {
        let exportData = [];
        let filename = `AlAhly_Manager_${managerName}_${activeTab}`;
        switch (activeTab) {
            case 'overview':
                exportData = [{ "METRIC": "Matches", "VALUE": stats.matches }, { "METRIC": "Wins", "VALUE": stats.wins }, { "METRIC": "Draws", "VALUE": stats.draws }, { "METRIC": "Losses", "VALUE": stats.losses }, { "METRIC": "GF", "VALUE": stats.gs }, { "METRIC": "GA", "VALUE": stats.ga }];
                break;
            case 'matches':
                exportData = stats.matchHistory.map((m, i) => ({
                    "#": i + 1, "DATE": m.date, "CHAMPION": m.champion, "SEASON": m.season, "SY": m.sy, "OPPONENT": m.opponent, "MANAGED TEAM": m.managedTeam, "WDL": m.wdl, "GF": m.gf, "GA": m.ga
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
            case 'season_name':
                exportData = [];
                Object.keys(stats.statsByChampSeason).forEach(comp => {
                    Object.keys(stats.statsByChampSeason[comp]).forEach(season => {
                        const s = stats.statsByChampSeason[comp][season];
                        exportData.push({ "CHAMPION": comp, "SEASON": season, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga });
                    });
                });
                break;
            case 'season_number':
                exportData = Object.keys(stats.statsBySY).sort((a, b) => b.localeCompare(a)).map((sy, i) => {
                    const s = stats.statsBySY[sy];
                    return { "#": i + 1, "SY": sy, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga };
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
        if (exportData.length > 0) AlAhlyService.exportToExcel(exportData, filename);
    };

    return (
        <div className="player-details-container fade-in">
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}>
                        <span>←</span> All Manager's
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
                        <div style={{ color: 'var(--player-gold)', fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '2px' }}>{stats.matches}</div>
                    </div>
                </div>

            </div>



            <div className="player-details-tabs">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'matches', label: 'Matches' },
                    { id: 'championships', label: 'Championships' },
                    { id: 'season_name', label: 'Season Name' },
                    { id: 'season_number', label: 'Season Number' },
                    { id: 'vs_teams', label: 'Vs Teams' },
                    { id: 'players_used', label: 'Players Used' }
                ].map(t => (
                    <div key={t.id} className={`player-tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                        <span className="tab-title">{t.label.toUpperCase()}</span>
                    </div>
                ))}
            </div>

            <div className="tab-content-area" style={{ padding: '0px 0' }}>
                {activeTab === 'overview' && <Manager_Overview_Module stats={stats} />}
                {activeTab === 'dashboard' && (
                    <Manager_Dashboard_Module
                        stats={stats}
                        playerComps={mgrComps}
                        selectedComps={selectedComps}
                        setSelectedComps={setSelectedComps}
                        isCompOpen={isCompOpen}
                        setIsCompOpen={setIsCompOpen}
                        seasonLimit={seasonLimit}
                        setSeasonLimit={setSeasonLimit}
                        sortedSeasons={mgrSYs}
                    />
                )}
                {activeTab === 'matches' && <Manager_Matches_Module stats={stats} />}
                {activeTab === 'championships' && <Manager_Championships_Module stats={stats} />}
                {activeTab === 'players_used' && <Manager_PlayersUsed_Module stats={stats} />}
                {activeTab === 'season_name' && <Manager_SeasonName_Module stats={stats} />}
                {activeTab === 'season_number' && <Manager_SeasonNumber_Module stats={stats} />}
                {activeTab === 'vs_teams' && <Manager_VsTeams_Module stats={stats} managerStatus={managerStatus} />}
            </div>
        </div>
    );
}
