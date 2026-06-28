"use client";

import { useMemo, useState, useEffect } from "react";
import "./alahly_db_match_details.css";
import NoData_db from "../../lib/NoData_db";
import { formatHowPenMissedForDisplay } from "../Penalties/alahly_db_penalties_utils";

export default function AlAhlyMatchDetails({
    matchId,
    matches,
    playerDetails,
    lineupDetails,
    gkDetails,
    howPenMissed,
    onBack
}) {

    const [activeTab, setActiveTab] = useState('info'); // 'info', 'lineup', 'events', or 'subs'
    const [selectedPlayerStats, setSelectedPlayerStats] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    // Core data extraction
    const matchInfo = useMemo(() => (matches || []).find(m => String(m.MATCH_ID) === String(matchId)), [matchId, matches]);
    const opponentName = matchInfo?.["OPPONENT TEAM"] || "";

    const checkIfAhly = (teamName) => {
        if (!teamName) return true;
        const name = String(teamName).trim();
        const opp = String(opponentName).trim();

        // 1. If it's exactly the opponent name, it's NOT Ahly
        if (name === opp) return false;

        // 2. If it is exactly "الأهلي", it IS Ahly
        if (name === "الأهلي") return true;

        // 3. If it contains "أهلي" and the opponent's name doesn't, it's likely Ahly
        // (This handles "النادي الأهلي", "الأهلي المصري", etc.)
        if (name.includes("أهلي") && !opp.includes("أهلي")) return true;

        // 4. Default: If it's not clearly Ahly, and we are in an Al Ahly DB, 
        // it was previously returning true. Let's make it more strict:
        // If it doesn't clearly match Ahly's signature, assume it's the opponent.
        return false;
    };

    const handlePlayerClick = (playerName, isPlayerAhly) => {
        if (!playerName) return;

        const oppName = String(opponentName || "").trim();
        if (!oppName) return;

        // Check if player is a goalkeeper
        const isGK = (gkDetails || []).some(g => String(g["PLAYER NAME"] || "").trim() === playerName);

        // 1. Find all match IDs where this player appeared in the lineup
        const playerLineup = (lineupDetails || []).filter(l => 
            String(l["PLAYER NAME"] || "").trim() === playerName &&
            checkIfAhly(l.TEAM) === isPlayerAhly
        );
        const playerMatchIds = new Set(playerLineup.map(l => String(l.MATCH_ID)));

        // 2. Filter matches involving the opponent team and player's appearances
        const relevantMatches = (matches || []).filter(m => {
            const mId = String(m.MATCH_ID);
            const mOpp = String(m["OPPONENT TEAM"] || "").trim();
            return playerMatchIds.has(mId) && mOpp === oppName;
        });

        // 3. Compute stats
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
                // Find goalkeeper record for this match
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
    };

    const squads = useMemo(() => {
        const ahlyLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && checkIfAhly(l.TEAM));
        const oppLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && !checkIfAhly(l.TEAM));

        return {
            ahly: {
                starters: ahlyLineup.filter(p => p.STATU === 'اساسي'),
                subs: ahlyLineup.filter(p => p.STATU !== 'اساسي')
            },
            opp: {
                starters: oppLineup.filter(p => p.STATU === 'اساسي'),
                subs: oppLineup.filter(p => p.STATU !== 'اساسي')
            }
        };
    }, [matchId, lineupDetails, opponentName]);

    const events = useMemo(() => {
        const allEvents = [
            ...(playerDetails || []).filter(p => String(p.MATCH_ID) === String(matchId)).map(e => ({ ...e, eventType: 'player' })),
            ...(howPenMissed || []).filter(h => String(h.MATCH_ID) === String(matchId)).map(e => ({ ...e, eventType: 'penMiss', TYPE: 'PEN MISS' }))
        ].sort((a, b) => parseInt(a.MINUTE || 0) - parseInt(b.MINUTE || 0));

        return {
            ahly: allEvents.filter(e => checkIfAhly(e.TEAM)),
            opp: allEvents.filter(e => !checkIfAhly(e.TEAM)),
            chronological: allEvents
        };
    }, [matchId, playerDetails, howPenMissed, opponentName]);

    // Optimized logic directly from lineupDetails as confirmed
    const getSubInfo = (subPlayer) => {
        // Direct read from the player record in lineupDetails
        const inMin = subPlayer["IN MINUTE"] || subPlayer["MINUTE IN"] || subPlayer["MINUTE"] || subPlayer["OUT MINUTE"];
        const playerOut = subPlayer["PLAYER NAME OUT"] || subPlayer["NAME OUT"];

        if (inMin) {
            return {
                minute: inMin,
                playerOut: playerOut || null
            };
        }
        return null;
    };

    const gks = useMemo(() => ({
        ahly: (gkDetails || []).filter(g => String(g.MATCH_ID) === String(matchId) && checkIfAhly(g.TEAM)),
        opp: (gkDetails || []).filter(g => String(g.MATCH_ID) === String(matchId) && !checkIfAhly(g.TEAM))
    }), [matchId, gkDetails, opponentName]);

    if (!matchInfo) return <div className="error-state">Match record not located.</div>;

    const matchNote = matchInfo["W-L Q & F"] || matchInfo.NOTE || "";

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getEventIcon = (type) => {
        const t = String(type || "").trim().toUpperCase();
        if (t === "PENASSISTGOAL") return "⭐";
        if (t === "PENASSISTMISSED") return "⚠️";
        if (t === "PENMAKEGOAL") return "🎯";
        if (t === "PENMAKEMISSED") return "❌";

        const tLower = t.toLowerCase();
        if (tLower.includes('هدف') || tLower.includes('goal')) return '⚽';
        if (tLower.includes('اسيست') || tLower.includes('assist') || tLower.includes('صنع')) return 'A';

        switch (tLower) {
            case 'انذار':
            case 'yellow': return '🟨';
            case 'طرد':
            case 'red': return '🟥';
            case 'تغيير':
            case 'sub': return '🔄';
            case 'pen miss': return '❌';
            default: return '⚽'; // Default to ball if it's a match-related event we don't recognize
        }
    };

    return (
        <div className="match-center-page fade-in">
            {/* Premium Header/Navigation */}
            <div className="match-nav">
                <button className="btn-back" onClick={onBack}>
                    <span className="icon">←</span>
                    <span className="text">All Matche's</span>
                </button>
                <div className="match-id-badge">{matchId}</div>
            </div>

            {/* Cinematic Scoreboard Section */}
            <section className="hero-scoreboard">
                <div className="hero-overlay"></div>
                <div className="scoreboard-content">
                    <div className="team-display ahly">
                        <div className="team-logo-container">
                            <div className="logo-placeholder ahly-logo">🦅</div>
                        </div>
                        <div className="team-meta">
                            <h1 className="team-name">الأهلي</h1>
                            <span className="manager-tag">COACH: {matchInfo["AHLY MANAGER"]}</span>
                        </div>
                    </div>

                    <div className="score-hub">
                        <div className="score-main">
                            <span className="score-digit">{matchInfo.GF}</span>
                            <span className="score-divider">-</span>
                            <span className="score-digit">{matchInfo.GA}</span>
                        </div>
                        {matchInfo.PEN && <div className="pen-result">{matchInfo.PEN}</div>}

                    </div>

                    <div className="team-display opponent">
                        <div className="team-meta tr">
                            <h1 className="team-name" dir="auto">{matchInfo["OPPONENT TEAM"]}</h1>
                            <span className="manager-tag">COACH: {matchInfo["OPPONENT MANAGER"]}</span>
                        </div>
                        <div className="team-logo-container">
                            <div className="logo-placeholder opp-logo">🛡️</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Tabs Section */}
            <div className="match-details-container">
                <div className="tabs-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        MATCH INFO
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'lineup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lineup')}
                    >
                        SQUAD & LINEUP
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        MATCH TIMELINE
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'subs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subs')}
                    >
                        SUBS TIMELINE
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'motm' ? 'active' : ''}`}
                        onClick={() => setActiveTab('motm')}
                    >
                        MAN OF THE MATCH
                    </button>
                </div>

                {activeTab === 'info' && (
                    <div className="match-info-tab-content fade-in">
                        <div className="info-grid">
                            {/* Card 1: Competition & Date */}
                            <div className="info-card">
                                <div className="info-card-header">
                                    <span className="info-card-icon">🏆</span>
                                    <h3>Competition Details</h3>
                                </div>
                                <div className="info-card-body">
                                    <div className="info-row">
                                        <span className="info-label">DATE</span>
                                        <span className="info-value">{formatDate(matchInfo.DATE)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">CHAMPION</span>
                                        <span className="info-value">{matchInfo.CHAMPION || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">SEASON</span>
                                        <span className="info-value">{matchInfo["SEASON - NAME"] || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">SEASON NUMBER</span>
                                        <span className="info-value">{matchInfo["SEASON - NUMBER"] || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">ROUND</span>
                                        <span className="info-value">{matchInfo.ROUND || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Match Venue & Logistics */}
                            <div className="info-card">
                                <div className="info-card-header">
                                    <span className="info-card-icon">📍</span>
                                    <h3>Venue & Logistics</h3>
                                </div>
                                <div className="info-card-body">
                                    <div className="info-row">
                                        <span className="info-label">PLACE (STADIUM)</span>
                                        <span className="info-value">{matchInfo.STAD || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">H-A-N (VENUE STATUS)</span>
                                        <span className="info-value">
                                            {matchInfo["H-A-N"] === "H" ? "Home" :
                                             matchInfo["H-A-N"] === "A" ? "Away" :
                                             matchInfo["H-A-N"] === "N" ? "Neutral" : matchInfo["H-A-N"] || "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Match Officials & Managers */}
                            <div className="info-card">
                                <div className="info-card-header">
                                    <span className="info-card-icon">👔</span>
                                    <h3>Officials & Staff</h3>
                                </div>
                                <div className="info-card-body">
                                    <div className="info-row">
                                        <span className="info-label">AHLY MANAGER</span>
                                        <span className="info-value">{matchInfo["AHLY MANAGER"] || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">OPPONENT MANAGER</span>
                                        <span className="info-value">{matchInfo["OPPONENT MANAGER"] || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">REFEREE</span>
                                        <span className="info-value">{matchInfo.REFREE || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Competition System */}
                            <div className="info-card">
                                <div className="info-card-header">
                                    <span className="info-card-icon">⚙️</span>
                                    <h3>System Details</h3>
                                </div>
                                <div className="info-card-body">
                                    <div className="info-row">
                                        <span className="info-label">CHAMPION SYSTEM</span>
                                        <span className="info-value">{matchInfo["CHAMPION SYSTEM"] || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">EXTRA TIME (ET)</span>
                                        <span className="info-value">{matchInfo.ET ? "Yes" : "No"}</span>
                                    </div>
                                    {matchInfo.PEN && (
                                        <div className="info-row">
                                            <span className="info-label">PENALTY SHOOTOUT</span>
                                            <span className="info-value" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{matchInfo.PEN}</span>
                                        </div>
                                    )}
                                    {matchInfo.FINAL_ID && (
                                        <div className="info-row">
                                            <span className="info-label">FINAL ID</span>
                                            <span className="info-value">{matchInfo.FINAL_ID}</span>
                                        </div>
                                    )}
                                    {matchInfo["W-D-L FINAL"] && (
                                        <div className="info-row">
                                            <span className="info-label">W-D-L FINAL</span>
                                            <span className="info-value">{matchInfo["W-D-L FINAL"]}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {matchInfo.NOTE && (
                            <div className="info-note-section">
                                <h3>📝 Match Notes</h3>
                                <p>{matchInfo.NOTE}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'lineup' && (
                    <>
                        {/* ── Main Players Grid ── */}
                        <div className="lineup-view grid-layout">
                            {/* Al Ahly Column */}
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
                                                const subInfo = getSubInfo(p, true);
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

                            {/* Opponent Column */}
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
                                                const subInfo = getSubInfo(p, false);
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

                        {/* ── Synchronized GK Row ── */}
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
                    </>
                )}

                {activeTab === 'events' && (
                    <div className="timeline-view">
                        <div className="timeline-container">
                            {events.chronological.length === 0 ? (
                                <NoData_db message="No specific match events recorded for this game." />
                            ) : (
                                <div className="timeline-track">
                                    {events.chronological.map((e, i) => {
                                        const isAhly = checkIfAhly(e.TEAM);
                                        const typeUpper = String(e.TYPE || "").trim().toUpperCase();
                                        const isSpecialPen = ['PENASSISTGOAL', 'PENASSISTMISSED', 'PENMAKEGOAL', 'PENMAKEMISSED'].includes(typeUpper);
                                        return (
                                            <div key={i} className={`timeline-entry ${isAhly ? 'left' : 'right'}`}>
                                                <div className={`entry-content ${isSpecialPen ? 'special-pen-card' : ''}`}>
                                                    <div className="entry-time">{e.MINUTE}'</div>
                                                    <div className="entry-details">
                                                        {!isSpecialPen && <span className="entry-icon">{getEventIcon(e.TYPE)}</span>}
                                                        <div className="entry-text">
                                                            <span className="entry-player">{e["PLAYER NAME"]}</span>
                                                            {isSpecialPen ? (
                                                                <span className={`pen-type-badge ${
                                                                    typeUpper === 'PENASSISTGOAL' ? 'pen-assist-goal' :
                                                                    typeUpper === 'PENASSISTMISSED' ? 'pen-assist-missed' :
                                                                    typeUpper === 'PENMAKEGOAL' ? 'pen-make-goal' :
                                                                    'pen-make-missed'
                                                                }`}>
                                                                    {typeUpper}
                                                                </span>
                                                            ) : !e["HOW MISSED?"] ? (
                                                                <span className="entry-type">
                                                                    {e.TYPE}
                                                                    {e.TYPE_SUB && <span style={{ color: '#ff5252', fontStyle: 'normal' }}> / {e.TYPE_SUB}</span>}
                                                                </span>
                                                            ) : (
                                                                <span className="entry-note">HOW MISSED: {formatHowPenMissedForDisplay(e["HOW MISSED?"])}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="timeline-dot"></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'subs' && (
                    <div className="timeline-view subs-timeline">
                        <div className="timeline-container">
                            {(() => {
                                const subEvents = [
                                    ...squads.ahly.subs.map(s => ({ ...s, isAhly: true })),
                                    ...squads.opp.subs.map(s => ({ ...s, isAhly: false }))
                                ].map(s => {
                                    const rawMin = s["IN MINUTE"] || s["MINUTE IN"] || s["OUT MINUTE"] || s["MINUTE OUT"] || "0";
                                    const minute = parseInt(String(rawMin).replace(/[^0-9]/g, '')) || 0;
                                    return {
                                        ...s,
                                        minute
                                    };
                                })
                                    .filter(s => s.minute > 0)
                                    .sort((a, b) => a.minute - b.minute);

                                if (subEvents.length === 0) {
                                    return <NoData_db message="No substitutions recorded for this game." />;
                                }

                                return (
                                    <div className="timeline-track">
                                        {subEvents.map((s, i) => (
                                            <div key={i} className={`timeline-entry ${s.isAhly ? 'left' : 'right'}`}>
                                                <div className="entry-content premium-sub-entry">
                                                    <div className="sub-premium-card">
                                                        <div className="sub-s-icon">S</div>
                                                        <div className="sub-card-main">
                                                            <div className="sub-player-in-name">{s["PLAYER NAME"]}</div>
                                                            <div className="sub-meta-row">
                                                                <div className="sub-time-pill">
                                                                    <div className="sub-blue-box">
                                                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M17 1L21 5L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                            <path d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                            <path d="M7 23L3 19L7 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                            <path d="M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="sub-min-val">{s.minute}'</span>
                                                                </div>
                                                                <div className="sub-player-out-info">
                                                                    <span className="red-diag-arrow">↙</span>
                                                                    <span className="out-name-text">{s["PLAYER NAME OUT"] || s["NAME OUT"] || "???"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="timeline-dot sub-dot-premium"></div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {activeTab === 'motm' && (
                    <div className="motm-tab-content fade-in">
                        {matchInfo.MOTM ? (
                            <div className="motm-container">
                                <div className="motm-trophy">🏆</div>
                                <h2 className="motm-title">MAN OF THE MATCH</h2>
                                <div className="motm-player-name">{matchInfo.MOTM}</div>
                                {(() => {
                                    const playerEvents = events.chronological.filter(
                                        e => String(e["PLAYER NAME"] || "").trim().toLowerCase() === String(matchInfo.MOTM).trim().toLowerCase()
                                    );
                                    const goals = playerEvents.filter(e => {
                                        const t = String(e.TYPE || "").trim().toLowerCase();
                                        return t.includes("هدف") || t.includes("goal") || t === "penmakegoal";
                                    }).length;
                                    const assists = playerEvents.filter(e => {
                                        const t = String(e.TYPE || "").trim().toLowerCase();
                                        return t.includes("اسيست") || t.includes("assist") || t.includes("صنع") || t === "penassistgoal";
                                    }).length;
                                    const yellows = playerEvents.filter(e => {
                                        const t = String(e.TYPE || "").trim().toLowerCase();
                                        return t === "yellow" || t === "انذار";
                                    }).length;
                                    const reds = playerEvents.filter(e => {
                                        const t = String(e.TYPE || "").trim().toLowerCase();
                                        return t === "red" || t === "طرد";
                                    }).length;

                                    if (goals > 0 || assists > 0 || yellows > 0 || reds > 0) {
                                        return (
                                            <div className="motm-performance-summary">
                                                <h3>Match Performance</h3>
                                                <div className="motm-stats-row">
                                                    {goals > 0 && <span className="motm-stat-item">⚽ {goals} Goal(s)</span>}
                                                    {assists > 0 && <span className="motm-stat-item">🅰️ {assists} Assist(s)</span>}
                                                    {yellows > 0 && <span className="motm-stat-item">🟨 {yellows} Yellow</span>}
                                                    {reds > 0 && <span className="motm-stat-item">🟥 {reds} Red</span>}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        ) : (
                            <NoData_db message="No Man of the Match awarded for this game." />
                        )}
                    </div>
                )}
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
        </div>
    );
}
