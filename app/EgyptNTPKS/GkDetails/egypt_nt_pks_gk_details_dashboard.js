"use client";
import React from "react";

export default function EgyptNTPKSGkDetailsDashboard({ stats }) {
    if (!stats) return null;
    return (
        <div className="shootout-summary-card">
            <div className="gk-stats-grid" style={{ width: '100%' }}>
                <div className="gk-stat-card total">
                    <span className="s-val">{stats.faced}</span>
                    <span className="s-lbl">FACED</span>
                </div>
                <div className="gk-stat-card saves">
                    <span className="s-val">{stats.saved}</span>
                    <span className="s-lbl">SAVED</span>
                </div>
                <div className="gk-stat-card goals">
                    <span className="s-val">{stats.conceded}</span>
                    <span className="s-lbl">CONCEDED</span>
                </div>
                <div className="gk-stat-card misses">
                    <span className="s-val">{stats.missed}</span>
                    <span className="s-lbl">MISSED</span>
                </div>
                <div className="gk-stat-card" style={{ background: '#fbfbfb', border: '1px solid #eee' }}>
                    <span className="s-val" style={{ color: parseFloat(stats.saveRate) >= 50 ? '#2e7d32' : '#c62828' }}>
                        {stats.saveRate}%
                    </span>
                    <span className="s-lbl">SAVE RATE</span>
                </div>
            </div>
        </div>
    );
}
