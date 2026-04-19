"use client";

import { useMemo } from "react";
import { Trophy, Target, AlertCircle, Hash, TrendingUp, TrendingDown, Swords } from "lucide-react";
import "./alahly_pks_dashboard.css";

export default function AlAhlyPKsDashboard({ pksData }) {
    const stats = useMemo(() => {
        if (!pksData || pksData.length === 0) return null;

        const uniqueMatches = new Set();
        let wins = 0;
        let losses = 0;

        let ahlyKicks = 0;
        let ahlyGoals = 0;
        let ahlyOffTarget = 0;
        let ahlySaved = 0;

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

            // Al Ahly Stats
            if (kick["AHLY PLAYER"]) {
                ahlyKicks++;
                const status = String(kick["AHLY STATUS"] || "").toUpperCase();
                const howMiss = String(kick["HOWMISS AHLY"] || "").toLowerCase();

                if (status.includes("GOAL")) {
                    ahlyGoals++;
                } else if ((status.includes("MISS") || status.includes("SAVED")) && howMiss.includes("الحارس")) {
                    ahlySaved++;
                } else {
                    ahlyOffTarget++;
                }
            }

            // Opponent Stats
            if (kick["OPPONENT PLAYER"]) {
                oppKicks++;
                const status = String(kick["OPPONENT STATUS"] || "").toUpperCase();
                const howMiss = String(kick["HOWMISS OPPONENT"] || "").toLowerCase();

                if (status.includes("GOAL")) {
                    oppGoals++;
                } else if ((status.includes("MISS") || status.includes("SAVED")) && howMiss.includes("الحارس")) {
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
            ahly: {
                kicks: ahlyKicks,
                goals: ahlyGoals,
                offTarget: ahlyOffTarget,
                saved: ahlySaved,
                totalMisses: ahlyOffTarget + ahlySaved,
                successRate: ahlyKicks > 0 ? ((ahlyGoals / ahlyKicks) * 100).toFixed(1) : 0,
                offTargetRate: ahlyKicks > 0 ? ((ahlyOffTarget / ahlyKicks) * 100).toFixed(1) : 0,
                savedRate: ahlyKicks > 0 ? ((ahlySaved / ahlyKicks) * 100).toFixed(1) : 0
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
                <h1 className="dashboard-title">AL AHLY <span className="gold-text">PKs DASHBOARD</span></h1>
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
                <div className="comparison-side ahly-side">
                    <div className="side-header">
                        <img src="/ahly_logo.png" alt="Al Ahly" className="team-logo-mini" onError={(e) => e.target.style.display='none'} />
                        <h2>AL AHLY <span className="gold-text">STATS</span></h2>
                    </div>
                    
                    <div className="side-stats-grid">
                        <div className="side-stat-item">
                            <span className="side-label">TOTAL KICKS</span>
                            <span className="side-value">{stats.ahly.kicks}</span>
                        </div>
                        <div className="side-stat-item highlight-goal">
                            <span className="side-label">GOALS SCORED</span>
                            <span className="side-value">{stats.ahly.goals}</span>
                        </div>
                        
                        <div className="side-stat-item highlight-miss">
                            <span className="side-label">OFF TARGET (MISS)</span>
                            <span className="side-value">{stats.ahly.offTarget}</span>
                        </div>
                        <div className="side-stat-item highlight-saved">
                            <span className="side-label">SAVED BY GK</span>
                            <span className="side-value">{stats.ahly.saved}</span>
                        </div>

                        {/* Rates Row */}
                        <div className="rates-row-container">
                            <div className="rate-item">
                                <span className="side-label">SUCCESS %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill success" style={{ width: `${stats.ahly.successRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.ahly.successRate}%</span>
                            </div>
                            <div className="rate-item">
                                <span className="side-label">MISS %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill miss" style={{ width: `${stats.ahly.offTargetRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.ahly.offTargetRate}%</span>
                            </div>
                            <div className="rate-item">
                                <span className="side-label">SAVED %</span>
                                <div className="progress-bar-container mini">
                                    <div className="progress-fill saved" style={{ width: `${stats.ahly.savedRate}%` }}></div>
                                </div>
                                <span className="percentage-value-small">{stats.ahly.savedRate}%</span>
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
