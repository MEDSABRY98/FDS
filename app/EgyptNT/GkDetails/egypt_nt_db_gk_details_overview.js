"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getGkPenaltySavePct } from "../../Alahly/Penalties/alahly_db_penalties_utils";

export default function EgyptNTGKOverview({ stats }) {
    const [popupData, setPopupData] = useState(null);
    const [activeStreakIdx, setActiveStreakIdx] = useState(0);

    useEffect(() => {
        if (!popupData) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [popupData]);

    const openStreakPopup = (type) => {
        const streaks = type === 'cs' ? stats.allStreaksCS : stats.allStreaksGC;
        if (streaks?.length > 0) {
            setPopupData({
                type,
                title: type === 'cs' ? "Clean Sheet Streaks (2+ matches)" : "Conceded Streaks (2+ matches)",
                allStreaks: streaks,
                color: type === 'cs' ? "#27ae60" : "#e74c3c"
            });
            setActiveStreakIdx(0);
        }
    };

    const currentStreak = popupData?.allStreaks[activeStreakIdx];

    const streakModal = popupData && currentStreak ? createPortal(
        <div className="gk-streak-modal-overlay fade-in" onClick={() => setPopupData(null)}>
            <div className="gk-streak-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="gk-streak-modal-header" style={{ borderBottom: `4px solid ${popupData.color}` }}>
                    <button type="button" className="gk-close-streak-modal" onClick={() => setPopupData(null)} aria-label="Close">&times;</button>
                    <div className="gk-streak-modal-title">{popupData.title}</div>
                    <div className="gk-streak-nav-pill-container">
                        {popupData.allStreaks.map((s, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`gk-streak-nav-pill ${activeStreakIdx === idx ? "active" : ""}`}
                                onClick={() => setActiveStreakIdx(idx)}
                                style={{ "--streak-color": popupData.color }}
                            >
                                #{idx + 1} ({s.length} Matches)
                            </button>
                        ))}
                    </div>
                    <div className="gk-streak-modal-range">
                        {currentStreak.matches[0].date} — {currentStreak.matches[currentStreak.matches.length - 1].date}
                    </div>
                    <div className="gk-streak-modal-meta">
                        <span>{currentStreak.length} matches</span>
                        <span>{popupData.type === "cs" ? "Clean sheets" : "Goals conceded in every match"}</span>
                    </div>
                </div>
                <div className="gk-streak-matches-wrapper">
                    <table className="gk-streak-table-modern">
                        <thead>
                            <tr>
                                <th style={{ width: "60px" }}>#</th>
                                <th>MATCH ID</th>
                                <th>DATE</th>
                                <th>SEASON</th>
                                <th>OPPONENT</th>
                                {popupData.type === "gc" && <th style={{ width: "100px" }}>GC</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentStreak.matches.map((m, i) => (
                                <tr key={`${m.idx}-${i}`}>
                                    <td className="gk-st-idx-num">{i + 1}</td>
                                    <td className="gk-st-id">{m.idx}</td>
                                    <td className="gk-st-date">{m.date}</td>
                                    <td className="gk-st-season">{m.season}</td>
                                    <td className="gk-st-opp">{m.opponent}</td>
                                    {popupData.type === "gc" && (
                                        <td className="gk-st-gc-val">{m.gc}</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="stats-grid-premium fade-in">
            <div className="stat-card-premium">
                <span className="stat-label-modern">Total Appearances</span>
                <div className="stat-value-modern" style={{ color: 'var(--gold)' }}>{stats.caps}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheets</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.cleanSheets}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheet Rate</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.caps > 0 ? ((stats.cleanSheets / stats.caps) * 100).toFixed(1) : 0}%</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Goals Conceded</span>
                <div className="stat-value-modern" style={{ color: stats.goalsConceded > 0 ? '#e74c3c' : '#27ae60' }}>{stats.goalsConceded}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Conceded Per Game</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{stats.caps > 0 ? (stats.goalsConceded / stats.caps).toFixed(2) : 0}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Faced</span>
                <div className="stat-value-modern" style={{ color: 'var(--gold)' }}>{stats.penaltiesFaced}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Received</span>
                <div className="stat-value-modern" style={{ color: '#9b59b6' }}>{stats.penaltiesReceived}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Saved</span>
                <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.penaltiesSaved}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Missed</span>
                <div className="stat-value-modern" style={{ color: '#e67e22' }}>{stats.penaltiesMissed}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalty Save Rate</span>
                <div className="stat-value-modern" style={{ color: '#3498db' }}>{getGkPenaltySavePct(stats.penaltiesSaved, stats.penaltiesReceived)}%</div>
            </div>

            <div className="stat-card-premium clickable-streak" onClick={() => openStreakPopup('cs')} style={{ cursor: 'pointer', transition: '0.3s' }}>
                <span className="stat-label-modern">Max Clean Sheet Streak</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.maxCSStreak || 0}</div>
                <div className="streak-info-hint">Click for all streaks ({stats.allStreaksCS?.length || 0})</div>
            </div>
            <div className="stat-card-premium clickable-streak" onClick={() => openStreakPopup('gc')} style={{ cursor: 'pointer', transition: '0.3s' }}>
                <span className="stat-label-modern">Max Conceded Streak</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.maxGCStreak || 0}</div>
                <div className="streak-info-hint">Click for all streaks ({stats.allStreaksGC?.length || 0})</div>
            </div>

            {streakModal}

            <style jsx global>{`
                .clickable-streak:hover {
                    transform: translateY(-5px);
                    border-color: var(--gold);
                    box-shadow: 0 10px 25px rgba(201, 168, 76, 0.1);
                }
                .streak-info-hint {
                    font-size: 10px;
                    color: #888;
                    margin-top: 5px;
                    font-family: 'Space Mono', monospace;
                    text-transform: uppercase;
                }

                .gk-streak-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(5px);
                    padding: 20px;
                }
                .gk-streak-modal-content {
                    background: #fff;
                    width: 100%;
                    max-width: 1300px;
                    max-height: 90vh;
                    border-radius: 4px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
                }
                .gk-streak-modal-header {
                    padding: 28px 30px 22px;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    background: #fafafa;
                    text-align: center;
                }
                .gk-streak-modal-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 36px;
                    letter-spacing: 2px;
                    color: #000;
                    margin-bottom: 16px;
                }
                .gk-streak-nav-pill-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 16px;
                    max-height: 110px;
                    overflow-y: auto;
                    padding: 5px;
                }
                .gk-streak-nav-pill {
                    padding: 6px 14px;
                    font-family: 'Space Mono', monospace;
                    font-size: 11px;
                    font-weight: 700;
                    border: 1px solid #ddd;
                    background: #fff;
                    color: #888;
                    cursor: pointer;
                    transition: 0.2s;
                    border-radius: 20px;
                }
                .gk-streak-nav-pill:hover {
                    border-color: var(--streak-color);
                    color: var(--streak-color);
                }
                .gk-streak-nav-pill.active {
                    background: var(--streak-color);
                    color: #fff;
                    border-color: var(--streak-color);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }
                .gk-streak-modal-range {
                    font-family: 'Space Mono', monospace;
                    font-size: 15px;
                    color: #444;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
                .gk-streak-modal-meta {
                    display: flex;
                    justify-content: center;
                    gap: 18px;
                    margin-top: 10px;
                    font-family: 'Space Mono', monospace;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #888;
                }
                .gk-close-streak-modal {
                    position: absolute;
                    top: 12px;
                    right: 18px;
                    background: none;
                    border: none;
                    font-size: 40px;
                    line-height: 1;
                    color: #aaa;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .gk-close-streak-modal:hover { color: #000; }

                .gk-streak-matches-wrapper {
                    overflow-y: auto;
                    padding: 0;
                }
                .gk-streak-table-modern {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                .gk-streak-table-modern th {
                    position: sticky;
                    top: 0;
                    background: #f4f4f4;
                    padding: 20px 15px;
                    text-align: center;
                    font-family: 'Space Mono', monospace;
                    font-size: 14px;
                    color: #444;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border-bottom: 2px solid #ddd;
                    z-index: 10;
                }
                .gk-streak-table-modern td {
                    padding: 22px 15px;
                    border-bottom: 1px solid #eee;
                    font-size: 16px;
                    color: #333;
                    text-align: center;
                }
                .gk-st-idx-num {
                    font-family: 'Space Mono', monospace;
                    color: #bbb;
                    font-size: 14px;
                    font-weight: 700;
                }
                .gk-st-id {
                    font-family: 'Space Mono', monospace;
                    font-size: 13px;
                    color: #000;
                    font-weight: 800;
                    background: #fdfdfd;
                    white-space: nowrap;
                }
                .gk-st-date {
                    font-family: 'Space Mono', monospace;
                    font-size: 14px;
                    white-space: nowrap;
                    color: #555;
                }
                .gk-st-season {
                    color: var(--gold);
                    font-weight: 800;
                    font-size: 14px;
                    white-space: nowrap;
                }
                .gk-st-opp {
                    font-weight: 800;
                    font-size: 18px;
                    white-space: nowrap;
                }
                .gk-st-gc-val {
                    color: #e74c3c;
                    font-weight: 900;
                    font-family: 'Space Mono', monospace;
                }
                .gk-streak-table-modern tbody tr:hover { background: #f8f8f8; }
                .gk-streak-table-modern tbody tr:hover .gk-st-id {
                    background: var(--gold);
                    color: #000;
                }
                .gk-streak-matches-wrapper::-webkit-scrollbar { width: 10px; }
                .gk-streak-matches-wrapper::-webkit-scrollbar-track { background: #f1f1f1; }
                .gk-streak-matches-wrapper::-webkit-scrollbar-thumb {
                    background: #bbb;
                    border-radius: 5px;
                }
            `}</style>
        </div>
    );
}
