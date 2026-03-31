"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import "./alahly_db_seasons.css";
import PlayerDetails from "./alahly_db_player_details";
import { AlAhlyService } from "./alahly_db_service";

export default function AlAhlyPlayers({ playerDetails, lineupDetails, filteredMatches, gkDetails, howPenMissed }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState("all");
    const [opponentFilter, setOpponentFilter] = useState("all");
    const [isOpen, setIsOpen] = useState(false);
    const [isOppOpen, setIsOppOpen] = useState(false);
    const [oppSearch, setOppSearch] = useState("");
    const dropdownRef = useRef(null);
    const oppDropdownRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;
    const [activeSubTab, setActiveSubTab] = useState(1);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    const filterLabels = { all: "All Legends", ahly: "With Al Ahly", opponents: "Against Al Ahly" };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
            if (oppDropdownRef.current && !oppDropdownRef.current.contains(event.target)) setIsOppOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const allStats = useMemo(() => {
        const stats = {};
        const currentMatchIds = new Set((filteredMatches || []).map(m => String(m.MATCH_ID || "").trim()));
        const isAhlyTeam = (t) => {
            if (!t) return false;
            const s = String(t).trim();
            return s === "الأهلي";
        };

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
                    goalWinImpact: 0, goalDrawImpact: 0, assistWinImpact: 0, assistDrawImpact: 0
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
                    goalWinImpact: 0, goalDrawImpact: 0, assistWinImpact: 0, assistDrawImpact: 0
                };
            }

            const rowToUpdate = stats[name];
            const type = String(p.TYPE || "").trim();
            const sub = String(p.TYPE_SUB || "").trim();

            const isGoal = type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
            const isAssist = type === "ASSIST" || type === "اسيست" || type === "صنع";

            if (isGoal) {
                rowToUpdate.goals += 1;
                rowToUpdate.ga += 1;
                if (sub === "PENGOAL") {
                    rowToUpdate.goal += 1;
                    rowToUpdate.penalties += 1;
                }
            }

            if (isAssist) {
                rowToUpdate.assists += 1;
                rowToUpdate.ga += 1;
            }

            // Penalty specifics (Sub-tab 2: TOTAL SHOT = Total penalty attempts)
            const isPenaltyAttempt = sub === "PENGOAL" || type === "PENMISSED";
            if (isPenaltyAttempt) {
                rowToUpdate.total += 1;
            }
            if (type === "PENMISSED") { rowToUpdate.miss += 1; }

            if (type === "PENASSISTGOAL") { rowToUpdate.wonGoal += 1; }
            if (type === "PENASSISTMISSED") { rowToUpdate.wonMiss += 1; }
            if (type === "PENMAKEGOAL") { rowToUpdate.makeGoal += 1; }
            if (type === "PENMAKEMISSED") { rowToUpdate.makeMiss += 1; }
        });

        // --- SYNCED IMPACT CALCULATION ---
        const matchesData = filteredMatches || [];
        matchesData.forEach(match => {
            const mId = String(match.MATCH_ID).trim();
            const gf = parseInt(match.GF) || 0;
            const ga = parseInt(match.GA) || 0;
            const res = match["W-D-L"];

            const matchEvents = (playerDetails || []).filter(e => String(e.MATCH_ID).trim() === mId);

            // Group goals by side, sorted by time/ID
            const ahlySideGoals = matchEvents.filter(e => isAhlyTeam(e.TEAM) && (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0) || parseInt(a.EVENT_ID || 0) - parseInt(b.EVENT_ID || 0));
            const oppSideGoals = matchEvents.filter(e => !isAhlyTeam(e.TEAM) && (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")).sort((a, b) => (parseInt(a.MINUTE) || 0) - (parseInt(b.MINUTE) || 0) || parseInt(a.EVENT_ID || 0) - parseInt(b.EVENT_ID || 0));

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
                const aRow = matchEvents.find(e =>
                    ["ASSIST", "اسيست", "صنع"].includes(String(e.TYPE || "").toUpperCase()) &&
                    (String(e.PARENT_EVENT_ID) === gId || (parseInt(e.MINUTE) === parseInt(goal.MINUTE) && parseInt(e.MINUTE) > 0)) &&
                    String(e["PLAYER NAME"]).trim() !== String(goal["PLAYER NAME"]).trim()
                );
                return aRow ? String(aRow["PLAYER NAME"]).trim() : null;
            };

            // Ahly Impact Logic
            if (res === 'W') {
                if (gf - ga === 1) { // 1-Goal Margin
                    const lg = ahlySideGoals[ahlySideGoals.length - 1];
                    if (lg) {
                        updateStats(String(lg["PLAYER NAME"]).trim(), 'G_WIN', lg.TEAM);
                        const assister = findAssist(lg);
                        if (assister) {
                            const aRow = matchEvents.find(e => String(e["PLAYER NAME"]).trim() === assister && String(e.MATCH_ID).trim() === mId);
                            updateStats(assister, 'A_WIN', (aRow ? aRow.TEAM : "الأهلي"));
                        }
                    }
                } else if (gf > 1 && ga < gf) { // Big Win
                    const scorers = [...new Set(ahlySideGoals.map(g => String(g["PLAYER NAME"]).trim()))];
                    if (scorers.length === 1) {
                        updateStats(scorers[0], 'G_WIN', "الأهلي");
                    }
                }
            } else if (res === 'D' && gf > 0) {
                const lg = ahlySideGoals[ahlySideGoals.length - 1];
                if (lg) {
                    updateStats(String(lg["PLAYER NAME"]).trim(), 'G_DRAW', lg.TEAM);
                    const assister = findAssist(lg);
                    if (assister) {
                        const aRow = matchEvents.find(e => String(e["PLAYER NAME"]).trim() === assister && String(e.MATCH_ID).trim() === mId);
                        updateStats(assister, 'A_DRAW', (aRow ? aRow.TEAM : "الأهلي"));
                    }
                }
            }

            // Opponent Impact Logic
            if (res === 'L') {
                if (ga - gf === 1) {
                    const lg = oppSideGoals[oppSideGoals.length - 1];
                    if (lg) {
                        updateStats(String(lg["PLAYER NAME"]).trim(), 'G_WIN', lg.TEAM);
                        const assister = findAssist(lg);
                        if (assister) {
                            const aRow = matchEvents.find(e => String(e["PLAYER NAME"]).trim() === assister && String(e.MATCH_ID).trim() === mId);
                            updateStats(assister, 'A_WIN', (aRow ? aRow.TEAM : lg.TEAM));
                        }
                    }
                } else if (ga > 1 && gf < ga) {
                    const scorers = [...new Set(oppSideGoals.map(g => String(g["PLAYER NAME"]).trim()))];
                    if (scorers.length === 1) {
                        updateStats(scorers[0], 'G_WIN', oppSideGoals[0].TEAM);
                    }
                }
            } else if (res === 'D' && ga > 0) {
                const lg = oppSideGoals[oppSideGoals.length - 1];
                if (lg) {
                    updateStats(String(lg["PLAYER NAME"]).trim(), 'G_DRAW', lg.TEAM);
                    const assister = findAssist(lg);
                    if (assister) {
                        const aRow = matchEvents.find(e => String(e["PLAYER NAME"]).trim() === assister && String(e.MATCH_ID).trim() === mId);
                        updateStats(assister, 'A_DRAW', (aRow ? aRow.TEAM : lg.TEAM));
                    }
                }
            }
        });

        const list = Object.values(stats);

        list.forEach(player => {
            const matchesForPlayer = (playerDetails || []).filter(p => {
                if (String(p["PLAYER NAME"] || "").trim() !== player.name) return false;
                const mId = String(p.MATCH_ID || "").trim();
                if (!currentMatchIds.has(mId)) return false;

                const teamVal = String(p.TEAM || "").trim();
                const isAhly = isAhlyTeam(teamVal);
                if (teamFilter === "ahly" && !isAhly) return false;
                if (teamFilter === "opponents" && isAhly) return false;
                if (opponentFilter !== "all" && teamVal !== opponentFilter) return false;
                return true;
            });
            const matchGroups = {};
            matchesForPlayer.forEach(m => {
                const mid = m.MATCH_ID;
                if (!matchGroups[mid]) matchGroups[mid] = { g: 0, a: 0 };
                const t = String(m.TYPE || "").trim();
                const ts = String(m.TYPE_SUB || "").trim();
                const isG = t === "GOAL" || t === "هدف" || ts === "PENGOAL" || ts === "هدف جزاء";
                const isA = t === "ASSIST" || t === "اسيست" || t === "صنع";
                if (isG) matchGroups[mid].g++;
                if (isA) matchGroups[mid].a++;
            });
            Object.values(matchGroups).forEach(counts => {
                if (counts.g === 2) player.braceG++;
                if (counts.g === 3) player.hatG++;
                if (counts.g >= 4) player.superG++;
                if (counts.a === 2) player.braceA++;
                if (counts.a === 3) player.hatA++;
                if (counts.a >= 4) player.superA++;
            });
        });

        return list;
    }, [playerDetails, lineupDetails, filteredMatches, teamFilter, opponentFilter]);

    const uniqueOpponents = useMemo(() => {
        const currentMatchIds = new Set((filteredMatches || []).map(m => String(m.MATCH_ID || "").trim()));
        const opps = new Set();
        (lineupDetails || []).forEach(l => {
            if (!currentMatchIds.has(String(l.MATCH_ID || "").trim())) return;
            const t = String(l.TEAM || "").trim();
            if (t && t !== "الأهلي" && t !== "Al-Ahly" && t !== "Al Ahly") opps.add(t);
        });
        (playerDetails || []).forEach(p => {
            if (!currentMatchIds.has(String(p.MATCH_ID || "").trim())) return;
            const t = String(p.TEAM || "").trim();
            if (t && t !== "الأهلي" && t !== "Al-Ahly" && t !== "Al Ahly") opps.add(t);
        });
        return Array.from(opps).sort((a, b) => a.localeCompare(b, 'ar'));
    }, [lineupDetails, playerDetails, filteredMatches]);

    const filteredOpponents = useMemo(() => {
        if (!oppSearch) return uniqueOpponents;
        return uniqueOpponents.filter(o => o.toLowerCase().includes(oppSearch.toLowerCase()));
    }, [uniqueOpponents, oppSearch]);

    const filteredRows = useMemo(() => {
        let list = allStats;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(r => r.name.toLowerCase().includes(lower));
        }
        if (activeSubTab === 1) return list.sort((a, b) => b.ga - a.ga || b.goals - a.goals || b.caps - a.caps);
        if (activeSubTab === 2) return list.filter(r => (r.total + r.wonGoal + r.wonMiss + r.makeGoal + r.makeMiss) > 0).sort((a, b) => b.total - a.total || b.goal - a.goal);
        if (activeSubTab === 3) return list.filter(r => (r.braceG + r.hatG + r.superG + r.braceA + r.hatA + r.superA) > 0).sort((a, b) => b.braceG - a.braceG);
        if (activeSubTab === 4) return list.filter(r => (r.goalWinImpact + r.goalDrawImpact + r.assistWinImpact + r.assistDrawImpact) > 0).sort((a, b) => (b.goalWinImpact + b.goalDrawImpact + b.assistWinImpact + b.assistDrawImpact) - (a.goalWinImpact + a.goalDrawImpact + a.assistWinImpact + a.assistDrawImpact));
        return list;
    }, [allStats, searchTerm, activeSubTab]);

    const totalPages = Math.ceil(filteredRows.length / pageSize);
    const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (!selectedPlayer) {
                handleExport();
            }
        };
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [filteredRows, activeSubTab, selectedPlayer]);

    const handleExport = () => {
        const exportData = filteredRows.map((r, i) => {
            if (activeSubTab === 1) return { "#": i + 1, "PLAYER NAME": r.name, "MATCHES": r.caps, "MINUTES": r.mins, "G+A": r.ga, "GOALS": r.goals, "ASSISTS": r.assists, "PENALTIES": r.penalties };
            if (activeSubTab === 2) return { "#": i + 1, "PLAYER NAME": r.name, "TOTAL SHOT": r.total, "SCORE": r.goal, "MISS": r.miss, "WON(G)": r.wonGoal, "WON(M)": r.wonMiss, "MAKE(G)": r.makeGoal, "MAKE(M)": r.makeMiss };
            if (activeSubTab === 3) return { "#": i + 1, "PLAYER NAME": r.name, "G-BRACE": r.braceG, "G-HATRICK": r.hatG, "G-SUPER": r.superG, "A-BRACE": r.braceA, "A-HATRICK": r.hatA, "A-SUPER": r.superA };
            if (activeSubTab === 4) return { "#": i + 1, "PLAYER NAME": r.name, "G-WIN": r.goalWinImpact, "G-DRAW": r.goalDrawImpact, "A-WIN": r.assistWinImpact, "A-DRAW": r.assistDrawImpact, "TOTAL": (r.goalWinImpact + r.goalDrawImpact + r.assistWinImpact + r.assistDrawImpact) };
            return r;
        });
        const tabNames = ["Stats", "Penalties", "Multiples", "Impact"];
        AlAhlyService.exportToExcel(exportData, `AlAhly_Players_${tabNames[activeSubTab - 1]}`);
    };

    return (
        <div className="tab-content" id="tab-players">
            {selectedPlayer ? (
                <PlayerDetails
                    playerName={selectedPlayer}
                    playerDetails={playerDetails}
                    lineupDetails={lineupDetails}
                    masterMatches={filteredMatches}
                    gkDetails={gkDetails}
                    howPenMissed={howPenMissed}
                    onBack={() => setSelectedPlayer(null)}
                />
            ) : (
                <div className="players-premium-wrap" style={{ maxWidth: '1450px' }}>
                    <div className="header-tabs-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                            <div className="section-title">AL AHLY <span className="accent">PLAYERS</span></div>
                            <div className="sub-tabs-selection">
                                <div className={`sub-tab-box ${activeSubTab === 1 ? 'active' : ''}`} onClick={() => setActiveSubTab(1)}>1</div>
                                <div className={`sub-tab-box ${activeSubTab === 2 ? 'active' : ''}`} onClick={() => setActiveSubTab(2)}>2</div>
                                <div className={`sub-tab-box ${activeSubTab === 3 ? 'active' : ''}`} onClick={() => setActiveSubTab(3)}>3</div>
                                <div className={`sub-tab-box ${activeSubTab === 4 ? 'active' : ''}`} onClick={() => setActiveSubTab(4)}>4</div>
                            </div>
                        </div>
                    </div>
                    <div className="gold-line"></div>
                    <div className="player-controls">
                        <div className="search-wrap-premium"><input type="text" placeholder="Search legend..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-search-input" /></div>

                        <div className="custom-dropdown-wrap" ref={dropdownRef}>
                            <div className={`dropdown-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}><span className="current-label">{teamFilter === 'all' ? "Select Category" : filterLabels[teamFilter]}</span><span className="dropdown-arrow"></span></div>
                            {isOpen && <div className="dropdown-options-list">{Object.keys(filterLabels).map(key => <div key={key} className={`dropdown-option-item ${teamFilter === key ? 'selected' : ''}`} onClick={() => { setTeamFilter(key); setIsOpen(false); }}>{filterLabels[key]}</div>)}</div>}
                        </div>

                        <div className="custom-dropdown-wrap" ref={oppDropdownRef}>
                            <div className={`dropdown-trigger ${isOppOpen ? 'active' : ''}`} onClick={() => setIsOppOpen(!isOppOpen)}><span className="current-label">{opponentFilter === 'all' ? "Select Opponent" : opponentFilter}</span><span className="dropdown-arrow"></span></div>
                            {isOppOpen && (
                                <div className="dropdown-options-list" style={{ width: '100%', padding: '0', boxSizing: 'border-box' }}>
                                    <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                                        <input
                                            type="text"
                                            placeholder="Find team..."
                                            value={oppSearch}
                                            onChange={(e) => setOppSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px', outline: 'none', background: '#fff' }}
                                        />
                                    </div>
                                    <div className="premium-scroll" style={{ maxHeight: '250px', overflowY: 'auto', padding: '5px' }}>
                                        <div className={`dropdown-option-item ${opponentFilter === 'all' ? 'selected' : ''}`} onClick={() => { setOpponentFilter("all"); setIsOppOpen(false); }}>All Opponents</div>
                                        {filteredOpponents.map(opp => (
                                            <div key={opp} className={`dropdown-option-item ${opponentFilter === opp ? 'selected' : ''}`} onClick={() => { setOpponentFilter(opp); setIsOppOpen(false); }}>{opp}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="player-table-container">
                        {activeSubTab === 1 && (
                            <table className="modern-player-table fade-in">
                                <thead><tr><th>#</th><th className="name-th">PLAYER NAME</th><th>MATCHES</th><th>MINUTES</th><th>G + A</th><th>GOALS</th><th>ASSISTS</th><th>PENALTIES</th></tr></thead>
                                <tbody>
                                    {paginatedRows.length > 0 ? (
                                        paginatedRows.map((r, i) => {
                                            const realIdx = (currentPage - 1) * pageSize + i;
                                            return (
                                                <tr key={r.name}>
                                                    <td><span className={`rank-badge rank-${realIdx < 3 ? realIdx + 1 : 'none'}`}>{realIdx + 1}</span></td>
                                                    <td className="p-name" onClick={() => setSelectedPlayer(r.name)} style={{ cursor: 'pointer' }}>{r.name}</td>
                                                    <td style={{ color: 'var(--gold)' }}>{r.caps}</td>
                                                    <td style={{ fontSize: '14px', opacity: 0.8 }}>{r.mins}</td>
                                                    <td><div className="ga-pill">{r.ga}</div></td>
                                                    <td className="g-val">{r.goals}</td><td className="a-val">{r.assists}</td><td className="p-val">{r.penalties}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan="8" style={{ padding: '100px', opacity: 0.4 }}>No matching legends found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        {activeSubTab === 2 && (
                            <table className="modern-player-table fade-in">
                                <thead><tr><th>#</th><th className="name-th">PLAYER NAME</th><th>TOTAL SHOT</th><th>SCORE</th><th>MISS</th><th>WON (G)</th><th>WON (M)</th><th>MAKE (G)</th><th>MAKE (M)</th></tr></thead>
                                <tbody>
                                    {paginatedRows.length > 0 ? (
                                        paginatedRows.map((r, i) => (
                                            <tr key={r.name}><td><span className="rank-badge">{(currentPage - 1) * pageSize + i + 1}</span></td><td className="p-name" onClick={() => setSelectedPlayer(r.name)} style={{ cursor: 'pointer' }}>{r.name}</td><td style={{ fontWeight: 800 }}>{r.total}</td><td className="g-val">{r.goal}</td><td className="p-val">{r.miss}</td><td>{r.wonGoal}</td><td>{r.wonMiss}</td><td>{r.makeGoal}</td><td>{r.makeMiss}</td></tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="9" style={{ padding: '100px', opacity: 0.4 }}>No matching legends found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        {activeSubTab === 3 && (
                            <table className="modern-player-table fade-in">
                                <thead>
                                    <tr><th rowSpan="2">#</th><th className="name-th" rowSpan="2">PLAYER NAME</th><th colSpan="3" style={{ background: '#27ae60', color: '#fff' }}>GOALS MULTIPLES</th><th colSpan="3" style={{ background: '#2980b9', color: '#fff' }}>ASSISTS MULTIPLES</th></tr>
                                    <tr style={{ fontSize: '10px' }}><th style={{ padding: '10px' }}>BRACE(2)</th><th style={{ padding: '10px' }}>HAT-TRICK(3)</th><th style={{ padding: '10px' }}>SUPER(4+)</th><th style={{ padding: '10px' }}>BRACE(2)</th><th style={{ padding: '10px' }}>HAT-TRICK(3)</th><th style={{ padding: '10px' }}>SUPER(4+)</th></tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.length > 0 ? (
                                        paginatedRows.map((r, i) => (
                                            <tr key={r.name}><td><span className="rank-badge">{(currentPage - 1) * pageSize + i + 1}</span></td><td className="p-name" onClick={() => setSelectedPlayer(r.name)} style={{ cursor: 'pointer' }}>{r.name}</td><td className="g-val">{r.braceG}</td><td className="g-val">{r.hatG}</td><td className="g-val">{r.superG}</td><td className="a-val">{r.braceA}</td><td className="a-val">{r.hatA}</td><td className="a-val">{r.superA}</td></tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="8" style={{ padding: '100px', opacity: 0.4 }}>No matching legends found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        {activeSubTab === 4 && (
                            <table className="modern-player-table fade-in">
                                <thead>
                                    <tr>
                                        <th rowSpan="2">#</th>
                                        <th className="name-th" rowSpan="2">PLAYER NAME</th>
                                        <th colSpan="2" style={{ background: '#27ae60', color: '#fff' }}>GOAL IMPACT</th>
                                        <th colSpan="2" style={{ background: '#2980b9', color: '#fff' }}>ASSIST IMPACT</th>
                                        <th rowSpan="2" style={{ background: '#000', color: 'var(--gold)' }}>TOTAL</th>
                                    </tr>
                                    <tr style={{ fontSize: '10px' }}>
                                        <th style={{ padding: '10px' }}>WIN</th>
                                        <th style={{ padding: '10px' }}>DRAW</th>
                                        <th style={{ padding: '10px' }}>WIN</th>
                                        <th style={{ padding: '10px' }}>DRAW</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.length > 0 ? (
                                        paginatedRows.map((r, i) => (
                                            <tr key={r.name}>
                                                <td><span className="rank-badge">{(currentPage - 1) * pageSize + i + 1}</span></td>
                                                <td className="p-name" onClick={() => setSelectedPlayer(r.name)} style={{ cursor: 'pointer' }}>{r.name}</td>
                                                <td className="g-val">{r.goalWinImpact}</td>
                                                <td style={{ color: '#e67e22' }}>{r.goalDrawImpact}</td>
                                                <td className="a-val">{r.assistWinImpact}</td>
                                                <td style={{ color: '#e67e22' }}>{r.assistDrawImpact}</td>
                                                <td style={{ fontWeight: 800 }}>{r.goalWinImpact + r.goalDrawImpact + r.assistWinImpact + r.assistDrawImpact}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="7" style={{ padding: '100px', opacity: 0.4 }}>No matching legends found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-premium">
                            <button className="page-btn prev-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>PREV</button>
                            <div className="page-info">PAGE <span className="p-num">{currentPage}</span> OF <span className="p-num">{totalPages}</span></div>
                            <button className="page-btn next-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>NEXT</button>
                        </div>
                    )}
                </div>
            )}
            <style jsx>{`
                .premium-scroll::-webkit-scrollbar { width: 5px; }
                .premium-scroll::-webkit-scrollbar-track { background: transparent; }
                .premium-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
                .premium-scroll::-webkit-scrollbar-thumb:hover { background: #ccc; }
                .players-premium-wrap { margin: 0 auto; padding: 0 40px 100px; }
                .header-tabs-container { display: flex; align-items: center; justify-content: flex-start; gap: 30px; margin-bottom: 5px; }
                .sub-tabs-selection { display: flex; gap: 10px; }
                .sub-tab-box { width: 35px; height: 35px; border-radius: 6px; background: #f0f0f0; color: #888; display: flex; align-items: center; justify-content: center; font-family: 'Space Mono', monospace; font-weight: 700; cursor: pointer; transition: 0.3s; border: 1px solid #ddd; }
                .sub-tab-box.active { background: var(--gold); color: #000; border-color: var(--gold); box-shadow: 0 5px 15px rgba(201,168,76,0.3); }
                .player-controls { margin-bottom: 30px; display: flex; justify-content: center; gap: 20px; align-items: center; flex-wrap: nowrap; }
                .search-wrap-premium { width: 280px; flex: none; }
                .p-search-input { background: #fff; border: 2px solid #eee; padding: 15px 30px; width: 100%; border-radius: 50px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.03); transition: all 0.3s; }
                .custom-dropdown-wrap { position: relative; width: 220px; user-select: none; }
                .dropdown-trigger { background: #fff; border: 2px solid #eee; padding: 15px 25px; border-radius: 50px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-weight: 700; color: #000; transition: 0.3s; }
                .dropdown-trigger:hover, .dropdown-trigger.active { border-color: var(--gold); box-shadow: 0 8px 25px rgba(201,168,76,0.12); }
                .dropdown-arrow { width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #000; }
                .dropdown-options-list { position: absolute; top: calc(100% + 10px); left: 0; width: 100%; background: #fff; border-radius: 12px; box-shadow: 0 15px 45px rgba(0,0,0,0.18); z-index: 1000; padding: 6px; border: 1px solid #eee; animation: slideDownCustom 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes slideDownCustom { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .dropdown-option-item { padding: 12px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #444; cursor: pointer; transition: 0.2s; }
                .dropdown-option-item:hover { background: #fdfaf0; color: var(--gold); }
                .dropdown-option-item.selected { background: #000; color: var(--gold); font-weight: 700; }
                .player-table-container { background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid var(--border); }
                .modern-player-table { width: 100%; border-collapse: collapse; }
                .modern-player-table th { background: #0a0a0a; color: rgba(255,255,255,0.85); font-size: 13px; padding: 28px 25px; text-align: center; font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 2px; }
                .modern-player-table td { padding: 16px 12px; border-bottom: 1px solid #f2f2f2; text-align: center; font-size: 18px; font-weight: 600; vertical-align: middle; }
                .p-name { color: #000; font-weight: 800 !important; transition: 0.3s; font-size: 17px !important; text-align: center !important; }
                .p-name:hover { color: var(--gold); text-decoration: underline; }
                .rank-badge { width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-family: 'Space Mono'; font-weight: 800; }
                .rank-rank-1 { background: var(--gold); color: #000; }
                .rank-rank-2 { background: #c0c0c0; color: #000; }
                .rank-rank-3 { background: #cd7f32; color: #000; }
                .ga-pill { background: #000; color: var(--gold); padding: 8px 16px; border-radius: 8px; font-size: 18px; display: inline-block; font-weight: 800; border: 1px solid var(--gold); font-family: 'Space Mono'; min-width: 45px; }
                .g-val { color: #2ecc71; font-weight: 800; font-size: 22px; font-family: 'Space Mono'; }
                .a-val { color: #3498db; font-weight: 800; font-size: 22px; font-family: 'Space Mono'; }
                .p-val { color: #e74c3c; font-weight: 800; font-size: 22px; font-family: 'Space Mono'; }
                .modern-player-table td:not(.p-name):not(.name-th) { font-family: 'Space Mono', monospace; font-size: 20px; }
                .pagination-premium { margin-top: 40px; display: flex; align-items: center; justify-content: center; gap: 30px; }
                .page-btn { background: #000; color: #fff; border: 1px solid #333; padding: 12px 30px; border-radius: 8px; font-family: 'Space Mono', monospace; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .page-btn:hover:not(:disabled) { background: var(--gold); color: #000; border-color: var(--gold); }
                .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .page-info { font-family: 'Space Mono', monospace; font-weight: 500; color: #666; }
                .p-num { color: #000; font-weight: 800; margin: 0 5px; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

                .export-excel-btn {
                    background: #000;
                    color: var(--gold);
                    border: 1px solid var(--gold);
                    padding: 10px 20px;
                    border-radius: 4px;
                    font-family: 'Space Mono', monospace;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .export-excel-btn:hover {
                    background: var(--gold);
                    color: #000;
                    box-shadow: 0 5px 20px rgba(201,168,76,0.25);
                    transform: translateY(-2px);
                }
                .export-icon { font-size: 16px; font-weight: 400; }
            `}</style>
        </div>
    );
}
