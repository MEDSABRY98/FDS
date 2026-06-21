"use client";

import { useState } from "react";
import NoData_db from "../../lib/NoData_db";
import {
    parseMatchDate,
    isCountableGoalEvent,
    isEventOnPlayerSide,
    sortEventsByMinute,
    getPlayerSideFlag
} from "./egypt_nt_player_impact_utils";

export default function PlayerGoalImpactTable({ impactData = {}, opponentByMatchId = {} }) {
    const [activeFilter, setActiveFilter] = useState("ALL");
    const impactMatches = impactData.impactMatches || [];

    const winCount = impactMatches.filter(m => m.type.includes("WINNER")).length;
    const drawCount = impactMatches.filter(m => m.type.includes("DRAW")).length;
    const totalImpact = winCount + drawCount;

    const displayMatches = impactMatches
        .filter(item => {
            if (activeFilter === "WIN") return item.type.includes("WINNER");
            if (activeFilter === "DRAW") return item.type.includes("DRAW");
            return true;
        })
        .sort((a, b) => parseMatchDate(b.match) - parseMatchDate(a.match));

    return (
        <div className="impact-section fade-in">
            <div className="impact-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                <div
                    className={`impact-card total ${activeFilter === "ALL" ? "active-f" : ""}`}
                    onClick={() => setActiveFilter("ALL")}
                    style={{ cursor: "pointer" }}
                >
                    <div className="card-label">TOTAL DECISIVE IMPACTS</div>
                    <div className="card-value">{totalImpact}</div>
                    <div className="card-sub">Matches where goals directly avoided Loss or secured Win</div>
                </div>
                <div
                    className={`impact-card wins ${activeFilter === "WIN" ? "active-f" : ""}`}
                    onClick={() => setActiveFilter("WIN")}
                    style={{ cursor: "pointer" }}
                >
                    <div className="card-label">MATCH-WINNING GOALS</div>
                    <div className="card-value" style={{ color: "#27ae60" }}>{winCount}</div>
                    <div className="card-sub">Goals that provided the final winning lead</div>
                </div>
                <div
                    className={`impact-card draws ${activeFilter === "DRAW" ? "active-f" : ""}`}
                    onClick={() => setActiveFilter("DRAW")}
                    style={{ cursor: "pointer" }}
                >
                    <div className="card-label">EQUALIZING GOALS</div>
                    <div className="card-value" style={{ color: "#e67e22" }}>{drawCount}</div>
                    <div className="card-sub">Last goals scored to secure a draw point</div>
                </div>
            </div>

            <div className="history-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="history-title">
                    DECISIVE MATCH HISTORY{" "}
                    <span style={{ color: "#aaa", fontSize: "12px", letterSpacing: "1px" }}>({impactMatches.length} RECORDS)</span>
                </div>
                <div className="filter-pills" style={{ display: "flex", gap: "10px" }}>
                    {["ALL", "WIN", "DRAW"].map(f => (
                        <button key={f} className={`f-pill ${activeFilter === f ? "active" : ""}`} onClick={() => setActiveFilter(f)}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ overflowX: "auto" }}>
                {displayMatches.length === 0 ? (
                    <NoData_db message="NO RECORDED GOAL IMPACTS FOR THIS PLAYER" />
                ) : (
                    <table className="player-match-table impact-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>SEASON</th>
                                <th>OPPONENT</th>
                                <th>SCORE</th>
                                <th>GOAL MINS</th>
                                <th>IMPACT TYPE</th>
                                <th>RESULT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayMatches.map((item, idx) => {
                                const matchId = String(item.match.MATCH_ID);
                                const opponent = opponentByMatchId[matchId] || item.match["OPPONENT TEAM"] || "—";
                                return (
                                    <tr key={`${matchId}-${idx}`}>
                                        <td style={{ fontSize: "14px", opacity: 0.8 }}>{item.match.DATE}</td>
                                        <td style={{ fontSize: "14px", opacity: 0.8 }}>{item.match.SEASON}</td>
                                        <td style={{ color: "var(--player-gold)", fontWeight: 800, fontSize: "16px" }}>{opponent}</td>
                                        <td style={{ fontFamily: "Space Mono", fontWeight: 800, fontSize: "17px" }}>
                                            {item.match.GF} - {item.match.GA}
                                        </td>
                                        <td style={{ fontSize: "15px", fontWeight: 800 }}>
                                            {item.playerMins ? item.playerMins.join(", ") + "'" : "—"}
                                        </td>
                                        <td>
                                            <span className={`impact-pill ${item.type.includes("WINNER") ? "pill-win" : "pill-draw"}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 800, color: item.match["W-D-L"] === "W" ? "#27ae60" : "#e67e22" }}>
                                            {item.match["W-D-L"] === "W" ? "WIN" : "DRAW"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
                .impact-card {
                    background: #fff;
                    border: 1px solid #eee;
                    padding: 30px;
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                    transition: 0.3s;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
                }
                .impact-card.active-f {
                    border-color: var(--player-gold);
                    background: rgba(201, 168, 76, 0.05);
                    box-shadow: 0 10px 30px rgba(201, 168, 76, 0.1);
                }
                .impact-card::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 100px;
                    height: 100px;
                    background: radial-gradient(circle, rgba(201, 168, 76, 0.08) 0%, transparent 70%);
                    pointer-events: none;
                }
                .impact-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(201, 168, 76, 0.5);
                    box-shadow: 0 15px 50px rgba(201, 168, 76, 0.1);
                }
                .card-label {
                    font-family: "Space Mono";
                    font-size: 10px;
                    letter-spacing: 2px;
                    color: #888;
                    margin-bottom: 10px;
                    font-weight: 800;
                }
                .card-value {
                    font-family: "Bebas Neue";
                    font-size: 48px;
                    color: #000;
                    line-height: 1;
                }
                .card-sub {
                    font-size: 11px;
                    color: #666;
                    margin-top: 10px;
                    font-weight: 600;
                    line-height: 1.4;
                }
                .impact-pill {
                    font-size: 11px;
                    font-weight: 800;
                    padding: 7px 14px;
                    border-radius: 6px;
                    letter-spacing: 0.5px;
                    font-family: "Space Mono";
                }
                .pill-win {
                    background: rgba(39, 174, 96, 0.1);
                    color: #27ae60;
                    border: 1px solid rgba(39, 174, 96, 0.2);
                }
                .pill-draw {
                    background: rgba(230, 126, 34, 0.1);
                    color: #e67e22;
                    border: 1px solid rgba(230, 126, 34, 0.2);
                }
                .f-pill {
                    background: #eee;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-family: "Space Mono";
                    font-weight: 800;
                    font-size: 11px;
                    cursor: pointer;
                    transition: 0.2s;
                    color: #888;
                }
                .f-pill.active {
                    background: var(--player-gold);
                    color: #000;
                }
                .f-pill:hover:not(.active) {
                    background: #d2d2d2;
                }
                .impact-table tr:hover {
                    background: rgba(0, 0, 0, 0.02);
                }
            `}</style>
        </div>
    );
}

export function computePlayerGoalImpact(matches, allEvents, playerName, eventsByMatch = null) {
    const searchName = String(playerName || "").trim();
    let winImpact = 0;
    let drawImpact = 0;
    const impactMatches = [];

    (matches || []).forEach(match => {
        const mid = String(match.MATCH_ID);
        const gf = parseInt(match.GF) || 0;
        const ga = parseInt(match.GA) || 0;
        const res = match["W-D-L"];

        let matchEvents = [];
        if (eventsByMatch) {
            matchEvents = eventsByMatch.get(mid) || [];
        } else {
            matchEvents = (allEvents || []).filter(e => String(e.MATCH_ID) === mid);
        }
        
        const playerRecord = matchEvents.find(e => String(e["PLAYER NAME"] || "").trim() === searchName);
        if (!playerRecord) return;

        const isEgyptSideInThisMatch = getPlayerSideFlag(playerRecord, match);
        const playerTeamWon = isEgyptSideInThisMatch ? res === "W" : res === "L";
        const isDraw = res === "D" || res === "D.";
        const playerSideG = isEgyptSideInThisMatch ? gf : ga;
        const opponentSideG = isEgyptSideInThisMatch ? ga : gf;

        const sideGoals = sortEventsByMinute(
            matchEvents.filter(
                e => isEventOnPlayerSide(e, match, isEgyptSideInThisMatch) && isCountableGoalEvent(e)
            )
        );

        if (sideGoals.length === 0) return;

        if (playerTeamWon) {
            if (playerSideG - opponentSideG === 1) {
                const lg = sideGoals[sideGoals.length - 1];
                if (String(lg["PLAYER NAME"] || "").trim() === searchName) {
                    winImpact++;
                    impactMatches.push({ match, type: "WINNER (Deciding Goal)", playerMins: [lg.MINUTE] });
                }
            } else if (playerSideG > 1 && opponentSideG < playerSideG) {
                const scorers = [...new Set(sideGoals.map(g => String(g["PLAYER NAME"] || "").trim()))];
                if (scorers.length === 1 && scorers[0] === searchName) {
                    winImpact++;
                    impactMatches.push({
                        match,
                        type: "WINNER (Sole Scorer)",
                        playerMins: sideGoals.map(g => g.MINUTE)
                    });
                }
            }
        } else if (isDraw && playerSideG > 0) {
            const lg = sideGoals[sideGoals.length - 1];
            if (String(lg["PLAYER NAME"] || "").trim() === searchName) {
                drawImpact++;
                impactMatches.push({ match, type: "DRAW (Equalizer)", playerMins: [lg.MINUTE] });
            }
        }
    });

    return { winImpact, drawImpact, impactMatches };
}
