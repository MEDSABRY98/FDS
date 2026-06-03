"use client";

import { useMemo, useEffect } from "react";
import NoData_db from "../lib/NoData_db";
import "./egypt_nt_pks_match_details.css";

export default function EgyptNTPKSPlayerDetails({ playerName, pksData, onBack }) {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const playerKicks = useMemo(() => {
        const kicks = [];
        (pksData || []).forEach(kick => {
            if (kick["Egypt PLAYER"] === playerName) {
                kicks.push({
                    ...kick,
                    side: "EGYPT",
                    status: kick["Egypt STATUS"],
                    howMiss: kick["EGYPT HOW MISS"],
                    gk: kick["OPPONENT GK"],
                });
            }
            if (kick["OPPONENT PLAYER"] === playerName) {
                kicks.push({
                    ...kick,
                    side: "OPPONENT",
                    status: kick["OPPONENT STATUS"],
                    howMiss: kick["OPPONENT HOW MISS"],
                    gk: kick["EGYPT GK"],
                });
            }
        });
        return kicks;
    }, [pksData, playerName]);

    const stats = useMemo(() => {
        let total = 0, goals = 0, misses = 0;
        playerKicks.forEach(k => {
            total++;
            const s = String(k.status || "").toUpperCase();
            if (s.includes("GOAL") || s === "G") goals++;
            else misses++;
        });
        return { total, goals, misses, successRate: total > 0 ? ((goals / total) * 100).toFixed(1) : "0.0" };
    }, [playerKicks]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "---";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="pks-details-container fade-in">
            <div className="pks-details-header">
                <button className="back-btn-lux" onClick={onBack}>
                    <span className="back-icon">←</span> BACK TO PLAYERS
                </button>
                <div className="match-title-premium">
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '36px', fontWeight: '800', textTransform: 'uppercase' }}>
                        {playerName}
                    </h1>
                </div>
            </div>

            <div className="shootout-summary-card">
                <div className="gk-stats-grid" style={{ width: '100%' }}>
                    <div className="gk-stat-card total">
                        <span className="s-val">{stats.total}</span>
                        <span className="s-lbl">TOTAL KICKS</span>
                    </div>
                    <div className="gk-stat-card goals">
                        <span className="s-val">{stats.goals}</span>
                        <span className="s-lbl">GOALS</span>
                    </div>
                    <div className="gk-stat-card misses">
                        <span className="s-val">{stats.misses}</span>
                        <span className="s-lbl">MISSES</span>
                    </div>
                    <div className="gk-stat-card saves">
                        <span className="s-val">{stats.successRate}%</span>
                        <span className="s-lbl">SUCCESS RATE</span>
                    </div>
                </div>
            </div>

            <div className="kicks-table-luxury">
                <div className="kicks-header" style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="k-col-seq" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>#</div>
                    <div style={{ width: 110, flexShrink: 0, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>PKS ID</div>
                    <div style={{ width: 110, flexShrink: 0, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>DATE</div>
                    <div style={{ width: 160, flexShrink: 0, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>SEASON</div>
                    <div className="k-col-main" style={{ flex: 1.5, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>OPPONENT</div>
                    <div className="k-col-main" style={{ flex: 1.2, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>OPPONENT GK</div>
                    <div className="k-col-result" style={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>RESULT</div>
                    <div className="k-col-note" style={{ flex: 0.8, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>HOW</div>
                </div>
                <div className="kicks-body">
                    {playerKicks.length === 0 ? (
                        <NoData_db message="NO KICK DATA FOUND" />
                    ) : (
                        playerKicks.map((kick, idx) => {
                            const isGoal = String(kick.status || "").toUpperCase().includes('GOAL') || String(kick.status || "").toUpperCase() === 'G';
                            const opponent = kick.side === "EGYPT" ? kick["OPPONENT TEAM"] : "مصر";
                            return (
                                <div key={idx} className="kick-row-premium" style={{ display: 'flex', alignItems: 'center' }}>
                                    <div className="k-col-seq" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{idx + 1}</div>
                                    <div style={{ width: 110, flexShrink: 0, fontSize: 12, fontFamily: "'Space Mono', monospace", color: '#999', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{kick.DISPLAY_ID}</div>
                                    <div style={{ width: 110, flexShrink: 0, fontSize: 14, fontFamily: 'inherit', color: '#333', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{formatDate(kick.DATE)}</div>
                                    <div style={{ width: 160, flexShrink: 0, fontSize: 14, fontFamily: 'inherit', color: '#333', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{kick.SEASON || "---"}</div>
                                    <div className="k-col-main" style={{ flex: 1.5, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <span className="player-name-val">{opponent || "---"}</span>
                                    </div>
                                    <div className="k-col-main" style={{ flex: 1.2, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <span className="player-name-val" style={{ color: '#555', fontWeight: '500', fontSize: '15px' }}>{kick.gk || "---"}</span>
                                    </div>
                                    <div className="k-col-result" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <div className={`kick-indicator ${isGoal ? 'goal' : 'miss'}`}>
                                            {isGoal ? '⚽ GOAL' : '❌ MISS'}
                                        </div>
                                    </div>
                                    <div className="k-col-note" style={{ flex: 0.8, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <span className="kick-note-txt">{kick.howMiss || ""}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
