"use client";

import { useMemo, useState, useEffect } from "react";
import "./alahly_db_player_details.css"; // Reuse styling
import GK_Overview_Module from "./alahly_db_gk_details_overview";
import GK_Dashboard_Module from "./alahly_db_gk_details_dashboard";
import GK_Matches_Module from "./alahly_db_gk_details_matches";
import GK_Season_Name_Module from "./alahly_db_gk_details_season_name";
import GK_Season_Number_Module from "./alahly_db_gk_details_season_number";
import GK_Vs_Teams_Module from "./alahly_db_gk_details_vs_teams";
import GK_Vs_Players_Module from "./alahly_db_gk_details_vs_players";
import GK_Championships_Module from "./alahly_db_gk_details_championships";
import { AlAhlyService } from "./alahly_db_service";

export default function GK_Details_Hub({ gkName, gkDetails, howPenMissed, masterMatches, playerDetails, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedComps, setSelectedComps] = useState([]);
    const [selectedSYs, setSelectedSYs] = useState([]);
    const [selectedOpps, setSelectedOpps] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isCompOpen, setIsCompOpen] = useState(false);
    const [seasonLimit, setSeasonLimit] = useState('');

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const { stats, gkTeams, gkComps, gkSYs, gkOpps } = useMemo(() => {
        const summary = {
            caps: 0, goalsConceded: 0, cleanSheets: 0, penaltiesSaved: 0, penaltiesReceived: 0,
            matchHistory: [], seasonalStats: {}, compStats: {}, statsByChampSeason: {},
            statsBySY: {}, statsByOpponent: {}, statsByScorer: {}
        };

        if (!gkName || !gkDetails) return { stats: summary, gkTeams: [], gkSYs: [], gkComps: [], gkOpps: [] };

        const isAhly = (t) => {
            const s = String(t).trim();
            return s === "الأهلي" || s === "الأهلى";
        };

        const teamSet = new Set();
        (gkDetails || []).forEach(g => {
            if (String(g["PLAYER NAME"] || "").trim() === gkName) {
                const tv = String(g.TEAM || "").trim();
                if (tv) teamSet.add(tv);
            }
        });
        const uniqueTeams = Array.from(teamSet).sort();

        const matchContextMap = {};
        (masterMatches || []).forEach(m => {
            const mId = String(m.MATCH_ID);
            matchContextMap[mId] = {
                champion: String(m.CHAMPION || "Unknown").trim(),
                season: String(m["SEASON - NAME"] || "Unknown").trim(),
                sy: String(m["SEASON - NUMBER"] || "Unknown").trim(),
                date: m.DATE || "—",
                ahlyT: String(m["AHLY TEAM"] || "الأهلي").trim(),
                oppT: String(m["OPPONENT TEAM"] || "—").trim(),
                gf: parseInt(m.GF || 0),
                ga: parseInt(m.GA || 0)
            };
        });

        const eventLookup = {};
        (playerDetails || []).forEach(p => {
            const key = `${p.MATCH_ID}_${p.EVENT_ID}`;
            eventLookup[key] = p;
        });

        const compSet = new Set();
        const sySet = new Set();
        const oppSet = new Set();

        (gkDetails || []).forEach(g => {
            if (String(g["PLAYER NAME"] || "").trim() === gkName && g.MATCH_ID) {
                const tv = String(g.TEAM || "").trim();
                if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return;

                const ctx = matchContextMap[String(g.MATCH_ID)];
                if (!ctx) return;
                compSet.add(ctx.champion);
                sySet.add(ctx.sy);
                const opp = isAhly(tv) ? ctx.oppT : ctx.ahlyT;
                if (opp && opp !== "—") oppSet.add(opp);
            }
        });

        const filteredGKRows = (gkDetails || []).filter(g => {
            if (String(g["PLAYER NAME"] || "").trim() !== gkName) return false;
            const ctx = matchContextMap[String(g.MATCH_ID)];
            if (!ctx) return false;
            const tv = String(g.TEAM || "").trim();
            const opp = isAhly(tv) ? ctx.oppT : ctx.ahlyT;

            if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return false;
            if (selectedComps.length > 0 && !selectedComps.includes(ctx.champion)) return false;
            if (selectedSYs.length > 0 && !selectedSYs.includes(ctx.sy)) return false;
            if (selectedOpps.length > 0 && !selectedOpps.includes(opp)) return false;
            return true;
        });

        filteredGKRows.forEach(g => {
            const mId = String(g.MATCH_ID);
            const ctx = matchContextMap[mId];
            const tv = String(g.TEAM || "").trim();
            const oppName = isAhly(tv) ? ctx.oppT : ctx.ahlyT;
            const sy = ctx.sy;
            const champion = ctx.champion;
            const season = ctx.season;

            summary.caps += 1;
            const gc = parseInt(g["GOALS CONCEDED"] || 0);
            summary.goalsConceded += gc;

            const isStarter = String(g.STATU || "").trim() === "اساسي";
            const stayedAllMatch = !g["OUT MINUTE"] || String(g["OUT MINUTE"]).trim() === "";
            let isClean = false;
            if (isStarter && stayedAllMatch) {
                if (isAhly(tv) && ctx.ga === 0) isClean = true;
                else if (!isAhly(tv) && ctx.gf === 0) isClean = true;
            }
            if (isClean) summary.cleanSheets += 1;

            const matchPens = (playerDetails || []).filter(p => {
                if (String(p.MATCH_ID) !== mId) return false;
                const isOppScore = String(p.TEAM).trim() !== tv;
                return String(p.TYPE_SUB).toUpperCase() === "PENGOAL" && isOppScore;
            });
            summary.penaltiesReceived += matchPens.length;

            const matchSaves = (howPenMissed || []).filter(row => {
                if (String(row.MATCH_ID) !== mId) return false;
                return String(row["HOW MISSED?"] || "").includes(gkName);
            });
            const matchMisses = (howPenMissed || []).filter(row => {
                if (String(row.MATCH_ID) !== mId) return false;
                const isOpponent = String(row.TEAM).trim() !== tv;
                const wasSaved = String(row["HOW MISSED?"] || "").includes(gkName);
                return isOpponent && !wasSaved;
            });
            summary.penaltiesSaved += matchSaves.length + matchMisses.length;

            [sy, champion, oppName].forEach((key, i) => {
                const target = [summary.seasonalStats, summary.compStats, summary.statsByOpponent][i];
                if (!target[key]) target[key] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, gc: 0, cs: 0, ps: 0, pr: 0 };
                const t = target[key];
                t.matches += 1; t.gc += gc; if (isClean) t.cs += 1; t.ps += matchSaves.length; t.pr += matchPens.length;

                // Add team record (gf/ga from Ahly's point of view)
                t.gs += isAhly(tv) ? ctx.gf : ctx.ga;
                t.ga += isAhly(tv) ? ctx.ga : ctx.gf;
                const matchResult = isAhly(tv) ? (ctx.gf > ctx.ga ? 'W' : ctx.gf < ctx.ga ? 'L' : 'D') : (ctx.ga > ctx.gf ? 'W' : ctx.ga < ctx.gf ? 'L' : 'D');
                if (matchResult === 'W') t.wins += 1; else if (matchResult === 'L') t.losses += 1; else t.draws += 1;
            });

            if (!summary.statsByChampSeason[champion]) summary.statsByChampSeason[champion] = {};
            if (!summary.statsByChampSeason[champion][season]) summary.statsByChampSeason[champion][season] = { matches: 0, wins: 0, draws: 0, losses: 0, gc: 0, cs: 0, ps: 0, pr: 0 };
            const mcs = summary.statsByChampSeason[champion][season];
            mcs.matches += 1; mcs.gc += gc; if (isClean) mcs.cs += 1; mcs.ps += matchSaves.length; mcs.pr += matchPens.length;

            if (!summary.statsBySY[sy]) summary.statsBySY[sy] = { matches: 0, wins: 0, draws: 0, losses: 0, gc: 0, cs: 0, ps: 0, pr: 0 };
            const msy = summary.statsBySY[sy];
            msy.matches += 1; msy.gc += gc; if (isClean) msy.cs += 1; msy.ps += matchSaves.length; msy.pr += matchPens.length;

            const mResult = isAhly(tv) ? (ctx.gf > ctx.ga ? 'W' : ctx.gf < ctx.ga ? 'L' : 'D') : (ctx.ga > ctx.gf ? 'W' : ctx.ga < ctx.gf ? 'L' : 'D');
            const mGF = isAhly(tv) ? ctx.gf : ctx.ga;
            const mGA = isAhly(tv) ? ctx.ga : ctx.gf;

            summary.matchHistory.push({
                idx: mId, date: ctx.date, champion, season, sy, opponent: oppName,
                role: g.STATU || 'اساسي',
                mins: g["TOTAL MINUTE"] || 90,
                gc, clean: isClean,
                ps: matchSaves.length,
                pm: matchMisses.length,
                psm: matchSaves.length + matchMisses.length,
                pg: matchPens.length,
                result: mResult,
                score: `${mGF}-${mGA}`
            });

            // Scorer Calculation
            const opponentGoalsRow = (playerDetails || []).filter(p => {
                if (String(p.MATCH_ID) !== mId) return false;
                const isOpponent = String(p.TEAM).trim() !== tv;
                const typeSub = String(p.TYPE_SUB || "").toUpperCase();
                const type = String(p.TYPE || "").toUpperCase();
                const isGoal = (type === "GOAL" || typeSub.includes("GOAL") || typeSub.includes("GDAL")) && !typeSub.includes("ASSIST");
                return isOpponent && isGoal;
            });
            opponentGoalsRow.forEach(r => {
                const sName = String(r["PLAYER NAME"] || "Unknown").trim();
                const sTeam = String(r.TEAM || "Unknown").trim();
                if (!summary.statsByScorer[sName]) summary.statsByScorer[sName] = { goals: 0, pens_scored: 0, pens_saved: 0, teams: new Set() };
                summary.statsByScorer[sName].goals += 1;
                if (String(r.TYPE_SUB).toUpperCase() === "PENGOAL") summary.statsByScorer[sName].pens_scored += 1;
                summary.statsByScorer[sName].teams.add(sTeam);
            });

            // Individual Penalty Saves - Correct linking via EVENT_ID
            matchSaves.forEach(row => {
                const lookupKey = `${row.MATCH_ID}_${row.EVENT_ID}`;
                const eventRow = eventLookup[lookupKey];
                const sName = eventRow ? String(eventRow["PLAYER NAME"]).trim() : (String(row["PLAYER NAME"] || "Unknown").trim());
                const sTeam = eventRow ? String(eventRow.TEAM).trim() : (String(row.TEAM || "Unknown").trim());
                if (!summary.statsByScorer[sName]) summary.statsByScorer[sName] = { goals: 0, pens_scored: 0, pens_saved: 0, teams: new Set() };
                summary.statsByScorer[sName].pens_saved += 1;
                summary.statsByScorer[sName].teams.add(sTeam);
            });
        });

        summary.matchHistory.sort((a, b) => {
            const da = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
            const db = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
            return db - da;
        });

        // Calculate ALL Streaks >= 3 matches
        let allStreaksCS = [];
        let allStreaksGC = [];

        let currentCSMatches = [];
        let currentGCMatches = [];

        const chronologicalHistory = [...summary.matchHistory].sort((a, b) => {
            const da = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
            const db = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
            return da - db;
        });

        chronologicalHistory.forEach(m => {
            if (m.clean) {
                currentCSMatches.push(m);
                // End any ongoing GC streak
                if (currentGCMatches.length >= 3) {
                    allStreaksGC.push({ length: currentGCMatches.length, matches: [...currentGCMatches], startDate: currentGCMatches[0].date });
                }
                currentGCMatches = [];
            } else {
                currentGCMatches.push(m);
                // End any ongoing CS streak
                if (currentCSMatches.length >= 3) {
                    allStreaksCS.push({ length: currentCSMatches.length, matches: [...currentCSMatches], startDate: currentCSMatches[0].date });
                }
                currentCSMatches = [];
            }
        });

        // Final check for end of history
        if (currentCSMatches.length >= 3) allStreaksCS.push({ length: currentCSMatches.length, matches: [...currentCSMatches], startDate: currentCSMatches[0].date });
        if (currentGCMatches.length >= 3) allStreaksGC.push({ length: currentGCMatches.length, matches: [...currentGCMatches], startDate: currentGCMatches[0].date });

        // Sorting: Length DESC, then Date DESC
        const sortStreaks = (arr) => arr.sort((a, b) => {
            if (b.length !== a.length) return b.length - a.length;
            const da = a.startDate ? new Date(a.startDate.split('/').reverse().join('-')) : new Date(0);
            const db = b.startDate ? new Date(b.startDate.split('/').reverse().join('-')) : new Date(0);
            return db - da;
        });

        summary.allStreaksCS = sortStreaks(allStreaksCS);
        summary.allStreaksGC = sortStreaks(allStreaksGC);

        // Keep compat for old props (using best one)
        summary.maxCSStreak = summary.allStreaksCS[0]?.length || 0;
        summary.maxCSMatches = summary.allStreaksCS[0]?.matches || [];
        summary.maxGCStreak = summary.allStreaksGC[0]?.length || 0;
        summary.maxGCMatches = summary.allStreaksGC[0]?.matches || [];

        return {
            stats: summary,
            gkTeams: uniqueTeams,
            gkComps: Array.from(compSet).sort(),
            gkSYs: Array.from(sySet).sort((a, b) => b.localeCompare(a)),
            gkOpps: Array.from(oppSet).sort()
        };
    }, [gkName, gkDetails, masterMatches, howPenMissed, playerDetails, selectedTeams, selectedComps, selectedSYs, selectedOpps]);

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = () => {
        let exportData = [];
        let filename = `AlAhly_GK_${gkName}_${activeTab}`;
        switch (activeTab) {
            case 'overview':
                exportData = [{ "METRIC": "Matches", "VALUE": stats.caps }, { "METRIC": "GC", "VALUE": stats.goalsConceded }, { "METRIC": "CS", "VALUE": stats.cleanSheets }, { "METRIC": "PS", "VALUE": stats.penaltiesSaved }, { "METRIC": "PR", "VALUE": stats.penaltiesReceived }];
                break;
            case 'matches':
                exportData = stats.matchHistory.map((m, i) => ({
                    "#": i + 1, "DATE": m.date, "CHAMPION": m.champion, "SEASON": m.season, "SY": m.sy, "OPPONENT": m.opponent, "MINS": m.mins, "GC": m.gc, "CLEAN": m.clean ? "YES" : "NO", "PSM": m.psm, "PG": m.pg
                }));
                break;
            case 'championships':
                exportData = Object.keys(stats.compStats).map((c, i) => {
                    const s = stats.compStats[c];
                    return { "#": i + 1, "CHAMPION": c, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GS": s.gs, "GA": s.ga, "GK-GC": s.gc, "GK-CS": s.cs, "GK-PS": s.ps };
                });
                break;
            case 'season_name':
                exportData = [];
                Object.keys(stats.statsByChampSeason).forEach(comp => {
                    Object.keys(stats.statsByChampSeason[comp]).forEach(season => {
                        const s = stats.statsByChampSeason[comp][season];
                        exportData.push({ "CHAMPION": comp, "SEASON": season, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GC": s.gc, "CS": s.cs, "PS": s.ps });
                    });
                });
                break;
            case 'season_number':
                exportData = Object.keys(stats.statsBySY).sort((a, b) => b.localeCompare(a)).map((sy, i) => {
                    const s = stats.statsBySY[sy];
                    return { "#": i + 1, "SY": sy, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GC": s.gc, "CS": s.cs, "PS": s.ps };
                });
                break;
            case 'vs_teams':
                exportData = Object.keys(stats.statsByOpponent).sort((a, b) => stats.statsByOpponent[b].matches - stats.statsByOpponent[a].matches).map((opp, i) => {
                    const s = stats.statsByOpponent[opp];
                    return { "#": i + 1, "OPPONENT": opp, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GC": s.gc, "CS": s.cs, "PS": s.ps };
                });
                break;
            case 'vs_players':
                exportData = Object.keys(stats.statsByScorer).sort((a, b) => stats.statsByScorer[b].goals - stats.statsByScorer[a].goals).map((p, i) => {
                    const s = stats.statsByScorer[p];
                    return { "#": i + 1, "SCORER": p, "TEAMS": Array.from(s.teams).join(', '), "G": s.goals, "PG": s.pens_scored, "PS": s.pens_saved };
                });
                break;
        }
        if (exportData.length > 0) AlAhlyService.exportToExcel(exportData, filename);
    };

    if (!gkName) return null;

    return (
        <div className="player-details-container">
            {/* Header Section */}
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}>
                        <span>←</span> All GK's
                    </button>
                    <div className="name-and-teams" style={{ display: 'flex', alignItems: 'center', gap: '25px', flexWrap: 'wrap' }}>
                        <h1 className="player-main-name" style={{ margin: 0 }}>
                            {gkName.split(' ').slice(0, -1).join(' ')} <span>{gkName.split(' ').slice(-1)}</span>
                        </h1>
                    </div>
                </div>

                <div className="hero-stats-quick" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button className="advanced-filter-btn" onClick={() => setIsFilterModalOpen(true)}>
                        ADVANCED FILTERS
                    </button>
                    <div className="quick-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'Space Mono', letterSpacing: '2px' }}>MATCHES</div>
                        <div style={{ color: 'var(--player-gold)', fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '2px' }}>{stats.caps}</div>
                    </div>
                </div>
            </div>

            {/* Filter Modal - Sculpted from PlayerDetails */}
            {isFilterModalOpen && (
                <div className="p-modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="p-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-modal-header">
                            <h2>GK ADVANCED FILTERS</h2>
                            <button className="p-close-btn" onClick={() => setIsFilterModalOpen(false)}>×</button>
                        </div>
                        <div className="p-modal-body">
                            {/* Team Filters */}
                            <div className="filter-group">
                                <label>TEAMS REPRESENTED</label>
                                <div className="checkbox-grid">
                                    {gkTeams.map(team => (
                                        <div key={team} className={`check-item ${selectedTeams.includes(team) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (selectedTeams.includes(team)) setSelectedTeams(selectedTeams.filter(t => t !== team));
                                                else setSelectedTeams([...selectedTeams, team]);
                                            }}>
                                            <div className="custom-check"></div>
                                            <span>{team}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Competition Filters */}
                            <div className="filter-group">
                                <label>COMPETITIONS</label>
                                <div className="checkbox-grid">
                                    {gkComps.map(comp => (
                                        <div key={comp} className={`check-item ${selectedComps.includes(comp) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (selectedComps.includes(comp)) setSelectedComps(selectedComps.filter(c => c !== comp));
                                                else setSelectedComps([...selectedComps, comp]);
                                            }}>
                                            <div className="custom-check"></div>
                                            <span>{comp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Season Filters */}
                            <div className="filter-group">
                                <label>SEASONS (SY)</label>
                                <div className="checkbox-grid">
                                    {gkSYs.map(sy => (
                                        <div key={sy} className={`check-item ${selectedSYs.includes(sy) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (selectedSYs.includes(sy)) setSelectedSYs(selectedSYs.filter(s => s !== sy));
                                                else setSelectedSYs([...selectedSYs, sy]);
                                            }}>
                                            <div className="custom-check"></div>
                                            <span>{sy}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Opponent Filters */}
                            <div className="filter-group">
                                <label>OPPONENTS FACED</label>
                                <div className="checkbox-grid">
                                    {gkOpps.map(opp => (
                                        <div key={opp} className={`check-item ${selectedOpps.includes(opp) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (selectedOpps.includes(opp)) setSelectedOpps(selectedOpps.filter(o => o !== opp));
                                                else setSelectedOpps([...selectedOpps, opp]);
                                            }}>
                                            <div className="custom-check"></div>
                                            <span>{opp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-modal-footer">
                            <button className="clear-btn" onClick={() => { setSelectedTeams([]); setSelectedComps([]); setSelectedSYs([]); setSelectedOpps([]); }}>CLEAR ALL</button>
                            <button className="apply-btn" onClick={() => setIsFilterModalOpen(false)}>APPLY FILTERS</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="player-details-tabs">
                {['overview', 'dashboard', 'matches', 'championships', 'season_name', 'season_number', 'vs_teams', 'vs_players'].map(t => (
                    <div key={t} className={`player-tab-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                        <span className="tab-title">{t.replace('_', ' ').toUpperCase()}</span>
                    </div>
                ))}
            </div>

            {activeTab === 'overview' && <GK_Overview_Module stats={stats} />}
            {activeTab === 'dashboard' && (
                <GK_Dashboard_Module
                    stats={stats}
                    playerComps={gkComps}
                    selectedComps={selectedComps}
                    setSelectedComps={setSelectedComps}
                    isCompOpen={isCompOpen}
                    setIsCompOpen={setIsCompOpen}
                    seasonLimit={seasonLimit}
                    setSeasonLimit={setSeasonLimit}
                    sortedSeasons={Object.keys(stats.seasonalStats).sort((a, b) => b.localeCompare(a))}
                />
            )}
            {activeTab === 'matches' && (
                <GK_Matches_Module
                    stats={stats}
                    gkName={gkName}
                    playerDetails={playerDetails}
                    gkDetails={gkDetails}
                    renderEventsCell={(m) => {
                        return (
                            <div className="m-stats-cell" style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', alignItems: 'center' }}>
                                {m.gc > 0 && <div className="m-mini-pill mini-g" style={{ background: '#e74c3c' }} title="Goals Conceded">{m.gc}GC</div>}
                                {m.clean && <div className="m-mini-pill" style={{ background: '#2ecc71', color: '#fff' }} title="Clean Sheet">CS</div>}
                                {m.psm > 0 && <div className="m-mini-pill mini-a" title={`Penalty Defended (Saved: ${m.ps}, Missed: ${m.pm})`}>{m.psm}PS</div>}
                                {m.pg > 0 && <div className="m-mini-pill mini-p" style={{ background: '#9b59b6' }} title="Penalty Goal Conceded">{m.pg}PG</div>}
                                {m.gc === 0 && !m.clean && m.psm === 0 && <span style={{ color: '#eee' }}>—</span>}
                            </div>
                        );
                    }}
                />
            )}
            {activeTab === 'championships' && <GK_Championships_Module stats={stats} />}
            {activeTab === 'season_name' && <GK_Season_Name_Module stats={stats} />}
            {activeTab === 'season_number' && <GK_Season_Number_Module stats={stats} />}
            {activeTab === 'vs_teams' && <GK_Vs_Teams_Module stats={stats} />}
            {activeTab === 'vs_players' && <GK_Vs_Players_Module stats={stats} />}

            <style jsx>{`
                .advanced-filter-btn { background: rgba(201, 168, 76, 0.1); border: 1px solid var(--player-gold); color: var(--player-gold); padding: 12px 24px; border-radius: 12px; font-family: 'Space Mono'; font-weight: 700; font-size: 11px; cursor: pointer; transition: 0.3s; }
                .advanced-filter-btn:hover { background: var(--player-gold); color: #000; box-shadow: 0 0 20px rgba(201,168,76,0.2); }
                .p-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
                .p-modal-content { background: #fff; border: 1px solid #eee; width: 90%; max-width: 700px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.1); animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes modalPop { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                .p-modal-header { padding: 25px 35px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
                .p-modal-header h2 { font-family: 'Bebas Neue'; color: #000; letter-spacing: 2px; margin: 0; font-size: 24px; }
                .p-close-btn { background: none; border: none; color: #999; font-size: 32px; cursor: pointer; transition: 0.3s; }
                .p-close-btn:hover { color: #000; }
                .p-modal-body { padding: 35px; max-height: 60vh; overflow-y: auto; }
                .p-modal-body::-webkit-scrollbar { width: 5px; }
                .p-modal-body::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
                .filter-group { margin-bottom: 35px; }
                .filter-group label { display: block; color: var(--player-gold); font-family: 'Space Mono'; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; }
                .checkbox-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                .check-item { background: #f9f9f9; padding: 14px 20px; border-radius: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.2s; border: 1px solid #eee; }
                .check-item:hover { background: #f0f0f0; border-color: #ddd; }
                .check-item.active { background: rgba(201, 168, 76, 0.05); border-color: var(--player-gold); }
                .custom-check { width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; position: relative; transition: 0.2s; background: #fff; }
                .check-item.active .custom-check { border-color: var(--player-gold); background: var(--player-gold); }
                .check-item.active .custom-check::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -52%); color: #000; font-size: 12px; font-weight: 900; }
                .check-item span { color: #333; font-size: 13px; font-weight: 600; font-family: 'Outfit'; }
                .p-modal-footer { padding: 25px 35px; background: #fafafa; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 20px; }
                .clear-btn { background: none; border: none; color: #999; font-family: 'Space Mono'; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .clear-btn:hover { color: #333; }
                .apply-btn { background: var(--player-gold); color: #000; border: none; padding: 12px 35px; border-radius: 12px; font-family: 'Space Mono'; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .apply-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(201,168,76,0.15); }
            `}</style>
        </div>
    );
}
