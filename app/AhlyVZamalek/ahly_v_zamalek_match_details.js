"use client";

import { useMemo, useState, useEffect } from "react";
import "./ahly_v_zamalek_match_details.css";
import NoData_db from "../lib/NoData_db";

export default function AhlyVZamalekMatchDetails({
    matchId,
    matches,
    playerDetails,
    lineupDetails,
    onBack
}) {
    const [activeTab, setActiveTab] = useState('lineup'); // 'lineup' or 'events'

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Core data extraction
    const matchInfo = useMemo(() => (matches || []).find(m => String(m.MATCH_ID) === String(matchId)), [matchId, matches]);

    const checkIfAhly = (teamName) => {
        if (!teamName) return true;
        const name = String(teamName).trim().toUpperCase();
        return name === 'AHLY' || name === 'الأهلي';
    };

    const squads = useMemo(() => {
        const ahlyLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && checkIfAhly(l.TEAM));
        const zamalekLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && !checkIfAhly(l.TEAM));

        const sortLineup = (a, b) => {
            const numA = parseInt(String(a.ROW_ID || '').replace(/[^0-9]/g, '')) || 0;
            const numB = parseInt(String(b.ROW_ID || '').replace(/[^0-9]/g, '')) || 0;
            return numA - numB;
        };

        const ahlySorted = [...ahlyLineup].sort(sortLineup);
        const zamalekSorted = [...zamalekLineup].sort(sortLineup);

        return {
            ahly: {
                starters: ahlySorted.filter(p => p.STATU === 'اساسي' || p.STATU === 'أساسي'),
                subs: ahlySorted.filter(p => p.STATU !== 'اساسي' && p.STATU !== 'أساسي')
            },
            zamalek: {
                starters: zamalekSorted.filter(p => p.STATU === 'اساسي' || p.STATU === 'أساسي'),
                subs: zamalekSorted.filter(p => p.STATU !== 'اساسي' && p.STATU !== 'أساسي')
            }
        };
    }, [matchId, lineupDetails]);

    const events = useMemo(() => {
        const allEvents = (playerDetails || [])
            .filter(p => String(p.MATCH_ID) === String(matchId))
            .map(e => ({ ...e, eventType: 'player' }))
            .sort((a, b) => {
                const minA = parseInt(String(a.MINUTE || '0').replace(/[^0-9]/g, '')) || 0;
                const minB = parseInt(String(b.MINUTE || '0').replace(/[^0-9]/g, '')) || 0;
                return minA - minB;
            });

        return {
            ahly: allEvents.filter(e => checkIfAhly(e.TEAM)),
            zamalek: allEvents.filter(e => !checkIfAhly(e.TEAM)),
            chronological: allEvents
        };
    }, [matchId, playerDetails]);

    // Goalkeepers are the first starter in lineups. Conceded goals are dynamic.
    const gks = useMemo(() => {
        if (!matchInfo) return { ahly: [], zamalek: [] };
        const ahlyGK = squads.ahly.starters[0];
        const zamalekGK = squads.zamalek.starters[0];
        return {
            ahly: ahlyGK ? [{ "PLAYER NAME": ahlyGK["PLAYER NAME"], "GOALS CONCEDED": matchInfo.GA }] : [],
            zamalek: zamalekGK ? [{ "PLAYER NAME": zamalekGK["PLAYER NAME"], "GOALS CONCEDED": matchInfo.GF }] : []
        };
    }, [squads, matchInfo]);

    // Optimized logic directly from lineupDetails as confirmed
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

    if (!matchInfo) return <div className="error-state">Match record not located.</div>;

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getEventIcon = (type) => {
        const t = String(type || "").trim().toLowerCase();
        if (t.includes('هدف') || t.includes('goal') || t.includes('penmakegoal')) return '⚽';
        if (t.includes('اسيست') || t.includes('assist') || t.includes('صنع') || t.includes('penassistgoal')) return 'A';

        switch (t) {
            case 'انذار':
            case 'yellow card':
            case 'yellow': return '🟨';
            case 'طرد':
            case 'red card':
            case 'red': return '🟥';
            case 'تغيير':
            case 'sub': return '🔄';
            case 'pen miss':
            case 'penmissed':
            case 'penassistmissed': return '❌';
            default: return '⚽';
        }
    };

    return (
        <div className="match-center-page fade-in">
            {/* Premium Header/Navigation */}
            <div className="match-nav">
                <button className="btn-back" onClick={onBack}>
                    <span className="icon">←</span>
                    <span className="text">All Derby Matches</span>
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
                            <span className="manager-tag">COACH: {matchInfo["AHLY MANAGER"] || "?"}</span>
                        </div>
                    </div>

                    <div className="score-hub">
                        <div className="score-main">
                            <span className="score-digit">{matchInfo.GF}</span>
                            <span className="score-divider">-</span>
                            <span className="score-digit">{matchInfo.GA}</span>
                        </div>
                        {matchInfo.PEN && <div className="pen-result">{matchInfo.PEN}</div>}
                        {matchInfo["W-D-L"] && (
                            <div className={`match-status-pill ${
                                matchInfo["W-D-L"] === 'W' ? 'win' : matchInfo["W-D-L"] === 'L' ? 'lose' : 'draw'
                            }`}>
                                {matchInfo["W-D-L"] === 'W' ? 'WIN' : matchInfo["W-D-L"] === 'L' ? 'LOSS' : 'DRAW'}
                            </div>
                        )}
                    </div>

                    <div className="team-display opponent">
                        <div className="team-meta tr">
                            <h1 className="team-name">الزمالك</h1>
                            <span className="manager-tag">COACH: {matchInfo["ZAMALEK MANAGER"] || "?"}</span>
                        </div>
                        <div className="team-logo-container">
                            <div className="logo-placeholder zamalek-logo">🏹</div>
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
                        <span className="value">{matchInfo["SEASON - NAME"]}</span>
                    </div>
                    <div className="info-divider"></div>
                    <div className="info-item">
                        <span className="label">ROUND</span>
                        <span className="value">{matchInfo.ROUND || "N/A"}</span>
                    </div>
                    <div className="info-divider"></div>
                    <div className="info-item">
                        <span className="label">STADIUM</span>
                        <span className="value">{matchInfo.STAD || "N/A"}</span>
                    </div>
                    <div className="info-divider"></div>
                    <div className="info-item">
                        <span className="label">REFEREE</span>
                        <span className="value">{matchInfo.REFEREE || "N/A"}</span>
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
                                                <div key={i} className="player-card">
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
                                                    <div key={i} className="player-card sub-card">
                                                        <span className="player-num sub-num">S</span>
                                                        <div className="sub-main">
                                                            <span className="player-name">
                                                                {p["PLAYER NAME"]}
                                                                <span className="player-badges-inline" style={{ marginLeft: '8px', display: 'inline-flex', gap: '4px', verticalAlign: 'middle' }}>
                                                                    {events.ahly.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"] && String(e.TYPE).trim() !== 'تغيير').map((e, idx) => (
                                                                        <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                                            {getEventIcon(e.TYPE)}
                                                                        </span>
                                                                    ))}
                                                                </span>
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
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Zamalek Column */}
                            <div className="team-column zamalek-theme">
                                <div className="column-header">
                                    <span className="team-label">الزمالك</span>
                                    <span className="starter-count">{squads.zamalek.starters.length} STARTERS</span>
                                </div>
                                <div className="players-list">
                                    <h3 className="list-title">STARTERS</h3>
                                    {squads.zamalek.starters.length === 0 ? (
                                        Array(11).fill(0).map((_, i) => (
                                            <div key={i} className="player-card placeholder-card rev">
                                                <span className="player-num">{i + 1}</span>
                                                <span className="player-name tr">Match Player</span>
                                            </div>
                                        ))
                                    ) : (
                                        squads.zamalek.starters.map((p, i) => {
                                            const wasSubbed = p["OUT MINUTE"] || p["MINUTE OUT"];
                                            return (
                                                <div key={i} className="player-card rev">
                                                    <div className="player-badges">
                                                        {events.zamalek.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"]).map((e, idx) => (
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
                                    {squads.zamalek.subs.length > 0 && (
                                        <>
                                            <h3 className="list-title subs-title">SUBSTITUTES</h3>
                                            {squads.zamalek.subs.map((p, i) => {
                                                const subInfo = getSubInfo(p);
                                                return (
                                                    <div key={i} className="player-card sub-card rev">
                                                        <span className="player-num sub-num">S</span>
                                                        <div className="sub-main tr">
                                                            <span className="player-name">
                                                                <span className="player-badges-inline-rev" style={{ marginRight: '8px', display: 'inline-flex', gap: '4px', verticalAlign: 'middle' }}>
                                                                    {events.zamalek.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"] && String(e.TYPE).trim() !== 'تغيير').map((e, idx) => (
                                                                        <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                                            {getEventIcon(e.TYPE)}
                                                                        </span>
                                                                    ))}
                                                                </span>
                                                                {p["PLAYER NAME"]}
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
                            <div className="team-column zamalek-theme">
                                <div className="gk-section">
                                    <h3 className="list-title">GOALKEEPER</h3>
                                    {gks.zamalek.length === 0 ? (
                                        <div className="gk-card highlighting placeholder-card rev op-mask">
                                            <div className="gk-info tr">
                                                <span className="gk-name">Main Keeper</span>
                                                <span className="gk-stat">N/A</span>
                                            </div>
                                            <span className="gk-icon">🧤</span>
                                        </div>
                                    ) : (
                                        gks.zamalek.map((g, i) => (
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
                                        return (
                                            <div key={i} className={`timeline-entry ${isAhly ? 'left' : 'right'}`}>
                                                <div className="entry-content">
                                                    <div className="entry-time">{e.MINUTE}'</div>
                                                    <div className="entry-details">
                                                        <span className="entry-icon">{getEventIcon(e.TYPE)}</span>
                                                        <div className="entry-text">
                                                            <span className="entry-player">{e["PLAYER NAME"]}</span>
                                                            <span className="entry-type">
                                                                {e.TYPE}
                                                                {e.TYPE_SUB && <span style={{ color: '#ff5252', fontStyle: 'normal' }}> / {e.TYPE_SUB}</span>}
                                                            </span>
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
                                    ...squads.zamalek.subs.map(s => ({ ...s, isAhly: false }))
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
            </div>
        </div>
    );
}
