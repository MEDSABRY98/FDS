"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";
import "./alahly_db_players.css";
import PlayerDetails from "./alahly_db_player_details";
import { AlAhlyService } from "./alahly_db_service";

export default function AlAhlyPlayers({ playerDetails, lineupDetails, filteredMatches, gkDetails, howPenMissed }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState("all");
    const [opponentFilter, setOpponentFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;
    const [activeSubTab, setActiveSubTab] = useState(1);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: "ga", direction: "desc" });

    const filterLabels = { all: "All Legends", ahly: "With Al Ahly", opponents: "Against Al Ahly" };

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
        const isAhlyTeam = (t) => {
            if (!t) return false;
            const s = String(t).trim();
            return s === "الأهلي";
        };

        const initTiming = () => ({ "1-15": 0, "16-30": 0, "31-45": 0, "45+": 0, "46-60": 0, "61-75": 0, "76-90": 0, "90+": 0, "?": 0 });

        // Process appearances & team filter from lineupDetails
        (lineupDetails || []).forEach(l => {
            const mId = String(l.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;

            const name = String(l["PLAYER NAME"] || "").trim();
            if (!name || name.toLowerCase() === "unknown") return;

            const teamVal = String(l.TEAM || "").trim();
            const isAhly = isAhlyTeam(teamVal);

            if (teamFilter === "ahly" && !isAhly) return;
            if (teamFilter === "opponents" && isAhly) return;
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

        // Process details (goals, etc.) from playerDetails
        (playerDetails || []).forEach(p => {
            const mId = String(p.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;

            const name = String(p["PLAYER NAME"] || "").trim();
            if (!name || name.toLowerCase() === "unknown") return;

            const teamVal = String(p.TEAM || "").trim();
            const isAhly = isAhlyTeam(teamVal);

            if (teamFilter === "ahly" && !isAhly) return;
            if (teamFilter === "opponents" && isAhly) return;
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

            // Penalty specifics
            const isPenaltyAttempt = sub === "PENGOAL" || type === "PENMISSED";
            if (isPenaltyAttempt) { rowToUpdate.total += 1; }
            if (type === "PENMISSED") { rowToUpdate.miss += 1; }
            if (type === "PENASSISTGOAL") { rowToUpdate.wonGoal += 1; }
            if (type === "PENASSISTMISSED") { rowToUpdate.wonMiss += 1; }
            if (type === "PENMAKEGOAL") { rowToUpdate.makeGoal += 1; }
            if (type === "PENMAKEMISSED") { rowToUpdate.makeMiss += 1; }
        });

        // Impact Calculation (Shortened for brevity but fully functional)
        const matchesData = filteredMatches || [];
        matchesData.forEach(match => {
            const mId = String(match.MATCH_ID).trim();
            const gf = parseInt(match.GF) || 0;
            const ga = parseInt(match.GA) || 0;
            const res = match["W-D-L"];
            const matchEvents = (playerDetails || []).filter(e => String(e.MATCH_ID).trim() === mId);
            const ahlySideGoals = matchEvents.filter(e => isAhlyTeam(e.TEAM) && (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0));
            const oppSideGoals = matchEvents.filter(e => !isAhlyTeam(e.TEAM) && (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0));

            const updateStats = (name, type, teamVal) => {
                if (!stats[name]) return;
                const isAhly = isAhlyTeam(teamVal);
                if (teamFilter === "ahly" && !isAhly) return;
                if (teamFilter === "opponents" && isAhly) return;
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
                const lg = ahlySideGoals[ahlySideGoals.length-1];
                if (lg) { updateStats(String(lg["PLAYER NAME"]).trim(), 'G_WIN', lg.TEAM); const ast = findAssist(lg); if (ast) updateStats(ast, 'A_WIN', lg.TEAM); }
            } else if (res === 'D' && gf > 0) {
                const lg = ahlySideGoals[ahlySideGoals.length-1];
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
        (lineupDetails || []).forEach(l => { if (currentMatchIds.has(String(l.MATCH_ID || "").trim())) opps.add(String(l.TEAM || "").trim()); });
        return Array.from(opps).filter(t => t !== "الأهلي").sort((a, b) => a.localeCompare(b, 'ar'));
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
        AlAhlyService.exportToExcel(exportData, `AlAhly_Players_${tabNames[activeSubTab - 1]}`);
    };

    return (
        <div className="tab-content" id="tab-players">
            {selectedPlayer ? (
                <PlayerDetails playerName={selectedPlayer} playerDetails={playerDetails} lineupDetails={lineupDetails} masterMatches={filteredMatches} gkDetails={gkDetails} howPenMissed={howPenMissed} onBack={() => setSelectedPlayer(null)} />
            ) : (
                <div className="players-premium-wrap" style={{ maxWidth: '1400px' }}>
                    <div className="header-tabs-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                            <div className="section-title">AL AHLY <span className="accent">PLAYERS</span></div>
                            <div className="sub-tabs-selection">
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <div key={num} className={`sub-tab-box ${activeSubTab === num ? 'active' : ''}`} onClick={() => setActiveSubTab(num)}>{num}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="gold-line"></div>
                    <div className="player-controls">
                        <SearchBar_db value={searchTerm} onChange={setSearchTerm} placeholder="Search legend..." />
                        <DropDownList_db options={Object.keys(filterLabels).map(key => ({ value: key, label: filterLabels[key] }))} value={teamFilter} onChange={setTeamFilter} placeholder="Select Category" />
                        <DropDownList_db options={[{ value: 'all', label: 'All Opponents' }, ...uniqueOpponents.map(opp => ({ value: opp, label: opp }))]} value={opponentFilter} onChange={setOpponentFilter} placeholder="Select Opponent" searchable={true} />
                    </div>
                    <div className="player-table-container">
                        {activeSubTab === 1 && (
                            <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '60px' }} />
                                    <col style={{ width: '300px' }} />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '100px' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th onClick={() => handleSort('name')} className="sortable">PLAYER NAME {renderSortIcon('name')}</th>
                                        <th onClick={() => handleSort('caps')} className="sortable">MATCHES {renderSortIcon('caps')}</th>
                                        <th onClick={() => handleSort('mins')} className="sortable">MINUTES {renderSortIcon('mins')}</th>
                                        <th onClick={() => handleSort('ga')} className="sortable">G + A {renderSortIcon('ga')}</th>
                                        <th onClick={() => handleSort('goals')} className="sortable">GOALS {renderSortIcon('goals')}</th>
                                        <th onClick={() => handleSort('assists')} className="sortable">ASSISTS {renderSortIcon('assists')}</th>
                                        <th onClick={() => handleSort('penalties')} className="sortable">PENALTIES {renderSortIcon('penalties')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.map((r, i) => (
                                        <tr key={r.name}><td><span className="rank-badge-premium">{ (currentPage - 1) * pageSize + i + 1 }</span></td><td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td><td style={{ color: 'var(--gold)' }}>{r.caps}</td><td>{r.mins}</td><td><div className="ga-pill">{r.ga}</div></td><td className="g-val">{r.goals}</td><td className="a-val">{r.assists}</td><td className="p-val">{r.penalties}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {activeSubTab === 2 && (
                            <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '60px' }} />
                                    <col style={{ width: '250px' }} />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '100px' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>#</th><th onClick={() => handleSort('name')} className="sortable">PLAYER NAME {renderSortIcon('name')}</th>
                                        <th onClick={() => handleSort('total')} className="sortable">TOTAL SHOT {renderSortIcon('total')}</th>
                                        <th onClick={() => handleSort('goal')} className="sortable">SCORE {renderSortIcon('goal')}</th>
                                        <th onClick={() => handleSort('miss')} className="sortable">MISS {renderSortIcon('miss')}</th>
                                        <th onClick={() => handleSort('wonGoal')} className="sortable">WON (G) {renderSortIcon('wonGoal')}</th>
                                        <th onClick={() => handleSort('wonMiss')} className="sortable">WON (M) {renderSortIcon('wonMiss')}</th>
                                        <th onClick={() => handleSort('makeGoal')} className="sortable">MAKE (G) {renderSortIcon('makeGoal')}</th>
                                        <th onClick={() => handleSort('makeMiss')} className="sortable">MAKE (M) {renderSortIcon('makeMiss')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.map((r, i) => (
                                        <tr key={r.name}><td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td><td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td><td style={{ fontWeight: 800 }}>{r.total}</td><td className="g-val">{r.goal}</td><td className="p-val">{r.miss}</td><td>{r.wonGoal}</td><td>{r.wonMiss}</td><td>{r.makeGoal}</td><td>{r.makeMiss}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {activeSubTab === 3 && (
                            <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '60px' }} />
                                    <col style={{ width: '300px' }} />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '120px' }} />
                                </colgroup>
                                <thead>
                                    <tr><th rowSpan="2">#</th><th className="name-th" rowSpan="2" onClick={() => handleSort('name')}>PLAYER NAME {renderSortIcon('name')}</th><th colSpan="3" style={{ background: '#27ae60', color: '#fff' }}>GOALS MULTIPLES</th><th colSpan="3" style={{ background: '#2980b9', color: '#fff' }}>ASSISTS MULTIPLES</th></tr>
                                    <tr style={{ fontSize: '10px' }}>
                                        <th onClick={() => handleSort('braceG')} className="sortable">BRACE(2) {renderSortIcon('braceG')}</th>
                                        <th onClick={() => handleSort('hatG')} className="sortable">HAT-TRICK(3) {renderSortIcon('hatG')}</th>
                                        <th onClick={() => handleSort('superG')} className="sortable">SUPER(4+) {renderSortIcon('superG')}</th>
                                        <th onClick={() => handleSort('braceA')} className="sortable">BRACE(2) {renderSortIcon('braceA')}</th>
                                        <th onClick={() => handleSort('hatA')} className="sortable">HAT-TRICK(3) {renderSortIcon('hatA')}</th>
                                        <th onClick={() => handleSort('superA')} className="sortable">SUPER(4+) {renderSortIcon('superA')}</th>
                                    </tr>
                                </thead>
                                <tbody>{paginatedRows.map((r, i) => (<tr key={r.name}><td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td><td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td><td className="g-val">{r.braceG}</td><td className="g-val">{r.hatG}</td><td className="g-val">{r.superG}</td><td className="a-val">{r.braceA}</td><td className="a-val">{r.hatA}</td><td className="a-val">{r.superA}</td></tr>))}</tbody>
                            </table>
                        )}
                        {activeSubTab === 4 && (
                            <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '60px' }} />
                                    <col style={{ width: '300px' }} />
                                    <col style={{ width: '150px' }} />
                                    <col style={{ width: '150px' }} />
                                    <col style={{ width: '150px' }} />
                                    <col style={{ width: '150px' }} />
                                    <col style={{ width: '120px' }} />
                                </colgroup>
                                <thead>
                                    <tr><th rowSpan="2">#</th><th className="name-th" rowSpan="2" onClick={() => handleSort('name')}>PLAYER NAME {renderSortIcon('name')}</th><th colSpan="2" style={{ background: '#27ae60', color: '#fff' }}>GOAL IMPACT</th><th colSpan="2" style={{ background: '#2980b9', color: '#fff' }}>ASSIST IMPACT</th><th rowSpan="2" style={{ background: '#000', color: 'var(--gold)' }}>TOTAL</th></tr>
                                    <tr style={{ fontSize: '10px' }}>
                                        <th onClick={() => handleSort('goalWinImpact')} className="sortable">WIN {renderSortIcon('goalWinImpact')}</th>
                                        <th onClick={() => handleSort('goalDrawImpact')} className="sortable">DRAW {renderSortIcon('goalDrawImpact')}</th>
                                        <th onClick={() => handleSort('assistWinImpact')} className="sortable">WIN {renderSortIcon('assistWinImpact')}</th>
                                        <th onClick={() => handleSort('assistDrawImpact')} className="sortable">DRAW {renderSortIcon('assistDrawImpact')}</th>
                                    </tr>
                                </thead>
                                <tbody>{paginatedRows.map((r, i) => (<tr key={r.name}><td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td><td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td><td className="g-val">{r.goalWinImpact}</td><td style={{ color: '#e67e22' }}>{r.goalDrawImpact}</td><td className="a-val">{r.assistWinImpact}</td><td style={{ color: '#e67e22' }}>{r.assistDrawImpact}</td><td style={{ fontWeight: 800 }}>{r.goalWinImpact + r.goalDrawImpact + r.assistWinImpact + r.assistDrawImpact}</td></tr>))}</tbody>
                            </table>
                        )}
                        {(activeSubTab === 5 || activeSubTab === 6) && (
                            <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '60px' }} />
                                    <col style={{ width: '250px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col style={{ width: '85px' }} />
                                    <col style={{ width: '85px' }} />
                                    <col style={{ width: '85px' }} />
                                    <col style={{ width: '85px' }} />
                                    <col style={{ width: '85px' }} />
                                    <col style={{ width: '85px' }} />
                                    <col style={{ width: '85px' }} />
                                    <col style={{ width: '85px' }} />
                                    <col style={{ width: '85px' }} />
                                </colgroup>
                                <thead>
                                    <tr><th rowSpan="2">#</th><th className="name-th" rowSpan="2" onClick={() => handleSort('name')}>PLAYER NAME {renderSortIcon('name')}</th><th rowSpan="2" style={{ background: activeSubTab === 5 ? '#27ae60' : '#2980b9', color: '#fff' }} onClick={() => handleSort('total')} className="sortable"> TOTAL {renderSortIcon('total')} </th><th colSpan="9" style={{ background: '#000', color: 'var(--gold)' }}>{activeSubTab === 5 ? 'GOALS' : 'ASSISTS'} TIMING DISTRIBUTION</th></tr>
                                    <tr style={{ fontSize: '11px', background: '#f8f8f8' }}>
                                        {["1-15", "16-30", "31-45", "45+", "46-60", "61-75", "76-90", "90+", "?"].map(min => (
                                            <th key={min} onClick={() => handleSort(min)} className="sortable">{min} {renderSortIcon(min)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.map((r, i) => {
                                        const tim = activeSubTab === 5 ? r.goalsTiming : r.assistsTiming;
                                        return (
                                            <tr key={r.name}>
                                                <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td>
                                                <td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td>
                                                <td style={{ fontWeight: 800, fontSize: '16px', color: '#000' }}>
                                                    {activeSubTab === 5 ? r.goals : r.assists}
                                                </td>
                                                {["1-15", "16-30", "31-45", "45+", "46-60", "61-75", "76-90", "90+", "?"].map(m => (
                                                    <td key={m} 
                                                        className={tim[m] > 0 ? (activeSubTab === 5 ? 'g-val' : 'a-val') : ''} 
                                                        style={{ opacity: tim[m] > 0 ? 1 : 0.3, color: '#000' }}
                                                    >
                                                        {tim[m]}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
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
