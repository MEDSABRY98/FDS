"use client";

import React, { useState } from 'react';

export default function PlayerPresenceTable({ impactStats }) {
    const [subTab, setSubTab] = useState('presence');

    if (!impactStats) return null;

    const data = subTab === 'presence' ? impactStats.presence : impactStats.absence;

    const winRate = data.matches > 0 
        ? ((data.wins / data.matches) * 100).toFixed(1) 
        : 0;

    const statsConfig = [
        { label: "Matches Involved", value: data.matches, color: 'var(--player-gold)', sub: subTab === 'presence' ? "Matches in squad/lineup" : "Matches missed during career" },
        { label: "Team Wins", value: data.wins, color: '#27ae60', sub: "Team victories" },
        { label: "Win Rate %", value: `${winRate}%`, color: '#2ecc71', sub: "Success percentage" },
        { label: "Team Draws", value: data.draws, color: '#f39c12', sub: "Tied matches" },
        { label: "Team Losses", value: data.losses, color: '#e74c3c', sub: "Defeats sustained" },
        { label: "Goals For", value: data.gf, color: '#27ae60', sub: "Total team goals scored" },
        { label: "Goals Against", value: data.ga, color: '#e74c3c', sub: "Total team goals conceded" },
        { label: "Clean Sheets", value: data.cleanSheets, color: '#2980b9', sub: "Shutouts achieved" },
        { label: "Opponent CS", value: data.failedToScore, color: '#95a5a6', sub: "Failed to score matches" }
    ];

    return (
        <div className="presence-impact-container fade-in">
            <div className="sub-tabs-container">
                <button 
                    className={`sub-tab-btn ${subTab === 'presence' ? 'active' : ''}`}
                    onClick={() => setSubTab('presence')}
                >
                    <span className="dot"></span>
                    PRESENCE
                </button>
                <button 
                    className={`sub-tab-btn ${subTab === 'absence' ? 'active' : ''}`}
                    onClick={() => setSubTab('absence')}
                >
                    <span className="dot"></span>
                    ABSENCE
                </button>
            </div>

            <div className="range-badge-container">
                <div className="range-badge">
                    <span className="range-label">CAREER PERIOD:</span>
                    <span className="range-value">{impactStats.careerRange?.start}</span>
                    <span className="range-separator">TO</span>
                    <span className="range-value">{impactStats.careerRange?.end}</span>
                </div>
            </div>

            <div className="impact-grid-modern">
                {statsConfig.map((stat, idx) => (
                    <div className="impact-card-premium" key={idx}>
                        <div className="card-top">
                            <span className="impact-label">{stat.label}</span>
                            <div className="impact-indicator" style={{ background: stat.color, color: stat.color }}></div>
                        </div>
                        <div className="impact-value" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="impact-subtext">{stat.sub}</div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .presence-impact-container {
                    padding: 20px 0;
                }
                .sub-tabs-container {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                    background: rgba(255,255,255,0.03);
                    padding: 10px;
                    border-radius: 16px;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                }
                .sub-tab-btn {
                    background: #fff;
                    border: 1px solid #eee;
                    padding: 12px 25px;
                    border-radius: 12px;
                    font-family: 'Space Mono';
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #999;
                }
                .sub-tab-btn .dot {
                    width: 6px;
                    height: 6px;
                    background: #ddd;
                    border-radius: 50%;
                    transition: 0.3s;
                }
                .sub-tab-btn.active {
                    background: #000;
                    color: var(--player-gold);
                    border-color: #000;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
                .sub-tab-btn.active .dot {
                    background: var(--player-gold);
                    box-shadow: 0 0 10px var(--player-gold);
                }
                .sub-tab-btn:hover:not(.active) {
                    background: #f9f9f9;
                    color: #666;
                }

                .range-badge-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 30px;
                }
                .range-badge {
                    background: #f9f9f9;
                    border: 1px solid #eee;
                    padding: 12px 28px;
                    border-radius: 50px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-family: 'Space Mono';
                    font-size: 15px;
                    font-weight: 700;
                }
                .range-label {
                    color: #999;
                    letter-spacing: 1px;
                }
                .range-value {
                    color: var(--player-gold);
                    font-weight: 800;
                }
                .range-separator {
                    color: #ccc;
                    font-size: 9px;
                }

                .impact-grid-modern {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 25px;
                }
                .impact-card-premium {
                    background: #fff;
                    border: 1px solid #eee;
                    padding: 30px;
                    border-radius: 24px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.02);
                    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                }
                .impact-card-premium:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.05);
                    border-color: var(--player-gold);
                }
                .impact-card-premium::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 4px; height: 100%;
                    background: var(--player-gold);
                    opacity: 0;
                    transition: 0.3s;
                }
                .impact-card-premium:hover::before {
                    opacity: 1;
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .impact-label {
                    font-family: 'Space Mono';
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: #999;
                    text-transform: uppercase;
                }
                .impact-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    box-shadow: 0 0 10px currentColor;
                }
                .impact-value {
                    font-family: 'Bebas Neue';
                    font-size: 56px;
                    line-height: 1;
                    margin-bottom: 15px;
                    letter-spacing: 2px;
                }
                .impact-subtext {
                    font-family: 'Outfit';
                    font-size: 13px;
                    color: #666;
                    font-weight: 600;
                    min-height: 20px;
                }

                @media (max-width: 768px) {
                    .impact-grid-modern {
                        grid-template-columns: 1fr;
                    }
                    .impact-value {
                        font-size: 48px;
                    }
                    .sub-tabs-container {
                        width: 100%;
                    }
                    .sub-tab-btn {
                        flex: 1;
                        padding: 12px 10px;
                        font-size: 10px;
                    }
                }
            `}</style>
        </div>
    );
}
