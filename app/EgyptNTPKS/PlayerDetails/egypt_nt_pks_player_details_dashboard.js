"use client";

import React from "react";

export default function EgyptNTPKSPlayerDetailsDashboard({ stats }) {
    if (!stats) return null;
    return (
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
    );
}
