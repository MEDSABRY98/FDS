"use client";

import { useMemo, useState, useEffect } from "react";
import "./egypt_nt_db_match_details.css";
import NoData_db from "../../lib/NoData_db";

export default function EgyptNTMatchDetails({
    matchId,
    matches,
    playerDetails,
    lineupDetails,
    gkDetails,
    howPenMissed,
    onBack
}) {

    const [activeTab, setActiveTab] = useState('lineup'); // 'lineup' or 'events'

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Core data extraction
    const matchInfo = useMemo(() => (matches || []).find(m => String(m.MATCH_ID) === String(matchId)), [matchId, matches]);
    const opponentName = matchInfo?.["OPPONENT TEAM"] || "";

    const checkIfEgypt = (teamName) => {
        if (!teamName) return true;
        const name = String(teamName).trim();
        const opp = String(opponentName).trim();

        // 1. If it's exactly the opponent name, it's NOT Egypt
        if (name === opp) return false;

        // 2. If it is exactly "مصر" or "Egypt" or "منتخب مصر" or "المنتخب المصري", it IS Egypt
        if (name === "مصر" || name === "Egypt" || name === "منتخب مصر" || name === "المنتخب المصري") return true;

        // 3. Fallback: If opponent name is something else and it's not clearly opponent, assume Egypt if team is blank or generic
        return false;
    };

    const squads = useMemo(() => {
        const egyptLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && checkIfEgypt(l.TEAM));
        const oppLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && !checkIfEgypt(l.TEAM));

        return {
            egypt: {
                starters: egyptLineup.filter(p => p.STATU === 'اساسي'),
                subs: egyptLineup.filter(p => p.STATU !== 'اساسي')
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
            egypt: allEvents.filter(e => checkIfEgypt(e.TEAM)),
            opp: allEvents.filter(e => !checkIfEgypt(e.TEAM)),
            chronological: allEvents
        };
    }, [matchId, playerDetails, howPenMissed, opponentName]);

    const getSubInfo = (subPlayer) => {
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
        egypt: (gkDetails || []).filter(g => String(g.MATCH_ID) === String(matchId) && checkIfEgypt(g.TEAM)),
        opp: (gkDetails || []).filter(g => String(g.MATCH_ID) === String(matchId) && !checkIfEgypt(g.TEAM))
    }), [matchId, gkDetails, opponentName]);

    if (!matchInfo) return <div className="error-state">Match record not located.</div>;

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getEventIcon = (type) => {
        const t = String(type || "").trim().toLowerCase();
        if (t.includes('هدف') || t.includes('goal')) return '⚽';
        if (t.includes('اسيست') || t.includes('assist') || t.includes('صنع')) return 'A';

        switch (t) {
            case 'انذار':
            case 'yellow': return '🟨';
            case 'طرد':
            case 'red': return '🟥';
            case 'تغيير':
            case 'sub': return '🔄';
            case 'pen miss': return '❌';
            default: return '⚽';
        }
    };

    return (
        <div className="match-center-page fade-in">
            {/* Premium Header/Navigation */}
            <div className="match-nav">
                <button className="btn-back" onClick={onBack}>
                    <span className="icon">←</span>
                    <span className="text">All Matches</span>
                </button>
                <div className="match-id-badge">{matchId}</div>
            </div>

            {/* Cinematic Scoreboard Section */}
            <section className="hero-scoreboard">
                <div className="hero-overlay"></div>
                <div className="scoreboard-content">
                    <div className="team-display egypt">
                        <div className="team-logo-container">
                            <div className="logo-placeholder egypt-logo">🇪🇬</div>
                        </div>
                        <div className="team-meta">
                            <h1 className="team-name">منتخب مصر</h1>
                            <span className="manager-tag">COACH: {matchInfo["EGYPT MANAGER"]}</span>
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

                <div className="match-info-strip">
                    <div className="info-item">
                        <span className="label">DATE</span>
                        <span className="value">{formatDate(matchInfo.DATE)}</span>
                    </div>
                    <div className="info-divider"></div>
                    <div className="info-item">
                        <span className="label">SEASON</span>
                        <span className="value">{matchInfo["SEASON"]}</span>
                    </div>
                    <div className="info-divider"></div>
                    <div className="info-item">
                        <span className="label">ROUND</span>
                        <span className="value">{matchInfo.ROUND}</span>
                    </div>
                    <div className="info-divider"></div>
                    <div className="info-item">
                        <span className="label">STADIUM</span>
                        <span className="value">{matchInfo.STAD}</span>
                    </div>
                    {matchInfo.PLACE && (
                        <>
                            <div className="info-divider"></div>
                            <div className="info-item">
                                <span className="label">PLACE</span>
                                <span className="value">{matchInfo.PLACE}</span>
                            </div>
                        </>
                    )}
                    <div className="info-divider"></div>
                    <div className="info-item">
                        <span className="label">REFEREE</span>
                        <span className="value">{matchInfo.REFREE}</span>
                    </div>
                </div>
            </section>

            {/* Interactive Tabs Section */}
            <div className="match-details-container">
                <div className="tabs-navigation">
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
                </div>

                {activeTab === 'lineup' && (
                    <>
                        {/* ── Main Players Grid ── */}
                        <div className="lineup-view grid-layout">
                            {/* Egypt Column */}
                            <div className="team-column egypt-theme">
                                <div className="column-header">
                                    <span className="team-label">منتخب مصر</span>
                                    <span className="starter-count">{squads.egypt.starters.length} STARTERS</span>
                                </div>
                                <div className="players-list">
                                    <h3 className="list-title">STARTERS</h3>
                                    {squads.egypt.starters.length === 0 ? (
                                        Array(11).fill(0).map((_, i) => (
                                            <div key={i} className="player-card placeholder-card">
                                                <span className="player-num">{i + 1}</span>
                                                <span className="player-name">Match Player</span>
                                            </div>
                                        ))
                                    ) : (
                                        squads.egypt.starters.map((p, i) => {
                                            const wasSubbed = p["OUT MINUTE"] || p["MINUTE OUT"];
                                            return (
                                                <div key={i} className="player-card">
                                                    <span className="player-num">{i + 1}</span>
                                                    <span className="player-name">
                                                        {p["PLAYER NAME"]} {wasSubbed && <span className="out-arrow-indicator">▼</span>}
                                                        {p.CLUB && <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>({p.CLUB})</span>}
                                                    </span>
                                                    <div className="player-badges">
                                                        {events.egypt.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"]).map((e, idx) => (
                                                            <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                                {getEventIcon(e.TYPE)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    {squads.egypt.subs.length > 0 && (
                                        <>
                                            <h3 className="list-title subs-title">SUBSTITUTES</h3>
                                            {squads.egypt.subs.map((p, i) => {
                                                const subInfo = getSubInfo(p);
                                                return (
                                                    <div key={i} className="player-card sub-card">
                                                        <span className="player-num sub-num">S</span>
                                                        <div className="sub-main">
                                                            <span className="player-name">
                                                                {p["PLAYER NAME"]}
                                                                {p.CLUB && <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>({p.CLUB})</span>}
                                                            </span>
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
                                                            {events.egypt.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"] && String(e.TYPE).trim() !== 'تغيير').map((e, idx) => (
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
                                                <div key={i} className="player-card rev">
                                                    <div className="player-badges">
                                                        {events.opp.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"]).map((e, idx) => (
                                                            <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                                {getEventIcon(e.TYPE)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="player-name tr">
                                                        {wasSubbed && <span className="out-arrow-indicator">▼</span>} {p["PLAYER NAME"]}
                                                        {p.CLUB && <span style={{ fontSize: '11px', color: '#999', marginRight: '6px' }}>({p.CLUB})</span>}
                                                    </span>
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
                                                    <div key={i} className="player-card sub-card rev">
                                                        <span className="player-num sub-num">S</span>
                                                        <div className="sub-main tr">
                                                            <span className="player-name">
                                                                {p["PLAYER NAME"]}
                                                                {p.CLUB && <span style={{ fontSize: '11px', color: '#999', marginRight: '6px' }}>({p.CLUB})</span>}
                                                            </span>
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

                        {/* ── Goalkeeper Row ── */}
                        <div className="gk-sync-row grid-layout">
                            <div className="team-column egypt-theme">
                                <div className="gk-section">
                                    <h3 className="list-title">GOALKEEPER</h3>
                                    {gks.egypt.length === 0 ? (
                                        <div className="gk-card highlighting placeholder-card op-mask">
                                            <span className="gk-icon">🧤</span>
                                            <div className="gk-info">
                                                <span className="gk-name">Main Keeper</span>
                                                <span className="gk-stat">N/A</span>
                                            </div>
                                        </div>
                                    ) : (
                                        gks.egypt.map((g, i) => (
                                            <div key={i} className="gk-card highlighting">
                                                <span className="gk-icon">🧤</span>
                                                <div className="gk-info">
                                                    <span className="gk-name">
                                                        {g["PLAYER NAME"]}
                                                        {g.CLUB && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginLeft: '6px' }}>({g.CLUB})</span>}
                                                    </span>
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
                                                    <span className="gk-name">
                                                        {g["PLAYER NAME"]}
                                                        {g.CLUB && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginRight: '6px' }}>({g.CLUB})</span>}
                                                    </span>
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
                                        const isEgypt = checkIfEgypt(e.TEAM);
                                        return (
                                            <div key={i} className={`timeline-entry ${isEgypt ? 'left' : 'right'}`}>
                                                <div className="entry-content">
                                                    <div className="entry-time">{e.MINUTE}'</div>
                                                    <div className="entry-details">
                                                        <span className="entry-icon">{getEventIcon(e.TYPE)}</span>
                                                        <div className="entry-text">
                                                            <span className="entry-player">
                                                                {e["PLAYER NAME"]}
                                                                {e.CLUB && <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>({e.CLUB})</span>}
                                                            </span>
                                                            {!e["HOW MISSED?"] ? (
                                                                <span className="entry-type">
                                                                    {e.TYPE}
                                                                    {e.TYPE_SUB && <span style={{ color: '#ff5252', fontStyle: 'normal' }}> / {e.TYPE_SUB}</span>}
                                                                </span>
                                                            ) : (
                                                                <span className="entry-note">HOW MISSED: {e["HOW MISSED?"]}</span>
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
                                    ...squads.egypt.subs.map(s => ({ ...s, isEgypt: true })),
                                    ...squads.opp.subs.map(s => ({ ...s, isEgypt: false }))
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
                                            <div key={i} className={`timeline-entry ${s.isEgypt ? 'left' : 'right'}`}>
                                                <div className="entry-content premium-sub-entry">
                                                    <div className="sub-premium-card">
                                                        <div className="sub-s-icon">S</div>
                                                        <div className="sub-card-main">
                                                            <div className="sub-player-in-name">
                                                                {s["PLAYER NAME"]}
                                                                {s.CLUB && <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>({s.CLUB})</span>}
                                                            </div>
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
            </div>
        </div>
    );
}
