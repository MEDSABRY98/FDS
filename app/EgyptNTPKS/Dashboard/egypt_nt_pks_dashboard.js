"use client";

import { useMemo } from "react";
import { Trophy, AlertCircle, Swords } from "lucide-react";
import "./egypt_nt_pks_dashboard.css";

export default function EgyptNTPKSDashboard({ pksData }) {
    const stats = useMemo(() => {
        if (!pksData || pksData.length === 0) return null;

        const uniqueMatches = new Set();
        let wins = 0;
        let losses = 0;

        let egKicks = 0;
        let egGoals = 0;
        let egOffTarget = 0;
        let egSaved = 0;

        let oppKicks = 0;
        let oppGoals = 0;
        let oppOffTarget = 0;
        let oppSaved = 0;

        pksData.forEach(kick => {
            const matchId = kick.PKS_ID || kick.MATCH_ID;
            if (matchId && !uniqueMatches.has(matchId)) {
                uniqueMatches.add(matchId);
                const result = String(kick["PKS W-L"] || "").toUpperCase();
                if (result.includes("W")) wins++;
                else if (result.includes("L")) losses++;
            }

            // Egypt Stats
            if (kick["Egypt PLAYER"]) {
                egKicks++;
                const status = String(kick["Egypt STATUS"] || "").toUpperCase();
                const howMiss = String(kick["EGYPT HOW MISS"] || "").toLowerCase();

                if (status.includes("GOAL") || status === "G") {
                    egGoals++;
                } else if (howMiss.includes("الحارس") || howMiss.includes("حارس")) {
                    egSaved++;
                } else {
                    egOffTarget++;
                }
            }

            // Opponent Stats
            if (kick["OPPONENT PLAYER"]) {
                oppKicks++;
                const status = String(kick["OPPONENT STATUS"] || "").toUpperCase();
                const howMiss = String(kick["OPPONENT HOW MISS"] || "").toLowerCase();

                if (status.includes("GOAL") || status === "G") {
                    oppGoals++;
                } else if (howMiss.includes("الحارس") || howMiss.includes("حارس")) {
                    oppSaved++;
                } else {
                    oppOffTarget++;
                }
            }
        });

        const totalMatches = uniqueMatches.size;

        return {
            totalMatches,
            wins,
            losses,
            winRate: totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0,
            lossRate: totalMatches > 0 ? ((losses / totalMatches) * 100).toFixed(1) : 0,
            egypt: {
                kicks: egKicks,
                goals: egGoals,
                offTarget: egOffTarget,
                saved: egSaved,
                totalMisses: egOffTarget + egSaved,
                successRate: egKicks > 0 ? ((egGoals / egKicks) * 100).toFixed(1) : 0,
                offTargetRate: egKicks > 0 ? ((egOffTarget / egKicks) * 100).toFixed(1) : 0,
                savedRate: egKicks > 0 ? ((egSaved / egKicks) * 100).toFixed(1) : 0
            },
            opponent: {
                kicks: oppKicks,
                goals: oppGoals,
                offTarget: oppOffTarget,
                saved: oppSaved,
                totalMisses: oppOffTarget + oppSaved,
                successRate: oppKicks > 0 ? ((oppGoals / oppKicks) * 100).toFixed(1) : 0,
                offTargetRate: oppKicks > 0 ? ((oppOffTarget / oppKicks) * 100).toFixed(1) : 0,
                savedRate: oppKicks > 0 ? ((oppSaved / oppKicks) * 100).toFixed(1) : 0
            }
        };
    }, [pksData]);

    if (!stats) return null;

    return (
        <div className="pks-dashboard-container fade-in">
            <div className="dashboard-header">
                <h1 className="dashboard-title">EGYPT NT <span className="gold-text">PKs DASHBOARD</span></h1>
            </div>

            {/* Main Overview Cards */}
            <div className="stats-grid-main">
                <div className="stat-card luxury-card">
                    <div className="card-icon"><Swords size={24} /></div>
                    <div className="card-content">
                        <span className="card-label">TOTAL SHOOTOUTS</span>
                        <span className="card-value">{stats.totalMatches}</span>
                    </div>
                </div>
                <div className="stat-card luxury-card win">
                    <div className="card-icon"><Trophy size={24} /></div>
                    <div className="card-content">
                        <span className="card-label">TOTAL WINS</span>
                        <div className="value-row">
                            <span className="card-value">{stats.wins}</span>
                            <span className="card-sub-value success">{stats.winRate}%</span>
                        </div>
                    </div>
                </div>
                <div className="stat-card luxury-card loss">
                    <div className="card-icon"><AlertCircle size={24} /></div>
                    <div className="card-content">
                        <span className="card-label">TOTAL LOSSES</span>
                        <div className="value-row">
                            <span className="card-value">{stats.losses}</span>
                            <span className="card-sub-value danger">{stats.lossRate}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Section */}
            <div className="comparison-container">
                <div className="comparison-side egypt-side">
                    <div className="side-header">
                        <img src="/egypt_logo.png" alt="Egypt" className="team-logo-mini" onError={(e) => e.target.style.display='none'} />
                        <h2>EGYPT NT <span className="gold-text">STATS</span></h2>
                    </div>

                    <div className="side-stats-grid">
                        <div className="side-stat-item">
                            <span className="side-label">TOTAL KICKS</span>
                            <span className="side-value">{stats.egypt.kicks}</span>
                        </div>
                        <div className="side-stat-item highlight-goal">
                            <span className="side-label">GOALS SCORED</span>
                            <span className="side-value">{stats.egypt.goals}</span>
                        </div>

                        <div className="side-stat-item highlight-miss">
                            <span className="side-label">OFF TARGET (MISS)</span>
                            <span className="side-value">{stats.egypt.offTarget}</span>
                        </div>
                        <div className="side-stat-item highlight-saved">
                            <span className="side-label">SAVED BY GK</span>
                            <span className="side-value">{stats.egypt.saved}</span>
                        </div>

                        {/* Rates Row */}
                        <div className="rates-row-container">
                            <div className="rate-item">
                                <span className="side-label">SUCCESS %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill success" style={{ width: `${stats.egypt.successRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.egypt.successRate}%</span>
                            </div>
                            <div className="rate-item">
                                <span className="side-label">MISS %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill miss" style={{ width: `${stats.egypt.offTargetRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.egypt.offTargetRate}%</span>
                            </div>
                            <div className="rate-item">
                                <span className="side-label">SAVED %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill saved" style={{ width: `${stats.egypt.savedRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.egypt.savedRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="comparison-divider">
                    <div className="vs-badge">VS</div>
                </div>

                <div className="comparison-side opponent-side">
                    <div className="side-header">
                        <h2>OPPONENTS <span className="gold-text">STATS</span></h2>
                    </div>

                    <div className="side-stats-grid">
                        <div className="side-stat-item">
                            <span className="side-label">TOTAL KICKS</span>
                            <span className="side-value">{stats.opponent.kicks}</span>
                        </div>
                        <div className="side-stat-item highlight-goal">
                            <span className="side-label">GOALS SCORED</span>
                            <span className="side-value">{stats.opponent.goals}</span>
                        </div>

                        <div className="side-stat-item highlight-miss">
                            <span className="side-label">OFF TARGET (MISS)</span>
                            <span className="side-value">{stats.opponent.offTarget}</span>
                        </div>
                        <div className="side-stat-item highlight-saved">
                            <span className="side-label">SAVED BY GK</span>
                            <span className="side-value">{stats.opponent.saved}</span>
                        </div>

                        {/* Rates Row */}
                        <div className="rates-row-container">
                            <div className="rate-item">
                                <span className="side-label">SUCCESS %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill success" style={{ width: `${stats.opponent.successRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.opponent.successRate}%</span>
                            </div>
                            <div className="rate-item">
                                <span className="side-label">MISS %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill miss" style={{ width: `${stats.opponent.offTargetRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.opponent.offTargetRate}%</span>
                            </div>
                            <div className="rate-item">
                                <span className="side-label">SAVED %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill saved" style={{ width: `${stats.opponent.savedRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.opponent.savedRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
