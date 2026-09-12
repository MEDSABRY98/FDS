"use client";

import { useState } from "react";

export default function PlayerOverview({ stats, goalFreq, gaContribution }) {
    const [activeTab, setActiveTab] = useState("matches");

    return (
        <div className="overview-container fade-in">
            <div className="overview-tabs-header" style={{ display: 'flex', gap: '15px', justifyContent: 'space-between', marginBottom: '20px', width: '100%' }}>
                <button 
                    onClick={() => setActiveTab("matches")}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: activeTab === "matches" ? 'var(--player-gold)' : 'var(--card-bg)', color: activeTab === "matches" ? '#000' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                    Matches
                </button>
                <button 
                    onClick={() => setActiveTab("goals_assists")}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: activeTab === "goals_assists" ? 'var(--player-gold)' : 'var(--card-bg)', color: activeTab === "goals_assists" ? '#000' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                    Goals & Assists
                </button>
                <button 
                    onClick={() => setActiveTab("penalties")}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: activeTab === "penalties" ? 'var(--player-gold)' : 'var(--card-bg)', color: activeTab === "penalties" ? '#000' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                    Penalties
                </button>
                <button 
                    onClick={() => setActiveTab("super_matches")}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: activeTab === "super_matches" ? 'var(--player-gold)' : 'var(--card-bg)', color: activeTab === "super_matches" ? '#000' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                    Super Matches
                </button>
            </div>

            <div className="stats-grid-premium fade-in">
                {activeTab === "matches" && (
                    <>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Total Appearances</span>
                            <div className="stat-value-modern" style={{ color: 'var(--player-gold)' }}>{stats.caps}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Starts</span>
                            <div className="stat-value-modern" style={{ color: '#3498db' }}>{stats.starts}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Subbed In</span>
                            <div className="stat-value-modern" style={{ color: '#9b59b6' }}>{stats.subIns}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Subbed Out</span>
                            <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.subOuts}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Total Minutes</span>
                            <div className="stat-value-modern">{stats.mins}</div>
                        </div>
                    </>
                )}

                {activeTab === "goals_assists" && (
                    <>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Total Goals</span>
                            <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.goals}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Total Assists</span>
                            <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.assists}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Mins Per Goal</span>
                            <div className="stat-value-modern" style={{ color: '#f39c12' }}>{goalFreq}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">G/A Per Game</span>
                            <div className="stat-value-modern" style={{ color: '#9b59b6' }}>{gaContribution}</div>
                        </div>
                    </>
                )}

                {activeTab === "penalties" && (
                    <>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Penalties Scored</span>
                            <div className="stat-value-modern">{stats.penGoals}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Penalties Missed</span>
                            <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.penMissed}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">PEN Won (Goal)</span>
                            <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.wonGoal}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">PEN Won (Missed)</span>
                            <div className="stat-value-modern" style={{ color: '#95a5a6' }}>{stats.wonMiss}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">PEN Committed (Goal)</span>
                            <div className="stat-value-modern" style={{ color: '#16a085' }}>{stats.makeGoal}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">PEN Committed (Miss)</span>
                            <div className="stat-value-modern" style={{ color: '#d35400' }}>{stats.makeMiss}</div>
                        </div>
                    </>
                )}

                {activeTab === "super_matches" && (
                    <>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Brace Goals</span>
                            <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.braceG}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Brace Assists</span>
                            <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.braceA}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Hat-trick Goals</span>
                            <div className="stat-value-modern" style={{ color: '#d4af37' }}>{stats.hatG}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">Hat-trick Assists</span>
                            <div className="stat-value-modern" style={{ color: '#7f8c8d' }}>{stats.hatA}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">4+ Goals Match</span>
                            <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.superG}</div>
                        </div>
                        <div className="stat-card-premium">
                            <span className="stat-label-modern">4+ Assists Match</span>
                            <div className="stat-value-modern" style={{ color: '#8e44ad' }}>{stats.superA}</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
