"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../lib/NoData_db";
import { EgyptNTService } from "./egypt_nt_db_service";

// Inline modules to keep files organized without adding extra file overhead
function GK_Overview_Module({ stats }) {
    const [popupData, setPopupData] = useState(null);
    const [activeStreakIdx, setActiveStreakIdx] = useState(0);

    const openStreakPopup = (type) => {
        const streaks = type === 'cs' ? stats.allStreaksCS : stats.allStreaksGC;
        if (streaks?.length > 0) {
            setPopupData({
                type,
                title: type === 'cs' ? "Clean Sheet Streaks (3+ matches)" : "Conceded Streaks (3+ matches)",
                allStreaks: streaks,
                color: type === 'cs' ? "#27ae60" : "#e74c3c"
            });
            setActiveStreakIdx(0);
        }
    };

    const currentStreak = popupData?.allStreaks[activeStreakIdx];

    return (
        <div className="stats-grid-premium fade-in">
            <div className="stat-card-premium">
                <span className="stat-label-modern">Total Appearances</span>
                <div className="stat-value-modern" style={{ color: 'var(--gold)' }}>{stats.caps}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheets</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.cleanSheets}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Goals Conceded</span>
                <div className="stat-value-modern" style={{ color: stats.goalsConceded > 0 ? '#e74c3c' : '#27ae60' }}>{stats.goalsConceded}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Conceded Per Game</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{stats.caps > 0 ? (stats.goalsConceded / stats.caps).toFixed(2) : 0}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheet Rate</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.caps > 0 ? ((stats.cleanSheets / stats.caps) * 100).toFixed(1) : 0}%</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Received</span>
                <div className="stat-value-modern" style={{ color: '#9b59b6' }}>{stats.penaltiesReceived}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Saved</span>
                <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.penaltiesSaved}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalty Save Rate</span>
                <div className="stat-value-modern" style={{ color: '#3498db' }}>{stats.penaltiesReceived > 0 ? ((stats.penaltiesSaved / stats.penaltiesReceived) * 100).toFixed(1) : 0}%</div>
            </div>

            <div className="stat-card-premium clickable-streak" onClick={() => openStreakPopup('cs')} style={{ cursor: 'pointer', transition: '0.3s' }}>
                <span className="stat-label-modern">Max Clean Sheet Streak</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.maxCSStreak || 0}</div>
                <div className="streak-info-hint">Click for all streaks ({stats.allStreaksCS?.length || 0})</div>
            </div>
            <div className="stat-card-premium clickable-streak" onClick={() => openStreakPopup('gc')} style={{ cursor: 'pointer', transition: '0.3s' }}>
                <span className="stat-label-modern">Max Conceded Streak</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.maxGCStreak || 0}</div>
                <div className="streak-info-hint">Click for all streaks ({stats.allStreaksGC?.length || 0})</div>
            </div>

            {popupData && (
                <div className="streak-modal-overlay fade-in" onClick={() => setPopupData(null)}>
                    <div className="streak-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="streak-modal-header" style={{ borderBottom: `4px solid ${popupData.color}` }}>
                            <div className="streak-modal-title">{popupData.title}</div>
                            <div className="streak-nav-pill-container">
                                {popupData.allStreaks.map((s, idx) => (
                                    <button key={idx} className={`streak-nav-pill ${activeStreakIdx === idx ? 'active' : ''}`} onClick={() => setActiveStreakIdx(idx)} style={{ '--streak-color': popupData.color }}>
                                        #{idx + 1} ({s.length} Matches)
                                    </button>
                                ))}
                            </div>
                            <div className="streak-modal-range">📅 {currentStreak.matches[0].date} — {currentStreak.matches[currentStreak.matches.length - 1].date}</div>
                            <button className="close-streak-modal" onClick={() => setPopupData(null)}>&times;</button>
                        </div>
                        <div className="streak-matches-wrapper">
                            <table className="streak-table-modern">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>#</th>
                                        <th>MATCH ID</th>
                                        <th>DATE</th>
                                        <th>SEASON</th>
                                        <th>OPPONENT</th>
                                        {popupData.type === 'gc' && <th style={{ width: '100px' }}>GC</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentStreak.matches.map((m, i) => (
                                        <tr key={i}>
                                            <td className="st-idx-num">{i + 1}</td>
                                            <td className="st-id">{m.idx}</td>
                                            <td className="st-date">{m.date}</td>
                                            <td className="st-season">{m.season}</td>
                                            <td className="st-opp">{m.opponent}</td>
                                            {popupData.type === 'gc' && <td className="st-gc-val" style={{ color: '#e74c3c', fontWeight: '900' }}>{m.gc}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function GK_Matches_Module({ stats, renderEventsCell }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('all');
    const [threshold, setThreshold] = useState(1);
    const [operator, setOperator] = useState('>=');
    const pageSize = 50;

    const filteredMatches = useMemo(() => {
        return stats.matchHistory.filter(m => {
            if (filter === 'all') return true;
            let val = 0;
            if (filter === 'gc') val = (m.gc || 0);
            else if (filter === 'cs') val = (m.gc === 0 ? 1 : 0);
            else if (filter === 'psm') val = (m.psm || 0);
            else if (filter === 'pg') val = (m.pg || 0);

            const numThreshold = parseInt(threshold) || 1;
            if (operator === '>=') return val >= numThreshold;
            if (operator === '==') return val === numThreshold;
            if (operator === '<=') return val <= numThreshold && val > 0;
            return true;
        });
    }, [stats.matchHistory, filter, threshold, operator]);

    const totalMatchesNum = filteredMatches.length;
    const totalPages = Math.ceil(totalMatchesNum / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentMatches = filteredMatches.slice(startIdx, startIdx + pageSize);

    return (
        <div className="history-section fade-in">
            <div className="history-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
                <div className="history-title" style={{ textAlign: 'center' }}>
                    GK MATCHES PLAYED <span style={{ color: '#aaa', fontSize: '12px', letterSpacing: '1px', marginLeft: '10px' }}>({totalMatchesNum} GAMES)</span>
                </div>
                <div className="event-filters-wrap" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div className="filter-controls-group" style={{ display: 'flex', gap: '5px', background: '#fff', padding: '5px', borderRadius: '15px', border: '1px solid #e0e0e0' }}>
                        <select value={filter} onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }} className="event-white-select type-select">
                            <option value="all">ALL MATCHES</option>
                            <option value="gc">GOALS CONC.</option>
                            <option value="cs">CLEAN SHEETS</option>
                            <option value="psm">PEN SAVED</option>
                            <option value="pg">PEN GOALS</option>
                        </select>
                        {filter !== 'all' && (
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <select value={operator} onChange={(e) => { setOperator(e.target.value); setCurrentPage(1); }} className="event-white-select op-select">
                                    <option value=">=">≥</option>
                                    <option value="==">=</option>
                                    <option value="<=">≤</option>
                                </select>
                                <input type="number" min="1" value={threshold} onChange={(e) => { setThreshold(e.target.value); setCurrentPage(1); }} className="event-white-input" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>MATCH ID</th>
                            <th>DATE</th>
                            <th>SEASON</th>
                            <th>OPPONENT TEAM</th>
                            <th>STATUS</th>
                            <th>TIME</th>
                            <th>GOALS CONC.</th>
                            <th>STATS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentMatches.length > 0 ? (
                            currentMatches.map((m, idx) => (
                                <tr key={idx}>
                                    <td>{startIdx + idx + 1}</td>
                                    <td>{m.idx}</td>
                                    <td>{m.date}</td>
                                    <td>{m.season}</td>
                                    <td>{m.opponent}</td>
                                    <td><span className={`m-role-pill ${m.role === 'اساسي' ? 'role-starter' : 'role-sub'}`}>{m.role === 'اساسي' || !m.role ? 'Starter' : 'Sub'}</span></td>
                                    <td>{m.mins}'</td>
                                    <td style={{ color: m.gc > 0 ? '#e74c3c' : '#2ecc71', fontWeight: '900' }}>{m.gc}</td>
                                    <td>{renderEventsCell(m)}</td>
                                </tr>
                            ))
                        ) : (
                            <NoData_db isTable={true} colSpan={9} message="No match records found." />
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="p-pagination" style={{ marginTop: '20px', justifyContent: 'center' }}>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>←</button>
                    <span>PAGE {currentPage} OF {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>→</button>
                </div>
            )}
        </div>
    );
}

function GK_Championships_Module({ stats }) {
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
                    <th>GS</th>
                    <th>GA</th>
                    <th>CONCEDED</th>
                    <th>CLEAN SHEETS</th>
                    <th>PEN SAVED</th>
                </tr>
            </thead>
            <tbody>
                {list.map(c => (
                    <tr key={c.name}>
                        <td style={{ fontWeight: '800', color: 'var(--gold)' }}>{c.name}</td>
                        <td>{c.matches}</td>
                        <td>{c.wins}</td>
                        <td>{c.draws}</td>
                        <td>{c.losses}</td>
                        <td>{c.gs}</td>
                        <td>{c.ga}</td>
                        <td style={{ color: '#e74c3c', fontWeight: '800' }}>{c.gc}</td>
                        <td style={{ color: '#2ecc71', fontWeight: '800' }}>{c.cs}</td>
                        <td>{c.ps}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function GK_Seasons_Module({ stats, isNumberMode }) {
    const dataObj = isNumberMode ? stats.statsBySY : stats.statsByChampSeason;
    const list = [];
    if (isNumberMode) {
        Object.keys(dataObj).forEach(sy => list.push({ key: sy, ...dataObj[sy] }));
        list.sort((a, b) => b.key.localeCompare(a.key));
    } else {
        Object.keys(dataObj).forEach(comp => {
            Object.keys(dataObj[comp]).forEach(season => {
                list.push({ key: `${comp} - ${season}`, ...dataObj[comp][season] });
            });
        });
        list.sort((a, b) => b.matches - a.matches);
    }
    return (
        <table className="player-match-table fade-in">
            <thead>
                <tr>
                    <th>SEASON</th>
                    <th>MP</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>CONCEDED</th>
                    <th>CLEAN SHEETS</th>
                    <th>PEN SAVED</th>
                </tr>
            </thead>
            <tbody>
                {list.map(s => (
                    <tr key={s.key}>
                        <td style={{ fontWeight: '800', color: 'var(--gold)' }}>{s.key}</td>
                        <td>{s.matches}</td>
                        <td>{s.wins}</td>
                        <td>{s.draws}</td>
                        <td>{s.losses}</td>
                        <td style={{ color: '#e74c3c', fontWeight: '800' }}>{s.gc}</td>
                        <td style={{ color: '#2ecc71', fontWeight: '800' }}>{s.cs}</td>
                        <td>{s.ps}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function GK_VsTeams_Module({ stats }) {
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
                    <th>CONCEDED</th>
                    <th>CLEAN SHEETS</th>
                    <th>PEN SAVED</th>
                </tr>
            </thead>
            <tbody>
                {list.map(t => (
                    <tr key={t.name}>
                        <td style={{ fontWeight: '800', color: 'var(--gold)' }}>{t.name}</td>
                        <td>{t.matches}</td>
                        <td>{t.wins}</td>
                        <td>{t.draws}</td>
                        <td>{t.losses}</td>
                        <td style={{ color: '#e74c3c', fontWeight: '800' }}>{t.gc}</td>
                        <td style={{ color: '#2ecc71', fontWeight: '800' }}>{t.cs}</td>
                        <td>{t.ps}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function GK_VsPlayers_Module({ stats }) {
    const list = Object.keys(stats.statsByScorer).map(p => ({ name: p, ...stats.statsByScorer[p] })).sort((a, b) => b.goals - a.goals);
    return (
        <table className="player-match-table fade-in">
            <thead>
                <tr>
                    <th>SCORER NAME</th>
                    <th>TEAMS</th>
                    <th>GOALS SCORED</th>
                    <th>PEN SCORED</th>
                    <th>PEN SAVED/DEFENDED</th>
                </tr>
            </thead>
            <tbody>
                {list.map(p => (
                    <tr key={p.name}>
                        <td style={{ fontWeight: '800', color: '#000' }}>{p.name}</td>
                        <td style={{ color: '#666' }}>{Array.from(p.teams).join(', ')}</td>
                        <td style={{ color: '#e74c3c', fontWeight: '800' }}>{p.goals}</td>
                        <td>{p.pens_scored}</td>
                        <td style={{ color: '#27ae60', fontWeight: '800' }}>{p.pens_saved}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function EgyptNTGKDetails({ gkName, gkDetails, howPenMissed, masterMatches, playerDetails, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedComps, setSelectedComps] = useState([]);
    const [selectedSYs, setSelectedSYs] = useState([]);
    const [selectedOpps, setSelectedOpps] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const { stats, gkTeams, gkComps, gkSYs, gkOpps } = useMemo(() => {
        const summary = {
            caps: 0, goalsConceded: 0, cleanSheets: 0, penaltiesSaved: 0, penaltiesReceived: 0,
            matchHistory: [], seasonalStats: {}, compStats: {}, statsByChampSeason: {},
            statsBySY: {}, statsByOpponent: {}, statsByScorer: {}
        };

        if (!gkName || !gkDetails) return { stats: summary, gkTeams: [], gkSYs: [], gkComps: [], gkOpps: [] };

        const isEgyptTeam = (t) => {
            if (!t) return false;
            const s = String(t).trim();
            return s === "مصر" || s === "Egypt" || s === "منتخب مصر" || s === "المنتخب المصري";
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
                egyptT: String(m["AHLY TEAM"] || "مصر").trim(),
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
                const opp = isEgyptTeam(tv) ? ctx.oppT : ctx.egyptT;
                if (opp && opp !== "—") oppSet.add(opp);
            }
        });

        const filteredGKRows = (gkDetails || []).filter(g => {
            if (String(g["PLAYER NAME"] || "").trim() !== gkName) return false;
            const ctx = matchContextMap[String(g.MATCH_ID)];
            if (!ctx) return false;
            const tv = String(g.TEAM || "").trim();
            const opp = isEgyptTeam(tv) ? ctx.oppT : ctx.egyptT;

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
            const oppName = isEgyptTeam(tv) ? ctx.oppT : ctx.egyptT;
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
                if (isEgyptTeam(tv) && ctx.ga === 0) isClean = true;
                else if (!isEgyptTeam(tv) && ctx.gf === 0) isClean = true;
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

                t.gs += isEgyptTeam(tv) ? ctx.gf : ctx.ga;
                t.ga += isEgyptTeam(tv) ? ctx.ga : ctx.gf;
                const matchResult = isEgyptTeam(tv) ? (ctx.gf > ctx.ga ? 'W' : ctx.gf < ctx.ga ? 'L' : 'D') : (ctx.ga > ctx.gf ? 'W' : ctx.ga < ctx.gf ? 'L' : 'D');
                if (matchResult === 'W') t.wins += 1; else if (matchResult === 'L') t.losses += 1; else t.draws += 1;
            });

            if (!summary.statsByChampSeason[champion]) summary.statsByChampSeason[champion] = {};
            if (!summary.statsByChampSeason[champion][season]) summary.statsByChampSeason[champion][season] = { matches: 0, wins: 0, draws: 0, losses: 0, gc: 0, cs: 0, ps: 0, pr: 0 };
            const mcs = summary.statsByChampSeason[champion][season];
            mcs.matches += 1; mcs.gc += gc; if (isClean) mcs.cs += 1; mcs.ps += matchSaves.length; mcs.pr += matchPens.length;

            if (!summary.statsBySY[sy]) summary.statsBySY[sy] = { matches: 0, wins: 0, draws: 0, losses: 0, gc: 0, cs: 0, ps: 0, pr: 0 };
            const msy = summary.statsBySY[sy];
            msy.matches += 1; msy.gc += gc; if (isClean) msy.cs += 1; msy.ps += matchSaves.length; msy.pr += matchPens.length;

            const mResult = isEgyptTeam(tv) ? (ctx.gf > ctx.ga ? 'W' : ctx.gf < ctx.ga ? 'L' : 'D') : (ctx.ga > ctx.gf ? 'W' : ctx.ga < ctx.gf ? 'L' : 'D');
            const mGF = isEgyptTeam(tv) ? ctx.gf : ctx.ga;
            const mGA = isEgyptTeam(tv) ? ctx.ga : ctx.gf;

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
                if (currentGCMatches.length >= 3) allStreaksGC.push({ length: currentGCMatches.length, matches: [...currentGCMatches], startDate: currentGCMatches[0].date });
                currentGCMatches = [];
            } else {
                currentGCMatches.push(m);
                if (currentCSMatches.length >= 3) allStreaksCS.push({ length: currentCSMatches.length, matches: [...currentCSMatches], startDate: currentCSMatches[0].date });
                currentCSMatches = [];
            }
        });

        if (currentCSMatches.length >= 3) allStreaksCS.push({ length: currentCSMatches.length, matches: [...currentCSMatches], startDate: currentCSMatches[0].date });
        if (currentGCMatches.length >= 3) allStreaksGC.push({ length: currentGCMatches.length, matches: [...currentGCMatches], startDate: currentGCMatches[0].date });

        const sortStreaks = (arr) => arr.sort((a, b) => {
            if (b.length !== a.length) return b.length - a.length;
            const da = a.startDate ? new Date(a.startDate.split('/').reverse().join('-')) : new Date(0);
            const db = b.startDate ? new Date(b.startDate.split('/').reverse().join('-')) : new Date(0);
            return db - da;
        });

        summary.allStreaksCS = sortStreaks(allStreaksCS);
        summary.allStreaksGC = sortStreaks(allStreaksGC);
        summary.maxCSStreak = summary.allStreaksCS[0]?.length || 0;
        summary.maxGCStreak = summary.allStreaksGC[0]?.length || 0;

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
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = () => {
        let exportData = [];
        let filename = `EgyptNT_GK_${gkName}_${activeTab}`;
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
        if (exportData.length > 0) EgyptNTService.exportToExcel(exportData, filename);
    };

    if (!gkName) return null;

    return (
        <div className="player-details-container">
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}><span>←</span> All GK's</button>
                    <h1 className="player-main-name">
                        {gkName.split(' ').slice(0, -1).join(' ')} <span>{gkName.split(' ').slice(-1)}</span>
                    </h1>
                </div>
                <div className="hero-stats-quick" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="advanced-filter-btn" onClick={() => setIsFilterModalOpen(true)}>ADVANCED FILTERS</button>
                    <div className="quick-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'Space Mono', letterSpacing: '2px' }}>MATCHES</div>
                        <div style={{ color: 'var(--gold)', fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '2px' }}>{stats.caps}</div>
                    </div>
                </div>
            </div>

            {isFilterModalOpen && (
                <div className="p-modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="p-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-modal-header">
                            <h2>GK ADVANCED FILTERS</h2>
                            <button className="p-close-btn" onClick={() => setIsFilterModalOpen(false)}>×</button>
                        </div>
                        <div className="p-modal-body">
                            <div className="filter-group">
                                <label>TEAMS REPRESENTED</label>
                                <div className="checkbox-grid">
                                    {gkTeams.map(team => (
                                        <div key={team} className={`check-item ${selectedTeams.includes(team) ? 'active' : ''}`}
                                            onClick={() => selectedTeams.includes(team) ? setSelectedTeams(selectedTeams.filter(t => t !== team)) : setSelectedTeams([...selectedTeams, team])}>
                                            <div className="custom-check"></div>
                                            <span>{team}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>COMPETITIONS</label>
                                <div className="checkbox-grid">
                                    {gkComps.map(comp => (
                                        <div key={comp} className={`check-item ${selectedComps.includes(comp) ? 'active' : ''}`}
                                            onClick={() => selectedComps.includes(comp) ? setSelectedComps(selectedComps.filter(c => c !== comp)) : setSelectedComps([...selectedComps, comp])}>
                                            <div className="custom-check"></div>
                                            <span>{comp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>SEASONS (SY)</label>
                                <div className="checkbox-grid">
                                    {gkSYs.map(sy => (
                                        <div key={sy} className={`check-item ${selectedSYs.includes(sy) ? 'active' : ''}`}
                                            onClick={() => selectedSYs.includes(sy) ? setSelectedSYs(selectedSYs.filter(s => s !== sy)) : setSelectedSYs([...selectedSYs, sy])}>
                                            <div className="custom-check"></div>
                                            <span>{sy}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>OPPONENTS FACED</label>
                                <div className="checkbox-grid">
                                    {gkOpps.map(opp => (
                                        <div key={opp} className={`check-item ${selectedOpps.includes(opp) ? 'active' : ''}`}
                                            onClick={() => selectedOpps.includes(opp) ? setSelectedOpps(selectedOpps.filter(o => o !== opp)) : setSelectedOpps([...selectedOpps, opp])}>
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

            <div className="player-details-tabs" style={{ flexWrap: 'wrap', gap: '5px' }}>
                {['overview', 'matches', 'championships', 'season_name', 'season_number', 'vs_teams', 'vs_players'].map(t => (
                    <div key={t} className={`player-tab-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                        <span className="tab-title">{t.replace('_', ' ').toUpperCase()}</span>
                    </div>
                ))}
            </div>

            <div className="details-tab-content" style={{ marginTop: '30px' }}>
                {activeTab === 'overview' && <GK_Overview_Module stats={stats} />}
                {activeTab === 'matches' && (
                    <GK_Matches_Module
                        stats={stats}
                        renderEventsCell={(m) => (
                            <div className="m-stats-cell" style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center' }}>
                                {m.gc > 0 && <div className="m-mini-pill mini-g" style={{ background: '#e74c3c', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '11px', fontWeight: '800' }}>{m.gc} GC</div>}
                                {m.clean && <div className="m-mini-pill" style={{ background: '#2ecc71', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>CS</div>}
                                {m.psm > 0 && <div className="m-mini-pill mini-a" style={{ background: '#3498db', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>{m.psm} PS</div>}
                                {m.pg > 0 && <div className="m-mini-pill mini-p" style={{ background: '#9b59b6', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>{m.pg} PG</div>}
                                {m.gc === 0 && !m.clean && m.psm === 0 && <span style={{ color: '#eee' }}>—</span>}
                            </div>
                        )}
                    />
                )}
                {activeTab === 'championships' && <GK_Championships_Module stats={stats} />}
                {activeTab === 'season_name' && <GK_Seasons_Module stats={stats} isNumberMode={false} />}
                {activeTab === 'season_number' && <GK_Seasons_Module stats={stats} isNumberMode={true} />}
                {activeTab === 'vs_teams' && <GK_VsTeams_Module stats={stats} />}
                {activeTab === 'vs_players' && <GK_VsPlayers_Module stats={stats} />}
            </div>

            <style jsx>{`
                .advanced-filter-btn { background: rgba(201, 168, 76, 0.1); border: 1px solid var(--gold); color: var(--gold); padding: 12px 24px; border-radius: 12px; font-family: 'Space Mono'; font-weight: 700; font-size: 11px; cursor: pointer; transition: 0.3s; }
                .advanced-filter-btn:hover { background: var(--gold); color: #000; box-shadow: 0 0 20px rgba(201,168,76,0.2); }
                .p-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
                .p-modal-content { background: #fff; border: 1px solid #eee; width: 90%; max-width: 700px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.1); animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes modalPop { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                .p-modal-header { padding: 25px 35px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
                .p-modal-header h2 { font-family: 'Bebas Neue'; color: #000; letter-spacing: 2px; margin: 0; font-size: 24px; }
                .p-close-btn { background: none; border: none; color: #999; font-size: 32px; cursor: pointer; transition: 0.3s; }
                .p-close-btn:hover { color: #000; }
                .p-modal-body { padding: 35px; max-height: 60vh; overflow-y: auto; }
                .filter-group { margin-bottom: 35px; }
                .filter-group label { display: block; color: var(--gold); font-family: 'Space Mono'; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; }
                .checkbox-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                .check-item { background: #f9f9f9; padding: 14px 20px; border-radius: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.2s; border: 1px solid #eee; }
                .check-item:hover { background: #f0f0f0; border-color: #ddd; }
                .check-item.active { background: rgba(201, 168, 76, 0.05); border-color: var(--gold); }
                .custom-check { width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; position: relative; transition: 0.2s; background: #fff; }
                .check-item.active .custom-check { border-color: var(--gold); background: var(--gold); }
                .check-item.active .custom-check::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -52%); color: #000; font-size: 12px; font-weight: 900; }
                .check-item span { color: #333; font-size: 13px; font-weight: 600; font-family: 'Outfit'; }
                .p-modal-footer { padding: 25px 35px; background: #fafafa; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 20px; }
                .clear-btn { background: none; border: none; color: #999; font-family: 'Space Mono'; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .clear-btn:hover { color: #333; }
                .apply-btn { background: var(--gold); color: #000; border: none; padding: 12px 35px; border-radius: 12px; font-family: 'Space Mono'; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .apply-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(201,168,76,0.15); }
                
                /* Streak popup modal */
                .streak-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(5px); }
                .streak-modal-content { background: #fff; width: 98%; max-width: 1000px; max-height: 90vh; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }
                .streak-modal-header { padding: 25px; display: flex; flex-direction: column; position: relative; background: #fafafa; text-align: center; }
                .streak-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 30px; letter-spacing: 2px; color: #000; margin-bottom: 15px; }
                .streak-nav-pill-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 15px; max-height: 100px; overflow-y: auto; padding: 5px; }
                .streak-nav-pill { padding: 6px 14px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; border: 1px solid #ddd; background: #fff; color: #888; cursor: pointer; transition: 0.2s; border-radius: 20px; }
                .streak-nav-pill.active { background: var(--streak-color); color: #fff; border-color: var(--streak-color); }
                .streak-modal-range { font-family: 'Space Mono', monospace; font-size: 14px; color: #444; font-weight: 700; }
                .close-streak-modal { position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 35px; color: #aaa; cursor: pointer; }
                .close-streak-modal:hover { color: #000; }
                .streak-matches-wrapper { overflow-y: auto; }
                .streak-table-modern { width: 100%; border-collapse: collapse; }
                .streak-table-modern th { position: sticky; top: 0; background: #f4f4f4; padding: 15px; font-family: 'Space Mono'; font-size: 12px; color: #444; border-bottom: 2px solid #ddd; }
                .streak-table-modern td { padding: 15px; border-bottom: 1px solid #eee; font-size: 14px; text-align: center; }
                .st-id { font-family: 'Space Mono'; font-weight: 800; }
                .st-season { color: var(--gold); font-weight: 800; }
                .st-opp { font-weight: 800; }
            `}</style>
        </div>
    );
}
