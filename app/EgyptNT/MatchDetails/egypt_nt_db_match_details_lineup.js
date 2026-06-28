"use client";

import { getEventIcon, getSubInfo } from "./egypt_nt_db_match_details_utils";

export default function LineupTab({ egyptTeamName, opponentTeamName, squads, events, gks }) {
    return (
        <>
            <div className="lineup-view grid-layout">
                <div className="team-column egypt-theme">
                    <div className="column-header">
                        <span className="team-label">{egyptTeamName}</span>
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
                                                        <span className="sub-in-label">🔄</span>
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

                <div className="team-column opp-theme">
                    <div className="column-header">
                        <span className="team-label">{opponentTeamName}</span>
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
                                                        <span className="sub-in-label">🔄</span>
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
    );
}
