"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";

export default function SubsTab({ squads }) {
    const subEvents = useMemo(() => (
        [
            ...squads.egypt.subs.map(s => ({ ...s, isEgypt: true })),
            ...squads.opp.subs.map(s => ({ ...s, isEgypt: false }))
        ].map(s => {
            const rawMin = s["IN MINUTE"] || s["MINUTE IN"] || s["OUT MINUTE"] || s["MINUTE OUT"] || "0";
            const minute = parseInt(String(rawMin).replace(/[^0-9]/g, ''), 10) || 0;
            return { ...s, minute };
        })
            .filter(s => s.minute > 0)
            .sort((a, b) => a.minute - b.minute)
    ), [squads]);

    return (
        <div className="timeline-view subs-timeline">
            <div className="timeline-container">
                {subEvents.length === 0 ? (
                    <NoData_db message="No substitutions recorded for this game." />
                ) : (
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
                )}
            </div>
        </div>
    );
}
