"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import "./alahly_db_seasons.css";
import GK_Details_Hub from "./alahly_db_gk_details";

export default function AlAhlyGKs({ gkDetails, howPenMissed, filteredMatches, playerDetails }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState("all");
    const [opponentFilter, setOpponentFilter] = useState("all");
    const [isOpen, setIsOpen] = useState(false);
    const [isOppOpen, setIsOppOpen] = useState(false);
    const [oppSearch, setOppSearch] = useState("");
    const dropdownRef = useRef(null);
    const oppDropdownRef = useRef(null);

    const filterLabels = { all: "All Keepers", ahly: "With Al Ahly", opponents: "Against Al Ahly" };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
            if (oppDropdownRef.current && !oppDropdownRef.current.contains(event.target)) setIsOppOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const matchResultsMap = useMemo(() => {
        const map = {};
        (filteredMatches || []).forEach(m => {
            const mId = String(m.MATCH_ID || "").trim();
            map[mId] = {
                gf: parseInt(m.GF || 0) || 0,
                ga: parseInt(m.GA || 0) || 0,
                opp: String(m["OPPONENT TEAM"] || "").trim()
            };
        });
        return map;
    }, [filteredMatches]);

    const currentMatchIds = useMemo(() => new Set(Object.keys(matchResultsMap)), [matchResultsMap]);

    const uniqueOpponents = useMemo(() => {
        const opps = new Set();
        (gkDetails || []).forEach(g => {
            const mId = String(g.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;
            const teamVal = String(g.TEAM || "").trim();
            const isAhly = (teamVal === "الأهلي" || teamVal === "Al-Ahly" || teamVal === "Al Ahly");
            if (!isAhly && teamVal) opps.add(teamVal);
        });
        return Array.from(opps).sort((a, b) => a.localeCompare(b, 'ar'));
    }, [gkDetails, currentMatchIds]);

    const filteredOpponents = useMemo(() => {
        if (!oppSearch) return uniqueOpponents;
        return uniqueOpponents.filter(o => o.toLowerCase().includes(oppSearch.toLowerCase()));
    }, [uniqueOpponents, oppSearch]);

    const gkStats = useMemo(() => {
        const stats = {};

        // 1. Process Basic Stats & Clean Sheets
        (gkDetails || []).forEach(g => {
            const mId = String(g.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;

            const gkName = String(g["PLAYER NAME"] || "").trim();
            if (!gkName || gkName.toLowerCase() === "unknown") return;

            const teamVal = String(g.TEAM || "").trim();
            const isAhly = (teamVal === "الأهلي" || teamVal === "Al-Ahly" || teamVal === "Al Ahly");

            if (teamFilter === "ahly" && !isAhly) return;
            if (teamFilter === "opponents" && isAhly) return;

            // Specific Opponent Filter
            if (opponentFilter !== "all" && teamVal !== opponentFilter) return;

            if (!stats[gkName]) {
                stats[gkName] = { name: gkName, matches: 0, goalsConceded: 0, cleanSheets: 0, penaltiesSaved: 0, penaltiesReceived: 0 };
            }

            stats[gkName].matches += 1;
            stats[gkName].goalsConceded += parseInt(g["GOALS CONCEDED"] || 0) || 0;

            const isStarter = String(g.STATU || "").trim() === "اساسي";
            const stayedAllMatch = !g["OUT MINUTE"] || String(g["OUT MINUTE"]).trim() === "";

            if (isStarter && stayedAllMatch) {
                const matchResult = matchResultsMap[mId];
                if (isAhly && matchResult.ga === 0) stats[gkName].cleanSheets += 1;
                else if (!isAhly && matchResult.gf === 0) stats[gkName].cleanSheets += 1;
            }

            // Calculate penalties received (as goals) for this match record
            const penalties = (playerDetails || []).filter(p => {
                const pmId = String(p.MATCH_ID || "").trim();
                if (pmId !== mId) return false;

                // Penalty goal from opponent
                const isPenGoal = String(p.TYPE_SUB || "").toUpperCase() === "PENGOAL";
                const isOpponentScoring = String(p.TEAM || "").trim() !== teamVal;

                if (!isPenGoal || !isOpponentScoring) return false;

                // Simple check if GK was on field (if out minute exists, only count if pen minute is earlier)
                if (!stayedAllMatch) {
                    const penMin = parseInt(p.MINUTE) || 0;
                    const outMin = parseInt(g["OUT MINUTE"]) || 90;
                    return penMin <= outMin;
                }
                return true;
            });

            stats[gkName].penaltiesReceived += penalties.length;
        });

        // 2. Process Penalty Saves from HOW MISSED? table
        (howPenMissed || []).forEach(row => {
            const mId = String(row.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;

            const description = String(row["HOW MISSED?"] || "");

            Object.keys(stats).forEach(gkName => {
                if (description.includes(gkName)) {
                    stats[gkName].penaltiesSaved += 1;
                }
            });
        });

        let list = Object.values(stats);
        if (searchTerm) list = list.filter(g => g.name.includes(searchTerm));

        return list.sort((a, b) => {
            if (a.name === "?") return 1;
            if (b.name === "?") return -1;
            return b.matches - a.matches;
        });
    }, [gkDetails, howPenMissed, matchResultsMap, currentMatchIds, teamFilter, opponentFilter, searchTerm, playerDetails]);

    const [selectedGK, setSelectedGK] = useState(null);

    return (
        <div className="tab-content" id="tab-gks">
            {selectedGK ? (
                <GK_Details_Hub
                    gkName={selectedGK}
                    gkDetails={gkDetails}
                    howPenMissed={howPenMissed}
                    masterMatches={filteredMatches}
                    playerDetails={playerDetails}
                    onBack={() => setSelectedGK(null)}
                />
            ) : (
                <div className="players-premium-wrap" style={{ maxWidth: '1400px' }}>
                    <div className="header-tabs-container">
                        <div className="section-title">AL AHLY <span className="accent">GOALKEEPERS</span></div>
                    </div>
                    <div className="gold-line"></div>
                    <div className="player-controls">
                        <div className="search-wrap-premium"><input type="text" placeholder="Search keepers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-search-input" /></div>

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
                        <table className="modern-player-table fade-in">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th className="name-th">GOALKEEPER NAME</th>
                                    <th>MATCHES</th>
                                    <th>GOALS CONCEDED</th>
                                    <th>CLEAN SHEETS</th>
                                    <th>PENALTIES RECEIVED</th>
                                    <th>PENALTIES SAVED</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gkStats.length === 0 ? (
                                    <tr><td colSpan="7" style={{ padding: '100px', opacity: 0.4 }}>No keeper data recorded for these matches.</td></tr>
                                ) : (
                                    gkStats.map((g, i) => (
                                        <tr key={g.name} style={{ opacity: g.name === '?' ? 0.4 : 1 }}>
                                            <td><span className={`rank-badge ${i < 3 && g.name !== '?' ? 'rank-1' : ''}`}>{i + 1}</span></td>
                                            <td className="p-name" onClick={() => setSelectedGK(g.name)} style={{ cursor: 'pointer' }}>{g.name}</td>
                                            <td style={{ color: 'var(--gold)', fontWeight: 800 }}>{g.matches}</td>
                                            <td style={{ color: '#e74c3c' }}>{g.goalsConceded}</td>
                                            <td style={{ color: '#2ecc71', fontWeight: 800 }}>{g.cleanSheets}</td>
                                            <td style={{ color: '#9b59b6', fontWeight: 800 }}>{g.penaltiesReceived}</td>
                                            <td style={{ color: '#3498db', fontWeight: 800 }}>{g.penaltiesSaved}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <style jsx>{`
                .premium-scroll::-webkit-scrollbar { width: 5px; }
                .premium-scroll::-webkit-scrollbar-track { background: transparent; }
                .premium-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
                .premium-scroll::-webkit-scrollbar-thumb:hover { background: #ccc; }
                .players-premium-wrap { margin: 0 auto; padding: 0 40px 100px; }
                .header-tabs-container { display: flex; align-items: center; gap: 30px; margin-bottom: 5px; }
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
                .modern-player-table td { padding: 18px; border-bottom: 1px solid #f2f2f2; text-align: center; font-size: 16px; font-weight: 600; }
                .p-name { color: #000; font-weight: 800 !important; }
                .rank-badge { width: 28px; height: 28px; border-radius: 50%; background: #f0f0f0; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; }
                .rank-1 { background: var(--gold); color: #000; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
