"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";
import "./egypt_nt_db_players.css";
import EgyptNTPlayerDetails from "./egypt_nt_db_player_details";
import { EgyptNTService } from "./egypt_nt_db_service";

import EgyptNTPlayersStats from "./egypt_nt_db_players_stats";
import EgyptNTPlayersPenalties from "./egypt_nt_db_players_penalties";
import EgyptNTPlayersMultiples from "./egypt_nt_db_players_multiples";
import EgyptNTPlayersImpact from "./egypt_nt_db_players_impact";
import EgyptNTPlayersGoalsTiming from "./egypt_nt_db_players_goals_timing";
import EgyptNTPlayersAssistsTiming from "./egypt_nt_db_players_assists_timing";

export default function EgyptNTPlayers({ playerDetails, lineupDetails, filteredMatches, gkDetails, howPenMissed }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState("all");
    const [opponentFilter, setOpponentFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;
    const [activeSubTab, setActiveSubTab] = useState(1);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: "ga", direction: "desc" });

    const filterLabels = { all: "All Players", egypt: "With Egypt NT", opponents: "Against Egypt NT" };

    const handleSort = (key) => {
        let direction = "desc";
        if (sortConfig.key === key && sortConfig.direction === "desc") {
            direction = "asc";
        }
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <span className="sort-icon">↕</span>;
        return sortConfig.direction === "asc" ? <span className="sort-icon active">↑</span> : <span className="sort-icon active">↓</span>;
    };

    const allStats = useMemo(() => {
        const stats = {};
        const currentMatchIds = new Set((filteredMatches || []).map(m => String(m.MATCH_ID || "").trim()));
        
        const isEgyptTeam = (t) => {
            if (!t) return false;
            const s = String(t).trim();
            return s === "مصر" || s === "Egypt" || s === "منتخب مصر" || s === "المنتخب المصري";
        };

        const initTiming = () => ({ "1-15": 0, "16-30": 0, "31-45": 0, "45+": 0, "46-60": 0, "61-75": 0, "76-90": 0, "90+": 0, "?": 0 });

        // Process apps from lineupDetails
        (lineupDetails || []).forEach(l => {
            const mId = String(l.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;

            const name = String(l["PLAYER NAME"] || "").trim();
            if (!name || name.toLowerCase() === "unknown") return;

            const teamVal = String(l.TEAM || "").trim();
            const isEgypt = isEgyptTeam(teamVal);

            if (teamFilter === "egypt" && !isEgypt) return;
            if (teamFilter === "opponents" && isEgypt) return;
            if (opponentFilter !== "all" && teamVal !== opponentFilter) return;

            if (!stats[name]) {
                stats[name] = {
                    name, caps: 0, mins: 0, goals: 0, assists: 0, ga: 0, penalties: 0,
                    total: 0, goal: 0, miss: 0, wonGoal: 0, wonMiss: 0, makeGoal: 0, makeMiss: 0,
                    braceG: 0, hatG: 0, superG: 0, braceA: 0, hatA: 0, superA: 0,
                    goalWinImpact: 0, goalDrawImpact: 0, assistWinImpact: 0, assistDrawImpact: 0,
                    goalsTiming: initTiming(),
                    assistsTiming: initTiming()
                };
            }
            stats[name].caps += 1;
            stats[name].mins += parseInt(l["TOTAL MINUTE"] || 0) || 0;
        });

        // Process details from playerDetails
        (playerDetails || []).forEach(p => {
            const mId = String(p.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;

            const name = String(p["PLAYER NAME"] || "").trim();
            if (!name || name.toLowerCase() === "unknown") return;

            const teamVal = String(p.TEAM || "").trim();
            const isEgypt = isEgyptTeam(teamVal);

            if (teamFilter === "egypt" && !isEgypt) return;
            if (teamFilter === "opponents" && isEgypt) return;
            if (opponentFilter !== "all" && teamVal !== opponentFilter) return;

            if (!stats[name]) {
                stats[name] = {
                    name, caps: 0, mins: 0, goals: 0, assists: 0, ga: 0, penalties: 0,
                    total: 0, goal: 0, miss: 0, wonGoal: 0, wonMiss: 0, makeGoal: 0, makeMiss: 0,
                    braceG: 0, hatG: 0, superG: 0, braceA: 0, hatA: 0, superA: 0,
                    goalWinImpact: 0, goalDrawImpact: 0, assistWinImpact: 0, assistDrawImpact: 0,
                    goalsTiming: initTiming(),
                    assistsTiming: initTiming()
                };
            }

            const rowToUpdate = stats[name];
            const type = String(p.TYPE || "").trim();
            const sub = String(p.TYPE_SUB || "").trim();
            const min = String(p.MINUTE || "").trim();

            const isGoal = type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
            const isAssist = type === "ASSIST" || type === "اسيست" || type === "صنع";

            const getPeriod = (m) => {
                if (!m || String(m).trim() === "" || String(m).trim() === "?") return "?";
                const sm = String(m).trim();
                if (sm.includes('+')) {
                    const base = parseInt(sm.split('+')[0]);
                    if (isNaN(base)) return "?";
                    if (base >= 90) return "90+";
                    if (base >= 45) return "45+";
                    return "?";
                }
                const val = parseInt(sm);
                if (isNaN(val)) return "?";
                if (val <= 15) return "1-15";
                if (val <= 30) return "16-30";
                if (val <= 45) return "31-45";
                if (val <= 60) return "46-60";
                if (val <= 75) return "61-75";
                if (val <= 90) return "76-90";
                return "90+";
            };

            if (isGoal) {
                rowToUpdate.goals += 1;
                rowToUpdate.ga += 1;
                if (sub === "PENGOAL") {
                    rowToUpdate.goal += 1;
                    rowToUpdate.penalties += 1;
                }
                const period = getPeriod(min);
                if (period) rowToUpdate.goalsTiming[period]++;
            }

            if (isAssist) {
                rowToUpdate.assists += 1;
                rowToUpdate.ga += 1;
                const period = getPeriod(min);
                if (period) rowToUpdate.assistsTiming[period]++;
            }

            const isPenaltyAttempt = sub === "PENGOAL" || type === "PENMISSED";
            if (isPenaltyAttempt) { rowToUpdate.total += 1; }
            if (type === "PENMISSED") { rowToUpdate.miss += 1; }
            if (type === "PENASSISTGOAL") { rowToUpdate.wonGoal += 1; }
            if (type === "PENASSISTMISSED") { rowToUpdate.wonMiss += 1; }
            if (type === "PENMAKEGOAL") { rowToUpdate.makeGoal += 1; }
            if (type === "PENMAKEMISSED") { rowToUpdate.makeMiss += 1; }
        });

        // Impact Calculations
        const matchesData = filteredMatches || [];
        matchesData.forEach(match => {
            const mId = String(match.MATCH_ID).trim();
            const gf = parseInt(match.GF) || 0;
            const ga = parseInt(match.GA) || 0;
            const res = match["W-D-L"];
            const matchEvents = (playerDetails || []).filter(e => String(e.MATCH_ID).trim() === mId);
            const egyptSideGoals = matchEvents.filter(e => isEgyptTeam(e.TEAM) && (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0));
            const oppSideGoals = matchEvents.filter(e => !isEgyptTeam(e.TEAM) && (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0));

            const updateStats = (name, type, teamVal) => {
                if (!stats[name]) return;
                const isEgypt = isEgyptTeam(teamVal);
                if (teamFilter === "egypt" && !isEgypt) return;
                if (teamFilter === "opponents" && isEgypt) return;
                if (opponentFilter !== "all" && String(teamVal).trim() !== opponentFilter) return;
                if (type === 'G_WIN') stats[name].goalWinImpact++;
                if (type === 'G_DRAW') stats[name].goalDrawImpact++;
                if (type === 'A_WIN') stats[name].assistWinImpact++;
                if (type === 'A_DRAW') stats[name].assistDrawImpact++;
            };

            const findAssist = (goal) => {
                if (!goal) return null;
                const gId = String(goal.EVENT_ID);
                const aRow = matchEvents.find(e => ["ASSIST", "اسيست", "صنع"].includes(String(e.TYPE || "").toUpperCase()) && (String(e.PARENT_EVENT_ID) === gId || (parseInt(e.MINUTE) === parseInt(goal.MINUTE))));
                return aRow ? String(aRow["PLAYER NAME"]).trim() : null;
            };

            if (res === 'W' && gf - ga === 1) {
                const lg = egyptSideGoals[egyptSideGoals.length-1];
                if (lg) { updateStats(String(lg["PLAYER NAME"]).trim(), 'G_WIN', lg.TEAM); const ast = findAssist(lg); if (ast) updateStats(ast, 'A_WIN', lg.TEAM); }
            } else if (res === 'D' && gf > 0) {
                const lg = egyptSideGoals[egyptSideGoals.length-1];
                if (lg) { updateStats(String(lg["PLAYER NAME"]).trim(), 'G_DRAW', lg.TEAM); const ast = findAssist(lg); if (ast) updateStats(ast, 'A_DRAW', lg.TEAM); }
            }
            if (res === 'L' && ga - gf === 1) {
                const lg = oppSideGoals[oppSideGoals.length-1];
                if (lg) { updateStats(String(lg["PLAYER NAME"]).trim(), 'G_WIN', lg.TEAM); const ast = findAssist(lg); if (ast) updateStats(ast, 'A_WIN', lg.TEAM); }
            } else if (res === 'D' && ga > 0) {
                const lg = oppSideGoals[oppSideGoals.length-1];
                if (lg) { updateStats(String(lg["PLAYER NAME"]).trim(), 'G_DRAW', lg.TEAM); const ast = findAssist(lg); if (ast) updateStats(ast, 'A_DRAW', lg.TEAM); }
            }
        });

        // Compute Braces / Hatricks
        const list = Object.values(stats);
        list.forEach(player => {
            const matchesForPlayer = (playerDetails || []).filter(p => String(p["PLAYER NAME"] || "").trim() === player.name && currentMatchIds.has(String(p.MATCH_ID || "").trim()));
            const matchGroups = {};
            matchesForPlayer.forEach(m => {
                const mid = m.MATCH_ID; if (!matchGroups[mid]) matchGroups[mid] = { g: 0, a: 0 };
                const t = String(m.TYPE || "").trim(); const ts = String(m.TYPE_SUB || "").trim();
                if (t === "GOAL" || t === "هدف" || ts === "PENGOAL") matchGroups[mid].g++;
                if (t === "ASSIST" || t === "اسيست") matchGroups[mid].a++;
            });
            Object.values(matchGroups).forEach(c => {
                if (c.g === 2) player.braceG++; if (c.g === 3) player.hatG++; if (c.g >= 4) player.superG++;
                if (c.a === 2) player.braceA++; if (c.a === 3) player.hatA++; if (c.a >= 4) player.superA++;
            });
        });

        return list;
    }, [playerDetails, lineupDetails, filteredMatches, teamFilter, opponentFilter]);

    const uniqueOpponents = useMemo(() => {
        const currentMatchIds = new Set((filteredMatches || []).map(m => String(m.MATCH_ID || "").trim()));
        const opps = new Set();
        const isEgyptTeam = (t) => {
            if (!t) return false;
            const s = String(t).trim();
            return s === "مصر" || s === "Egypt" || s === "منتخب مصر" || s === "المنتخب المصري";
        };
        (lineupDetails || []).forEach(l => {
            if (currentMatchIds.has(String(l.MATCH_ID || "").trim())) {
                const tv = String(l.TEAM || "").trim();
                if (tv && !isEgyptTeam(tv)) opps.add(tv);
            }
        });
        return Array.from(opps).sort((a, b) => a.localeCompare(b, 'ar'));
    }, [lineupDetails, filteredMatches]);

    const filteredRows = useMemo(() => {
        let list = [...allStats];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(r => r.name.toLowerCase().includes(lower));
        }

        const { key, direction } = sortConfig;
        return list.sort((a, b) => {
            let aVal, bVal;
            if (activeSubTab === 5 || activeSubTab === 6) {
                const timA = activeSubTab === 5 ? a.goalsTiming : a.assistsTiming;
                const timB = activeSubTab === 5 ? b.goalsTiming : b.assistsTiming;
                if (["1-15", "16-30", "31-45", "45+", "46-60", "61-75", "76-90", "90+", "?"].includes(key)) { aVal = timA[key] || 0; bVal = timB[key] || 0; }
                else if (key === 'total') { aVal = activeSubTab === 5 ? a.goals : a.assists; bVal = activeSubTab === 5 ? b.goals : b.assists; }
                else { aVal = a[key]; bVal = b[key]; }
            } else {
                aVal = a[key] || 0; bVal = b[key] || 0;
                if (key === 'name') { aVal = String(aVal); bVal = String(bVal); }
            }
            if (aVal < bVal) return direction === "asc" ? -1 : 1;
            if (aVal > bVal) return direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [allStats, searchTerm, sortConfig, activeSubTab]);

    const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(filteredRows.length / pageSize);

    useEffect(() => {
        const handleGlobalExport = () => {
            handleExport();
        };
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [filteredRows, activeSubTab]);

    const handleExport = () => {
        const exportData = filteredRows.map((r, i) => {
            if (activeSubTab === 1) return { "#": i + 1, "PLAYER NAME": r.name, "MATCHES": r.caps, "MINUTES": r.mins, "G+A": r.ga, "GOALS": r.goals, "ASSISTS": r.assists, "PENALTIES": r.penalties };
            if (activeSubTab === 2) return { "#": i + 1, "PLAYER NAME": r.name, "TOTAL SHOT": r.total, "SCORE": r.goal, "MISS": r.miss, "WON(G)": r.wonGoal, "WON(M)": r.wonMiss, "MAKE(G)": r.makeGoal, "MAKE(M)": r.makeMiss };
            if (activeSubTab === 3) return { "#": i + 1, "PLAYER NAME": r.name, "G-BRACE": r.braceG, "G-HATRICK": r.hatG, "G-SUPER": r.superG, "A-BRACE": r.braceA, "A-HATRICK": r.hatA, "A-SUPER": r.superA };
            if (activeSubTab === 4) return { "#": i + 1, "PLAYER NAME": r.name, "G-WIN": r.goalWinImpact, "G-DRAW": r.goalDrawImpact, "A-WIN": r.assistWinImpact, "A-DRAW": r.assistDrawImpact, "TOTAL": (r.goalWinImpact + r.goalDrawImpact + r.assistWinImpact + r.assistDrawImpact) };
            if (activeSubTab === 5 || activeSubTab === 6) {
                const tim = activeSubTab === 5 ? r.goalsTiming : r.assistsTiming;
                return { "#": i + 1, "PLAYER NAME": r.name, "TOTAL": activeSubTab === 5 ? r.goals : r.assists, "1-15": tim["1-15"], "16-30": tim["16-30"], "31-45": tim["31-45"], "45+": tim["45+"], "46-60": tim["46-60"], "61-75": tim["61-75"], "76-90": tim["76-90"], "90+": tim["90+"], "?": tim["?"] };
            }
            return r;
        });
        const tabNames = ["Stats", "Penalties", "Multiples", "Impact", "Goals_Timing", "Assists_Timing"];
        EgyptNTService.exportToExcel(exportData, `EgyptNT_Players_${tabNames[activeSubTab - 1]}`);
    };

    return (
        <div className="tab-content" id="tab-players">
            {selectedPlayer ? (
                <EgyptNTPlayerDetails 
                    playerName={selectedPlayer} 
                    playerDetails={playerDetails} 
                    lineupDetails={lineupDetails} 
                    masterMatches={filteredMatches} 
                    gkDetails={gkDetails} 
                    howPenMissed={howPenMissed} 
                    onBack={() => setSelectedPlayer(null)} 
                />
            ) : (
                <div className="players-premium-wrap" style={{ maxWidth: '1400px' }}>
                    <div className="header-tabs-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                            <div className="section-title">EGYPT NT <span className="accent">PLAYERS</span></div>
                            <div className="sub-tabs-selection" style={{ flexWrap: 'wrap', gap: '5px' }}>
                                {["Stats", "Penalties", "Multiples", "Impact", "Goals Timing", "Assists Timing"].map((label, index) => {
                                    const num = index + 1;
                                    return (
                                        <div key={num} className={`sub-tab-box ${activeSubTab === num ? 'active' : ''}`} onClick={() => { setActiveSubTab(num); setCurrentPage(1); }}>{label}</div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="gold-line"></div>
                    <div className="player-controls">
                        <SearchBar_db value={searchTerm} onChange={setSearchTerm} placeholder="Search player..." />
                        <DropDownList_db options={Object.keys(filterLabels).map(key => ({ value: key, label: filterLabels[key] }))} value={teamFilter} onChange={setTeamFilter} placeholder="Select Category" />
                        <DropDownList_db options={[{ value: 'all', label: 'All Opponents' }, ...uniqueOpponents.map(opp => ({ value: opp, label: opp }))]} value={opponentFilter} onChange={setOpponentFilter} placeholder="Select Opponent" searchable={true} />
                    </div>
                    <div className="player-table-container">
                        {paginatedRows.length === 0 ? (
                            <NoData_db message="No players match the criteria." />
                        ) : (
                            <>
                                {activeSubTab === 1 && <EgyptNTPlayersStats paginatedRows={paginatedRows} currentPage={currentPage} pageSize={pageSize} handleSort={handleSort} renderSortIcon={renderSortIcon} setSelectedPlayer={setSelectedPlayer} />}
                                {activeSubTab === 2 && <EgyptNTPlayersPenalties paginatedRows={paginatedRows} currentPage={currentPage} pageSize={pageSize} handleSort={handleSort} renderSortIcon={renderSortIcon} setSelectedPlayer={setSelectedPlayer} />}
                                {activeSubTab === 3 && <EgyptNTPlayersMultiples paginatedRows={paginatedRows} currentPage={currentPage} pageSize={pageSize} handleSort={handleSort} renderSortIcon={renderSortIcon} setSelectedPlayer={setSelectedPlayer} />}
                                {activeSubTab === 4 && <EgyptNTPlayersImpact paginatedRows={paginatedRows} currentPage={currentPage} pageSize={pageSize} handleSort={handleSort} renderSortIcon={renderSortIcon} setSelectedPlayer={setSelectedPlayer} />}
                                {activeSubTab === 5 && <EgyptNTPlayersGoalsTiming paginatedRows={paginatedRows} currentPage={currentPage} pageSize={pageSize} handleSort={handleSort} renderSortIcon={renderSortIcon} setSelectedPlayer={setSelectedPlayer} />}
                                {activeSubTab === 6 && <EgyptNTPlayersAssistsTiming paginatedRows={paginatedRows} currentPage={currentPage} pageSize={pageSize} handleSort={handleSort} renderSortIcon={renderSortIcon} setSelectedPlayer={setSelectedPlayer} />}
                            </>
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-premium">
                            <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>←</button>
                            <span className="page-info">PAGE <span className="p-num">{currentPage}</span> OF <span className="p-num">{totalPages}</span></span>
                            <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>→</button>
                        </div>
                    )}
                </div>
            )}
            <style jsx>{`
                .sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
                .sortable:hover { background: rgba(0,0,0,0.05) !important; }
                .sort-icon { font-size: 10px; margin-left: 5px; opacity: 0.4; }
                .sort-icon.active { opacity: 1; color: var(--gold); font-weight: bold; }
            `}</style>
        </div>
    );
}
