"use client";

import { useMemo, useState, useEffect } from "react";
import "./alahly_db_player_details.css"; // Reuse styling base
import Referee_Overview_Module from "./alahly_db_referee_details_overview";
import Referee_Dashboard_Module from "./alahly_db_referee_details_dashboard";
import Referee_Matches_Module from "./alahly_db_referee_details_matches";
import Referee_SeasonName_Module from "./alahly_db_referee_details_season_name";
import Referee_SeasonNumber_Module from "./alahly_db_referee_details_season_number";
import Referee_VsTeams_Module from "./alahly_db_referee_details_vs_teams";
import Referee_Championships_Module from "./alahly_db_referee_details_championships";
import { AlAhlyService } from "./alahly_db_service";

export default function Referee_Details_Hub({ refereeName, masterMatches, playerDetails, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { window.scrollTo(0, 0); }, []);

    // NEW STATES FOR DASHBOARD FILTERS
    const [selectedComps, setSelectedComps] = useState([]);
    const [isCompOpen, setIsCompOpen] = useState(false);
    const [seasonLimit, setSeasonLimit] = useState("");

    const { stats, refComps, refSYs, refOpps } = useMemo(() => {
        const summary = {
            matches: 0, wins: 0, draws: 0, losses: 0,
            drawsPos: 0, drawsNeg: 0,
            gs: 0, ga: 0, csFor: 0, csAgainst: 0,
            penFor: 0, penAgainst: 0,
            matchHistory: [], seasonalStats: {}, compStats: {},
            statsByChampSeason: {}, statsBySY: {}, statsByOpponent: {}
        };

        if (!refereeName || !masterMatches) return { stats: summary, refComps: [], refSYs: [], refOpps: [] };

        const allRefMatches = masterMatches.filter(m => String(m.REFREE || "").trim() === refereeName);

        const compSet = new Set();
        const sySet = new Set();
        const oppSet = new Set();

        allRefMatches.forEach(m => {
            const champion = String(m.CHAMPION || "Unknown").trim();
            const sy = String(m["SEASON - NUMBER"] || "Unknown").trim();
            const opp = String(m["OPPONENT TEAM"] || "—").trim();
            compSet.add(champion);
            sySet.add(sy);
            if (opp !== "—") oppSet.add(opp);
        });

        const filteredMatches = allRefMatches;

        filteredMatches.forEach(m => {
            summary.matches += 1;
            const gf = parseInt(m["GF"]) || 0;
            const ga = parseInt(m["GA"]) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            const champion = String(m.CHAMPION || "Unknown").trim();
            const season = String(m["SEASON - NAME"] || "Unknown").trim();
            const sy = String(m["SEASON - NUMBER"] || "Unknown").trim();
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

            // Penalties calc for this referee in this match
            const matchEvents = (playerDetails || []).filter(p =>
                String(p.MATCH_ID) === matchId &&
                (String(p.TYPE).toUpperCase() === 'PENGOAL' || String(p.TYPE_SUB).toUpperCase() === 'PENGOAL')
            );
            const penForAhly = matchEvents.filter(p => {
                const t = String(p.TEAM || "");
                return t.toUpperCase().includes('AHLY') || t.includes('الأهلي');
            }).length;
            const penAgainstAhly = matchEvents.length - penForAhly;

            summary.penFor += penForAhly;
            summary.penAgainst += penAgainstAhly;

            summary.matchHistory.push({
                idx: m.MATCH_ID,
                date: m.DATE,
                champion,
                season,
                sy,
                opponent: opp,
                gf, ga, wdl: result,
                penFor: penForAhly,
                penAgainst: penAgainstAhly
            });

            // Aggr logic
            [sy, champion, opp].forEach((key, i) => {
                const target = [summary.seasonalStats, summary.compStats, summary.statsByOpponent][i];
                if (!target[key]) target[key] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 };
                const s = target[key];
                s.matches += 1; s.gs += gf; s.ga += ga;
                if (result === 'W') s.wins += 1; else if (result === 'L') s.losses += 1; else s.draws += 1;
                if (ga === 0) s.csFor += 1;
                if (gf === 0) s.csAgainst += 1;
                s.penFor += penForAhly; s.penAgainst += penAgainstAhly;
            });

            // Detailed Aggregates for Tabs (Next.js components expect these names specifically)
            if (!summary.statsByChampSeason[champion]) summary.statsByChampSeason[champion] = {};
            if (!summary.statsByChampSeason[champion][season]) summary.statsByChampSeason[champion][season] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 };
            const cs = summary.statsByChampSeason[champion][season];
            cs.matches += 1; cs.gs += gf; cs.ga += ga;
            if (result === 'W') cs.wins += 1; else if (result === 'L') cs.losses += 1; else cs.draws += 1;
            if (ga === 0) cs.csFor += 1;
            if (gf === 0) cs.csAgainst += 1;
            cs.penFor += penForAhly; cs.penAgainst += penAgainstAhly;

            if (!summary.statsBySY[sy]) summary.statsBySY[sy] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 };
            const ss = summary.statsBySY[sy];
            ss.matches += 1; ss.gs += gf; ss.ga += ga;
            if (result === 'W') ss.wins += 1; else if (result === 'L') ss.losses += 1; else ss.draws += 1;
            if (ga === 0) ss.csFor += 1;
            if (gf === 0) ss.csAgainst += 1;
            ss.penFor += penForAhly; ss.penAgainst += penAgainstAhly;
        });

        summary.matchHistory.sort((a, b) => {
            const da = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
            const db = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
            return db - da;
        });

        return {
            stats: summary,
            refComps: Array.from(compSet).sort(),
            refSYs: Array.from(sySet).sort((a, b) => b.localeCompare(a)),
            refOpps: Array.from(oppSet).sort()
        };
    }, [refereeName, masterMatches, playerDetails]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = () => {
        let exportData = [];
        let filename = `AlAhly_Referee_${refereeName}_${activeTab}`;
        switch (activeTab) {
            case 'overview':
                exportData = [{ "METRIC": "Matches", "VALUE": stats.matches }, { "METRIC": "Wins", "VALUE": stats.wins }, { "METRIC": "Draws", "VALUE": stats.draws }, { "METRIC": "Losses", "VALUE": stats.losses }, { "METRIC": "GF", "VALUE": stats.gs }, { "METRIC": "GA", "VALUE": stats.ga }];
                break;
            case 'matches':
                exportData = stats.matchHistory.map((m, i) => ({
                    "#": i + 1, "DATE": m.date, "CHAMPION": m.champion, "SEASON": m.season, "SY": m.sy, "OPPONENT": m.opponent, "WDL": m.wdl, "GF": m.gf, "GA": m.ga, "PEN-F": m.penFor, "PEN-A": m.penAgainst
                }));
                break;
            case 'championships':
                exportData = Object.keys(stats.compStats).map((c, i) => {
                    const s = stats.compStats[c];
                    return { "#": i + 1, "CHAMPION": c, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga, "CS-F": s.csFor, "PEN-F": s.penFor };
                });
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
                exportData = Object.keys(stats.statsByOpponent).sort((a, b) => stats.statsByOpponent[b].matches - stats.statsByOpponent[a].matches).map((opp, i) => {
                    const s = stats.statsByOpponent[opp];
                    return { "#": i + 1, "OPPONENT": opp, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GF": s.gs, "GA": s.ga };
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
                        <span>←</span> All Referees
                    </button>
                    <div className="name-and-teams">
                        <h1 className="player-main-name">
                            {refereeName.split(' ').slice(0, -1).join(' ')} <span>{refereeName.split(' ').slice(-1)}</span>
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
                    { id: 'vs_teams', label: 'Vs Teams' }
                ].map(t => (
                    <div key={t.id} className={`player-tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                        <span className="tab-title">{t.label.toUpperCase()}</span>
                    </div>
                ))}
            </div>

            <div className="tab-content-area" style={{ padding: '0px 0' }}>
                {activeTab === 'overview' && <Referee_Overview_Module stats={stats} />}
                {activeTab === 'dashboard' && (
                    <Referee_Dashboard_Module
                        stats={stats}
                        playerComps={refComps}
                        selectedComps={selectedComps}
                        setSelectedComps={setSelectedComps}
                        isCompOpen={isCompOpen}
                        setIsCompOpen={setIsCompOpen}
                        seasonLimit={seasonLimit}
                        setSeasonLimit={setSeasonLimit}
                        sortedSeasons={refSYs}
                    />
                )}
                {activeTab === 'matches' && <Referee_Matches_Module stats={stats} />}
                {activeTab === 'championships' && <Referee_Championships_Module stats={stats} />}
                {activeTab === 'season_name' && <Referee_SeasonName_Module stats={stats} />}
                {activeTab === 'season_number' && <Referee_SeasonNumber_Module stats={stats} />}
                {activeTab === 'vs_teams' && <Referee_VsTeams_Module stats={stats} />}
            </div>
        </div>
    );
}

