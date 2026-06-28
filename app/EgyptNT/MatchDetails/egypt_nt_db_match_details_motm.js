"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";

export default function MotmTab({ matchInfo, events }) {
    const performanceStats = useMemo(() => {
        if (!matchInfo.MOTM) return null;

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

        if (goals === 0 && assists === 0 && yellows === 0 && reds === 0) return null;

        return { goals, assists, yellows, reds };
    }, [matchInfo.MOTM, events.chronological]);

    return (
        <div className="motm-tab-content fade-in">
            {matchInfo.MOTM ? (
                <div className="motm-container">
                    <div className="motm-trophy">🏆</div>
                    <h2 className="motm-title">MAN OF THE MATCH</h2>
                    <div className="motm-player-name">{matchInfo.MOTM}</div>
                    {performanceStats && (
                        <div className="motm-performance-summary">
                            <h3>Match Performance</h3>
                            <div className="motm-stats-row">
                                {performanceStats.goals > 0 && <span className="motm-stat-item">⚽ {performanceStats.goals} Goal(s)</span>}
                                {performanceStats.assists > 0 && <span className="motm-stat-item">🅰️ {performanceStats.assists} Assist(s)</span>}
                                {performanceStats.yellows > 0 && <span className="motm-stat-item">🟨 {performanceStats.yellows} Yellow</span>}
                                {performanceStats.reds > 0 && <span className="motm-stat-item">🟥 {performanceStats.reds} Red</span>}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <NoData_db message="No Man of the Match awarded for this game." />
            )}
        </div>
    );
}
