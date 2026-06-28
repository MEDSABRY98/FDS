"use client";

import { useState, useCallback } from "react";
import { checkIfAhly, getEventIcon, getSubInfo } from "./alahly_db_match_details_utils";

export default function LineupTab({
    matchInfo,
    squads,
    events,
    gks,
    opponentName,
    matches,
    lineupDetails,
    playerDetails,
    gkDetails,
}) {
    const [selectedPlayerStats, setSelectedPlayerStats] = useState(null);

    const handlePlayerClick = useCallback((playerName, isPlayerAhly) => {
        if (!playerName) return;

        const oppName = String(opponentName || "").trim();
        if (!oppName) return;

        const isGK = (gkDetails || []).some(g => String(g["PLAYER NAME"] || "").trim() === playerName);

        const playerLineup = (lineupDetails || []).filter(l =>
            String(l["PLAYER NAME"] || "").trim() === playerName &&
            checkIfAhly(l.TEAM, opponentName) === isPlayerAhly
        );
        const playerMatchIds = new Set(playerLineup.map(l => String(l.MATCH_ID)));

        const relevantMatches = (matches || []).filter(m => {
            const mId = String(m.MATCH_ID);
            const mOpp = String(m["OPPONENT TEAM"] || "").trim();
            return playerMatchIds.has(mId) && mOpp === oppName;
        });

        let matchesCount = relevantMatches.length;
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goals = 0;
        let assists = 0;
        let goalsConceded = 0;
        let cleanSheets = 0;

        relevantMatches.forEach(m => {
            const gf = parseInt(m.GF) || 0;
            const ga = parseInt(m.GA) || 0;

            if (isPlayerAhly) {
                if (gf > ga) wins++;
                else if (gf < ga) losses++;
                else draws++;
            } else {
                if (ga > gf) wins++;
                else if (ga < gf) losses++;
                else draws++;
            }

            if (isGK) {
                const gkRecord = (gkDetails || []).find(g =>
                    String(g.MATCH_ID) === String(m.MATCH_ID) &&
                    String(g["PLAYER NAME"] || "").trim() === playerName
                );
                if (gkRecord) {
                    const conceded = parseInt(gkRecord["GOALS CONCEDED"] || gkRecord["CONCEDED"] || 0) || 0;
                    goalsConceded += conceded;
                    if (conceded === 0) {
                        cleanSheets++;
                    }
                }
            } else {
                const mEvents = (playerDetails || []).filter(p =>
                    String(p.MATCH_ID) === String(m.MATCH_ID) &&
                    String(p["PLAYER NAME"] || "").trim() === playerName
                );

                mEvents.forEach(e => {
                    const t = String(e.TYPE || "").trim().toUpperCase();
                    const tLower = t.toLowerCase();
                    const isGoal = tLower.includes("هدف") || tLower.includes("goal") || t === "PENMAKEGOAL";
                    const isAssist = tLower.includes("اسيست") || tLower.includes("assist") || tLower.includes("صنع") || t === "PENASSISTGOAL";

                    if (isGoal) goals++;
                    if (isAssist) assists++;
                });
            }
        });

        setSelectedPlayerStats({
            name: playerName,
            opponent: isPlayerAhly ? oppName : "الأهلي",
            isGoalkeeper: isGK,
            stats: {
                matches: matchesCount,
                wins,
                draws,
                losses,
                goals,
                assists,
                goalsConceded,
                cleanSheets
            }
        });
    }, [opponentName, lineupDetails, matches, playerDetails, gkDetails]);

    return (
        <>
            <div className="lineup-view grid-layout">
                <div className="team-column ahly-theme">
                    <div className="column-header">
                        <span className="team-label">الأهلي</span>
                        <span className="starter-count">{squads.ahly.starters.length} STARTERS</span>
                    </div>
                    <div className="players-list">
                        <h3 className="list-title">STARTERS</h3>
                        {squads.ahly.starters.length === 0 ? (
                            Array(11).fill(0).map((_, i) => (
                                <div key={i} className="player-card placeholder-card">
                                    <span className="player-num">{i + 1}</span>
                                    <span className="player-name">Match Player</span>
                                </div>
                            ))
                        ) : (
                            squads.ahly.starters.map((p, i) => {
                                const wasSubbed = p["OUT MINUTE"] || p["MINUTE OUT"];
                                return (
                                    <div key={i} className="player-card" onClick={() => handlePlayerClick(p["PLAYER NAME"], true)} style={{ cursor: "pointer" }}>
                                        <span className="player-num">{i + 1}</span>
                                        <span className="player-name">{p["PLAYER NAME"]} {wasSubbed && <span className="out-arrow-indicator">▼</span>}</span>
                                        <div className="player-badges">
                                            {events.ahly.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"]).map((e, idx) => (
                                                <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                    {getEventIcon(e.TYPE)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {squads.ahly.subs.length > 0 && (
                            <>
                                <h3 className="list-title subs-title">SUBSTITUTES</h3>
                                {squads.ahly.subs.map((p, i) => {
                                    const subInfo = getSubInfo(p);
                                    return (
                                        <div key={i} className="player-card sub-card" onClick={() => handlePlayerClick(p["PLAYER NAME"], true)} style={{ cursor: "pointer" }}>
                                            <span className="player-num sub-num">S</span>
                                            <div className="sub-main">
                                                <span className="player-name">{p["PLAYER NAME"]}</span>
                                                {subInfo && (
                                                    <div className="sub-details-row">
                                                        <span className="sub-in-label">🔄 {subInfo.minute}'</span>
                                                        {subInfo.playerOut && (
                                                            <span className="sub-out-label">↙ {subInfo.playerOut}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="player-badges">
                                                {events.ahly.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"] && String(e.TYPE).trim() !== 'تغيير').map((e, idx) => (
                                                    <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                        {getEventIcon(e.TYPE)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                <div className="team-column opp-theme">
                    <div className="column-header">
                        <span className="team-label">{matchInfo["OPPONENT TEAM"]}</span>
                        <span className="starter-count">{squads.opp.starters.length} STARTERS</span>
                    </div>
                    <div className="players-list">
                        <h3 className="list-title">STARTERS</h3>
                        {squads.opp.starters.length === 0 ? (
                            Array(11).fill(0).map((_, i) => (
                                <div key={i} className="player-card placeholder-card rev">
                                    <span className="player-num">{i + 1}</span>
                                    <span className="player-name tr">Match Player</span>
                                </div>
                            ))
                        ) : (
                            squads.opp.starters.map((p, i) => {
                                const wasSubbed = p["OUT MINUTE"] || p["MINUTE OUT"];
                                return (
                                    <div key={i} className="player-card rev" onClick={() => handlePlayerClick(p["PLAYER NAME"], false)} style={{ cursor: "pointer" }}>
                                        <div className="player-badges">
                                            {events.opp.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"]).map((e, idx) => (
                                                <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                    {getEventIcon(e.TYPE)}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="player-name tr">{wasSubbed && <span className="out-arrow-indicator">▼</span>} {p["PLAYER NAME"]}</span>
                                        <span className="player-num">{i + 1}</span>
                                    </div>
                                );
                            })
                        )}
                        {squads.opp.subs.length > 0 && (
                            <>
                                <h3 className="list-title subs-title">SUBSTITUTES</h3>
                                {squads.opp.subs.map((p, i) => {
                                    const subInfo = getSubInfo(p);
                                    return (
                                        <div key={i} className="player-card sub-card rev" onClick={() => handlePlayerClick(p["PLAYER NAME"], false)} style={{ cursor: "pointer" }}>
                                            <span className="player-num sub-num">S</span>
                                            <div className="sub-main tr">
                                                <span className="player-name">{p["PLAYER NAME"]}</span>
                                                {subInfo && (
                                                    <div className="sub-details-row rev">
                                                        <span className="sub-in-label">🔄 {subInfo.minute}'</span>
                                                        {subInfo.playerOut && (
                                                            <span className="sub-out-label">↙ {subInfo.playerOut}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="player-badges">
                                                {events.opp.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"] && String(e.TYPE).trim() !== 'تغيير').map((e, idx) => (
                                                    <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                        {getEventIcon(e.TYPE)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="gk-sync-row grid-layout">
                <div className="team-column ahly-theme">
                    <div className="gk-section">
                        <h3 className="list-title">GOALKEEPER</h3>
                        {gks.ahly.length === 0 ? (
                            <div className="gk-card highlighting placeholder-card op-mask">
                                <span className="gk-icon">🧤</span>
                                <div className="gk-info">
                                    <span className="gk-name">Main Keeper</span>
                                    <span className="gk-stat">N/A</span>
                                </div>
                            </div>
                        ) : (
                            gks.ahly.map((g, i) => (
                                <div key={i} className="gk-card highlighting">
                                    <span className="gk-icon">🧤</span>
                                    <div className="gk-info">
                                        <span className="gk-name">{g["PLAYER NAME"]}</span>
                                        <span className="gk-stat">{g["GOALS CONCEDED"]} GA</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="team-column opp-theme">
                    <div className="gk-section">
                        <h3 className="list-title">GOALKEEPER</h3>
                        {gks.opp.length === 0 ? (
                            <div className="gk-card highlighting placeholder-card rev op-mask">
                                <div className="gk-info tr">
                                    <span className="gk-name">Main Keeper</span>
                                    <span className="gk-stat">N/A</span>
                                </div>
                                <span className="gk-icon">🧤</span>
                            </div>
                        ) : (
                            gks.opp.map((g, i) => (
                                <div key={i} className="gk-card highlighting rev">
                                    <div className="gk-info tr">
                                        <span className="gk-name">{g["PLAYER NAME"]}</span>
                                        <span className="gk-stat">{g["GOALS CONCEDED"]} GA</span>
                                    </div>
                                    <span className="gk-icon">🧤</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {selectedPlayerStats && (
                <div className="player-stats-modal-overlay" onClick={() => setSelectedPlayerStats(null)}>
                    <div className="player-stats-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setSelectedPlayerStats(null)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <div className="modal-header">
                            <h3 className="modal-player-name">{selectedPlayerStats.name}</h3>
                            <div className="modal-player-opponent">
                                {selectedPlayerStats.opponent}
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card stat-matches">
                                <span className="stat-num">{selectedPlayerStats.stats.matches}</span>
                                <span className="stat-label">Matches</span>
                            </div>
                            <div className="stat-card stat-wins">
                                <span className="stat-num">{selectedPlayerStats.stats.wins}</span>
                                <span className="stat-label">Wins</span>
                            </div>
                            <div className="stat-card stat-draws">
                                <span className="stat-num">{selectedPlayerStats.stats.draws}</span>
                                <span className="stat-label">Draws</span>
                            </div>
                            <div className="stat-card stat-losses">
                                <span className="stat-num">{selectedPlayerStats.stats.losses}</span>
                                <span className="stat-label">Losses</span>
                            </div>
                            {selectedPlayerStats.isGoalkeeper ? (
                                <>
                                    <div className="stat-card stat-conceded">
                                        <span className="stat-num">{selectedPlayerStats.stats.goalsConceded}</span>
                                        <span className="stat-label">Conceded</span>
                                    </div>
                                    <div className="stat-card stat-cleansheets">
                                        <span className="stat-num">{selectedPlayerStats.stats.cleanSheets}</span>
                                        <span className="stat-label">Clean Sheets</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="stat-card stat-goals">
                                        <span className="stat-num">{selectedPlayerStats.stats.goals}</span>
                                        <span className="stat-label">Goals</span>
                                    </div>
                                    <div className="stat-card stat-assists">
                                        <span className="stat-num">{selectedPlayerStats.stats.assists}</span>
                                        <span className="stat-label">Assists</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
