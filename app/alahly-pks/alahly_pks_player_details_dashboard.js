import React, { useMemo } from 'react';
import './alahly_pks_player_details_dashboard.css';

export default function AlAhlyPKsPlayerDetailsDashboard({ playerName, pksData }) {
    const stats = useMemo(() => {
        const matches = (pksData || []).filter(k =>
            k["AHLY PLAYER"] === playerName || k["OPPONENT PLAYER"] === playerName
        );

        const totalMatches = matches.length;

        const opponents = new Set(matches.map(m => {
            const isAhly = m["AHLY PLAYER"] === playerName;
            return isAhly ? (m["OPPONENT TEAM"] || m["OPPONENT"]) : "النادي الأهلي";
        }));
        const uniqueOpponents = opponents.size;

        const totalPKs = totalMatches;

        const goals = matches.filter(m => {
            const isAhly = m["AHLY PLAYER"] === playerName;
            const status = isAhly ? m["AHLY STATUS"] : m["OPPONENT STATUS"];
            return String(status).toUpperCase().includes("GOAL");
        }).length;

        const misses = totalPKs - goals;
        const goalRate = totalPKs > 0 ? ((goals / totalPKs) * 100).toFixed(1) : "0.0";
        const missRate = totalPKs > 0 ? ((misses / totalPKs) * 100).toFixed(1) : "0.0";

        return { totalMatches, uniqueOpponents, totalPKs, goals, misses, goalRate, missRate };
    }, [playerName, pksData]);

    const cards = [
        { label: "MATCHES",    value: stats.totalMatches,   icon: "⚽", color: "neutral" },
        { label: "OPPONENTS",  value: stats.uniqueOpponents, icon: "🏟️", color: "neutral" },
        { label: "TOTAL PKs",  value: stats.totalPKs,        icon: "🎯", color: "gold"    },
        { label: "GOALS",      value: stats.goals,           icon: "✅", color: "green"   },
        { label: "GOAL RATE",  value: `${stats.goalRate}%`,  icon: "📈", color: "green"   },
        { label: "MISSES",     value: stats.misses,          icon: "❌", color: "red"     },
        { label: "MISS RATE",  value: `${stats.missRate}%`,  icon: "📉", color: "red"     },
    ];

    return (
        <div className="player-dashboard-tab fade-in">

            <div className="dashboard-cards-grid">
                {cards.map((card, i) => (
                    <div key={i} className={`dash-card dash-card--${card.color}`}>
                        <div className="dash-card-icon">{card.icon}</div>
                        <div className="dash-card-value">{card.value}</div>
                        <div className="dash-card-label">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Goal vs Miss Bar */}
            <div className="dash-progress-section">
                <div className="dash-progress-label">
                    <span className="prog-goal">GOAL {stats.goalRate}%</span>
                    <span className="prog-miss">MISS {stats.missRate}%</span>
                </div>
                <div className="dash-progress-bar">
                    <div 
                        className="dash-progress-fill"
                        style={{ width: `${stats.goalRate}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
